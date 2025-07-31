#!/bin/bash
# Render build script for RareSift backend

set -e

echo "🚀 Starting RareSift backend build for Render..."

# Navigate to backend directory
cd backend

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Download NLTK data if needed
echo "📚 Downloading NLTK data..."
python -c "import nltk; nltk.download('punkt', quiet=True)" || echo "NLTK punkt already downloaded or failed"

# Verify key imports
echo "🔍 Verifying key imports..."
python -c "import torch; print(f'PyTorch version: {torch.__version__}')" || echo "PyTorch not available"
python -c "import clip; print('CLIP import successful')" || echo "CLIP not available"
python -c "from app.core.config_secure import get_settings; print('Config import successful')"

echo "✅ Build completed successfully!"