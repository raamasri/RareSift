import os
import zipfile
import json
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_active_user, rate_limit_moderate, rate_limit_generous
from app.models.video import Export, Frame, Video
from app.models.user import User

router = APIRouter()

# Pydantic models
class ExportRequest(BaseModel):
    frame_ids: List[int]
    export_format: str = "zip"  # zip, dataset
    include_metadata: bool = True

class ExportResponse(BaseModel):
    export_id: int
    status: str
    frame_count: int
    estimated_time_seconds: int

class ExportStatus(BaseModel):
    export_id: int
    status: str
    progress: int  # 0-100
    file_path: str | None
    file_size: int | None
    error_message: str | None
    created_at: str
    completed_at: str | None

async def create_export_background(export_id: int, db: Session):
    """Background task to create export file"""
    export_record = db.query(Export).filter(Export.id == export_id).first()
    if not export_record:
        return
    
    try:
        # Update status to processing
        export_record.status = "processing"
        db.commit()
        
        # Get frame data
        frame_ids = export_record.frame_ids
        frames = db.query(Frame, Video).join(Video).filter(Frame.id.in_(frame_ids)).all()
        
        if not frames:
            export_record.status = "failed"
            export_record.error_message = "No frames found for export"
            db.commit()
            return
        
        # Create export directory
        export_dir = os.path.join(settings.upload_dir, "exports")
        os.makedirs(export_dir, exist_ok=True)
        
        # Create export file
        export_filename = f"export_{export_id}_{int(datetime.now().timestamp())}.zip"
        export_path = os.path.join(export_dir, export_filename)
        
        with zipfile.ZipFile(export_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            metadata_list = []
            
            for i, (frame, video) in enumerate(frames):
                if not frame.frame_path or not os.path.exists(frame.frame_path):
                    continue
                
                # Add frame image to zip
                frame_filename = f"frame_{frame.id}_{frame.frame_number:06d}.jpg"
                zipf.write(frame.frame_path, frame_filename)
                
                # Collect metadata
                frame_metadata = {
                    "frame_id": frame.id,
                    "video_id": frame.video_id,
                    "video_filename": video.original_filename,
                    "frame_number": frame.frame_number,
                    "timestamp": frame.timestamp,
                    "video_duration": video.duration,
                    "video_fps": video.fps,
                    "video_resolution": {
                        "width": video.width,
                        "height": video.height
                    },
                    "conditions": {
                        "weather": video.weather,
                        "time_of_day": video.time_of_day,
                        "location": video.location,
                        "speed_avg": video.speed_avg
                    },
                    "frame_metadata": frame.metadata,
                    "exported_filename": frame_filename
                }
                metadata_list.append(frame_metadata)
            
            # Add metadata file
            if export_record.export_format == "dataset":
                # Create dataset-style metadata
                dataset_metadata = {
                    "export_info": {
                        "export_id": export_id,
                        "created_at": export_record.created_at.isoformat(),
                        "total_frames": len(metadata_list),
                        "export_format": "scenario_dataset_v1"
                    },
                    "frames": metadata_list
                }
                zipf.writestr("dataset_metadata.json", json.dumps(dataset_metadata, indent=2))
                
                # Create simple CSV for quick analysis
                csv_content = "frame_id,video_id,timestamp,weather,time_of_day,speed_avg,filename\n"
                for frame_meta in metadata_list:
                    csv_content += f"{frame_meta['frame_id']},{frame_meta['video_id']},{frame_meta['timestamp']},{frame_meta['conditions']['weather'] or ''},{frame_meta['conditions']['time_of_day'] or ''},{frame_meta['conditions']['speed_avg'] or ''},{frame_meta['exported_filename']}\n"
                zipf.writestr("frames_summary.csv", csv_content)
            else:
                # Standard metadata
                zipf.writestr("metadata.json", json.dumps(metadata_list, indent=2))
        
        # Update export record
        export_record.status = "completed"
        export_record.file_path = export_path
        export_record.file_size = os.path.getsize(export_path)
        export_record.completed_at = datetime.utcnow()
        db.commit()
        
    except Exception as e:
        export_record.status = "failed"
        export_record.error_message = str(e)
        db.commit()
        print(f"Export {export_id} failed: {str(e)}")

@router.post("/", response_model=ExportResponse)
async def create_export(
    request: ExportRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_moderate)
):
    """
    Start an export job for selected frames
    """
    if not request.frame_ids:
        raise HTTPException(status_code=400, detail="No frames selected for export")
    
    if len(request.frame_ids) > 1000:  # Limit to prevent huge exports
        raise HTTPException(status_code=400, detail="Too many frames selected (max 1000)")
    
    try:
        # Verify frames exist
        existing_frames = db.query(Frame.id).filter(Frame.id.in_(request.frame_ids)).all()
        existing_frame_ids = [frame.id for frame in existing_frames]
        
        if len(existing_frame_ids) != len(request.frame_ids):
            missing_ids = set(request.frame_ids) - set(existing_frame_ids)
            raise HTTPException(
                status_code=400, 
                detail=f"Some frames not found: {list(missing_ids)}"
            )
        
        # Create export record
        export_record = Export(
            user_id=current_user.id,
            frame_ids=request.frame_ids,
            export_format=request.export_format,
            status="pending"
        )
        
        # Update user stats
        current_user.export_count += 1
        db.commit()
        
        db.add(export_record)
        db.commit()
        db.refresh(export_record)
        
        # Start background export
        background_tasks.add_task(create_export_background, export_record.id, db)
        
        # Estimate time (roughly 0.1 seconds per frame)
        estimated_time = max(10, len(request.frame_ids) * 0.1)
        
        return ExportResponse(
            export_id=export_record.id,
            status=export_record.status,
            frame_count=len(request.frame_ids),
            estimated_time_seconds=int(estimated_time)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create export: {str(e)}")

@router.get("/{export_id}/status", response_model=ExportStatus)
async def get_export_status(
    export_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_generous)
):
    """
    Get the status of an export job
    """
    export_record = db.query(Export).filter(
        Export.id == export_id,
        Export.user_id == current_user.id
    ).first()
    if not export_record:
        raise HTTPException(status_code=404, detail="Export not found")
    
    # Calculate progress based on status
    progress = 0
    if export_record.status == "processing":
        progress = 50
    elif export_record.status == "completed":
        progress = 100
    elif export_record.status == "failed":
        progress = 0
    
    return ExportStatus(
        export_id=export_record.id,
        status=export_record.status,
        progress=progress,
        file_path=export_record.file_path,
        file_size=export_record.file_size,
        error_message=export_record.error_message,
        created_at=export_record.created_at.isoformat(),
        completed_at=export_record.completed_at.isoformat() if export_record.completed_at else None
    )

