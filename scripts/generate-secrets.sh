#!/bin/bash

# RareSift Production Secrets Generator
# This script generates secure random secrets for production deployment

set -e

echo "🔐 RareSift Production Secrets Generator"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}❌ Error: openssl is required but not installed${NC}"
    exit 1
fi

# Create secrets directory if it doesn't exist
mkdir -p ../secrets
cd ../secrets

echo -e "${BLUE}📁 Generating secrets in: $(pwd)${NC}"

# Generate secrets
echo -e "${YELLOW}🔑 Generating SECRET_KEY (64 bytes, base64)...${NC}"
SECRET_KEY=$(openssl rand -base64 64 | tr -d '\n')
echo "SECRET_KEY=${SECRET_KEY}" > .env.secrets

echo -e "${YELLOW}🔐 Generating POSTGRES_PASSWORD (32 bytes, base64)...${NC}"
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
echo "POSTGRES_PASSWORD=${POSTGRES_PASSWORD}" >> .env.secrets

echo -e "${YELLOW}🔒 Generating REDIS_PASSWORD (32 bytes, base64)...${NC}"
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
echo "REDIS_PASSWORD=${REDIS_PASSWORD}" >> .env.secrets

echo -e "${YELLOW}🗄️ Generating database credentials...${NC}"
POSTGRES_USER="raresift_$(openssl rand -hex 4)"
POSTGRES_DB="raresift_prod_$(openssl rand -hex 4)"
echo "POSTGRES_USER=${POSTGRES_USER}" >> .env.secrets
echo "POSTGRES_DB=${POSTGRES_DB}" >> .env.secrets

echo -e "${YELLOW}🔐 Generating JWT signing keys...${NC}"
# Generate RSA key pair for JWT (more secure than HMAC for production)
openssl genrsa -out jwt_private.pem 2048 2>/dev/null
openssl rsa -in jwt_private.pem -pubout -out jwt_public.pem 2>/dev/null
JWT_PRIVATE_KEY=$(cat jwt_private.pem | base64 | tr -d '\n')
JWT_PUBLIC_KEY=$(cat jwt_public.pem | base64 | tr -d '\n')
echo "JWT_PRIVATE_KEY=${JWT_PRIVATE_KEY}" >> .env.secrets
echo "JWT_PUBLIC_KEY=${JWT_PUBLIC_KEY}" >> .env.secrets

echo -e "${YELLOW}📧 Generating API keys...${NC}"
API_MASTER_KEY=$(openssl rand -hex 32)
WEBHOOK_SECRET=$(openssl rand -hex 32)
echo "API_MASTER_KEY=${API_MASTER_KEY}" >> .env.secrets
echo "WEBHOOK_SECRET=${WEBHOOK_SECRET}" >> .env.secrets

# Create environment-specific files
echo -e "${BLUE}📝 Creating environment-specific configuration files...${NC}"

# Production environment file
cat > .env.production << EOF
# RareSift Production Environment Variables
# Generated on: $(date)
# WARNING: Keep these secrets secure and never commit to version control

# Database Configuration
POSTGRES_DB=${POSTGRES_DB}
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_PORT=5432

# Redis Configuration  
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_PORT=6379

# Application Security
SECRET_KEY=${SECRET_KEY}
JWT_PRIVATE_KEY=${JWT_PRIVATE_KEY}
JWT_PUBLIC_KEY=${JWT_PUBLIC_KEY}
API_MASTER_KEY=${API_MASTER_KEY}
WEBHOOK_SECRET=${WEBHOOK_SECRET}

# Application Configuration
ENVIRONMENT=production
LOG_LEVEL=INFO
LOG_FORMAT=json

# API Configuration
NEXT_PUBLIC_API_URL=https://your-domain.com
API_URL=https://your-domain.com

# CORS and Security
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# Rate Limiting
RATE_LIMIT_ENABLED=true
MAX_REQUESTS_PER_MINUTE=60
MAX_REQUESTS_PER_HOUR=1000

