# RareSift Production Deployment Guide

This guide provides comprehensive instructions for deploying RareSift in production with enterprise-grade security, monitoring, and performance optimization.

## 🎯 Production Readiness Overview

RareSift includes a complete production infrastructure stack:

- ✅ **Security**: Secrets management, SSL/TLS, security scanning, container hardening
- ✅ **Monitoring**: Prometheus + Grafana metrics, structured logging, health checks
- ✅ **Performance**: Redis caching, database optimization, load testing
- ✅ **Reliability**: Automated backups, disaster recovery, high availability
- ✅ **CI/CD**: GitHub Actions with security gates and automated deployment
- ✅ **Compliance**: Security auditing, vulnerability scanning, access controls

## 🚀 Quick Production Setup

### 1. Prerequisites

#### System Requirements
- **CPU**: 8+ cores (4+ minimum)
- **RAM**: 32GB+ (16GB+ minimum)
- **Storage**: 500GB+ SSD with backup capabilities
- **Network**: 1Gbps+ connection
- **OS**: Ubuntu 20.04+ or compatible Linux distribution

#### Software Dependencies
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose v2
sudo apt update
sudo apt install docker-compose-plugin

# Install Python 3.11+ for management scripts
sudo apt install python3.11 python3.11-pip python3.11-venv
```

### 2. Repository Setup

```bash
# Clone repository
git clone <your-repository-url>
cd RareSift

# Create production environment files
cp docker-compose.production.yml docker-compose.yml
cp backend/.env.production backend/.env
cp frontend/.env.production frontend/.env.local

