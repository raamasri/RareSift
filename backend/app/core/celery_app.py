from celery import Celery
from app.core.config import settings

# Create Celery instance
celery_app = Celery(
    "raresift",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks"]
)

# Configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    result_expires=3600,  # 1 hour
)

# Task routing
celery_app.conf.task_routes = {
    "app.tasks.process_video_task": {"queue": "video_processing"},
    "app.tasks.generate_embeddings_task": {"queue": "embeddings"},
    "app.tasks.export_frames_task": {"queue": "exports"},
}

# Queue configuration
celery_app.conf.task_default_queue = 'default'
celery_app.conf.task_queues = {
    'default': {
        'exchange': 'default',
        'routing_key': 'default',
    },
    'video_processing': {
        'exchange': 'video_processing',
        'routing_key': 'video_processing',
    },
    'embeddings': {
        'exchange': 'embeddings', 
        'routing_key': 'embeddings',
    },
    'exports': {
        'exchange': 'exports',
        'routing_key': 'exports',
    }
}