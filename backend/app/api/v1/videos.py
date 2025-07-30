import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from datetime import datetime
import time

from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_active_user, get_optional_user, rate_limit_moderate, rate_limit_generous
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
    # Validate file type
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    # Check file size
    file_size = 0
    content = await file.read()
    file_size = len(content)
    
    if file_size > settings.max_file_size:
        raise HTTPException(status_code=400, detail="File too large")
    
    try:
        # Generate unique filename
        print(f"DEBUG: Starting upload process for {file.filename}")
        file_extension = os.path.splitext(file.filename)[1]
        filename = f"{int(time.time())}_{file.filename}"
        file_path = os.path.join(settings.upload_dir, filename)
        print(f"DEBUG: Generated file path: {file_path}")
        
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
            filename=filename,
            original_filename=file.filename,
            file_path=file_path,
            file_size=file_size,
            duration=metadata["duration"],
            fps=metadata["fps"],
            width=metadata["width"],
            height=metadata["height"],
            weather=weather,
            time_of_day=time_of_day,
            location=location,
            speed_avg=speed_avg,
            video_metadata=metadata
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
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to upload video: {str(e)}")

@router.get("/", response_model=VideoListResponse)
async def list_videos(
    skip: int = 0,
    limit: int = 10,
    processed_only: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_generous)
):
    """
    List all videos with pagination
    """
    query = db.query(Video)
    
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
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_generous)
):
    """
    Get a specific video by ID
    """
    video = db.query(Video).filter(Video.id == video_id).first()
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
    Delete a video and its associated data
    """
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    try:
        # Delete file from disk
        if os.path.exists(video.file_path):
            os.remove(video.file_path)
        
        # Delete frame files
        frames_dir = os.path.join(settings.upload_dir, "frames")
        for frame_file in os.listdir(frames_dir):
            if frame_file.startswith(f"video_{video_id}_"):
                frame_path = os.path.join(frames_dir, frame_file)
                if os.path.exists(frame_path):
                    os.remove(frame_path)
        
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
    video = db.query(Video).filter(Video.id == video_id).first()
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