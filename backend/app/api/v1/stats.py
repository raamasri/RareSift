from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import os

from app.core.database import get_db
from app.core.dependencies import get_optional_user
from app.core.config import settings
from app.models.video import Video, Frame, Search, Export
from app.models.user import User

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    """
    Get real dashboard statistics - no mock data
    """
    try:
        # Get real counts from database
        total_videos = db.query(func.count(Video.id)).scalar()
        total_frames = db.query(func.count(Frame.id)).scalar()
        total_searches = db.query(func.count(Search.id)).scalar()
        
        # Count videos currently processing
        processing_jobs = db.query(func.count(Video.id)).filter(
            Video.is_processed == False,
            Video.processing_started_at.isnot(None)
        ).scalar()
        
        # Calculate average processing time for completed videos
        avg_processing = db.query(
            func.avg(
                func.extract('epoch', Video.processing_completed_at) - 
                func.extract('epoch', Video.processing_started_at)
            )
        ).filter(
            Video.is_processed == True,
            Video.processing_completed_at.isnot(None),
            Video.processing_started_at.isnot(None)
        ).scalar()
        
        # Format average processing time
        if avg_processing:
            avg_minutes = int(avg_processing / 60)
            avg_processing_time = f"{avg_minutes}m" if avg_minutes > 0 else f"{int(avg_processing)}s"
        else:
            avg_processing_time = "N/A"
        
        # Calculate storage used
        total_size = db.query(func.sum(Video.file_size)).scalar() or 0
        storage_used = format_file_size(total_size)
        
        return {
            "totalVideos": total_videos,
            "totalFrames": total_frames,
            "totalSearches": total_searches,
            "processingJobs": processing_jobs,
            "avgProcessingTime": avg_processing_time,
            "storageUsed": storage_used
        }
        
    except ConnectionError as e:
        raise HTTPException(status_code=503, detail="Database connection failed. Please try again later.")
    except Exception as e:
        # Log the full error for debugging
        import traceback
        print(f"Dashboard stats error: {traceback.format_exc()}")
        
        if "database" in str(e).lower():
            raise HTTPException(status_code=503, detail="Database temporarily unavailable. Please try again in a few moments.")
        else:
            raise HTTPException(status_code=500, detail="Unable to retrieve dashboard statistics. Please refresh the page or contact support.")

