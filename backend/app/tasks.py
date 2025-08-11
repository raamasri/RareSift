import os
import time
from typing import Dict, List
from celery import current_task
from sqlalchemy.orm import Session

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.core.config import settings
from app.models.video import Video, Export
from app.services.video_processor import VideoProcessor
from app.services.embedding_service import EmbeddingService


@celery_app.task(bind=True)
def process_video_task(self, video_id: int):
    """
    Background task to process uploaded video:
    1. Extract frames
    2. Generate embeddings
    3. Update video status
    """
    db = SessionLocal()
    
    try:
        # Update task status
        self.update_state(
            state='PROGRESS',
            meta={'current': 0, 'total': 100, 'status': 'Starting video processing...'}
        )
        
        # Get video from database
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise Exception(f"Video with ID {video_id} not found")
        
        # Update task status
        self.update_state(
            state='PROGRESS',
            meta={'current': 10, 'total': 100, 'status': 'Extracting frames...'}
        )
        
        # Process video (extract frames)
        processor = VideoProcessor()
        # Note: We need to make this synchronous since Celery tasks can't be async
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            success = loop.run_until_complete(processor.process_video(db, video))
            
            if not success:
                raise Exception("Video processing failed")
            
            # Update task status
            self.update_state(
                state='PROGRESS',
                meta={'current': 50, 'total': 100, 'status': 'Generating AI embeddings...'}
            )
            
            # Generate embeddings
            embedding_service = EmbeddingService()
            embeddings_created = loop.run_until_complete(embedding_service.generate_frame_embeddings(db, video_id))
        finally:
            loop.close()
        
        # Update task status
        self.update_state(
            state='PROGRESS',
            meta={'current': 90, 'total': 100, 'status': 'Finalizing...'}
        )
        
        # Final status update
        video = db.query(Video).filter(Video.id == video_id).first()
        video.is_processed = True
        db.commit()
        
        return {
            'video_id': video_id,
            'status': 'completed',
            'embeddings_created': embeddings_created,
            'message': f'Successfully processed video with {embeddings_created} frame embeddings'
        }
        
    except Exception as e:
        # Update video with error
        video = db.query(Video).filter(Video.id == video_id).first()
        if video:
            video.processing_error = str(e)
            video.is_processed = False
            db.commit()
        
        self.update_state(
            state='FAILURE',
            meta={'error': str(e)}
        )
        raise e
    
    finally:
        db.close()


@celery_app.task(bind=True)
def generate_embeddings_task(self, video_id: int):
    """
    Background task to generate embeddings for video frames
    """
    db = SessionLocal()
    
    try:
        self.update_state(
            state='PROGRESS',
            meta={'current': 0, 'total': 100, 'status': 'Initializing CLIP model...'}
        )
        
        embedding_service = EmbeddingService()
        
        self.update_state(
            state='PROGRESS',
            meta={'current': 20, 'total': 100, 'status': 'Processing frames...'}
        )
        
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            embeddings_created = loop.run_until_complete(embedding_service.generate_frame_embeddings(db, video_id))
        finally:
            loop.close()
        
        return {
            'video_id': video_id,
            'embeddings_created': embeddings_created,
            'status': 'completed'
        }
        
    except Exception as e:
        self.update_state(
            state='FAILURE', 
            meta={'error': str(e)}
        )
        raise e
    
    finally:
        db.close()


