import os
import tempfile
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query, Depends
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import cv2
import numpy as np
import io
from pathlib import Path

from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import rate_limit_generous, rate_limit_moderate
from app.core.security import file_validator, secure_delete_file
from app.core.validation import input_sanitizer, ValidatedSearchRequest
from app.services.openai_embedding_service import OpenAIEmbeddingService as EmbeddingService
from app.models.video import Video, Frame

router = APIRouter()

# Pydantic models - reuse from search.py
class SearchFilters(BaseModel):
    time_of_day: Optional[str] = None
    weather: Optional[str] = None
    speed_min: Optional[float] = None
    speed_max: Optional[float] = None

class SearchResult(BaseModel):
    frame_id: int
    video_id: int
    timestamp: float
    similarity: float
    frame_path: str
    frame_url: Optional[str] = None
    metadata: Dict[str, Any]
    video_filename: Optional[str] = None
    video_duration: Optional[float] = None
    
    model_config = {"from_attributes": True}

class SearchResponse(BaseModel):
    search_id: int
    results: List[SearchResult]
    total_found: int
    search_time_ms: int
    query_text: Optional[str] = None
    filters: Dict[str, Any]

class DemoTextSearchRequest(ValidatedSearchRequest):
    filters: Optional[SearchFilters] = None

# Initialize embedding service
embedding_service = EmbeddingService()

