#!/usr/bin/env python3
"""
Script to create a demo user and API key for testing RareSift search functionality
"""
import sys
import os
sys.path.append('/Users/raamasrivatsan/coding projects/RareSift/backend')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import User, APIKey
from app.core.auth import get_password_hash, generate_api_key
from datetime import datetime

# Database connection
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/raresift"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_demo_user():
    db = SessionLocal()
    try:
        # Check if demo user already exists
        existing_user = db.query(User).filter(User.email == "demo@raresift.com").first()
        if existing_user:
            print(f"Demo user already exists with ID: {existing_user.id}")
            return existing_user
        
        # Create demo user
        hashed_password = get_password_hash("demo123")
        user = User(
            email="demo@raresift.com",
            hashed_password=hashed_password,
            full_name="Demo User",
            company="RareSift Demo",
            role="Developer",
            is_active=True,
            is_verified=True
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        print(f"✅ Created demo user: {user.email} (ID: {user.id})")
        return user
        
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        db.rollback()
        return None
    finally:
        db.close()

def create_api_key(user_id):
    db = SessionLocal()
    try:
        # Generate API key
        full_key, key_hash, key_prefix = generate_api_key()
        
        # Create API key record
        api_key = APIKey(
            user_id=user_id,
            name="Demo API Key",
            key_hash=key_hash,
            key_prefix=key_prefix,
            permissions={"read": True, "write": True},
            rate_limit_per_hour=1000,
            is_active=True
        )
        
        db.add(api_key)
        db.commit()
        db.refresh(api_key)
        
        print(f"✅ Created API key: {key_prefix}...")
        print(f"📋 Full API Key: {full_key}")
        print("\n🔑 Use this API key in your requests:")
        print(f"   Authorization: Bearer {full_key}")
        
        return full_key
        
    except Exception as e:
        print(f"❌ Error creating API key: {e}")
        db.rollback()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Creating demo user and API key for RareSift...")
    
    # Create demo user
    user = create_demo_user()
    if not user:
        sys.exit(1)
    
    # Create API key
    api_key = create_api_key(user.id)
    if not api_key:
        sys.exit(1)
    
    print("\n✨ Setup complete! You can now test the search API.")
    print("\n📝 Example curl command:")
    print(f"""curl -X POST "http://localhost:8000/api/v1/search/text" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer {api_key}" \\
  -d '{{"query": "white car", "limit": 5, "similarity_threshold": 0.5}}'""")