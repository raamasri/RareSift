#!/usr/bin/env python3
"""
Export complete dataset with embeddings to JSON for import to production
"""

import json
import os
from datetime import datetime
from sqlalchemy import create_engine, text
import numpy as np

def export_dataset():
    """Export the complete local dataset"""
    print("🔄 Exporting complete dataset from local database...")
    
    # Connect to local database
    engine = create_engine("postgresql://postgres:postgres@localhost:5432/raresift")
    
    export_data = {
        "export_info": {
            "timestamp": datetime.now().isoformat(),
            "source": "local_database",
            "description": "Complete RareSift dataset with 22 videos, frames, and embeddings"
        },
        "videos": [],
        "frames": [],
        "embeddings": []
    }
    
    with engine.connect() as conn:
        # Export videos
        print("📹 Exporting videos...")
        videos_result = conn.execute(text("""
            SELECT id, filename, original_filename, file_path, file_size, duration, fps, 
                   width, height, video_metadata, weather, time_of_day, location, speed_avg,
                   is_processed, processing_started_at, processing_completed_at, processing_error,
                   user_id, created_at, updated_at
            FROM videos ORDER BY id
        """)).fetchall()
        
        for row in videos_result:
            export_data["videos"].append({
                "id": row[0],
                "filename": row[1],
                "original_filename": row[2], 
                "file_path": row[3],
                "file_size": row[4],
                "duration": row[5],
                "fps": row[6],
                "width": row[7],
                "height": row[8],
                "video_metadata": row[9],
                "weather": row[10],
                "time_of_day": row[11],
                "location": row[12],
                "speed_avg": row[13],
                "is_processed": row[14],
                "processing_started_at": row[15].isoformat() if row[15] else None,
                "processing_completed_at": row[16].isoformat() if row[16] else None,
                "processing_error": row[17],
                "user_id": row[18],
                "created_at": row[19].isoformat() if row[19] else None,
                "updated_at": row[20].isoformat() if row[20] else None
            })
        
        print(f"✅ Exported {len(export_data['videos'])} videos")
        
        # Export frames  
        print("🖼️  Exporting frames...")
        frames_result = conn.execute(text("""
            SELECT id, video_id, frame_number, timestamp, frame_path, speed, frame_metadata, created_at
            FROM frames ORDER BY video_id, frame_number
        """)).fetchall()
        
        for row in frames_result:
            export_data["frames"].append({
                "id": row[0],
                "video_id": row[1],
                "frame_number": row[2],
                "timestamp": row[3],
                "frame_path": row[4],
                "speed": row[5],
                "frame_metadata": row[6],
                "created_at": row[7].isoformat() if row[7] else None
            })
            
        print(f"✅ Exported {len(export_data['frames'])} frames")
        
        # Export embeddings
        print("🧠 Exporting embeddings...")
        embeddings_result = conn.execute(text("""
            SELECT id, frame_id, embedding, model_name, created_at
            FROM embeddings ORDER BY frame_id
        """)).fetchall()
        
        for row in embeddings_result:
            # Convert pgvector embedding to list
            embedding_vector = row[2]
            if hasattr(embedding_vector, 'tolist'):
                embedding_list = embedding_vector.tolist()
            elif isinstance(embedding_vector, (list, tuple)):
                embedding_list = list(embedding_vector)
            else:
                # Handle string format
                embedding_list = list(embedding_vector)
                
            export_data["embeddings"].append({
                "id": row[0],
                "frame_id": row[1], 
                "embedding": embedding_list,
                "model_name": row[3],
                "created_at": row[4].isoformat() if row[4] else None
            })
            
        print(f"✅ Exported {len(export_data['embeddings'])} embeddings")
    
    # Save to file
    export_filename = f"complete_dataset_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(export_filename, 'w') as f:
        json.dump(export_data, f, indent=2)
    
    file_size = os.path.getsize(export_filename) / (1024 * 1024)  # MB
    
    print("\n" + "="*60)
    print("🎉 Export Complete!")
    print(f"📁 File: {export_filename}")
    print(f"📏 Size: {file_size:.1f} MB")
    print(f"📊 Summary:")
    print(f"   - Videos: {len(export_data['videos'])}")
    print(f"   - Frames: {len(export_data['frames'])}")  
    print(f"   - Embeddings: {len(export_data['embeddings'])}")
    print("="*60)
    
    return export_filename

if __name__ == "__main__":
    export_dataset()