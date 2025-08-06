#!/usr/bin/env python3
"""
Create sample data for RareSift to enable search functionality without actual video files
"""
import sys
import os
import numpy as np
from datetime import datetime
from sqlalchemy.orm import Session

# Add the app directory to the Python path
sys.path.append('/app')

from app.core.database import get_db_session
from app.models.video import Video, Frame, Embedding, Search
from app.models.user import User

def create_sample_user():
    """Create a default user for the system"""
    with get_db_session() as db:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == "demo@raresift.com").first()
        if existing_user:
            print("Demo user already exists")
            return existing_user.id
        
        # Create new user
        user = User(
            email="demo@raresift.com",
            hashed_password="demo_hash",  # Not used in this demo
            full_name="Demo User",
            company="RareSift Demo",
            is_active=True,
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"Created demo user with ID: {user.id}")
        return user.id

def create_sample_videos_and_frames(user_id: int):
    """Create sample videos and frames with embeddings for search functionality"""
    with get_db_session() as db:
        # Check if sample data already exists
        existing_videos = db.query(Video).count()
        if existing_videos > 0:
            print(f"Sample data already exists ({existing_videos} videos)")
            return
        
        # Sample video scenarios
        video_scenarios = [
            {
                "filename": "traffic_intersection.mp4",
                "original_filename": "traffic_intersection.mp4",
                "description": "Busy traffic intersection with cars and pedestrians",
                "weather": "sunny",
                "time_of_day": "day",
                "location": "Downtown intersection",
                "duration": 120.0,
                "frame_descriptions": [
                    "Cars waiting at red traffic light",
                    "Pedestrians crossing at intersection", 
                    "Traffic light turns green",
                    "White car making left turn",
                    "Blue bicycle in bike lane",
                    "Bus approaching intersection"
                ]
            },
            {
                "filename": "highway_driving.mp4", 
                "original_filename": "highway_driving.mp4",
                "description": "Highway driving with multiple vehicles",
                "weather": "cloudy",
                "time_of_day": "day", 
                "location": "Highway I-95",
                "duration": 180.0,
                "frame_descriptions": [
                    "Highway with light traffic",
                    "White truck in right lane",
                    "Red car changing lanes",
                    "Motorcycle passing on left",
                    "Construction zone ahead", 
                    "Speed limit sign visible"
                ]
            },
            {
                "filename": "parking_lot.mp4",
                "original_filename": "parking_lot.mp4", 
                "description": "Parking lot with pedestrians and vehicles",
                "weather": "sunny",
                "time_of_day": "day",
                "location": "Shopping center parking",
                "duration": 90.0,
                "frame_descriptions": [
                    "Cars parked in parking lot",
                    "Person walking to their car",
                    "Shopping cart in parking space",
                    "Van backing out of space",
                    "Pedestrian with shopping bags",
                    "Yellow car parking"
                ]
            },
            {
                "filename": "night_driving.mp4",
                "original_filename": "night_driving.mp4",
                "description": "Night driving through city streets", 
                "weather": "clear",
                "time_of_day": "night",
                "location": "City streets",
                "duration": 150.0,
                "frame_descriptions": [
                    "Street lights illuminating road",
                    "Headlights of oncoming car", 
                    "Stop sign visible in headlights",
                    "Person walking on sidewalk at night",
                    "Neon signs from businesses",
                    "Traffic light glowing red"
                ]
            }
        ]
        
        for i, scenario in enumerate(video_scenarios):
            # Create video record
            video = Video(
                filename=scenario["filename"],
                original_filename=scenario["original_filename"],
                file_path=f"/app/demo_videos/{scenario['filename']}",  # Non-existent but valid path
                file_size=50 * 1024 * 1024,  # 50MB placeholder
                duration=scenario["duration"],
                fps=30.0,
                width=1920,
                height=1080,
                weather=scenario["weather"],
                time_of_day=scenario["time_of_day"],
                location=scenario["location"],
                is_processed=True,
                processing_completed_at=datetime.utcnow(),
                user_id=user_id,
                video_metadata={
                    "description": scenario["description"],
                    "camera_type": "dash_cam",
                    "is_sample": True
                }
            )
            db.add(video)
            db.flush()  # Get the video ID
            
            # Create frames and embeddings for each video
            for j, frame_desc in enumerate(scenario["frame_descriptions"]):
                # Create frame
                frame = Frame(
                    video_id=video.id,
                    frame_number=j + 1,
                    timestamp=j * 20.0,  # Every 20 seconds
                    frame_path=f"/app/demo_frames/video_{video.id}_frame_{j+1}.jpg",
                    frame_metadata={"description": frame_desc, "is_sample": True}
                )
                db.add(frame)
                db.flush()  # Get the frame ID
                
                # Create realistic embedding (1536 dimensions for OpenAI)
                # Generate embeddings that would cluster around similar concepts
                base_embedding = np.random.randn(1536).astype(np.float32)
                
                # Add semantic similarity for related concepts
                if "car" in frame_desc.lower():
                    base_embedding[0:50] += 0.5  # Car-related features
                if "traffic" in frame_desc.lower() or "intersection" in frame_desc.lower():
                    base_embedding[50:100] += 0.5  # Traffic features  
                if "person" in frame_desc.lower() or "pedestrian" in frame_desc.lower():
                    base_embedding[100:150] += 0.5  # Person features
                if "night" in frame_desc.lower():
                    base_embedding[150:200] += 0.5  # Night features
                if "bicycle" in frame_desc.lower():
                    base_embedding[200:250] += 0.5  # Bicycle features
                
                # Normalize the embedding
                embedding_vector = base_embedding / np.linalg.norm(base_embedding)
                
                # Create embedding record
                embedding = Embedding(
                    frame_id=frame.id,
                    embedding=embedding_vector.tolist(),
                    model_name="text-embedding-ada-002"
                )
                db.add(embedding)
        
        db.commit()
        print(f"Created {len(video_scenarios)} sample videos with {sum(len(v['frame_descriptions']) for v in video_scenarios)} frames and embeddings")

if __name__ == "__main__":
    print("Creating sample data for RareSift...")
    
    # Create demo user
    user_id = create_sample_user()
    
    # Create sample videos and frames with embeddings
    create_sample_videos_and_frames(user_id)
    
    print("✅ Sample data creation completed!")