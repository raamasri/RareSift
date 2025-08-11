#!/usr/bin/env python3
"""
Fix and import embeddings from malformed export
"""

import json
import gzip
import sys
from sqlalchemy import create_engine, text
import os

def fix_and_import_embeddings(dataset_file, database_url):
    """Fix malformed embeddings and import them"""
    print("🔧 Fixing and importing embeddings...")
    
    # Load dataset
    with gzip.open(dataset_file, 'rt') as f:
        data = json.load(f)
    
    print(f"📊 Processing {len(data['embeddings'])} embeddings...")
    
    # Connect to database
    engine = create_engine(database_url)
    
    fixed_count = 0
    skipped_count = 0
    batch_size = 100
    
    with engine.connect() as conn:
        # Process in batches for better performance
        for batch_start in range(0, len(data['embeddings']), batch_size):
            batch_end = min(batch_start + batch_size, len(data['embeddings']))
            batch = data['embeddings'][batch_start:batch_end]
            
            batch_fixed = 0
            for emb in batch:
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
                            batch_fixed += 1
                        else:
                            if len(numbers) != 1536:
                                skipped_count += 1
                    else:
                        skipped_count += 1
                        
                except Exception as e:
                    skipped_count += 1
                    if batch_fixed == 0:  # Only print errors for first few
                        print(f"⚠️  Error processing embedding {emb['id']}: {str(e)[:100]}")
            
            # Commit batch
            conn.commit()
            print(f"   Batch {batch_start//batch_size + 1}/{(len(data['embeddings']) + batch_size - 1)//batch_size}: {batch_fixed} embeddings imported")
        
        print(f"✅ All batches processed")
    
    print(f"✅ Import complete!")
    print(f"   Fixed: {fixed_count}")
    print(f"   Skipped: {skipped_count}")
    
    return fixed_count > 0

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python fix_embeddings_import.py <dataset_file.json.gz>")
        sys.exit(1)
    
    dataset_file = sys.argv[1]
    database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/raresift')
    
    success = fix_and_import_embeddings(dataset_file, database_url)
    sys.exit(0 if success else 1)