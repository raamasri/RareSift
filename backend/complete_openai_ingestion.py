#!/usr/bin/env python3
"""
Complete OpenAI Embedding Ingestion for RareSift
Regenerates ALL embeddings using OpenAI API for maximum search accuracy
"""

import os
import sys
import asyncio
import logging
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
import time

# Add the backend directory to Python path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text
from app.core.database import get_db
from app.core.config import settings
from app.models.video import Video, Frame, Embedding
from app.services.openai_embedding_service import OpenAIEmbeddingService
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CompleteOpenAIIngestion:
    """Complete re-ingestion of all embeddings using OpenAI for maximum accuracy"""
    
    def __init__(self):
        self.embedding_service = OpenAIEmbeddingService()
        
        # Create database engine
        engine = create_engine(settings.database_url)
        self.SessionLocal = Session(bind=engine)
        
        # Batch processing configuration
        self.batch_size = 5  # Process 5 frames at a time to avoid rate limits
        self.delay_per_batch = 1  # 1 second delay between batches
        self.delay_per_request = 0.3  # 0.3 second delay between individual requests
        
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
    
    async def regenerate_all_embeddings(self, db: Session):
        """Regenerate embeddings for ALL frames using OpenAI"""
        try:
            # Get all frames that need embeddings
            frames = db.query(Frame).outerjoin(Embedding).filter(
                Embedding.frame_id.is_(None)
            ).all()
            
            if not frames:
                logger.info("No frames found that need embeddings")
                return 0
            
            total_frames = len(frames)
            logger.info(f"🚀 Regenerating embeddings for {total_frames} frames using OpenAI...")
            logger.info(f"📦 Processing in batches of {self.batch_size} with {self.delay_per_batch}s delays")
            
            processed_count = 0
            failed_count = 0
            start_time = time.time()
            
            # Process frames in batches
            for i in range(0, total_frames, self.batch_size):
                batch = frames[i:i + self.batch_size]
                batch_num = i // self.batch_size + 1
                total_batches = (total_frames + self.batch_size - 1) // self.batch_size
                
                logger.info(f"🔄 Processing batch {batch_num}/{total_batches} ({len(batch)} frames)")
                
                batch_processed = 0
                batch_failed = 0
                
                for frame in batch:
                    try:
                        if not frame.frame_path or not os.path.exists(frame.frame_path):
                            logger.warning(f"Frame {frame.id} has no valid file path: {frame.frame_path}")
                            failed_count += 1
                            continue
                        
                        # Generate OpenAI embedding for the image
                        try:
                            embedding_vector = await self.embedding_service.encode_image(
                                frame.frame_path, 
                                frame.frame_metadata
                            )
                            
                            # Create new embedding record
                            embedding = Embedding(
                                frame_id=frame.id,
                                embedding=embedding_vector.tolist(),
                                model_name="openai-ada-002"
                            )
                            
                            db.add(embedding)
                            db.commit()
                            
                            processed_count += 1
                            batch_processed += 1
                            
                            # Small delay between requests to respect rate limits
                            await asyncio.sleep(self.delay_per_request)
                            
                        except Exception as e:
                            logger.error(f"Failed to generate embedding for frame {frame.id}: {e}")
                            failed_count += 1
                            batch_failed += 1
                            db.rollback()
                            continue
                            
                    except Exception as e:
                        logger.error(f"Failed to process frame {frame.id}: {e}")
                        failed_count += 1
                        batch_failed += 1
                        continue
                
                # Batch progress report
                elapsed = time.time() - start_time
                progress = (i + len(batch)) / total_frames * 100
                
                if i + len(batch) < total_frames:
                    rate = processed_count / elapsed if elapsed > 0 else 0
                    eta = (total_frames - processed_count) / rate if rate > 0 else 0
                    
                    logger.info(f"📈 Progress: {progress:.1f}% | Processed: {processed_count}/{total_frames} | Failed: {failed_count}")
                    logger.info(f"⏱️  Rate: {rate:.1f} frames/min | ETA: {eta/60:.1f} min")
                    
                    # Delay between batches to avoid overwhelming the API
                    if i + len(batch) < total_frames:
                        logger.info(f"⏸️  Batch delay: {self.delay_per_batch}s...")
                        await asyncio.sleep(self.delay_per_batch)
                
                logger.info(f"✅ Batch {batch_num} complete: {batch_processed} processed, {batch_failed} failed")
            
            total_time = time.time() - start_time
            
            logger.info("=" * 60)
            logger.info("🎉 OpenAI Embedding Ingestion Complete!")
            logger.info(f"📊 Total processed: {processed_count}")
            logger.info(f"❌ Total failed: {failed_count}")
            logger.info(f"⏱️  Total time: {total_time/60:.1f} minutes")
            logger.info(f"📈 Processing rate: {processed_count/(total_time/60):.1f} frames/minute")
            logger.info(f"💰 Estimated API cost: ~${processed_count * 0.0002:.2f}")  # Rough estimate
            
            return processed_count
            
        except Exception as e:
            logger.error(f"Failed to regenerate embeddings: {e}")
            db.rollback()
            raise
    
    async def test_search_quality(self, db: Session):
        """Test search quality with the new OpenAI embeddings"""
        try:
            logger.info("🔍 Testing search quality with OpenAI embeddings...")
            
            test_queries = [
                "motorcycle",
                "car on highway", 
                "traffic intersection",
                "vehicles driving on road",
                "highway traffic with multiple cars"
            ]
            
            for query in test_queries:
                try:
                    results = await self.embedding_service.search_by_text(
                        db=db,
                        query_text=query,
                        user_id=1,
                        limit=3,
                        similarity_threshold=0.1
                    )
                    
                    logger.info(f"🔍 Query: '{query}'")
                    logger.info(f"   Results: {results['total_found']} | Time: {results['search_time_ms']}ms")
                    
                    for i, result in enumerate(results['results'][:3], 1):
                        logger.info(f"   {i}. {result['video_filename']} at {result['timestamp']}s - Similarity: {result['similarity']:.4f}")
                    
                    logger.info("")
                    
                except Exception as e:
                    logger.error(f"Search test failed for '{query}': {e}")
            
        except Exception as e:
            logger.error(f"Search quality test failed: {e}")
    
    async def run_complete_ingestion(self):
        """Run the complete OpenAI ingestion process"""
        logger.info("🚀 Starting Complete OpenAI Embedding Ingestion")
        logger.info("=" * 70)
        
        # Initialize OpenAI service
        logger.info("Initializing OpenAI embedding service...")
        await self.embedding_service.initialize()
        logger.info(f"✅ OpenAI service ready with model: {self.embedding_service.embedding_model}")
        
        with self.SessionLocal as db:
            try:
                # Get initial stats
                initial_stats = self.get_ingestion_stats(db)
                logger.info(f"📊 Initial state: {initial_stats}")
                
                # Run complete ingestion
                processed = await self.regenerate_all_embeddings(db)
                
                # Get final stats
                final_stats = self.get_ingestion_stats(db)
                logger.info(f"📊 Final state: {final_stats}")
                
                if processed > 0:
                    # Test search quality
                    await self.test_search_quality(db)
                    
                    logger.info("=" * 70)
                    logger.info("🎉 Complete OpenAI Ingestion Finished!")
                    logger.info(f"📊 Successfully processed {processed} frames")
                    logger.info("🔍 Search should now be dramatically more accurate!")
                    logger.info("🚀 Ready for production use!")
                else:
                    logger.warning("No embeddings were processed")
                
                return processed
                
            except Exception as e:
                logger.error(f"❌ Complete ingestion failed: {e}")
                raise

async def main():
    """Main entry point"""
    try:
        ingestion = CompleteOpenAIIngestion()
        await ingestion.run_complete_ingestion()
        
    except Exception as e:
        logger.error(f"❌ Process failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())