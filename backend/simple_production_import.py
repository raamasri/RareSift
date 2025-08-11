#!/usr/bin/env python3
"""
Simple production import for RareSift complete dataset
Run this script directly on Render production server
"""

import json
import gzip
import os
import sys
from sqlalchemy import create_engine, text

def main():
    print("🚀 RareSift Production Data Import")
    
    # Use production DATABASE_URL
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("❌ DATABASE_URL not found in environment")
        return False
    
    # Check for export file
    export_file = "complete_dataset_export_20250807_003349.json.gz"
    if not os.path.exists(export_file):
        print(f"❌ Export file not found: {export_file}")
        print("💡 Upload the export file to this directory first")
        return False
    
    print("📂 Loading export file...")
    with gzip.open(export_file, 'rt') as f:
        data = json.load(f)
    
    print(f"✅ Loaded: {len(data['videos'])} videos, {len(data['frames'])} frames, {len(data['embeddings'])} embeddings")
    
    # Connect to database
    engine = create_engine(db_url)
    
    with engine.connect() as conn:
        print("🔧 Setting up database schema...")
        
        # Ensure pgvector extension
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        
        # Add embedding column to frames if missing
        try:
            conn.execute(text("ALTER TABLE frames ADD COLUMN embedding vector(1536)"))
            print("✅ Added embedding column to frames")
        except:
            print("ℹ️  Embedding column already exists")
        
        # Clear and import videos (only if we have more data)
        current_videos = conn.execute(text("SELECT COUNT(*) FROM videos")).fetchone()[0]
        if current_videos < len(data['videos']):
            print(f"📹 Importing {len(data['videos'])} videos...")
            conn.execute(text("DELETE FROM embeddings; DELETE FROM frames; DELETE FROM videos;"))
            
            for video in data['videos']:
                conn.execute(text("""
                    INSERT INTO videos (
                        id, filename, original_filename, duration, fps, width, height,
                        video_metadata, weather, time_of_day, location, is_processed, created_at
                    ) VALUES (
                        :id, :filename, :original_filename, :duration, :fps, :width, :height,
                        :video_metadata, :weather, :time_of_day, :location, true, :created_at
                    ) ON CONFLICT (id) DO NOTHING
                """), video)
            
            print(f"✅ Imported {len(data['videos'])} videos")
            
            # Import frames
            print(f"🖼️  Importing {len(data['frames'])} frames...")
            for i, frame in enumerate(data['frames']):
                conn.execute(text("""
                    INSERT INTO frames (
                        id, video_id, timestamp, frame_path, frame_metadata, created_at, description
                    ) VALUES (
                        :id, :video_id, :timestamp, :frame_path, :frame_metadata, :created_at, :description
                    ) ON CONFLICT (id) DO NOTHING
                """), frame)
                
                if i % 1000 == 0:
                    print(f"   {i}/{len(data['frames'])} frames...")
            
            print(f"✅ Imported {len(data['frames'])} frames")
        
        # Import embeddings
        print(f"🧠 Importing {len(data['embeddings'])} embeddings...")
        imported = 0
        
        for i, emb in enumerate(data['embeddings']):
            try:
                # Fix embedding format
                char_list = emb['embedding']
                vector_str = ''.join(char_list)
                
                if vector_str.startswith('[') and vector_str.endswith(']'):
                    numbers_str = vector_str[1:-1]
                    numbers = [float(x.strip()) for x in numbers_str.split(',')]
                    
                    if len(numbers) == 1536:
                        vector_pg = '[' + ','.join(map(str, numbers)) + ']'
                        conn.execute(text(f"""
                            INSERT INTO embeddings (id, frame_id, embedding, model_name, created_at)
                            VALUES (:id, :frame_id, '{vector_pg}'::vector, :model_name, :created_at)
                            ON CONFLICT (id) DO NOTHING
                        """), {
                            'id': emb['id'],
                            'frame_id': emb['frame_id'],
                            'model_name': emb['model_name'],
                            'created_at': emb['created_at']
                        })
                        imported += 1
                
                if i % 500 == 0:
                    conn.commit()
                    print(f"   {imported}/{len(data['embeddings'])} embeddings...")
            
            except Exception as e:
                if imported < 10:  # Only show first few errors
                    print(f"⚠️  Error with embedding {emb['id']}: {str(e)[:100]}")
        
        conn.commit()
        print(f"✅ Imported {imported} embeddings")
        
        # Verify
        video_count = conn.execute(text("SELECT COUNT(*) FROM videos")).fetchone()[0]
        frame_count = conn.execute(text("SELECT COUNT(*) FROM frames")).fetchone()[0]
        embedding_count = conn.execute(text("SELECT COUNT(*) FROM embeddings")).fetchone()[0]
        
        print(f"🔍 Final counts: {video_count} videos, {frame_count} frames, {embedding_count} embeddings")
        
        if video_count >= 22 and frame_count >= 4000 and embedding_count >= 5000:
            print("🎉 Import successful!")
            return True
        else:
            print("⚠️  Import may be incomplete")
            return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)