@router.get("/activity")
async def get_recent_activity(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    """
    Get real recent activity from database
    """
    try:
        activities = []
        
        # Get recent video uploads
        recent_videos = db.query(Video).order_by(Video.created_at.desc()).limit(5).all()
        for video in recent_videos:
            status = "completed" if video.is_processed else "processing"
            time_ago = format_time_ago(video.created_at)
            
            activities.append({
                "id": f"video_{video.id}",
                "type": "upload",
                "description": f"{video.original_filename} uploaded",
                "time": time_ago,
                "status": status,
                "details": {
                    "file_size": format_file_size(video.file_size),
                    "duration": format_duration(video.duration) if video.duration else "N/A",
                    "frames_extracted": db.query(func.count(Frame.id)).filter(Frame.video_id == video.id).scalar()
                }
            })
        
        # Get recent searches
        recent_searches = db.query(Search).order_by(Search.created_at.desc()).limit(5).all()
        for search in recent_searches:
            time_ago = format_time_ago(search.created_at)
            
            activities.append({
                "id": f"search_{search.id}",
                "type": "search",
                "description": f'Search: "{search.query_text}"' if search.query_text else "Image search",
                "time": time_ago,
                "status": "completed",
                "details": {
                    "results_found": search.results_count,
                    "search_time": f"{search.response_time_ms}ms" if search.response_time_ms else "N/A"
                }
            })
        
        # Get recent exports
        recent_exports = db.query(Export).order_by(Export.created_at.desc()).limit(3).all()
        for export in recent_exports:
            time_ago = format_time_ago(export.created_at)
            
            activities.append({
                "id": f"export_{export.id}",
                "type": "export",
                "description": f"Dataset exported ({export.frame_count} frames)",
                "time": time_ago,
                "status": "completed",
                "details": {
                    "format": export.format,
                    "file_size": format_file_size(export.file_size) if export.file_size else "N/A"
                }
            })
        
        # Sort all activities by time and return most recent
        activities.sort(key=lambda x: parse_time_ago(x['time']))
        
        return {
            "activities": activities[:limit],
            "total": len(activities)
        }
        
    except Exception as e:
        # Log the full error for debugging
        import traceback
        print(f"Activity fetch error: {traceback.format_exc()}")
        
        if "database" in str(e).lower():
            raise HTTPException(status_code=503, detail="Database temporarily unavailable. Please try again.")
        else:
            raise HTTPException(status_code=500, detail="Unable to retrieve recent activity. Please try again later.")

@router.get("/summary")
async def get_system_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    """
    Get system summary for display
    """
    try:
        # Video breakdown by type
        driving_videos = db.query(func.count(Video.id)).filter(
            Video.video_metadata['camera_type'].astext == 'driving_camera'
        ).scalar()
        
        static_videos = db.query(func.count(Video.id)).filter(
            Video.video_metadata['camera_type'].astext == 'static_camera'
        ).scalar()
        
        # Processing status
        processed_videos = db.query(func.count(Video.id)).filter(Video.is_processed == True).scalar()
        pending_videos = db.query(func.count(Video.id)).filter(Video.is_processed == False).scalar()
        
        # Search statistics
        searches_today = db.query(func.count(Search.id)).filter(
            Search.created_at >= datetime.now() - timedelta(days=1)
        ).scalar()
        
        searches_week = db.query(func.count(Search.id)).filter(
            Search.created_at >= datetime.now() - timedelta(days=7)
        ).scalar()
        
        return {
            "videos": {
                "total": driving_videos + static_videos,
                "driving_camera": driving_videos,
                "static_camera": static_videos,
                "processed": processed_videos,
                "pending": pending_videos
            },
            "searches": {
                "today": searches_today,
                "this_week": searches_week,
                "total": db.query(func.count(Search.id)).scalar()
            },
            "system": {
                "embedding_model": "OpenAI text-embedding-ada-002",
                "embedding_dimensions": settings.embedding_dimension,
                "frame_extraction_rate": f"{settings.frame_extraction_interval}s"
            }
        }
        
    except Exception as e:
        # Log the full error for debugging
        import traceback
        print(f"System summary error: {traceback.format_exc()}")
        
        if "database" in str(e).lower():
            raise HTTPException(status_code=503, detail="Database temporarily unavailable. Please try again.")
        else:
            raise HTTPException(status_code=500, detail="Unable to retrieve system summary. Please try again later.")

# Helper functions
def format_file_size(size_bytes):
    """Format bytes to human readable size"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} TB"

def format_duration(seconds):
    """Format seconds to human readable duration"""
    if not seconds:
        return "N/A"
    
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    
    if hours > 0:
        return f"{hours}h {minutes}m"
    elif minutes > 0:
        return f"{minutes}m {secs}s"
    else:
        return f"{secs}s"

def format_time_ago(timestamp):
    """Format timestamp to human readable time ago"""
    if not timestamp:
        return "Unknown"
    
    now = datetime.now()
    diff = now - timestamp
    
    if diff.days > 7:
        return timestamp.strftime("%b %d, %Y")
    elif diff.days > 0:
        return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
    elif diff.seconds > 3600:
        hours = diff.seconds // 3600
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    elif diff.seconds > 60:
        minutes = diff.seconds // 60
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    else:
        return "Just now"

def parse_time_ago(time_str):
    """Parse time ago string back to timestamp for sorting"""
    now = datetime.now()
    
    if "just now" in time_str.lower():
        return now
    elif "minute" in time_str:
        minutes = int(time_str.split()[0])
        return now - timedelta(minutes=minutes)
    elif "hour" in time_str:
        hours = int(time_str.split()[0])
        return now - timedelta(hours=hours)
    elif "day" in time_str:
        days = int(time_str.split()[0])
        return now - timedelta(days=days)
    else:
        # Try to parse as date
        try:
            return datetime.strptime(time_str, "%b %d, %Y")
        except:
            return now - timedelta(days=30)  # Default to old