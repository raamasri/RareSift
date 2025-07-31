import torch
import clip
import numpy as np
import os
from PIL import Image
from typing import List, Optional, Union
from sqlalchemy.orm import Session
from sqlalchemy import text
import time
import asyncio

from app.core.config import settings
from app.models.video import Frame, Embedding, Search


class EmbeddingService:
    """
    Service for generating and managing CLIP embeddings with pgvector optimization
    """
    
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = None
        self.preprocess = None
        self.is_initialized = False
    
    async def initialize(self):
        """Initialize the embedding service asynchronously"""
        if not self.is_initialized:
            await self._load_model()
            self.is_initialized = True
    
    async def _load_model(self):
        """Load CLIP model and preprocessing asynchronously"""
        try:
            # Run in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            self.model, self.preprocess = await loop.run_in_executor(
                None, lambda: clip.load(settings.clip_model_name, device=self.device)
            )
            print(f"CLIP model {settings.clip_model_name} loaded on {self.device}")
        except Exception as e:
            print(f"Failed to load CLIP model: {str(e)}")
            raise e
    
    
    async def encode_image(self, image_input: Union[str, Image.Image]) -> np.ndarray:
        """
        Generate CLIP embedding for an image
        """
        if not self.is_initialized:
            await self.initialize()
            
        try:
            # Handle both file path and PIL Image
            if isinstance(image_input, str):
                image = Image.open(image_input).convert("RGB")
            else:
                image = image_input.convert("RGB")
            
            # Run preprocessing and inference in executor to avoid blocking
            loop = asyncio.get_event_loop()
            
            def _encode():
                image_tensor = self.preprocess(image).unsqueeze(0).to(self.device)
                with torch.no_grad():
                    image_features = self.model.encode_image(image_tensor)
                    # Normalize embedding
                    image_features = image_features / image_features.norm(dim=-1, keepdim=True)
                return image_features.cpu().numpy().flatten()
            
            return await loop.run_in_executor(None, _encode)
            
        except Exception as e:
            image_path = image_input if isinstance(image_input, str) else "PIL_Image"
            raise Exception(f"Failed to encode image {image_path}: {str(e)}")
    
    def enhance_object_query(self, query: str) -> str:
        """
        Enhance object queries with detailed descriptions for better CLIP detection
        """
        query_lower = query.lower().strip()
        
        # Vehicle detection enhancements
        vehicle_mappings = {
            'bicyclist': 'person riding a bicycle on the road, cyclist with bike helmet',
            'bicycle': 'bicycle being ridden by a person, bike with wheels and handlebars',
            'motorbike': 'motorcycle with rider, person on a motorbike, two-wheeled motor vehicle',
            'motorcycle': 'motorcycle with rider, person on a motorbike, two-wheeled motor vehicle',
            'wheelchair': 'person in a wheelchair, mobility aid with wheels, wheelchair user',
            'bus': 'large public transit bus, city bus with passengers, long vehicle with multiple windows',
            'train': 'passenger train, railway locomotive, train cars on tracks',
            'truck': 'large truck vehicle, semi-truck, cargo truck with trailer',
            'construction zone': 'construction site with orange cones, road work area, construction equipment and barriers',
            'traffic light': 'traffic signal with red yellow green lights, intersection traffic control',
            'stop sign': 'red octagonal stop sign, traffic stop sign at intersection',
            'crosswalk': 'pedestrian crossing, zebra crossing stripes on road',
            'pedestrian': 'person walking on sidewalk or crossing street, pedestrian in urban area'
        }
        
        # Color-based vehicle searches
        color_vehicle_mappings = {
            'white car': 'white colored passenger car, light colored vehicle on road',
            'black car': 'black colored passenger car, dark colored vehicle on road',
            'red car': 'red colored passenger car, bright red vehicle on road',
            'blue car': 'blue colored passenger car, blue vehicle on road',
            'silver car': 'silver colored passenger car, metallic gray vehicle on road',
            'gray car': 'gray colored passenger car, grey vehicle on road',
            'white truck': 'white colored truck, light colored large vehicle',
            'red truck': 'red colored truck, bright red large vehicle',
            'blue truck': 'blue colored truck, blue large vehicle'
        }
        
        # Generic vehicle type enhancements
        generic_mappings = {
            'car': 'passenger car on road, automobile vehicle, sedan or hatchback car',
            'vehicle': 'motor vehicle on road, car or truck driving',
            'suv': 'sport utility vehicle, large passenger SUV, tall car with high ground clearance'
        }
        
        # Check for exact matches first
        if query_lower in vehicle_mappings:
            return f"{query}, {vehicle_mappings[query_lower]}"
        
        if query_lower in color_vehicle_mappings:
            return f"{query}, {color_vehicle_mappings[query_lower]}"
            
        if query_lower in generic_mappings:
            return f"{query}, {generic_mappings[query_lower]}"
        
        # Check for partial matches (multi-word queries)
        for key, enhancement in vehicle_mappings.items():
            if key in query_lower:
                return f"{query}, {enhancement}"
                
        for key, enhancement in color_vehicle_mappings.items():
            if key in query_lower:
                return f"{query}, {enhancement}"
        
        # Handle "any color car" type queries
        if 'car' in query_lower and ('any color' in query_lower or 'colored' in query_lower):
            return f"{query}, passenger car of any color on road, automobile vehicle driving"
        
        return query

    async def encode_text(self, text: str) -> np.ndarray:
        """
        Generate CLIP embedding for text with object query enhancement
        """
        if not self.is_initialized:
            await self.initialize()
            
        try:
            # Enhance the query for better object detection
            enhanced_text = self.enhance_object_query(text)
            
            # Run tokenization and inference in executor to avoid blocking
            loop = asyncio.get_event_loop()
            
            def _encode():
                text_input = clip.tokenize([enhanced_text]).to(self.device)
                with torch.no_grad():
                    text_features = self.model.encode_text(text_input)
                    # Normalize embedding
                    text_features = text_features / text_features.norm(dim=-1, keepdim=True)
                return text_features.cpu().numpy().flatten()
            
            return await loop.run_in_executor(None, _encode)
            
        except Exception as e:
            raise Exception(f"Failed to encode text '{text}': {str(e)}")
    
    async def generate_frame_embeddings(self, db: Session, video_id: int) -> int:
        """
        Generate embeddings for all frames of a video
        Returns number of embeddings created
        """
        try:
            # Get all frames for this video that don't have embeddings
            frames = db.query(Frame).filter(
                Frame.video_id == video_id,
                ~Frame.id.in_(db.query(Embedding.frame_id))
            ).all()
            
            embeddings_created = 0
            
            for frame in frames:
                if not frame.frame_path or not os.path.exists(frame.frame_path):
                    continue
                
                try:
                    # Generate embedding
                    embedding_vector = self.encode_image(frame.frame_path)
                    
                    # Save to database
                    embedding = Embedding(
                        frame_id=frame.id,
                        embedding=embedding_vector.tolist(),  # Convert to list for JSON storage
                        model_name=settings.clip_model_name
                    )
                    db.add(embedding)
                    embeddings_created += 1
                    
                    # Commit in batches to avoid memory issues
                    if embeddings_created % 10 == 0:
                        db.commit()
                
                except Exception as e:
                    print(f"Failed to create embedding for frame {frame.id}: {str(e)}")
                    continue
            
            db.commit()
            return embeddings_created
            
        except Exception as e:
            db.rollback()
            raise Exception(f"Failed to generate frame embeddings: {str(e)}")
    
    async def search_similar_frames(
        self, 
        db: Session, 
        query_embedding: np.ndarray, 
        user_id: int,
        limit: int = 10,
        similarity_threshold: float = 0.5,
        filters: Optional[dict] = None
    ) -> dict:
        """
        Search for frames similar to query embedding using pgvector cosine similarity
        """
        try:
            start_time = time.time()
            
            # Convert numpy array to list for pgvector
            query_vector = query_embedding.tolist()
            
            # Build pgvector similarity query with filters
            filter_conditions = [f"v.user_id = {user_id}"]  # Always filter by user
            
            if filters:
                if filters.get("time_of_day"):
                    filter_conditions.append(f"v.time_of_day = '{filters['time_of_day']}'")
                
                if filters.get("weather"):
                    filter_conditions.append(f"v.weather = '{filters['weather']}'")
                
                if filters.get("category"):
                    filter_conditions.append(f"v.video_metadata->>'camera_type' = '{filters['category']}'")
                
                if filters.get("speed_min"):
                    filter_conditions.append(f"f.speed >= {filters['speed_min']}")
                
                if filters.get("speed_max"):
                    filter_conditions.append(f"f.speed <= {filters['speed_max']}")
            
            # Construct WHERE clause
            where_clause = ""
            if filter_conditions:
                where_clause = "WHERE " + " AND ".join(filter_conditions)
            
            # Use pgvector's cosine distance operator for efficient similarity search
            # Note: pgvector uses distance (lower = more similar), so we convert to similarity
            raw_query = text(f"""
                SELECT 
                    f.id as frame_id,
                    v.id as video_id,
                    f.timestamp,
                    1 - (e.embedding <=> CAST(:query_vector AS vector)) as similarity,
                    f.frame_path,
                    f.frame_metadata,
                    v.original_filename as video_filename,
                    v.duration as video_duration
                FROM embeddings e
                JOIN frames f ON e.frame_id = f.id
                JOIN videos v ON f.video_id = v.id
                {where_clause}
                AND 1 - (e.embedding <=> CAST(:query_vector AS vector)) >= :similarity_threshold
                ORDER BY e.embedding <=> CAST(:query_vector AS vector)
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
            
            # For total_found, we approximate it as we don't want to run a separate count query
            # for performance reasons with large datasets
            total_found = len(similarities)
            if len(similarities) == limit:
                total_found = limit  # Just return the limit, don't use string
            
            return {
                "results": similarities,
                "total_found": total_found,
                "search_time_ms": search_time
            }
            
        except Exception as e:
            raise Exception(f"Failed to search similar frames: {str(e)}")
    
    async def search_by_text(
        self,
        db: Session,
        query_text: str,
        user_id: int,
        limit: int = 10,
        similarity_threshold: float = 0.5,
        filters: Optional[dict] = None
    ) -> dict:
        """
        Search frames by natural language text query
        """
        try:
            # Generate embedding for query text
            query_embedding = await self.encode_text(query_text)
            
            # Search similar frames
            search_results = await self.search_similar_frames(
                db, query_embedding, user_id, limit, similarity_threshold, filters
            )
            
            # Save search record
            search_record = Search(
                query_text=query_text,
                query_type="text",
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
            raise Exception(f"Failed to search by text: {str(e)}")
    
    async def search_by_image(
        self,
        db: Session,
        image_path: str,
        user_id: int,
        limit: int = 10,
        similarity_threshold: float = 0.5,
        filters: Optional[dict] = None
    ) -> dict:
        """
        Search frames by example image
        """
        try:
            # Generate embedding for query image
            query_embedding = await self.encode_image(image_path)
            
            # Search similar frames
            search_results = await self.search_similar_frames(
                db, query_embedding, user_id, limit, similarity_threshold, filters
            )
            
            # Save search record
            search_record = Search(
                query_text=f"Image search: {os.path.basename(image_path)}",
                query_type="clip",
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
            raise Exception(f"Failed to search by image: {str(e)}")
    
    async def detect_conditions_clip(self, image_path: str) -> dict:
        """
        Use CLIP to detect time of day and weather conditions from video frames
        """
        if not self.is_initialized:
            await self.initialize()
            
        try:
            # Time of day prompts
            time_prompts = [
                "a bright sunny day with clear visibility",
                "a dark nighttime scene with street lights and artificial lighting", 
                "dawn or dusk with low lighting and twilight conditions",
                "daytime with overcast sky and natural lighting"
            ]
            
            # Weather condition prompts  
            weather_prompts = [
                "clear sunny weather with good visibility",
                "rainy wet conditions with water on roads",
                "cloudy overcast weather with gray sky",
                "foggy conditions with poor visibility",
                "snowy winter conditions with snow"
            ]
            
            # Generate image embedding
            image_embedding = await self.encode_image(image_path)
            
            # Generate text embeddings for all prompts
            loop = asyncio.get_event_loop()
            
            def _encode_prompts():
                time_embeddings = []
                weather_embeddings = []
                
                for prompt in time_prompts:
                    text_input = clip.tokenize([prompt]).to(self.device)
                    with torch.no_grad():
                        text_features = self.model.encode_text(text_input)
                        text_features = text_features / text_features.norm(dim=-1, keepdim=True)
                        time_embeddings.append(text_features.cpu().numpy().flatten())
                
                for prompt in weather_prompts:
                    text_input = clip.tokenize([prompt]).to(self.device)
                    with torch.no_grad():
                        text_features = self.model.encode_text(text_input)
                        text_features = text_features / text_features.norm(dim=-1, keepdim=True)
                        weather_embeddings.append(text_features.cpu().numpy().flatten())
                
                return time_embeddings, weather_embeddings
            
            time_embeddings, weather_embeddings = await loop.run_in_executor(None, _encode_prompts)
            
            # Calculate similarities
            time_similarities = []
            for time_emb in time_embeddings:
                similarity = np.dot(image_embedding, time_emb)
                time_similarities.append(float(similarity))
            
            weather_similarities = []
            for weather_emb in weather_embeddings:
                similarity = np.dot(image_embedding, weather_emb)
                weather_similarities.append(float(similarity))
            
            # Determine best matches
            time_labels = ["day", "night", "dusk", "day"]  # Map to our schema values
            weather_labels = ["sunny", "rainy", "cloudy", "foggy", "snowy"]
            
            best_time_idx = np.argmax(time_similarities)
            best_weather_idx = np.argmax(weather_similarities)
            
            detected_time = time_labels[best_time_idx]
            detected_weather = weather_labels[best_weather_idx]
            
            # Confidence scores
            time_confidence = time_similarities[best_time_idx]
            weather_confidence = weather_similarities[best_weather_idx]
            
            return {
                "time_of_day": detected_time,
                "weather": detected_weather,
                "time_confidence": time_confidence,
                "weather_confidence": weather_confidence,
                "time_similarities": dict(zip(time_labels, time_similarities)),
                "weather_similarities": dict(zip(weather_labels, weather_similarities))
            }
            
        except Exception as e:
            print(f"CLIP condition detection failed: {str(e)}")
            # Fallback to basic detection
            return await self._fallback_condition_detection(image_path)
    
    async def _fallback_condition_detection(self, image_path: str) -> dict:
        """Fallback to basic brightness-based detection"""
        try:
            import cv2
            image = cv2.imread(image_path)
            if image is None:
                return {"time_of_day": "day", "weather": "sunny"}
            
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            avg_brightness = np.mean(gray)
            
            if avg_brightness < 50:
                time_of_day = "night"
            elif avg_brightness < 120:
                time_of_day = "dusk"  
            else:
                time_of_day = "day"
                
            return {
                "time_of_day": time_of_day,
                "weather": "sunny",  # Default
                "time_confidence": 0.5,
                "weather_confidence": 0.5
            }
        except Exception:
            return {"time_of_day": "day", "weather": "sunny"}