# Make scripts executable
chmod +x scripts/*.sh
chmod +x scripts/*.py
```

### 3. Infrastructure Initialization

```bash
# 1. Set up secrets management (choose one)
python3 scripts/setup-secrets.py --backend=vault     # HashiCorp Vault
python3 scripts/setup-secrets.py --backend=aws       # AWS Secrets Manager
python3 scripts/setup-secrets.py --backend=env       # Environment variables

# 2. Generate SSL certificates
bash scripts/generate-ssl-certs.sh --production --domain=your-domain.com

# 3. Initialize monitoring stack
python3 scripts/setup-monitoring.py --production

# 4. Configure backup system
bash scripts/backup-system.sh --setup --s3-bucket=your-backup-bucket
```

### 4. Security Hardening

```bash
# Run comprehensive security audit
python3 scripts/security-audit.py

# Apply security configurations
python3 scripts/security-validation.py --apply-fixes

# Validate security setup
python3 scripts/validate-secrets-system.py
```

### 5. Performance Optimization

```bash
# Analyze and optimize performance
python3 scripts/performance-optimization.py

# Optimize database with indexes
python3 scripts/optimize-database.py

# Remove debug code for production
python3 scripts/production-cleanup.py --live --clean-temp
```

### 6. Deployment and Validation

```bash
# Start production services
docker-compose up -d

# Wait for all services to be healthy
docker-compose ps

# Run comprehensive validation
python3 scripts/validate-production-deployment.py

# Performance testing
python3 scripts/performance-test-suite.py --url=https://your-domain.com
```

## 🏗️ Detailed Deployment Options

### Option 1: Cloud Native (AWS/GCP)

#### AWS Deployment
```bash
# Infrastructure as Code (Terraform)
cd infrastructure/aws
terraform init
terraform plan -var="domain_name=your-domain.com"
terraform apply

# Deploy application
aws ecs update-service --cluster raresift-prod --service raresift-app
```

#### Key AWS Services Used
- **ECS/Fargate**: Container orchestration
- **RDS PostgreSQL**: Managed database with pgvector
- **ElastiCache Redis**: Managed caching layer
- **ALB**: Application load balancer with SSL termination
- **S3**: File storage and backups
- **Secrets Manager**: Secrets management
- **CloudWatch**: Monitoring and logging

### Option 2: Kubernetes Deployment

```bash
# Deploy to Kubernetes cluster
kubectl create namespace raresift-prod

# Apply configurations
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/configs/
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/

# Verify deployment
kubectl get pods -n raresift-prod
kubectl get services -n raresift-prod
```

### Option 3: Docker Swarm

```bash
# Initialize Docker Swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.production.yml raresift

# Scale services
docker service scale raresift_backend=3
docker service scale raresift_worker=2
```

## 🔧 Configuration Management

### Environment Variables

#### Backend Configuration (.env)
```bash
# Application Settings
ENVIRONMENT=production
DEBUG=False
LOG_LEVEL=INFO

# Database (managed by secrets backend)
DATABASE_URL=${SECRET:database_url}
REDIS_URL=${SECRET:redis_url}

# Security
SECRET_KEY=${SECRET:app_secret_key}
JWT_SECRET=${SECRET:jwt_secret}

# External Services
OPENAI_API_KEY=${SECRET:openai_api_key}
AWS_ACCESS_KEY_ID=${SECRET:aws_access_key}
AWS_SECRET_ACCESS_KEY=${SECRET:aws_secret_key}

# Performance
CLIP_MODEL_NAME=ViT-B/32
MAX_WORKERS=4
BATCH_SIZE=10
CACHE_TTL=3600
```

#### Frontend Configuration (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_DSN=${SECRET:sentry_dsn}
```

### Secrets Management

#### HashiCorp Vault Setup
```bash
# Initialize Vault
vault operator init
vault operator unseal

# Configure authentication
vault auth enable userpass
vault write auth/userpass/users/raresift password=${VAULT_PASSWORD}

# Store secrets
vault kv put secret/raresift database_url="${DATABASE_URL}"
vault kv put secret/raresift redis_url="${REDIS_URL}"
vault kv put secret/raresift app_secret_key="${SECRET_KEY}"
```

#### AWS Secrets Manager Setup
```bash
# Store secrets in AWS Secrets Manager
aws secretsmanager create-secret --name "raresift/prod/database_url" --secret-string "${DATABASE_URL}"
aws secretsmanager create-secret --name "raresift/prod/redis_url" --secret-string "${REDIS_URL}"
aws secretsmanager create-secret --name "raresift/prod/app_secret_key" --secret-string "${SECRET_KEY}"
```

## 📊 Monitoring and Observability

### Metrics and Dashboards

#### Access Monitoring
- **Grafana**: https://monitoring.your-domain.com:3001
- **Prometheus**: https://monitoring.your-domain.com:9090
- **Application Logs**: Centralized via your log management solution

#### Key Metrics to Monitor
```bash
# Application Performance
- Request latency (target: <500ms p95)
- Throughput (requests/second)
- Error rates (target: <1%)
- Search response times (target: <200ms cached)

# System Resources
- CPU utilization (target: <70%)
- Memory usage (target: <80%)
- Disk I/O and storage
- Network throughput

# Business Metrics
- Video processing queue length
- Active user sessions
- Search success rates
- Export completion rates
```

### Alerting Rules

#### Critical Alerts
```yaml
# High error rate
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "High error rate detected"

# Database connectivity
- alert: DatabaseDown
  expr: up{job="postgres"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Database is down"

# High response time
- alert: HighResponseTime
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High response time detected"
```

## 🔒 Security Best Practices

### SSL/TLS Configuration

#### Automated Certificate Management
```bash
# Let's Encrypt with auto-renewal
certbot certonly --webroot -w /var/www/html -d your-domain.com -d api.your-domain.com
crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Nginx Security Headers
```nginx
# Security headers (already configured in nginx/nginx.conf)
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'" always;
```

### Database Security

#### PostgreSQL Hardening
```sql
-- Create application user with limited permissions
CREATE USER raresift_app WITH PASSWORD '${SECRET:db_password}';
GRANT CONNECT ON DATABASE raresift TO raresift_app;
GRANT USAGE ON SCHEMA public TO raresift_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO raresift_app;

-- Enable connection encryption
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/path/to/cert.pem';
ALTER SYSTEM SET ssl_key_file = '/path/to/key.pem';
```

### Container Security

#### Security Configurations (already implemented)
```yaml
# Non-root user
user: "1001:1001" 

# Read-only filesystem
read_only: true

# Security options
security_opt:
  - no-new-privileges:true

# Resource limits
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 4G
```

## 💾 Backup and Disaster Recovery

### Automated Backup System

#### Database Backups
```bash
# Automated PostgreSQL backups (configured in backup-system.sh)
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Upload to S3 with encryption
aws s3 cp backup_*.sql.gz s3://your-backup-bucket/database/ --server-side-encryption AES256
```

#### File System Backups
```bash
# Backup uploaded videos and processed data
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
aws s3 cp uploads_backup_*.tar.gz s3://your-backup-bucket/uploads/
```

### Disaster Recovery Procedures

#### RTO: 4 hours | RPO: 24 hours

1. **Infrastructure Recovery**
   ```bash
   # Restore from Infrastructure as Code
   terraform apply -auto-approve
   
   # Redeploy application
   docker stack deploy -c docker-compose.production.yml raresift
   ```

2. **Database Recovery**
   ```bash
   # Download latest backup
   aws s3 cp s3://your-backup-bucket/database/latest.sql.gz .
   
   # Restore database
   gunzip -c latest.sql.gz | psql -h $DB_HOST -U $DB_USER -d $DB_NAME
   ```

3. **Validation**
   ```bash
   # Validate restored system
   python3 scripts/validate-production-deployment.py
   python3 scripts/performance-test-suite.py --quick
   ```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

#### Automated Deployment Pipeline
```yaml
# .github/workflows/ci-cd.yml (already configured)
name: RareSift CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  security-scan:
    # CodeQL, Trivy, Bandit, GitLeaks scanning
    
  test:
    # Unit tests, integration tests
    
  build:
    # Docker image building
    
  deploy-staging:
    # Deploy to staging environment
    
  deploy-production:
    # Deploy to production with approval
```

### Deployment Strategies

#### Blue-Green Deployment
```bash
# Deploy to green environment
docker service update --image raresift:v2.0 raresift_backend_green

# Health check green environment
curl -f https://green.your-domain.com/health

# Switch traffic to green
# Update load balancer configuration

# Decommission blue environment after validation
```

#### Rolling Updates
```bash
# Kubernetes rolling update
kubectl set image deployment/raresift-backend backend=raresift:v2.0

# Monitor rollout
kubectl rollout status deployment/raresift-backend

# Rollback if needed
kubectl rollout undo deployment/raresift-backend
```

## 📋 Maintenance and Operations

### Daily Operations

#### Health Monitoring
```bash
# Automated health checks (run every 5 minutes)
python3 scripts/health-check.py --alert-on-failure

# System resource monitoring
docker stats
htop
```

#### Log Analysis
```bash
# Application logs
docker-compose logs --tail=100 backend frontend

# System logs
journalctl -u docker.service -f

# Error analysis
grep "ERROR" /var/log/raresift/*.log | tail -50
```

### Weekly Maintenance

#### Performance Testing
```bash
# Baseline performance testing
python3 scripts/performance-test-suite.py --comprehensive

# Database optimization
python3 scripts/optimize-database.py --analyze

# Security validation
python3 scripts/security-audit.py --report
```

#### Backup Verification
```bash
# Test backup restoration
python3 scripts/test-backup-system.py --restore-test

# Verify backup integrity
bash scripts/backup-system.sh --verify
```

### Monthly Maintenance

#### Security Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d

# Security audit
python3 scripts/security-audit.py --comprehensive
```

#### Performance Optimization
```bash
# Comprehensive performance analysis
python3 scripts/performance-optimization.py --full-analysis

# Database maintenance
python3 scripts/optimize-database.py --vacuum --reindex

# Cache optimization
redis-cli FLUSHDB  # Clear cache during low-traffic period
```

## 🚨 Troubleshooting

### Common Production Issues

#### High Response Times
```bash
# Check system resources
htop
docker stats

# Analyze slow queries
python3 scripts/optimize-database.py --slow-query-analysis

# Check cache performance
redis-cli INFO stats
```

#### Database Connection Issues
```bash
# Check database connectivity
python3 scripts/validate-production-deployment.py --database-only

# Monitor connection pool
docker-compose logs backend | grep "connection"

# Database status
psql -h $DB_HOST -U $DB_USER -c "SELECT * FROM pg_stat_activity;"
```

#### Memory Leaks
```bash
# Monitor memory usage over time
docker stats --no-stream

# Restart services if needed
docker-compose restart backend

# Check for memory leaks in logs
docker-compose logs backend | grep -i "memory\|oom"
```

### Emergency Procedures

#### Service Recovery
```bash
# Quick service restart
docker-compose restart

# Full system restart
docker-compose down
docker-compose up -d

# Rollback to previous version
docker-compose down
docker tag raresift:v1.9 raresift:latest
docker-compose up -d
```

#### Database Recovery
```bash
# Emergency database restore
python3 scripts/backup-system.sh --emergency-restore

# Database repair
psql -h $DB_HOST -U $DB_USER -c "REINDEX DATABASE raresift;"
```

## 📞 Support and Escalation

### Monitoring Alerts

- **Critical**: Page on-call engineer immediately
- **Warning**: Create ticket for next business day
- **Info**: Log for analysis

### Contact Information

- **On-call Engineer**: [phone/slack]
- **Database Administrator**: [contact]
- **Infrastructure Team**: [contact]
- **Security Team**: [contact]

### Escalation Matrix

1. **Level 1**: Application issues, performance degradation
2. **Level 2**: Database issues, security incidents
3. **Level 3**: Infrastructure outages, data loss

---

## 🎉 Production Checklist

Before going live, ensure all items are completed:

### Security ✅
- [ ] Secrets management configured and tested
- [ ] SSL/TLS certificates installed and auto-renewal configured
- [ ] Security headers configured in reverse proxy
- [ ] Container security hardening applied
- [ ] Database access controls implemented
- [ ] Security audit completed with no critical issues

### Monitoring ✅
- [ ] Prometheus metrics collection configured
- [ ] Grafana dashboards deployed and accessible
- [ ] Log aggregation and analysis setup
- [ ] Health checks implemented for all services
- [ ] Alerting rules configured and tested

### Performance ✅
- [ ] Redis caching enabled and configured
- [ ] Database indexes optimized
- [ ] Performance testing completed with acceptable results
- [ ] Resource limits and auto-scaling configured
- [ ] CDN configured for static assets (if applicable)

### Reliability ✅
- [ ] Automated backup system configured and tested
- [ ] Disaster recovery procedures documented and tested
- [ ] High availability configuration implemented
- [ ] Monitoring and alerting for critical services
- [ ] Rollback procedures tested

### Operations ✅
- [ ] CI/CD pipeline configured and tested
- [ ] Documentation complete and accessible
- [ ] Runbooks created for common operations
- [ ] Team training completed
- [ ] Support escalation procedures defined

🚀 **Production deployment is ready!**

---

*This guide provides comprehensive production deployment procedures for RareSift. For additional support or questions, refer to the troubleshooting section or contact the development team.*