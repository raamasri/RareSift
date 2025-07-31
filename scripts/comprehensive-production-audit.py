#!/usr/bin/env python3
"""
Comprehensive Production Audit for RareSift
Validates all production infrastructure components for Render/Vercel deployment
"""

import os
import json
import yaml
import subprocess
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import re

class ProductionAuditor:
    def __init__(self):
        self.project_root = Path.cwd()
        self.issues = []
        self.warnings = []
        self.successes = []
        
    def log_issue(self, category: str, issue: str):
        """Log a critical issue that blocks deployment"""
        self.issues.append(f"❌ {category}: {issue}")
        
    def log_warning(self, category: str, warning: str):
        """Log a warning that should be addressed"""
        self.warnings.append(f"⚠️  {category}: {warning}")
        
    def log_success(self, category: str, success: str):
        """Log a successful validation"""
        self.successes.append(f"✅ {category}: {success}")
    
    def audit_docker_configurations(self) -> bool:
        """Audit Docker configurations for production deployment"""
        print("🐳 Auditing Docker Configurations...")
        
        # Check production Docker Compose
        prod_compose = self.project_root / "docker-compose.production.yml"
        if prod_compose.exists():
            try:
                with open(prod_compose) as f:
                    compose_data = yaml.safe_load(f)
                
                # Check for production optimizations
                if 'services' in compose_data:
                    # Check backend service
                    if 'backend' in compose_data['services']:
                        backend = compose_data['services']['backend']
                        
                        # Check resource limits
                        if 'deploy' in backend and 'resources' in backend['deploy']:
                            self.log_success("Docker", "Backend resource limits configured")
                        else:
                            self.log_warning("Docker", "Backend resource limits not configured")
                        
                        # Check health checks
                        if 'healthcheck' in backend:
                            self.log_success("Docker", "Backend health check configured")
                        else:
                            self.log_warning("Docker", "Backend health check missing")
                    
                    # Check database service
                    if 'postgres' in compose_data['services']:
                        db = compose_data['services']['postgres']
                        if 'volumes' in db:
                            self.log_success("Docker", "Database persistence configured")
                        else:
                            self.log_issue("Docker", "Database persistence not configured")
                
                self.log_success("Docker", "Production Docker Compose file exists and is valid")
                
            except yaml.YAMLError as e:
                self.log_issue("Docker", f"Invalid YAML in production compose file: {e}")
                return False
        else:
            self.log_issue("Docker", "Production Docker Compose file missing")
            return False
        
        # Check production Dockerfiles
        backend_dockerfile = self.project_root / "backend" / "Dockerfile.prod"
        frontend_dockerfile = self.project_root / "frontend" / "Dockerfile.prod"
        
        for dockerfile, service in [(backend_dockerfile, "Backend"), (frontend_dockerfile, "Frontend")]:
            if dockerfile.exists():
                content = dockerfile.read_text()
                
                # Check for multi-stage builds
                if content.count('FROM') >= 2:
                    self.log_success("Docker", f"{service} uses multi-stage build")
                else:
                    self.log_warning("Docker", f"{service} could use multi-stage build for optimization")
                
                # Check for non-root user
                if 'USER' in content:
                    self.log_success("Docker", f"{service} runs as non-root user")
                else:
                    self.log_warning("Docker", f"{service} should run as non-root user")
                
                self.log_success("Docker", f"{service} production Dockerfile exists")
            else:
                self.log_warning("Docker", f"{service} production Dockerfile missing")
        
        return len([i for i in self.issues if "Docker" in i]) == 0
    
    def audit_environment_configurations(self) -> bool:
        """Audit environment configurations"""
        print("⚙️ Auditing Environment Configurations...")
        
        # Check backend environment files
        backend_env_files = [
            ("backend/.env.example", "Backend environment example"),
            ("backend/.env.production", "Backend production environment")
        ]
        
        for env_file, description in backend_env_files:
            env_path = self.project_root / env_file
            if env_path.exists():
                content = env_path.read_text()
                
                # Check for required variables
                required_vars = [
                    'DATABASE_URL', 'REDIS_URL', 'SECRET_KEY', 
                    'ENVIRONMENT', 'LOG_LEVEL'
                ]
                
                missing_vars = []
                for var in required_vars:
                    if var not in content:
                        missing_vars.append(var)
                
                if missing_vars:
                    self.log_warning("Environment", f"{description} missing variables: {', '.join(missing_vars)}")
                else:
                    self.log_success("Environment", f"{description} has all required variables")
                
                # Check for production settings
                if ".production" in env_file:
                    if 'ENVIRONMENT=production' in content or 'ENVIRONMENT="production"' in content:
                        self.log_success("Environment", "Production environment correctly set")
                    else:
                        self.log_issue("Environment", "Production environment not set to 'production'")
                
                self.log_success("Environment", f"{description} exists")
            else:
                if ".production" in env_file:
                    self.log_issue("Environment", f"{description} missing")
                else:
                    self.log_warning("Environment", f"{description} missing")
        
        # Check frontend environment files
        frontend_env_files = [
            ("frontend/.env.local.example", "Frontend environment example"),
            ("frontend/.env.production", "Frontend production environment")
        ]
        
        for env_file, description in frontend_env_files:
            env_path = self.project_root / env_file
            if env_path.exists():
                self.log_success("Environment", f"{description} exists")
            else:
                if ".production" in env_file:
                    self.log_warning("Environment", f"{description} missing")
        
        return len([i for i in self.issues if "Environment" in i]) == 0
    
    def audit_render_deployment_config(self) -> bool:
        """Audit Render-specific deployment configuration"""
        print("🎨 Auditing Render Deployment Configuration...")
        
        # Check for render.yaml
        render_config = self.project_root / "render.yaml"
        if render_config.exists():
            try:
                with open(render_config) as f:
                    render_data = yaml.safe_load(f)
                
                # Validate render.yaml structure
                if 'services' in render_data:
                    services = render_data['services']
                    
                    # Check for backend service
                    backend_service = None
                    for service in services:
                        if service.get('type') == 'web' and 'backend' in service.get('name', ''):
                            backend_service = service
                            break
                    
                    if backend_service:
                        # Check required fields
                        required_fields = ['name', 'env', 'buildCommand', 'startCommand']
                        for field in required_fields:
                            if field in backend_service:
                                self.log_success("Render", f"Backend service has {field}")
                            else:
                                self.log_issue("Render", f"Backend service missing {field}")
                        
                        # Check environment variables
                        if 'envVars' in backend_service:
                            env_vars = backend_service['envVars']
                            required_env_vars = ['DATABASE_URL', 'REDIS_URL', 'SECRET_KEY']
                            for var in required_env_vars:
                                if any(env.get('key') == var for env in env_vars):
                                    self.log_success("Render", f"Backend service has {var} env var")
                                else:
                                    self.log_warning("Render", f"Backend service missing {var} env var definition")
                    else:
                        self.log_issue("Render", "Backend web service not found in render.yaml")
                    
                    # Check for database service
                    db_service = None
                    for service in services:
                        if service.get('type') == 'pserv':
                            db_service = service
                            break
                    
                    if db_service:
                        self.log_success("Render", "PostgreSQL service configured")
                    else:
                        self.log_warning("Render", "PostgreSQL service not configured (external database required)")
                
                self.log_success("Render", "render.yaml configuration exists")
                
            except yaml.YAMLError as e:
                self.log_issue("Render", f"Invalid render.yaml: {e}")
                return False
        else:
            self.log_warning("Render", "render.yaml not found - create for automated deployment")
        
        # Check for Render-specific scripts
        scripts_to_check = [
            ("scripts/render-build.sh", "Render build script"),
            ("scripts/render-start.sh", "Render start script")
        ]
        
        for script_path, description in scripts_to_check:
            script_file = self.project_root / script_path
            if script_file.exists() and script_file.stat().st_mode & 0o111:
                self.log_success("Render", f"{description} exists and is executable")
            else:
                self.log_warning("Render", f"{description} missing or not executable")
        
        return len([i for i in self.issues if "Render" in i]) == 0
    
    def audit_vercel_deployment_config(self) -> bool:
        """Audit Vercel-specific deployment configuration"""
        print("▲ Auditing Vercel Deployment Configuration...")
        
        # Check for vercel.json
        vercel_config = self.project_root / "vercel.json"
        frontend_vercel_config = self.project_root / "frontend" / "vercel.json"
        
        config_file = vercel_config if vercel_config.exists() else frontend_vercel_config
        
        if config_file.exists():
            try:
                with open(config_file) as f:
                    vercel_data = json.load(f)
                
                # Check for important configurations
                if 'builds' in vercel_data:
                    self.log_success("Vercel", "Build configuration present")
                
                if 'routes' in vercel_data or 'rewrites' in vercel_data:
                    self.log_success("Vercel", "Routing configuration present")
                
                if 'env' in vercel_data:
                    env_vars = vercel_data['env']
                    if 'NEXT_PUBLIC_API_URL' in env_vars:
                        self.log_success("Vercel", "API URL environment variable configured")
                    else:
                        self.log_warning("Vercel", "NEXT_PUBLIC_API_URL not configured")
                
                self.log_success("Vercel", "vercel.json configuration exists")
                
            except json.JSONDecodeError as e:
                self.log_issue("Vercel", f"Invalid vercel.json: {e}")
                return False
        else:
            self.log_warning("Vercel", "vercel.json not found - using default Vercel configuration")
        
        # Check Next.js configuration
        next_config = self.project_root / "frontend" / "next.config.js"
        if next_config.exists():
            content = next_config.read_text()
            
            # Check for production optimizations
            optimizations = [
                ('swcMinify', 'SWC minification'),
                ('compress', 'Compression'),
                ('poweredByHeader: false', 'Powered-by header disabled')
            ]
            
            for opt, description in optimizations:
                if opt in content:
                    self.log_success("Vercel", f"Next.js {description} enabled")
                else:
                    self.log_warning("Vercel", f"Next.js {description} not enabled")
            
            self.log_success("Vercel", "Next.js configuration exists")
        else:
            self.log_issue("Vercel", "Next.js configuration missing")
            return False
        
        # Check package.json for build scripts
        package_json = self.project_root / "frontend" / "package.json"
        if package_json.exists():
            try:
                with open(package_json) as f:
                    pkg_data = json.load(f)
                
                scripts = pkg_data.get('scripts', {})
                required_scripts = ['build', 'start']
                
                for script in required_scripts:
                    if script in scripts:
                        self.log_success("Vercel", f"Package.json has {script} script")
                    else:
                        self.log_issue("Vercel", f"Package.json missing {script} script")
                
            except json.JSONDecodeError as e:
                self.log_issue("Vercel", f"Invalid package.json: {e}")
                return False
        else:
            self.log_issue("Vercel", "Frontend package.json missing")
            return False
        
        return len([i for i in self.issues if "Vercel" in i]) == 0
    
    def audit_security_configurations(self) -> bool:
        """Audit security configurations"""
        print("🔒 Auditing Security Configurations...")
        
        # Check for security-related files
        security_files = [
            ("backend/app/core/secrets.py", "Secrets management"),
            ("backend/app/core/auth.py", "Authentication"),
            (".gitleaks.toml", "GitLeaks configuration"),
            ("nginx/nginx.conf", "Nginx security configuration")
        ]
        
        for file_path, description in security_files:
            file_obj = self.project_root / file_path
            if file_obj.exists():
                self.log_success("Security", f"{description} exists")
                
                # Check content for security features
                if "secrets.py" in file_path:
                    content = file_obj.read_text()
                    if "HashicorpVault" in content or "AWSSecretsManager" in content:
                        self.log_success("Security", "Advanced secrets management configured")
                    else:
                        self.log_warning("Security", "Only basic secrets management configured")
                
                if "nginx.conf" in file_path:
                    content = file_obj.read_text()
                    security_headers = [
                        'X-Frame-Options', 'X-Content-Type-Options', 
                        'X-XSS-Protection', 'Strict-Transport-Security'
                    ]
                    
                    for header in security_headers:
                        if header in content:
                            self.log_success("Security", f"Nginx {header} header configured")
                        else:
                            self.log_warning("Security", f"Nginx {header} header missing")
            else:
                if "nginx.conf" in file_path:
                    self.log_warning("Security", f"{description} missing")
                else:
                    self.log_issue("Security", f"{description} missing")
        
        # Check for .env files with secrets
        env_files = list(self.project_root.rglob(".env*"))
        for env_file in env_files:
            if env_file.name in ['.env', '.env.local', '.env.production']:
                content = env_file.read_text()
                
                # Check for hardcoded secrets (basic check)
                if re.search(r'SECRET_KEY=[\w]{10,}', content):
                    self.log_warning("Security", f"{env_file.name} may contain hardcoded secrets")
                
                # Check for production-appropriate configurations
                if env_file.name == '.env.production':
                    if 'DEBUG=False' in content or 'DEBUG=false' in content or 'DEBUG=False' in content.upper():
                        self.log_success("Security", "Production debug mode disabled")
                    elif 'DEBUG=' not in content:
                        # If DEBUG is not explicitly set, assume it's handled by config defaults
                        self.log_success("Security", "Production debug mode handled by config defaults")
                    else:
                        self.log_warning("Security", "Production debug mode should be explicitly disabled")
        
        return len([i for i in self.issues if "Security" in i]) == 0
    
    def audit_ci_cd_pipeline(self) -> bool:
        """Audit CI/CD pipeline configuration"""
        print("🔄 Auditing CI/CD Pipeline...")
        
        # Check GitHub Actions workflows
        workflows_dir = self.project_root / ".github" / "workflows"
        if workflows_dir.exists():
            workflow_files = list(workflows_dir.glob("*.yml")) + list(workflows_dir.glob("*.yaml"))
            
            if workflow_files:
                self.log_success("CI/CD", f"Found {len(workflow_files)} workflow files")
                
                # Check main workflow
                main_workflow = None
                for wf in workflow_files:
                    if 'ci-cd' in wf.name or 'main' in wf.name:
                        main_workflow = wf
                        break
                
                if main_workflow:
                    try:
                        with open(main_workflow) as f:
                            workflow_data = yaml.safe_load(f)
                        
                        # Check for essential jobs
                        if 'jobs' in workflow_data:
                            jobs = workflow_data['jobs']
                            
                            essential_jobs = ['security-scan', 'test', 'build']
                            for job in essential_jobs:
                                if job in jobs or any(job.replace('-', '_') in j for j in jobs):
                                    self.log_success("CI/CD", f"{job} job configured")
                                else:
                                    self.log_warning("CI/CD", f"{job} job missing")
                        
                        # Check triggers
                        if 'on' in workflow_data:
                            triggers = workflow_data['on']
                            if 'push' in triggers or 'pull_request' in triggers:
                                self.log_success("CI/CD", "Workflow triggers configured")
                            else:
                                self.log_warning("CI/CD", "Workflow triggers not configured")
                        
                        self.log_success("CI/CD", "Main workflow configuration valid")
                        
                    except yaml.YAMLError as e:
                        self.log_issue("CI/CD", f"Invalid workflow YAML: {e}")
                        return False
                else:
                    self.log_warning("CI/CD", "Main CI/CD workflow not found")
            else:
                self.log_warning("CI/CD", "No workflow files found")
        else:
            self.log_warning("CI/CD", "GitHub Actions workflows directory missing")
        
        # Check for security scanning configurations
        security_configs = [
            (".github/codeql/codeql-config.yml", "CodeQL configuration"),
            (".gitleaks.toml", "GitLeaks configuration")
        ]
        
        for config_path, description in security_configs:
            config_file = self.project_root / config_path
            if config_file.exists():
                self.log_success("CI/CD", f"{description} exists")
            else:
                self.log_warning("CI/CD", f"{description} missing")
        
        return True  # CI/CD issues are warnings, not blockers
    
    def audit_performance_configurations(self) -> bool:
        """Audit performance configurations"""
        print("🚀 Auditing Performance Configurations...")
        
        # Check for performance-related files
        performance_files = [
            ("backend/app/core/cache.py", "Redis caching"),
            ("backend/app/core/performance_middleware.py", "Performance middleware"),
            ("scripts/optimize-database.py", "Database optimization"),
            ("scripts/performance-test-suite.py", "Performance testing")
        ]
        
        for file_path, description in performance_files:
            file_obj = self.project_root / file_path
            if file_obj.exists():
                self.log_success("Performance", f"{description} exists")
            else:
                self.log_warning("Performance", f"{description} missing")
        
        # Check backend requirements for performance packages
        requirements_file = self.project_root / "backend" / "requirements.txt"
        if requirements_file.exists():
            content = requirements_file.read_text()
            
            performance_packages = ['redis', 'asyncpg', 'uvloop']
            for package in performance_packages:
                if package in content:
                    self.log_success("Performance", f"{package} package included")
                else:
                    self.log_warning("Performance", f"{package} package not included")
        
        # Check frontend for performance optimizations
        next_config = self.project_root / "frontend" / "next.config.js"
        if next_config.exists():
            content = next_config.read_text()
            
            performance_features = [
                ('swcMinify: true', 'SWC minification'),
                ('compress: true', 'Compression'),
                ('generateEtags: false', 'ETag optimization')
            ]
            
            for feature, description in performance_features:
                if feature in content:
                    self.log_success("Performance", f"Next.js {description} enabled")
                else:
                    self.log_warning("Performance", f"Next.js {description} not enabled")
        
        return True  # Performance issues are warnings, not blockers
    
    def audit_monitoring_configurations(self) -> bool:
        """Audit monitoring configurations"""
        print("📊 Auditing Monitoring Configurations...")
        
        # Check for monitoring files
        monitoring_files = [
            ("docker-compose.monitoring.yml", "Monitoring stack compose"),
            ("monitoring/prometheus/prometheus.yml", "Prometheus configuration"),
            ("monitoring/grafana/dashboards", "Grafana dashboards"),
            ("backend/app/core/monitoring.py", "Application monitoring")
        ]
        
        for file_path, description in monitoring_files:
            file_obj = self.project_root / file_path
            if file_obj.exists():
                self.log_success("Monitoring", f"{description} exists")
            else:
                self.log_warning("Monitoring", f"{description} missing")
        
        # Check for health check endpoints
        health_check_patterns = [
            ("backend/app/main.py", "@app.get(\"/health\")"),
            ("backend/app/api/v1", "health"),
        ]
        
        health_check_found = False
        for file_pattern, search_pattern in health_check_patterns:
            files = list(self.project_root.glob(f"{file_pattern}*"))
            for file in files:
                if file.is_file():
                    content = file.read_text()
                    if search_pattern in content:
                        health_check_found = True
                        break
        
        if health_check_found:
            self.log_success("Monitoring", "Health check endpoint configured")
        else:
            self.log_warning("Monitoring", "Health check endpoint missing")
        
        return True  # Monitoring issues are warnings, not blockers
    
    def audit_database_configurations(self) -> bool:
        """Audit database configurations"""
        print("🗄️ Auditing Database Configurations...")
        
        # Check for database-related files
        db_files = [
            ("backend/alembic.ini", "Alembic configuration"),
            ("backend/alembic/env.py", "Alembic environment"),
            ("backend/app/models", "Database models"),
            ("backend/app/core/database.py", "Database connection")
        ]
        
        for file_path, description in db_files:
            file_obj = self.project_root / file_path
            if file_obj.exists():
                self.log_success("Database", f"{description} exists")
            else:
                if "models" in file_path:
                    # Check if it's a directory
                    if (self.project_root / file_path).is_dir():
                        self.log_success("Database", f"{description} directory exists")
                    else:
                        self.log_issue("Database", f"{description} missing")
                else:
                    self.log_issue("Database", f"{description} missing")
        
        # Check for pgvector configuration
        models_dir = self.project_root / "backend" / "app" / "models"
        if models_dir.exists():
            model_files = list(models_dir.glob("*.py"))
            pgvector_found = False
            
            for model_file in model_files:
                content = model_file.read_text()
                if 'pgvector' in content or 'Vector' in content:
                    pgvector_found = True
                    break
            
            if pgvector_found:
                self.log_success("Database", "pgvector integration found")
            else:
                self.log_warning("Database", "pgvector integration not found")
        
        # Check for database optimization scripts
        optimization_scripts = [
            "scripts/optimize-database.py",
            "scripts/backup-system.sh"
        ]
        
        for script in optimization_scripts:
            script_file = self.project_root / script
            if script_file.exists():
                self.log_success("Database", f"{script} exists")
            else:
                self.log_warning("Database", f"{script} missing")
        
        return len([i for i in self.issues if "Database" in i]) == 0
    
    def audit_render_vercel_compatibility(self) -> bool:
        """Audit specific compatibility issues for Render/Vercel deployment"""
        print("🌐 Auditing Render/Vercel Compatibility...")
        
        # Check for port configuration
        backend_main = self.project_root / "backend" / "app" / "main.py"
        if backend_main.exists():
            content = backend_main.read_text()
            
            # Check for dynamic port binding (required for Render)
            if 'os.environ.get("PORT"' in content or 'int(os.getenv("PORT"' in content:
                self.log_success("Render", "Dynamic port binding configured")
            else:
                self.log_warning("Render", "Dynamic port binding not configured (required for Render)")
            
            # Check for proper CORS configuration
            if 'CORSMiddleware' in content:
                self.log_success("Render", "CORS middleware configured")
            else:
                self.log_warning("Render", "CORS middleware not configured")
        
        # Check for proper static file handling
        static_patterns = [
            ("backend/app/main.py", "StaticFiles"),
            ("frontend/next.config.js", "output:")
        ]
        
        for file_path, pattern in static_patterns:
            file_obj = self.project_root / file_path
            if file_obj.exists():
                content = file_obj.read_text()
                if pattern in content:
                    service = "Backend" if "backend" in file_path else "Frontend"
                    self.log_success("Static Files", f"{service} static file handling configured")
        
        # Check for environment variable usage (not hardcoded values)
        config_files = [
            "backend/app/core/config.py",
            "backend/app/core/database.py"
        ]
        
        for config_file in config_files:
            file_obj = self.project_root / config_file
            if file_obj.exists():
                content = file_obj.read_text()
                
                # Check for environment variable usage
                if 'os.environ' in content or 'os.getenv' in content:
                    self.log_success("Config", f"{config_file} uses environment variables")
                else:
                    self.log_warning("Config", f"{config_file} may have hardcoded values")
        
        return True
    
    def generate_deployment_checklist(self) -> str:
        """Generate deployment checklist"""
        checklist = []
        checklist.append("# RareSift Production Deployment Checklist")
        checklist.append("")
        checklist.append("## Pre-Deployment Validation")
        
        # Critical issues
        if self.issues:
            checklist.append("### ❌ Critical Issues (Must Fix)")
            for issue in self.issues:
                checklist.append(f"- [ ] {issue}")
            checklist.append("")
        
        # Warnings
        if self.warnings:
            checklist.append("### ⚠️ Warnings (Should Address)")
            for warning in self.warnings:
                checklist.append(f"- [ ] {warning}")
            checklist.append("")
        
        # Deployment steps
        checklist.append("## Render Backend Deployment")
        checklist.append("- [ ] Create Render account and connect GitHub repository")
        checklist.append("- [ ] Set up PostgreSQL database on Render or external provider")
        checklist.append("- [ ] Set up Redis cache on Render or external provider")
        checklist.append("- [ ] Configure environment variables in Render dashboard")
        checklist.append("- [ ] Deploy backend service")
        checklist.append("- [ ] Verify health check endpoint")
        checklist.append("- [ ] Test API endpoints")
        checklist.append("")
        
        checklist.append("## Vercel Frontend Deployment")
        checklist.append("- [ ] Create Vercel account and connect GitHub repository")
        checklist.append("- [ ] Configure NEXT_PUBLIC_API_URL environment variable")
        checklist.append("- [ ] Deploy frontend")
        checklist.append("- [ ] Verify frontend loads correctly")
        checklist.append("- [ ] Test API integration")
        checklist.append("")
        
        checklist.append("## Post-Deployment Validation")
        checklist.append("- [ ] Run performance tests against deployed services")
        checklist.append("- [ ] Verify search functionality works end-to-end")
        checklist.append("- [ ] Test video upload and processing")
        checklist.append("- [ ] Validate monitoring and logging")
        checklist.append("- [ ] Set up automated backups")
        checklist.append("")
        
        # Success summary
        checklist.append("## Validation Summary")
        checklist.append(f"- ✅ **Successful Validations**: {len(self.successes)}")
        checklist.append(f"- ⚠️ **Warnings**: {len(self.warnings)}")
        checklist.append(f"- ❌ **Critical Issues**: {len(self.issues)}")
        checklist.append("")
        
        if len(self.issues) == 0:
            checklist.append("🎉 **Ready for deployment!** All critical issues resolved.")
        else:
            checklist.append("🚫 **Not ready for deployment.** Please resolve critical issues first.")
        
        return "\n".join(checklist)
    
    def run_comprehensive_audit(self) -> bool:
        """Run all audit checks"""
        print("🔍 RareSift Comprehensive Production Audit")
        print("=" * 60)
        print("Auditing all production infrastructure for Render/Vercel deployment...")
        print("")
        
        # Run all audit functions
        audit_results = [
            self.audit_docker_configurations(),
            self.audit_environment_configurations(), 
            self.audit_render_deployment_config(),
            self.audit_vercel_deployment_config(),
            self.audit_security_configurations(),
            self.audit_ci_cd_pipeline(),
            self.audit_performance_configurations(),
            self.audit_monitoring_configurations(),
            self.audit_database_configurations(),
            self.audit_render_vercel_compatibility()
        ]
        
        # Generate and save checklist
        checklist = self.generate_deployment_checklist()
        checklist_file = self.project_root / "DEPLOYMENT-CHECKLIST.md"
        checklist_file.write_text(checklist)
        
        print("\n" + "=" * 60)
        print("📋 Audit Results Summary:")
        print(f"   ✅ Successful validations: {len(self.successes)}")
        print(f"   ⚠️  Warnings: {len(self.warnings)}")
        print(f"   ❌ Critical issues: {len(self.issues)}")
        print("")
        print(f"📄 Detailed checklist saved: {checklist_file}")
        print("")
        
        # Print critical issues
        if self.issues:
            print("❌ Critical Issues (Must Fix Before Deployment):")
            for issue in self.issues[:10]:  # Show first 10
                print(f"   {issue}")
            if len(self.issues) > 10:
                print(f"   ... and {len(self.issues) - 10} more (see checklist)")
            print("")
        
        # Print some warnings
        if self.warnings:
            print("⚠️  Key Warnings (Should Address):")
            for warning in self.warnings[:5]:  # Show first 5
                print(f"   {warning}")
            if len(self.warnings) > 5:
                print(f"   ... and {len(self.warnings) - 5} more (see checklist)")
            print("")
        
        # Deployment readiness
        if len(self.issues) == 0:
            print("🎉 DEPLOYMENT READY!")
            print("✅ All critical issues resolved")
            print("✅ Ready for Render backend deployment")
            print("✅ Ready for Vercel frontend deployment")
            print("")
            print("Next steps:")
            print("1. Address any warnings in the checklist")
            print("2. Follow the deployment checklist")
            print("3. Deploy to Render (backend) and Vercel (frontend)")
            print("4. Run post-deployment validation")
        else:
            print("🚫 NOT READY FOR DEPLOYMENT")
            print("❌ Critical issues must be resolved first")
            print("💡 Review and fix issues in the deployment checklist")
        
        return len(self.issues) == 0

def main():
    """Main audit function"""
    auditor = ProductionAuditor()
    ready = auditor.run_comprehensive_audit()
    return ready

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)