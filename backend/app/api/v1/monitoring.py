"""
Monitoring and observability API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from app.core.monitoring import health_checker, get_metrics, get_metrics_content_type, structured_logger
from app.core.auth import get_current_user_optional
from app.models.user import User
from typing import Dict, Any

router = APIRouter()
logger = structured_logger

@router.get("/health")
async def health_check():
    """
    Comprehensive health check endpoint
    Returns overall system health and individual component status
    """
    try:
        health_data = await health_checker.run_all_checks()
        
        # Log health check results
        logger.info(
            "Health check completed",
            overall_status=health_data['overall_status'],
            checks_count=len(health_data['checks'])
        )
        
        # Return appropriate HTTP status
        if health_data['overall_status'] == 'unhealthy':
            raise HTTPException(status_code=503, detail=health_data)
        elif health_data['overall_status'] == 'warning':
            # Return 200 but with warning status
            pass
        
        return health_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail={
                'overall_status': 'unhealthy',
                'error': str(e),
                'message': 'Health check system failed'
            }
        )

@router.get("/health/live")
async def liveness_probe():
    """
    Kubernetes liveness probe - basic service availability
    """
    return {"status": "alive", "service": "raresift-backend"}

@router.get("/health/ready")
async def readiness_probe():
    """
    Kubernetes readiness probe - service ready to handle traffic
    """
    try:
        # Check critical dependencies only
        db_check = await health_checker.check_database()
        redis_check = await health_checker.check_redis()
        
        if db_check['status'] != 'healthy' or redis_check['status'] != 'healthy':
            raise HTTPException(
                status_code=503,
                detail={
                    'status': 'not_ready',
                    'database': db_check['status'],
                    'redis': redis_check['status']
                }
            )
        
        return {
            'status': 'ready',
            'database': 'healthy',
            'redis': 'healthy'
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Readiness check failed", error=str(e))
        raise HTTPException(
            status_code=503,
            detail={
                'status': 'not_ready',
                'error': str(e)
            }
        )

@router.get("/metrics", response_class=PlainTextResponse)
async def prometheus_metrics():
    """
    Prometheus metrics endpoint
    Returns metrics in Prometheus format
    """
    try:
        metrics_data = get_metrics()
        return PlainTextResponse(
            content=metrics_data,
            media_type=get_metrics_content_type()
        )
    except Exception as e:
        logger.error("Failed to generate metrics", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to generate metrics"
        )

@router.get("/metrics/health")
async def metrics_health():
    """
    Health metrics in JSON format for custom monitoring
    """
    try:
        health_data = await health_checker.run_all_checks()
        
        # Convert to metrics format
        metrics = {
            'raresift_health_status': 1 if health_data['overall_status'] == 'healthy' else 0,
            'raresift_health_checks_total': len(health_data['checks']),
            'raresift_health_checks_healthy': sum(
                1 for check in health_data['checks'].values()
                if check.get('status') == 'healthy'
            ),
            'raresift_health_checks_unhealthy': sum(
                1 for check in health_data['checks'].values()
                if check.get('status') == 'unhealthy'
            ),
        }
        
        # Add individual check metrics
        for check_name, check_result in health_data['checks'].items():
            metrics[f'raresift_health_{check_name}_status'] = (
                1 if check_result.get('status') == 'healthy' else 0
            )
        
        return {
            'timestamp': health_data['timestamp'],
            'metrics': metrics,
            'checks': health_data['checks']
        }
        
    except Exception as e:
        logger.error("Failed to generate health metrics", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to generate health metrics"
        )

@router.get("/status")
async def service_status():
    """
    Simple service status endpoint
    """
    return {
        'service': 'raresift-backend',
        'status': 'operational',
        'version': '1.0.0',
        'environment': 'production'
    }

@router.get("/debug")
async def debug_info(current_user: User = Depends(get_current_user_optional)):
    """
    Debug information endpoint (requires authentication in production)
    """
    # In production, require authentication
    from app.core.config_secure import get_settings
    settings = get_settings()
    
    if settings.environment == 'production' and not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required for debug endpoint in production"
        )
    
    try:
        import sys
        import os
        import psutil
        
        debug_data = {
            'timestamp': health_checker.run_all_checks.__name__,  # Current time
            'system': {
                'python_version': sys.version,
                'platform': sys.platform,
                'pid': os.getpid(),
                'working_directory': os.getcwd(),
            },
            'resources': {
                'cpu_count': psutil.cpu_count(),
                'memory_total_gb': round(psutil.virtual_memory().total / (1024**3), 2),
                'disk_total_gb': round(psutil.disk_usage('/').total / (1024**3), 2),
            },
            'environment_vars': {
                key: value for key, value in os.environ.items()
                if not any(secret in key.upper() for secret in [
                    'PASSWORD', 'SECRET', 'KEY', 'TOKEN', 'CREDENTIAL'
                ])
            }
        }
        
        logger.info("Debug info accessed", user_id=current_user.id if current_user else None)
        
        return debug_data
        
    except Exception as e:
        logger.error("Failed to generate debug info", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to generate debug information"
        )