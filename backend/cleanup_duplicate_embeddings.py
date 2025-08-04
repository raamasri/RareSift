#!/usr/bin/env python3
"""
Clean up duplicate embeddings - keep only the most recent embedding per frame
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func
from app.core.config import settings
from app.models.video import Frame, Embedding
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def cleanup_duplicate_embeddings():
    """Remove duplicate embeddings, keeping only the most recent one per frame"""
    
    engine = create_engine(settings.database_url)
    
    with Session(bind=engine) as db:
        # First, get current statistics
        total_embeddings_before = db.query(Embedding).count()
        total_frames = db.query(Frame).count()
        
        logger.info(f"Before cleanup: {total_embeddings_before} embeddings for {total_frames} frames")
        
        # Find frames with duplicate embeddings
        duplicates = db.query(
            Embedding.frame_id,
            func.count(Embedding.id).label('count')
        ).group_by(Embedding.frame_id).having(func.count(Embedding.id) > 1).all()
        
        logger.info(f"Found {len(duplicates)} frames with duplicate embeddings")
        
        deleted_count = 0
        
        for frame_id, count in duplicates:
            # Get all embeddings for this frame, ordered by creation time (newest first)
            frame_embeddings = db.query(Embedding).filter(
                Embedding.frame_id == frame_id
            ).order_by(Embedding.created_at.desc()).all()
            
            # Keep the first (most recent) embedding, delete the rest
            embeddings_to_delete = frame_embeddings[1:]  # Skip the first (most recent)
            
            for embedding in embeddings_to_delete:
                db.delete(embedding)
                deleted_count += 1
            
            if len(embeddings_to_delete) > 0:
                logger.debug(f"Frame {frame_id}: kept 1, deleted {len(embeddings_to_delete)} duplicates")
        
        # Commit the changes
        db.commit()
        
        # Get final statistics
        total_embeddings_after = db.query(Embedding).count()
        
        logger.info(f"Cleanup complete!")
        logger.info(f"Deleted {deleted_count} duplicate embeddings")
        logger.info(f"After cleanup: {total_embeddings_after} embeddings for {total_frames} frames")
        logger.info(f"Coverage: {(total_embeddings_after/total_frames*100):.1f}%" if total_frames > 0 else "No frames")

if __name__ == "__main__":
    cleanup_duplicate_embeddings()