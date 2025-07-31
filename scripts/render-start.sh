#!/bin/bash
# Render start script for RareSift backend

set -e

echo "🚀 Starting RareSift backend on Render..."

# Navigate to backend directory
cd backend

# Set default port if not provided by Render
export PORT=${PORT:-8000}
export HOST=${HOST:-0.0.0.0}

echo "🌐 Server will start on ${HOST}:${PORT}"

# Run database migrations
echo "🗄️ Running database migrations..."
python -m alembic upgrade head || echo "⚠️ Migration failed or no migrations needed"

# Create upload directory if it doesn't exist
echo "📁 Creating upload directory..."
mkdir -p /tmp/uploads

# Verify configuration
echo "🔧 Verifying configuration..."
python -c "from app.core.config_secure import get_settings; s = get_settings(); print(f'Environment: {s.environment}')"

# Start the application
echo "🎯 Starting FastAPI application..."
exec uvicorn app.main:app --host $HOST --port $PORT --workers 1