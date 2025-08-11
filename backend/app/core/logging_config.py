"""
Production logging configuration for RareSift
Supports structured JSON logging, log rotation, and external log shipping
"""

import logging
import logging.config
import sys
from pathlib import Path
from typing import Dict, Any
import json
from datetime import datetime

def setup_logging(log_level: str = "INFO", log_format: str = "json", log_dir: str = "/app/logs") -> None:
    """
    Setup production logging configuration
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR)
        log_format: Format type ("json" or "standard")
        log_dir: Directory to store log files
    """
    
    # Create logs directory
    Path(log_dir).mkdir(parents=True, exist_ok=True)
    
    # Configure logging based on format
    if log_format.lower() == "json":
        logging_config = get_json_logging_config(log_level, log_dir)
    else:
        logging_config = get_standard_logging_config(log_level, log_dir)
    
    # Apply configuration
    logging.config.dictConfig(logging_config)
    
    # Set up root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))

def get_json_logging_config(log_level: str, log_dir: str) -> Dict[str, Any]:
    """Get JSON logging configuration"""
    
    return {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'json': {
                '()': 'app.core.logging_config.JSONFormatter',
            },
            'console': {
                'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                'datefmt': '%Y-%m-%d %H:%M:%S'
            }
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'level': log_level.upper(),
                'formatter': 'console',
                'stream': sys.stdout
            },
            'file_info': {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': 'INFO',
                'formatter': 'json',
                'filename': f'{log_dir}/raresift.log',
                'maxBytes': 50 * 1024 * 1024,  # 50MB
                'backupCount': 10,
                'encoding': 'utf-8'
            },
            'file_error': {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': 'ERROR',
                'formatter': 'json',
                'filename': f'{log_dir}/raresift-error.log',
                'maxBytes': 50 * 1024 * 1024,  # 50MB
                'backupCount': 10,
                'encoding': 'utf-8'
            },
            'file_access': {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': 'INFO',
                'formatter': 'json',
                'filename': f'{log_dir}/raresift-access.log',
                'maxBytes': 50 * 1024 * 1024,  # 50MB
                'backupCount': 5,
                'encoding': 'utf-8'
            }
        },
        'loggers': {
            '': {  # Root logger
                'level': log_level.upper(),
                'handlers': ['console', 'file_info', 'file_error'],
                'propagate': False
            },
            'app': {
                'level': log_level.upper(),
                'handlers': ['console', 'file_info', 'file_error'],
                'propagate': False
            },
            'uvicorn.access': {
                'level': 'INFO',
                'handlers': ['file_access'],
                'propagate': False
            },
            'sqlalchemy': {
                'level': 'WARNING',
                'handlers': ['console', 'file_info'],
                'propagate': False
            },
            'alembic': {
                'level': 'INFO',
                'handlers': ['console', 'file_info'],
                'propagate': False
            }
        }
    }

def get_standard_logging_config(log_level: str, log_dir: str) -> Dict[str, Any]:
    """Get standard logging configuration"""
    
    return {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'standard': {
                'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s',
                'datefmt': '%Y-%m-%d %H:%M:%S'
            },
            'detailed': {
                'format': '%(asctime)s [%(levelname)s] %(name)s:%(lineno)d - %(funcName)s(): %(message)s',
                'datefmt': '%Y-%m-%d %H:%M:%S'
            }
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'level': log_level.upper(),
                'formatter': 'standard',
                'stream': sys.stdout
            },
            'file': {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': log_level.upper(),
                'formatter': 'detailed',
                'filename': f'{log_dir}/raresift.log',
                'maxBytes': 50 * 1024 * 1024,  # 50MB
                'backupCount': 10,
                'encoding': 'utf-8'
            }
        },
        'loggers': {
            '': {  # Root logger
                'level': log_level.upper(),
                'handlers': ['console', 'file'],
                'propagate': False
            }
        }
    }

class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON"""
        
        # Base log data
        log_data = {
            'timestamp': datetime.utcfromtimestamp(record.created).isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
            'process_id': record.process,
            'thread_id': record.thread,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        # Add extra fields from LogRecord
        for key, value in record.__dict__.items():
            if key not in [
                'name', 'msg', 'args', 'levelname', 'levelno', 'pathname', 'filename',
                'module', 'lineno', 'funcName', 'created', 'msecs', 'relativeCreated',
                'thread', 'threadName', 'processName', 'process', 'getMessage', 'exc_info',
                'exc_text', 'stack_info'
            ]:
                log_data[key] = value
        
        return json.dumps(log_data, default=str)

class RequestIdFilter(logging.Filter):
    """Add request ID to log records"""
    
    def filter(self, record: logging.LogRecord) -> bool:
        # Try to get request ID from context
        # This would need to be implemented with contextvars in a real implementation
        record.request_id = getattr(record, 'request_id', 'unknown')
        return True

class SensitiveDataFilter(logging.Filter):
    """Filter out sensitive data from logs"""
    
    SENSITIVE_PATTERNS = [
        'password', 'secret', 'token', 'key', 'credential',
        'auth', 'bearer', 'api_key', 'access_token'
    ]
    
    def filter(self, record: logging.LogRecord) -> bool:
        """Filter sensitive data from log message"""
        message = record.getMessage().lower()
        
        for pattern in self.SENSITIVE_PATTERNS:
            if pattern in message:
                # Replace the entire message with a warning
                record.msg = f"[REDACTED] Log message contained sensitive data (pattern: {pattern})"
                record.args = ()
                break
        
        return True

def get_logger(name: str) -> logging.Logger:
    """Get a logger with the specified name"""
    return logging.getLogger(name)

def log_application_startup():
    """Log application startup information"""
    logger = get_logger('app.startup')
    
    try:
        import sys
        import os
        import platform
        from app.core.config_secure import get_settings
        
        settings = get_settings()
        
        logger.info(
            "RareSift backend starting up",
            extra={
                'python_version': sys.version.split()[0],
                'platform': platform.platform(),
                'environment': settings.environment,
                'log_level': settings.log_level,
                'pid': os.getpid(),
                'working_directory': os.getcwd()
            }
        )
        
    except Exception as e:
        logger.error(f"Failed to log startup information: {e}")

def log_application_shutdown():
    """Log application shutdown"""
    logger = get_logger('app.shutdown')
    logger.info("RareSift backend shutting down")

# Create a request logging helper
def log_request_completion(
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    user_id: str = None,
    request_size: int = None,
    response_size: int = None
):
    """Log HTTP request completion"""
    logger = get_logger('app.access')
    
    logger.info(
        "HTTP request completed",
        extra={
            'http_method': method,
            'http_path': path,
            'http_status_code': status_code,
            'duration_ms': round(duration_ms, 2),
            'user_id': user_id,
            'request_size_bytes': request_size,
            'response_size_bytes': response_size,
            'request_type': 'http'
        }
    )

def log_business_event(
    event_type: str,
    event_data: Dict[str, Any],
    user_id: str = None
):
    """Log business events for analytics"""
    logger = get_logger('app.business')
    
    logger.info(
        f"Business event: {event_type}",
        extra={
            'event_type': event_type,
            'user_id': user_id,
            'event_data': event_data,
            'log_type': 'business_event'
        }
    )