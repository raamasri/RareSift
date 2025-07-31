"""
Security middleware for RareSift application
"""

from fastapi import Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response as StarletteResponse
import time
from typing import Dict, Any
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add security headers to all responses
    """
    
    def __init__(self, app, **kwargs):
        super().__init__(app, **kwargs)
        self.security_headers = self._get_security_headers()
    
    def _get_security_headers(self) -> Dict[str, str]:
        """
        Define security headers based on environment
        """
        headers = {
            # Prevent XSS attacks
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            
            # HSTS (HTTP Strict Transport Security)
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            
            # Content Security Policy
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: blob:; "
                "font-src 'self'; "
                "connect-src 'self'; "
                "media-src 'self'; "
                "object-src 'none'; "
                "child-src 'none'; "
                "worker-src 'self'; "
                "frame-ancestors 'none'; "
                "form-action 'self'; "
                "base-uri 'self'"
            ),
            
            # Referrer Policy
            "Referrer-Policy": "strict-origin-when-cross-origin",
            
            # Permissions Policy (Feature Policy)
            "Permissions-Policy": (
                "camera=(), microphone=(), geolocation=(), "
                "interest-cohort=(), payment=(), usb=(), "
                "xr-spatial-tracking=(), magnetometer=(), "
                "accelerometer=(), gyroscope=()"
            ),
            
            # Remove server information
            "Server": "RareSift",
            
            # CORS headers for production
            "Access-Control-Allow-Origin": "*" if settings.environment == "development" else "",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
            "Access-Control-Max-Age": "86400",
        }
        
        # Adjust CORS for production
        if settings.environment == "production" and settings.cors_origins:
            # This will be handled by FastAPI CORS middleware
            del headers["Access-Control-Allow-Origin"]
        
        return headers
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """
        Add security headers to response
        """
        # Add request start time for performance monitoring
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Add security headers if enabled
        if settings.security_headers_enabled:
            for header, value in self.security_headers.items():
                if value:  # Only add non-empty headers
                    response.headers[header] = value
        
        # Add performance header for monitoring
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        
        # Log security-relevant requests
        if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
            logger.info(
                f"Security Log: {request.method} {request.url.path} "
                f"from {request.client.host if request.client else 'unknown'} "
                f"User-Agent: {request.headers.get('user-agent', 'unknown')[:100]} "
                f"Status: {response.status_code} "
                f"Time: {process_time:.3f}s"
            )
        
        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiting middleware
    Note: For production, use Redis-based rate limiting
    """
    
    def __init__(self, app, **kwargs):
        super().__init__(app, **kwargs)
        self.requests: Dict[str, list] = {}
        self.max_requests = settings.max_requests_per_minute
        self.time_window = 60  # seconds
    
    def _get_client_id(self, request: Request) -> str:
        """
        Get unique client identifier
        """
        # Try to get user ID from token, fall back to IP
        client_host = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "")[:50]
        return f"{client_host}:{hash(user_agent)}"
    
    def _is_rate_limited(self, client_id: str) -> bool:
        """
        Check if client is rate limited
        """
        now = time.time()
        
        # Clean old requests
        if client_id in self.requests:
            self.requests[client_id] = [
                req_time for req_time in self.requests[client_id]
                if now - req_time < self.time_window
            ]
        
        # Check rate limit
        client_requests = self.requests.get(client_id, [])
        if len(client_requests) >= self.max_requests:
            return True
        
        # Add current request
        if client_id not in self.requests:
            self.requests[client_id] = []
        self.requests[client_id].append(now)
        
        return False
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """
        Apply rate limiting
        """
        if not settings.rate_limit_enabled:
            return await call_next(request)
        
        client_id = self._get_client_id(request)
        
        if self._is_rate_limited(client_id):
            logger.warning(f"Rate limit exceeded for client: {client_id}")
            return StarletteResponse(
                content="Rate limit exceeded",
                status_code=429,
                headers={
                    "Retry-After": "60",
                    "X-RateLimit-Limit": str(self.max_requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time()) + self.time_window)
                }
            )
        
        return await call_next(request)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Log all requests for security monitoring
    """
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """
        Log request details
        """
        start_time = time.time()
        
        # Log request
        client_host = request.client.host if request.client else "unknown"
        logger.info(
            f"Request: {request.method} {request.url.path} "
            f"from {client_host} "
            f"User-Agent: {request.headers.get('user-agent', 'unknown')[:100]}"
        )
        
        # Process request
        response = await call_next(request)
        
        # Log response
        process_time = time.time() - start_time
        logger.info(
            f"Response: {response.status_code} "
            f"Time: {process_time:.3f}s "
            f"Size: {response.headers.get('content-length', 'unknown')}"
        )
        
        return response