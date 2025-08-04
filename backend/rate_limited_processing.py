#!/usr/bin/env python3
"""
Rate-limited OpenAI embedding processing example
Demonstrates proper rate limiting and cost control for production use
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

async def process_with_rate_limiting():
    """
    Process embeddings with proper rate limiting and cost control
    This is the SAFE way to process large batches in production
    """
    
    # Initialize OpenAI service with rate limiting
    embedding_service = OpenAIEmbeddingService()
    await embedding_service.initialize()
    logger.info("✅ OpenAI service with rate limiting initialized")
    
    # Check initial rate limit status
    status = embedding_service.get_rate_limit_status()
    logger.info(f"📊 Initial rate limit status:")
    logger.info(f"   RPM: {status['requests_per_minute']['current']}/{status['requests_per_minute']['limit']} ({status['requests_per_minute']['percentage']:.1f}%)")
    logger.info(f"   Daily cost: ${status['daily_cost']['current']:.4f}/${status['daily_cost']['limit']:.2f}")
    
    # Create database session
    engine = create_engine(settings.database_url)
    
    with Session(bind=engine) as db:
        # Get remaining frames to process
        frames = db.query(Frame).outerjoin(Embedding).filter(
            Embedding.frame_id.is_(None)
        ).limit(100).all()  # Process in smaller batches
        
        total_remaining = len(frames)
        logger.info(f"🎯 Processing {total_remaining} frames with rate limiting...")
        
        if total_remaining == 0:
            logger.info("🎉 All embeddings are complete!")
            return
        
        # Check if we can process this batch
        batch_check = await embedding_service.check_rate_limits_before_batch(
            estimated_requests=total_remaining,
            estimated_tokens_per_request=150
        )
        
        if not batch_check['can_proceed']:
            logger.warning("⚠️ Batch processing would exceed rate limits:")
            for warning in batch_check['warnings']:
                logger.warning(f"   • {warning}")
            logger.info("💡 Recommendations:")
            for rec in batch_check['recommendations']:
                logger.info(f"   • {rec}")
            return
        
        logger.info(f"💰 Estimated cost for batch: ${batch_check['estimated_cost']:.4f}")
        
        # Process frames one by one with rate limiting
        processed = 0
        errors = 0
        start_time = time.time()
        
        for i, frame in enumerate(frames):
            try:
                # Check if we already have embedding
                existing = db.query(Embedding).filter(Embedding.frame_id == frame.id).first()
                if existing:
                    logger.debug(f"Skipping frame {frame.id} (already has embedding)")
                    continue
                
                # Load frame file
                frame_path = Path(frame.frame_path)
                if not frame_path.exists():
                    logger.warning(f"Frame file not found: {frame.frame_path}")
                    continue
                
                # Generate embedding (rate limiting is handled internally)
                try:
                    embedding_vector = await embedding_service.encode_image(str(frame_path))
                    
                    # Save embedding to database
                    embedding = Embedding(
                        frame_id=frame.id,
                        video_id=frame.video_id,
                        embedding=embedding_vector.tolist()
                    )
                    db.add(embedding)
                    db.commit()
                    
                    processed += 1
                    
                    # Progress logging
                    if processed % 10 == 0:
                        elapsed = time.time() - start_time
                        rate = processed / elapsed if elapsed > 0 else 0
                        
                        # Get current rate limit status
                        current_status = embedding_service.get_rate_limit_status()
                        
                        logger.info(f"✅ Progress: {processed}/{total_remaining} frames ({processed/total_remaining*100:.1f}%)")
                        logger.info(f"   Rate: {rate:.2f} frames/sec")
                        logger.info(f"   RPM: {current_status['requests_per_minute']['current']}/{current_status['requests_per_minute']['limit']}")
                        logger.info(f"   Cost: ${current_status['daily_cost']['current']:.4f}")
                
                except Exception as e:
                    # Rate limiting errors vs other errors
                    if "Rate limit exceeded" in str(e):
                        logger.warning(f"⏳ Rate limit hit for frame {frame.id}: {e}")
                        # Wait a bit and continue (don't count as error)
                        await asyncio.sleep(5)
                    else:
                        logger.error(f"❌ Failed to process frame {frame.id}: {e}")
                        errors += 1
                
            except Exception as e:
                logger.error(f"❌ Unexpected error processing frame {frame.id}: {e}")
                errors += 1
        
        # Final statistics
        elapsed = time.time() - start_time
        final_status = embedding_service.get_rate_limit_status()
        
        logger.info("\n" + "="*50)
        logger.info("🎉 Batch processing complete!")
        logger.info(f"   ✅ Processed: {processed} frames")
        logger.info(f"   ❌ Errors: {errors} frames")
        logger.info(f"   ⏱️  Time: {elapsed:.1f} seconds")
        logger.info(f"   📈 Rate: {processed/elapsed:.2f} frames/sec")
        logger.info(f"   💰 Total cost: ${final_status['daily_cost']['current']:.4f}")
        logger.info("="*50)

async def monitor_rate_limits():
    """
    Just monitor current rate limiting status without processing
    """
    embedding_service = OpenAIEmbeddingService()
    await embedding_service.initialize()
    
    status = embedding_service.get_rate_limit_status()
    
    print("\n" + "="*60)
    print("📊 OpenAI Rate Limiting Status")
    print("="*60)
    
    print(f"Requests per Minute:")
    print(f"  Current: {status['requests_per_minute']['current']}")
    print(f"  Limit:   {status['requests_per_minute']['limit']}")
    print(f"  Usage:   {status['requests_per_minute']['percentage']:.1f}%")
    
    print(f"\nTokens per Minute:")
    print(f"  Current: {status['tokens_per_minute']['current']:,}")
    print(f"  Limit:   {status['tokens_per_minute']['limit']:,}")
    print(f"  Usage:   {status['tokens_per_minute']['percentage']:.1f}%")
    
    print(f"\nConcurrent Requests:")
    print(f"  Current: {status['concurrent_requests']['current']}")
    print(f"  Limit:   {status['concurrent_requests']['limit']}")
    print(f"  Usage:   {status['concurrent_requests']['percentage']:.1f}%")
    
    print(f"\nDaily Cost:")
    print(f"  Current: ${status['daily_cost']['current']:.4f}")
    print(f"  Limit:   ${status['daily_cost']['limit']:.2f}")
    print(f"  Usage:   {status['daily_cost']['percentage']:.1f}%")
    
    print(f"\nLast Reset: {status['last_reset']}")
    print("="*60)

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Rate-limited OpenAI processing")
    parser.add_argument("--action", choices=["process", "monitor"], default="monitor",
                       help="Action to perform")
    
    args = parser.parse_args()
    
    if args.action == "process":
        print("🚀 Starting rate-limited processing...")
        asyncio.run(process_with_rate_limiting())
    else:
        print("📊 Monitoring rate limits...")
        asyncio.run(monitor_rate_limits())