#!/usr/bin/env python3
"""
Debug search functionality to understand similarity scores
"""
import sys
import os
import asyncio
import hashlib
import numpy as np

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.embedding_service import EmbeddingService

async def test_search_debug():
    """Test search functionality and examine similarity scores"""
    
    # Create embedding service
    service = EmbeddingService()
    
    # Test the encode_text function
    test_queries = ["car", "vehicle", "highway", "traffic", "road"]
    
    print("=== Testing Text Encoding ===")
    for query in test_queries:
        embedding = await service.encode_text(query)
        print(f"Query: '{query}' -> Embedding shape: {embedding.shape}, First 5 values: {embedding[:5]}")
    
    print("\n=== Testing Similarity Between Similar Queries ===")
    car_embedding = await service.encode_text("car")
    vehicle_embedding = await service.encode_text("vehicle")
    
    # Calculate cosine similarity
    similarity = np.dot(car_embedding, vehicle_embedding) / (np.linalg.norm(car_embedding) * np.linalg.norm(vehicle_embedding))
    print(f"Similarity between 'car' and 'vehicle': {similarity}")
    
    # Test completely different queries
    road_embedding = await service.encode_text("road")
    random_embedding = await service.encode_text("xyzabc123random")
    
    similarity2 = np.dot(car_embedding, road_embedding) / (np.linalg.norm(car_embedding) * np.linalg.norm(road_embedding))
    similarity3 = np.dot(car_embedding, random_embedding) / (np.linalg.norm(car_embedding) * np.linalg.norm(random_embedding))
    
    print(f"Similarity between 'car' and 'road': {similarity2}")
    print(f"Similarity between 'car' and 'random': {similarity3}")

if __name__ == "__main__":
    asyncio.run(test_search_debug())