@router.post("/search/text", response_model=SearchResponse)
async def demo_search_by_text(
    request: DemoTextSearchRequest,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_moderate)
):
    """
    Demo text search - no authentication required
    Search for video frames using natural language text query
    """
    try:
        # Convert filters to dict
        filters_dict = {}
        if request.filters:
            filters_dict = request.filters.model_dump(exclude_none=True)
        
        # Perform search without user authentication (user_id=None)
        search_results = await embedding_service.search_by_text(
            db=db,
            query_text=request.query,
            user_id=None,  # Demo mode - no user required
            limit=min(request.limit, 20),  # Limit demo searches to 20 results
            similarity_threshold=request.similarity_threshold,
            filters=filters_dict
        )
        
        # Convert frame paths to URLs (same logic as authenticated search)
        def map_frame_path_to_actual_file(frame_path: str) -> str:
            """Map database frame path to actual file name"""
            basename = os.path.basename(frame_path)
            
            # Check if file exists as-is first
            if os.path.exists(f"/app/frames/{basename}"):
                return basename
            
            # Try mapping old naming convention to new
            if 'driving_camera_gh010001' in basename:
                frame_num = basename.split('_')[-1].replace('.jpg', '')
                actual_frame_num = str(int(frame_num) - 1).zfill(3)
                mapped_name = f"drive_01_frame_{actual_frame_num}.jpg"
                if os.path.exists(f"/app/frames/{mapped_name}"):
                    return mapped_name
            elif 'driving_camera_gh010002' in basename:
                frame_num = basename.split('_')[-1].replace('.jpg', '')
                actual_frame_num = str(int(frame_num) - 1).zfill(3)
                mapped_name = f"drive_02_frame_{actual_frame_num}.jpg"
                if os.path.exists(f"/app/frames/{mapped_name}"):
                    return mapped_name
            elif 'driving_camera_gh010003' in basename:
                frame_num = basename.split('_')[-1].replace('.jpg', '')
                actual_frame_num = str(int(frame_num) - 1).zfill(3)
                mapped_name = f"drive_03_frame_{actual_frame_num}.jpg"
                if os.path.exists(f"/app/frames/{mapped_name}"):
                    return mapped_name
            
            return basename
        
        for result in search_results["results"]:
            if result["frame_path"]:
                actual_filename = map_frame_path_to_actual_file(result["frame_path"])
                result["frame_url"] = f"/frames/{actual_filename}"
        
        return SearchResponse(
            search_id=search_results["search_id"],
            results=[SearchResult(**result) for result in search_results["results"]],
            total_found=search_results["total_found"],
            search_time_ms=search_results["search_time_ms"],
            query_text=request.query,
            filters=filters_dict
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid search parameters: {str(e)}")
    except TimeoutError as e:
        raise HTTPException(status_code=408, detail="Search request timed out. The AI service may be busy. Please try again.")
    except ConnectionError as e:
        raise HTTPException(status_code=503, detail="Unable to connect to AI service. Please try again later.")
    except Exception as e:
        import traceback
        print(f"Demo search error: {traceback.format_exc()}")
        
        if "rate limit" in str(e).lower():
            raise HTTPException(status_code=429, detail="AI service rate limit exceeded. Please wait a moment and try again.")
        elif "api key" in str(e).lower() or "authentication" in str(e).lower():
            raise HTTPException(status_code=503, detail="AI service configuration error. Please contact support.")
        elif "network" in str(e).lower() or "connection" in str(e).lower():
            raise HTTPException(status_code=503, detail="Network connectivity issue. Please try again.")
        else:
            raise HTTPException(status_code=500, detail="An unexpected error occurred during search. Please try again or contact support if the problem persists.")

@router.post("/search/image", response_model=SearchResponse)
async def demo_search_by_image(
    file: UploadFile = File(...),
    limit: int = Form(10),
    similarity_threshold: float = Form(0.5),
    time_of_day: Optional[str] = Form(None),
    weather: Optional[str] = Form(None),
    speed_min: Optional[float] = Form(None),
    speed_max: Optional[float] = Form(None),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_moderate)
):
    """
    Demo image search - no authentication required
    Search for similar video frames using an example image
    """
    try:
        # Read and validate image file (relaxed validation for demo)
        content = await file.read()
        
        # Basic file validation without user-specific limits
        if len(content) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=413, detail="Image file is too large. Please use an image smaller than 10MB.")
        
        # Check file type
        allowed_types = [b'\xff\xd8\xff', b'\x89\x50\x4e\x47', b'RIFF']  # JPEG, PNG, WebP
        if not any(content.startswith(magic) for magic in allowed_types):
            raise HTTPException(status_code=400, detail="Unsupported image format. Please use JPEG, PNG, or WebP images.")
        
        # Save uploaded image temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            temp_file.write(content)
            temp_image_path = temp_file.name
        
        # Prepare filters
        filters_dict = {}
        if time_of_day:
            filters_dict["time_of_day"] = time_of_day
        if weather:
            filters_dict["weather"] = weather
        if speed_min is not None:
            filters_dict["speed_min"] = speed_min
        if speed_max is not None:
            filters_dict["speed_max"] = speed_max
        
        # Perform search without user authentication
        search_results = await embedding_service.search_by_image(
            db=db,
            image_path=temp_image_path,
            user_id=None,  # Demo mode - no user required
            limit=min(limit, 20),  # Limit demo searches to 20 results
            similarity_threshold=similarity_threshold,
            filters=filters_dict
        )
        
        # Convert frame paths to URLs
        def map_frame_path_to_actual_file(frame_path: str) -> str:
            """Map database frame path to actual file name"""
            basename = os.path.basename(frame_path)
            
            if os.path.exists(f"/app/frames/{basename}"):
                return basename
            
            # Try mapping logic (same as text search)
            if 'driving_camera_gh010001' in basename:
                frame_num = basename.split('_')[-1].replace('.jpg', '')
                actual_frame_num = str(int(frame_num) - 1).zfill(3)
                mapped_name = f"drive_01_frame_{actual_frame_num}.jpg"
                if os.path.exists(f"/app/frames/{mapped_name}"):
                    return mapped_name
            elif 'driving_camera_gh010002' in basename:
                frame_num = basename.split('_')[-1].replace('.jpg', '')
                actual_frame_num = str(int(frame_num) - 1).zfill(3)
                mapped_name = f"drive_02_frame_{actual_frame_num}.jpg"
                if os.path.exists(f"/app/frames/{mapped_name}"):
                    return mapped_name
            elif 'driving_camera_gh010003' in basename:
                frame_num = basename.split('_')[-1].replace('.jpg', '')
                actual_frame_num = str(int(frame_num) - 1).zfill(3)
                mapped_name = f"drive_03_frame_{actual_frame_num}.jpg"
                if os.path.exists(f"/app/frames/{mapped_name}"):
                    return mapped_name
            
            return basename
        
        for result in search_results["results"]:
            if result["frame_path"]:
                actual_filename = map_frame_path_to_actual_file(result["frame_path"])
                result["frame_url"] = f"/frames/{actual_filename}"
        
        # Clean up temporary file
        secure_delete_file(temp_image_path, tempfile.gettempdir())
        
        return SearchResponse(
            search_id=search_results["search_id"],
            results=[SearchResult(**result) for result in search_results["results"]],
            total_found=search_results["total_found"],
            search_time_ms=search_results["search_time_ms"],
            query_text=f"Image search: {file.filename}",
            filters=filters_dict
        )
        
    except Exception as e:
        # Clean up temporary file on error
        if 'temp_image_path' in locals():
            secure_delete_file(temp_image_path, tempfile.gettempdir())
        
        import traceback
        print(f"Demo image search error: {traceback.format_exc()}")
        
        if "rate limit" in str(e).lower():
            raise HTTPException(status_code=429, detail="AI service rate limit exceeded. Please wait a moment and try again.")
        elif "unsupported image" in str(e).lower() or "invalid image" in str(e).lower():
            raise HTTPException(status_code=400, detail="Unsupported image format. Please use JPEG, PNG, or WebP images.")
        elif "file too large" in str(e).lower():
            raise HTTPException(status_code=413, detail="Image file is too large. Please use an image smaller than 10MB.")
        else:
            raise HTTPException(status_code=500, detail="Image search failed. Please try again with a different image or contact support.")

