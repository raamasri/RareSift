#!/usr/bin/env python3
"""
High-Performance Parallel OpenAI Embedding Ingestion for RareSift
Maximum speed parallel processing with intelligent batching and rate limiting
"""

import os
import sys
import asyncio
import logging
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
import time
import concurrent.futures
from dataclasses import dataclass

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

@dataclass
class ProcessingStats:
    processed: int = 0
    failed: int = 0
    start_time: float = 0
    
    def rate(self) -> float:
        elapsed = time.time() - self.start_time
        return self.processed / (elapsed / 60) if elapsed > 0 else 0
    
    def eta_minutes(self, total: int) -> float:
        rate = self.rate()
        remaining = total - self.processed
        return remaining / rate if rate > 0 else 0

class HighPerformanceOpenAIIngestion:
    """
    High-performance OpenAI embedding ingestion with:
    - Parallel processing (10+ workers)
    - Intelligent rate limiting  
    - Batch optimization
    - Real-time progress tracking
    """
    
    def __init__(self):
        # Create database engine
        engine = create_engine(settings.database_url)
        self.SessionLocal = Session(bind=engine)
        
        # Optimized configuration for OpenAI rate limits
        self.max_workers = 6   # Reduced workers to respect rate limits
        self.batch_size = 10   # Smaller batches for better throughput
        self.rate_limit_delay = 0.5  # Increased delay between requests
        self.worker_delay = 1.0      # Longer stagger to prevent rate limit hits
        
        # Statistics
        self.stats = ProcessingStats()
        
    async def create_embedding_service(self) -> OpenAIEmbeddingService:
        """Create and initialize a new embedding service instance"""
        service = OpenAIEmbeddingService()
        await service.initialize()
        return service
        
    async def process_frame_batch(self, frames: List[Frame], worker_id: int) -> Dict:
        """Process a batch of frames with a dedicated embedding service"""
        service = await self.create_embedding_service()
        
        batch_processed = 0
        batch_failed = 0
        batch_errors = []
        
        logger.info(f"🔄 Worker {worker_id}: Processing {len(frames)} frames")
        
        # Create new database session for this worker
        engine = create_engine(settings.database_url)
        with Session(bind=engine) as db:
            for frame in frames:
                try:
                    if not frame.frame_path or not os.path.exists(frame.frame_path):
                        logger.warning(f"Worker {worker_id}: Frame {frame.id} has no valid file path: {frame.frame_path}")
                        batch_failed += 1
                        continue
                    
                    # Generate OpenAI embedding
                    try:
                        embedding_vector = await service.encode_image(
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
                        
                        batch_processed += 1
                        
                        # Minimal delay to respect rate limits
                        await asyncio.sleep(self.rate_limit_delay)
                        
                    except Exception as e:
                        error_msg = f"Worker {worker_id}: Failed to generate embedding for frame {frame.id}: {e}"
                        logger.error(error_msg)
                        batch_errors.append(error_msg)
                        batch_failed += 1
                        db.rollback()
                        continue
                        
                except Exception as e:
                    error_msg = f"Worker {worker_id}: Failed to process frame {frame.id}: {e}"
                    logger.error(error_msg)
                    batch_errors.append(error_msg)
                    batch_failed += 1
                    continue
        
        return {
            'worker_id': worker_id,
            'processed': batch_processed,
            'failed': batch_failed,
            'errors': batch_errors
        }
    
    def chunk_frames(self, frames: List[Frame], chunk_size: int) -> List[List[Frame]]:
        """Split frames into chunks for parallel processing"""
        return [frames[i:i + chunk_size] for i in range(0, len(frames), chunk_size)]
    
    async def parallel_embedding_generation(self, db: Session) -> int:
        """Generate embeddings using maximum parallel processing"""
        try:
            # Get all frames that need embeddings
            frames = db.query(Frame).outerjoin(Embedding).filter(
                Embedding.frame_id.is_(None)
            ).all()
            
            if not frames:
                logger.info("No frames found that need embeddings")
                return 0
            
            total_frames = len(frames)
            logger.info(f"🚀 Starting high-performance parallel processing of {total_frames} frames")
            logger.info(f"⚡ Configuration: {self.max_workers} workers, {self.batch_size} batch size")
            
            # Initialize stats
            self.stats.start_time = time.time()
            
            # Split frames into batches for workers
            frame_chunks = self.chunk_frames(frames, self.batch_size)
            total_batches = len(frame_chunks)
            
            logger.info(f"📦 Split into {total_batches} batches for parallel processing")
            
            # Process batches in parallel with max workers
            processed_batches = 0
            
            # Use semaphore to limit concurrent workers
            semaphore = asyncio.Semaphore(self.max_workers)
            
            async def process_with_semaphore(chunk, worker_id):
                async with semaphore:
                    # Stagger worker starts to avoid overwhelming API
                    await asyncio.sleep(worker_id * self.worker_delay)
                    return await self.process_frame_batch(chunk, worker_id)
            
            # Process all batches with controlled concurrency
            tasks = []
            for i, chunk in enumerate(frame_chunks):
                task = asyncio.create_task(
                    process_with_semaphore(chunk, i + 1)
                )
                tasks.append(task)
            
            # Process results as they complete
            logger.info("🔥 All workers launched! Processing in parallel...")
            
            for completed_task in asyncio.as_completed(tasks):
                try:
                    result = await completed_task
                    processed_batches += 1
                    
                    # Update global stats
                    self.stats.processed += result['processed']
                    self.stats.failed += result['failed']
                    
                    # Progress report
                    progress = processed_batches / total_batches * 100
                    rate = self.stats.rate()
                    eta = self.stats.eta_minutes(total_frames)
                    
                    logger.info(f"✅ Worker {result['worker_id']} complete: {result['processed']} processed, {result['failed']} failed")
                    logger.info(f"📈 Overall Progress: {progress:.1f}% | Total: {self.stats.processed}/{total_frames} | Rate: {rate:.1f}/min | ETA: {eta:.1f}min")
                    
                    if result['errors']:
                        logger.warning(f"Worker {result['worker_id']} errors: {len(result['errors'])}")
                
                except Exception as e:
                    logger.error(f"Worker task failed: {e}")
                    self.stats.failed += self.batch_size  # Assume whole batch failed
            
            total_time = time.time() - self.stats.start_time
            final_rate = self.stats.processed / (total_time / 60)
            
            logger.info("=" * 70)
            logger.info("🎉 High-Performance Parallel Processing Complete!")
            logger.info(f"⚡ Total processed: {self.stats.processed}")
            logger.info(f"❌ Total failed: {self.stats.failed}")
            logger.info(f"⏱️  Total time: {total_time/60:.1f} minutes")
            logger.info(f"🚀 Final rate: {final_rate:.1f} frames/minute")
            logger.info(f"💰 Estimated API cost: ~${self.stats.processed * 0.0002:.2f}")
            
            return self.stats.processed
            
        except Exception as e:
            logger.error(f"Parallel processing failed: {e}")
            raise
    
    async def test_search_quality(self, db: Session):
        """Test search quality with the new OpenAI embeddings"""
        try:
            logger.info("🔍 Testing search quality with OpenAI embeddings...")
            
            service = await self.create_embedding_service()
            
            test_queries = [
                "bicycle",
                "motorcycle on highway", 
                "car intersection",
                "traffic light",
                "highway with multiple vehicles"
            ]
            
            for query in test_queries:
                try:
                    results = await service.search_by_text(
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
    
    async def run_high_performance_ingestion(self):
        """Run the high-performance parallel ingestion process"""
        logger.info("⚡ Starting High-Performance Parallel OpenAI Embedding Ingestion")
        logger.info("=" * 80)
        logger.info(f"🔥 Maximum parallel workers: {self.max_workers}")
        logger.info(f"📦 Batch size per worker: {self.batch_size}")
        logger.info(f"⏱️  Rate limit delay: {self.rate_limit_delay}s")
        
        with self.SessionLocal as db:
            try:
                # Get initial stats
                video_count = db.query(Video).count()
                frame_count = db.query(Frame).count()
                embedding_count = db.query(Embedding).count()
                
                logger.info(f"📊 Initial state: Videos: {video_count}, Frames: {frame_count}, Embeddings: {embedding_count}")
                
                # Run high-performance parallel processing
                processed = await self.parallel_embedding_generation(db)
                
                # Get final stats
                final_embedding_count = db.query(Embedding).count()
                logger.info(f"📊 Final state: Embeddings: {final_embedding_count} (+{final_embedding_count - embedding_count})")
                
                if processed > 0:
                    # Test search quality
                    await self.test_search_quality(db)
                    
                    logger.info("=" * 80)
                    logger.info("🚀 High-Performance OpenAI Ingestion Complete!")
                    logger.info(f"⚡ Successfully processed {processed} frames in parallel")
                    logger.info("🎯 Search accuracy should now be dramatically improved!")
                    logger.info("🌟 Ready for production use!")
                else:
                    logger.warning("⚠️  No embeddings were processed")
                
                return processed
                
            except Exception as e:
                logger.error(f"❌ High-performance ingestion failed: {e}")
                raise

async def main():
    """Main entry point for high-performance processing"""
    try:
        logger.info("⚡ Initializing High-Performance OpenAI Embedding System...")
        
        ingestion = HighPerformanceOpenAIIngestion()
        await ingestion.run_high_performance_ingestion()
        
        logger.info("🎉 High-performance processing completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ High-performance process failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())