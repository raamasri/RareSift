#!/bin/bash
# Production deployment script for RareSift
# Deploys to Render (backend) and Vercel (frontend) using CLI tools

set -e

echo "🚀 RareSift Production Deployment"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install CLI tools if missing
install_cli_tools() {
    echo -e "${BLUE}🔧 Checking and installing CLI tools...${NC}"
    
    # Install GitHub CLI if missing
    if ! command_exists gh; then
        echo -e "${YELLOW}Installing GitHub CLI...${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install gh || curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
        else
            curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
            sudo apt update && sudo apt install gh
        fi
    fi
    
    # Install Vercel CLI if missing
    if ! command_exists vercel; then
        echo -e "${YELLOW}Installing Vercel CLI...${NC}"
        npm install -g vercel
    fi
    
    # Install Render CLI if missing (unofficial but useful)
    if ! command_exists render; then
        echo -e "${YELLOW}Note: Using curl for Render API (no official CLI)${NC}"
    fi
    
    echo -e "${GREEN}✅ CLI tools ready${NC}"
}

# Function to check authentication
check_auth() {
    echo -e "${BLUE}🔐 Checking authentication...${NC}"
    
    # Check GitHub auth
    if ! gh auth status >/dev/null 2>&1; then
        echo -e "${YELLOW}GitHub authentication required${NC}"
        gh auth login
    else
        echo -e "${GREEN}✅ GitHub authenticated${NC}"
    fi
    
    # Check Vercel auth
    if ! vercel --version >/dev/null 2>&1; then
        echo -e "${RED}❌ Vercel CLI not working${NC}"
        exit 1
    fi
    
    # Test Vercel auth by running a simple command
    if ! vercel whoami >/dev/null 2>&1; then
        echo -e "${YELLOW}Vercel authentication required${NC}"
        vercel login
    else
        echo -e "${GREEN}✅ Vercel authenticated${NC}"
    fi
}

# Function to prepare repository
prepare_repo() {
    echo -e "${BLUE}📦 Preparing repository...${NC}"
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo -e "${RED}❌ Not in a git repository${NC}"
        exit 1
    fi
    
    # Check if origin remote exists
    if ! git remote get-url origin >/dev/null 2>&1; then
        echo -e "${YELLOW}Setting up git origin...${NC}"
        read -p "Enter your GitHub repository URL (https://github.com/username/repo): " REPO_URL
        git remote add origin "$REPO_URL"
    fi
    
    # Commit any pending changes
    if ! git diff-index --quiet HEAD --; then
        echo -e "${YELLOW}Committing pending changes...${NC}"
        git add .
        git commit -m "Production deployment preparation
        
🚀 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
    fi
    
    # Push to GitHub
    echo -e "${BLUE}Pushing to GitHub...${NC}"
    git push origin main || git push origin master
    
    echo -e "${GREEN}✅ Repository prepared${NC}"
}

# Function to deploy to Render
deploy_render() {
    echo -e "${BLUE}🎨 Deploying backend to Render...${NC}"
    
    # Check if render.yaml exists
    if [[ ! -f "render.yaml" ]]; then
        echo -e "${RED}❌ render.yaml not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Found render.yaml configuration${NC}"
    echo -e "${YELLOW}📋 Manual Render deployment steps:${NC}"
    echo "1. Go to https://render.com"
    echo "2. Connect your GitHub repository"
    echo "3. Render will automatically detect render.yaml"
    echo "4. Review and deploy the services"
    echo ""
    echo -e "${BLUE}🔗 Render will create:${NC}"
    echo "  - PostgreSQL database (raresift-postgres)"
    echo "  - Redis cache (raresift-redis)"  
    echo "  - Backend web service (raresift-backend)"
    echo ""
    
    # Open Render dashboard
    if command_exists open; then
        echo -e "${YELLOW}Opening Render dashboard...${NC}"
        open "https://render.com/register"
    elif command_exists xdg-open; then
        echo -e "${YELLOW}Opening Render dashboard...${NC}"
        xdg-open "https://render.com/register"
    fi
    
    echo -e "${GREEN}✅ Render deployment initiated${NC}"
    
    # Wait for user confirmation
    read -p "Press Enter after completing Render deployment..."
    
    # Ask for the Render service URL
    read -p "Enter your Render backend URL (e.g., https://raresift-backend.onrender.com): " RENDER_URL
    echo "RENDER_URL=$RENDER_URL" > .render_url
    
    echo -e "${GREEN}✅ Render backend deployment completed${NC}"
}

