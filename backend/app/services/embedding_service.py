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
    
    async def encode_text(self, text: str) -> np.ndarray:
        """
        Generate CLIP embedding for text
        """
        if not self.is_initialized:
            await self.initialize()
            
        try:
            # Run tokenization and inference in executor to avoid blocking
            loop = asyncio.get_event_loop()
            
            def _encode():
                text_input = clip.tokenize([text]).to(self.device)
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
            filter_conditions = []
            
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
                    1 - (e.embedding <=> :query_vector) as similarity,
                    f.frame_path,
                    f.frame_metadata,
                    v.original_filename as video_filename,
                    v.duration as video_duration
                FROM embeddings e
                JOIN frames f ON e.frame_id = f.id
                JOIN videos v ON f.video_id = v.id
                {where_clause}
                HAVING 1 - (e.embedding <=> :query_vector) >= :similarity_threshold
                ORDER BY e.embedding <=> :query_vector
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
                total_found = f"{limit}+"  # Indicate there may be more results
            
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
                db, query_embedding, limit, similarity_threshold, filters
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
                db, query_embedding, limit, similarity_threshold, filters
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