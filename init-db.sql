-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create database user if not exists
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'scenarioseeker') THEN
      CREATE USER scenarioseeker WITH PASSWORD 'scenarioseeker';
   END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE scenarioseeker TO scenarioseeker; 