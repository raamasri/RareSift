#!/usr/bin/env python3
"""
OPTIMIZED Host-based OpenAI embedding generation script.
Enhanced for faster processing with larger batches and reduced delays.
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
from concurrent.futures import ThreadPoolExecutor

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
        logging.FileHandler('host_openai_optimized.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class OptimizedOpenAIEmbeddingService:
    """Optimized OpenAI embedding service with better performance."""
    
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)
        self.embedding_model = "text-embedding-ada-002"
        self.vision_model = "gpt-4o"
        
    def encode_image_base64(self, image_path: str) -> str:
        """Convert image to base64 for OpenAI API."""
        try:
            with open(image_path, "rb") as image_file:
                image_data = image_file.read()
                # Resize image if too large (OpenAI has size limits)
                img = Image.open(BytesIO(image_data))
                if img.size[0] > 1024 or img.size[1] > 1024:
                    img.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
                    buffer = BytesIO()
                    img.save(buffer, format='JPEG', quality=85)
                    image_data = buffer.getvalue()
                
                return base64.b64encode(image_data).decode('utf-8')
        except Exception as e:
            logger.error(f"Error encoding image {image_path}: {e}")
            raise
    
    def create_frame_description(self, image_path: str) -> str:
        """Generate detailed description of a traffic scene using GPT-4o."""
        try:
            base64_image = self.encode_image_base64(image_path)
            
            response = self.client.chat.completions.create(
                model=self.vision_model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": """Analyze this traffic/driving scene and provide a detailed description focusing on:

1. Vehicles (cars, trucks, motorcycles, bicycles, buses)
2. Road infrastructure (highway, street, intersection, bridge)
3. Traffic conditions and weather
4. Notable objects or scenarios

Be specific about vehicle types, road markings, and distinctive features for search."""
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=250  # Reduced from 300 for faster processing
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error creating frame description for {image_path}: {e}")
            # Fallback description based on filename/path
            return f"Traffic scene frame from {Path(image_path).name}"
    
    def encode_text(self, text: str) -> List[float]:
        """Generate embedding for text using OpenAI API."""
        try:
            response = self.client.embeddings.create(
                model=self.embedding_model,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error encoding text '{text[:50]}...': {e}")
            raise

def get_database_connection():
    """Create database connection to containerized PostgreSQL."""
    try:
        conn = psycopg2.connect(
            host="127.0.0.1",  # Use explicit IPv4 address
            port=5432,
            database="raresift",
            user="postgres",
            password="postgres"
        )
        return conn
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise

def get_frames_without_embeddings(conn, batch_size: int = 8) -> List[dict]:
    """Get frames that need OpenAI embeddings."""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT f.id, f.frame_path, f.timestamp, v.original_filename as video_title
            FROM frames f
            JOIN videos v ON f.video_id = v.id
            WHERE f.embedding IS NULL
            ORDER BY f.id
            LIMIT %s
        """, (batch_size,))
        return cur.fetchall()

def update_frame_embedding(conn, frame_id: int, embedding: List[float], description: str):
    """Update frame with OpenAI embedding."""
    try:
        with conn.cursor() as cur:
            # Convert embedding to string format for pgvector
            embedding_str = '[' + ','.join(map(str, embedding)) + ']'
            
            cur.execute("""
                UPDATE frames 
                SET embedding = %s::vector, 
                    description = %s,
                    updated_at = NOW()
                WHERE id = %s
            """, (embedding_str, description, frame_id))
            conn.commit()
            
    except Exception as e:
        logger.error(f"Error updating frame {frame_id}: {e}")
        conn.rollback()
        raise

def process_single_frame(embedding_service, frame):
    """Process a single frame (for parallel processing)."""
    try:
        # Convert Docker container path to local path
        container_path = frame['frame_path']
        if container_path.startswith('/app/frames/'):
            filename = container_path.replace('/app/frames/', '')
            frame_path = Path("backend/frames") / filename
        else:
            frame_path = Path("backend") / frame['frame_path']
        
        if not frame_path.exists():
            logger.warning(f"Frame file not found: {frame_path}")
            return None
        
        # Generate description using vision model
        description = embedding_service.create_frame_description(str(frame_path))
        
        # Generate embedding from description
        embedding = embedding_service.encode_text(description)
        
        return {
            'frame_id': frame['id'],
            'embedding': embedding,
            'description': description
        }
        
    except Exception as e:
        logger.error(f"Error processing frame {frame['id']}: {e}")
        return None

def main():
    """Main execution function with optimizations."""
    # Configuration - OPTIMIZED SETTINGS
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY environment variable is required")
    BATCH_SIZE = 8  # Increased from 3 for faster processing
    DELAY_BETWEEN_BATCHES = 1  # Reduced from 2 seconds
    PROGRESS_REPORT_INTERVAL = 50  # Report every 50 frames instead of every frame
    
    logger.info("Starting OPTIMIZED host-based OpenAI embedding generation")
    
    try:
        # Initialize services
        embedding_service = OptimizedOpenAIEmbeddingService(OPENAI_API_KEY)
        conn = get_database_connection()
        
        # Get total count
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM frames WHERE embedding IS NULL")
            total_frames = cur.fetchone()[0]
        
        logger.info(f"Found {total_frames} frames needing OpenAI embeddings")
        
        processed = 0
        batch_num = 1
        start_time = time.time()
        
        while True:
            # Get next batch
            frames = get_frames_without_embeddings(conn, BATCH_SIZE)
            if not frames:
                logger.info("All frames processed!")
                break
            
            logger.info(f"Processing batch {batch_num} ({len(frames)} frames)")
            
            # Process batch
            batch_results = []
            for frame in frames:
                result = process_single_frame(embedding_service, frame)
                if result:
                    batch_results.append(result)
                    processed += 1
                    
                    # Update database immediately
                    update_frame_embedding(
                        conn, 
                        result['frame_id'], 
                        result['embedding'], 
                        result['description']
                    )
                    
                    # Progress reporting
                    if processed % PROGRESS_REPORT_INTERVAL == 0 or processed <= 10:
                        elapsed = time.time() - start_time
                        rate = processed / (elapsed / 3600)  # frames per hour
                        remaining = total_frames - processed
                        eta_hours = remaining / rate if rate > 0 else 0
                        
                        logger.info(f"Progress: {processed}/{total_frames} ({processed/total_frames*100:.1f}%) - Rate: {rate:.1f}/hr - ETA: {eta_hours:.1f}h")
                
                # Small delay between frames to respect rate limits
                time.sleep(0.3)  # Reduced from 0.5
            
            batch_num += 1
            
            # Shorter delay between batches
            if batch_results:
                logger.info(f"Batch {batch_num-1} complete. Processed {len(batch_results)} frames.")
                time.sleep(DELAY_BETWEEN_BATCHES)
        
        elapsed = time.time() - start_time
        logger.info(f"OPTIMIZATION COMPLETE! Processed {processed} frames in {elapsed/3600:.2f} hours")
        logger.info(f"Average rate: {processed/(elapsed/3600):.1f} frames per hour")
        
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        raise
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()