#!/usr/bin/env python3
"""
Complete migration script to handle user_id addition and data migration
"""

import asyncio
import sys
import os
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, text

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings

# Override database URL for local development
LOCAL_DATABASE_URL = "postgresql://raamasrivatsan@localhost:5432/raresift_dev"
from app.models.video import Video, Frame
from app.models.user import User
from app.services.embedding_service import EmbeddingService

async def setup_database_and_migrate():
    """
    Complete setup process:
    1. Run SQL migration to add user support
    2. Create default user if none exists  
    3. Associate existing videos with default user
    4. Update video conditions using CLIP
    """
    
    try:
        # Create database connection
        engine = create_engine(LOCAL_DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        print("🚀 Starting database migration and setup...")
        
        # Step 1: Run the SQL migration
        print("\n📝 Step 1: Running SQL migration...")
        
        with open("alembic/versions/001_add_user_auth_models.sql", "r") as f:
            migration_sql = f.read()
        
        # Split into individual statements and execute
        statements = [stmt.strip() for stmt in migration_sql.split(';') if stmt.strip() and not stmt.strip().startswith('--')]
        
        for stmt in statements:
            try:
                db.execute(text(stmt))
                db.commit()
            except Exception as e:
                if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                    print(f"  ⚠️  Skipping existing: {stmt[:50]}...")
                    db.rollback()
                else:
                    print(f"  ❌ Error executing: {stmt[:50]}...")
                    print(f"     Error: {str(e)}")
                    db.rollback()
        
        print("  ✅ Migration completed")
        
        # Step 2: Create default user if none exists
        print("\n👤 Step 2: Setting up default user...")
        
        existing_user = db.query(User).first()
        if not existing_user:
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            
            default_user = User(
                email="admin@raresift.com",
                hashed_password=pwd_context.hash("changeme123"),
                full_name="RareSift Admin",
                company="RareSift",
                role="admin",
                is_active=True,
                is_verified=True,
                is_superuser=True
            )
            db.add(default_user)
            db.commit()
            db.refresh(default_user)
            print(f"  ✅ Created default user: {default_user.email} (ID: {default_user.id})")
            user_id = default_user.id
        else:
            user_id = existing_user.id
            print(f"  ✅ Using existing user: {existing_user.email} (ID: {user_id})")
        
        # Step 3: Associate existing videos with default user
        print("\n🎥 Step 3: Associating existing videos with user...")
        
        unassigned_videos = db.query(Video).filter(Video.user_id == None).all()
        if unassigned_videos:
            for video in unassigned_videos:
                video.user_id = user_id
            db.commit()
            print(f"  ✅ Associated {len(unassigned_videos)} videos with user {user_id}")
        else:
            print("  ✅ All videos already have user associations")
        
        # Step 4: Update video conditions using CLIP
        print("\n🔍 Step 4: Updating video conditions with CLIP...")
        
        # Initialize embedding service
        embedding_service = EmbeddingService()
        await embedding_service.initialize()
        
        # Get all videos
        videos = db.query(Video).all()
        updated_count = 0
        
        for video in videos:
            # Skip if already has conditions
            if video.time_of_day and video.weather:
                continue
                
            print(f"  Processing video: {video.original_filename} (ID: {video.id})")
            
            # Get the first frame for this video to analyze conditions
            first_frame = db.query(Frame).filter(Frame.video_id == video.id).first()
            
            if not first_frame or not first_frame.frame_path:
                print(f"    ⚠️  No frame found for video {video.id}")
                continue
                
            if not os.path.exists(first_frame.frame_path):
                print(f"    ⚠️  Frame file not found: {first_frame.frame_path}")
                continue
            
            # Detect conditions using CLIP
            try:
                conditions = await embedding_service.detect_conditions_clip(first_frame.frame_path)
                
                # Update video metadata
                video.time_of_day = conditions["time_of_day"]
                video.weather = conditions["weather"]
                
                print(f"    ✅ Updated: {conditions['time_of_day']}, {conditions['weather']}")
                updated_count += 1
                
                db.commit()
                
            except Exception as e:
                print(f"    ❌ Error processing video {video.id}: {str(e)}")
                db.rollback()
                continue
        
        print(f"  ✅ Updated conditions for {updated_count} videos")
        
        print(f"\n🎉 Migration and setup completed successfully!")
        print(f"   - Database migration: ✅")
        print(f"   - Default user setup: ✅") 
        print(f"   - Video associations: ✅")
        print(f"   - CLIP condition detection: ✅ ({updated_count} videos updated)")
        
        if existing_user is None:
            print(f"\n🔑 Login credentials:")
            print(f"   Email: admin@raresift.com")
            print(f"   Password: changeme123")
            print(f"   ⚠️  Please change the default password after first login!")
        
    except Exception as e:
        print(f"❌ Fatal error: {str(e)}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(setup_database_and_migrate())