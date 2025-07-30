#!/usr/bin/env python3
"""
Video Asset Ingestion Script for RareSift

This script processes all video assets in the video_assets/ directory,
ingests them into the database, and processes them for search functionality.
"""

import os
import sys
import asyncio
import subprocess
from pathlib import Path
from typing import Dict, List, Optional
import time
import json
from datetime import datetime

# Add the backend directory to the Python path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

# Import backend modules
from app.core.database import SessionLocal, Base, engine
from app.models.video import Video, Frame, Embedding
from app.services.video_processor import VideoProcessor
from app.services.embedding_service import EmbeddingService
from sqlalchemy import text

class VideoAssetIngester:
    def __init__(self):
        self.video_processor = VideoProcessor()
        self.embedding_service = EmbeddingService()
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
        import shutil
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
    
    async def ingest_video(self, db, video_info: Dict) -> Optional[Video]:
        """Ingest a single video into the database"""
        print(f"\n🎬 Processing: {video_info['filename']}")
        
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
            is_processed=False
        )
        
        db.add(video)
        db.commit()
        db.refresh(video)
        
        print(f"  ✅ Video record created (ID: {video.id})")
        return video
    
    async def process_video_frames(self, db, video: Video):
        """Process video frames and generate embeddings"""
        print(f"\n🎯 Processing frames for video {video.id}: {video.original_filename}")
        
        try:
            # Check if already processed
            if video.is_processed:
                print(f"  ✅ Video already processed")
                return
            
            # Mark processing as started
            video.processing_started_at = datetime.utcnow()
            db.commit()
            
            # Extract frames
            print(f"  🖼️ Extracting frames...")
            await self.video_processor.process_video(db, video)
            
            # Generate embeddings
            print(f"  🧠 Generating CLIP embeddings...")
            await self.embedding_service.generate_frame_embeddings(db, video.id)
            
            # Mark as processed
            video.is_processed = True
            video.processing_completed_at = datetime.utcnow()
            db.commit()
            
            print(f"  ✅ Video processing completed")
            
        except Exception as e:
            video.processing_error = str(e)
            db.commit()
            print(f"  ❌ Processing failed: {e}")
            raise
    
    def init_database(self):
        """Initialize database tables"""
        try:
            # Ensure pgvector extension exists
            with engine.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.commit()
            
            # Create all tables
            Base.metadata.create_all(bind=engine)
            return True
        except Exception as e:
            print(f"❌ Database initialization failed: {e}")
            return False

    async def ingest_all_videos(self):
        """Main ingestion process"""
        print("🚀 Starting RareSift Video Asset Ingestion")
        print("=" * 50)
        
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
                    # Ingest video
                    video = await self.ingest_video(db, video_info)
                    
                    if video:
                        # Process frames and embeddings
                        await self.process_video_frames(db, video)
                        processed_count += 1
                    
                except Exception as e:
                    print(f"❌ Failed to process {video_info['filename']}: {e}")
                    failed_count += 1
                    continue
            
            print(f"\n🎉 Ingestion Complete!")
            print(f"✅ Successfully processed: {processed_count} videos")
            print(f"❌ Failed: {failed_count} videos")
            print(f"📊 Total videos in database: {db.query(Video).count()}")
            
        finally:
            db.close()

def main():
    """Main entry point"""
    try:
        ingester = VideoAssetIngester()
        asyncio.run(ingester.ingest_all_videos())
    except KeyboardInterrupt:
        print("\n\n❌ Ingestion cancelled by user")
    except Exception as e:
        print(f"\n\n❌ Ingestion failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()