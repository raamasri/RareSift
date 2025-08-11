"""
Performance monitoring middleware for RareSift
"""

import time
import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

class PerformanceMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, slow_request_threshold: float = 1.0):
        super().__init__(app)
        self.slow_request_threshold = slow_request_threshold
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Add request ID for tracing
        request_id = f"{int(start_time * 1000000)}"
        
        response = await call_next(request)
        
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["X-Request-ID"] = request_id
        
        # Log slow requests
        if process_time > self.slow_request_threshold:
            logger.warning(
                f"Slow request: {request.method} {request.url.path} "
                f"took {process_time:.3f}s (threshold: {self.slow_request_threshold}s)"
            )
        
        # Log request metrics
        logger.info(
            f"{request.method} {request.url.path} - "
            f"{response.status_code} - {process_time:.3f}s"
        )
        
        return response

class DatabaseQueryMiddleware(BaseHTTPMiddleware):
    """Middleware to track database query performance"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # This would integrate with SQLAlchemy to track query counts and times
        # Implementation depends on your database setup
        
        query_start = time.time()
        response = await call_next(request)
        query_time = time.time() - query_start
        
        # Add query performance headers (for development)
        if hasattr(request.state, 'query_count'):
            response.headers["X-DB-Query-Count"] = str(request.state.query_count)
            response.headers["X-DB-Query-Time"] = str(query_time)
        
        return response
