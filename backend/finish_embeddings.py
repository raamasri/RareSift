#!/usr/bin/env python3
"""
Simple single-threaded completion of remaining OpenAI embeddings
Reliable approach to finish the last few hundred frames
"""

import os
import sys
import asyncio
import logging
from pathlib import Path

# Add the backend directory to Python path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from app.core.database import get_db
from app.core.config import settings
from app.models.video import Video, Frame, Embedding
from app.services.openai_embedding_service import OpenAIEmbeddingService
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def finish_remaining_embeddings():
    """Simple single-threaded completion of remaining embeddings"""
    
    # Initialize OpenAI service
    embedding_service = OpenAIEmbeddingService()
    await embedding_service.initialize()
    logger.info("✅ OpenAI service initialized")
    
    # Create database session
    engine = create_engine(settings.database_url)
    
    with Session(bind=engine) as db:
        # Get remaining frames
        frames = db.query(Frame).outerjoin(Embedding).filter(
            Embedding.frame_id.is_(None)
        ).all()
        
        total_remaining = len(frames)
        logger.info(f"🎯 Finishing {total_remaining} remaining frames...")
        
        if total_remaining == 0:
            logger.info("🎉 All embeddings are complete!")
            return
        
        processed = 0
        failed = 0
        start_time = time.time()
        
        for i, frame in enumerate(frames, 1):
            try:
                if not frame.frame_path or not os.path.exists(frame.frame_path):
                    logger.warning(f"Frame {frame.id} has no valid file: {frame.frame_path}")
                    failed += 1
                    continue
                
                # Generate embedding
                embedding_vector = await embedding_service.encode_image(
                    frame.frame_path, 
                    frame.frame_metadata
                )
                
                # Save to database
                embedding = Embedding(
                    frame_id=frame.id,
                    embedding=embedding_vector.tolist(),
                    model_name="openai-ada-002"
                )
                
                db.add(embedding)
                db.commit()
                processed += 1
                
                # Progress update every 10 frames
                if i % 10 == 0 or i == total_remaining:
                    elapsed = time.time() - start_time
                    rate = processed / (elapsed / 60) if elapsed > 0 else 0
                    eta = (total_remaining - i) / rate if rate > 0 else 0
                    
                    logger.info(f"✅ Progress: {i}/{total_remaining} ({i/total_remaining*100:.1f}%) | "
                              f"Processed: {processed} | Failed: {failed} | "
                              f"Rate: {rate:.1f}/min | ETA: {eta:.1f}min")
                
                # Small delay to be gentle on API
                await asyncio.sleep(0.2)
                
            except Exception as e:
                logger.error(f"Failed to process frame {frame.id}: {e}")
                failed += 1
                db.rollback()
                continue
        
        total_time = time.time() - start_time
        final_rate = processed / (total_time / 60) if total_time > 0 else 0
        
        logger.info("=" * 60)
        logger.info("🎉 EMBEDDING COMPLETION FINISHED!")
        logger.info(f"✅ Successfully processed: {processed}")
        logger.info(f"❌ Failed: {failed}")
        logger.info(f"⏱️  Total time: {total_time/60:.1f} minutes")
        logger.info(f"📈 Final rate: {final_rate:.1f} frames/minute")
        
        # Final count check
        final_count = db.query(Embedding).count()
        total_frames = db.query(Frame).count()
        completion_rate = (final_count / total_frames) * 100
        
        logger.info(f"🎯 Final embeddings: {final_count}/{total_frames} ({completion_rate:.1f}% complete)")
        
        if completion_rate >= 99.5:
            logger.info("🏆 MISSION ACCOMPLISHED! Nearly 100% completion achieved!")
        
        return processed

async def main():
    """Main entry point"""
    try:
        await finish_remaining_embeddings()
    except Exception as e:
        logger.error(f"❌ Completion failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())