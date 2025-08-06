import asyncio
import base64
import io
import numpy as np
import os
from typing import List, Optional, Union
from PIL import Image
from sqlalchemy.orm import Session
from sqlalchemy import text
import time
import requests
import logging
from datetime import datetime, timedelta
from collections import defaultdict, deque

from app.core.config import settings
from app.models.video import Frame, Search

# Try to import OpenAI, fall back to requests if not available
try:
    import openai
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

logger = logging.getLogger(__name__)


class OpenAIRateLimiter:
    """
    Advanced rate limiting for OpenAI API calls
    Handles multiple rate limit types: RPM, TPM, concurrent requests, and cost limits
    """
    
    def __init__(self):
        # Rate limits based on OpenAI API limits
        self.limits = {
            'requests_per_minute': getattr(settings, 'openai_rpm_limit', 3500),
            'tokens_per_minute': getattr(settings, 'openai_tpm_limit', 200000),
            'concurrent_requests': getattr(settings, 'openai_concurrent_limit', 100),
            'daily_cost_limit': getattr(settings, 'openai_daily_cost_limit', 50.0),  # $50/day default
        }
        
        # Tracking data structures
        self.request_times = deque()
        self.token_usage = deque()
        self.daily_cost = 0.0
        self.daily_cost_reset = datetime.now().date()
        self.active_requests = 0
        self.last_request_time = 0
        
        # Pricing (per 1K tokens)
        self.pricing = {
            'text-embedding-ada-002': 0.0001,  # $0.0001 per 1K tokens
            'gpt-4o': 0.005,  # $0.005 per 1K tokens (input)
        }
        
        logger.info(f"OpenAI Rate Limiter initialized: {self.limits}")
    
    def _clean_old_records(self):
        """Remove records older than 1 minute"""
        now = time.time()
        cutoff = now - 60  # 1 minute ago
        
        # Clean request times
        while self.request_times and self.request_times[0] < cutoff:
            self.request_times.popleft()
        
        # Clean token usage
        while self.token_usage and self.token_usage[0]['time'] < cutoff:
            self.token_usage.popleft()
    
    def _reset_daily_cost_if_needed(self):
        """Reset daily cost tracking if it's a new day"""
        today = datetime.now().date()
        if today != self.daily_cost_reset:
            self.daily_cost = 0.0
            self.daily_cost_reset = today
            logger.info("Daily cost limit reset")
    
    def _calculate_cost(self, model: str, tokens: int) -> float:
        """Calculate cost for API call"""
        rate = self.pricing.get(model, 0.001)  # Default rate if unknown
        return (tokens / 1000) * rate
    
    def _estimate_tokens(self, text: str) -> int:
        """Estimate token count (rough approximation: 1 token ≈ 4 chars)"""
        return len(text) // 4
    
    async def acquire_permit(
        self, 
        model: str, 
        estimated_tokens: int = 100,
        operation_type: str = "api_call"
    ) -> bool:
        """
        Acquire permission to make an API call
        Returns True if permitted, False if rate limited
        """
        self._clean_old_records()
        self._reset_daily_cost_if_needed()
        
        now = time.time()
        
        # Check concurrent requests limit
        if self.active_requests >= self.limits['concurrent_requests']:
            logger.warning(f"Concurrent request limit reached: {self.active_requests}")
            return False
        
        # Check requests per minute limit
        if len(self.request_times) >= self.limits['requests_per_minute']:
            logger.warning(f"RPM limit reached: {len(self.request_times)}")
            return False
        
        # Check tokens per minute limit
        current_tokens = sum(record['tokens'] for record in self.token_usage)
        if current_tokens + estimated_tokens > self.limits['tokens_per_minute']:
            logger.warning(f"TPM limit would be exceeded: {current_tokens + estimated_tokens}")
            return False
        
        # Check daily cost limit
        estimated_cost = self._calculate_cost(model, estimated_tokens)
        if self.daily_cost + estimated_cost > self.limits['daily_cost_limit']:
            logger.error(f"Daily cost limit would be exceeded: ${self.daily_cost + estimated_cost:.4f}")
            return False
        
        # Check minimum time between requests (avoid overwhelming API)
        min_interval = 60 / self.limits['requests_per_minute']  # seconds
        if now - self.last_request_time < min_interval:
            wait_time = min_interval - (now - self.last_request_time)
            logger.debug(f"Rate limiting: waiting {wait_time:.2f}s")
            await asyncio.sleep(wait_time)
        
        # Grant permission
        self.request_times.append(now)
        self.token_usage.append({
            'time': now,
            'tokens': estimated_tokens,
            'model': model,
            'operation': operation_type
        })
        self.active_requests += 1
        self.daily_cost += estimated_cost
        self.last_request_time = time.time()
        
        logger.debug(f"API permit granted: {operation_type} with {estimated_tokens} tokens (${estimated_cost:.4f})")
        return True
    
    def release_permit(self, actual_tokens: int = None, model: str = None):
        """Release a concurrent request permit and update actual usage"""
        self.active_requests = max(0, self.active_requests - 1)
        
        if actual_tokens and model and self.token_usage:
            # Update the most recent record with actual token usage
            last_record = self.token_usage[-1]
            cost_diff = self._calculate_cost(model, actual_tokens) - self._calculate_cost(model, last_record['tokens'])
            last_record['tokens'] = actual_tokens
            self.daily_cost += cost_diff
            
            logger.debug(f"Permit released: actual tokens {actual_tokens}, cost adjustment ${cost_diff:.4f}")
    
    def get_status(self) -> dict:
        """Get current rate limiting status"""
        self._clean_old_records()
        self._reset_daily_cost_if_needed()
        
        current_tokens = sum(record['tokens'] for record in self.token_usage)
        
        return {
            'requests_per_minute': {
                'current': len(self.request_times),
                'limit': self.limits['requests_per_minute'],
                'percentage': (len(self.request_times) / self.limits['requests_per_minute']) * 100
            },
            'tokens_per_minute': {
                'current': current_tokens,
                'limit': self.limits['tokens_per_minute'],
                'percentage': (current_tokens / self.limits['tokens_per_minute']) * 100
            },
            'concurrent_requests': {
                'current': self.active_requests,
                'limit': self.limits['concurrent_requests'],
                'percentage': (self.active_requests / self.limits['concurrent_requests']) * 100
            },
            'daily_cost': {
                'current': self.daily_cost,
                'limit': self.limits['daily_cost_limit'],
                'percentage': (self.daily_cost / self.limits['daily_cost_limit']) * 100
            },
            'last_reset': self.daily_cost_reset.isoformat()
        }


