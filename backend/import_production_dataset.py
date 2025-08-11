#!/usr/bin/env python3
"""
Import complete dataset with embeddings to production database
Handles user creation, video associations, batch imports, and rollback capability
"""

import json
import os
import gzip
import sys
import argparse
import shutil
from datetime import datetime
from typing import Dict, List
import asyncio
from pathlib import Path

# Add the backend directory to Python path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.video import Video, Frame, Embedding
from app.models.user import User
from app.core.database import Base
from passlib.context import CryptContext
import numpy as np

class ProductionDatasetImporter:
    """Import complete dataset to production database"""
    
    def __init__(self, dataset_file: str):
        self.dataset_file = dataset_file
        self.engine = create_engine(settings.database_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.backup_file = None
        
    def load_dataset(self) -> Dict:
        """Load dataset from compressed JSON file"""
        print(f"📦 Loading dataset from {self.dataset_file}...")
        
        if self.dataset_file.endswith('.gz'):
            with gzip.open(self.dataset_file, 'rt', encoding='utf-8') as f:
                data = json.load(f)
        else:
            with open(self.dataset_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        
        print(f"✅ Loaded dataset:")
        print(f"   - Videos: {len(data['videos'])}")
        print(f"   - Frames: {len(data['frames'])}")
        print(f"   - Embeddings: {len(data['embeddings'])}")
        
        return data
    
    def create_backup(self, db):
        """Create backup of existing production data"""
        print("💾 Creating backup of existing production database...")
        
        backup_data = {
            "backup_info": {
                "timestamp": datetime.now().isoformat(),
                "description": "Pre-import backup"
            },
            "videos": [],
            "frames": [],
            "embeddings": []
        }
        
        # Export existing data
        videos = db.query(Video).all()
        for video in videos:
            backup_data["videos"].append({
                "id": video.id,
                "filename": video.filename,
                "original_filename": video.original_filename,
                "file_path": video.file_path,
                "file_size": video.file_size,
                "duration": video.duration,
                "fps": video.fps,
                "width": video.width,
                "height": video.height,
                "video_metadata": video.video_metadata,
                "weather": video.weather,
                "time_of_day": video.time_of_day,
                "location": video.location,
                "speed_avg": video.speed_avg,
                "is_processed": video.is_processed,
                "processing_started_at": video.processing_started_at.isoformat() if video.processing_started_at else None,
                "processing_completed_at": video.processing_completed_at.isoformat() if video.processing_completed_at else None,
                "processing_error": video.processing_error,
                "user_id": video.user_id,
                "created_at": video.created_at.isoformat() if video.created_at else None,
                "updated_at": video.updated_at.isoformat() if video.updated_at else None
            })
            
        frames = db.query(Frame).all()
        for frame in frames:
            backup_data["frames"].append({
                "id": frame.id,
                "video_id": frame.video_id,
                "frame_number": frame.frame_number,
                "timestamp": frame.timestamp,
                "frame_path": frame.frame_path,
                "speed": frame.speed,
                "frame_metadata": frame.frame_metadata,
                "created_at": frame.created_at.isoformat() if frame.created_at else None
            })
            
        embeddings = db.query(Embedding).all()
        for embedding in embeddings:
            backup_data["embeddings"].append({
                "id": embedding.id,
                "frame_id": embedding.frame_id,
                "embedding": embedding.embedding.tolist() if hasattr(embedding.embedding, 'tolist') else list(embedding.embedding),
                "model_name": embedding.model_name,
                "created_at": embedding.created_at.isoformat() if embedding.created_at else None
            })
        
        # Save backup
        backup_filename = f"production_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json.gz"
        with gzip.open(backup_filename, 'wt') as f:
            json.dump(backup_data, f, indent=2)
        
        backup_size = os.path.getsize(backup_filename) / (1024 * 1024)
        print(f"✅ Backup created: {backup_filename} ({backup_size:.1f} MB)")
        print(f"   - Videos: {len(backup_data['videos'])}")
        print(f"   - Frames: {len(backup_data['frames'])}")
        print(f"   - Embeddings: {len(backup_data['embeddings'])}")
        
        self.backup_file = backup_filename
        return backup_filename
    
    def clear_existing_data(self, db):
        """Clear existing data (with backup option)"""
        print("🗑️  Clearing existing data...")
        
        # Get current counts
        video_count = db.query(Video).count()
        frame_count = db.query(Frame).count()
        embedding_count = db.query(Embedding).count()
        
        print(f"   Current data: {video_count} videos, {frame_count} frames, {embedding_count} embeddings")
        
        if video_count > 0:
            # Optional: Create backup before clearing
            response = input("⚠️  Clear existing data? (y/N): ")
            if response.lower() != 'y':
                print("❌ Import cancelled")
                return False
        
        # Clear in correct order (foreign key constraints)
        db.execute(text("DELETE FROM embeddings"))
        db.execute(text("DELETE FROM frames"))
        db.execute(text("DELETE FROM videos"))
        db.commit()
        
        print("✅ Existing data cleared")
        return True
    
    def ensure_default_user(self, db):
        """Ensure default user exists"""
        print("👤 Setting up default user...")
        
        user = db.query(User).first()
        if not user:
            user = User(
                email="admin@raresift.com",
                hashed_password=self.pwd_context.hash("changeme123"),
                full_name="RareSift Admin",
                company="RareSift",
                role="admin",
                is_active=True,
                is_verified=True,
                is_superuser=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"✅ Created default user: {user.email} (ID: {user.id})")
        else:
            print(f"✅ Using existing user: {user.email} (ID: {user.id})")
        
        return user.id
    
    def import_videos(self, db, videos_data: List[Dict], user_id: int):
        """Import videos"""
        print(f"🎥 Importing {len(videos_data)} videos...")
        
        for video_data in videos_data:
            video = Video(
                id=video_data['id'],
                filename=video_data['filename'],
                original_filename=video_data['original_filename'],
                file_path=video_data['file_path'],
                file_size=video_data['file_size'],
                duration=video_data['duration'],
                fps=video_data['fps'],
                width=video_data['width'],
                height=video_data['height'],
                video_metadata=video_data['video_metadata'],
                weather=video_data['weather'],
                time_of_day=video_data['time_of_day'],
                location=video_data['location'],
                speed_avg=video_data['speed_avg'],
                is_processed=video_data['is_processed'],
                processing_started_at=datetime.fromisoformat(video_data['processing_started_at']) if video_data['processing_started_at'] else None,
                processing_completed_at=datetime.fromisoformat(video_data['processing_completed_at']) if video_data['processing_completed_at'] else None,
                processing_error=video_data['processing_error'],
                user_id=user_id,
                created_at=datetime.fromisoformat(video_data['created_at']) if video_data['created_at'] else None,
                updated_at=datetime.fromisoformat(video_data['updated_at']) if video_data['updated_at'] else None
            )
            db.add(video)
        
        db.commit()
        print(f"✅ Imported {len(videos_data)} videos")
    
    def import_frames(self, db, frames_data: List[Dict]):
        """Import frames"""
        print(f"🖼️  Importing {len(frames_data)} frames...")
        
        batch_size = 1000
        for i in range(0, len(frames_data), batch_size):
            batch = frames_data[i:i + batch_size]
            
            for frame_data in batch:
                frame = Frame(
                    id=frame_data['id'],
                    video_id=frame_data['video_id'],
                    frame_number=frame_data['frame_number'],
                    timestamp=frame_data['timestamp'],
                    frame_path=frame_data['frame_path'],
                    speed=frame_data['speed'],
                    frame_metadata=frame_data['frame_metadata'],
                    created_at=datetime.fromisoformat(frame_data['created_at']) if frame_data['created_at'] else None
                )
                db.add(frame)
            
            db.commit()
            print(f"   Imported batch {i//batch_size + 1}/{(len(frames_data) + batch_size - 1)//batch_size}")
        
        print(f"✅ Imported {len(frames_data)} frames")
    
    def import_embeddings(self, db, embeddings_data: List[Dict]):
        """Import embeddings in batches"""
        print(f"🧠 Importing {len(embeddings_data)} embeddings...")
        
        batch_size = 500  # Smaller batches for large vectors
        for i in range(0, len(embeddings_data), batch_size):
            batch = embeddings_data[i:i + batch_size]
            
            for embedding_data in batch:
                # Handle different embedding formats
                embedding_raw = embedding_data['embedding']
                if isinstance(embedding_raw, str):
                    # Handle string format like "[0.1, 0.2, ...]"
                    import ast
                    try:
                        embedding_vector = np.array(ast.literal_eval(embedding_raw), dtype=np.float32)
                    except:
                        # Handle malformed string - skip this embedding
                        print(f"⚠️  Skipping malformed embedding {embedding_data['id']}")
                        continue
                elif isinstance(embedding_raw, list):
                    # Handle proper list format
                    embedding_vector = np.array(embedding_raw, dtype=np.float32)
                else:
                    # Handle other formats
                    embedding_vector = np.array(list(embedding_raw), dtype=np.float32)
                
                embedding = Embedding(
                    id=embedding_data['id'],
                    frame_id=embedding_data['frame_id'],
                    embedding=embedding_vector,
                    model_name=embedding_data['model_name'],
                    created_at=datetime.fromisoformat(embedding_data['created_at']) if embedding_data['created_at'] else None
                )
                db.add(embedding)
            
            db.commit()
            print(f"   Imported batch {i//batch_size + 1}/{(len(embeddings_data) + batch_size - 1)//batch_size}")
        
        print(f"✅ Imported {len(embeddings_data)} embeddings")
    
    def verify_import(self, db):
        """Verify the import was successful"""
        print("🔍 Verifying import...")
        
        video_count = db.query(Video).count()
        frame_count = db.query(Frame).count()  
        embedding_count = db.query(Embedding).count()
        
        # Check embedding coverage
        frames_with_embeddings = db.query(Frame.id).join(Embedding).distinct().count()
        coverage = (frames_with_embeddings / frame_count * 100) if frame_count > 0 else 0
        
        print(f"📊 Import Results:")
        print(f"   Videos: {video_count}")
        print(f"   Frames: {frame_count}")
        print(f"   Embeddings: {embedding_count}")
        print(f"   Coverage: {coverage:.1f}%")
        
        if coverage >= 99.0:
            print("✅ Import verification PASSED")
            return True
        else:
            print("❌ Import verification FAILED - low embedding coverage")
            return False
    
    async def run_import(self, skip_backup=False):
        """Run the complete import process"""
        print("🚀 Starting Production Dataset Import")
        print("=" * 60)
        
        try:
            # Load dataset
            data = self.load_dataset()
            
            with self.SessionLocal() as db:
                # Create backup first
                if not skip_backup:
                    self.create_backup(db)
                
                # Clear existing data
                if not self.clear_existing_data(db):
                    return False
                
                # Ensure user exists
                user_id = self.ensure_default_user(db)
                
                # Import data in order
                self.import_videos(db, data['videos'], user_id)
                self.import_frames(db, data['frames'])
                self.import_embeddings(db, data['embeddings'])
                
                # Verify import
                if self.verify_import(db):
                    print("=" * 60)
                    print("🎉 Production Import Complete!")
                    print("🔍 Semantic search should now work with full dataset")
                    if self.backup_file:
                        print(f"💾 Backup saved as: {self.backup_file}")
                    return True
                else:
                    print("❌ Import failed verification")
                    # Offer rollback
                    if self.backup_file:
                        response = input("🔄 Rollback from backup? (y/N): ")
                        if response.lower() == 'y':
                            await self.rollback_from_backup()
                    return False
                    
        except Exception as e:
            print(f"❌ Import failed: {str(e)}")
            import traceback
            traceback.print_exc()
            
            # Offer rollback on error
            if self.backup_file:
                response = input("🔄 Rollback from backup? (y/N): ")
                if response.lower() == 'y':
                    await self.rollback_from_backup()
            return False
    
    async def rollback_from_backup(self):
        """Rollback database from backup file"""
        if not self.backup_file or not os.path.exists(self.backup_file):
            print("❌ No backup file available for rollback")
            return False
            
        print(f"🔄 Rolling back from backup: {self.backup_file}")
        
        try:
            # Load backup data
            with gzip.open(self.backup_file, 'rt') as f:
                backup_data = json.load(f)
            
            with self.SessionLocal() as db:
                # Clear current data
                db.execute(text("DELETE FROM embeddings"))
                db.execute(text("DELETE FROM frames"))
                db.execute(text("DELETE FROM videos"))
                db.commit()
                
                # Restore from backup
                print("🔄 Restoring data from backup...")
                if backup_data['videos']:
                    self.import_videos(db, backup_data['videos'], backup_data['videos'][0]['user_id'])
                if backup_data['frames']:
                    self.import_frames(db, backup_data['frames'])
                if backup_data['embeddings']:
                    self.import_embeddings(db, backup_data['embeddings'])
                
                print("✅ Rollback complete")
                return True
                
        except Exception as e:
            print(f"❌ Rollback failed: {str(e)}")
            return False

async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Import complete dataset to production database')
    parser.add_argument('dataset_file', help='Path to dataset file (.json or .json.gz)')
    parser.add_argument('--skip-backup', action='store_true', help='Skip creating backup before import')
    parser.add_argument('--rollback', help='Rollback from specified backup file')
    parser.add_argument('--verify-only', action='store_true', help='Only verify existing data without importing')
    
    args = parser.parse_args()
    
    # Handle rollback
    if args.rollback:
        if not os.path.exists(args.rollback):
            print(f"❌ Backup file not found: {args.rollback}")
            sys.exit(1)
        
        # Create temp importer for rollback
        importer = ProductionDatasetImporter(args.dataset_file)
        importer.backup_file = args.rollback
        success = await importer.rollback_from_backup()
        sys.exit(0 if success else 1)
    
    # Check dataset file exists
    if not os.path.exists(args.dataset_file):
        print(f"❌ Dataset file not found: {args.dataset_file}")
        sys.exit(1)
    
    importer = ProductionDatasetImporter(args.dataset_file)
    
    # Handle verify-only mode
    if args.verify_only:
        try:
            data = importer.load_dataset()
            with importer.SessionLocal() as db:
                success = importer.verify_import(db)
                sys.exit(0 if success else 1)
        except Exception as e:
            print(f"❌ Verification failed: {e}")
            sys.exit(1)
    
    # Run import
    success = await importer.run_import(skip_backup=args.skip_backup)
    
    if success:
        print("✅ Ready for production use!")
        sys.exit(0)
    else:
        print("❌ Import failed")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())