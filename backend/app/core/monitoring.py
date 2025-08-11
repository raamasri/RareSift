"""
Production monitoring and observability for RareSift
Includes Prometheus metrics, structured logging, and health checks
"""

import time
import logging
import json
from typing import Dict, Any, Optional, List
from functools import wraps
from datetime import datetime, timezone
import psutil
import redis
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST

logger = logging.getLogger(__name__)

# Prometheus Metrics
REQUEST_COUNT = Counter(
    'raresift_http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)

REQUEST_DURATION = Histogram(
    'raresift_http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

REQUEST_SIZE = Histogram(
    'raresift_http_request_size_bytes',
    'HTTP request size in bytes',
    ['method', 'endpoint']
)

RESPONSE_SIZE = Histogram(
    'raresift_http_response_size_bytes',
    'HTTP response size in bytes',
    ['method', 'endpoint']
)

# Business Metrics
VIDEO_UPLOADS = Counter('raresift_video_uploads_total', 'Total video uploads', ['status'])
VIDEO_PROCESSING_TIME = Histogram('raresift_video_processing_seconds', 'Video processing time')
SEARCH_REQUESTS = Counter('raresift_search_requests_total', 'Total search requests', ['type'])
SEARCH_DURATION = Histogram('raresift_search_duration_seconds', 'Search request duration')
FRAME_EXTRACTIONS = Counter('raresift_frame_extractions_total', 'Total frames extracted')
EMBEDDING_GENERATIONS = Counter('raresift_embedding_generations_total', 'Total embeddings generated')

# System Metrics
ACTIVE_CONNECTIONS = Gauge('raresift_active_connections', 'Active database connections')
MEMORY_USAGE = Gauge('raresift_memory_usage_bytes', 'Memory usage in bytes')
CPU_USAGE = Gauge('raresift_cpu_usage_percent', 'CPU usage percentage')
DISK_USAGE = Gauge('raresift_disk_usage_bytes', 'Disk usage in bytes', ['path'])

class StructuredLogger:
    """Structured JSON logger for production"""
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        
    def _log(self, level: str, message: str, **kwargs):
        """Log structured message with context"""
        log_data = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'level': level,
            'message': message,
            'service': 'raresift-backend',
            **kwargs
        }
        
        if level == 'ERROR':
            self.logger.error(json.dumps(log_data))
        elif level == 'WARNING':
            self.logger.warning(json.dumps(log_data))
        elif level == 'INFO':
            self.logger.info(json.dumps(log_data))
        elif level == 'DEBUG':
            self.logger.debug(json.dumps(log_data))
    
    def info(self, message: str, **kwargs):
        self._log('INFO', message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        self._log('WARNING', message, **kwargs)
    
    def error(self, message: str, **kwargs):
        self._log('ERROR', message, **kwargs)
    
    def debug(self, message: str, **kwargs):
        self._log('DEBUG', message, **kwargs)

class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware to collect HTTP metrics"""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Get request size
        request_size = 0
        if hasattr(request, 'headers') and 'content-length' in request.headers:
            try:
                request_size = int(request.headers['content-length'])
            except ValueError:
                pass
        
        # Process request
        response = await call_next(request)
        
        # Calculate metrics
        duration = time.time() - start_time
        method = request.method
        path = request.url.path
        status_code = response.status_code
        
        # Get response size
        response_size = 0
        if hasattr(response, 'headers') and 'content-length' in response.headers:
            try:
                response_size = int(response.headers['content-length'])
            except ValueError:
                pass
        
        # Record metrics
        REQUEST_COUNT.labels(method=method, endpoint=path, status_code=status_code).inc()
        REQUEST_DURATION.labels(method=method, endpoint=path).observe(duration)
        REQUEST_SIZE.labels(method=method, endpoint=path).observe(request_size)
        RESPONSE_SIZE.labels(method=method, endpoint=path).observe(response_size)
        
        return response

class SystemMetrics:
    """System resource metrics collector"""
    
    def __init__(self):
        self.process = psutil.Process()
    
    def update_metrics(self):
        """Update system metrics"""
        try:
            # Memory usage
            memory_info = self.process.memory_info()
            MEMORY_USAGE.set(memory_info.rss)
            
            # CPU usage
            cpu_percent = self.process.cpu_percent()
            CPU_USAGE.set(cpu_percent)
            
            # Disk usage
            disk_usage = psutil.disk_usage('/')
            DISK_USAGE.labels(path='/').set(disk_usage.used)
            
            # Upload directory disk usage if it exists
            try:
                upload_disk = psutil.disk_usage('/app/uploads')
                DISK_USAGE.labels(path='/app/uploads').set(upload_disk.used)
            except FileNotFoundError:
                pass
                
        except Exception as e:
            logger.error(f"Failed to update system metrics: {e}")

def monitor_function(metric_name: str):
    """Decorator to monitor function execution"""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                duration = time.time() - start_time
                
                if metric_name == 'video_processing':
                    VIDEO_PROCESSING_TIME.observe(duration)
                elif metric_name == 'search':
                    SEARCH_DURATION.observe(duration)
                    
                return result
            except Exception as e:
                logger.error(f"Function {func.__name__} failed: {e}")
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                
                if metric_name == 'video_processing':
                    VIDEO_PROCESSING_TIME.observe(duration)
                elif metric_name == 'search':
                    SEARCH_DURATION.observe(duration)
                    
                return result
            except Exception as e:
                logger.error(f"Function {func.__name__} failed: {e}")
                raise
        
        # Return appropriate wrapper based on function type
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

class HealthCheck:
    """Comprehensive health check system"""
    
    def __init__(self):
        self.checks = {}
        self.system_metrics = SystemMetrics()
    
    def register_check(self, name: str, check_func):
        """Register a health check function"""
        self.checks[name] = check_func
    
    async def check_database(self) -> Dict[str, Any]:
        """Check database connectivity"""
        try:
            import time
            from app.core.database import get_db
            from sqlalchemy import text
            
            start_time = time.time()
            
            # Get database session and test connection
            db = next(get_db())
            result = db.execute(text("SELECT 1"))
            db.close()
            
            response_time = int((time.time() - start_time) * 1000)
                
            return {
                'status': 'healthy',
                'response_time_ms': response_time,
                'message': 'Database connection successful'
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'message': 'Database connection failed'
            }
    
    async def check_redis(self) -> Dict[str, Any]:
        """Check Redis connectivity"""
        try:
            from app.core.config_secure import get_settings
            settings = get_settings()
            
            redis_client = redis.from_url(settings.redis_url)
            redis_client.ping()
            redis_client.close()
            
            return {
                'status': 'healthy',
                'message': 'Redis connection successful'
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'message': 'Redis connection failed'
            }
    
    async def check_disk_space(self) -> Dict[str, Any]:
        """Check available disk space"""
        try:
            disk_usage = psutil.disk_usage('/')
            free_gb = disk_usage.free / (1024**3)
            total_gb = disk_usage.total / (1024**3)
            usage_percent = (disk_usage.used / disk_usage.total) * 100
            
            status = 'healthy'
            if usage_percent > 90:
                status = 'critical'
            elif usage_percent > 80:
                status = 'warning'
            
            return {
                'status': status,
                'free_gb': round(free_gb, 2),
                'total_gb': round(total_gb, 2),
                'usage_percent': round(usage_percent, 2),
                'message': f'Disk usage: {usage_percent:.1f}%'
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'message': 'Disk space check failed'
            }
    
    async def check_memory(self) -> Dict[str, Any]:
        """Check memory usage"""
        try:
            memory = psutil.virtual_memory()
            usage_percent = memory.percent
            available_gb = memory.available / (1024**3)
            
            status = 'healthy'
            if usage_percent > 90:
                status = 'critical'
            elif usage_percent > 80:
                status = 'warning'
            
            return {
                'status': status,
                'usage_percent': usage_percent,
                'available_gb': round(available_gb, 2),
                'message': f'Memory usage: {usage_percent:.1f}%'
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'message': 'Memory check failed'
            }
    
    async def check_ai_model(self) -> Dict[str, Any]:
        """Check AI model availability"""
        try:
            from app.services.openai_embedding_service import OpenAIEmbeddingService
            
            # Initialize the OpenAI embedding service
            embedding_service = OpenAIEmbeddingService()
            await embedding_service.initialize()
            
            # Try to encode a test string
            test_embedding = await embedding_service.encode_text("test")
            
            if test_embedding is not None and len(test_embedding) > 0:
                return {
                    'status': 'healthy',
                    'model': embedding_service.embedding_model,
                    'embedding_dim': len(test_embedding),
                    'message': 'OpenAI embedding service loaded and functional'
                }
            else:
                return {
                    'status': 'unhealthy',
                    'message': 'AI model returned invalid embedding'
                }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'message': 'AI model check failed'
            }
    
    async def check_search_availability(self) -> Dict[str, Any]:
        """Check search API availability"""
        try:
            from app.core.database import get_db
            from sqlalchemy import text
            
            # Check if we have processed videos and frames
            db = next(get_db())
            
            # Count total videos
            video_count = db.execute(text("SELECT COUNT(*) FROM videos")).scalar()
            
            # Count total frames with embeddings
            frame_count = db.execute(text("SELECT COUNT(*) FROM frames WHERE embedding IS NOT NULL")).scalar()
            
            db.close()
            
            status = 'healthy' if video_count > 0 and frame_count > 0 else 'unhealthy'
            message = f'Search ready: {video_count} videos, {frame_count} searchable frames'
            
            return {
                'status': status,
                'video_count': video_count,
                'frame_count': frame_count,
                'message': message
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'message': 'Search availability check failed'
            }
    
    async def check_semantic_search(self) -> Dict[str, Any]:
        """Check semantic natural language search capability"""
        try:
            from app.services.openai_embedding_service import OpenAIEmbeddingService
            from app.core.database import get_db
            from sqlalchemy import text
            
            # Initialize embedding service
            embedding_service = OpenAIEmbeddingService()
            await embedding_service.initialize()
            
            # Test semantic search pipeline
            test_query = "test search"
            query_embedding = await embedding_service.encode_text(test_query)
            
            # Test database vector search capability
            db = next(get_db())
            
            # Check if pgvector extension is available
            result = db.execute(text("SELECT 1 FROM pg_extension WHERE extname = 'vector'")).fetchone()
            pgvector_available = result is not None
            
            # Test vector similarity search if data exists
            frame_with_embedding = db.execute(text("SELECT id FROM frames WHERE embedding IS NOT NULL LIMIT 1")).fetchone()
            
            db.close()
            
            if query_embedding is not None and pgvector_available and frame_with_embedding:
                return {
                    'status': 'healthy',
                    'embedding_service': 'OpenAI',
                    'vector_db': 'pgvector',
                    'embedding_dim': len(query_embedding),
                    'message': 'Semantic search fully operational'
                }
            else:
                issues = []
                if query_embedding is None:
                    issues.append('embedding generation failed')
                if not pgvector_available:
                    issues.append('pgvector extension missing')
                if not frame_with_embedding:
                    issues.append('no embedded frames available')
                
                return {
                    'status': 'unhealthy',
                    'issues': issues,
                    'message': f'Semantic search issues: {", ".join(issues)}'
                }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'message': 'Semantic search check failed'
            }
    
    async def check_video_embedding_server(self) -> Dict[str, Any]:
        """Check video processing and embedding server availability"""
        try:
            import os
            from app.core.database import get_db
            from sqlalchemy import text
            
            db = next(get_db())
            
            # Check upload directory
            upload_dir = '/app/uploads'
            upload_dir_exists = os.path.exists(upload_dir) and os.path.isdir(upload_dir)
            upload_dir_writable = os.access(upload_dir, os.W_OK) if upload_dir_exists else False
            
            # Check video processing status
            total_videos = db.execute(text("SELECT COUNT(*) FROM videos")).scalar()
            processing_videos = db.execute(text("SELECT COUNT(*) FROM videos WHERE processing_started_at IS NOT NULL AND processing_completed_at IS NULL")).scalar()
            completed_videos = db.execute(text("SELECT COUNT(*) FROM videos WHERE is_processed = true")).scalar()
            failed_videos = db.execute(text("SELECT COUNT(*) FROM videos WHERE processing_error IS NOT NULL")).scalar()
            
            # Check embedding generation status
            total_frames = db.execute(text("SELECT COUNT(*) FROM frames")).scalar()
            embedded_frames = db.execute(text("SELECT COUNT(*) FROM frames WHERE embedding IS NOT NULL")).scalar()
            
            db.close()
            
            # Calculate health status
            issues = []
            if not upload_dir_exists:
                issues.append('upload directory missing')
            elif not upload_dir_writable:
                issues.append('upload directory not writable')
            
            if failed_videos > 0:
                issues.append(f'{failed_videos} failed video(s)')
            
            embedding_coverage = (embedded_frames / total_frames * 100) if total_frames > 0 else 0
            if embedding_coverage < 50:
                issues.append(f'low embedding coverage ({embedding_coverage:.1f}%)')
            
            status = 'healthy' if len(issues) == 0 else 'warning' if embedding_coverage > 10 else 'unhealthy'
            
            return {
                'status': status,
                'upload_directory': {
                    'exists': upload_dir_exists,
                    'writable': upload_dir_writable,
                    'path': upload_dir
                },
                'video_processing': {
                    'total': total_videos,
                    'processing': processing_videos,
                    'completed': completed_videos,
                    'failed': failed_videos
                },
                'embedding_generation': {
                    'total_frames': total_frames,
                    'embedded_frames': embedded_frames,
                    'coverage_percent': round(embedding_coverage, 1)
                },
                'issues': issues,
                'message': f'Video server: {status}' + (f' - {", ".join(issues)}' if issues else '')
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'message': 'Video/embedding server check failed'
            }

    async def run_all_checks(self) -> Dict[str, Any]:
        """Run all health checks"""
        results = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'overall_status': 'healthy',
            'checks': {}
        }
        
        # Built-in checks
        checks_to_run = [
            ('database', self.check_database),
            ('redis', self.check_redis),
            ('disk_space', self.check_disk_space),
            ('memory', self.check_memory),
            ('ai_model', self.check_ai_model),
            ('search_availability', self.check_search_availability),
            ('semantic_search', self.check_semantic_search),
            ('video_embedding_server', self.check_video_embedding_server),
        ]
        
        # Add registered checks
        for name, check_func in self.checks.items():
            checks_to_run.append((name, check_func))
        
        # Run all checks
        for check_name, check_func in checks_to_run:
            try:
                result = await check_func()
                results['checks'][check_name] = result
                
                # Update overall status
                if result.get('status') in ['unhealthy', 'critical']:
                    results['overall_status'] = 'unhealthy'
                elif result.get('status') == 'warning' and results['overall_status'] == 'healthy':
                    results['overall_status'] = 'warning'
                    
            except Exception as e:
                results['checks'][check_name] = {
                    'status': 'unhealthy',
                    'error': str(e),
                    'message': f'Health check {check_name} failed'
                }
                results['overall_status'] = 'unhealthy'
        
        # Update system metrics
        self.system_metrics.update_metrics()
        
        return results

# Global instances
structured_logger = StructuredLogger(__name__)
health_checker = HealthCheck()

def get_metrics() -> str:
    """Get Prometheus metrics"""
    return generate_latest()

def get_metrics_content_type() -> str:
    """Get Prometheus metrics content type"""
    return CONTENT_TYPE_LATEST