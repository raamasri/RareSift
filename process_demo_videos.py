#!/usr/bin/env python3
"""
Process video assets to create demo footage for RareSift
Extracts frames, generates metadata, and creates searchable demo content
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

def get_video_info(video_path):
    """Get video metadata using ffprobe"""
    try:
        cmd = [
            'ffprobe', '-v', 'quiet', '-print_format', 'json',
            '-show_format', '-show_streams', str(video_path)
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return json.loads(result.stdout)
    except Exception as e:
        print(f"Error getting video info for {video_path}: {e}")
        return None

def extract_frames(video_path, output_dir, video_id, max_frames=10):
    """Extract frames from video at regular intervals"""
    frames = []
    
    # Get video duration
    info = get_video_info(video_path)
    if not info:
        return frames
    
    duration = float(info['format']['duration'])
    interval = duration / max_frames
    
    for i in range(max_frames):
        timestamp = i * interval
        frame_filename = f"{video_id}_frame_{i:03d}.jpg"
        frame_path = output_dir / frame_filename
        
        # Extract frame using ffmpeg
        cmd = [
            'ffmpeg', '-y', '-i', str(video_path),
            '-ss', str(timestamp), '-vframes', '1',
            '-q:v', '2', str(frame_path)
        ]
        
        try:
            subprocess.run(cmd, capture_output=True, check=True)
            frames.append({
                'filename': frame_filename,
                'timestamp': timestamp,
                'video_id': video_id,
                'relative_path': f"demo-assets/frames/{frame_filename}"
            })
            print(f"✓ Extracted frame {i+1}/{max_frames} from {video_path.name}")
        except subprocess.CalledProcessError as e:
            print(f"✗ Failed to extract frame {i} from {video_path.name}: {e}")
    
    return frames

def generate_demo_scenarios():
    """Generate realistic search scenarios based on video content"""
    return [
        {
            "query": "cars turning left in intersection",
            "description": "Vehicles making left turns at traffic intersections",
            "category": "traffic_maneuvers"
        },
        {
            "query": "pedestrians crossing street",
            "description": "People walking across roads and crosswalks",
            "category": "pedestrian_activity"
        },
        {
            "query": "vehicles in rainy conditions",
            "description": "Driving scenes with wet roads and weather",
            "category": "weather_conditions"
        },
        {
            "query": "traffic light changes",
            "description": "Signal transitions from red to green",
            "category": "traffic_control"
        },
        {
            "query": "parking maneuvers",
            "description": "Cars parking or backing out of spaces",
            "category": "parking_scenarios"
        },
        {
            "query": "highway driving",
            "description": "High-speed road and freeway footage",
            "category": "highway_scenarios"
        },
        {
            "query": "urban street scenes",
            "description": "City street navigation and traffic",
            "category": "urban_driving"
        },
        {
            "query": "construction zones",
            "description": "Work areas with altered traffic patterns",
            "category": "construction"
        }
    ]

def create_demo_metadata():
    """Process all videos and create demo metadata"""
    metadata = {
        "generated_at": datetime.now().isoformat(),
        "videos": [],
        "frames": [],
        "scenarios": generate_demo_scenarios(),
        "stats": {
            "total_videos": 0,
            "total_frames": 0,
            "categories": ["driving_camera_footage", "static_camera_footage"]
        }
    }
    
    video_id = 1
    
    # Process driving camera footage
    driving_dir = VIDEO_ASSETS_DIR / "driving_camera_footage"
    if driving_dir.exists():
        for video_file in sorted(driving_dir.glob("*.MP4")):
            print(f"\nProcessing driving footage: {video_file.name}")
            
            # Get video info
            info = get_video_info(video_file)
            if not info:
                continue
            
            # Extract frames
            frames = extract_frames(video_file, FRAMES_OUTPUT_DIR, f"drive_{video_id:02d}", max_frames=8)
            
            # Add video metadata
            video_metadata = {
                "id": f"drive_{video_id:02d}",
                "filename": video_file.name,
                "category": "driving_camera_footage",
                "duration": float(info['format']['duration']),
                "size": info['format']['size'],
                "frames": len(frames),
                "description": f"Driving camera footage from {video_file.name}"
            }
            
            metadata["videos"].append(video_metadata)
            metadata["frames"].extend(frames)
            video_id += 1
    
    # Process static camera footage
    static_dir = VIDEO_ASSETS_DIR / "static_camera_footage"
    if static_dir.exists():
        for video_file in sorted(static_dir.glob("*.MP4")):
            print(f"\nProcessing static footage: {video_file.name}")
            
            # Get video info
            info = get_video_info(video_file)
            if not info:
                continue
            
            # Extract frames (fewer for static footage)
            frames = extract_frames(video_file, FRAMES_OUTPUT_DIR, f"static_{video_id:02d}", max_frames=6)
            
            # Add video metadata
            video_metadata = {
                "id": f"static_{video_id:02d}",
                "filename": video_file.name,
                "category": "static_camera_footage", 
                "duration": float(info['format']['duration']),
                "size": info['format']['size'],
                "frames": len(frames),
                "description": f"Static camera footage from {video_file.name}"
            }
            
            metadata["videos"].append(video_metadata)
            metadata["frames"].extend(frames)
            video_id += 1
    
    # Update stats
    metadata["stats"]["total_videos"] = len(metadata["videos"])
    metadata["stats"]["total_frames"] = len(metadata["frames"])
    
    return metadata

def main():
    print("🎬 RareSift Demo Video Processor")
    print("=" * 50)
    
    # Check if video assets exist
    if not VIDEO_ASSETS_DIR.exists():
        print(f"❌ Video assets directory not found: {VIDEO_ASSETS_DIR}")
        return
    
    print(f"📁 Processing videos from: {VIDEO_ASSETS_DIR}")
    print(f"💾 Output directory: {DEMO_OUTPUT_DIR}")
    
    # Process videos and create metadata
    metadata = create_demo_metadata()
    
    # Save metadata file
    with open(METADATA_FILE, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"\n✅ Processing complete!")
    print(f"📊 Processed {metadata['stats']['total_videos']} videos")
    print(f"🖼️  Extracted {metadata['stats']['total_frames']} frames")
    print(f"📄 Metadata saved to: {METADATA_FILE}")
    print(f"🎯 Demo scenarios: {len(metadata['scenarios'])}")
    
    # Create a summary for the developer
    print(f"\n📋 Summary:")
    for category in metadata['stats']['categories']:
        video_count = len([v for v in metadata['videos'] if v['category'] == category])
        print(f"   {category}: {video_count} videos")

if __name__ == "__main__":
    main()