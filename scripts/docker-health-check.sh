#!/bin/bash

# RareSift Docker Health Check and Resource Validation Script
# This script validates Docker configuration and resource limits

set -e

echo "🐳 RareSift Docker Health Check & Resource Validation"
echo "===================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.production.yml"
MONITORING_COMPOSE_FILE="docker-compose.monitoring.yml"

# Function to check if Docker is running
check_docker() {
    echo -e "${BLUE}🔧 Checking Docker installation...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        return 1
    fi
    
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker daemon is not running${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Docker is installed and running${NC}"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${YELLOW}⚠️  docker-compose not found, checking for 'docker compose'${NC}"
        if ! docker compose version &> /dev/null; then
            echo -e "${RED}❌ Docker Compose is not available${NC}"
            return 1
        else
            echo -e "${GREEN}✅ Docker Compose (plugin) is available${NC}"
        fi
    else
        echo -e "${GREEN}✅ Docker Compose is installed${NC}"
    fi
    
    return 0
}

# Function to validate compose files
validate_compose_files() {
    echo -e "${BLUE}📋 Validating Docker Compose files...${NC}"
    
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        echo -e "${RED}❌ Production compose file not found: $COMPOSE_FILE${NC}"
        return 1
    fi
    
    if [[ ! -f "$MONITORING_COMPOSE_FILE" ]]; then
        echo -e "${RED}❌ Monitoring compose file not found: $MONITORING_COMPOSE_FILE${NC}"
        return 1
    fi
    
    # Validate compose file syntax
    if docker-compose -f "$COMPOSE_FILE" config &> /dev/null; then
        echo -e "${GREEN}✅ Production compose file is valid${NC}"
    elif docker compose -f "$COMPOSE_FILE" config &> /dev/null; then
        echo -e "${GREEN}✅ Production compose file is valid${NC}"
    else
        echo -e "${RED}❌ Production compose file has syntax errors${NC}"
        return 1
    fi
    
    if docker-compose -f "$MONITORING_COMPOSE_FILE" config &> /dev/null; then
        echo -e "${GREEN}✅ Monitoring compose file is valid${NC}"
    elif docker compose -f "$MONITORING_COMPOSE_FILE" config &> /dev/null; then
        echo -e "${GREEN}✅ Monitoring compose file is valid${NC}"
    else
        echo -e "${RED}❌ Monitoring compose file has syntax errors${NC}"
        return 1
    fi
    
    return 0
}

# Function to check system resources
check_system_resources() {
    echo -e "${BLUE}💻 Checking system resources...${NC}"
    
    # Check available memory
    if command -v free &> /dev/null; then
        TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2/1024}')
        echo -e "${GREEN}📊 Total RAM: ${TOTAL_MEM}GB${NC}"
        
        if (( TOTAL_MEM < 8 )); then
            echo -e "${YELLOW}⚠️  Warning: Less than 8GB RAM available. Consider reducing resource limits.${NC}"
        fi
    fi
    
    # Check available disk space
    DISK_AVAIL=$(df -BG / | awk 'NR==2{print $4}' | sed 's/G//')
    echo -e "${GREEN}💾 Available disk space: ${DISK_AVAIL}GB${NC}"
    
    if (( DISK_AVAIL < 20 )); then
        echo -e "${RED}❌ Warning: Less than 20GB disk space available${NC}"
        return 1
    fi
    
    # Check CPU cores
    CPU_CORES=$(nproc)
    echo -e "${GREEN}⚡ CPU cores: ${CPU_CORES}${NC}"
    
    if (( CPU_CORES < 4 )); then
        echo -e "${YELLOW}⚠️  Warning: Less than 4 CPU cores. Consider reducing CPU limits.${NC}"
    fi
    
    return 0
}