@router.get("/{export_id}/download")
async def download_export(
    export_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_generous)
):
    """
    Download the exported file
    """
    export_record = db.query(Export).filter(
        Export.id == export_id,
        Export.user_id == current_user.id
    ).first()
    if not export_record:
        raise HTTPException(status_code=404, detail="Export not found")
    
    if export_record.status != "completed":
        raise HTTPException(status_code=400, detail="Export not completed yet")
    
    if not export_record.file_path or not os.path.exists(export_record.file_path):
        raise HTTPException(status_code=404, detail="Export file not found")
    
    # Return file for download
    filename = os.path.basename(export_record.file_path)
    return FileResponse(
        export_record.file_path,
        media_type="application/zip",
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/")
async def list_exports(
    skip: int = 0,
    limit: int = 10,
    status: str | None = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_generous)
):
    """
    List all exports with pagination
    """
    query = db.query(Export).filter(Export.user_id == current_user.id)
    
    if status:
        query = query.filter(Export.status == status)
    
    total = query.count()
    exports = query.order_by(Export.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "exports": [
            {
                "export_id": export.id,
                "status": export.status,
                "frame_count": len(export.frame_ids) if export.frame_ids else 0,
                "export_format": export.export_format,
                "file_size": export.file_size,
                "created_at": export.created_at.isoformat(),
                "completed_at": export.completed_at.isoformat() if export.completed_at else None,
                "error_message": export.error_message
            }
            for export in exports
        ],
        "total": total
    }

@router.delete("/{export_id}")
async def delete_export(
    export_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_moderate)
):
    """
    Delete an export and its file
    """
    export_record = db.query(Export).filter(
        Export.id == export_id,
        Export.user_id == current_user.id
    ).first()
    if not export_record:
        raise HTTPException(status_code=404, detail="Export not found")
    
    try:
        # Delete file if it exists
        if export_record.file_path and os.path.exists(export_record.file_path):
            os.remove(export_record.file_path)
        
        # Delete record
        db.delete(export_record)
        db.commit()
        
        return {"message": "Export deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete export: {str(e)}") 