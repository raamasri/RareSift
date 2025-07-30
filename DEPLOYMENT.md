# RareSift Deployment Guide

This guide covers deploying RareSift for production use or customer pilots.

## 🚀 Quick Local Demo Setup

### Prerequisites
- Docker Desktop (4GB+ RAM allocated)
- 10GB+ free disk space
- Internet connection for model downloads

### 1-Minute Setup
```bash
# Clone repository
git clone <repository-url>
cd RareSift

# Start everything
./start.sh

# Access application
open http://localhost:3000
```

## ☁️ Cloud Deployment Options

### Option 1: Railway (Recommended for MVP)

**Backend Deployment:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy backend
railway login
cd backend
railway create
railway add postgresql
railway add redis
railway deploy
```

**Frontend Deployment (Vercel):**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

### Option 2: AWS/Docker Deployment

**Infrastructure Requirements:**
- EC2 instance: t3.large (2 vCPU, 8GB RAM) minimum
- RDS PostgreSQL with pgvector support
- ElastiCache Redis instance
- S3 bucket for file storage
- Application Load Balancer

**Deploy with Docker Compose:**
```bash
# On your EC2 instance
git clone <repository-url>
cd RareSift

# Set production environment variables
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Edit with production values
vim backend/.env
vim frontend/.env.local

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/
```

## 🔧 Production Configuration

### Environment Variables

**Backend (.env):**
```bash
# Database (use managed PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/raresift

# Redis (use managed Redis)
REDIS_URL=redis://host:6379

# Security (generate strong keys)
SECRET_KEY=your-256-bit-secret-key-here
ALGORITHM=HS256

# File Storage (use S3 in production)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
S3_BUCKET=your-raresift-bucket

# Performance tuning
MAX_FILE_SIZE=2147483648  # 2GB
FRAME_EXTRACTION_INTERVAL=0.5  # Extract every 0.5 seconds
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

### Performance Optimization

**For High-Volume Usage:**
```bash
# Scale backend workers
docker-compose up --scale backend=3 -d

# Use GPU for faster CLIP inference
# Add to docker-compose.yml:
# runtime: nvidia
# environment:
#   - NVIDIA_VISIBLE_DEVICES=all
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints
- Backend: `GET /health`
- Database: `GET /health` includes DB status
- Processing: `GET /api/v1/videos/{id}/processing-status`

### Logging
```bash
# View application logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Monitor resource usage
docker stats
```

### Metrics to Monitor
- Search response times (<2s target)
- Video processing times (<60s per minute)
- Memory usage (watch CLIP model memory)
- Disk usage (uploaded videos + frames)
- Database performance (vector similarity queries)

## 🔒 Security Considerations

### Production Security Checklist
- [ ] Change default SECRET_KEY
- [ ] Enable HTTPS/TLS for all endpoints
- [ ] Set up authentication (if required)
- [ ] Configure CORS properly
- [ ] Enable database connection pooling
- [ ] Set up backup strategy
- [ ] Configure rate limiting
- [ ] Monitor for anomalous usage

### Network Security
```bash
# Firewall rules (example)
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw deny 5432/tcp   # Block direct DB access
ufw deny 6379/tcp   # Block direct Redis access
```

## 📈 Scaling Considerations

### Horizontal Scaling
```bash
# Scale backend processing
docker-compose up --scale backend=5 -d

# Use load balancer for multiple frontend instances
# Configure CDN for static assets
```

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_videos_processed ON videos(is_processed);
CREATE INDEX idx_videos_time_weather ON videos(time_of_day, weather);
CREATE INDEX idx_frames_video_timestamp ON frames(video_id, timestamp);

-- Optimize vector searches
CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops);
```

## 🚨 Troubleshooting

### Common Issues

**CLIP Model Won't Load:**
```bash
# Check available memory
free -h

# Reduce model size or use CPU-only mode
# In backend/.env:
CLIP_MODEL_NAME=ViT-B/16  # Smaller model
```

**Slow Vector Searches:**
```bash
# Add vector index to database
docker-compose exec postgres psql -U postgres -d raresift \
  -c "CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops);"
```

**High Memory Usage:**
```bash
# Limit Docker memory usage
# Add to docker-compose.yml:
mem_limit: 4g
memswap_limit: 4g
```

### Performance Tuning

**Database Connection Pooling:**
```python
# In backend/app/core/database.py
engine = create_engine(
    settings.database_url,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=300
)
```

## 🎯 Customer Pilot Setup

### Pilot Deployment Checklist
- [ ] Deploy on customer-preferred cloud (AWS/GCP/Azure)
- [ ] Set up monitoring dashboards
- [ ] Configure data retention policies
- [ ] Set up backup and disaster recovery
- [ ] Provide customer admin access
- [ ] Document API keys and access methods
- [ ] Schedule regular check-ins

### Success Metrics for Pilots
- **Performance**: <2s search times, >60% relevance
- **Usage**: Customer uploads >10 videos, runs >50 searches
- **Feedback**: Positive feedback on UI and search quality
- **ROI**: Demonstrates time savings vs. manual search

---

**Ready to deploy and scale your AV scenario search platform!** 🚀

For deployment support, contact: [your-support-email] 