-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create database user if not exists
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'raresift') THEN
      CREATE USER raresift WITH PASSWORD 'raresift';
   END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE raresift TO raresift; 