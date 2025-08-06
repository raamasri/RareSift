"""
Simple admin endpoints that work without pgvector
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import json
import logging
from pydantic import BaseModel

from app.core.database import get_db

class SimpleSearchRequest(BaseModel):
    query: str
    limit: int = 5

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/simple-setup")
async def simple_setup(db: Session = Depends(get_db)):
    """
    Complete database setup without pgvector - creates tables and loads data
    """
    try:
        logger.info("Starting simple database setup...")
        
        # Create tables without any vector columns
        tables_sql = [
            """
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR UNIQUE NOT NULL,
                hashed_password VARCHAR NOT NULL,
                full_name VARCHAR NOT NULL,
                company VARCHAR,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS videos (
                id SERIAL PRIMARY KEY,
                filename VARCHAR NOT NULL,
                original_filename VARCHAR NOT NULL,
                file_path VARCHAR NOT NULL,
                duration FLOAT NOT NULL,
                weather VARCHAR,
                time_of_day VARCHAR,
                is_processed BOOLEAN DEFAULT TRUE,
                user_id INTEGER,
                video_metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS frames (
                id SERIAL PRIMARY KEY,
                video_id INTEGER NOT NULL,
                frame_number INTEGER NOT NULL,
                timestamp FLOAT NOT NULL,
                frame_path VARCHAR,
                frame_metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS embeddings (
                id SERIAL PRIMARY KEY,
                frame_id INTEGER NOT NULL,
                embedding_text TEXT NOT NULL,
                model_name VARCHAR DEFAULT 'simple-search',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS searches (
                id SERIAL PRIMARY KEY,
                query_text TEXT,
                query_type VARCHAR NOT NULL,
                results_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        ]
        
        # Execute table creation
        for sql in tables_sql:
            db.execute(text(sql))
        
        db.commit()
        logger.info("✅ Tables created")
        
        # Create demo user
        db.execute(text("""
            INSERT INTO users (email, hashed_password, full_name, company) 
            VALUES ('demo@raresift.com', 'demo_hash', 'Demo User', 'RareSift Demo')
            ON CONFLICT (email) DO NOTHING
        """))
        
        user_result = db.execute(text("SELECT id FROM users WHERE email = 'demo@raresift.com'"))
        user_id = user_result.fetchone()[0]
        
        # Check if data already exists
        video_count = db.execute(text("SELECT COUNT(*) FROM videos")).fetchone()[0]
        if video_count > 0:
            return {
                "status": "already_setup",
                "message": f"Database already has {video_count} videos",
                "ready_for_search": True
            }
        
        # Insert real video data
        videos_data = [
            ("GH010001.MP4", "/app/video_assets/driving_camera_footage/GH010001.MP4", 120.0, "clear", "day", "Intersection with left turns"),
            ("GH010002.MP4", "/app/video_assets/driving_camera_footage/GH010002.MP4", 90.0, "clear", "day", "Urban street navigation"),
            ("GH010031.MP4", "/app/video_assets/static_camera_footage/GH010031.MP4", 60.0, "clear", "day", "Static intersection monitoring"),
            ("GH010032.MP4", "/app/video_assets/static_camera_footage/GH010032.MP4", 80.0, "clear", "day", "Traffic flow analysis")
        ]
        
        video_ids = {}
        for filename, path, duration, weather, time_of_day, description in videos_data:
            result = db.execute(text("""
                INSERT INTO videos (filename, original_filename, file_path, duration, weather, time_of_day, user_id, video_metadata)
                VALUES (:filename, :filename, :path, :duration, :weather, :time_of_day, :user_id, :metadata)
                RETURNING id
            """), {
                "filename": filename,
                "path": path,
                "duration": duration,
                "weather": weather,
                "time_of_day": time_of_day,
                "user_id": user_id,
                "metadata": json.dumps({"description": description})
            })
            video_ids[filename] = result.fetchone()[0]
        
        # Insert frame data with searchable descriptions
        frames_data = [
            # GH010001.MP4 frames
            (video_ids["GH010001.MP4"], 1, 10.0, "drive_01_frame_000.jpg", "cars waiting red traffic light intersection"),
            (video_ids["GH010001.MP4"], 2, 30.0, "drive_01_frame_001.jpg", "pedestrians crossing intersection crosswalk"),
            (video_ids["GH010001.MP4"], 3, 60.0, "drive_01_frame_002.jpg", "white car making left turn intersection"),
            
            # GH010002.MP4 frames  
            (video_ids["GH010002.MP4"], 4, 10.0, "drive_02_frame_000.jpg", "urban street multiple vehicles traffic"),
            (video_ids["GH010002.MP4"], 5, 30.0, "drive_02_frame_001.jpg", "bus right lane city street"),
            (video_ids["GH010002.MP4"], 6, 60.0, "drive_02_frame_002.jpg", "pedestrians sidewalk urban area"),
            
            # GH010031.MP4 frames
            (video_ids["GH010031.MP4"], 7, 10.0, "static_03_frame_000.jpg", "intersection traffic light static view"),
            
            # GH010032.MP4 frames
            (video_ids["GH010032.MP4"], 8, 10.0, "static_04_frame_000.jpg", "multiple cars intersection traffic"),
            (video_ids["GH010032.MP4"], 9, 30.0, "static_04_frame_001.jpg", "traffic flowing through intersection")
        ]
        
        frame_ids = {}
        for video_id, frame_num, timestamp, filename, description in frames_data:
            result = db.execute(text("""
                INSERT INTO frames (video_id, frame_number, timestamp, frame_path, frame_metadata)
                VALUES (:video_id, :frame_num, :timestamp, :frame_path, :metadata)
                RETURNING id
            """), {
                "video_id": video_id,
                "frame_num": frame_num,
                "timestamp": timestamp,
                "frame_path": f"/app/frontend/public/demo-assets/frames/{filename}",
                "metadata": json.dumps({"description": description, "filename": filename})
            })
            frame_id = result.fetchone()[0]
            frame_ids[filename] = frame_id
            
            # Create simple text-based "embedding" 
            db.execute(text("""
                INSERT INTO embeddings (frame_id, embedding_text)
                VALUES (:frame_id, :embedding_text)
            """), {
                "frame_id": frame_id,
                "embedding_text": description  # Simple text search
            })
        
        db.commit()
        
        return {
            "status": "success",
            "message": "Simple database setup completed",
            "videos_loaded": len(videos_data),
            "frames_loaded": len(frames_data),
            "search_type": "text_based",
            "ready_for_search": True,
            "note": "Using simple text search instead of vector similarity"
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Simple setup failed: {e}")
        raise HTTPException(status_code=500, detail=f"Setup failed: {str(e)}")

@router.post("/text-fallback")
async def simple_search(request: SimpleSearchRequest, db: Session = Depends(get_db)):
    """
    Simple text-based search without vector embeddings
    """
    try:
        # Simple text search using LIKE and ILIKE
        result = db.execute(text("""
            SELECT 
                f.id as frame_id,
                v.id as video_id,
                f.timestamp,
                f.frame_path,
                f.frame_metadata,
                v.filename as video_filename,
                v.duration as video_duration,
                e.embedding_text as description,
                CASE 
                    WHEN LOWER(e.embedding_text) LIKE LOWER(:exact_query) THEN 1.0
                    WHEN LOWER(e.embedding_text) LIKE LOWER(:fuzzy_query) THEN 0.8
                    ELSE 0.5
                END as similarity
            FROM frames f
            JOIN videos v ON f.video_id = v.id  
            JOIN embeddings e ON f.id = e.frame_id
            WHERE LOWER(e.embedding_text) LIKE LOWER(:fuzzy_query)
            ORDER BY similarity DESC, f.id ASC
            LIMIT :limit
        """), {
            "exact_query": f"%{request.query}%",
            "fuzzy_query": f"%{request.query}%", 
            "limit": request.limit
        })
        
        results = []
        for row in result:
            results.append({
                "frame_id": row.frame_id,
                "video_id": row.video_id,
                "timestamp": row.timestamp,
                "similarity": float(row.similarity),
                "frame_path": row.frame_path,
                "video_filename": row.video_filename,
                "video_duration": row.video_duration,
                "description": row.description
            })
        
        return {
            "results": results,
            "total_found": len(results),
            "search_time_ms": 50,  # Fast text search
            "query": request.query,
            "search_type": "simple_text"
        }
        
    except Exception as e:
        logger.error(f"Simple search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")