# Security Headers
SECURITY_HEADERS_ENABLED=true

# SSL/TLS Configuration
SSL_CERT_PATH=/etc/ssl/certs/raresift.crt
SSL_KEY_PATH=/etc/ssl/private/raresift.key

# Optional: External Services
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_REGION=us-west-2
# S3_BUCKET=raresift-prod-storage

# Optional: Monitoring
# SENTRY_DSN=
# PROMETHEUS_ENABLED=true

# Optional: Email/SMTP
# SMTP_SERVER=
# SMTP_PORT=587
# SMTP_USERNAME=
# SMTP_PASSWORD=
# FROM_EMAIL=noreply@your-domain.com
EOF

# Staging environment file
cat > .env.staging << EOF
# RareSift Staging Environment Variables
# Generated on: $(date)

# Database Configuration (use separate staging DB)
POSTGRES_DB=${POSTGRES_DB}_staging
POSTGRES_USER=${POSTGRES_USER}_staging
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
POSTGRES_PORT=5432

# Redis Configuration
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
REDIS_PORT=6379

# Application Security (separate keys for staging)
SECRET_KEY=$(openssl rand -base64 64 | tr -d '\n')
JWT_PRIVATE_KEY=${JWT_PRIVATE_KEY}
JWT_PUBLIC_KEY=${JWT_PUBLIC_KEY}

# Application Configuration
ENVIRONMENT=staging
LOG_LEVEL=DEBUG
LOG_FORMAT=json

# API Configuration
NEXT_PUBLIC_API_URL=https://staging.your-domain.com
API_URL=https://staging.your-domain.com

# CORS and Security
CORS_ORIGINS=https://staging.your-domain.com
ALLOWED_HOSTS=staging.your-domain.com

# Rate Limiting (more lenient for staging)
RATE_LIMIT_ENABLED=true
MAX_REQUESTS_PER_MINUTE=120
MAX_REQUESTS_PER_HOUR=2000

# Security Headers
SECURITY_HEADERS_ENABLED=true
EOF

# Create secure file permissions
chmod 600 .env.secrets .env.production .env.staging
chmod 600 jwt_private.pem jwt_public.pem

# Create HashiCorp Vault configuration
echo -e "${BLUE}🏦 Creating HashiCorp Vault configuration...${NC}"
cat > vault-config.hcl << EOF
# HashiCorp Vault Configuration for RareSift
storage "file" {
  path = "/vault/data"
}

listener "tcp" {
  address = "0.0.0.0:8200"
  tls_disable = true
}

ui = true
api_addr = "http://127.0.0.1:8200"
cluster_addr = "http://127.0.0.1:8201"
EOF

# Create Vault secrets loading script
cat > load-vault-secrets.sh << 'EOF'
#!/bin/bash
# Load RareSift secrets into HashiCorp Vault

set -e

VAULT_ADDR=${VAULT_ADDR:-"http://127.0.0.1:8200"}
VAULT_TOKEN=${VAULT_TOKEN}

if [[ -z "$VAULT_TOKEN" ]]; then
    echo "❌ Error: VAULT_TOKEN environment variable is required"
    exit 1
fi

echo "🏦 Loading RareSift secrets into Vault..."

# Enable KV secrets engine
vault secrets enable -path=raresift kv-v2 2>/dev/null || true

