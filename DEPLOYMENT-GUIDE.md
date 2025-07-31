# 🚀 RareSift Production Deployment Guide

## Quick Deployment Steps

### 1. Render Backend Deployment

1. **Go to [Render Dashboard](https://dashboard.render.com)**
2. **Connect GitHub Repository**:
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select `raamasri/RareSift` repository
   - Branch: `main`

3. **Service Configuration**:
   ```
   Name: raresift-backend
   Environment: Python 3
   Build Command: cd backend && pip install -r requirements.txt
   Start Command: cd backend && python -m alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

4. **Environment Variables** (Add these in Render dashboard):
   ```
   ENVIRONMENT=production
   DEBUG=false
   LOG_LEVEL=INFO
   SECRET_KEY=[Generate with: openssl rand -base64 64]
   JWT_SECRET=[Generate with: openssl rand -base64 32]
   CORS_ORIGINS=https://raresift.vercel.app,https://www.raresift.com
   CLIP_MODEL_NAME=ViT-B/32
   MAX_WORKERS=4
   ```

5. **Add PostgreSQL Database**:
   - In Render dashboard: "New +" → "PostgreSQL"
   - Name: `raresift-postgres`
   - Add to backend service environment:
     ```
     DATABASE_URL=[Auto-generated from PostgreSQL service]
     ```

6. **Add Redis Cache**:
   - In Render dashboard: "New +" → "Redis"
   - Name: `raresift-redis`  
   - Add to backend service environment:
     ```
     REDIS_URL=[Auto-generated from Redis service]
     ```

7. **Deploy**: Click "Deploy"

### 2. Vercel Frontend Deployment

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Import Project**:
   - Click "Add New..." → "Project"
   - Import `raamasri/RareSift`
   - Framework: Next.js
   - Root Directory: `frontend`

3. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=[Your Render backend URL]
   NEXT_PUBLIC_ENVIRONMENT=production
   ```

4. **Deploy**: Click "Deploy"

### 3. Post-Deployment Configuration

1. **Update CORS Origins** in Render:
   - Go to your backend service environment variables
   - Update `CORS_ORIGINS` to include your Vercel domain:
     ```
     CORS_ORIGINS=https://your-vercel-app.vercel.app
     ```

2. **Test Deployment**:
   ```bash
   # Test backend health
   curl https://your-render-app.onrender.com/health
   
   # Test frontend
   curl https://your-vercel-app.vercel.app
   ```

## Alternative: Using render.yaml (Automatic)

If you prefer automatic deployment:

1. **Push render.yaml to your repository** (already done)
2. **In Render Dashboard**:
   - Click "New +" → "Blueprint"
   - Connect repository
   - Render will automatically detect `render.yaml` and create all services

## Environment URLs

After deployment, you'll have:
- **Backend**: `https://raresift-backend.onrender.com`
- **Frontend**: `https://raresift-frontend.vercel.app`
- **Database**: Managed by Render
- **Cache**: Managed by Render

## Validation

Run the deployment validation:
```bash
cd /path/to/RareSift
python3 scripts/comprehensive-production-audit.py
```

## 🎉 Production Ready!

Your RareSift deployment includes:
- ✅ Enterprise security and authentication
- ✅ Performance optimization with caching
- ✅ Comprehensive monitoring and logging
- ✅ Automated CI/CD pipeline
- ✅ Backup and disaster recovery
- ✅ Scalable architecture