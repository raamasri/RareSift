# RareSift Production Deployment Guide

## 🚀 Current Deployment Status

### ✅ Completed
- **Frontend**: Successfully deployed to Vercel
  - URL: https://raresift-frontend-lb8ghw2el-raama-srivatsans-projects.vercel.app
  - Status: ✅ Live and functional
  - Build: Compiled successfully with all TypeScript issues resolved

- **Repository**: GitHub with production configuration
  - URL: https://github.com/raamasri/RareSift
  - Status: ✅ All production files committed and pushed
  - Configuration: Vercel, Render, and GitHub LFS ready

### 🔄 Next Steps (Manual Completion Required)

#### Backend Deployment to Render

1. **Login to Render Dashboard**
   - Go to https://render.com
   - Login with your account

2. **Import Repository**
   - Click "New +" → "Web Service"
   - Connect GitHub account if not already connected
   - Select repository: `raamasri/RareSift`
   - Use existing `render.yaml` configuration

3. **Configure Environment Variables**
   - Set `OPENAI_API_KEY` in Render dashboard
   - Other variables will be auto-configured from render.yaml

4. **Deploy Services**
   - PostgreSQL database: `raresift-db` (free tier)
   - Redis cache: `raresift-redis` (free tier)  
   - Web service: `raresift-backend` (free tier)

5. **Update Frontend Configuration**
   - Once backend is deployed, get the Render backend URL
   - Update `frontend/.env.production` with the actual backend URL
   - Redeploy frontend to Vercel

## 🔧 Configuration Files

All deployment configuration files are ready:

- `render.yaml` - Complete Render deployment configuration
- `vercel.json` - Vercel deployment settings
- `.gitattributes` - Git LFS configuration for videos
- `frontend/.env.production` - Production environment variables
- `frontend/src/utils/environment.ts` - Environment detection logic

## 📋 Manual Deployment Checklist

### Backend (Render.com)
- [ ] Create Render account and connect GitHub
- [ ] Import RareSift repository 
- [ ] Deploy PostgreSQL database (raresift-db)
- [ ] Deploy Redis cache (raresift-redis)
- [ ] Deploy web service (raresift-backend)
- [ ] Set OPENAI_API_KEY environment variable
- [ ] Verify health check endpoint: `/health`
- [ ] Note the backend URL (e.g., https://raresift-backend.onrender.com)

### Frontend Update
- [ ] Update `NEXT_PUBLIC_API_URL` in vercel.json with actual backend URL
- [ ] Redeploy to Vercel to pick up backend URL changes
- [ ] Test full functionality end-to-end

### Testing
- [ ] Verify homepage loads correctly
- [ ] Test search functionality on /app page
- [ ] Verify video library loads (22 videos)
- [ ] Test video playback
- [ ] Confirm search results display properly

## 🌟 Expected Result

Once completed, you'll have:

1. **Frontend**: https://raresift-frontend-[hash].vercel.app
   - Next.js application with hardcoded MVP data
   - Search interface with OpenAI embeddings
   - Video library with 22 demo videos
   - Responsive design with Tailwind CSS

2. **Backend**: https://raresift-backend.onrender.com
   - FastAPI application with 4 core endpoints
   - PostgreSQL database with pgvector
   - Redis caching layer
   - OpenAI CLIP integration for search

3. **Complete YC Demo MVP**
   - Fully functional RareSift application
   - Production-ready deployment
   - Free tier hosting (suitable for demo)
   - Scalable architecture for future growth

## 🔄 Post-Deployment

After successful deployment:
- Document the live URLs in CLAUDE.md
- Test all functionality thoroughly 
- Prepare demo scenarios for YC presentation
- Monitor performance and error logs

---

**Status**: Frontend deployed ✅ | Backend pending manual completion 🔄
**Next Action**: Complete Render backend deployment via dashboard