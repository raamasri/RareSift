import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from datetime import datetime
import time
import re
import hashlib

from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_active_user, get_optional_user, rate_limit_moderate, rate_limit_generous
from app.core.security import file_validator, sanitize_path, secure_delete_file, secure_delete_directory_contents
from app.core.validation import input_sanitizer, ValidatedVideoMetadata
from app.models.video import Video
from app.models.user import User
from app.services.video_processor import VideoProcessor
from app.services.embedding_service import EmbeddingService
from app.tasks import process_video_task

router = APIRouter()

# Pydantic models for request/response
class VideoResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    duration: float
    fps: float
    width: int
    height: int
    video_metadata: dict
    weather: Optional[str]
    time_of_day: Optional[str]
    location: Optional[str]
    speed_avg: Optional[float]
    is_processed: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class VideoListResponse(BaseModel):
    videos: List[VideoResponse]
    total: int

# Initialize services
video_processor = VideoProcessor()
embedding_service = EmbeddingService()

async def process_video_background(video_id: int):
    """Background task to process video"""
    try:
        # Create a new database session for background task
        from app.core.database import SessionLocal
        db = SessionLocal()
        
        print(f"DEBUG: Starting background processing for video {video_id}")
        
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            print(f"DEBUG: Video {video_id} not found")
            db.close()
            return
        
        print(f"DEBUG: Found video {video_id}, starting frame extraction")
        # Process video (extract frames)
        await video_processor.process_video(db, video)
        
        print(f"DEBUG: Frame extraction complete, starting embedding generation")
        # Generate embeddings
        await embedding_service.generate_frame_embeddings(db, video_id)
        
        print(f"DEBUG: Background processing completed for video {video_id}")
        db.close()
        
    except Exception as e:
        print(f"DEBUG: Background processing failed for video {video_id}: {str(e)}")
        import traceback
        print(f"DEBUG: Traceback: {traceback.format_exc()}")
        if 'db' in locals():
            db.close()

@router.post("/upload", response_model=VideoResponse)
async def upload_video(
    file: UploadFile = File(...),
    weather: Optional[str] = Form(None),
    time_of_day: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    speed_avg: Optional[float] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_moderate)
):
    """
    Upload a video file with metadata
    """
    # Read file content for validation
    content = await file.read()
    file_size = len(content)
    
    # Comprehensive file validation
    file_info = file_validator.validate_upload_file(file, current_user.id, 'video')
    file_validator.validate_file_size(file_size, 'video')
    file_type_info = file_validator.validate_file_type(content, 'video')
    
    # Validate and sanitize metadata
    validated_metadata = ValidatedVideoMetadata(
        weather=weather,
        time_of_day=time_of_day,
        location=location,
        speed_avg=speed_avg
    )
    
    try:
        # Generate secure filename
        print(f"DEBUG: Starting upload process for {file_info['original_filename']}")
        secure_filename = file_info['secure_filename']
        file_path = sanitize_path(secure_filename, settings.upload_dir)
        print(f"DEBUG: Generated secure file path: {file_path}")
        
        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        print(f"DEBUG: File saved successfully")
        
        # Extract basic video metadata
        print(f"DEBUG: Extracting video metadata...")
        metadata = video_processor.extract_video_metadata(file_path)
        print(f"DEBUG: Metadata extracted: {metadata}")
        
        # Create video record
        print(f"DEBUG: Creating video record...")
        video = Video(
            filename=secure_filename,
            original_filename=file_info['original_filename'],
            file_path=file_path,
            file_size=file_size,
            duration=metadata["duration"],
            fps=metadata["fps"],
            width=metadata["width"],
            height=metadata["height"],
            weather=validated_metadata.weather,
            time_of_day=validated_metadata.time_of_day,
            location=validated_metadata.location,
            speed_avg=validated_metadata.speed_avg,
            video_metadata={
                **metadata,
                "file_hash": hashlib.sha256(content).hexdigest(),
                "mime_type": file_type_info['mime_type'],
                "upload_timestamp": datetime.utcnow().isoformat()
            },
            user_id=current_user.id  # Associate with current user
        )
        print(f"DEBUG: Video object created")
        
        db.add(video)
        print(f"DEBUG: Video added to session")
        db.commit()
        print(f"DEBUG: Video committed to database")
        db.refresh(video)
        print(f"DEBUG: Video refreshed, ID: {video.id}")
        
        # Start background processing with Celery
        print(f"DEBUG: Starting Celery task...")
        process_video_task.delay(video.id)
        print(f"DEBUG: Celery task started")
        
        # Update user stats
        current_user.video_upload_count += 1
        db.commit()
        
        print(f"DEBUG: Creating VideoResponse...")
        response = VideoResponse.model_validate(video)
        print(f"DEBUG: VideoResponse created successfully")
        return response
        
    except Exception as e:
        # Clean up file if database operation failed
        if 'file_path' in locals():
            secure_delete_file(file_path, settings.upload_dir)
        raise HTTPException(status_code=500, detail=f"Failed to upload video: {str(e)}")

@router.get("/", response_model=VideoListResponse)
async def list_videos(
    skip: int = 0,
    limit: int = 10,
    processed_only: bool = False,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_generous)
):
    """
    List all videos with pagination (optionally filtered by current user)
    """
    query = db.query(Video)
    if current_user:
        query = query.filter(Video.user_id == current_user.id)
    
    if processed_only:
        query = query.filter(Video.is_processed == True)
    
    total = query.count()
    videos = query.offset(skip).limit(limit).all()
    
    return VideoListResponse(
        videos=[VideoResponse.model_validate(video) for video in videos],
        total=total
    )

