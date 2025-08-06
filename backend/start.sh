#!/bin/bash

# Get port from environment variable or default to 8000
PORT=${PORT:-8000}

echo "Starting RareSift API on port $PORT..."

# Initialize database tables (create if missing)
echo "Initializing database tables..."
python init_database.py

# Run database migrations
echo "Running database migrations..."
python -m alembic upgrade head

# Load real data from existing demo metadata if needed
echo "Loading real data if needed..."
python load_real_data.py

# Start the FastAPI server
echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT