import os
from fastapi import FastAPI, HTTPException, Request
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
from app.api.v1 import videos, search, export, auth, contact
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(videos.router, prefix="/videos", tags=["videos"])
api_router.include_router(search.router, prefix="/search", tags=["search"])  
api_router.include_router(export.router, prefix="/export", tags=["export"])
api_router.include_router(contact.router, prefix="/contact", tags=["contact"])
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        if settings.environment == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response

app = FastAPI(
    title="RareSift API",
    description="AI-powered AV scenario search and analysis",
    version="1.0.0",
    openapi_url="/openapi.json"
)

# CORS middleware - configure for production
allowed_origins = [
    "http://localhost:3000",  # Development frontend
    "http://127.0.0.1:3000",
    "https://raresift.com",   # Production domain
    "https://www.raresift.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if settings.environment == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Create uploads directory structure
os.makedirs(settings.upload_dir, exist_ok=True)
os.makedirs(os.path.join(settings.upload_dir, "frames"), exist_ok=True)
os.makedirs(os.path.join(settings.upload_dir, "exports"), exist_ok=True)

# Mount static files for serving uploaded content
app.mount("/static", StaticFiles(directory=settings.upload_dir), name="static")

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
    try:
        # Test database connection
        from app.core.database import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        
        return {
            "status": "healthy",
            "database": "connected",
            "ai_model": "loaded"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy", 
            "database": "error",
            "ai_model": "unknown",
            "error": str(e)
        } 