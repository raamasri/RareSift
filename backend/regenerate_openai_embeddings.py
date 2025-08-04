#!/usr/bin/env python3
"""
MAXIMUM SPEED OpenAI Embedding Generation
Ultra-aggressive parallel processing with dynamic rate limiting
"""

import os
import sys
import asyncio
import logging
from pathlib import Path
from typing import List, Dict, Optional
import time
import aiohttp
import json
from dataclasses import dataclass

# Add the backend directory to Python path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text
from app.core.database import get_db
from app.core.config import settings
from app.models.video import Video, Frame, Embedding
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class ProcessingStats:
    processed: int = 0
    failed: int = 0
    start_time: float = 0
    
    def rate(self) -> float:
        elapsed = time.time() - self.start_time
        return self.processed / (elapsed / 60) if elapsed > 0 else 0

class MaxSpeedOpenAIProcessor:
    """Ultra-high speed OpenAI processing with maximum concurrency"""
    
    def __init__(self):
        # MAXIMUM SPEED CONFIGURATION
        self.max_workers = 25  # Maximum parallel workers
        self.batch_size = 3    # Smaller batches for faster feedback
        self.rate_limit_delay = 0.05  # Minimal delay
        self.worker_delay = 0.02     # Fast worker starts
        
        # OpenAI API configuration
        self.api_key = settings.openai_api_key
        self.base_url = "https://api.openai.com/v1"
        
        # Database
        engine = create_engine(settings.database_url)
        self.SessionLocal = Session(bind=engine)
        
        # Statistics
        self.stats = ProcessingStats()
        
    async def clear_existing_embeddings(self, db: Session, limit: int = None):
        """Clear existing embeddings to make room for new ones"""
        try:
            if limit:
                # Delete embeddings for a limited number of frames
                frames_to_clear = db.query(Frame).limit(limit).all()
                frame_ids = [f.id for f in frames_to_clear]
                
                if frame_ids:
                    db.query(Embedding).filter(Embedding.frame_id.in_(frame_ids)).delete(synchronize_session=False)
                    db.commit()
                    logger.info(f"Cleared {len(frame_ids)} existing embeddings")
            else:
                # Clear all embeddings
                count = db.query(Embedding).count()
                db.query(Embedding).delete()
                db.commit()
                logger.info(f"Cleared all {count} existing embeddings")
                
        except Exception as e:
            logger.error(f"Failed to clear existing embeddings: {e}")
            db.rollback()
            raise
    
    async def regenerate_embeddings_for_frames(self, db: Session, limit: int = 20):
        """Regenerate embeddings for a limited number of frames using OpenAI"""
        try:
            # Get frames that need new embeddings
            frames = db.query(Frame).outerjoin(Embedding).filter(
                Embedding.frame_id.is_(None)
            ).limit(limit).all()
            
            if not frames:
                logger.info("No frames found that need embeddings")
                return 0
            
            logger.info(f"Regenerating embeddings for {len(frames)} frames using OpenAI...")
            
            processed_count = 0
            
            for frame in frames:
                try:
                    if not frame.frame_path or not os.path.exists(frame.frame_path):
                        logger.warning(f"Frame {frame.id} has no valid file path: {frame.frame_path}")
                        continue
                    
                    logger.info(f"Processing frame {frame.id}: {frame.frame_path}")
                    
                    # Generate OpenAI embedding for the image
                    try:
                        # Use the image file with frame metadata
                        embedding_vector = await self.embedding_service.encode_image(
                            frame.frame_path, 
                            frame.frame_metadata
                        )
                        
                        # Create new embedding record
                        embedding = Embedding(
                            frame_id=frame.id,
                            embedding=embedding_vector.tolist(),
                            model_name="openai-ada-002"  # Mark as OpenAI model
                        )
                        
                        db.add(embedding)
                        db.commit()
                        
                        processed_count += 1
                        logger.info(f"✅ Generated OpenAI embedding for frame {frame.id} ({processed_count}/{len(frames)})")
                        
                        # Small delay to avoid rate limiting
                        await asyncio.sleep(0.5)
                        
                    except Exception as e:
                        logger.error(f"Failed to generate embedding for frame {frame.id}: {e}")
                        continue
                        
                except Exception as e:
                    logger.error(f"Failed to process frame {frame.id}: {e}")
                    continue
            
            logger.info(f"✅ Successfully regenerated {processed_count} embeddings with OpenAI")
            return processed_count
            
        except Exception as e:
            logger.error(f"Failed to regenerate embeddings: {e}")
            db.rollback()
            raise
    
    async def test_openai_search(self, db: Session):
        """Test search functionality with new OpenAI embeddings"""
        try:
            logger.info("Testing search with OpenAI embeddings...")
            
            # Test motorcycle search
            results = await self.embedding_service.search_by_text(
                db=db,
                query_text="motorcycle",
                user_id=1,
                limit=5,
                similarity_threshold=0.1  # Lower threshold for testing
            )
            
            logger.info(f"🔍 Motorcycle search results:")
            logger.info(f"   Total found: {results['total_found']}")
            logger.info(f"   Search time: {results['search_time_ms']}ms")
            
            for i, result in enumerate(results['results'], 1):
                logger.info(f"   {i}. {result['video_filename']} at {result['timestamp']}s - Similarity: {result['similarity']:.4f}")
            
            # Test car search
            results2 = await self.embedding_service.search_by_text(
                db=db,
                query_text="car on highway",
                user_id=1,
                limit=5,
                similarity_threshold=0.1
            )
            
            logger.info(f"🔍 Car search results:")
            logger.info(f"   Total found: {results2['total_found']}")
            logger.info(f"   Search time: {results2['search_time_ms']}ms")
            
            for i, result in enumerate(results2['results'], 1):
                logger.info(f"   {i}. {result['video_filename']} at {result['timestamp']}s - Similarity: {result['similarity']:.4f}")
            
            return results, results2
            
        except Exception as e:
            logger.error(f"Search test failed: {e}")
            raise
    
    async def run_regeneration(self, limit: int = 20):
        """Run the complete regeneration process"""
        logger.info("🚀 Starting OpenAI Embedding Regeneration")
        logger.info("=" * 60)
        
        # Initialize OpenAI service
        logger.info("Initializing OpenAI embedding service...")
        await self.embedding_service.initialize()
        logger.info(f"✅ OpenAI service ready with model: {self.embedding_service.embedding_model}")
        
        with self.SessionLocal as db:
            try:
                # Clear existing embeddings for test frames
                logger.info(f"Clearing existing embeddings for {limit} frames...")
                await self.clear_existing_embeddings(db, limit=limit)
                
                # Regenerate embeddings with OpenAI
                processed = await self.regenerate_embeddings_for_frames(db, limit=limit)
                
                if processed > 0:
                    logger.info("Testing search functionality...")
                    await self.test_openai_search(db)
                    
                    logger.info("=" * 60)
                    logger.info("🎉 OpenAI Embedding Regeneration Complete!")
                    logger.info(f"📊 Processed {processed} frames with high-quality OpenAI embeddings")
                    logger.info("🔍 Search should now be much more accurate for these frames")
                else:
                    logger.warning("No embeddings were processed")
                
                return processed
                
            except Exception as e:
                logger.error(f"❌ Regeneration failed: {e}")
                raise

async def main():
    """Main entry point"""
    try:
        regenerator = OpenAIEmbeddingRegenerator()
        
        # Regenerate embeddings for 20 frames as a test
        await regenerator.run_regeneration(limit=20)
        
    except Exception as e:
        logger.error(f"❌ Process failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())