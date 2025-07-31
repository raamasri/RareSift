#!/usr/bin/env python3
"""
Database optimization script for RareSift
Creates indexes and optimizes database performance
"""

from sqlalchemy import text
from app.core.database import engine

def create_performance_indexes():
    """Create indexes for better performance"""
    
    indexes = [
        # Video table indexes
        "CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);",
        "CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at);",
        "CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);",
        "CREATE INDEX IF NOT EXISTS idx_videos_title_gin ON videos USING gin(to_tsvector('english', title));",
        
        # Frame table indexes
        "CREATE INDEX IF NOT EXISTS idx_frames_video_id ON frames(video_id);",
        "CREATE INDEX IF NOT EXISTS idx_frames_timestamp ON frames(timestamp);",
        
        # Embedding table indexes
        "CREATE INDEX IF NOT EXISTS idx_embeddings_frame_id ON embeddings(frame_id);",
        
        # Search table indexes
        "CREATE INDEX IF NOT EXISTS idx_searches_user_id ON searches(user_id);",
        "CREATE INDEX IF NOT EXISTS idx_searches_created_at ON searches(created_at);",
        
        # User table indexes
        "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);",
        "CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);"
    ]
    
    with engine.connect() as conn:
        for index_sql in indexes:
            try:
                conn.execute(text(index_sql))
                print(f"✅ Created index: {index_sql.split()[5]}")
            except Exception as e:
                print(f"⚠️  Index might already exist: {e}")
        
        conn.commit()

def analyze_database_performance():
    """Analyze database performance"""
    
    analysis_queries = [
        # Check table sizes
        """
        SELECT schemaname, tablename, 
               pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
        """,
        
        # Check index usage
        """
        SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
        FROM pg_stat_user_indexes
        ORDER BY idx_tup_read DESC;
        """,
        
        # Check slow queries (if pg_stat_statements is enabled)
        """
        SELECT query, calls, total_time, mean_time
        FROM pg_stat_statements
        ORDER BY mean_time DESC
        LIMIT 10;
        """
    ]
    
    with engine.connect() as conn:
        for i, query in enumerate(analysis_queries):
            try:
                result = conn.execute(text(query))
                print(f"\n📊 Analysis Query {i+1}:")
                for row in result:
                    print(f"   {row}")
            except Exception as e:
                print(f"⚠️  Query {i+1} failed (might need pg_stat_statements): {e}")

if __name__ == "__main__":
    print("🗄️ RareSift Database Optimization")
    print("=" * 40)
    
    print("Creating performance indexes...")
    create_performance_indexes()
    
    print("\nAnalyzing database performance...")
    analyze_database_performance()
    
    print("\n✅ Database optimization complete!")
