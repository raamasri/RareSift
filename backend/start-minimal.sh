#!/bin/bash

# Get port from environment variable or default to 8000
PORT=${PORT:-8000}

echo "Starting RareSift API on port $PORT..."

# Start the FastAPI server without migrations first
# Migrations can be run separately once DB is confirmed working
echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT --timeout-keep-alive 60