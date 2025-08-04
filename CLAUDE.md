# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
RareSift is an AI-powered SAAS platform for autonomous vehicle (AV) teams to search driving scenarios using natural language queries or example clips. Built as an MVP for YC application with FastAPI backend and Next.js frontend.

**Current Status**: Production-ready MVP deployed to Vercel (frontend) + Render (backend) using GitHub LFS for video storage. OpenAI CLIP integration (1536-dim embeddings), complete dataset with **22 videos** (4,951 total seconds) and **4,959 frames** with full embedding coverage (100.2%).

**Deployment Architecture**: 
- **Frontend**: Vercel (https://raresift.vercel.app) - Next.js application
- **Backend**: Render (https://raresift-backend.onrender.com) - FastAPI with PostgreSQL + Redis
- **Video Storage**: GitHub LFS (20GB videos) - Free for YC demo, scalable to AWS S3 later

## Development Commands

### Quick Start
```bash
# Start all services (recommended for development)
docker-compose up -d

# Start production services
docker-compose -f docker-compose.production.yml up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs frontend
```

### Production Deployment (GitHub LFS + Vercel + Render)
```bash
# Deploy to production (from main branch)
git add . && git commit -m "Deploy to production"
git push origin main

# Frontend automatically deploys to Vercel
# Backend automatically deploys to Render
# Videos served via GitHub LFS (free tier: 1GB/month bandwidth)

# Monitor deployments
vercel --prod                    # Check Vercel deployment status
render services list             # Check Render services
```

### Local Production Testing
```bash
# Test with production environment variables
cd backend && export OPENAI_API_KEY=<key> && python3 simple_main.py
cd frontend && npm run build && npm run start

# Validate search functionality
curl -X POST https://raresift-backend.onrender.com/search \
  -H "Content-Type: application/json" \
  -d '{"query": "traffic intersection", "limit": 10}'
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
- Production-grade test suites available for all infrastructure components
- Performance testing: `python3 scripts/performance-test-suite.py`
- Security testing: `python3 scripts/security-audit.py`
- System validation: `python3 scripts/validate-production-deployment.py`
- Use health check endpoint: http://localhost:8000/health
- Frontend accessible at: http://localhost:3000
- API docs at: http://localhost:8000/docs
- Monitoring dashboards: http://localhost:3001 (Grafana)

## Architecture Overview

### Tech Stack
- **Backend**: FastAPI (Python) + SQLAlchemy + PostgreSQL with pgvector
- **Frontend**: Next.js 14 with TypeScript + Tailwind CSS + Radix UI
- **AI/ML**: OpenAI CLIP model for video frame embeddings and semantic search
- **Storage**: Local filesystem (uploads/) with optional AWS S3
- **Cache**: Redis for query optimization and performance
- **Database**: PostgreSQL with pgvector extension for vector similarity search
- **Infrastructure**: Docker containers with production hardening
- **Monitoring**: Prometheus + Grafana for metrics and alerting
- **Security**: HashiCorp Vault, SSL/TLS, security middleware
- **CI/CD**: GitHub Actions with automated security scanning
- **Backup**: Automated backup system with S3 integration

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
- **videos**: Video metadata, processing status, file info (22 videos total)
- **frames**: Individual frame data with timestamps (4,959 frames total)
- **embeddings**: CLIP vectors (1536-dim) using pgvector (100% coverage)
- **searches**: Query history and analytics
- **exports**: Export job tracking

### Dataset Overview
**Video Collection (22 total videos, 4,951 seconds):**
- **Driving Camera Footage (9 videos)**: 3,711 seconds total
  - Durations range from 147s to 708s
  - Located in `video_assets/driving_camera_footage/`
- **Static Camera Footage (13 videos)**: 1,240 seconds total  
  - Durations range from 11s to 204s
  - Located in `video_assets/static_camera_footage/`
- **Frame Extraction**: 1 frame per second = 4,951 expected frames
- **Actual Frames**: 4,959 frames (100.2% coverage with some overlap frames)

## Configuration

### Environment Setup

#### Development Environment
Backend requires `.env` file:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/raresift
REDIS_URL=redis://localhost:6379
SECRET_KEY=dev-secret-key-change-in-production
ENVIRONMENT=development
```

Frontend requires `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Production Environment
Production uses secrets management (HashiCorp Vault, AWS Secrets Manager):
```bash
# Initialize secrets management
python3 scripts/setup-secrets.py

# Environment variables managed through:
# - backend/.env.production (for non-sensitive config)
# - Secrets backend (for sensitive data like API keys, passwords)
# - Docker secrets (for container-level secrets)
```

Key production configurations:
- `ENVIRONMENT=production`
- `LOG_LEVEL=INFO` 
- `DEBUG=False`
- Database and Redis URLs from secrets backend
- SSL certificates managed automatically

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

## Production Infrastructure

### Security & Compliance
- **Secrets Management**: HashiCorp Vault, AWS Secrets Manager, environment variables
- **SSL/TLS**: Automated certificate management with Let's Encrypt
- **Security Scanning**: CodeQL, Trivy, Bandit, GitLeaks, TruffleHog in CI/CD
- **Container Security**: Non-root users, read-only filesystems, security policies
- **Access Control**: JWT authentication, role-based permissions

### Monitoring & Observability 
- **Metrics**: Prometheus metrics collection with Grafana dashboards
- **Logging**: Structured JSON logging with centralized aggregation
- **Health Checks**: Comprehensive service health monitoring
- **Performance**: Request timing, database query performance tracking
- **Alerting**: Automated alerts for system issues and performance degradation

### Performance & Scalability
- **Caching**: Redis caching for search results and metadata
- **Database**: Optimized indexes and query performance
- **Load Balancing**: Nginx reverse proxy with rate limiting
- **Resource Management**: Docker resource limits and auto-scaling
- **Performance Testing**: Automated load testing and optimization

### Backup & Disaster Recovery
- **Automated Backups**: PostgreSQL, Redis, and filesystem backups
- **Cloud Integration**: S3-compatible storage with encryption
- **Disaster Recovery**: Documented procedures with 4-hour RTO
- **Point-in-time Recovery**: Database and file restoration capabilities

### CI/CD Pipeline
- **GitHub Actions**: Automated testing, security scanning, deployment
- **Security Gates**: Automated security scans block insecure deployments
- **Multi-stage Deployment**: Staging and production environments
- **Rollback Capabilities**: Automated rollback on deployment failures

## Scaling Roadmap (Post-YC)

### Current MVP Architecture (Free Tier - YC Demo)
- **Frontend**: Vercel (Free tier - unlimited bandwidth)
- **Backend**: Render (Free tier - 750 hours/month)
- **Database**: Render PostgreSQL (Free tier - 1GB storage)
- **Videos**: GitHub LFS (Free tier - 1GB/month bandwidth)
- **Total Cost**: $0/month during demo period

### Phase 1: Immediate Scale (Post-Demo)
- **Videos**: Migrate to AWS S3 + CloudFront CDN (~$10/month for 20GB + reasonable traffic)
- **Backend**: Upgrade Render to Starter plan ($7/month for persistent compute)
- **Database**: Upgrade to Render PostgreSQL Starter ($7/month for 10GB)
- **Total Cost**: ~$25/month

### Phase 2: Growth Scale (Customer Traction)
- **Infrastructure**: AWS ECS/EKS for auto-scaling
- **Database**: Amazon RDS with read replicas
- **Storage**: S3 with intelligent tiering
- **CDN**: CloudFront global distribution
- **Monitoring**: DataDog, New Relic integration
- **Total Cost**: $200-500/month (scales with usage)

### Phase 3: Enterprise Scale (Series A+)
- **Multi-region deployment** for global performance
- **Enterprise security** (SOC2, HIPAA compliance)
- **Custom ML pipelines** for customer-specific embeddings
- **White-label solutions** for OEM partnerships
- **Total Cost**: $2000+/month (scales with enterprise needs)

### Migration Strategy
The current GitHub LFS approach allows seamless migration:
1. Update `environment.ts` to point to new CDN URLs
2. Deploy changes to Vercel/Render
3. Zero downtime transition
4. All search functionality remains identical

## Development Notes  
- **MVP Ready**: Free-tier deployment suitable for YC demo and initial customer validation
- **Future-Proof**: Architecture designed for easy scaling without breaking changes
- **Cost-Conscious**: Can operate at $0/month during validation phase
- **GPU Recommended**: For CLIP inference (5-10x performance improvement)
- **pgvector Required**: PostgreSQL extension for vector similarity operations
- **Monitoring**: Full observability stack with Prometheus + Grafana