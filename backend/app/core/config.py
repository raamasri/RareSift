from pydantic_settings import BaseSettings
from typing import Optional
import secrets
import os


class Settings(BaseSettings):
    # Environment
    environment: str = "production"  # development, production
    
    # Database - MUST be set via environment variable
    database_url: str
    
    # Redis - MUST be set via environment variable
    redis_url: str
    
    # Security - MUST be set via environment variable
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # API
    api_v1_str: str = "/api/v1"
    project_name: str = "RareSift"
    
    # File storage
    upload_dir: str = "/app/uploads"
    max_file_size: int = 500 * 1024 * 1024  # 500MB - reduced for production safety
    
    # AI/ML
    clip_model_name: str = "ViT-B/32"
    embedding_dim: int = 1536
    frame_extraction_interval: int = 1  # seconds (used for legacy mode)
    
    # Frame extraction configuration
    frame_extraction_mode: str = "full"  # "smart", "dense", "full", "interval"
    
    # Smart sampling (15-20 strategic frames)
    max_frames_per_video: int = 15  # Target for smart sampling
    sampling_strategy: str = "adaptive"  # adaptive, uniform, or keyframe
    
    # Dense sampling (1 frame every N seconds)
    dense_sampling_interval: int = 5  # Extract every 5 seconds
    
    # Full frame parsing (every frame)
    full_parsing_enabled: bool = False  # Disabled by default for production performance
    
    # Interval sampling (legacy - every N seconds)
    frame_extraction_interval: int = 1  # seconds (used for interval mode)
    
    # AWS (optional)
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: str = "us-west-2"
    s3_bucket: Optional[str] = None
    
    # OpenAI (optional)
    openai_api_key: Optional[str] = None
    
    # Production security settings
    cors_origins: list[str] = []
    allowed_hosts: list[str] = []
    
    # Rate limiting
    rate_limit_enabled: bool = True
    max_requests_per_minute: int = 60
    max_requests_per_hour: int = 1000
    
    # Security headers
    security_headers_enabled: bool = True
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "json"
    
    def validate_required_settings(self):
        """Validate that required production settings are set"""
        required_vars = [
            "database_url",
            "redis_url", 
            "secret_key"
        ]
        
        missing = []
        for var in required_vars:
            if not getattr(self, var, None):
                missing.append(var)
                
        if missing:
            raise ValueError(f"Missing required environment variables: {missing}")
            
        # Validate secret key strength
        if len(self.secret_key) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
    
    class Config:
        env_file = ".env"
        extra = "forbid"  # Prevent unknown environment variables


settings = Settings()

# Validate settings on startup in production
if settings.environment == "production":
    settings.validate_required_settings() 