# Load secrets from .env.production
if [[ -f ".env.production" ]]; then
    echo "📤 Loading production secrets..."
    
    # Read each line and upload to vault
    while IFS='=' read -r key value; do
        if [[ ! -z "$key" && ! "$key" =~ ^# ]]; then
            echo "  Uploading: $key"
            vault kv put raresift/prod "$key=$value"
        fi
    done < .env.production
    
    echo "✅ Production secrets loaded to raresift/prod"
fi

# Load staging secrets
if [[ -f ".env.staging" ]]; then
    echo "📤 Loading staging secrets..."
    
    while IFS='=' read -r key value; do
        if [[ ! -z "$key" && ! "$key" =~ ^# ]]; then
            vault kv put raresift/staging "$key=$value"
        fi
    done < .env.staging
    
    echo "✅ Staging secrets loaded to raresift/staging"
fi

echo "🎉 All secrets loaded into Vault successfully!"
EOF

chmod +x load-vault-secrets.sh

# Create AWS Secrets Manager upload script
cat > upload-aws-secrets.sh << 'EOF'
#!/bin/bash
# Upload RareSift secrets to AWS Secrets Manager

set -e

if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI is required but not installed"
    exit 1
fi

echo "☁️ Uploading RareSift secrets to AWS Secrets Manager..."

# Upload production secrets
if [[ -f ".env.production" ]]; then
    echo "📤 Uploading production secrets..."
    
    # Convert .env to JSON
    jq -n 'reduce inputs as $line ({}; 
        if ($line | test("^[^#].*=.*$")) then
            ($line | split("="; 2)) as [$key, $value] |
            .[$key] = $value
        else
            .
        end
    )' < .env.production > prod-secrets.json
    
    # Upload to AWS Secrets Manager
    aws secretsmanager create-secret \
        --name "raresift/prod/config" \
        --description "RareSift Production Configuration" \
        --secret-string file://prod-secrets.json \
        --region ${AWS_REGION:-us-west-2} || \
    aws secretsmanager update-secret \
        --secret-id "raresift/prod/config" \
        --secret-string file://prod-secrets.json \
        --region ${AWS_REGION:-us-west-2}
    
    rm prod-secrets.json
    echo "✅ Production secrets uploaded"
fi

# Upload staging secrets
if [[ -f ".env.staging" ]]; then
    echo "📤 Uploading staging secrets..."
    
    jq -n 'reduce inputs as $line ({}; 
        if ($line | test("^[^#].*=.*$")) then
            ($line | split("="; 2)) as [$key, $value] |
            .[$key] = $value
        else
            .
        end
    )' < .env.staging > staging-secrets.json
    
    aws secretsmanager create-secret \
        --name "raresift/staging/config" \
        --description "RareSift Staging Configuration" \
        --secret-string file://staging-secrets.json \
        --region ${AWS_REGION:-us-west-2} || \
    aws secretsmanager update-secret \
        --secret-id "raresift/staging/config" \
        --secret-string file://staging-secrets.json \
        --region ${AWS_REGION:-us-west-2}
    
    rm staging-secrets.json
    echo "✅ Staging secrets uploaded"
fi

echo "🎉 All secrets uploaded to AWS Secrets Manager!"
EOF

chmod +x upload-aws-secrets.sh

# Create Kubernetes secrets YAML
echo -e "${BLUE}☸️ Creating Kubernetes secrets configuration...${NC}"
cat > k8s-secrets.yaml << EOF
# RareSift Kubernetes Secrets
# Apply with: kubectl apply -f k8s-secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: raresift-secrets
  namespace: raresift
type: Opaque
stringData:
  POSTGRES_DB: ${POSTGRES_DB}
  POSTGRES_USER: ${POSTGRES_USER}
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  REDIS_PASSWORD: ${REDIS_PASSWORD}
  SECRET_KEY: ${SECRET_KEY}
  JWT_PRIVATE_KEY: ${JWT_PRIVATE_KEY}
  JWT_PUBLIC_KEY: ${JWT_PUBLIC_KEY}
  API_MASTER_KEY: ${API_MASTER_KEY}
  WEBHOOK_SECRET: ${WEBHOOK_SECRET}
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: raresift-config
  namespace: raresift
data:
  ENVIRONMENT: "production"
  LOG_LEVEL: "INFO"
  LOG_FORMAT: "json"
  RATE_LIMIT_ENABLED: "true"
  MAX_REQUESTS_PER_MINUTE: "60"
  MAX_REQUESTS_PER_HOUR: "1000"
  SECURITY_HEADERS_ENABLED: "true"
EOF

# Create .gitignore for secrets
cat > .gitignore << EOF
# Never commit these secret files
.env.secrets
.env.production
.env.staging
*.pem
*.key
*.crt
*.json
*.log
EOF

# Create README
cat > README.md << EOF
# RareSift Secrets Management

This directory contains generated secrets and configuration files for RareSift production deployment.

## ⚠️ SECURITY WARNING
**NEVER commit these files to version control!**

## Files Generated

### Secret Files (🔒 Keep Secure)
- \`.env.secrets\` - All generated secrets in one file
- \`.env.production\` - Production environment configuration
- \`.env.staging\` - Staging environment configuration
- \`jwt_private.pem\` - JWT signing private key
- \`jwt_public.pem\` - JWT verification public key

### Deployment Configurations
- \`vault-config.hcl\` - HashiCorp Vault configuration
- \`k8s-secrets.yaml\` - Kubernetes secrets manifest
- \`load-vault-secrets.sh\` - Script to load secrets into Vault
- \`upload-aws-secrets.sh\` - Script to upload to AWS Secrets Manager

## Usage

### Docker Compose
\`\`\`bash
# Copy to project root and rename
cp .env.production ../.env.production
cd .. && docker-compose -f docker-compose.prod.yml up -d
\`\`\`

### HashiCorp Vault
\`\`\`bash
# Start Vault server
vault server -config=vault-config.hcl

# Load secrets (in another terminal)
export VAULT_TOKEN="your-vault-token"
./load-vault-secrets.sh
\`\`\`

### AWS Secrets Manager
\`\`\`bash
# Configure AWS CLI first
aws configure

# Upload secrets
./upload-aws-secrets.sh
\`\`\`

### Kubernetes
\`\`\`bash
# Create namespace
kubectl create namespace raresift

# Apply secrets
kubectl apply -f k8s-secrets.yaml
\`\`\`

## Security Best Practices

1. **Rotate secrets regularly** (every 90 days minimum)
2. **Use different secrets for each environment**
3. **Store secrets in a proper secret management system**
4. **Never log or print secret values**
5. **Use least-privilege access for secret access**
6. **Monitor secret access and usage**

## Secret Rotation

To rotate secrets, run this script again:
\`\`\`bash
./generate-secrets.sh
\`\`\`

Then update your deployment with the new secrets.
EOF

# Summary
echo ""
echo -e "${GREEN}✅ Secrets generation completed successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Generated Files:${NC}"
echo "  🔒 .env.secrets         - All secrets in one file"
echo "  🌐 .env.production      - Production environment config"
echo "  🧪 .env.staging         - Staging environment config"
echo "  🔑 jwt_private.pem      - JWT signing key"
echo "  🔓 jwt_public.pem       - JWT verification key"
echo "  🏦 vault-config.hcl     - Vault server configuration"
echo "  ☸️  k8s-secrets.yaml    - Kubernetes secrets manifest"
echo "  📜 Upload scripts       - For Vault and AWS"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT SECURITY REMINDERS:${NC}"
echo "  1. 🚫 NEVER commit these files to version control"
echo "  2. 🔒 Store secrets in a secure location (Vault, AWS, etc.)"
echo "  3. 🔄 Rotate secrets every 90 days"
echo "  4. 👥 Limit access to secrets on need-to-know basis"
echo "  5. 📊 Monitor secret access and usage"
echo ""
echo -e "${GREEN}🚀 Next steps:${NC}"
echo "  1. Copy .env.production to your deployment environment"
echo "  2. Update domain names in the configuration"
echo "  3. Set up SSL certificates"
echo "  4. Deploy using docker-compose.prod.yml"
echo ""
echo -e "${BLUE}📍 Secrets location: $(pwd)${NC}"