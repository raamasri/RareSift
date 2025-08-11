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
        
    async def create_session(self):
        """Create HTTP session with optimized settings"""
        connector = aiohttp.TCPConnector(
            limit=100,  # Max connections
            limit_per_host=30,  # Max per host
            ttl_dns_cache=300,
            use_dns_cache=True,
        )
        
        timeout = aiohttp.ClientTimeout(total=30, connect=10)
        
        return aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
        )
    
    async def encode_image_direct(self, session: aiohttp.ClientSession, image_path: str) -> Optional[np.ndarray]:
        """Direct OpenAI API call for maximum speed"""
        try:
            # Read and encode image
            import base64
            with open(image_path, "rb") as f:
                image_data = base64.b64encode(f.read()).decode('utf-8')
            
            # Vision API call
            vision_payload = {
                "model": "gpt-4o",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Describe this traffic/driving scene in detail. Focus on: vehicles (cars, trucks, motorcycles, bicycles), road infrastructure (traffic lights, signs, intersections), weather conditions, time of day, and any notable traffic situations. Be specific about vehicle types, colors, and positions."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_data}",
                                    "detail": "low"  # Faster processing
                                }
                            }
                        ]
                    }
                ],
                "max_tokens": 150  # Reduced for speed
            }
            
            # Make vision request with retry logic
            for attempt in range(3):
                async with session.post(f"{self.base_url}/chat/completions", json=vision_payload) as response:
                    if response.status == 429:
                        # Rate limited - exponential backoff
                        wait_time = (2 ** attempt) * 0.5
                        await asyncio.sleep(wait_time)
                        continue
                    elif response.status != 200:
                        logger.error(f"Vision API error {response.status}: {await response.text()}")
                        return None
                    
                    vision_result = await response.json()
                    description = vision_result['choices'][0]['message']['content']
                    break
            else:
                return None
            
            # Embedding API call
            embedding_payload = {
                "model": "text-embedding-ada-002",
                "input": description
            }
            
            for attempt in range(3):
                async with session.post(f"{self.base_url}/embeddings", json=embedding_payload) as response:
                    if response.status == 429:
                        wait_time = (2 ** attempt) * 0.5
                        await asyncio.sleep(wait_time)
                        continue
                    elif response.status != 200:
                        logger.error(f"Embedding API error {response.status}: {await response.text()}")
                        return None
                    
                    embedding_result = await response.json()
                    embedding = np.array(embedding_result['data'][0]['embedding'], dtype=np.float32)
                    
                    # Normalize
                    embedding = embedding / np.linalg.norm(embedding)
                    return embedding
            
            return None
                
        except Exception as e:
            logger.error(f"Direct encoding failed for {image_path}: {e}")
            return None
    
    async def process_frame_batch_ultra(self, frames: List[Frame], worker_id: int) -> Dict:
        """Ultra-fast batch processing"""
        session = await self.create_session()
        
        batch_processed = 0
        batch_failed = 0
        
        logger.info(f"🚀 Worker {worker_id}: Processing {len(frames)} frames")
        
        try:
            # Create database session
            engine = create_engine(settings.database_url)
            with Session(bind=engine) as db:
                for frame in frames:
                    try:
                        if not frame.frame_path or not os.path.exists(frame.frame_path):
                            batch_failed += 1
                            continue
                        
                        # Direct API call for maximum speed
                        embedding_vector = await self.encode_image_direct(session, frame.frame_path)
                        
                        if embedding_vector is not None:
                            # Save to database
                            embedding = Embedding(
                                frame_id=frame.id,
                                embedding=embedding_vector.tolist(),
                                model_name="openai-ada-002"
                            )
                            
                            db.add(embedding)
                            db.commit()
                            batch_processed += 1
                        else:
                            batch_failed += 1
                        
                        # Minimal delay
                        await asyncio.sleep(self.rate_limit_delay)
                        
                    except Exception as e:
                        logger.error(f"Worker {worker_id}: Frame {frame.id} failed: {e}")
                        batch_failed += 1
                        continue
        
        finally:
            await session.close()
        
        return {
            'worker_id': worker_id,
            'processed': batch_processed,
            'failed': batch_failed
        }
    
    async def ultra_parallel_processing(self) -> int:
        """Maximum speed parallel processing"""
        with self.SessionLocal as db:
            # Get frames needing embeddings
            frames = db.query(Frame).outerjoin(Embedding).filter(
                Embedding.frame_id.is_(None)
            ).all()
            
            if not frames:
                logger.info("No frames need processing")
                return 0
            
            total_frames = len(frames)
            logger.info(f"🔥 MAXIMUM SPEED PROCESSING: {total_frames} frames")
            logger.info(f"⚡ Config: {self.max_workers} workers, {self.batch_size} batch size")
            
            self.stats.start_time = time.time()
            
            # Split into batches
            frame_chunks = [frames[i:i + self.batch_size] for i in range(0, len(frames), self.batch_size)]
            
            # Process with maximum concurrency
            semaphore = asyncio.Semaphore(self.max_workers)
            
            async def process_with_limit(chunk, worker_id):
                async with semaphore:
                    await asyncio.sleep(worker_id * self.worker_delay)
                    return await self.process_frame_batch_ultra(chunk, worker_id)
            
            # Launch all workers
            tasks = [
                asyncio.create_task(process_with_limit(chunk, i + 1))
                for i, chunk in enumerate(frame_chunks)
            ]
            
            logger.info(f"🚀 Launched {len(tasks)} parallel workers!")
            
            # Process results
            completed = 0
            for task in asyncio.as_completed(tasks):
                try:
                    result = await task
                    completed += 1
                    
                    self.stats.processed += result['processed']
                    self.stats.failed += result['failed']
                    
                    rate = self.stats.rate()
                    progress = completed / len(tasks) * 100
                    eta_min = ((total_frames - self.stats.processed) / rate) if rate > 0 else 0
                    
                    logger.info(f"✅ Worker {result['worker_id']}: {result['processed']} done | Progress: {progress:.1f}% | Rate: {rate:.1f}/min | ETA: {eta_min:.1f}min")
                    
                except Exception as e:
                    logger.error(f"Worker failed: {e}")
            
            total_time = time.time() - self.stats.start_time
            final_rate = self.stats.processed / (total_time / 60)
            
            logger.info("=" * 80)
            logger.info("🎉 MAXIMUM SPEED PROCESSING COMPLETE!")
            logger.info(f"⚡ Processed: {self.stats.processed}")
            logger.info(f"❌ Failed: {self.stats.failed}")
            logger.info(f"⏱️  Time: {total_time/60:.1f} minutes")
            logger.info(f"🚀 Rate: {final_rate:.1f} frames/minute")
            
            return self.stats.processed

async def main():
    """Ultra-high speed main entry point"""
    try:
        logger.info("🔥 STARTING MAXIMUM SPEED OPENAI PROCESSING")
        
        processor = MaxSpeedOpenAIProcessor()
        await processor.ultra_parallel_processing()
        
        logger.info("🎉 Maximum speed processing complete!")
        
    except Exception as e:
        logger.error(f"❌ Ultra processing failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())