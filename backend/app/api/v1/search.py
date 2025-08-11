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
from app.core.security import file_validator, secure_delete_file
from app.core.validation import input_sanitizer, ValidatedSearchRequest
from app.services.openai_embedding_service import OpenAIEmbeddingService as EmbeddingService
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

class TextSearchRequest(ValidatedSearchRequest):
    filters: Optional[SearchFilters] = None

# Initialize embedding service
embedding_service = EmbeddingService()

@router.post("/text", response_model=SearchResponse)
async def search_by_text(
    request: TextSearchRequest,
    current_user: User = Depends(get_optional_user),
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
        
        # Perform search (use None for user_id if not authenticated)
        search_results = await embedding_service.search_by_text(
            db=db,
            query_text=request.query,
            user_id=current_user.id if current_user else None,
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
        
    except ValueError as e:
        # Handle validation errors
        raise HTTPException(status_code=400, detail=f"Invalid search parameters: {str(e)}")
    except TimeoutError as e:
        # Handle timeout errors
        raise HTTPException(status_code=408, detail="Search request timed out. The AI service may be busy. Please try again.")
    except ConnectionError as e:
        # Handle connection errors
        raise HTTPException(status_code=503, detail="Unable to connect to AI service. Please try again later.")
    except Exception as e:
        # Log the full error for debugging
        import traceback
        print(f"Search error: {traceback.format_exc()}")
        
        # Return user-friendly error message
        if "rate limit" in str(e).lower():
            raise HTTPException(status_code=429, detail="AI service rate limit exceeded. Please wait a moment and try again.")
        elif "api key" in str(e).lower() or "authentication" in str(e).lower():
            raise HTTPException(status_code=503, detail="AI service configuration error. Please contact support.")
        elif "network" in str(e).lower() or "connection" in str(e).lower():
            raise HTTPException(status_code=503, detail="Network connectivity issue. Please try again.")
        else:
            raise HTTPException(status_code=500, detail="An unexpected error occurred during search. Please try again or contact support if the problem persists.")

@router.post("/image", response_model=SearchResponse)
async def search_by_image(
    file: UploadFile = File(...),
    limit: int = Form(10),
    similarity_threshold: float = Form(0.5),
    time_of_day: Optional[str] = Form(None),
    weather: Optional[str] = Form(None),
    speed_min: Optional[float] = Form(None),
    speed_max: Optional[float] = Form(None),
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_moderate)
):
    """
    Search for similar video frames using an example image
    """
    try:
        # Read and validate image file
        content = await file.read()
        file_info = file_validator.validate_upload_file(file, current_user.id, 'image')
        file_validator.validate_file_size(len(content), 'image')
        file_type_info = file_validator.validate_file_type(content, 'image')
        
        # Save uploaded image temporarily with secure filename
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_info['file_extension']) as temp_file:
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
            user_id=current_user.id,
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
        
        # Log the full error for debugging
        import traceback
        print(f"Image search error: {traceback.format_exc()}")
        
        # Return user-friendly error message
        if "rate limit" in str(e).lower():
            raise HTTPException(status_code=429, detail="AI service rate limit exceeded. Please wait a moment and try again.")
        elif "unsupported image" in str(e).lower() or "invalid image" in str(e).lower():
            raise HTTPException(status_code=400, detail="Unsupported image format. Please use JPEG, PNG, or WebP images.")
        elif "file too large" in str(e).lower():
            raise HTTPException(status_code=413, detail="Image file is too large. Please use an image smaller than 10MB.")
        else:
            raise HTTPException(status_code=500, detail="Image search failed. Please try again with a different image or contact support.")

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

@router.get("/rate-limit-status")
async def get_rate_limit_status(
    current_user: User = Depends(get_current_active_user),
    _: None = Depends(rate_limit_generous)
):
    """
    Get current OpenAI API rate limiting status for monitoring
    """
    try:
        embedding_service = EmbeddingService()
        
        if not embedding_service.is_initialized:
            await embedding_service.initialize()
        
        status = embedding_service.get_rate_limit_status()
        
        # Add helpful status indicators
        status['status_indicators'] = {}
        
        # RPM Status
        rpm_percentage = status['requests_per_minute']['percentage']
        if rpm_percentage >= 90:
            status['status_indicators']['rpm'] = 'critical'
        elif rpm_percentage >= 70:
            status['status_indicators']['rpm'] = 'warning'
        else:
            status['status_indicators']['rpm'] = 'healthy'
        
        # TPM Status
        tpm_percentage = status['tokens_per_minute']['percentage']
        if tpm_percentage >= 90:
            status['status_indicators']['tpm'] = 'critical'
        elif tpm_percentage >= 70:
            status['status_indicators']['tpm'] = 'warning'
        else:
            status['status_indicators']['tpm'] = 'healthy'
        
        # Cost Status
        cost_percentage = status['daily_cost']['percentage']
        if cost_percentage >= 90:
            status['status_indicators']['cost'] = 'critical'
        elif cost_percentage >= 70:
            status['status_indicators']['cost'] = 'warning'
        else:
            status['status_indicators']['cost'] = 'healthy'
        
        # Overall Status
        all_indicators = list(status['status_indicators'].values())
        if 'critical' in all_indicators:
            status['overall_status'] = 'critical'
        elif 'warning' in all_indicators:
            status['overall_status'] = 'warning'
        else:
            status['overall_status'] = 'healthy'
        
        return status
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get rate limit status: {str(e)}")

@router.post("/check-batch-limits")
async def check_batch_limits(
    estimated_requests: int = Query(..., ge=1, le=1000, description="Number of requests in batch"),
    estimated_tokens_per_request: int = Query(150, ge=10, le=1000, description="Estimated tokens per request"),
    current_user: User = Depends(get_current_active_user),
    _: None = Depends(rate_limit_generous)
):
    """
    Check if a batch operation would exceed rate limits
    Useful for planning large uploads or processing jobs
    """
    try:
        embedding_service = EmbeddingService()
        
        if not embedding_service.is_initialized:
            await embedding_service.initialize()
        
        check_result = await embedding_service.check_rate_limits_before_batch(
            estimated_requests=estimated_requests,
            estimated_tokens_per_request=estimated_tokens_per_request
        )
        
        return check_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check batch limits: {str(e)}")

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
    Stream video segment for playback (filtered by current user)
    """
    try:
        video = db.query(Video).filter(
            Video.id == video_id,
            Video.user_id == current_user.id
        ).first()
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
    Get video information for player (filtered by current user)
    """
    try:
        video = db.query(Video).filter(
            Video.id == video_id,
            Video.user_id == current_user.id
        ).first()
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