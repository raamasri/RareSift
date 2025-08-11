#!/usr/bin/env python3
"""
Monitor frame ingestion progress and database statistics
"""

import sys
import time
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text
from app.core.config import settings
from app.models.video import Video, Frame, Embedding

def get_database_stats():
    """Get current database statistics"""
    engine = create_engine(settings.database_url)
    with Session(bind=engine) as db:
        # Get counts
        video_count = db.query(Video).count()
        frame_count = db.query(Frame).count()
        embedding_count = db.query(Embedding).count()
        
        # Get processing progress by video
        videos = db.query(Video).all()
        
        # Get frames processed in last minute
        recent_frames = db.execute(text("""
            SELECT COUNT(*) as recent_count
            FROM frames 
            WHERE created_at > NOW() - INTERVAL '1 minute'
        """)).scalar()
        
        return {
            "videos": video_count,
            "frames": frame_count,
            "embeddings": embedding_count,
            "recent_frames": recent_frames,
            "video_details": [
                {
                    "filename": v.filename,
                    "frames": db.query(Frame).filter(Frame.video_id == v.id).count(),
                    "embeddings": db.query(Embedding).join(Frame).filter(Frame.video_id == v.id).count()
                }
                for v in videos
            ]
        }

def main():
    """Monitor ingestion progress"""
    print("🔍 RareSift Frame Ingestion Monitor")
    print("=" * 50)
    
    try:
        while True:
            stats = get_database_stats()
            
            # Clear screen and show stats
            print("\033[H\033[J")  # Clear screen
            print("🔍 RareSift Frame Ingestion Monitor")
            print("=" * 50)
            print(f"📊 Database Overview:")
            print(f"  Videos: {stats['videos']}")
            print(f"  Frames: {stats['frames']:,}")
            print(f"  Embeddings: {stats['embeddings']:,}")
            print(f"  Recent frames (1m): {stats['recent_frames']}")
            
            if stats['frames'] > 0 and stats['embeddings'] > 0:
                completion = (stats['embeddings'] / stats['frames']) * 100
                print(f"  Completion: {completion:.1f}%")
            
            print(f"\n📂 Video Processing Details:")
            for video in stats['video_details']:
                frames = video['frames']
                embeddings = video['embeddings']
                if frames > 0:
                    video_completion = (embeddings / frames) * 100
                    print(f"  {video['filename']}: {embeddings:,}/{frames:,} ({video_completion:.1f}%)")
                else:
                    print(f"  {video['filename']}: No frames yet")
            
            # Estimate completion time
            if stats['recent_frames'] > 0:
                remaining_frames = stats['frames'] - stats['embeddings']
                if remaining_frames > 0:
                    frames_per_minute = stats['recent_frames']
                    eta_minutes = remaining_frames / frames_per_minute
                    print(f"\n⏱️  Processing Rate: {frames_per_minute} frames/minute")
                    print(f"⏰ ETA: {eta_minutes:.1f} minutes")
                else:
                    print(f"\n✅ Processing Complete!")
                    break
            
            print(f"\n🔄 Last updated: {time.strftime('%H:%M:%S')}")
            print("Press Ctrl+C to exit")
            
            time.sleep(5)  # Update every 5 seconds
            
    except KeyboardInterrupt:
        print(f"\n\n👋 Monitoring stopped")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Add backend to path
    sys.path.append(str(Path(__file__).parent))
    main()