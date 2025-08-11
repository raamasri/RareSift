from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector

from app.core.database import Base


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    duration = Column(Float, nullable=False)  # in seconds
    fps = Column(Float, nullable=False)
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    
    # Video metadata
    video_metadata = Column(JSON, default={})  # Flexible metadata storage
    weather = Column(String, nullable=True)  # sunny, rainy, snowy, etc.
    time_of_day = Column(String, nullable=True)  # day, night, dusk, dawn
    location = Column(String, nullable=True)
    speed_avg = Column(Float, nullable=True)  # Average speed in km/h
    
    # Processing status
    is_processed = Column(Boolean, default=False)
    processing_started_at = Column(DateTime, nullable=True)
    processing_completed_at = Column(DateTime, nullable=True)
    processing_error = Column(Text, nullable=True)
    
    # User association for multi-tenancy
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    frames = relationship("Frame", back_populates="video", cascade="all, delete-orphan")
    user = relationship("User", back_populates="videos")


class Frame(Base):
    __tablename__ = "frames"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    frame_number = Column(Integer, nullable=False)
    timestamp = Column(Float, nullable=False)  # Timestamp in video (seconds)
    
    # Frame file info
    frame_path = Column(String, nullable=True)  # Path to extracted frame image
    
    # Frame metadata for this specific frame
    speed = Column(Float, nullable=True)  # Speed at this timestamp
    frame_metadata = Column(JSON, default={})
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())

    # Relationships
    video = relationship("Video", back_populates="frames")
    embedding = relationship("Embedding", back_populates="frame", uselist=False)


class Embedding(Base):
    __tablename__ = "embeddings"

    id = Column(Integer, primary_key=True, index=True)
    frame_id = Column(Integer, ForeignKey("frames.id"), nullable=False)
    
    # Vector embedding (using pgvector)
    embedding = Column(Vector(1536), nullable=False)  # OpenAI embedding dimension
    model_name = Column(String, nullable=False, default="ViT-B/32")
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())

    # Relationships
    frame = relationship("Frame", back_populates="embedding")


class Search(Base):
    __tablename__ = "searches"

    id = Column(Integer, primary_key=True, index=True)
    query_text = Column(Text, nullable=True)  # Natural language query
    query_type = Column(String, nullable=False)  # "text" or "clip"
    
    # Query embedding for similarity search (1536-dim for OpenAI)
    query_embedding = Column(Vector(1536), nullable=True)
    
    # Search parameters
    limit_results = Column(Integer, default=10)
    similarity_threshold = Column(Float, default=0.5)
    filters = Column(JSON, default={})  # Weather, time, speed filters
    
    # Results
    results_count = Column(Integer, default=0)
    response_time_ms = Column(Integer, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())


class Export(Base):
    __tablename__ = "exports"

    id = Column(Integer, primary_key=True, index=True)
    search_id = Column(Integer, ForeignKey("searches.id"), nullable=True)
    
    # Export parameters
    frame_ids = Column(JSON, nullable=False)  # List of frame IDs to export
    export_format = Column(String, default="zip")  # zip, dataset, etc.
    
    # Export status
    status = Column(String, default="pending")  # pending, processing, completed, failed
    file_path = Column(String, nullable=True)  # Path to generated export file
    file_size = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    search = relationship("Search") 