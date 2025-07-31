#!/usr/bin/env python3
"""
Update existing video metadata with CLIP-detected time of day and weather conditions
"""

import asyncio
import sys
import os
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.models.video import Video, Frame
from app.services.embedding_service import EmbeddingService

async def update_video_conditions():
    """Update all existing videos with CLIP-detected conditions"""
    
    # Create database connection
    engine = create_engine(settings.database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    # Initialize embedding service
    embedding_service = EmbeddingService()
    await embedding_service.initialize()
    
    try:
        # Get all videos
        videos = db.query(Video).all()
        print(f"Found {len(videos)} videos to update")
        
        for video in videos:
            print(f"\nProcessing video: {video.original_filename} (ID: {video.id})")
            
            # Get the first frame for this video to analyze conditions
            first_frame = db.query(Frame).filter(Frame.video_id == video.id).first()
            
            if not first_frame or not first_frame.frame_path:
                print(f"  No frame found for video {video.id}")
                continue
                
            if not os.path.exists(first_frame.frame_path):
                print(f"  Frame file not found: {first_frame.frame_path}")
                continue
            
            print(f"  Analyzing frame: {os.path.basename(first_frame.frame_path)}")
            
            # Detect conditions using CLIP
            try:
                conditions = await embedding_service.detect_conditions_clip(first_frame.frame_path)
                
                # Update video metadata
                old_time = video.time_of_day
                old_weather = video.weather
                
                video.time_of_day = conditions["time_of_day"]
                video.weather = conditions["weather"]
                
                print(f"  Time of day: {old_time} -> {conditions['time_of_day']} (confidence: {conditions.get('time_confidence', 0):.3f})")
                print(f"  Weather: {old_weather} -> {conditions['weather']} (confidence: {conditions.get('weather_confidence', 0):.3f})")
                
                # Show detailed similarities for debugging
                if 'time_similarities' in conditions:
                    print(f"  Time similarities: {conditions['time_similarities']}")
                if 'weather_similarities' in conditions:
                    print(f"  Weather similarities: {conditions['weather_similarities']}")
                
                db.commit()
                print(f"  ✅ Updated video {video.id}")
                
            except Exception as e:
                print(f"  ❌ Error processing video {video.id}: {str(e)}")
                db.rollback()
                continue
        
        print(f"\n🎉 Completed updating {len(videos)} videos")
        
    except Exception as e:
        print(f"❌ Fatal error: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(update_video_conditions())