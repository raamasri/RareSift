# RareSift - AI-Driven AV Scenario Search Engine

## 🎯 Project Overview
RareSift is a SAAS product that provides AI-driven search capabilities for driving scenarios and edge cases in autonomous vehicle (AV) datasets. It allows AV teams to quickly find specific scenarios using natural language queries or example clips.

## 🏗️ Architecture

### Tech Stack
- **Backend**: FastAPI (Python) with Celery for background processing
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Database**: PostgreSQL with pgvector extension for vector similarity search
- **AI/ML**: OpenAI CLIP for video frame embeddings
- **Storage**: AWS S3/Cloudflare R2 for video files
- **Cache**: Redis for query caching
- **Deployment**: Docker containers on Render

### Project Structure
```
RareSift/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Configuration and security
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   ├── lib/          # Utilities and configurations
│   │   └── types/        # TypeScript types
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml      # Development environment
├── README.md
└── cursor.md              # This file
```

## 🚀 Core Features (MVP - Sprint 1)

### Backend Features
1. **Video Upload & Processing**
   - Accept video files with metadata
   - Extract frames at regular intervals
   - Generate CLIP embeddings for each frame
   - Store embeddings in PostgreSQL with pgvector

2. **Natural Language Search**
   - Accept text queries ("pedestrian crossing at dusk")
   - Convert queries to embeddings using CLIP
   - Perform vector similarity search
   - Return ranked results with metadata

3. **Query by Example**
   - Accept video clip uploads as queries
   - Extract and embed sample frames
   - Find similar scenarios in the database

### Frontend Features
1. **Upload Interface**
   - Drag-and-drop video upload
   - Metadata input forms
   - Upload progress tracking

2. **Search Interface**
   - Text-based natural language search
   - Video clip upload for example-based queries
   - Real-time search results

3. **Results Display**
   - Video preview thumbnails
   - Metadata display (timestamp, speed, weather, etc.)
   - Similarity scores
   - Export functionality

## 🛠️ Development Setup

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.9+ (for backend development)

### Quick Start
```bash
# Clone and setup
git clone <repository>
cd RareSift

# Start development environment
docker-compose up -d

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && pip install -r requirements.txt

# Run migrations
python -m alembic upgrade head

# Start development servers
# Backend: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# Frontend: npm run dev
```

### Environment Variables
Create `.env` files in both `backend/` and `frontend/` directories:

**Backend (.env)**
```
DATABASE_URL=postgresql://user:password@localhost:5432/raresift
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key
OPENAI_API_KEY=your-openai-key  # If using OpenAI CLIP
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
S3_BUCKET=your-s3-bucket
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📊 Database Schema

### Tables
1. **videos** - Video metadata and file information
2. **frames** - Individual frame data with timestamps
3. **embeddings** - CLIP embeddings for vector search (using pgvector)
4. **searches** - Query history and analytics
5. **exports** - Export job tracking

## 🔄 API Endpoints

### Core Endpoints
- `POST /api/v1/videos/upload` - Upload video with metadata
- `GET /api/v1/videos` - List videos with filtering
- `POST /api/v1/search/text` - Natural language search
- `POST /api/v1/search/clip` - Search by example clip
- `POST /api/v1/export` - Export scenario clips
- `GET /api/v1/export/{job_id}` - Check export status

## 🎯 Sprint Timeline

### Sprint 1 (Weeks 1-2) ✅
- [x] Project setup and infrastructure
- [x] Video upload and processing pipeline
- [x] CLIP embedding extraction
- [x] Basic natural language search
- [x] Simple UI for upload and search

### Sprint 2 (Weeks 3-4)
- [ ] Query by example clip functionality
- [ ] Export workflow with ZIP packaging
- [ ] Advanced filtering (weather, time, speed)
- [ ] User session tracking

### Sprint 3 (Weeks 5-6)
- [ ] UI/UX polish and optimization
- [ ] Scalable metadata pre-filtering
- [ ] Basic LiDAR data integration
- [ ] Demo site and marketing materials

## 🚦 Key Metrics to Track
- **Search Latency**: < 2 seconds for queries
- **Search Recall**: Top 10 results @ ≥60% relevance
- **Upload Processing**: < 60 seconds for 10-minute video
- **Export Speed**: Complete workflow in < 60 seconds

## 🎪 Demo Flow for YC
1. **Upload**: Drag AV video file with basic metadata
2. **Search**: Type "pedestrian near intersection at night"
3. **Results**: Show 10 relevant video clips with scores
4. **Export**: Select 3 clips and export as training dataset

## 💡 YC Application Key Points
- **Clear Problem**: AV teams waste hours manually searching logs
- **Technical Solution**: AI-powered semantic search for video data
- **Fast ROI**: Find edge cases in minutes vs. hours
- **Scalable Market**: Every AV company needs this tool
- **Timing**: Perfect as AV industry focuses on edge case testing

## 🔧 Development Notes
- Use `pgvector` for efficient similarity search
- Implement async processing for video uploads
- Cache frequent queries in Redis
- Use background jobs for heavy processing
- Optimize CLIP model inference for speed

---

*Last updated: Starting development for YC application timeline* 