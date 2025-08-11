#!/usr/bin/env python3
"""
Direct production import of complete dataset using existing export file
This script should be run ON the production server
"""

import json
import gzip
import os
import sys
from sqlalchemy import create_engine, text
from pathlib import Path

def connect_to_production_db():
    """Connect to the production PostgreSQL database using environment variables."""
    try:
        # Get DATABASE_URL from environment (automatically available in Render)
        db_url = os.getenv('DATABASE_URL')
        
        if not db_url:
            print("❌ DATABASE_URL environment variable not found")
            print("💡 This script should be run in the production environment where DATABASE_URL is set")
            return None
        
        print(f"🔗 Connecting to database: {db_url.split('@')[1] if '@' in db_url else 'hidden'}")
        conn = psycopg2.connect(db_url)
        conn.autocommit = False  # We want transaction control
        print("✅ Connected to production database")
        return conn
    except Exception as e:
        print(f"❌ Failed to connect to production database: {e}")
        return None

def load_dataset(filename: str) -> Dict[str, Any]:
    """Load the compressed dataset export file."""
    print(f"📂 Loading dataset from {filename}...")
    
    with gzip.open(filename, 'rt', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"✅ Dataset loaded: {len(data['videos'])} videos, {len(data['frames'])} frames, {len(data['embeddings'])} embeddings")
    return data

def clear_existing_data(conn):
    """Clear all existing data from production database."""
    print("🧹 Clearing existing data...")
    
    cursor = conn.cursor()
    
    try:
        # Clear in correct order due to foreign key constraints
        cursor.execute("DELETE FROM exports;")
        cursor.execute("DELETE FROM searches;")
        cursor.execute("DELETE FROM embeddings;")
        cursor.execute("DELETE FROM frames;")
        cursor.execute("DELETE FROM videos;")
        cursor.execute("DELETE FROM users;")
        
        # Reset sequences to start from 1
        cursor.execute("ALTER SEQUENCE users_id_seq RESTART WITH 1;")
        cursor.execute("ALTER SEQUENCE videos_id_seq RESTART WITH 1;")
        cursor.execute("ALTER SEQUENCE frames_id_seq RESTART WITH 1;")
        cursor.execute("ALTER SEQUENCE searches_id_seq RESTART WITH 1;")
        cursor.execute("ALTER SEQUENCE exports_id_seq RESTART WITH 1;")
        
        conn.commit()
        print("✅ Database cleared and sequences reset")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Failed to clear data: {e}")
        raise
    finally:
        cursor.close()

def create_demo_user(conn) -> int:
    """Create demo user for production data."""
    print("👤 Creating demo user...")
    
    cursor = conn.cursor()
    
    try:
        # Create demo user with hashed password
        user_data = {
            'username': 'demo_user',
            'email': 'demo@raresift.com', 
            'hashed_password': '$2b$12$demo.hash.for.production.user',  # Placeholder hash
            'full_name': 'Demo User',
            'is_active': True,
            'created_at': datetime.utcnow()
        }
        
        cursor.execute("""
            INSERT INTO users (username, email, hashed_password, full_name, is_active, created_at)
            VALUES (%(username)s, %(email)s, %(hashed_password)s, %(full_name)s, %(is_active)s, %(created_at)s)
            RETURNING id
        """, user_data)
        
        user_id = cursor.fetchone()[0]
        conn.commit()
        print(f"✅ Demo user created with ID: {user_id}")
        return user_id
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Failed to create user: {e}")
        raise
    finally:
        cursor.close()

def import_videos(conn, dataset: Dict[str, Any], user_id: int) -> Dict[int, int]:
    """Import video records and return mapping of old_id -> new_id."""
    print(f"🎥 Importing {len(dataset['videos'])} videos...")
    
    cursor = conn.cursor()
    video_id_mapping = {}
    
    try:
        for old_video in dataset['videos']:
            # Convert .MP4 to .m4v for compressed videos
            filename = old_video['filename'].replace('.MP4', '.m4v')
            original_filename = old_video['original_filename'].replace('.MP4', '.m4v')
            
            video_data = {
                'filename': filename,
                'original_filename': original_filename,
                'duration': old_video['duration'],
                'fps': old_video['fps'],
                'width': old_video['width'],
                'height': old_video['height'],
                'file_size': old_video.get('file_size', 0),
                'video_metadata': json.dumps(old_video.get('video_metadata', {})),
                'weather': old_video.get('weather'),
                'time_of_day': old_video.get('time_of_day'),
                'location': old_video.get('location'),
                'user_id': user_id,
                'is_processed': True,
                'processing_status': 'completed',
                'uploaded_at': datetime.utcnow(),
                'processed_at': datetime.utcnow()
            }
            
            cursor.execute("""
                INSERT INTO videos (
                    filename, original_filename, duration, fps, width, height, file_size,
                    video_metadata, weather, time_of_day, location, user_id, is_processed,
                    processing_status, uploaded_at, processed_at
                ) VALUES (
                    %(filename)s, %(original_filename)s, %(duration)s, %(fps)s, %(width)s, %(height)s,
                    %(file_size)s, %(video_metadata)s, %(weather)s, %(time_of_day)s, %(location)s,
                    %(user_id)s, %(is_processed)s, %(processing_status)s, %(uploaded_at)s, %(processed_at)s
                ) RETURNING id
            """, video_data)
            
            new_video_id = cursor.fetchone()[0]
            video_id_mapping[old_video['id']] = new_video_id
            print(f"  📹 {filename} -> ID {new_video_id}")
        
        conn.commit()
        print(f"✅ Imported {len(video_id_mapping)} videos")
        return video_id_mapping
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Failed to import videos: {e}")
        raise
    finally:
        cursor.close()

