import os
import cv2
import tempfile
from typing import Dict, List, Optional, Tuple
from moviepy.editor import VideoFileClip
import numpy as np
from PIL import Image
from datetime import datetime

from app.core.config import settings
from app.models.video import Video, Frame
from sqlalchemy.orm import Session


class VideoProcessor:
    """
    Service for processing uploaded videos:
    - Extract frames at specified intervals
    - Extract video metadata
    - Save frame images
    """
    
    def __init__(self):
        self.frame_interval = settings.frame_extraction_interval
        os.makedirs(settings.upload_dir, exist_ok=True)
        os.makedirs(os.path.join(settings.upload_dir, "frames"), exist_ok=True)
    
    def extract_video_metadata(self, file_path: str) -> Dict:
        """
        Extract basic metadata from video file
        """
        try:
            # Use OpenCV for basic info
            cap = cv2.VideoCapture(file_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            duration = frame_count / fps if fps > 0 else 0
            cap.release()
            
            return {
                "duration": duration,
                "fps": fps,
                "width": width,
                "height": height,
                "frame_count": frame_count
            }
        except Exception as e:
            raise Exception(f"Failed to extract video metadata: {str(e)}")
    
    def extract_frames_smart_sampling(self, video_path: str, video_id: int) -> List[Dict]:
        """
        Extract frames using smart sampling strategy
        """
        frames_data = []
        
        try:
            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = total_frames / fps if fps > 0 else 0
            
            print(f"DEBUG: Smart sampling for video {video_id}")
            print(f"DEBUG: Duration: {duration:.2f}s, FPS: {fps}, Total frames: {total_frames}")
            
            if fps <= 0 or total_frames <= 0:
                cap.release()
                raise Exception("Invalid video file or unable to read video properties")
            
            # Calculate target frames based on video duration
            max_frames = settings.max_frames_per_video
            
            # Adaptive strategy: more frames for longer videos, but cap at max_frames
            if duration <= 30:  # Short videos: dense sampling
                target_frames = min(max_frames, max(5, int(duration / 3)))
            elif duration <= 120:  # Medium videos: moderate sampling  
                target_frames = min(max_frames, max(8, int(duration / 8)))
            else:  # Long videos: sparse sampling
                target_frames = min(max_frames, max(10, int(duration / 15)))
            
            print(f"DEBUG: Target frames: {target_frames} from {duration:.2f}s video")
            
            # Calculate sampling points with strategic distribution
            sample_points = self._calculate_sample_points(duration, target_frames)
            print(f"DEBUG: Sample points (seconds): {[f'{p:.1f}' for p in sample_points]}")
            
            # Extract frames at calculated points
            for i, timestamp in enumerate(sample_points):
                frame_number = int(timestamp * fps)
                
                # Seek to specific frame
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
                ret, frame = cap.read()
                
                if not ret:
                    print(f"DEBUG: Could not read frame at timestamp {timestamp:.2f}s")
                    continue
                
                print(f"DEBUG: Extracting frame {i} at timestamp {timestamp:.2f}s (frame {frame_number})")
                
                # Save frame as image
                frame_filename = f"video_{video_id}_frame_{i:06d}.jpg"
                frame_path = os.path.join(settings.upload_dir, "frames", frame_filename)
                
                # Convert BGR to RGB for saving
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                image = Image.fromarray(frame_rgb)
                image.save(frame_path, "JPEG", quality=90)
                
                frames_data.append({
                    "frame_number": i,
                    "timestamp": timestamp,
                    "frame_path": frame_path
                })
            
            print(f"DEBUG: Smart sampling complete: {len(frames_data)} frames extracted")
            cap.release()
            return frames_data
            
        except Exception as e:
            print(f"DEBUG: Smart sampling failed: {str(e)}")
            cap.release()
            raise Exception(f"Failed to extract frames with smart sampling: {str(e)}")
    
    def _calculate_sample_points(self, duration: float, target_frames: int) -> List[float]:
        """
        Calculate strategic sampling points for optimal coverage
        """
        if target_frames <= 1:
            return [duration / 2]  # Middle frame only
        
        sample_points = []
        
        # Strategy: Beginning + End + Distributed middle sections
        
        # 1. Always include beginning (skip first 2 seconds for better content)
        sample_points.append(min(2.0, duration * 0.05))
        
        # 2. Always include end (avoid last 2 seconds)
        if duration > 4:
            sample_points.append(duration - min(2.0, duration * 0.05))
        
        # 3. Fill remaining slots with strategic distribution
        remaining_slots = target_frames - len(sample_points)
        
        if remaining_slots > 0:
            # Divide video into segments and sample from each
            # Focus more samples on middle sections where action typically occurs
            
            if duration <= 30:
                # Short video: uniform distribution
                for i in range(remaining_slots):
                    pos = (i + 1) * duration / (remaining_slots + 1)
                    if pos not in sample_points:
                        sample_points.append(pos)
            else:
                # Longer video: weighted towards middle sections
                segments = remaining_slots + 2  # +2 for beginning and end
                for i in range(1, segments - 1):  # Skip first and last (already added)
                    # Use quadratic distribution to favor middle sections
                    normalized_pos = i / (segments - 1)
                    # Apply gentle weighting toward center
                    weight = 1 - 0.3 * abs(0.5 - normalized_pos)
                    pos = normalized_pos * duration * weight + duration * (1 - weight) * 0.5
                    pos = max(0, min(duration, pos))
                    sample_points.append(pos)
        
        # Sort and ensure minimum spacing
        sample_points = sorted(set(sample_points))
        
        # Ensure minimum 3-second spacing between samples
        min_spacing = max(1.0, duration / (target_frames * 2))
        filtered_points = [sample_points[0]]
        
        for point in sample_points[1:]:
            if point - filtered_points[-1] >= min_spacing:
                filtered_points.append(point)
        
        return filtered_points[:target_frames]  # Cap at target
    
    def extract_frames(self, video_path: str, video_id: int) -> List[Dict]:
        """
        Extract frames from video at specified intervals
        Returns list of frame data with paths and timestamps
        """
        frames_data = []
        
        try:
            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            print(f"DEBUG: Video processing for video {video_id}")
            print(f"DEBUG: FPS: {fps}, Total frames: {total_frames}")
            
            if fps <= 0:
                raise Exception("Invalid video file or unable to read FPS")
            
            frame_interval_frames = int(fps * self.frame_interval)
            print(f"DEBUG: Frame interval: {frame_interval_frames} frames ({self.frame_interval}s)")
            
            frame_number = 0
            extracted_frame_number = 0
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    print(f"DEBUG: End of video reached at frame {frame_number}")
                    break
                
                # Extract frame at intervals
                if frame_number % frame_interval_frames == 0:
                    timestamp = frame_number / fps
                    
                    print(f"DEBUG: Extracting frame {extracted_frame_number} at timestamp {timestamp:.2f}s")
                    
                    # Save frame as image
                    frame_filename = f"video_{video_id}_frame_{extracted_frame_number:06d}.jpg"
                    frame_path = os.path.join(settings.upload_dir, "frames", frame_filename)
                    
                    # Convert BGR to RGB for saving
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    image = Image.fromarray(frame_rgb)
                    image.save(frame_path, "JPEG", quality=90)
                    
                    frames_data.append({
                        "frame_number": extracted_frame_number,
                        "timestamp": timestamp,
                        "frame_path": frame_path
                    })
                    
                    extracted_frame_number += 1
                
                frame_number += 1
                
                # Debug every 1000 frames
                if frame_number % 1000 == 0:
                    print(f"DEBUG: Processed {frame_number} frames, extracted {extracted_frame_number} frames")
            
            print(f"DEBUG: Frame extraction complete: {extracted_frame_number} frames extracted from {frame_number} total frames")
            cap.release()
            return frames_data
            
        except Exception as e:
            print(f"DEBUG: Frame extraction failed: {str(e)}")
            raise Exception(f"Failed to extract frames: {str(e)}")
    
    def detect_conditions(self, frame_path: str) -> Dict:
        """
        Simple heuristic-based condition detection
        Returns detected conditions like time_of_day, weather hints
        """
        try:
            # Load image
            image = cv2.imread(frame_path)
            if image is None:
                return {}
            
            # Convert to different color spaces for analysis
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            conditions = {}
            
            # Simple brightness-based time detection
            avg_brightness = np.mean(gray)
            if avg_brightness < 50:
                conditions["time_of_day"] = "night"
            elif avg_brightness < 120:
                conditions["time_of_day"] = "dusk"
            else:
                conditions["time_of_day"] = "day"
            
            # Simple weather hints based on image properties
            # Low contrast might indicate fog/rain
            contrast = np.std(gray)
            if contrast < 30:
                conditions["weather_hint"] = "poor_visibility"
            
            # Blue/gray dominance might indicate cloudy/rainy
            blue_channel = image[:, :, 0]
            avg_blue = np.mean(blue_channel)
            if avg_blue > 120:
                conditions["weather_hint"] = "cloudy"
            
            return conditions
            
        except Exception as e:
            print(f"Error detecting conditions: {str(e)}")
            return {}
    
    def extract_frames_dense_sampling(self, video_path: str, video_id: int) -> List[Dict]:
        """
        Extract frames at regular intervals (e.g., every 5 seconds)
        Good balance between coverage and performance
        """
        frames_data = []
        
        try:
            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = total_frames / fps if fps > 0 else 0
            
            print(f"DEBUG: Dense sampling for video {video_id}")
            print(f"DEBUG: Duration: {duration:.2f}s, extracting every {settings.dense_sampling_interval}s")
            
            if fps <= 0 or total_frames <= 0:
                cap.release()
                raise Exception("Invalid video file")
            
            # Calculate sample points every N seconds
            sample_interval = settings.dense_sampling_interval
            sample_times = []
            current_time = 0
            
            while current_time < duration:
                sample_times.append(current_time)
                current_time += sample_interval
            
            # Add final frame if not too close to last sample
            if duration - sample_times[-1] > sample_interval / 2:
                sample_times.append(duration - 1)
            
            print(f"DEBUG: Extracting {len(sample_times)} frames at: {[f'{t:.1f}s' for t in sample_times[:5]]}{'...' if len(sample_times) > 5 else ''}")
            
            # Extract frames at calculated times
            for i, timestamp in enumerate(sample_times):
                frame_number = int(timestamp * fps)
                
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
                ret, frame = cap.read()
                
                if not ret:
                    continue
                
                # Save frame
                frame_filename = f"video_{video_id}_frame_{i:06d}.jpg"
                frame_path = os.path.join(settings.upload_dir, "frames", frame_filename)
                
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                image = Image.fromarray(frame_rgb)
                image.save(frame_path, "JPEG", quality=90)
                
                frames_data.append({
                    "frame_number": i,
                    "timestamp": timestamp,
                    "frame_path": frame_path
                })
            
            print(f"DEBUG: Dense sampling complete: {len(frames_data)} frames extracted")
            cap.release()
            return frames_data
            
        except Exception as e:
            print(f"DEBUG: Dense sampling failed: {str(e)}")
            cap.release()
            raise Exception(f"Failed to extract frames with dense sampling: {str(e)}")
    
    def extract_frames_full_parsing(self, video_path: str, video_id: int) -> List[Dict]:
        """
        Extract every frame from the video
        WARNING: Very resource intensive - use only for short videos or when necessary
        """
        frames_data = []
        
        try:
            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = total_frames / fps if fps > 0 else 0
            
            print(f"DEBUG: Full frame parsing for video {video_id}")
            print(f"DEBUG: Processing ALL {total_frames} frames ({duration:.2f}s video)")
            print(f"WARNING: This will take approximately {total_frames * 0.1 / 60:.1f} minutes")
            
            if fps <= 0 or total_frames <= 0:
                cap.release()
                raise Exception("Invalid video file")
            
            # Safety check for very long videos (increased limit for your use case)
            if total_frames > 20000:  # ~10 minutes at 30fps
                print(f"WARNING: Video has {total_frames} frames. This will take a long time.")
                print("Consider using dense sampling for videos longer than 10 minutes.")
            
            frame_number = 0
            extracted_count = 0
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                timestamp = frame_number / fps
                
                # Save every frame
                frame_filename = f"video_{video_id}_frame_{extracted_count:06d}.jpg"
                frame_path = os.path.join(settings.upload_dir, "frames", frame_filename)
                
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                image = Image.fromarray(frame_rgb)
                image.save(frame_path, "JPEG", quality=85)  # Lower quality to save space
                
                frames_data.append({
                    "frame_number": extracted_count,
                    "timestamp": timestamp,
                    "frame_path": frame_path
                })
                
                extracted_count += 1
                frame_number += 1
                
                # Progress updates every 300 frames (every 10 seconds at 30fps)
                if extracted_count % 300 == 0 and extracted_count > 0:
                    progress = extracted_count/total_frames*100
                    print(f"DEBUG: Processed {extracted_count}/{total_frames} frames ({progress:.1f}%)")
                    
                # Update database processing status periodically
                if extracted_count % 900 == 0 and extracted_count > 0:  # Every 30 seconds of video
                    try:
                        # This would require passing video object, but keeping simple for now
                        pass
                    except:
                        pass
            
            print(f"DEBUG: Full parsing complete: {len(frames_data)} frames extracted")
            cap.release()
            return frames_data
            
        except Exception as e:
            print(f"DEBUG: Full parsing failed: {str(e)}")
            cap.release()
            raise Exception(f"Failed to extract all frames: {str(e)}")

    async def process_video(self, db: Session, video: Video) -> bool:
        """
        Complete video processing pipeline with configurable extraction modes
        """
        try:
            # Update processing status
            video.processing_started_at = datetime.utcnow()
            video.is_processed = False
            db.commit()
            
            # Choose extraction method based on configuration
            mode = settings.frame_extraction_mode.lower()
            
            if mode == "smart":
                frames_data = self.extract_frames_smart_sampling(video.file_path, video.id)
            elif mode == "dense":
                frames_data = self.extract_frames_dense_sampling(video.file_path, video.id)
            elif mode == "full":
                if not settings.full_parsing_enabled:
                    raise Exception("Full frame parsing is disabled in configuration")
                frames_data = self.extract_frames_full_parsing(video.file_path, video.id)
            elif mode == "interval":
                frames_data = self.extract_frames(video.file_path, video.id)  # Legacy method
            else:
                raise Exception(f"Unknown frame extraction mode: {mode}")
            
            print(f"DEBUG: Using {mode} extraction mode, got {len(frames_data)} frames")
            
            # Create frame records with basic condition detection
            for frame_data in frames_data:
                # Detect conditions for this frame
                conditions = self.detect_conditions(frame_data["frame_path"])
                
                frame = Frame(
                    video_id=video.id,
                    frame_number=frame_data["frame_number"],
                    timestamp=frame_data["timestamp"],
                    frame_path=frame_data["frame_path"],
                    frame_metadata=conditions
                )
                db.add(frame)
            
            # Update video processing status
            video.is_processed = True
            video.processing_completed_at = datetime.utcnow()
            
            # Update video metadata with detected conditions from first frame
            if frames_data:
                first_frame_conditions = self.detect_conditions(frames_data[0]["frame_path"])
                if "time_of_day" in first_frame_conditions:
                    video.time_of_day = first_frame_conditions["time_of_day"]
            
            db.commit()
            return True
            
        except Exception as e:
            video.processing_error = str(e)
            video.is_processed = False
            db.commit()
            raise e 