"""
Secure configuration management using secret backends
"""

from pydantic_settings import BaseSettings
from typing import Optional, List
import logging
from .secrets import get_required_secret, get_secret

logger = logging.getLogger(__name__)

class SecureSettings(BaseSettings):
    """
    Secure settings that load from secret management systems
    """
    
    def __init__(self, **kwargs):
        # Load secrets from secure backends first (but don't fail if they're missing)
        try:
            self._load_secrets_from_backends()
        except Exception as e:
            logger.warning(f"Failed to load secrets from backends: {e}")
        super().__init__(**kwargs)
    
    def _load_secrets_from_backends(self):
        """Load secrets from configured backends"""
        try:
            # Try to load critical secrets
            import os
            
            # Database configuration
            if not os.getenv('DATABASE_URL'):
                db_user = get_secret('POSTGRES_USER', 'raresift')
                db_password = get_secret('POSTGRES_PASSWORD')
                db_host = get_secret('POSTGRES_HOST', 'postgres')
                db_port = get_secret('POSTGRES_PORT', '5432')
                db_name = get_secret('POSTGRES_DB', 'raresift')
                
                if db_password:  # Only construct URL if we have a password
                    database_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
                    os.environ['DATABASE_URL'] = database_url
                    logger.info("Database URL loaded from secret backend")
            
            # Redis configuration
            if not os.getenv('REDIS_URL'):
                redis_password = get_secret('REDIS_PASSWORD')
                redis_host = get_secret('REDIS_HOST', 'redis')
                redis_port = get_secret('REDIS_PORT', '6379')
                
                if redis_password:
                    redis_url = f"redis://:{redis_password}@{redis_host}:{redis_port}"
                else:
                    redis_url = f"redis://{redis_host}:{redis_port}"
                    
                os.environ['REDIS_URL'] = redis_url
                logger.info("Redis URL loaded from secret backend")
            
            # Application secrets
            if not os.getenv('SECRET_KEY'):
                secret_key = get_secret('SECRET_KEY')
                if secret_key:
                    os.environ['SECRET_KEY'] = secret_key
                    logger.info("Application secret key loaded from secret backend")
            
            # JWT keys (if using RSA)
            jwt_private_key = get_secret('JWT_PRIVATE_KEY')
            jwt_public_key = get_secret('JWT_PUBLIC_KEY')
            if jwt_private_key and jwt_public_key:
                os.environ['JWT_PRIVATE_KEY'] = jwt_private_key
                os.environ['JWT_PUBLIC_KEY'] = jwt_public_key
                logger.info("JWT RSA keys loaded from secret backend")
            
            # API keys
            api_master_key = get_secret('API_MASTER_KEY')
            if api_master_key:
                os.environ['API_MASTER_KEY'] = api_master_key
                logger.info("API master key loaded from secret backend")
            
            # External service credentials
            aws_access_key = get_secret('AWS_ACCESS_KEY_ID')
            aws_secret_key = get_secret('AWS_SECRET_ACCESS_KEY')
            if aws_access_key and aws_secret_key:
                os.environ['AWS_ACCESS_KEY_ID'] = aws_access_key
                os.environ['AWS_SECRET_ACCESS_KEY'] = aws_secret_key
                logger.info("AWS credentials loaded from secret backend")
            
            # SMTP credentials
            smtp_password = get_secret('SMTP_PASSWORD')
            if smtp_password:
                os.environ['SMTP_PASSWORD'] = smtp_password
                logger.info("SMTP credentials loaded from secret backend")
                
        except Exception as e:
            logger.warning(f"Failed to load some secrets from backends: {e}")
            # Continue with environment variables if secret backends fail

    # Environment
    environment: str = "production"
    debug: bool = False
    
    # Database - will be loaded from secret backend
    database_url: str
    
    # Redis - will be loaded from secret backend  
    redis_url: str
    
    # Security - will be loaded from secret backend
    secret_key: str
    
    # JWT Configuration
    algorithm: str = "RS256"  # Use RSA for production
    access_token_expire_minutes: int = 30
    jwt_private_key: Optional[str] = None
    jwt_public_key: Optional[str] = None
    
    # API Configuration
    api_v1_str: str = "/api/v1"
    project_name: str = "RareSift"
    api_master_key: Optional[str] = None
    
    # File storage
    upload_dir: str = "/app/uploads"
    max_file_size: int = 500 * 1024 * 1024  # 500MB
    
    # AI/ML
    clip_model_name: str = "ViT-B/32"
    embedding_dim: int = 512
    frame_extraction_interval: int = 1
    
    # Frame extraction configuration
    frame_extraction_mode: str = "smart"  # Production default
    max_frames_per_video: int = 15
    sampling_strategy: str = "adaptive"
    dense_sampling_interval: int = 5
    full_parsing_enabled: bool = False  # Disabled for production performance
    
    # Security settings
    cors_origins: List[str] = []
    allowed_hosts: List[str] = []
    
    # Rate limiting
    rate_limit_enabled: bool = True
    max_requests_per_minute: int = 60
    max_requests_per_hour: int = 1000
    
    # Security headers
    security_headers_enabled: bool = True
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "json"
    
    # SSL/TLS
    ssl_cert_path: Optional[str] = None
    ssl_key_path: Optional[str] = None
    
    # AWS Configuration
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: str = "us-west-2"
    s3_bucket: Optional[str] = None
    
    # External APIs
    openai_api_key: Optional[str] = None
    
    # Email/SMTP
    smtp_server: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: bool = True
    from_email: Optional[str] = None
    
    # Monitoring
    sentry_dsn: Optional[str] = None
    prometheus_enabled: bool = True
    health_check_enabled: bool = True
    
    # Webhook security
    webhook_secret: Optional[str] = None
    
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
            raise ValueError(f"Missing required settings: {missing}")
            
        # Validate secret key strength
        if len(self.secret_key) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        
        # Validate CORS origins in production
        if self.environment == "production" and not self.cors_origins:
            logger.warning("CORS_ORIGINS not set in production - this may cause issues")
        
        # Validate allowed hosts in production
        if self.environment == "production" and not self.allowed_hosts:
            logger.warning("ALLOWED_HOSTS not set in production - this may cause issues")
    
    def get_database_config(self) -> dict:
        """Get database configuration for SQLAlchemy"""
        return {
            'url': self.database_url,
            'echo': self.environment == "development",
            'pool_size': 20,
            'max_overflow': 30,
            'pool_timeout': 30,
            'pool_recycle': 3600,
            'pool_pre_ping': True
        }
    
    def get_redis_config(self) -> dict:
        """Get Redis configuration"""
        return {
            'url': self.redis_url,
            'decode_responses': True,
            'health_check_interval': 30,
            'socket_keepalive': True,
            'socket_keepalive_options': {}
        }
    
    def get_jwt_config(self) -> dict:
        """Get JWT configuration"""
        config = {
            'algorithm': self.algorithm,
            'access_token_expire_minutes': self.access_token_expire_minutes
        }
        
        if self.algorithm.startswith('RS') and self.jwt_private_key and self.jwt_public_key:
            import base64
            config['private_key'] = base64.b64decode(self.jwt_private_key).decode('utf-8')
            config['public_key'] = base64.b64decode(self.jwt_public_key).decode('utf-8')
        else:
            config['secret_key'] = self.secret_key
            
        return config
    
    class Config:
        env_file = ".env"
        extra = "forbid"

# Global settings instance
def get_settings() -> SecureSettings:
    """Get settings instance with caching"""
    if not hasattr(get_settings, '_settings'):
        get_settings._settings = SecureSettings()
        
        # Validate settings in production
        if get_settings._settings.environment == "production":
            get_settings._settings.validate_required_settings()
            logger.info("Production settings validated successfully")
            
    return get_settings._settings

# For backward compatibility
settings = get_settings()