class OpenAIEmbeddingService:
    """
    OpenAI-powered embedding service for high-quality CLIP embeddings
    Uses OpenAI's vision models for image understanding and text embeddings
    Now with comprehensive rate limiting and cost control
    """
    
    def __init__(self):
        self.client = None
        self.is_initialized = False
        self.image_model = "gpt-4o"  # Current vision model
        self.embedding_model = "text-embedding-ada-002"  # 1536 dimensions - closer to CLIP's 512
        self.rate_limiter = OpenAIRateLimiter()
        
    async def initialize(self):
        """Initialize the OpenAI client"""
        if not self.is_initialized:
            if not HAS_OPENAI:
                raise ValueError("OpenAI library not available")
            if not settings.openai_api_key:
                raise ValueError("OpenAI API key not found in settings")
            
            self.client = openai.AsyncOpenAI(api_key=settings.openai_api_key)
            self.is_initialized = True
            print(f"OpenAI embedding service initialized with {self.embedding_model}")
    
    def _encode_image_to_base64(self, image_input: Union[str, Image.Image]) -> str:
        """Convert image to base64 for OpenAI API"""
        if isinstance(image_input, str):
            # File path
            with open(image_input, "rb") as image_file:
                return base64.b64encode(image_file.read()).decode('utf-8')
        else:
            # PIL Image
            buffer = io.BytesIO()
            image_input.save(buffer, format="JPEG")
            return base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    async def encode_image(self, image_input: Union[str, Image.Image], metadata: dict = None) -> np.ndarray:
        """
        Generate high-quality embedding for an image using OpenAI's vision model
        Now with rate limiting and cost control
        """
        if not self.is_initialized:
            await self.initialize()
            
        # Estimate tokens for vision model (image analysis typically uses ~150-300 tokens)
        estimated_vision_tokens = 250
        estimated_embedding_tokens = 100  # For description text
        
        # Check rate limits for vision model
        if not await self.rate_limiter.acquire_permit(
            model=self.image_model, 
            estimated_tokens=estimated_vision_tokens,
            operation_type="image_analysis"
        ):
            raise Exception("Rate limit exceeded for image analysis - please try again later")
        
        try:
            # Convert image to base64
            base64_image = self._encode_image_to_base64(image_input)
            
            # Use GPT-4 Vision to describe the image in detail
            vision_response = await self.client.chat.completions.create(
                model=self.image_model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text", 
                                "text": "Describe this traffic/driving scene in detail. Focus on: vehicles (cars, trucks, motorcycles, bicycles), road infrastructure (traffic lights, signs, intersections), weather conditions, time of day, and any notable traffic situations. Be specific about vehicle types, colors, and positions."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=300
            )
            
            # Get actual token usage and update rate limiter
            actual_vision_tokens = vision_response.usage.total_tokens if hasattr(vision_response, 'usage') else estimated_vision_tokens
            self.rate_limiter.release_permit(actual_vision_tokens, self.image_model)
            
            # Get the detailed description
            description = vision_response.choices[0].message.content
            
            # Check rate limits for embedding model
            actual_embedding_tokens = self.rate_limiter._estimate_tokens(description)
            if not await self.rate_limiter.acquire_permit(
                model=self.embedding_model,
                estimated_tokens=actual_embedding_tokens,
                operation_type="text_embedding"
            ):
                raise Exception("Rate limit exceeded for text embedding - please try again later")
            
            # Generate embedding from the detailed description
            embedding_response = await self.client.embeddings.create(
                model=self.embedding_model,
                input=description
            )
            
            # Update rate limiter with actual embedding token usage
            actual_embedding_tokens = embedding_response.usage.total_tokens if hasattr(embedding_response, 'usage') else actual_embedding_tokens
            self.rate_limiter.release_permit(actual_embedding_tokens, self.embedding_model)
            
            # Convert to numpy array
            embedding = np.array(embedding_response.data[0].embedding, dtype=np.float32)
            
            # Normalize the embedding
            embedding = embedding / np.linalg.norm(embedding)
            
            logger.info(f"Image encoded successfully: vision_tokens={actual_vision_tokens}, embedding_tokens={actual_embedding_tokens}")
            return embedding
            
        except Exception as e:
            # Release permits on error
            self.rate_limiter.release_permit()
            self.rate_limiter.release_permit()
            
            image_path = image_input if isinstance(image_input, str) else "PIL_Image"
            logger.error(f"Failed to encode image {image_path}: {str(e)}")
            raise Exception(f"Failed to encode image {image_path} with OpenAI: {str(e)}")
    
    async def encode_text(self, text: str) -> np.ndarray:
        """
        Generate high-quality embedding for text query using OpenAI
        Now with rate limiting and cost control
        """
        if not self.is_initialized:
            await self.initialize()
            
        # Enhance the query for better vehicle/traffic detection
        enhanced_query = self.enhance_traffic_query(text)
        
        # Estimate tokens for the enhanced query
        estimated_tokens = self.rate_limiter._estimate_tokens(enhanced_query)
        
        # Check rate limits
        if not await self.rate_limiter.acquire_permit(
            model=self.embedding_model,
            estimated_tokens=estimated_tokens,
            operation_type="text_embedding"
        ):
            raise Exception("Rate limit exceeded for text embedding - please try again later")
            
        try:            
            # Generate embedding
            response = await self.client.embeddings.create(
                model=self.embedding_model,
                input=enhanced_query
            )
            
            # Update rate limiter with actual token usage
            actual_tokens = response.usage.total_tokens if hasattr(response, 'usage') else estimated_tokens
            self.rate_limiter.release_permit(actual_tokens, self.embedding_model)
            
            # Convert to numpy array
            embedding = np.array(response.data[0].embedding, dtype=np.float32)
            
            # Normalize the embedding
            embedding = embedding / np.linalg.norm(embedding)
            
            logger.info(f"Text encoded successfully: '{text}' -> tokens={actual_tokens}")
            return embedding
            
        except Exception as e:
            # Release permit on error
            self.rate_limiter.release_permit()
            
            logger.error(f"Failed to encode text '{text}': {str(e)}")
            raise Exception(f"Failed to encode text '{text}' with OpenAI: {str(e)}")
    
    def enhance_traffic_query(self, query: str) -> str:
        """
        Enhance traffic/driving queries for PRECISE object matching
        Focus on explicit visibility and exclude common false positives
        """
        query_lower = query.lower().strip()
        
        # Explicit object visibility requirements - focus on what's actually VISIBLE
        precise_object_definitions = {
            # Vehicles - must be clearly visible
            'bicycle': 'VISIBLE bicycle in frame, actual bike with wheels clearly seen, person riding bicycle, cyclist visible on road',
            'bike': 'VISIBLE bicycle in frame, actual bike with wheels clearly seen, person riding bicycle, cyclist visible on road',
            'motorcycle': 'VISIBLE motorcycle in frame, actual motorbike with rider clearly seen, two-wheeled motor vehicle with person',
            'motorbike': 'VISIBLE motorcycle in frame, actual motorbike with rider clearly seen, two-wheeled motor vehicle with person',
            'car': 'VISIBLE passenger car in frame, actual automobile clearly seen, sedan or vehicle body visible',
            'truck': 'VISIBLE large truck in frame, actual truck body clearly seen, commercial vehicle or semi-truck',
            'bus': 'VISIBLE bus in frame, actual bus body clearly seen, public transit vehicle',
            'van': 'VISIBLE van in frame, actual van body clearly seen, commercial or passenger van',
            
            # People - must be clearly visible
            'pedestrian': 'VISIBLE person walking in frame, actual human figure clearly seen on sidewalk or road',
            'person': 'VISIBLE person in frame, actual human figure clearly seen walking or standing',
            'cyclist': 'VISIBLE person riding bicycle, actual cyclist with bike clearly seen in frame',
            'driver': 'VISIBLE person driving, actual driver visible through car window or windshield',
            
            # Infrastructure - must be prominent in frame
            'traffic light': 'VISIBLE traffic light in frame, actual traffic signal clearly seen with colored lights',
            'stop sign': 'VISIBLE stop sign in frame, actual red octagonal stop sign clearly readable',
            'speed limit': 'VISIBLE speed limit sign in frame, actual speed limit sign with numbers clearly readable',
            'intersection': 'VISIBLE road intersection in frame, actual crossroads clearly seen with multiple roads meeting',
            'bridge': 'VISIBLE bridge structure in frame, actual bridge clearly seen spanning over road or water',
            'tunnel': 'VISIBLE tunnel entrance or interior in frame, actual tunnel structure clearly seen',
            
            # Road conditions - must be obvious
            'construction': 'VISIBLE construction zone in frame, actual construction equipment, barriers, or orange cones clearly seen',
            'accident': 'VISIBLE accident scene in frame, actual damaged vehicles or emergency response clearly seen',
            'rain': 'VISIBLE rain or wet conditions in frame, actual water droplets or wet pavement clearly seen',
            'snow': 'VISIBLE snow in frame, actual snow falling or snow-covered surfaces clearly seen',
            
            # Time and lighting - must be apparent
            'night': 'VISIBLE nighttime scene, actual darkness with street lights or headlights clearly seen',
            'day': 'VISIBLE daytime scene, actual daylight and bright conditions clearly seen',
            'sunset': 'VISIBLE sunset lighting, actual orange/red sky or sun setting clearly seen',
            'sunrise': 'VISIBLE sunrise lighting, actual morning light or sun rising clearly seen'
        }
        
        # Color + object combinations - be very specific
        color_object_combinations = {
            'white car': 'VISIBLE white colored car in frame, actual white automobile clearly seen',
            'black car': 'VISIBLE black colored car in frame, actual black automobile clearly seen',
            'red car': 'VISIBLE red colored car in frame, actual red automobile clearly seen',
            'blue car': 'VISIBLE blue colored car in frame, actual blue automobile clearly seen',
            'yellow car': 'VISIBLE yellow colored car in frame, actual yellow automobile clearly seen',
            'white truck': 'VISIBLE white colored truck in frame, actual white large vehicle clearly seen',
            'red truck': 'VISIBLE red colored truck in frame, actual red large vehicle clearly seen',
            'blue bicycle': 'VISIBLE blue colored bicycle in frame, actual blue bike clearly seen',
            'red bicycle': 'VISIBLE red colored bicycle in frame, actual red bike clearly seen'
        }
        
        # Negative exclusions to avoid false positives
        exclusion_terms = {
            'bicycle': 'NOT bike lanes, NOT cycling infrastructure, NOT bicycle signs, NOT bike parking',
            'motorcycle': 'NOT motorcycle parking, NOT bike shops, NOT vehicle dealers',
            'car': 'NOT car parks, NOT dealerships, NOT car wash, NOT automotive shops',
            'pedestrian': 'NOT crosswalk markings, NOT pedestrian signs, NOT empty sidewalks'
        }
        
        # Check for exact matches first
        if query_lower in precise_object_definitions:
            enhanced_query = precise_object_definitions[query_lower]
            exclusions = exclusion_terms.get(query_lower, '')
            return f"{enhanced_query}. {exclusions}" if exclusions else enhanced_query
        
        # Check for color combinations
        if query_lower in color_object_combinations:
            return color_object_combinations[query_lower]
        
        # Check for partial matches in main objects
        for key, definition in precise_object_definitions.items():
            if key in query_lower and len(key) > 3:  # Avoid short word false matches
                exclusions = exclusion_terms.get(key, '')
                return f"{definition}. {exclusions}" if exclusions else definition
        
        # Check for color combinations with partial matches
        for color_combo, definition in color_object_combinations.items():
            if color_combo in query_lower:
                return definition
        
        # Default: be explicit about visibility in general traffic scenes
        return f"VISIBLE {query} clearly seen in traffic scene on road, actual object prominently displayed in frame"
    
    def get_adaptive_similarity_threshold(self, query: str, user_threshold: float = None) -> float:
        """
        Get adaptive similarity threshold based on query type
        More specific objects need higher thresholds for precision
        """
        if user_threshold is not None:
            return user_threshold
            
        query_lower = query.lower().strip()
        
        # High precision objects - need very high similarity (0.4-0.5)
        high_precision_objects = [
            'bicycle', 'bike', 'cyclist', 'motorcycle', 'motorbike', 
            'pedestrian', 'person walking', 'stop sign', 'traffic light',
            'accident', 'construction', 'emergency'
        ]
        
        # Medium precision objects - moderate similarity (0.3-0.35)
        medium_precision_objects = [
            'car', 'truck', 'bus', 'van', 'vehicle',
            'intersection', 'bridge', 'tunnel', 'highway'
        ]
        
        # Low precision objects - lower similarity for broader matches (0.25-0.3)
        low_precision_objects = [
            'road', 'street', 'traffic', 'driving', 'lane',
            'day', 'night', 'weather', 'rain', 'snow'
        ]
        
        # Check for high precision requirements
        for obj in high_precision_objects:
            if obj in query_lower:
                return 0.45  # Very high threshold for specific objects
        
        # Check for medium precision requirements  
        for obj in medium_precision_objects:
            if obj in query_lower:
                return 0.35  # Moderate threshold for common vehicles
        
        # Check for low precision requirements
        for obj in low_precision_objects:
            if obj in query_lower:
                return 0.25  # Lower threshold for general scenes
        
        # Default threshold for unknown queries
        return 0.3
    
    async def search_similar_frames(
        self, 
        db: Session, 
        query_embedding: np.ndarray, 
        user_id: int,
        limit: int = 10,
        similarity_threshold: float = None,  # Now optional - will use adaptive threshold
        filters: Optional[dict] = None
    ) -> dict:
        """
        Search for frames similar to query embedding using cosine similarity
        """
        try:
            start_time = time.time()
            
            # Convert numpy array to list for pgvector
            query_vector = query_embedding.tolist()
            
            # Build filter conditions
            filter_conditions = []
            if user_id is not None:
                filter_conditions.append(f"v.user_id = {user_id}")
            
            if filters:
                if filters.get("time_of_day"):
                    filter_conditions.append(f"v.time_of_day = '{filters['time_of_day']}'")
                
                if filters.get("weather"):
                    filter_conditions.append(f"v.weather = '{filters['weather']}'")
                
                if filters.get("category"):
                    filter_conditions.append(f"v.video_metadata->>'camera_type' = '{filters['category']}'")
            
            # Construct WHERE clause
            where_clause = ""
            if filter_conditions:
                where_clause = "WHERE " + " AND ".join(filter_conditions)
            
            # Use pgvector's cosine distance for similarity search with inline embeddings
            raw_query = text(f"""
                SELECT 
                    f.id as frame_id,
                    v.id as video_id,
                    f.timestamp,
                    1 - (f.embedding <=> CAST(:query_vector AS vector)) as similarity,
                    f.frame_path,
                    f.frame_metadata,
                    v.original_filename as video_filename,
                    v.duration as video_duration,
                    f.description
                FROM frames f
                JOIN videos v ON f.video_id = v.id
                {where_clause}
                AND f.embedding IS NOT NULL
                AND 1 - (f.embedding <=> CAST(:query_vector AS vector)) >= :similarity_threshold
                ORDER BY f.embedding <=> CAST(:query_vector AS vector)
                LIMIT :limit_results
            """)
            
            # Execute the query
            result = db.execute(raw_query, {
                "query_vector": query_vector,
                "similarity_threshold": similarity_threshold,
                "limit_results": limit
            })
            
            # Format results
            similarities = []
            for row in result:
                similarities.append({
                    "frame_id": row.frame_id,
                    "video_id": row.video_id,
                    "timestamp": row.timestamp,
                    "similarity": float(row.similarity),
                    "frame_path": row.frame_path,
                    "metadata": row.frame_metadata or {},
                    "video_filename": row.video_filename,
                    "video_duration": row.video_duration
                })
            
            search_time = int((time.time() - start_time) * 1000)
            
            return {
                "results": similarities,
                "total_found": len(similarities),
                "search_time_ms": search_time
            }
            
        except Exception as e:
            raise Exception(f"Failed to search similar frames with OpenAI embeddings: {str(e)}")
    
    async def search_by_text(
        self,
        db: Session,
        query_text: str,
        user_id: int,
        limit: int = 10,
        similarity_threshold: float = None,  # Now optional
        filters: Optional[dict] = None
    ) -> dict:
        """
        Search frames by natural language text query using OpenAI embeddings
        Now with adaptive similarity thresholds for better precision
        """
        try:
            # Get adaptive similarity threshold based on query content
            # Override very low thresholds (< 0.3) with adaptive ones for better precision
            if similarity_threshold is None or similarity_threshold < 0.3:
                adaptive_threshold = self.get_adaptive_similarity_threshold(query_text)
                logger.info(f"Using adaptive similarity threshold {adaptive_threshold:.3f} (was {similarity_threshold}) for query: '{query_text}'")
                similarity_threshold = adaptive_threshold
            
            # Generate high-quality embedding for query text
            query_embedding = await self.encode_text(query_text)
            
            # Search similar frames with adaptive threshold
            search_results = await self.search_similar_frames(
                db, query_embedding, user_id, limit, similarity_threshold, filters
            )
            
            # Save search record
            search_record = Search(
                query_text=query_text,
                query_type="openai_text",
                query_embedding=query_embedding.tolist(),
                limit_results=limit,
                similarity_threshold=similarity_threshold,
                filters=filters or {},
                results_count=len(search_results["results"]),
                response_time_ms=search_results["search_time_ms"]
            )
            db.add(search_record)
            db.commit()
            
            return {
                "search_id": search_record.id,
                **search_results
            }
            
        except Exception as e:
            raise Exception(f"Failed to search by text with OpenAI: {str(e)}")
    
    async def search_by_image(
        self,
        db: Session,
        image_path: str,
        user_id: int,
        limit: int = 10,
        similarity_threshold: float = None,  # Now optional
        filters: Optional[dict] = None
    ) -> dict:
        """
        Search frames by example image using OpenAI vision embeddings
        Now with adaptive similarity thresholds
        """
        try:
            # For image searches, use moderate threshold since we can't analyze query content
            if similarity_threshold is None:
                similarity_threshold = 0.35  # Moderate precision for image searches
                logger.info(f"Using default image similarity threshold {similarity_threshold:.3f} for image: {os.path.basename(image_path)}")
            
            # Generate high-quality embedding for query image
            query_embedding = await self.encode_image(image_path)
            
            # Search similar frames with adaptive threshold
            search_results = await self.search_similar_frames(
                db, query_embedding, user_id, limit, similarity_threshold, filters
            )
            
            # Save search record  
            search_record = Search(
                query_text=f"OpenAI Image search: {os.path.basename(image_path)}",
                query_type="openai_image",
                query_embedding=query_embedding.tolist(),
                limit_results=limit,
                similarity_threshold=similarity_threshold,
                filters=filters or {},
                results_count=len(search_results["results"]),
                response_time_ms=search_results["search_time_ms"]
            )
            db.add(search_record)
            db.commit()
            
            return {
                "search_id": search_record.id,
                **search_results
            }
            
        except Exception as e:
            raise Exception(f"Failed to search by image with OpenAI: {str(e)}")
    
    def get_rate_limit_status(self) -> dict:
        """Get current rate limiting status for monitoring"""
        return self.rate_limiter.get_status()
    
    async def check_rate_limits_before_batch(self, estimated_requests: int, estimated_tokens_per_request: int = 150) -> dict:
        """
        Check if a batch operation would exceed rate limits
        Returns status and recommendations
        """
        status = self.rate_limiter.get_status()
        total_estimated_tokens = estimated_requests * estimated_tokens_per_request
        
        # Check if batch would exceed limits
        warnings = []
        recommendations = []
        
        if status['requests_per_minute']['current'] + estimated_requests > status['requests_per_minute']['limit']:
            warnings.append(f"Batch would exceed RPM limit ({estimated_requests} requests)")
            recommendations.append(f"Reduce batch size to {status['requests_per_minute']['limit'] - status['requests_per_minute']['current']} or wait")
        
        if status['tokens_per_minute']['current'] + total_estimated_tokens > status['tokens_per_minute']['limit']:
            warnings.append(f"Batch would exceed TPM limit ({total_estimated_tokens} tokens)")
            max_tokens_available = status['tokens_per_minute']['limit'] - status['tokens_per_minute']['current']
            max_requests = max_tokens_available // estimated_tokens_per_request
            recommendations.append(f"Reduce batch size to {max_requests} requests or wait")
        
        if status['concurrent_requests']['current'] + estimated_requests > status['concurrent_requests']['limit']:
            warnings.append(f"Batch would exceed concurrent limit")
            recommendations.append("Process requests sequentially instead of in parallel")
        
        estimated_cost = (total_estimated_tokens / 1000) * self.rate_limiter.pricing.get(self.embedding_model, 0.001)
        if status['daily_cost']['current'] + estimated_cost > status['daily_cost']['limit']:
            warnings.append(f"Batch would exceed daily cost limit (${estimated_cost:.4f})")
            recommendations.append("Wait until tomorrow or increase daily cost limit")
        
        return {
            'can_proceed': len(warnings) == 0,
            'warnings': warnings,
            'recommendations': recommendations,
            'estimated_cost': estimated_cost,
            'current_status': status
        }