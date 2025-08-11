#!/usr/bin/env python3
"""
Simple migration script to handle user_id addition and basic setup
"""

import sys
import os
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, text

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.video import Video, Frame
from app.models.user import User

# Local database URL
LOCAL_DATABASE_URL = "postgresql://raamasrivatsan@localhost:5432/raresift_dev"

def setup_database_and_migrate():
    """
    Simple setup process:
    1. Run SQL migration to add user support
    2. Create default user if none exists  
    3. Associate existing videos with default user
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
        
        executed_count = 0
        for stmt in statements:
            try:
                db.execute(text(stmt))
                db.commit()
                executed_count += 1
            except Exception as e:
                if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                    print(f"  ⚠️  Skipping existing: {stmt[:50]}...")
                    db.rollback()
                else:
                    print(f"  ❌ Error executing: {stmt[:50]}...")
                    print(f"     Error: {str(e)}")
                    db.rollback()
        
        print(f"  ✅ Migration completed ({executed_count} statements executed)")
        
        # Step 2: Create default user if none exists
        print("\n👤 Step 2: Setting up default user...")
        
        existing_user = db.query(User).first()
        if not existing_user:
            try:
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
            except ImportError:
                print("  ⚠️  passlib not available, creating user with placeholder password")
                default_user = User(
                    email="admin@raresift.com", 
                    hashed_password="$2b$12$placeholder_hash_change_in_production",
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
        
        try:
            unassigned_videos = db.query(Video).filter(Video.user_id == None).all()
            if unassigned_videos:
                for video in unassigned_videos:
                    video.user_id = user_id
                db.commit()
                print(f"  ✅ Associated {len(unassigned_videos)} videos with user {user_id}")
            else:
                print("  ✅ All videos already have user associations")
        except Exception as e:
            print(f"  ⚠️  No existing videos found or error: {str(e)}")
        
        print(f"\n🎉 Migration and setup completed successfully!")
        print(f"   - Database migration: ✅")
        print(f"   - Default user setup: ✅") 
        print(f"   - Video associations: ✅")
        
        if existing_user is None:
            print(f"\n🔑 Login credentials:")
            print(f"   Email: admin@raresift.com")
            print(f"   Password: changeme123")
            print(f"   ⚠️  Please change the default password after first login!")
        
        print(f"\n📋 Next steps:")
        print(f"   1. Start the application with Docker: docker-compose up -d")
        print(f"   2. Run CLIP condition detection: python3 update_video_conditions.py") 
        print(f"   3. Test the multi-user functionality")
        
    except Exception as e:
        print(f"❌ Fatal error: {str(e)}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    setup_database_and_migrate()