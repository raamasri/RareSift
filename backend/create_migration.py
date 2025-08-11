#!/usr/bin/env python3
"""
Quick database setup script for RareSift
Creates all tables directly without needing Alembic migrations
"""

import os
import sys
sys.path.append(os.path.dirname(__file__))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.database import Base
from app.models.video import Video, Frame, Embedding, Search, Export

def create_tables():
    """Create all database tables"""
    try:
        # Create engine
        engine = create_engine(settings.database_url)
        
        # Ensure pgvector extension exists
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            conn.commit()
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        print("✅ Database tables created successfully!")
        print("📊 Created tables:")
        for table_name in Base.metadata.tables.keys():
            print(f"   - {table_name}")
            
        return True
        
    except Exception as e:
        print(f"❌ Error creating tables: {str(e)}")
        return False

if __name__ == "__main__":
    success = create_tables()
    sys.exit(0 if success else 1) 