def import_frames_batch(conn, frames_data: List[Tuple], batch_size: int = 100):
    """Import frames in batches for better performance."""
    cursor = conn.cursor()
    
    try:
        execute_values(
            cursor,
            """INSERT INTO frames (
                video_id, frame_number, timestamp_seconds, frame_filename, extracted_at
            ) VALUES %s RETURNING id""",
            frames_data,
            template=None,
            page_size=batch_size,
            fetch=True
        )
        
        # Get all the new frame IDs
        new_frame_ids = [row[0] for row in cursor.fetchall()]
        return new_frame_ids
        
    except Exception as e:
        print(f"❌ Failed to import frame batch: {e}")
        raise
    finally:
        cursor.close()

def import_embeddings_batch(conn, embeddings_data: List[Tuple], batch_size: int = 50):
    """Import embeddings in batches for better performance."""
    cursor = conn.cursor()
    
    try:
        execute_values(
            cursor,
            """INSERT INTO embeddings (
                frame_id, embedding_vector, model_name, created_at
            ) VALUES %s""",
            embeddings_data,
            template=None,
            page_size=batch_size
        )
        
    except Exception as e:
        print(f"❌ Failed to import embedding batch: {e}")
        raise
    finally:
        cursor.close()

def import_frames_and_embeddings(conn, dataset: Dict[str, Any], video_id_mapping: Dict[int, int]):
    """Import frames and embeddings with optimized batch processing."""
    print(f"🖼️  Importing {len(dataset['frames'])} frames and {len(dataset['embeddings'])} embeddings...")
    
    # Create mapping of old_frame_id -> embedding for quick lookup
    embeddings_by_frame = {}
    for embedding in dataset['embeddings']:
        embeddings_by_frame[embedding['frame_id']] = embedding
    
    # Prepare frames data for batch insert
    frames_data = []
    frames_mapping = {}  # old_frame_id -> new_frame_id
    
    for old_frame in dataset['frames']:
        old_video_id = old_frame['video_id']
        new_video_id = video_id_mapping.get(old_video_id)
        
        if new_video_id:
            frame_tuple = (
                new_video_id,
                old_frame['frame_number'],
                old_frame['timestamp_seconds'],
                old_frame['frame_filename'],
                datetime.utcnow()
            )
            frames_data.append(frame_tuple)
    
    print(f"  📊 Batch importing {len(frames_data)} frames...")
    
    # Import frames in batches
    batch_size = 100
    total_imported_frames = 0
    
    try:
        conn.autocommit = False
        
        for i in range(0, len(frames_data), batch_size):
            batch = frames_data[i:i + batch_size]
            new_frame_ids = import_frames_batch(conn, batch, batch_size)
            
            # Map old frame IDs to new frame IDs
            batch_start_idx = i
            for j, new_frame_id in enumerate(new_frame_ids):
                old_frame = dataset['frames'][batch_start_idx + j]
                frames_mapping[old_frame['id']] = new_frame_id
            
            total_imported_frames += len(new_frame_ids)
            print(f"    ✅ Imported {total_imported_frames}/{len(frames_data)} frames")
        
        conn.commit()
        print(f"✅ All frames imported successfully")
        
        # Now import embeddings
        print(f"  🧠 Batch importing embeddings...")
        embeddings_data = []
        
        for old_frame_id, new_frame_id in frames_mapping.items():
            if old_frame_id in embeddings_by_frame:
                embedding = embeddings_by_frame[old_frame_id]
                
                # Convert embedding vector to PostgreSQL array format
                vector_array = embedding['embedding_vector']
                if isinstance(vector_array, str):
                    # If stored as string, parse it
                    vector_array = json.loads(vector_array)
                
                embedding_tuple = (
                    new_frame_id,
                    vector_array,  # pgvector will handle the array format
                    embedding.get('model_name', 'ViT-B/32'),
                    datetime.utcnow()
                )
                embeddings_data.append(embedding_tuple)
        
        # Import embeddings in smaller batches (embeddings are large)
        embedding_batch_size = 50
        total_imported_embeddings = 0
        
        for i in range(0, len(embeddings_data), embedding_batch_size):
            batch = embeddings_data[i:i + embedding_batch_size]
            import_embeddings_batch(conn, batch, embedding_batch_size)
            total_imported_embeddings += len(batch)
            print(f"    🧠 Imported {total_imported_embeddings}/{len(embeddings_data)} embeddings")
        
        conn.commit()
        print(f"✅ All embeddings imported successfully")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Failed during batch import: {e}")
        raise

