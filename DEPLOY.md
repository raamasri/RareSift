# 🚀 RareSift Deployment Guide

This guide covers deploying RareSift to GitHub, Vercel (frontend), and Render (backend).

## ✅ Prerequisites Completed

- [x] All code committed and pushed to GitHub
- [x] Frontend configured for Vercel deployment
- [x] Backend configured for Render deployment
- [x] Demo user created with 22 demo videos
- [x] Production-ready configurations in place

## 🎯 Deployment Steps

### 1. GitHub (✅ COMPLETED)
```bash
git add .
git commit -m "Deploy production-ready RareSift with demo functionality"
git push origin main
```

### 2. Frontend → Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import the `raamasri/RareSift` repository
4. Configure project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Environment Variables (automatically set via `vercel.json`):
   ```
   NEXT_PUBLIC_API_URL=https://raresift-backend.onrender.com
   NEXT_PUBLIC_ENVIRONMENT=production
   ```
6. Deploy!

Expected URL: `https://raresift.vercel.app`

### 3. Backend → Render
1. Go to [render.com](https://render.com) and sign in
2. Click "New" → "Blueprint"
3. Connect GitHub repository: `raamasri/RareSift`
4. Render will automatically detect `render.yaml` and create:
   - ✅ **Web Service**: `raresift-backend` (FastAPI app)
   - ✅ **PostgreSQL Database**: `raresift-postgres` 
   - ✅ **Redis Cache**: `raresift-redis`
5. Deployment will:
   - Install Python dependencies
   - Run database migrations
   - Start FastAPI server with uvicorn
   - Create demo user automatically

Expected URL: `https://raresift-backend.onrender.com`

## 🔧 Post-Deployment Setup

### Demo User Setup
The backend will automatically create a demo user on first deployment:
- **Email**: `demo@raresift.com`
- **Password**: `demo123`
- **Videos**: 22 demo videos with embeddings

### Health Checks
- **Frontend**: https://raresift.vercel.app
- **Backend**: https://raresift-backend.onrender.com/health
- **API Docs**: https://raresift-backend.onrender.com/docs

## 🎬 Demo Features Available

### For YC Demo/Investors:
1. **Video Library**: 22 real driving videos with metadata
2. **AI Search**: Semantic search using CLIP embeddings
3. **Real Results**: Actual AI-powered similarity matching
4. **Export**: Download selected video frames as ZIP
5. **Authentication**: Seamless demo user auto-login

### Demo Flow:
1. Visit https://raresift.vercel.app
2. Go to "Video Library" 
3. Switch from "Local Assets" to "Database"
4. System auto-logs in as demo user
5. Browse 22 real videos with full metadata
6. Test search with queries like:
   - "cars turning left"
   - "rainy weather driving"
   - "highway intersection"

## 🛠️ Troubleshooting

### If Frontend Build Fails:
```bash
cd frontend
npm install
npm run build
```

### If Backend Deployment Fails:
- Check database connection in Render logs
- Verify Redis service is running
- Check requirements.txt for missing dependencies

### If Demo User Issues:
Run in Render console:
```bash
python backend/create_demo_user.py
```

## 📊 Production Features

- **Security**: CORS, rate limiting, input validation
- **Performance**: Redis caching, vector indexes
- **Monitoring**: Health checks, structured logging
- **Scalability**: Horizontal scaling ready
- **AI/ML**: Real CLIP model inference

## 🎯 Success Criteria

- ✅ Frontend loads at Vercel URL
- ✅ Backend responds at Render URL
- ✅ Video Library shows 22 videos
- ✅ Search returns relevant results
- ✅ Demo user auto-login works
- ✅ Export functionality operational

---

**Ready for YC Demo!** 🚀