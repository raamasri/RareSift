# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
RareSift is an AI-powered SAAS platform for autonomous vehicle (AV) teams to search driving scenarios using natural language queries or example clips. Built as an MVP for YC application with FastAPI backend and Next.js frontend.

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

### Production Management
```bash
# Production infrastructure setup
python3 scripts/setup-secrets.py           # Configure secrets management
python3 scripts/setup-monitoring.py        # Deploy monitoring stack
python3 scripts/performance-optimization.py # Optimize performance
python3 scripts/production-cleanup.py --live # Remove debug code

# Validation and testing
python3 scripts/validate-production-deployment.py # Full system validation
python3 scripts/performance-test-suite.py  # Performance testing
python3 scripts/security-audit.py          # Security validation
python3 scripts/test-cicd-pipeline.py      # CI/CD pipeline testing
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
- **videos**: Video metadata, processing status, file info
- **frames**: Individual frame data with timestamps
- **embeddings**: CLIP vectors (512-dim) using pgvector
- **searches**: Query history and analytics
- **exports**: Export job tracking

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

## Development Notes
- **Production Ready**: Enterprise-grade infrastructure with comprehensive security
- **Built for Scale**: Optimized for high-performance production deployment
- **Automated CI/CD**: Full automation with security scanning and deployment
- **GPU Recommended**: For CLIP inference (5-10x performance improvement)
- **pgvector Required**: PostgreSQL extension for vector similarity operations
- **Monitoring**: Full observability stack with Prometheus + Grafana