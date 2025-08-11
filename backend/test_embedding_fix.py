#!/usr/bin/env python3
"""
Test fix for first 5 embeddings
"""

import json
import gzip
import sys
from sqlalchemy import create_engine, text
import os

def test_embeddings(dataset_file, database_url):
    """Test fix for first few embeddings"""
    print("🔧 Testing embedding fix with first 5 embeddings...")
    
    # Load dataset
    with gzip.open(dataset_file, 'rt') as f:
        data = json.load(f)
    
    print(f"📊 Testing first 5 embeddings...")
    
    # Connect to database
    engine = create_engine(database_url)
    
    fixed_count = 0
    
    with engine.connect() as conn:
        for i, emb in enumerate(data['embeddings'][:5]):
            try:
                # Reconstruct the embedding vector from character list
                char_list = emb['embedding']
                vector_str = ''.join(char_list)
                
                # Parse the vector string
                if vector_str.startswith('[') and vector_str.endswith(']'):
                    numbers_str = vector_str[1:-1]  # Remove brackets
                    numbers = [float(x.strip()) for x in numbers_str.split(',')]
                    
                    # Validate vector size (should be 1536 for OpenAI CLIP)
                    if len(numbers) == 1536:
                        # Convert to pgvector format
                        vector_str_pg = '[' + ','.join(map(str, numbers)) + ']'
                        
                        print(f"Embedding {emb['id']}: Vector size {len(numbers)}, testing insert...")
                        
                        # Insert into database using direct formatting for vector type
                        conn.execute(text(f"""
                            INSERT INTO embeddings (id, frame_id, embedding, model_name, created_at)
                            VALUES (:id, :frame_id, '{vector_str_pg}'::vector, :model_name, :created_at)
                            ON CONFLICT (id) DO NOTHING
                        """), {
                            "id": emb['id'],
                            "frame_id": emb['frame_id'],
                            "model_name": emb['model_name'],
                            "created_at": emb['created_at']
                        })
                        
                        fixed_count += 1
                        print(f"✅ Successfully inserted embedding {emb['id']}")
                    else:
                        print(f"❌ Invalid vector size {len(numbers)} for embedding {emb['id']}")
                else:
                    print(f"❌ Invalid vector format for embedding {emb['id']}")
                    
            except Exception as e:
                print(f"❌ Error processing embedding {emb['id']}: {e}")
        
        # Final commit
        conn.commit()
    
    print(f"✅ Test complete! Fixed: {fixed_count}/5")
    
    return fixed_count > 0

if __name__ == "__main__":
    dataset_file = 'complete_dataset_export_20250807_003349.json.gz'
    database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/raresift')
    
    success = test_embeddings(dataset_file, database_url)
    print(f"Result: {'SUCCESS' if success else 'FAILED'}")