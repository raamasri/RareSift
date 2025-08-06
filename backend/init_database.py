#!/usr/bin/env python3
"""
Database initialization script for RareSift production deployment
Creates all required tables when they don't exist
"""
import os
import sys
import asyncio
from sqlalchemy import text, create_engine
from sqlalchemy.exc import ProgrammingError
import logging

# Add the app directory to the Python path
sys.path.append('/app')

from app.core.database import Base, engine
from app.models.video import Video, Frame, Embedding, Search, Export
from app.models.user import User, APIKey, Session

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_tables_if_not_exist():
    """Create all tables if they don't exist"""
    try:
        logger.info("Creating database tables...")
        
        # Create all tables defined in models
        Base.metadata.create_all(bind=engine)
        
        # Create pgvector extension if it doesn't exist
        with engine.connect() as conn:
            try:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.commit()
                logger.info("Created pgvector extension")
            except Exception as e:
                logger.warning(f"Could not create pgvector extension: {e}")
        
        logger.info("Database initialization completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        return False

def check_tables_exist():
    """Check if required tables exist"""
    required_tables = ['users', 'videos', 'frames', 'embeddings', 'searches', 'exports']
    existing_tables = []
    
    for table in required_tables:
        try:
            with engine.connect() as conn:
                result = conn.execute(text(f"SELECT 1 FROM {table} LIMIT 1"))
                existing_tables.append(table)
                logger.info(f"✅ Table '{table}' exists")
        except ProgrammingError:
            logger.warning(f"❌ Table '{table}' does not exist")
        except Exception as e:
            logger.warning(f"❌ Table '{table}' check failed: {e}")
    
    return existing_tables

if __name__ == "__main__":
    logger.info("Starting database initialization...")
    
    # Check current state
    logger.info("Checking existing tables...")
    existing_tables = check_tables_exist()
    
    # Create missing tables
    success = create_tables_if_not_exist()
    
    if success:
        logger.info("✅ Database initialization completed")
        
        # Verify tables were created
        logger.info("Verifying tables after creation...")
        final_tables = check_tables_exist()
        
        if len(final_tables) == 6:  # All required tables
            logger.info("🎉 All required tables are now available!")
            sys.exit(0)
        else:
            logger.error(f"❌ Missing tables: {set(['users', 'videos', 'frames', 'embeddings', 'searches', 'exports']) - set(final_tables)}")
            sys.exit(1)
    else:
        logger.error("❌ Database initialization failed")
        sys.exit(1)