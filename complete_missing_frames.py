#!/usr/bin/env python3
"""
Complete Missing Frame Processing for RareSift
Processes only the missing frames identified in the database audit.
"""

import os
import sys
import logging
from pathlib import Path
import cv2
import json
import time
from typing import Dict, List, Tuple

# Add the backend directory to Python path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    import openai
    import numpy as np
    from PIL import Image
except ImportError as e:
    print(f"Missing required dependency: {e}")
    print("Run: pip install psycopg2-binary opencv-python pillow openai")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('complete_missing_frames.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class MissingFrameProcessor:
    """Process only the missing frames for complete coverage"""
    
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)
        self.embedding_model = "text-embedding-ada-002"
        
        # Database connection
        self.db_params = {
            'host': 'localhost',
            'port': 5432,
            'database': 'raresift',
            'user': 'postgres',
            'password': 'postgres'
        }
        
        # Video assets paths
        self.video_paths = {
            "driving_camera_footage": Path(__file__).parent / "video_assets" / "driving_camera_footage",
            "static_camera_footage": Path(__file__).parent / "video_assets" / "static_camera_footage"
        }
        
        # Frame output directory
        self.frames_dir = Path(__file__).parent / "backend" / "frames"
        self.frames_dir.mkdir(exist_ok=True)
        
    def get_connection(self):
        """Get database connection"""
        return psycopg2.connect(**self.db_params)
    
    def get_videos_with_missing_frames(self) -> List[Dict]:
        """Get list of videos that need additional frame processing"""
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                query = """
                SELECT 
                    v.id,
                    v.filename,
                    v.file_path,
                    v.duration::int as duration_seconds,
                    COUNT(f.id) as current_frames,
                    (v.duration::int - COUNT(f.id)) as missing_frames
                FROM videos v
                LEFT JOIN frames f ON v.id = f.video_id
                GROUP BY v.id, v.filename, v.file_path, v.duration
                HAVING (v.duration::int - COUNT(f.id)) > 0
                ORDER BY (v.duration::int - COUNT(f.id)) DESC;
                """
                cur.execute(query)
                return [dict(row) for row in cur.fetchall()]
    
    def get_existing_frame_timestamps(self, video_id: int) -> List[int]:
        """Get list of timestamps that already have frames"""
        with self.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT timestamp FROM frames WHERE video_id = %s ORDER BY timestamp", (video_id,))
                return [row[0] for row in cur.fetchall()]
    
    def find_video_file(self, filename: str) -> str:
        """Find the actual video file path"""
        for category, base_path in self.video_paths.items():
            video_path = base_path / filename
            if video_path.exists():
                return str(video_path)
        
        # Check if it's already in uploads
        uploads_path = Path(__file__).parent / "backend" / "uploads" / filename
        if uploads_path.exists():
            return str(uploads_path)
            
        raise FileNotFoundError(f"Video file not found: {filename}")
    
    def extract_missing_frames(self, video_info: Dict) -> List[str]:
        """Extract only the missing frames for a video"""
        video_path = self.find_video_file(video_info['filename'])
        video_id = video_info['id']
        duration_seconds = video_info['duration_seconds']
        
        logger.info(f"Processing {video_info['filename']} - need {video_info['missing_frames']} more frames")
        
        # Get existing timestamps
        existing_timestamps = set(self.get_existing_frame_timestamps(video_id))
        
        # Calculate which timestamps we need
        needed_timestamps = []
        for second in range(1, duration_seconds + 1):
            if second not in existing_timestamps:
                needed_timestamps.append(second)
        
        logger.info(f"Need to extract frames at timestamps: {len(needed_timestamps)} frames")
        
        # Extract missing frames
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        extracted_frames = []
        
        try:
            for timestamp in needed_timestamps:
                # Seek to the specific second
                frame_number = int(timestamp * fps)
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
                
                ret, frame = cap.read()
                if ret:
                    # Save frame
                    filename_base = Path(video_info['filename']).stem
                    frame_filename = f"{filename_base}_frame_{timestamp:03d}.jpg"
                    frame_path = self.frames_dir / frame_filename
                    
                    cv2.imwrite(str(frame_path), frame)
                    extracted_frames.append((timestamp, str(frame_path)))
                    
                    if len(extracted_frames) % 50 == 0:
                        logger.info(f"  Extracted {len(extracted_frames)}/{len(needed_timestamps)} frames")
        
        finally:
            cap.release()
        
        logger.info(f"Extracted {len(extracted_frames)} missing frames for {video_info['filename']}")
        return extracted_frames
    
    def create_frame_description(self, image_path: str) -> str:
        """Create AI description for frame"""
        try:
            with open(image_path, 'rb') as f:
                image_data = f.read()
            
            import base64
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
            logger.error(f"Error creating description for {image_path}: {e}")
            return f"Traffic scene frame from {Path(image_path).stem}"
    
    def create_embedding(self, text: str) -> List[float]:
        """Create embedding for text"""
        try:
            response = self.client.embeddings.create(
                model=self.embedding_model,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error creating embedding: {e}")
            return None
    
    def insert_frame_to_db(self, video_id: int, timestamp: int, frame_path: str, description: str, embedding: List[float]):
        """Insert new frame into database"""
        with self.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO frames (video_id, frame_number, timestamp, frame_path, description, embedding, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW())
                """, (video_id, timestamp, timestamp, frame_path, description, json.dumps(embedding)))
                conn.commit()
    
    def process_video_missing_frames(self, video_info: Dict):
        """Process all missing frames for a single video"""
        logger.info(f"=== Processing {video_info['filename']} ===")
        logger.info(f"Current frames: {video_info['current_frames']}, Missing: {video_info['missing_frames']}")
        
        # Extract missing frames
        extracted_frames = self.extract_missing_frames(video_info)
        
        if not extracted_frames:
            logger.info(f"No frames needed for {video_info['filename']}")
            return
        
        # Process each extracted frame
        for i, (timestamp, frame_path) in enumerate(extracted_frames, 1):
            try:
                # Create description
                description = self.create_frame_description(frame_path)
                
                # Create embedding
                embedding = self.create_embedding(description)
                if embedding is None:
                    continue
                
                # Insert to database
                self.insert_frame_to_db(video_info['id'], timestamp, frame_path, description, embedding)
                
                logger.info(f"  ✅ Processed frame {i}/{len(extracted_frames)} - timestamp {timestamp}")
                
                # Small delay to respect API limits
                time.sleep(0.1)
                
            except Exception as e:
                logger.error(f"Error processing frame {timestamp}: {e}")
                continue
        
        logger.info(f"Completed {video_info['filename']} - processed {len(extracted_frames)} frames")

def main():
    """Main execution function"""
    logger.info("Starting Missing Frame Completion Process")
    
    # Get API key
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is required")
    
    processor = MissingFrameProcessor(api_key)
    
    # Get videos with missing frames
    videos_needing_frames = processor.get_videos_with_missing_frames()
    
    if not videos_needing_frames:
        logger.info("✅ No missing frames found! All videos are complete.")
        return
    
    total_missing = sum(v['missing_frames'] for v in videos_needing_frames)
    logger.info(f"Found {len(videos_needing_frames)} videos with {total_missing} total missing frames")
    
    # Process each video
    start_time = time.time()
    completed_videos = 0
    total_processed_frames = 0
    
    for video_info in videos_needing_frames:
        try:
            frames_before = video_info['current_frames']
            processor.process_video_missing_frames(video_info)
            completed_videos += 1
            total_processed_frames += video_info['missing_frames']
            
            # Progress update
            elapsed = time.time() - start_time
            estimated_total = elapsed * len(videos_needing_frames) / completed_videos
            remaining = estimated_total - elapsed
            
            logger.info(f"Progress: {completed_videos}/{len(videos_needing_frames)} videos, "
                       f"{total_processed_frames}/{total_missing} frames, "
                       f"Est. {remaining/60:.1f} min remaining")
            
        except Exception as e:
            logger.error(f"Error processing video {video_info['filename']}: {e}")
            continue
    
    logger.info(f"✅ Missing Frame Completion FINISHED!")
    logger.info(f"Processed {completed_videos} videos with {total_processed_frames} new frames")

if __name__ == "__main__":
    main()