import numpy as np
import openai
import os
from typing import List, Dict
from sqlalchemy import text
from simple_database import get_db
from simple_models import Video, Frame, Embedding

# Initialize OpenAI client
openai_client = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def generate_text_embedding(query: str) -> np.ndarray:
    """Generate embedding for text query using OpenAI ada-002"""
    try:
        # Enhance query for better traffic/driving scene matching
        enhanced_query = enhance_traffic_query(query)
        
        response = await openai_client.embeddings.create(
            model="text-embedding-ada-002",
            input=enhanced_query
        )
        
        # Convert to numpy array and normalize
        embedding = np.array(response.data[0].embedding, dtype=np.float32)
        embedding = embedding / np.linalg.norm(embedding)
        
        return embedding
        
    except Exception as e:
        raise Exception(f"Failed to generate embedding: {str(e)}")

def enhance_traffic_query(query: str) -> str:
    """Enhance queries for better traffic/driving scene matching"""
    query_lower = query.lower().strip()
    
    # Specific object enhancements
    enhancements = {
        'bicycle': 'visible bicycle in traffic scene, person riding bike on road, cyclist with bicycle clearly seen',
        'bike': 'visible bicycle in traffic scene, person riding bike on road, cyclist with bicycle clearly seen',
        'car': 'visible car in traffic scene, automobile on road, passenger vehicle clearly seen',
        'truck': 'visible truck in traffic scene, large vehicle on road, commercial truck clearly seen',
        'traffic light': 'visible traffic light in scene, traffic signal with colored lights, intersection with traffic lights',
        'intersection': 'road intersection, crossroads with multiple streets, traffic intersection clearly visible',
        'night': 'nighttime driving scene, dark conditions with street lights, evening traffic scene',
        'day': 'daytime driving scene, bright daylight conditions, sunny traffic scene',
        'pedestrian': 'visible person walking, pedestrian on sidewalk or crossing road',
        'stop sign': 'visible stop sign, red octagonal stop sign clearly readable'
    }
    
    # Check for exact matches
    if query_lower in enhancements:
        return enhancements[query_lower]
    
    # Check for partial matches
    for key, enhancement in enhancements.items():
        if key in query_lower:
            return enhancement
    
    # Default enhancement
    return f"traffic scene with {query}, driving scenario showing {query} clearly visible"

async def search_frames_by_text(query: str, limit: int = 10, similarity_threshold: float = 0.3) -> List[Dict]:
    """Search frames by text query using cosine similarity"""
    try:
        # Generate query embedding
        query_embedding = await generate_text_embedding(query)
        query_vector = query_embedding.tolist()
        
        # Get database session
        db = next(get_db())
        
        # Search using pgvector cosine similarity
        raw_query = text("""
            SELECT 
                f.id as frame_id,
                v.id as video_id, 
                f.timestamp,
                1 - (e.embedding <=> CAST(:query_vector AS vector)) as similarity,
                f.frame_path,
                v.original_filename as video_filename,
                v.duration as video_duration
            FROM frames f
            JOIN videos v ON f.video_id = v.id
            JOIN embeddings e ON f.id = e.frame_id
            WHERE e.embedding IS NOT NULL
            AND 1 - (e.embedding <=> CAST(:query_vector AS vector)) >= :threshold
            ORDER BY e.embedding <=> CAST(:query_vector AS vector)
            LIMIT :limit_results
        """)
        
        result = db.execute(raw_query, {
            "query_vector": query_vector,
            "threshold": similarity_threshold,
            "limit_results": limit
        })
        
        # Format results
        results = []
        for row in result:
            results.append({
                "frame_id": row.frame_id,
                "video_id": row.video_id,
                "timestamp": row.timestamp,
                "similarity": float(row.similarity),
                "frame_path": row.frame_path,
                "video_filename": row.video_filename
            })
        
        return results
        
    except Exception as e:
        raise Exception(f"Search failed: {str(e)}")

def get_adaptive_threshold(query: str) -> float:
    """Get adaptive similarity threshold based on query specificity"""
    query_lower = query.lower().strip()
    
    # High precision objects need higher thresholds
    high_precision = ['bicycle', 'bike', 'motorcycle', 'pedestrian', 'stop sign', 'traffic light']
    medium_precision = ['car', 'truck', 'bus', 'intersection', 'bridge']
    low_precision = ['road', 'street', 'traffic', 'night', 'day']
    
    for obj in high_precision:
        if obj in query_lower:
            return 0.4  # Higher threshold for specific objects
    
    for obj in medium_precision:
        if obj in query_lower:
            return 0.3  # Medium threshold
    
    for obj in low_precision:
        if obj in query_lower:
            return 0.25  # Lower threshold for general scenes
    
    return 0.3  # Default threshold