def verify_import(conn):
    """Verify the import was successful."""
    print("🔍 Verifying import...")
    
    cursor = conn.cursor()
    
    try:
        # Check counts
        cursor.execute("SELECT COUNT(*) FROM videos;")
        video_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM frames;")
        frame_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM embeddings;")
        embedding_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM users;")
        user_count = cursor.fetchone()[0]
        
        print(f"📊 Import verification:")
        print(f"  Users: {user_count}")
        print(f"  Videos: {video_count}")
        print(f"  Frames: {frame_count}")
        print(f"  Embeddings: {embedding_count}")
        
        # Test a sample embedding query to ensure pgvector is working
        cursor.execute("""
            SELECT COUNT(*) FROM embeddings e 
            JOIN frames f ON e.frame_id = f.id 
            WHERE array_length(e.embedding_vector, 1) = 1536
        """)
        valid_embeddings = cursor.fetchone()[0]
        print(f"  Valid 1536-dim embeddings: {valid_embeddings}")
        
        success = (video_count > 0 and frame_count > 0 and embedding_count > 0 and valid_embeddings > 0)
        
        if success:
            print("✅ Import verification successful!")
        else:
            print("❌ Import verification failed - data missing")
            
        return success
        
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False
    finally:
        cursor.close()

def main():
    """Main import process."""
    print("=== RareSift Direct Production Database Import ===")
    print("⚠️  WARNING: This will completely replace all data in production!")
    print()
    
    # Load dataset
    dataset_file = "complete_dataset_export_20250807_003349.json.gz"
    if not os.path.exists(dataset_file):
        print(f"❌ Dataset file not found: {dataset_file}")
        return False
    
    dataset = load_dataset(dataset_file)
    
    # Connect to production database
    conn = connect_to_production_db()
    if not conn:
        return False
    
    try:
        # Clear existing data
        clear_existing_data(conn)
        
        # Create demo user
        user_id = create_demo_user(conn)
        
        # Import videos
        video_id_mapping = import_videos(conn, dataset, user_id)
        
        # Import frames and embeddings
        import_frames_and_embeddings(conn, dataset, video_id_mapping)
        
        # Verify the import
        success = verify_import(conn)
        
        if success:
            print()
            print("🎉 PRODUCTION IMPORT COMPLETED SUCCESSFULLY!")
            print(f"📈 Imported: {len(dataset['videos'])} videos, {len(dataset['frames'])} frames, {len(dataset['embeddings'])} embeddings")
            print("🔗 Production API: https://raresift-backend.onrender.com")
            print("🔍 Search should now work with full dataset!")
        else:
            print("❌ Import failed verification")
        
        return success
        
    except Exception as e:
        print(f"💥 Import failed: {e}")
        return False
    finally:
        conn.close()
        print("🔌 Database connection closed")

def run_production_import():
    """Wrapper function with safety checks for production import."""
    print("⚠️  SAFETY CHECK: This script will COMPLETELY REPLACE all production data.")
    print("🔗 Target: Render PostgreSQL production database")
    print("📊 Data: 22 videos, 4,959 frames, 6,700+ embeddings")
    print()
    
    # Check if we're in production environment
    if not os.getenv('DATABASE_URL'):
        print("❌ DATABASE_URL not found. This script must run in production environment.")
        print("💡 Options to run this script:")
        print("   1. SSH into Render service: render ssh srv-d24t5ak9c44c73b0j26g")
        print("   2. Deploy as one-time job on Render")
        print("   3. Set DATABASE_URL locally (not recommended for security)")
        return False
    
    # Final confirmation before running
    confirm = input("🚨 Type 'YES' to confirm complete data replacement: ")
    if confirm != 'YES':
        print("❌ Import cancelled - confirmation not received")
        return False
    
    return main()

if __name__ == "__main__":
    # Uncomment the line below to actually run the import
    # run_production_import()
    
    print("✋ Script loaded but not executed (safety measure)")
    print("💡 To run this script in production environment:")
    print("   1. SSH to Render: render ssh srv-d24t5ak9c44c73b0j26g")
    print("   2. Upload this script and dataset file")
    print("   3. Uncomment run_production_import() and run script")
    print("   4. Or deploy as one-time job on Render")