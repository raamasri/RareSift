#!/usr/bin/env python3
"""
Create a demo user for RareSift application
"""

import sys
import os
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from app.core.database import get_db, engine
from app.models.user import User
from app.core.auth import get_password_hash

def create_demo_user():
    """Create a demo user for demo mode"""
    db = Session(bind=engine)
    
    try:
        # Check if demo user already exists
        existing_user = db.query(User).filter(User.email == "demo@raresift.com").first()
        if existing_user:
            print("Demo user already exists")
            return existing_user
        
        # Create demo user
        demo_user = User(
            email="demo@raresift.com",
            hashed_password=get_password_hash("demo123"),
            full_name="Demo User",
            company="RareSift Demo",
            role="Demo",
            is_active=True,
            is_verified=True
        )
        
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
        
        print(f"✅ Created demo user with ID: {demo_user.id}")
        print(f"   Email: demo@raresift.com")
        print(f"   Password: demo123")
        
        return demo_user
        
    except Exception as e:
        print(f"❌ Error creating demo user: {e}")
        db.rollback()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    print("🔑 Creating RareSift Demo User")
    print("=" * 40)
    create_demo_user()