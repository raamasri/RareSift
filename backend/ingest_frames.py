#!/usr/bin/env python3
"""
Comprehensive Frame Ingestion Pipeline for RareSift

This script processes all 3,648 extracted frames and populates the database
with frames, embeddings, and metadata for efficient search operations.
"""

import os
import sys
import asyncio
import logging
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import json
import time

# Add the backend directory to Python path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from app.core.database import get_db
from app.core.config import settings
from app.models.video import Video, Frame, Embedding
from app.services.embedding_service import EmbeddingService
import cv2
import numpy as np
from PIL import Image

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class FrameIngestionPipeline:
    """Comprehensive pipeline to ingest all extracted frames into the database"""
    
    def __init__(self):
        # Look for frames in the mounted volume or local path
        possible_paths = [
            Path("/app/frames"),  # Docker backend frames
            Path(__file__).parent / "frames",  # Local backend frames
            Path("/app/frontend/src/assets/demo-frames"),  # Docker mount
            Path(__file__).parent / "frontend" / "src" / "assets" / "demo-frames",  # Local dev
            Path(__file__).parent.parent / "frontend" / "src" / "assets" / "demo-frames"  # Relative
        ]
        
        self.frames_dir = None
        for path in possible_paths:
            if path.exists():
                self.frames_dir = path
                break
        
        if self.frames_dir is None:
            raise FileNotFoundError("Could not find demo-frames directory in any expected location")
            
        self.embedding_service = EmbeddingService()
        self.batch_size = 25  # Process frames in batches for efficiency
        self.max_frames_for_demo = None  # Process ALL frames for production
        
        # Create database engine
        engine = create_engine(settings.database_url)
        self.SessionLocal = Session(bind=engine)
        
    def parse_frame_filename(self, frame_path: Path) -> Dict:
        """Extract metadata from frame filename"""
        # Example: driving_camera_gh010001_frame_240.jpg
        stem = frame_path.stem
        parts = stem.split('_')
        
        if len(parts) < 4:
            raise ValueError(f"Invalid frame filename format: {frame_path.name}")
        
        camera_type = f"{parts[0]}_{parts[1]}"  # "driving_camera"
        video_id = parts[2].upper()  # "GH010001"
        frame_number = int(parts[4])  # 240
        
        return {
            "camera_type": camera_type,
            "video_id": video_id,
            "frame_number": frame_number,
            "timestamp": frame_number  # Assuming 1fps extraction
        }
    
    def get_or_create_video(self, db: Session, video_id: str, camera_type: str) -> Video:
        """Get existing video or create new video record"""
        # Check if video already exists
        video = db.query(Video).filter(Video.filename == f"{video_id}.MP4").first()
        
        if video:
            return video
        
        # Create new video record
        # Estimate video properties (would be better to get from actual video file)
        video = Video(
            filename=f"{video_id}.MP4",
            original_filename=f"{video_id}.MP4",
            file_path=f"/video_assets/{camera_type}_footage/{video_id}.MP4",
            file_size=500_000_000,  # Estimated 500MB
            duration=600.0,  # Estimated 10 minutes
            fps=30.0,  # Standard GoPro FPS
            width=1920,
            height=1080,
            video_metadata={
                "camera_type": camera_type,
                "source": "local_extraction"
            },
            weather="sunny",  # Default - could be improved with ML analysis
            time_of_day="day",
            location="Highway driving" if camera_type == "driving_camera" else "Intersection monitoring",
            is_processed=True,
            processing_completed_at=datetime.utcnow()
        )
        
        db.add(video)
        db.commit()
        db.refresh(video)
        
        logger.info(f"Created video record: {video_id}")
        return video
    
    def get_frame_features(self, frame_path: Path) -> Optional[Dict]:
        """Extract additional features from frame image"""
        try:
            # Load image for analysis
            image = cv2.imread(str(frame_path))
            if image is None:
                return None
            
            # Basic image analysis
            height, width, channels = image.shape
            
            # Calculate brightness (could indicate time of day)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            brightness = np.mean(gray)
            
            # Calculate edge density (could indicate complexity/traffic)
            edges = cv2.Canny(gray, 50, 150)
            edge_density = np.sum(edges > 0) / (height * width)
            
            return {
                "width": width,
                "height": height,
                "brightness": float(brightness),
                "edge_density": float(edge_density),
                "file_size": frame_path.stat().st_size
            }
        except Exception as e:
            logger.warning(f"Failed to extract features from {frame_path}: {e}")
            return None
    
    async def process_frame_batch(self, db: Session, frame_paths: List[Path]) -> int:
        """Process a batch of frames and generate embeddings"""
        processed_count = 0
        
        for frame_path in frame_paths:
            try:
                # Parse frame metadata
                frame_info = self.parse_frame_filename(frame_path)
                
                # Get or create video record
                video = self.get_or_create_video(
                    db, frame_info["video_id"], frame_info["camera_type"]
                )
                
                # Check if frame already exists
                existing_frame = db.query(Frame).filter(
                    Frame.video_id == video.id,
                    Frame.frame_number == frame_info["frame_number"]
                ).first()
                
                if existing_frame:
                    logger.debug(f"Frame already exists: {frame_path.name}")
                    continue
                
                # Extract frame features
                features = self.get_frame_features(frame_path)
                
                # Create frame record
                frame = Frame(
                    video_id=video.id,
                    frame_number=frame_info["frame_number"],
                    timestamp=frame_info["timestamp"],
                    frame_path=str(frame_path),
                    frame_metadata=features or {}
                )
                
                db.add(frame)
                db.commit()
                db.refresh(frame)
                
                # Generate CLIP embedding
                try:
                    # Load image for embedding
                    image = Image.open(frame_path)
                    embedding_vector = await self.embedding_service.encode_image(image)
                    
                    # Create embedding record
                    embedding = Embedding(
                        frame_id=frame.id,
                        embedding=embedding_vector.tolist(),
                        model_name="ViT-B/32"
                    )
                    
                    db.add(embedding)
                    db.commit()
                    
                    processed_count += 1
                    logger.info(f"Processed frame {processed_count}: {frame_path.name}")
                    
                except Exception as e:
                    logger.error(f"Failed to generate embedding for {frame_path}: {e}")
                    # Continue processing other frames even if one fails
                    continue
                    
            except Exception as e:
                logger.error(f"Failed to process frame {frame_path}: {e}")
                continue
        
        return processed_count
    
    def get_all_frame_paths(self) -> List[Path]:
        """Get all extracted frame paths"""
        frame_paths = []
        
        # Get all driving camera frames
        for pattern in ["driving_camera_*.jpg", "static_camera_*.jpg"]:
            frame_paths.extend(self.frames_dir.glob(pattern))
        
        # Sort by filename for consistent processing order
        frame_paths.sort(key=lambda x: x.name)
        
        return frame_paths
    
    def get_ingestion_stats(self, db: Session) -> Dict:
        """Get current database statistics"""
        video_count = db.query(Video).count()
        frame_count = db.query(Frame).count()
        embedding_count = db.query(Embedding).count()
        
        return {
            "videos": video_count,
            "frames": frame_count,
            "embeddings": embedding_count
        }
    
    async def run_ingestion(self):
        """Run the complete frame ingestion pipeline"""
        logger.info("🚀 Starting Frame Ingestion Pipeline")
        logger.info("=" * 60)
        
        # Initialize embedding service
        logger.info("Initializing CLIP embedding service...")
        await self.embedding_service.initialize()
        
        # Get all frame paths
        all_frame_paths = self.get_all_frame_paths()
        
        # Process all frames or limit for demo
        if self.max_frames_for_demo:
            frame_paths = all_frame_paths[:self.max_frames_for_demo]
            logger.info(f"📁 Found {len(all_frame_paths)} total frames, processing {len(frame_paths)} for demo")
        else:
            frame_paths = all_frame_paths
            logger.info(f"📁 Found {len(all_frame_paths)} total frames, processing ALL frames for production")
        
        total_frames = len(frame_paths)
        
        if total_frames == 0:
            logger.error("❌ No frames found. Make sure frame extraction was completed.")
            return
        
        # Check initial database state
        with self.SessionLocal as db:
            initial_stats = self.get_ingestion_stats(db)
            logger.info(f"📊 Initial database state: {initial_stats}")
        
        # Process frames in batches
        start_time = time.time()
        total_processed = 0
        
        for i in range(0, total_frames, self.batch_size):
            batch = frame_paths[i:i + self.batch_size]
            batch_num = i // self.batch_size + 1
            total_batches = (total_frames + self.batch_size - 1) // self.batch_size
            
            logger.info(f"🔄 Processing batch {batch_num}/{total_batches} ({len(batch)} frames)")
            
            with self.SessionLocal as db:
                batch_processed = await self.process_frame_batch(db, batch)
                total_processed += batch_processed
            
            # Progress update
            progress = (i + len(batch)) / total_frames * 100
            elapsed = time.time() - start_time
            eta = elapsed / (i + len(batch)) * (total_frames - i - len(batch)) if i > 0 else 0
            
            logger.info(f"📈 Progress: {progress:.1f}% | Processed: {total_processed} | ETA: {eta/60:.1f}m")
        
        # Final statistics
        elapsed_time = time.time() - start_time
        
        with self.SessionLocal as db:
            final_stats = self.get_ingestion_stats(db)
        
        logger.info("=" * 60)
        logger.info("🎉 Frame Ingestion Complete!")
        logger.info(f"📊 Final database state: {final_stats}")
        logger.info(f"⏱️  Total time: {elapsed_time/60:.1f} minutes")
        logger.info(f"📈 Processing rate: {total_processed/(elapsed_time/60):.1f} frames/minute")
        
        return final_stats

async def main():
    """Main entry point"""
    try:
        pipeline = FrameIngestionPipeline()
        await pipeline.run_ingestion()
    except Exception as e:
        logger.error(f"❌ Ingestion pipeline failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())