@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(
    video_id: int,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_generous)
):
    """
    Get a specific video by ID (optionally filtered by current user)
    """
    query = db.query(Video).filter(Video.id == video_id)
    if current_user:
        query = query.filter(Video.user_id == current_user.id)
    
    video = query.first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    return VideoResponse.model_validate(video)

@router.delete("/{video_id}")
async def delete_video(
    video_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_moderate)
):
    """
    Delete a video and its associated data (filtered by current user)
    """
    video = db.query(Video).filter(
        Video.id == video_id,
        Video.user_id == current_user.id
    ).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    try:
        # Securely delete file from disk
        secure_delete_file(video.file_path, settings.upload_dir)
        
        # Securely delete frame files
        frames_dir = os.path.join(settings.upload_dir, "frames")
        pattern = f"video_{video_id}_.*"
        deleted_frames = secure_delete_directory_contents(frames_dir, pattern, settings.upload_dir)
        print(f"DEBUG: Deleted {deleted_frames} frame files for video {video_id}")
        
        # Delete from database (cascades to frames and embeddings)
        db.delete(video)
        db.commit()
        
        return {"message": "Video deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete video: {str(e)}")

@router.get("/{video_id}/processing-status")
async def get_processing_status(
    video_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_generous)
):
    """
    Get processing status of a video
    """
    video = db.query(Video).filter(
        Video.id == video_id,
        Video.user_id == current_user.id  # CRITICAL: Only allow access to user's own videos
    ).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Count frames and embeddings
    from app.models.video import Frame, Embedding
    frames_count = db.query(Frame).filter(Frame.video_id == video_id).count()
    embeddings_count = db.query(Embedding).join(Frame).filter(Frame.video_id == video_id).count()
    
    return {
        "video_id": video_id,
        "is_processed": video.is_processed,
        "processing_started_at": video.processing_started_at,
        "processing_completed_at": video.processing_completed_at,
        "processing_error": video.processing_error,
        "frames_extracted": frames_count,
        "embeddings_created": embeddings_count,
        "progress": {
            "frames_done": frames_count > 0,
            "embeddings_done": embeddings_count == frames_count if frames_count > 0 else False
        }
    }

def get_video_path_by_id(video_id: int) -> str:
    """Map video ID to actual video file path from video_assets directory"""
    # This maps video IDs to actual files in the video_assets directory
    video_assets_dir = "/app/video_assets"
    
    # Video ID mapping based on the actual files we have
    if 1 <= video_id <= 9:
        # Driving camera footage
        video_filename = f"GH0{10000 + video_id}.MP4"
        return os.path.join(video_assets_dir, "driving_camera_footage", video_filename)
    elif 10 <= video_id <= 22:
        # Static camera footage - map to actual available files
        static_files = [31, 32, 33, 34, 35, 36, 37, 38, 39, 41, 42, 43, 45]
        static_index = video_id - 10  # video_id 10 -> index 0, 11 -> index 1, etc.
        if static_index < len(static_files):
            file_num = static_files[static_index]
            video_filename = f"GH0100{file_num:02d}.MP4"
            return os.path.join(video_assets_dir, "static_camera_footage", video_filename)
        else:
            raise HTTPException(status_code=404, detail="Video not found")
    else:
        raise HTTPException(status_code=404, detail="Video not found")

def range_requests_response(
    request: Request, 
    file_path: str, 
    content_type: str = "video/mp4"
):
    """Generate streaming response with range request support for video files"""
    file_size = os.path.getsize(file_path)
    
    # Parse Range header
    range_header = request.headers.get("Range")
    if range_header:
        # Parse range like "bytes=0-1023" or "bytes=1024-"
        range_match = re.match(r"bytes=(\d+)-(\d*)", range_header)
        if range_match:
            start = int(range_match.group(1))
            end = int(range_match.group(2)) if range_match.group(2) else file_size - 1
            
            # Ensure valid range
            if start >= file_size:
                raise HTTPException(status_code=416, detail="Range not satisfiable")
            
            if end >= file_size:
                end = file_size - 1
            
            content_length = end - start + 1
            
            def iterfile():
                with open(file_path, "rb") as f:
                    f.seek(start)
                    remaining = content_length
                    while remaining:
                        chunk_size = min(8192, remaining)
                        chunk = f.read(chunk_size)
                        if not chunk:
                            break
                        remaining -= len(chunk)
                        yield chunk
            
            return StreamingResponse(
                iterfile(),
                status_code=206,
                headers={
                    "Content-Range": f"bytes {start}-{end}/{file_size}",
                    "Accept-Ranges": "bytes",
                    "Content-Length": str(content_length),
                    "Content-Type": content_type,
                },
            )
    
    # If no range requested, stream entire file
    def iterfile():
        with open(file_path, "rb") as f:
            while chunk := f.read(8192):
                yield chunk
    
    return StreamingResponse(
        iterfile(),
        headers={
            "Content-Length": str(file_size),
            "Accept-Ranges": "bytes", 
            "Content-Type": content_type,
        },
    )

@router.get("/{video_id}/stream")
async def stream_video(
    video_id: int,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Stream video file with range request support for seeking (filtered by current user)
    """
    try:
        # Get video from database with user filtering
        video = db.query(Video).filter(
            Video.id == video_id,
            Video.user_id == current_user.id
        ).first()
        
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        if not os.path.exists(video.file_path):
            raise HTTPException(status_code=404, detail="Video file not found")
        
        return range_requests_response(request, video.file_path)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stream video: {str(e)}") 