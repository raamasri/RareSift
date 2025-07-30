#!/usr/bin/env python3
"""
Quick demo video processor - processes a subset of videos for immediate demo use
"""

import os
import json
import subprocess
from pathlib import Path
import shutil
from datetime import datetime

# Configuration
VIDEO_ASSETS_DIR = Path("video_assets")
DEMO_OUTPUT_DIR = Path("frontend/public/demo-assets")
FRAMES_OUTPUT_DIR = DEMO_OUTPUT_DIR / "frames"
METADATA_FILE = DEMO_OUTPUT_DIR / "demo-metadata.json"

# Create output directories
DEMO_OUTPUT_DIR.mkdir(exist_ok=True)
FRAMES_OUTPUT_DIR.mkdir(exist_ok=True)

def extract_sample_frames(video_path, output_dir, video_id, max_frames=5):
    """Extract frames from video at regular intervals"""
    frames = []
    
    print(f"Processing {video_path.name}...")
    
    # Extract frames at specific timestamps (in seconds)
    timestamps = [10, 30, 60, 120, 180][:max_frames]  # Sample at these times
    
    for i, timestamp in enumerate(timestamps):
        frame_filename = f"{video_id}_frame_{i:03d}.jpg"
        frame_path = output_dir / frame_filename
        
        # Extract frame using ffmpeg with timeout
        cmd = [
            'ffmpeg', '-y', '-i', str(video_path),
            '-ss', str(timestamp), '-vframes', '1',
            '-q:v', '2', '-timeout', '10', str(frame_path)
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, timeout=30)
            if result.returncode == 0 and frame_path.exists():
                frames.append({
                    'filename': frame_filename,
                    'timestamp': timestamp,
                    'video_id': video_id,
                    'relative_path': f"demo-assets/frames/{frame_filename}"
                })
                print(f"  ✓ Frame {i+1}/{len(timestamps)} extracted")
            else:
                print(f"  ✗ Failed to extract frame at {timestamp}s")
                
        except subprocess.TimeoutExpired:
            print(f"  ⏱️  Timeout extracting frame at {timestamp}s")
        except Exception as e:
            print(f"  ✗ Error extracting frame at {timestamp}s: {e}")
    
    return frames

def create_quick_demo_metadata():
    """Process a subset of videos quickly"""
    metadata = {
        "generated_at": datetime.now().isoformat(),
        "videos": [],
        "frames": [],
        "scenarios": [
            {
                "query": "cars turning left in intersection",
                "description": "Vehicles making left turns at traffic intersections",
                "category": "traffic_maneuvers",
                "example_frames": []
            },
            {
                "query": "pedestrians crossing street",
                "description": "People walking across roads and crosswalks", 
                "category": "pedestrian_activity",
                "example_frames": []
            },
            {
                "query": "vehicles in rainy conditions",
                "description": "Driving scenes with wet roads and weather",
                "category": "weather_conditions",
                "example_frames": []
            },
            {
                "query": "urban street scenes",
                "description": "City street navigation and traffic",
                "category": "urban_driving",
                "example_frames": []
            }
        ],
        "stats": {
            "total_videos": 0,
            "total_frames": 0,
            "categories": ["driving_camera_footage", "static_camera_footage"]
        }
    }
    
    video_id = 1
    
    # Process first 2 driving videos
    driving_dir = VIDEO_ASSETS_DIR / "driving_camera_footage"
    if driving_dir.exists():
        driving_videos = sorted(list(driving_dir.glob("*.MP4")))[:2]  # Just first 2
        for video_file in driving_videos:
            frames = extract_sample_frames(video_file, FRAMES_OUTPUT_DIR, f"drive_{video_id:02d}", max_frames=3)
            
            video_metadata = {
                "id": f"drive_{video_id:02d}",
                "filename": video_file.name,
                "category": "driving_camera_footage",
                "frames": len(frames),
                "description": f"Driving camera footage - {video_file.name}"
            }
            
            metadata["videos"].append(video_metadata)
            metadata["frames"].extend(frames)
            video_id += 1
    
    # Process first 2 static videos  
    static_dir = VIDEO_ASSETS_DIR / "static_camera_footage"
    if static_dir.exists():
        static_videos = sorted(list(static_dir.glob("*.MP4")))[:2]  # Just first 2
        for video_file in static_videos:
            frames = extract_sample_frames(video_file, FRAMES_OUTPUT_DIR, f"static_{video_id:02d}", max_frames=3)
            
            video_metadata = {
                "id": f"static_{video_id:02d}",
                "filename": video_file.name,
                "category": "static_camera_footage",
                "frames": len(frames),
                "description": f"Static camera footage - {video_file.name}"
            }
            
            metadata["videos"].append(video_metadata)
            metadata["frames"].extend(frames)
            video_id += 1
    
    # Assign example frames to scenarios (distribute evenly)
    frame_chunks = [metadata["frames"][i::len(metadata["scenarios"])] 
                   for i in range(len(metadata["scenarios"]))]
    
    for i, scenario in enumerate(metadata["scenarios"]):
        if i < len(frame_chunks):
            scenario["example_frames"] = frame_chunks[i][:3]  # Max 3 per scenario
    
    # Update stats
    metadata["stats"]["total_videos"] = len(metadata["videos"])
    metadata["stats"]["total_frames"] = len(metadata["frames"])
    
    return metadata

def main():
    print("🎬 RareSift Quick Demo Processor")
    print("=" * 40)
    
    if not VIDEO_ASSETS_DIR.exists():
        print(f"❌ Video assets directory not found: {VIDEO_ASSETS_DIR}")
        return
    
    print(f"📁 Processing sample videos from: {VIDEO_ASSETS_DIR}")
    print(f"💾 Output directory: {DEMO_OUTPUT_DIR}")
    
    # Process videos and create metadata
    metadata = create_quick_demo_metadata()
    
    # Save metadata file
    with open(METADATA_FILE, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"\n✅ Quick processing complete!")
    print(f"📊 Processed {metadata['stats']['total_videos']} videos")
    print(f"🖼️  Extracted {metadata['stats']['total_frames']} frames")
    print(f"📄 Metadata saved to: {METADATA_FILE}")
    print(f"🎯 Demo scenarios: {len(metadata['scenarios'])}")

if __name__ == "__main__":
    main()