# Function to create required directories
create_directories() {
    echo -e "${BLUE}📁 Creating required directories...${NC}"
    
    DIRECTORIES=(
        "/opt/raresift/data/postgres"
        "/opt/raresift/data/redis"
        "/opt/raresift/data/uploads"
        "./logs/postgres"
        "./logs/redis"
        "./logs/backend"
        "./logs/celery"
        "./logs/celery-beat"
        "./logs/nginx"
    )
    
    for dir in "${DIRECTORIES[@]}"; do
        if [[ "$dir" == /opt/* ]]; then
            # System directories - need sudo
            if sudo mkdir -p "$dir" 2>/dev/null; then
                echo -e "${GREEN}✅ Created: $dir${NC}"
                sudo chown -R $USER:$USER "$dir" 2>/dev/null || true
            else
                echo -e "${YELLOW}⚠️  Could not create $dir (may need manual creation)${NC}"
            fi
        else
            # Local directories
            if mkdir -p "$dir"; then
                echo -e "${GREEN}✅ Created: $dir${NC}"
            else
                echo -e "${RED}❌ Failed to create: $dir${NC}"
                return 1
            fi
        fi
    done
    
    return 0
}

# Function to check health check commands
check_health_commands() {
    echo -e "${BLUE}🏥 Checking health check commands...${NC}"
    
    HEALTH_COMMANDS=(
        "curl"
        "wget"
        "pg_isready"
        "redis-cli"
    )
    
    for cmd in "${HEALTH_COMMANDS[@]}"; do
        if command -v "$cmd" &> /dev/null; then
            echo -e "${GREEN}✅ $cmd is available${NC}"
        else
            echo -e "${YELLOW}⚠️  $cmd not found (will be available in containers)${NC}"
        fi
    done
    
    return 0
}

# Function to validate environment variables
check_environment_variables() {
    echo -e "${BLUE}🔧 Checking environment variables...${NC}"
    
    REQUIRED_VARS=(
        "POSTGRES_PASSWORD"
        "SECRET_KEY"
        "CORS_ORIGINS"
        "ALLOWED_HOSTS"
    )
    
    MISSING_VARS=()
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [[ -z "${!var}" ]]; then
            MISSING_VARS+=("$var")
        else
            echo -e "${GREEN}✅ $var is set${NC}"
        fi
    done
    
    if [[ ${#MISSING_VARS[@]} -gt 0 ]]; then
        echo -e "${YELLOW}⚠️  Missing required environment variables:${NC}"
        for var in "${MISSING_VARS[@]}"; do
            echo -e "${YELLOW}   - $var${NC}"
        done
        echo -e "${BLUE}💡 Run: source .env.production${NC}"
        return 1
    fi
    
    return 0
}

# Function to test container startup
test_container_startup() {
    echo -e "${BLUE}🚀 Testing container startup (dry run)...${NC}"
    
    # Test production compose
    if docker-compose -f "$COMPOSE_FILE" config --quiet; then
        echo -e "${GREEN}✅ Production compose configuration is valid${NC}"
    elif docker compose -f "$COMPOSE_FILE" config --quiet; then
        echo -e "${GREEN}✅ Production compose configuration is valid${NC}"
    else
        echo -e "${RED}❌ Production compose configuration has errors${NC}"
        return 1
    fi
    
    # Check if we can build the images
    echo -e "${BLUE}🔨 Checking Docker build capability...${NC}"
    
    if [[ -f "backend/Dockerfile.prod" ]]; then
        echo -e "${GREEN}✅ Backend production Dockerfile exists${NC}"
    else
        echo -e "${RED}❌ Backend production Dockerfile missing${NC}"
        return 1
    fi
    
    if [[ -f "frontend/Dockerfile.prod" ]]; then
        echo -e "${GREEN}✅ Frontend production Dockerfile exists${NC}"
    else
        echo -e "${RED}❌ Frontend production Dockerfile missing${NC}"
        return 1
    fi
    
    return 0
}

# Function to show resource usage summary
show_resource_summary() {
    echo -e "${BLUE}📊 Resource Allocation Summary${NC}"
    echo "================================="
    
    echo "Backend Service:"
    echo "  CPU: 1-4 cores"
    echo "  Memory: 1-4GB"
    echo "  Storage: Shared uploads volume"
    echo ""
    
    echo "PostgreSQL:"
    echo "  CPU: 0.5-2 cores"
    echo "  Memory: 512MB-2GB"
    echo "  Storage: Persistent volume"
    echo ""
    
    echo "Redis:"
    echo "  CPU: 0.25-1 core"
    echo "  Memory: 256MB-1GB"
    echo "  Storage: Persistent volume"
    echo ""
    
    echo "Celery Worker:"
    echo "  CPU: 0.5-2 cores"
    echo "  Memory: 512MB-3GB"
    echo "  Storage: Shared uploads volume"
    echo ""
    
    echo "Total Estimated Requirements:"
    echo "  CPU: 4-8 cores minimum"
    echo "  Memory: 8-16GB minimum"
    echo "  Storage: 50GB+ recommended"
}

# Main execution
main() {
    local success=true
    
    check_docker || success=false
    echo ""
    
    validate_compose_files || success=false
    echo ""
    
    check_system_resources || success=false
    echo ""
    
    create_directories || success=false
    echo ""
    
    check_health_commands || success=false
    echo ""
    
    check_environment_variables || success=false
    echo ""
    
    test_container_startup || success=false
    echo ""
    
    show_resource_summary
    echo ""
    
    if $success; then
        echo -e "${GREEN}🎉 All Docker health checks passed!${NC}"
        echo ""
        echo -e "${BLUE}🚀 Ready to deploy:${NC}"
        echo "  1. Load environment: source .env.production"
        echo "  2. Start services: docker-compose -f docker-compose.production.yml up -d"
        echo "  3. Start monitoring: docker-compose -f docker-compose.monitoring.yml up -d"
        echo "  4. Check health: curl http://localhost:8000/api/v1/monitoring/health"
        return 0
    else
        echo -e "${RED}❌ Some Docker health checks failed${NC}"
        echo "Please resolve the issues above before deploying"
        return 1
    fi
}

# Run main function
main "$@"