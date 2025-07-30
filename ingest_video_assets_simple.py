#!/usr/bin/env python3
"""
Simplified Video Asset Ingestion Script for RareSift

This script processes all video assets in the video_assets/ directory,
ingests them into the database without heavy ML processing for now.
"""

import os
import sys
import subprocess
from pathlib import Path
from typing import Dict, List, Optional
import time
import json
from datetime import datetime
import shutil

# Add the backend directory to the Python path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

# Import minimal backend modules
from app.core.database import SessionLocal, Base, engine
from sqlalchemy import text

class VideoAssetIngester:
    def __init__(self):
        self.video_assets_dir = Path(__file__).parent / "video_assets"
        self.uploads_dir = Path(__file__).parent / "backend" / "uploads"
        
        # Ensure uploads directory exists
        os.makedirs(self.uploads_dir, exist_ok=True)
        os.makedirs(self.uploads_dir / "frames", exist_ok=True)
        
    def get_video_files(self) -> List[Dict]:
        """Scan video_assets directory and return all video files with metadata"""
        video_files = []
        
        # Define video directories with categories
        categories = {
            "driving_camera_footage": {
                "category": "driving_camera",
                "weather": "sunny",
                "time_of_day": "day",
                "location": "Highway driving"
            },
            "static_camera_footage": {
                "category": "static_camera", 
                "weather": "sunny",
                "time_of_day": "day",
                "location": "Intersection monitoring"
            }
        }
        
        for category_dir, metadata in categories.items():
            category_path = self.video_assets_dir / category_dir
            if category_path.exists():
                for video_file in category_path.glob("*.MP4"):
                    video_files.append({
                        "path": video_file,
                        "filename": video_file.name,
                        "category": metadata["category"],
                        "weather": metadata["weather"],
                        "time_of_day": metadata["time_of_day"],
                        "location": metadata["location"],
                        "size": video_file.stat().st_size
                    })
        
        return video_files
    
    def copy_video_to_uploads(self, source_path: Path, target_filename: str) -> str:
        """Copy video file to uploads directory"""
        target_path = self.uploads_dir / target_filename
        
        if target_path.exists():
            print(f"  📁 Video already exists in uploads: {target_filename}")
            return str(target_path)
        
        print(f"  📁 Copying video to uploads directory...")
        shutil.copy2(source_path, target_path)
        return str(target_path)
    
    def extract_video_metadata(self, video_path: str) -> Dict:
        """Extract video metadata using ffprobe"""
        try:
            cmd = [
                'ffprobe', '-v', 'quiet', '-print_format', 'json',
                '-show_format', '-show_streams', video_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            data = json.loads(result.stdout)
            
            # Find video stream
            video_stream = None
            for stream in data['streams']:
                if stream['codec_type'] == 'video':
                    video_stream = stream
                    break
            
            if not video_stream:
                raise ValueError("No video stream found")
            
            # Extract metadata
            duration = float(data['format']['duration'])
            fps = eval(video_stream.get('r_frame_rate', '30/1'))
            width = int(video_stream['width'])
            height = int(video_stream['height'])
            
            return {
                'duration': duration,
                'fps': fps,
                'width': width,
                'height': height,
                'format': data['format']['format_name'],
                'size': int(data['format']['size'])
            }
            
        except Exception as e:
            print(f"  ⚠️ Failed to extract metadata: {e}")
            return {
                'duration': 60.0,  # Default values
                'fps': 30.0,
                'width': 1920,
                'height': 1080,
                'format': 'mp4',
                'size': 0
            }
    
    def init_database(self):
        """Initialize database tables"""
        try:
            # Import models to ensure they're registered
            from app.models.video import Video, Frame, Embedding, Search, Export
            from app.models.user import User
            
            # Ensure pgvector extension exists (skip if not available)
            try:
                with engine.connect() as conn:
                    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                    conn.commit()
                    print("  ✅ pgvector extension ready")
            except Exception as e:
                print(f"  ⚠️ pgvector extension not available: {e}")
            
            # Create all tables
            Base.metadata.create_all(bind=engine)
            print("  ✅ Database tables ready")
            return True
        except Exception as e:
            print(f"  ❌ Database initialization failed: {e}")
            return False

    def ingest_video_simple(self, db, video_info: Dict) -> Optional[object]:
        """Ingest a single video into the database (simplified)"""
        print(f"\n🎬 Processing: {video_info['filename']}")
        
        # Import Video model here to avoid import issues
        from app.models.video import Video
        
        # Check if video already exists
        existing_video = db.query(Video).filter(
            Video.original_filename == video_info['filename']
        ).first()
        
        if existing_video:
            print(f"  ✅ Video already exists in database (ID: {existing_video.id})")
            return existing_video
        
        # Generate unique filename for uploads
        timestamp = int(time.time())
        target_filename = f"{timestamp}_{video_info['filename']}"
        
        # Copy video to uploads directory
        file_path = self.copy_video_to_uploads(video_info['path'], target_filename)
        
        # Extract video metadata
        print(f"  🔍 Extracting video metadata...")
        metadata = self.extract_video_metadata(file_path)
        
        # Create video record
        print(f"  💾 Creating database record...")
        video = Video(
            filename=target_filename,
            original_filename=video_info['filename'],
            file_path=file_path,
            file_size=video_info['size'],
            duration=metadata['duration'],
            fps=metadata['fps'],
            width=metadata['width'],
            height=metadata['height'],
            weather=video_info['weather'],
            time_of_day=video_info['time_of_day'],
            location=video_info['location'],
            video_metadata=metadata,
            is_processed=False  # Will be processed later
        )
        
        db.add(video)
        db.commit()
        db.refresh(video)
        
        print(f"  ✅ Video record created (ID: {video.id})")
        return video
    
    def ingest_all_videos(self):
        """Main ingestion process (simplified)"""
        print("🚀 Starting RareSift Video Asset Ingestion (Simplified)")
        print("=" * 60)
        
        # Initialize database
        print("📊 Initializing database...")
        if not self.init_database():
            print("❌ Failed to initialize database")
            return
        
        # Get all video files
        video_files = self.get_video_files()
        print(f"📂 Found {len(video_files)} video files to process")
        
        if not video_files:
            print("❌ No video files found in video_assets/ directory")
            return
        
        # List found videos
        print("\n📋 Videos to process:")
        for i, video_info in enumerate(video_files, 1):
            size_mb = video_info['size'] / (1024*1024)
            print(f"  {i}. {video_info['filename']} ({size_mb:.1f} MB) - {video_info['category']}")
        
        # Create database session
        db = SessionLocal()
        
        try:
            processed_count = 0
            failed_count = 0
            
            for i, video_info in enumerate(video_files, 1):
                print(f"\n{'='*60}")
                print(f"Processing {i}/{len(video_files)}: {video_info['filename']}")
                print(f"Category: {video_info['category']}")
                print(f"Size: {video_info['size'] / (1024*1024):.1f} MB")
                
                try:
                    # Ingest video (without processing for now)
                    video = self.ingest_video_simple(db, video_info)
                    
                    if video:
                        processed_count += 1
                        print(f"  ✅ Successfully ingested (ID: {video.id})")
                    
                except Exception as e:
                    print(f"  ❌ Failed to process {video_info['filename']}: {e}")
                    failed_count += 1
                    continue
            
            # Get final stats
            from app.models.video import Video
            total_videos = db.query(Video).count()
            
            print(f"\n🎉 Ingestion Complete!")
            print(f"✅ Successfully processed: {processed_count} videos")
            print(f"❌ Failed: {failed_count} videos")
            print(f"📊 Total videos in database: {total_videos}")
            print(f"\n📝 Note: Videos are ready for upload but not yet processed.")
            print(f"   Frame extraction and embedding generation will happen during upload processing.")
            
        finally:
            db.close()

def main():
    """Main entry point"""
    try:
        ingester = VideoAssetIngester()
        ingester.ingest_all_videos()
    except KeyboardInterrupt:
        print("\n\n❌ Ingestion cancelled by user")
    except Exception as e:
        print(f"\n\n❌ Ingestion failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()