@celery_app.task(bind=True)
def export_frames_task(self, export_id: int):
    """
    Background task to export selected frames as ZIP or dataset
    """
    import zipfile
    import json
    from datetime import datetime
    
    db = SessionLocal()
    
    try:
        # Get export record
        export = db.query(Export).filter(Export.id == export_id).first()
        if not export:
            raise Exception(f"Export with ID {export_id} not found")
        
        self.update_state(
            state='PROGRESS',
            meta={'current': 0, 'total': 100, 'status': 'Starting export...'}
        )
        
        # Update export status
        export.status = "processing"
        db.commit()
        
        frame_ids = export.frame_ids
        export_format = export.export_format
        
        self.update_state(
            state='PROGRESS',
            meta={'current': 20, 'total': 100, 'status': f'Collecting {len(frame_ids)} frames...'}
        )
        
        # Get frame data
        from app.models.video import Frame
        frames = db.query(Frame).filter(Frame.id.in_(frame_ids)).all()
        
        if not frames:
            raise Exception("No frames found for export")
        
        # Create export directory
        export_dir = os.path.join(settings.upload_dir, "exports")
        os.makedirs(export_dir, exist_ok=True)
        
        # Generate export filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        export_filename = f"raresift_export_{export_id}_{timestamp}.zip"
        export_path = os.path.join(export_dir, export_filename)
        
        self.update_state(
            state='PROGRESS',
            meta={'current': 40, 'total': 100, 'status': 'Creating archive...'}
        )
        
        # Create ZIP file
        with zipfile.ZipFile(export_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            
            # Export metadata
            metadata = {
                "export_id": export_id,
                "export_date": datetime.now().isoformat(),
                "total_frames": len(frames),
                "frames": []
            }
            
            for i, frame in enumerate(frames):
                # Update progress
                progress = 40 + (i / len(frames)) * 50
                self.update_state(
                    state='PROGRESS',
                    meta={'current': int(progress), 'total': 100, 'status': f'Adding frame {i+1}/{len(frames)}...'}
                )
                
                # Add frame image to ZIP
                if frame.frame_path and os.path.exists(frame.frame_path):
                    frame_filename = f"frame_{frame.id}_{frame.frame_number:06d}.jpg"
                    zipf.write(frame.frame_path, frame_filename)
                    
                    # Add frame metadata
                    frame_meta = {
                        "frame_id": frame.id,
                        "video_id": frame.video_id,
                        "frame_number": frame.frame_number,
                        "timestamp": frame.timestamp,
                        "filename": frame_filename,
                        "metadata": frame.frame_metadata or {}
                    }
                    
                    # Add video metadata
                    if frame.video:
                        frame_meta["video"] = {
                            "filename": frame.video.original_filename,
                            "duration": frame.video.duration,
                            "fps": frame.video.fps,
                            "weather": frame.video.weather,
                            "time_of_day": frame.video.time_of_day,
                            "location": frame.video.location
                        }
                    
                    metadata["frames"].append(frame_meta)
            
            # Add metadata JSON to ZIP
            zipf.writestr("metadata.json", json.dumps(metadata, indent=2))
            
            # Add README
            readme_content = f"""RareSift Export
===============

Export ID: {export_id}
Export Date: {datetime.now().isoformat()}
Total Frames: {len(frames)}
Format: {export_format}

This export contains extracted frames from RareSift AI-powered scenario search.

Files:
- metadata.json: Complete metadata for all frames and videos
- frame_*.jpg: Individual frame images

Frame Naming Convention:
frame_[frame_id]_[frame_number].jpg

For more information about RareSift, visit: https://raresift.ai
"""
            zipf.writestr("README.txt", readme_content)
        
        # Update export record
        export.status = "completed"
        export.file_path = export_path
        export.file_size = os.path.getsize(export_path)
        export.completed_at = datetime.utcnow()
        db.commit()
        
        return {
            'export_id': export_id,
            'status': 'completed',
            'file_path': export_path,
            'file_size': export.file_size,
            'frames_exported': len(frames)
        }
        
    except Exception as e:
        # Update export with error
        export = db.query(Export).filter(Export.id == export_id).first()
        if export:
            export.status = "failed"
            export.error_message = str(e)
            db.commit()
        
        self.update_state(
            state='FAILURE',
            meta={'error': str(e)}
        )
        raise e
    
    finally:
        db.close()


@celery_app.task
def cleanup_old_exports():
    """
    Periodic task to clean up old export files
    """
    import glob
    from datetime import datetime, timedelta
    
    try:
        export_dir = os.path.join(settings.upload_dir, "exports")
        if not os.path.exists(export_dir):
            return {"status": "no_export_dir"}
        
        # Remove files older than 7 days
        cutoff_date = datetime.now() - timedelta(days=7)
        files_removed = 0
        
        for file_path in glob.glob(os.path.join(export_dir, "*.zip")):
            file_modified = datetime.fromtimestamp(os.path.getmtime(file_path))
            if file_modified < cutoff_date:
                os.remove(file_path)
                files_removed += 1
        
        return {
            "status": "completed",
            "files_removed": files_removed
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


# Register periodic tasks
from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    'cleanup-old-exports': {
        'task': 'app.tasks.cleanup_old_exports',
        'schedule': crontab(hour=2, minute=0),  # Run daily at 2 AM
    },
}