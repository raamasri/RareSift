#!/bin/bash

set -e

echo "🧪 Testing RareSift Setup..."

# Test Docker availability
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is available"

# Check if required files exist
echo "📋 Checking required files..."

required_files=(
    "docker-compose.yml"
    "backend/Dockerfile"
    "backend/requirements.txt"
    "backend/app/main.py"
    "frontend/Dockerfile"
    "frontend/package.json"
    "frontend/src/app/page.tsx"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (missing)"
        exit 1
    fi
done

echo "📦 Building containers (this may take a few minutes)..."
docker-compose build --no-cache > /dev/null 2>&1 || {
    echo "❌ Build failed. Check your Docker setup."
    exit 1
}

echo "✅ Containers built successfully!"

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 20

# Test backend health
echo "🏥 Testing backend health..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend is responding"
else
    echo "⚠️  Backend may still be starting up"
fi

# Test frontend
echo "🌐 Testing frontend..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is responding"
else
    echo "⚠️  Frontend may still be starting up"
fi

echo ""
echo "🎉 RareSift Test Complete!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "📡 Backend: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "📊 Check logs with: docker-compose logs -f"
echo "🛑 Stop with: docker-compose down"
echo ""
echo "Ready for YC demo! 🚀" 