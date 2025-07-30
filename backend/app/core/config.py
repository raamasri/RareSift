from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Environment
    environment: str = "development"  # development, production
    
    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/raresift"
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # Security
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # API
    api_v1_str: str = "/api/v1"
    project_name: str = "RareSift"
    
    # File storage
    upload_dir: str = "./uploads"
    max_file_size: int = 1024 * 1024 * 1024  # 1GB
    
    # AI/ML
    clip_model_name: str = "ViT-B/32"
    embedding_dim: int = 512
    frame_extraction_interval: int = 1  # seconds (used for legacy mode)
    
    # Frame extraction configuration
    frame_extraction_mode: str = "full"  # "smart", "dense", "full", "interval"
    
    # Smart sampling (15-20 strategic frames)
    max_frames_per_video: int = 15  # Target for smart sampling
    sampling_strategy: str = "adaptive"  # adaptive, uniform, or keyframe
    
    # Dense sampling (1 frame every N seconds)
    dense_sampling_interval: int = 5  # Extract every 5 seconds
    
    # Full frame parsing (every frame)
    full_parsing_enabled: bool = True  # WARNING: Very resource intensive
    
    # Interval sampling (legacy - every N seconds)
    frame_extraction_interval: int = 1  # seconds (used for interval mode)
    
    # AWS (optional)
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: str = "us-west-2"
    s3_bucket: Optional[str] = None
    
    # OpenAI (optional)
    openai_api_key: Optional[str] = None
    
    class Config:
        env_file = ".env"


settings = Settings() 