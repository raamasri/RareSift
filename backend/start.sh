#!/bin/bash

# Get port from environment variable or default to 8000
PORT=${PORT:-8000}

echo "Starting RareSift API on port $PORT..."

# Run database migrations
echo "Running database migrations..."
python -m alembic upgrade head

# Start the FastAPI server
echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT