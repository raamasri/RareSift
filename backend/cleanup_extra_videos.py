#!/usr/bin/env python3
"""
Clean up extra videos to get back to 22 total videos
"""

import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from app.core.database import get_db, engine
from app.models.video import Video, Frame, Embedding

def cleanup_extra_videos():
    """Remove extra videos to get back to 22 total"""
    db = Session(bind=engine)
    
    try:
        # Videos to remove (the 5 extras identified)
        videos_to_remove = [10, 11, 12, 13, 14]
        
        print(f"🧹 Removing {len(videos_to_remove)} extra videos...")
        
        for video_id in videos_to_remove:
            print(f"  Removing video ID {video_id}...")
            
            # Get the video
            video = db.query(Video).filter(Video.id == video_id).first()
            if not video:
                print(f"    Video {video_id} not found, skipping")
                continue
            
            print(f"    Video: {video.original_filename}")
            
            # Get all frames for this video
            frames = db.query(Frame).filter(Frame.video_id == video_id).all()
            print(f"    Found {len(frames)} frames")
            
            # Delete embeddings for each frame
            for frame in frames:
                embeddings_count = db.query(Embedding).filter(Embedding.frame_id == frame.id).count()
                if embeddings_count > 0:
                    db.query(Embedding).filter(Embedding.frame_id == frame.id).delete()
                    print(f"      Deleted {embeddings_count} embeddings for frame {frame.id}")
            
            # Delete frames
            frames_count = len(frames)
            db.query(Frame).filter(Frame.video_id == video_id).delete()
            print(f"    Deleted {frames_count} frames")
            
            # Delete video
            db.delete(video)
            print(f"    Deleted video {video_id}")
        
        # Commit all changes
        db.commit()
        
        # Verify final count
        final_count = db.query(Video).filter(Video.user_id == 1).count()
        print(f"\n✅ Cleanup complete!")
        print(f"📊 Final video count: {final_count}")
        
        if final_count == 22:
            print("🎯 Perfect! Now showing exactly 22 videos as expected.")
        else:
            print(f"⚠️  Expected 22 videos, but got {final_count}")
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🧹 RareSift Video Cleanup")
    print("=" * 40)
    cleanup_extra_videos()