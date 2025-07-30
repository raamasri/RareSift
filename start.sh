#!/bin/bash

set -e

echo "🚀 Starting RareSift Application Setup..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p backend/uploads/frames
mkdir -p backend/uploads/exports
mkdir -p backend/alembic/versions

# Check if environment files exist
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env file not found. Creating from example..."
    cp backend/.env.example backend/.env 2>/dev/null || echo "Using default settings"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  Frontend .env.local file not found. Creating from example..."
    cp frontend/.env.local.example frontend/.env.local 2>/dev/null || echo "Using default settings"
fi

echo "🐳 Starting Docker containers..."
docker-compose up -d postgres redis

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "🗄️  Running database migrations..."
docker-compose exec -T postgres psql -U postgres -d raresift -c "CREATE EXTENSION IF NOT EXISTS vector;" || echo "Extension might already exist"

echo "🏗️  Building and starting all services..."
docker-compose up -d --build

echo "⏳ Waiting for services to start..."
sleep 15

echo "🎉 RareSift is starting up!"
echo ""
echo "📍 Access points:"
echo "   🌐 Frontend: http://localhost:3000"
echo "   📡 Backend API: http://localhost:8000"
echo "   📚 API Docs: http://localhost:8000/docs"
echo "   ❤️  Health Check: http://localhost:8000/health"
echo ""
echo "📊 Monitor with:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Stop with:"
echo "   docker-compose down"
echo ""
echo "✨ Ready for your AV scenario search demo!" 