"""
Redis caching configuration for RareSift
"""

import redis
from typing import Optional, Any
import json
import pickle
from app.core.config import settings

class CacheManager:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            db=settings.redis_db,
            decode_responses=False
        )
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            data = self.redis_client.get(key)
            if data:
                return pickle.loads(data)
            return None
        except Exception:
            return None
    
    def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """Set value in cache with TTL"""
        try:
            serialized = pickle.dumps(value)
            return self.redis_client.setex(key, ttl, serialized)
        except Exception:
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            return bool(self.redis_client.delete(key))
        except Exception:
            return False
    
    def get_search_results(self, query_hash: str) -> Optional[dict]:
        """Get cached search results"""
        return self.get(f"search:{query_hash}")
    
    def cache_search_results(self, query_hash: str, results: dict, ttl: int = 1800):
        """Cache search results for 30 minutes"""
        return self.set(f"search:{query_hash}", results, ttl)
    
    def get_video_metadata(self, video_id: str) -> Optional[dict]:
        """Get cached video metadata"""
        return self.get(f"video_meta:{video_id}")
    
    def cache_video_metadata(self, video_id: str, metadata: dict, ttl: int = 3600):
        """Cache video metadata for 1 hour"""
        return self.set(f"video_meta:{video_id}", metadata, ttl)

# Global cache instance
cache = CacheManager()
