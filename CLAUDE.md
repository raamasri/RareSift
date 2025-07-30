# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
RareSift is an AI-powered SAAS platform for autonomous vehicle (AV) teams to search driving scenarios using natural language queries or example clips. Built as an MVP for YC application with FastAPI backend and Next.js frontend.

## Development Commands

### Quick Start
```bash
# Start all services (recommended for development)
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs frontend
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev          # Development server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
```

### Backend Development
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Database migrations
python -m alembic upgrade head
python -m alembic revision --autogenerate -m "description"

# Create new migration
python create_migration.py
```

### Testing
- No formal test suite currently exists - check README.md for testing approach
- Use health check endpoint: http://localhost:8000/health
- Frontend accessible at: http://localhost:3000
- API docs at: http://localhost:8000/docs

## Architecture Overview

### Tech Stack
- **Backend**: FastAPI (Python) + SQLAlchemy + PostgreSQL with pgvector
- **Frontend**: Next.js 14 with TypeScript + Tailwind CSS + Radix UI
- **AI/ML**: OpenAI CLIP model for video frame embeddings and semantic search
- **Storage**: Local filesystem (uploads/) with optional AWS S3
- **Cache**: Redis for query optimization
- **Database**: PostgreSQL with pgvector extension for vector similarity search

### Core Workflow
1. **Video Upload**: Users upload driving videos with metadata
2. **Processing**: Backend extracts frames (1/second), generates CLIP embeddings
3. **Search**: Natural language queries converted to embeddings, similarity search via pgvector
4. **Export**: Selected scenarios packaged as ZIP with frames + metadata

### Key Services
- `embedding_service.py`: CLIP model management, embedding generation, similarity search
- `video_processor.py`: Video frame extraction and processing pipeline
- Database models use pgvector extension for efficient vector operations

### Frontend Structure
- **App Router**: Next.js 14 app directory structure
- **State**: React Query for server state, React Context for client state
- **UI**: Tailwind CSS + Radix UI components + Headless UI
- **Key Components**:
  - `video-upload.tsx`: Drag-drop upload with progress
  - `search-interface.tsx`: Text and image-based search
  - `search-results.tsx`: Results display with thumbnails
  - `export-manager.tsx`: Batch export functionality

### Database Schema
- **videos**: Video metadata, processing status, file info
- **frames**: Individual frame data with timestamps
- **embeddings**: CLIP vectors (512-dim) using pgvector
- **searches**: Query history and analytics
- **exports**: Export job tracking

## Configuration

### Environment Setup
Backend requires `.env` file:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/raresift
REDIS_URL=redis://localhost:6379
SECRET_KEY=dev-secret-key-change-in-production
```

Frontend requires `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Key Settings (backend/app/core/config.py)
- `clip_model_name`: "ViT-B/32" (CLIP model variant)
- `embedding_dim`: 512 (vector dimension)
- `frame_extraction_interval`: 1 second
- `upload_dir`: "./uploads" (local storage path)

## Important Implementation Details

### Video Processing Pipeline
1. Upload validates file type/size, stores to uploads/
2. Background processing extracts frames every N seconds
3. CLIP embeddings generated for each frame
4. Processing status tracked in database

### Search Implementation
- Text queries: CLIP text encoder → vector → cosine similarity search
- Image queries: CLIP image encoder → vector → cosine similarity search  
- Uses PostgreSQL pgvector extension for efficient similarity operations
- Results ranked by cosine similarity score with configurable threshold

### Performance Considerations
- CLIP model runs on GPU if available (5-10x faster than CPU)
- Embeddings generated in batches of 10 for memory efficiency
- Redis caching for frequent queries
- Background processing prevents UI blocking

## Development Notes
- Project uses cursor.md for development context (similar to this file)
- Built for YC demo - optimized for rapid development over perfect architecture
- No formal CI/CD yet - manual testing and deployment
- GPU recommended for CLIP inference but not required
- pgvector extension must be installed in PostgreSQL