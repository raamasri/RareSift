from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY
from datetime import datetime

Base = declarative_base()

class Video(Base):
    __tablename__ = "videos"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer)
    duration = Column(Float, nullable=False)
    fps = Column(Float, nullable=False)
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    weather = Column(String)
    time_of_day = Column(String)
    location = Column(String)
    speed_avg = Column(Float)
    video_metadata = Column(JSON)
    is_processed = Column(Boolean, default=False)
    processing_started_at = Column(DateTime)
    processing_completed_at = Column(DateTime)
    processing_error = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer)
    
    # Relationship to frames
    frames = relationship("Frame", back_populates="video", cascade="all, delete-orphan")

class Frame(Base):
    __tablename__ = "frames"
    
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    timestamp = Column(Float, nullable=False)
    frame_path = Column(String, nullable=False)
    frame_metadata = Column(JSON)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to video
    video = relationship("Video", back_populates="frames")
    
    # Relationship to embeddings
    embeddings = relationship("Embedding", back_populates="frame", cascade="all, delete-orphan")

class Embedding(Base):
    __tablename__ = "embeddings"
    
    id = Column(Integer, primary_key=True, index=True)
    frame_id = Column(Integer, ForeignKey("frames.id"), nullable=False)
    embedding = Column(ARRAY(Float), nullable=False)  # pgvector array
    model_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to frame
    frame = relationship("Frame", back_populates="embeddings")