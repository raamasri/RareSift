#!/usr/bin/env python3
"""
Comprehensive Frame Extraction Script for RareSift

This script processes ALL 22 video assets and extracts frames at 1 frame per second
from each video to create a comprehensive demo dataset for search functionality.
"""

import os
import subprocess
import json
from pathlib import Path
from typing import Dict, List
import time

class ComprehensiveFrameExtractor:
    def __init__(self):
        self.video_assets_dir = Path(__file__).parent / "video_assets"
        self.output_dir = Path(__file__).parent / "frontend" / "src" / "assets" / "demo-frames"
        
        # Ensure output directory exists
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Track processing statistics
        self.stats = {
            "videos_processed": 0,
            "frames_extracted": 0,
            "total_duration": 0,
            "failed_videos": [],
            "success_videos": []
        }
    
    def get_video_info(self, video_path: str) -> Dict:
        """Extract video information using ffprobe"""
        try:
            cmd = [
                'ffprobe', '-v', 'quiet', '-print_format', 'json',
                '-show_format', '-show_streams', video_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            data = json.loads(result.stdout)
            
            # Find video stream
            video_stream = None
            for stream in data['streams']:
                if stream['codec_type'] == 'video':
                    video_stream = stream
                    break
            
            if not video_stream:
                raise ValueError("No video stream found")
            
            duration = float(data['format']['duration'])
            fps = eval(video_stream.get('r_frame_rate', '30/1'))
            width = int(video_stream['width'])
            height = int(video_stream['height'])
            
            return {
                'duration': duration,
                'fps': fps,
                'width': width,
                'height': height,
                'total_frames': int(duration * fps),
                'estimated_1fps_frames': int(duration)  # 1 frame per second
            }
            
        except Exception as e:
            print(f"  ❌ Failed to get video info: {e}")
            return None
    
    def extract_frames_from_video(self, video_path: Path, video_id: str, category: str) -> int:
        """Extract frames from a single video at 1 frame per second"""
        print(f"\n🎬 Processing: {video_path.name}")
        
        # Get video information
        video_info = self.get_video_info(str(video_path))
        if not video_info:
            self.stats["failed_videos"].append(video_path.name)
            return 0
        
        duration = video_info['duration']
        estimated_frames = video_info['estimated_1fps_frames']
        
        print(f"  📊 Duration: {duration:.1f}s, Estimated frames: {estimated_frames}")
        
        # Extract frames at 1 fps
        frames_extracted = 0
        
        try:
            # Use ffmpeg to extract frames at 1 fps
            output_pattern = self.output_dir / f"{video_id}_frame_%03d.jpg"
            
            cmd = [
                'ffmpeg', '-i', str(video_path),
                '-vf', 'fps=1',  # Extract 1 frame per second
                '-q:v', '2',     # High quality JPEG
                '-y',            # Overwrite existing files
                str(output_pattern)
            ]
            
            print(f"  🔄 Extracting frames at 1fps...")
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            
            # Count extracted frames
            frame_files = list(self.output_dir.glob(f"{video_id}_frame_*.jpg"))
            frames_extracted = len(frame_files)
            
            print(f"  ✅ Extracted {frames_extracted} frames")
            
            self.stats["success_videos"].append({
                "name": video_path.name,
                "video_id": video_id,
                "category": category,
                "duration": duration,
                "frames_extracted": frames_extracted,
                "frames_files": [f.name for f in frame_files]
            })
            
            return frames_extracted
            
        except subprocess.CalledProcessError as e:
            print(f"  ❌ FFmpeg error: {e}")
            print(f"  📄 FFmpeg stderr: {e.stderr}")
            self.stats["failed_videos"].append(video_path.name)
            return 0
        except Exception as e:
            print(f"  ❌ Unexpected error: {e}")
            self.stats["failed_videos"].append(video_path.name)
            return 0
    
    def process_all_videos(self):
        """Process all video assets in both directories"""
        print("🚀 Starting Comprehensive Frame Extraction")
        print("=" * 60)
        
        # Define video categories and their directories
        categories = {
            "driving_camera": self.video_assets_dir / "driving_camera_footage",
            "static_camera": self.video_assets_dir / "static_camera_footage"
        }
        
        total_start_time = time.time()
        
        for category, category_dir in categories.items():
            if not category_dir.exists():
                print(f"⚠️  Directory not found: {category_dir}")
                continue
            
            print(f"\n📂 Processing {category} videos from {category_dir.name}")
            print("-" * 50)
            
            # Get all MP4 files in the directory
            video_files = list(category_dir.glob("*.MP4"))
            video_files.extend(list(category_dir.glob("*.mp4")))
            
            if not video_files:
                print(f"  📭 No video files found in {category_dir}")
                continue
            
            print(f"  📁 Found {len(video_files)} videos to process")
            
            for i, video_file in enumerate(sorted(video_files), 1):
                print(f"\n  [{i}/{len(video_files)}] Processing {video_file.name}")
                
                # Generate video ID based on category and filename
                video_id = f"{category}_{video_file.stem.lower()}"
                
                # Extract frames
                frames_count = self.extract_frames_from_video(video_file, video_id, category)
                
                # Update statistics
                self.stats["videos_processed"] += 1
                self.stats["frames_extracted"] += frames_count
                
                if frames_count > 0:
                    # Get video duration for stats
                    video_info = self.get_video_info(str(video_file))
                    if video_info:
                        self.stats["total_duration"] += video_info["duration"]
        
        total_time = time.time() - total_start_time
        
        # Print comprehensive summary
        self.print_summary(total_time)
        
        # Generate import statements for frontend
        self.generate_import_statements()
    
    def print_summary(self, processing_time: float):
        """Print comprehensive processing summary"""
        print(f"\n🎉 Frame Extraction Complete!")
        print("=" * 60)
        print(f"📊 Processing Statistics:")
        print(f"  ✅ Videos processed: {self.stats['videos_processed']}")
        print(f"  🖼️  Total frames extracted: {self.stats['frames_extracted']}")
        print(f"  ⏱️  Total video duration: {self.stats['total_duration']:.1f} seconds")
        print(f"  🚀 Processing time: {processing_time:.1f} seconds")
        print(f"  📈 Average: {self.stats['frames_extracted']/processing_time:.1f} frames/second")
        
        if self.stats["failed_videos"]:
            print(f"\n❌ Failed videos ({len(self.stats['failed_videos'])}):")
            for video in self.stats["failed_videos"]:
                print(f"  - {video}")
        
        if self.stats["success_videos"]:
            print(f"\n✅ Successfully processed ({len(self.stats['success_videos'])}):")
            driving_videos = [v for v in self.stats["success_videos"] if v["category"] == "driving_camera"]
            static_videos = [v for v in self.stats["success_videos"] if v["category"] == "static_camera"]
            
            print(f"\n  🚗 Driving Camera Videos ({len(driving_videos)}):")
            for video in driving_videos:
                print(f"    - {video['name']}: {video['frames_extracted']} frames ({video['duration']:.1f}s)")
            
            print(f"\n  📹 Static Camera Videos ({len(static_videos)}):")
            for video in static_videos:
                print(f"    - {video['name']}: {video['frames_extracted']} frames ({video['duration']:.1f}s)")
        
        print(f"\n📁 Frames saved to: {self.output_dir}")
        print(f"🔍 Ready for search functionality with {self.stats['frames_extracted']} searchable frames!")
    
    def generate_import_statements(self):
        """Generate TypeScript import statements for all extracted frames"""
        print(f"\n📝 Generating import statements...")
        
        # Get all frame files
        frame_files = sorted(self.output_dir.glob("*_frame_*.jpg"))
        
        if not frame_files:
            print("  ⚠️  No frame files found to generate imports for")
            return
        
        # Generate import file
        import_file = Path(__file__).parent / "frontend_frame_imports.ts"
        
        with open(import_file, 'w') as f:
            f.write("// Auto-generated frame imports for RareSift local search\n")
            f.write("// Generated by extract_all_frames.py\n\n")
            
            # Generate imports
            for frame_file in frame_files:
                # Convert filename to variable name
                var_name = frame_file.stem.replace('-', '_').replace(' ', '_')
                f.write(f"import {var_name} from '@/assets/demo-frames/{frame_file.name}'\n")
            
            f.write("\n// Export all frames as an array\n")
            f.write("export const ALL_FRAMES = [\n")
            for frame_file in frame_files:
                var_name = frame_file.stem.replace('-', '_').replace(' ', '_')
                f.write(f"  {var_name},\n")
            f.write("]\n")
            
            f.write("\n// Export frames by category\n")
            f.write("export const DRIVING_CAMERA_FRAMES = [\n")
            for frame_file in frame_files:
                if "driving_camera" in frame_file.name:
                    var_name = frame_file.stem.replace('-', '_').replace(' ', '_')
                    f.write(f"  {var_name},\n")
            f.write("]\n")
            
            f.write("\nexport const STATIC_CAMERA_FRAMES = [\n")
            for frame_file in frame_files:
                if "static_camera" in frame_file.name:
                    var_name = frame_file.stem.replace('-', '_').replace(' ', '_')
                    f.write(f"  {var_name},\n")
            f.write("]\n")
        
        print(f"  ✅ Import statements saved to: {import_file}")
        print(f"  📋 Generated imports for {len(frame_files)} frames")

def main():
    """Main entry point"""
    try:
        extractor = ComprehensiveFrameExtractor()
        extractor.process_all_videos()
    except KeyboardInterrupt:
        print("\n\n❌ Processing cancelled by user")
    except Exception as e:
        print(f"\n\n❌ Processing failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()