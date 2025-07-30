import torch
import clip
import numpy as np
import os
from PIL import Image
from typing import List, Optional, Union
from sqlalchemy.orm import Session
import time

from app.core.config import settings
from app.models.video import Frame, Embedding, Search


class EmbeddingService:
    """
    Service for generating and managing CLIP embeddings
    """
    
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = None
        self.preprocess = None
        self._load_model()
    
    def _load_model(self):
        """Load CLIP model and preprocessing"""
        try:
            self.model, self.preprocess = clip.load(settings.clip_model_name, device=self.device)
            print(f"CLIP model {settings.clip_model_name} loaded on {self.device}")
        except Exception as e:
            print(f"Failed to load CLIP model: {str(e)}")
            raise e
    
    def encode_image(self, image_path: str) -> np.ndarray:
        """
        Generate CLIP embedding for an image
        """
        try:
            # Load and preprocess image
            image = Image.open(image_path).convert("RGB")
            image_input = self.preprocess(image).unsqueeze(0).to(self.device)
            
            # Generate embedding
            with torch.no_grad():
                image_features = self.model.encode_image(image_input)
                # Normalize embedding
                image_features = image_features / image_features.norm(dim=-1, keepdim=True)
                
            return image_features.cpu().numpy().flatten()
            
        except Exception as e:
            raise Exception(f"Failed to encode image {image_path}: {str(e)}")
    
    def encode_text(self, text: str) -> np.ndarray:
        """
        Generate CLIP embedding for text
        """
        try:
            # Tokenize text
            text_input = clip.tokenize([text]).to(self.device)
            
            # Generate embedding
            with torch.no_grad():
                text_features = self.model.encode_text(text_input)
                # Normalize embedding
                text_features = text_features / text_features.norm(dim=-1, keepdim=True)
                
            return text_features.cpu().numpy().flatten()
            
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
    
    def search_similar_frames(
        self, 
        db: Session, 
        query_embedding: np.ndarray, 
        limit: int = 10,
        similarity_threshold: float = 0.5,
        filters: Optional[dict] = None
    ) -> dict:
        """
        Search for frames similar to query embedding using cosine similarity
        """
        try:
            start_time = time.time()
            
            # Base query for embeddings with frame and video data  
            from app.models.video import Video
            query = db.query(
                Embedding,
                Frame,
                Video
            ).join(Frame, Embedding.frame_id == Frame.id).join(Video, Frame.video_id == Video.id)
            
            # Apply filters if provided
            if filters:
                if filters.get("time_of_day"):
                    from app.models.video import Video
                    query = query.filter(Video.time_of_day == filters["time_of_day"])
                
                if filters.get("weather"):
                    from app.models.video import Video
                    query = query.filter(Video.weather == filters["weather"])
                
                if filters.get("speed_min"):
                    query = query.filter(Frame.speed >= filters["speed_min"])
                
                if filters.get("speed_max"):
                    query = query.filter(Frame.speed <= filters["speed_max"])
            
            # Get all embeddings
            results = query.all()
            
            # Calculate similarities
            similarities = []
            for embedding, frame, video in results:
                # Convert embedding back to numpy array
                emb_vector = np.array(embedding.embedding)
                
                # Calculate cosine similarity
                similarity = np.dot(query_embedding, emb_vector) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(emb_vector)
                )
                
                if similarity >= similarity_threshold:
                    similarities.append({
                        "frame_id": frame.id,
                        "video_id": video.id,
                        "timestamp": frame.timestamp,
                        "similarity": float(similarity),
                        "frame_path": frame.frame_path,
                        "metadata": frame.frame_metadata or {},
                        "video_filename": video.original_filename,
                        "video_duration": video.duration
                    })
            
            # Sort by similarity and limit results
            similarities.sort(key=lambda x: x["similarity"], reverse=True)
            
            search_time = int((time.time() - start_time) * 1000)  # Convert to milliseconds
            
            return {
                "results": similarities[:limit],
                "total_found": len(similarities),
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
            query_embedding = self.encode_text(query_text)
            
            # Search similar frames
            search_results = self.search_similar_frames(
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
            query_embedding = self.encode_image(image_path)
            
            # Search similar frames
            search_results = self.search_similar_frames(
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