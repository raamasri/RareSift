import os
from fastapi import FastAPI, HTTPException, Request

# Configuration for Render deployment
PORT = int(os.environ.get("PORT", 8000))
HOST = os.environ.get("HOST", "0.0.0.0")
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import traceback
import logging

from fastapi import APIRouter

# Create API router
api_router = APIRouter()

# Import and include individual routers
from app.api.v1 import videos, search, export, auth, contact, monitoring, gdpr
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(videos.router, prefix="/videos", tags=["videos"])
api_router.include_router(search.router, prefix="/search", tags=["search"])  
api_router.include_router(export.router, prefix="/export", tags=["export"])
api_router.include_router(contact.router, prefix="/contact", tags=["contact"])
api_router.include_router(monitoring.router, prefix="/monitoring", tags=["monitoring"])
api_router.include_router(gdpr.router, prefix="/gdpr", tags=["gdpr", "privacy"])
from app.core.config_secure import get_settings
settings = get_settings()
from app.core.middleware import SecurityHeadersMiddleware, RateLimitMiddleware, RequestLoggingMiddleware

# Configure production logging
from app.core.logging_config import setup_logging, log_application_startup, log_application_shutdown
from app.core.monitoring import MetricsMiddleware

# Setup structured logging
setup_logging(
    log_level=settings.log_level,
    log_format=settings.log_format,
    log_dir="/app/logs" if settings.environment == "production" else "./logs"
)

logger = logging.getLogger(__name__)

# Log application startup
log_application_startup()

# Security middleware imported from middleware module

app = FastAPI(
    title="RareSift API",
    description="AI-powered AV scenario search and analysis",
    version="1.0.0",
    openapi_url="/openapi.json"
)

# CORS middleware - configure for production
allowed_origins = settings.cors_origins or [
    "http://localhost:3000",  # Development frontend
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if settings.environment == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Add monitoring middleware (always enabled)
app.add_middleware(MetricsMiddleware)

# Add security middleware stack
if settings.environment == "production":
    app.add_middleware(RequestLoggingMiddleware)
    
if settings.rate_limit_enabled:
    app.add_middleware(RateLimitMiddleware)

# Add security headers middleware (always enabled)
app.add_middleware(SecurityHeadersMiddleware)

# Create uploads directory structure (skip if directory creation fails)
try:
    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs(os.path.join(settings.upload_dir, "frames"), exist_ok=True)
    os.makedirs(os.path.join(settings.upload_dir, "exports"), exist_ok=True)
    # Mount static files for serving uploaded content
    app.mount("/static", StaticFiles(directory=settings.upload_dir), name="static")
    # Mount frames directory for serving extracted frame images
    if os.path.exists("/app/frames"):
        app.mount("/frames", StaticFiles(directory="/app/frames"), name="frames")
except Exception as e:
    logger.warning(f"Could not create upload directories: {e}")

# Add detailed error handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}")
    logger.error(f"Traceback: {traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

# Include API router
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "message": "RareSift API",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    """
    Basic health check - use /api/v1/monitoring/health for comprehensive checks
    """
    try:
        return {
            "status": "healthy",
            "api": "operational",
            "version": "1.0.0",
            "note": "Use /api/v1/monitoring/health for detailed health checks"
        }
    except Exception as e:
        logger.error(f"Basic health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

# Application lifecycle events
@app.on_event("shutdown")
async def shutdown_event():
    """Log application shutdown"""
    log_application_shutdown() 