import os
import tempfile
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import cv2
import numpy as np
import io
from pathlib import Path

from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_active_user, get_optional_user, rate_limit_moderate, rate_limit_generous
from app.services.embedding_service import EmbeddingService
from app.models.video import Video, Frame
from app.models.user import User

router = APIRouter()

# Pydantic models
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

class TextSearchRequest(BaseModel):
    query: str
    limit: int = 10
    similarity_threshold: float = 0.5
    filters: Optional[SearchFilters] = None

# Initialize embedding service
embedding_service = EmbeddingService()

@router.post("/text", response_model=SearchResponse)
async def search_by_text(
    request: TextSearchRequest,
    db: Session = Depends(get_db)
):
    """
    Search for video frames using natural language text query
    """
    try:
        # Convert filters to dict
        filters_dict = {}
        if request.filters:
            filters_dict = request.filters.model_dump(exclude_none=True)
        
        # Perform search
        search_results = await embedding_service.search_by_text(
            db=db,
            query_text=request.query,
            limit=request.limit,
            similarity_threshold=request.similarity_threshold,
            filters=filters_dict
        )
        
        # Skip user statistics for demo mode
        
        # Convert frame paths to URLs
        def map_frame_path_to_actual_file(frame_path: str) -> str:
            """Map database frame path to actual file name"""
            basename = os.path.basename(frame_path)
            
            # Check if file exists as-is first
            if os.path.exists(f"/app/frames/{basename}"):
                return basename
            
            # Try mapping old naming convention to new
            # driving_camera_gh010001_frame_001.jpg -> drive_01_frame_000.jpg  
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
            
            # Return original if no mapping works
            return basename
        
        for result in search_results["results"]:
            if result["frame_path"]:
                # Map to actual file name
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
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.post("/image", response_model=SearchResponse)
async def search_by_image(
    file: UploadFile = File(...),
    limit: int = Form(10),
    similarity_threshold: float = Form(0.5),
    time_of_day: Optional[str] = Form(None),
    weather: Optional[str] = Form(None),
    speed_min: Optional[float] = Form(None),
    speed_max: Optional[float] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_moderate)
):
    """
    Search for similar video frames using an example image
    """
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Save uploaded image temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
            content = await file.read()
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
        
        # Perform search
        search_results = await embedding_service.search_by_image(
            db=db,
            image_path=temp_image_path,
            limit=limit,
            similarity_threshold=similarity_threshold,
            filters=filters_dict
        )
        
        # Skip user statistics for demo mode
        
        # Convert frame paths to URLs
        for result in search_results["results"]:
            if result["frame_path"]:
                relative_path = os.path.relpath(result["frame_path"], settings.upload_dir)
                result["frame_url"] = f"/static/{relative_path}"
        
        # Clean up temporary file
        os.unlink(temp_image_path)
        
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
        if 'temp_image_path' in locals() and os.path.exists(temp_image_path):
            os.unlink(temp_image_path)
        raise HTTPException(status_code=500, detail=f"Image search failed: {str(e)}")

@router.get("/history")
async def get_search_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_generous)
):
    """
    Get search history with pagination
    """
    from app.models.video import Search
    
    # Filter searches by current user
    total = db.query(Search).filter(Search.user_id == current_user.id).count()
    searches = db.query(Search).filter(Search.user_id == current_user.id).order_by(Search.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "searches": [
            {
                "id": search.id,
                "query_text": search.query_text,
                "query_type": search.query_type,
                "results_count": search.results_count,
                "response_time_ms": search.response_time_ms,
                "filters": search.filters,
                "created_at": search.created_at
            }
            for search in searches
        ],
        "total": total
    }

@router.get("/{search_id}")
async def get_search_details(
    search_id: int, 
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_generous)
):
    """
    Get details of a specific search
    """
    from app.models.video import Search
    
    search = db.query(Search).filter(
        Search.id == search_id,
        Search.user_id == current_user.id
    ).first()
    if not search:
        raise HTTPException(status_code=404, detail="Search not found")
    
    return {
        "id": search.id,
        "query_text": search.query_text,
        "query_type": search.query_type,
        "query_embedding": search.query_embedding,
        "limit_results": search.limit_results,
        "similarity_threshold": search.similarity_threshold,
        "filters": search.filters,
        "results_count": search.results_count,
        "response_time_ms": search.response_time_ms,
        "created_at": search.created_at
    }

@router.get("/suggestions/filters")
async def get_filter_suggestions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_generous)
):
    """
    Get available filter options from existing data
    """
    from app.models.video import Video
    from sqlalchemy import distinct
    
    try:
        # Get unique values for filter fields
        time_of_day_options = [
            row[0] for row in db.query(distinct(Video.time_of_day)).filter(Video.time_of_day.isnot(None)).all()
        ]
        
        weather_options = [
            row[0] for row in db.query(distinct(Video.weather)).filter(Video.weather.isnot(None)).all()
        ]
        
        # Get speed range
        from sqlalchemy import func
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


@router.get("/frame/{frame_id}/thumbnail")
async def get_frame_thumbnail(
    frame_id: int,
    size: int = Query(300, description="Thumbnail size in pixels"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_generous)
):
    """
    Get thumbnail image for a specific frame
    """
    try:
        frame = db.query(Frame).filter(Frame.id == frame_id).first()
        if not frame:
            raise HTTPException(status_code=404, detail="Frame not found")
            
        if not frame.frame_path or not os.path.exists(frame.frame_path):
            raise HTTPException(status_code=404, detail="Frame image not found")
        
        # Read and resize image
        img = cv2.imread(frame.frame_path)
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


@router.get("/video/{video_id}/stream")
async def stream_video(
    video_id: int,
    start: float = Query(0, description="Start time in seconds"),
    duration: float = Query(10, description="Duration in seconds"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_generous)
):
    """
    Stream video segment for playback
    """
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
            
        if not video.file_path or not os.path.exists(video.file_path):
            raise HTTPException(status_code=404, detail="Video file not found")
        
        # For now, return the full video file
        # In production, you'd want to implement proper video streaming/segmentation
        return FileResponse(
            video.file_path,
            media_type="video/mp4",
            headers={
                "Cache-Control": "public, max-age=3600",
                "Accept-Ranges": "bytes"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stream video: {str(e)}")


@router.get("/video/{video_id}/info")
async def get_video_info(
    video_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_generous)
):
    """
    Get video information for player
    """
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
            
        return {
            "id": video.id,
            "filename": video.original_filename,
            "duration": video.duration,
            "fps": video.fps,
            "width": video.width,
            "height": video.height,
            "file_size": video.file_size
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get video info: {str(e)}") 