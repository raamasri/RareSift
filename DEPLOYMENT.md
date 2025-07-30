# RareSift Deployment Guide

## 🚀 Production Deployment on Your Domain

### Prerequisites
- Docker & Docker Compose installed
- Your domain (e.g., raresift.com) with DNS configured
- SSL certificate (can use Let's Encrypt)

### Step 1: Clone and Configure

```bash
git clone https://github.com/raamasri/RareSift.git
cd RareSift
```

### Step 2: Set Up Environment

```bash
# Copy production environment template
cp .env.production .env

# Edit the .env file with your actual values:
nano .env
```

**Required Environment Variables:**
```bash
# Database (use a strong password\!)
POSTGRES_PASSWORD=your-super-secure-password-here
DATABASE_URL=postgresql://postgres:your-super-secure-password-here@postgres:5432/raresift

# Security (generate a 32+ character secret key)
SECRET_KEY=your-super-secret-key-at-least-32-characters-long
ENVIRONMENT=production

# Your domain
API_URL=https://api.yourdomain.com
DOMAIN=yourdomain.com
```

### Step 3: Deploy with Docker

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

Your RareSift MVP is now live and ready for YC demos\! 🎉
EOF < /dev/null