@router.get("/search/suggestions/filters")
async def demo_get_filter_suggestions(
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_generous)
):
    """
    Get available filter options from existing data (demo version)
    """
    from sqlalchemy import distinct, func
    
    try:
        # Get unique values for filter fields from demo data
        time_of_day_options = [
            row[0] for row in db.query(distinct(Video.time_of_day)).filter(Video.time_of_day.isnot(None)).all()
        ]
        
        weather_options = [
            row[0] for row in db.query(distinct(Video.weather)).filter(Video.weather.isnot(None)).all()
        ]
        
        # Get speed range
        speed_stats = db.query(
            func.min(Video.speed_avg),
            func.max(Video.speed_avg)
        ).filter(Video.speed_avg.isnot(None)).first()
        
        return {
            "time_of_day": time_of_day_options,
            "weather": weather_options,
            "speed_range": {
                "min": speed_stats[0] if speed_stats[0] else 0,
                "max": speed_stats[1] if speed_stats[1] else 100
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get filter suggestions: {str(e)}")

@router.get("/search/frame/{frame_id}/thumbnail")
async def demo_get_frame_thumbnail(
    frame_id: int,
    size: int = Query(300, description="Thumbnail size in pixels"),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_generous)
):
    """
    Get thumbnail image for a specific frame (demo version)
    """
    try:
        frame = db.query(Frame).filter(Frame.id == frame_id).first()
        if not frame:
            raise HTTPException(status_code=404, detail="Frame not found")
            
        # Map frame path to actual file
        def map_frame_path_to_actual_file(frame_path: str) -> str:
            basename = os.path.basename(frame_path)
            
            if os.path.exists(f"/app/frames/{basename}"):
                return f"/app/frames/{basename}"
            
            # Try mapping logic
            if 'driving_camera_gh010001' in basename:
                frame_num = basename.split('_')[-1].replace('.jpg', '')
                actual_frame_num = str(int(frame_num) - 1).zfill(3)
                mapped_path = f"/app/frames/drive_01_frame_{actual_frame_num}.jpg"
                if os.path.exists(mapped_path):
                    return mapped_path
            elif 'driving_camera_gh010002' in basename:
                frame_num = basename.split('_')[-1].replace('.jpg', '')
                actual_frame_num = str(int(frame_num) - 1).zfill(3)
                mapped_path = f"/app/frames/drive_02_frame_{actual_frame_num}.jpg"
                if os.path.exists(mapped_path):
                    return mapped_path
            elif 'driving_camera_gh010003' in basename:
                frame_num = basename.split('_')[-1].replace('.jpg', '')
                actual_frame_num = str(int(frame_num) - 1).zfill(3)
                mapped_path = f"/app/frames/drive_03_frame_{actual_frame_num}.jpg"
                if os.path.exists(mapped_path):
                    return mapped_path
            
            return f"/app/frames/{basename}"
        
        actual_path = map_frame_path_to_actual_file(frame.frame_path)
        
        if not os.path.exists(actual_path):
            raise HTTPException(status_code=404, detail="Frame image not found")
        
        # Read and resize image
        img = cv2.imread(actual_path)
        if img is None:
            raise HTTPException(status_code=500, detail="Could not read frame image")
            
        # Resize to thumbnail
        height, width = img.shape[:2]
        aspect_ratio = width / height
        
        if aspect_ratio > 1:  # Landscape
            new_width = size
            new_height = int(size / aspect_ratio)
        else:  # Portrait
            new_height = size
            new_width = int(size * aspect_ratio)
            
        thumbnail = cv2.resize(img, (new_width, new_height))
        
        # Encode as JPEG
        _, buffer = cv2.imencode('.jpg', thumbnail, [cv2.IMWRITE_JPEG_QUALITY, 85])
        
        return StreamingResponse(
            io.BytesIO(buffer.tobytes()),
            media_type="image/jpeg",
            headers={"Cache-Control": "public, max-age=3600"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get frame thumbnail: {str(e)}")

@router.get("/stats/summary")
async def demo_get_system_summary(
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_generous)
):
    """
    Get demo dataset summary for display
    """
    try:
        from sqlalchemy import func
        
        # Get dataset statistics
        video_count = db.query(func.count(Video.id)).scalar()
        frame_count = db.query(func.count(Frame.id)).scalar()
        
        # Get embedding coverage
        embedded_frames = db.query(func.count(Frame.id)).filter(Frame.embedding.isnot(None)).scalar()
        
        return {
            "videos_indexed": video_count,
            "frames_processed": frame_count,
            "embedding_coverage": f"{(embedded_frames/frame_count*100):.1f}%" if frame_count > 0 else "0%",
            "vector_dimensions": 1536,  # OpenAI CLIP embedding size
            "demo_mode": True
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get system summary: {str(e)}")