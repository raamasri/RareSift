#!/usr/bin/env python3
"""
MAXIMUM PARALLEL OpenAI embedding generation script.
Enhanced for fastest possible processing with multiple workers.
"""

import os
import sys
import time
import logging
from pathlib import Path
from typing import List, Optional
import json
import base64
from io import BytesIO
import asyncio
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
from queue import Queue

# Add the backend directory to Python path for imports
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

try:
    import openai
    import psycopg2
    from psycopg2.extras import RealDictCursor
    import numpy as np
    from PIL import Image
except ImportError as e:
    print(f"Missing required dependency: {e}")
    print("Install with: pip install openai psycopg2-binary pillow numpy")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('host_openai_max_parallel.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class MaxParallelOpenAIService:
    """Maximum parallel OpenAI embedding service."""
    
    def __init__(self, api_key: str, max_workers: int = 12):
        self.client = openai.OpenAI(api_key=api_key)
        self.embedding_model = "text-embedding-ada-002"
        self.max_workers = max_workers
        self.batch_size = 15  # Larger batches for max throughput
        
        # Rate limiting (OpenAI allows high concurrency)
        self.requests_per_minute = 3000  # Conservative limit
        self.request_delay = 60.0 / self.requests_per_minute
        
        # Threading controls
        self._request_times = Queue()
        self._lock = threading.Lock()
        
    def _rate_limit(self):
        """Intelligent rate limiting"""
        current_time = time.time()
        
        with self._lock:
            # Remove old request times (older than 1 minute)
            while not self._request_times.empty():
                if current_time - self._request_times.queue[0] > 60:
                    self._request_times.get()
                else:
                    break
            
            # Check if we're under the rate limit
            if self._request_times.qsize() >= self.requests_per_minute:
                sleep_time = 60 - (current_time - self._request_times.queue[0])
                if sleep_time > 0:
                    time.sleep(sleep_time)
            
            self._request_times.put(current_time)

    def create_frame_description(self, image_path: str) -> Optional[str]:
        """Create description for frame image"""
        try:
            self._rate_limit()
            
            # Read and encode image
            with open(image_path, 'rb') as f:
                image_data = f.read()
            image_b64 = base64.b64encode(image_data).decode('utf-8')
            
            response = self.client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[{
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Describe this driving scene image in 1-2 sentences focusing on vehicles, road conditions, traffic, weather, and any notable events or objects."
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}
                        }
                    ]
                }],
                max_tokens=100,
                temperature=0.1
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Error creating frame description for {image_path}: {e}")
            return f"Traffic scene frame from {Path(image_path).stem}"

    def create_embedding(self, text: str) -> Optional[List[float]]:
        """Create embedding for text"""
        try:
            self._rate_limit()
            
            response = self.client.embeddings.create(
                model=self.embedding_model,
                input=text
            )
            
            return response.data[0].embedding
            
        except Exception as e:
            logger.error(f"Error encoding text '{text[:50]}...': {e}")
            return None

    def process_frame_worker(self, frame_data: dict) -> dict:
        """Worker function to process a single frame"""
        frame_id, image_path = frame_data['id'], frame_data['image_path']
        
        try:
            # Create description
            description = self.create_frame_description(image_path)
            if not description:
                return {'id': frame_id, 'success': False, 'error': 'Failed to create description'}
            
            # Create embedding
            embedding = self.create_embedding(description)
            if not embedding:
                return {'id': frame_id, 'success': False, 'error': 'Failed to create embedding'}
            
            return {
                'id': frame_id,
                'success': True,
                'description': description,
                'embedding': embedding
            }
            
        except Exception as e:
            logger.error(f"Error processing frame {frame_id}: {e}")
            return {'id': frame_id, 'success': False, 'error': str(e)}

class DatabaseManager:
    """Database connection and operations manager"""
    
    def __init__(self):
        # Database connection - use Docker defaults
        self.db_params = {
            'host': 'localhost',
            'port': 5432,
            'database': 'raresift',
            'user': 'postgres',
            'password': 'postgres'
        }
    
    def get_connection(self):
        """Get database connection"""
        return psycopg2.connect(**self.db_params)
    
    def get_frames_needing_embeddings(self, limit: int = None) -> List[dict]:
        """Get frames that need OpenAI embeddings"""
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                query = """
                SELECT f.id, f.frame_path as image_path 
                FROM frames f 
                WHERE f.embedding IS NULL 
                AND f.frame_path IS NOT NULL
                ORDER BY f.id
                """
                if limit:
                    query += f" LIMIT {limit}"
                
                cur.execute(query)
                return [dict(row) for row in cur.fetchall()]
    
    def update_frame_embedding(self, frame_id: int, description: str, embedding: List[float]):
        """Update frame with OpenAI embedding"""
        with self.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE frames 
                    SET embedding = %s, description = %s, updated_at = NOW()
                    WHERE id = %s
                """, (json.dumps(embedding), description, frame_id))
                conn.commit()

def main():
    """Main execution function"""
    logger.info("Starting MAXIMUM PARALLEL OpenAI embedding generation")
    
    # Get API key
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is required")
    
    # Initialize services
    embedding_service = MaxParallelOpenAIService(api_key, max_workers=12)
    db_manager = DatabaseManager()
    
    # Get frames needing embeddings
    frames = db_manager.get_frames_needing_embeddings()
    total_frames = len(frames)
    logger.info(f"Found {total_frames} frames needing OpenAI embeddings")
    
    if not frames:
        logger.info("No frames need embeddings. Exiting.")
        return
    
    # Process in parallel batches
    processed = 0
    batch_size = embedding_service.batch_size
    
    with ThreadPoolExecutor(max_workers=embedding_service.max_workers) as executor:
        while processed < total_frames:
            # Get batch
            batch_start = processed
            batch_end = min(processed + batch_size, total_frames)
            batch = frames[batch_start:batch_end]
            
            logger.info(f"Processing batch {processed//batch_size + 1} ({len(batch)} frames)")
            
            # Submit all frames in batch to workers
            future_to_frame = {
                executor.submit(embedding_service.process_frame_worker, frame_data): frame_data 
                for frame_data in batch
            }
            
            # Collect results as they complete
            batch_results = []
            for future in as_completed(future_to_frame):
                result = future.result()
                batch_results.append(result)
                
                # Update database immediately for successful results
                if result['success']:
                    try:
                        db_manager.update_frame_embedding(
                            result['id'], 
                            result['description'], 
                            result['embedding']
                        )
                        logger.info(f"✅ Updated frame {result['id']}")
                    except Exception as e:
                        logger.error(f"Failed to update frame {result['id']}: {e}")
                else:
                    logger.error(f"❌ Failed frame {result['id']}: {result.get('error', 'Unknown error')}")
            
            processed += len(batch)
            
            # Progress update
            percentage = (processed / total_frames) * 100
            logger.info(f"Progress: {processed}/{total_frames} ({percentage:.1f}%)")
            
            # Estimate completion
            if processed > 0:
                avg_time_per_frame = time.time() / processed if processed > 0 else 0
                remaining_frames = total_frames - processed
                estimated_seconds = remaining_frames * avg_time_per_frame
                logger.info(f"Estimated completion in {estimated_seconds//60:.0f} minutes")
    
    logger.info("✅ Maximum parallel OpenAI embedding generation completed!")

if __name__ == "__main__":
    main()