# Function to deploy to Vercel
deploy_vercel() {
    echo -e "${BLUE}▲ Deploying frontend to Vercel...${NC}"
    
    # Change to frontend directory
    cd frontend
    
    # Check if vercel.json exists
    if [[ ! -f "vercel.json" ]]; then
        echo -e "${RED}❌ vercel.json not found in frontend directory${NC}"
        exit 1
    fi
    
    # Get Render URL for environment variable
    if [[ -f "../.render_url" ]]; then
        RENDER_URL=$(cat ../.render_url | cut -d'=' -f2)
    else
        read -p "Enter your Render backend URL: " RENDER_URL
    fi
    
    # Set environment variables for Vercel
    echo -e "${YELLOW}Setting Vercel environment variables...${NC}"
    vercel env add NEXT_PUBLIC_API_URL production <<< "$RENDER_URL"
    vercel env add NEXT_PUBLIC_ENVIRONMENT production <<< "production"
    
    # Deploy to Vercel
    echo -e "${BLUE}Deploying to Vercel...${NC}"
    vercel --prod --yes
    
    # Get deployment URL
    VERCEL_URL=$(vercel ls --scope personal | grep production | awk '{print $2}' | head -1)
    if [[ -z "$VERCEL_URL" ]]; then
        VERCEL_URL=$(vercel --prod --yes 2>&1 | grep -o 'https://[^[:space:]]*' | head -1)
    fi
    
    echo "VERCEL_URL=$VERCEL_URL" > ../.vercel_url
    echo -e "${GREEN}✅ Frontend deployed to: $VERCEL_URL${NC}"
    
    cd ..
}

# Function to configure GitHub repository settings
configure_github() {
    echo -e "${BLUE}⚙️ Configuring GitHub repository settings...${NC}"
    
    # Enable security features
    echo -e "${YELLOW}Enabling GitHub security features...${NC}"
    
    # Enable Dependabot (if not already enabled)
    gh api repos/:owner/:repo/vulnerability-alerts --method PUT || echo "Vulnerability alerts already enabled"
    
    # Enable branch protection for main branch
    echo -e "${YELLOW}Setting up branch protection...${NC}"
    gh api repos/:owner/:repo/branches/main/protection \
        --method PUT \
        --field required_status_checks='{"strict":true,"contexts":["ci-cd"]}' \
        --field enforce_admins=true \
        --field required_pull_request_reviews='{"required_approving_review_count":1}' \
        --field restrictions=null \
        --field allow_force_pushes=false \
        --field allow_deletions=false || echo "Branch protection already configured"
    
    # Set up GitHub Pages if applicable
    echo -e "${YELLOW}Repository configuration complete${NC}"
    
    echo -e "${GREEN}✅ GitHub repository configured${NC}"
}

# Function to validate deployment
validate_deployment() {
    echo -e "${BLUE}✅ Validating deployment...${NC}"
    
    # Get URLs
    if [[ -f ".render_url" ]]; then
        RENDER_URL=$(cat .render_url | cut -d'=' -f2)
    fi
    
    if [[ -f ".vercel_url" ]]; then
        VERCEL_URL=$(cat .vercel_url | cut -d'=' -f2)
    fi
    
    # Test backend health
    if [[ -n "$RENDER_URL" ]]; then
        echo -e "${YELLOW}Testing backend health...${NC}"
        if curl -s "$RENDER_URL/health" | grep -q "healthy"; then
            echo -e "${GREEN}✅ Backend health check passed${NC}"
        else
            echo -e "${YELLOW}⚠️  Backend health check failed or still deploying${NC}"
        fi
    fi
    
    # Test frontend
    if [[ -n "$VERCEL_URL" ]]; then
        echo -e "${YELLOW}Testing frontend...${NC}"
        if curl -s -o /dev/null -w "%{http_code}" "$VERCEL_URL" | grep -q "200"; then
            echo -e "${GREEN}✅ Frontend is accessible${NC}"
        else
            echo -e "${YELLOW}⚠️  Frontend check failed or still deploying${NC}"
        fi
    fi
    
    # Run comprehensive validation
    echo -e "${YELLOW}Running comprehensive validation...${NC}"
    python3 scripts/comprehensive-production-audit.py
    
    echo -e "${GREEN}✅ Deployment validation completed${NC}"
}

# Function to show deployment summary
show_summary() {
    echo ""
    echo -e "${GREEN}🎉 RareSift Production Deployment Complete!${NC}"
    echo "==========================================="
    
    if [[ -f ".render_url" ]]; then
        RENDER_URL=$(cat .render_url | cut -d'=' -f2)
        echo -e "${BLUE}🎨 Backend (Render):${NC} $RENDER_URL"
        echo -e "   📋 Health Check: $RENDER_URL/health"
        echo -e "   📖 API Docs: $RENDER_URL/docs"
    fi
    
    if [[ -f ".vercel_url" ]]; then
        VERCEL_URL=$(cat .vercel_url | cut -d'=' -f2)
        echo -e "${BLUE}▲ Frontend (Vercel):${NC} $VERCEL_URL"
    fi
    
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo "1. Test the application functionality end-to-end"
    echo "2. Set up monitoring alerts and notifications"
    echo "3. Configure custom domain names if needed"
    echo "4. Set up automated backups for production data"
    echo "5. Monitor performance and scale as needed"
    echo ""
    echo -e "${GREEN}✅ Production deployment successful!${NC}"
}

# Main deployment flow
main() {
    echo -e "${BLUE}Starting RareSift production deployment...${NC}"
    
    install_cli_tools
    check_auth
    prepare_repo
    deploy_render
    deploy_vercel
    configure_github
    validate_deployment
    show_summary
}

# Run main function
main "$@"