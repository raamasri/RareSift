#!/bin/bash

# RareSift Backup and Disaster Recovery System
# Comprehensive backup solution for database, files, and configurations

set -e

echo "💾 RareSift Backup & Disaster Recovery System"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/opt/raresift/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
S3_BUCKET="${S3_BUCKET:-raresift-backups}"
AWS_REGION="${AWS_REGION:-us-west-2}"
COMPRESS_BACKUPS="${COMPRESS_BACKUPS:-true}"
ENCRYPT_BACKUPS="${ENCRYPT_BACKUPS:-true}"
BACKUP_PASSWORD="${BACKUP_PASSWORD}"

# Database configuration
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-raresift}"
DB_USER="${DB_USER:-raresift}"
DB_PASSWORD="${DB_PASSWORD}"

# Directories to backup
DATA_DIRS=(
    "/opt/raresift/data/uploads"
    "/opt/raresift/data/postgres"
    "/opt/raresift/data/redis"
)

CONFIG_DIRS=(
    "./nginx"
    "./monitoring"
    "./secrets"
    "."
)

# Function to create backup directory
create_backup_dir() {
    local backup_date=$(date +%Y-%m-%d_%H-%M-%S)
    local backup_path="$BACKUP_DIR/$backup_date"
    
    echo -e "${BLUE}📁 Creating backup directory: $backup_path${NC}"
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        sudo mkdir -p "$BACKUP_DIR"
        sudo chown $USER:$USER "$BACKUP_DIR"
    fi
    
    mkdir -p "$backup_path"
    echo "$backup_path"
}

# Function to backup PostgreSQL database
backup_database() {
    local backup_path="$1"
    local db_backup_file="$backup_path/database.sql"
    
    echo -e "${YELLOW}🗄️ Backing up PostgreSQL database...${NC}"
    
    if [[ -z "$DB_PASSWORD" ]]; then
        echo -e "${RED}❌ DB_PASSWORD not set${NC}"
        return 1
    fi
    
    # Set PGPASSWORD for pg_dump
    export PGPASSWORD="$DB_PASSWORD"
    
    # Create database backup
    if docker-compose -f docker-compose.production.yml exec -T postgres pg_dump \
        -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --clean --if-exists --create > "$db_backup_file"; then
        
        echo -e "${GREEN}✅ Database backup completed: $(du -sh "$db_backup_file" | cut -f1)${NC}"
        
        # Create schema-only backup for quick recovery testing
        docker-compose -f docker-compose.production.yml exec -T postgres pg_dump \
            -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
            --schema-only > "$backup_path/schema.sql"
        
        echo -e "${GREEN}✅ Schema backup completed${NC}"
        
    else
        echo -e "${RED}❌ Database backup failed${NC}"
        unset PGPASSWORD
        return 1
    fi
    
    unset PGPASSWORD
    return 0
}

# Function to backup Redis data
backup_redis() {
    local backup_path="$1"
    local redis_backup_file="$backup_path/redis.rdb"
    
    echo -e "${YELLOW}📊 Backing up Redis data...${NC}"
    
    # Trigger Redis BGSAVE
    if docker-compose -f docker-compose.production.yml exec -T redis redis-cli BGSAVE; then
        # Wait for background save to complete
        sleep 5
        
        # Copy the RDB file
        if docker cp raresift-redis:/data/dump.rdb "$redis_backup_file"; then
            echo -e "${GREEN}✅ Redis backup completed: $(du -sh "$redis_backup_file" | cut -f1)${NC}"
        else
            echo -e "${YELLOW}⚠️  Redis backup file copy failed${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Redis BGSAVE failed${NC}"
    fi
}

# Function to backup file uploads
backup_uploads() {
    local backup_path="$1"
    local uploads_backup="$backup_path/uploads"
    
    echo -e "${YELLOW}📁 Backing up uploaded files...${NC}"
    
    if [[ -d "/opt/raresift/data/uploads" ]]; then
        mkdir -p "$uploads_backup"
        
        # Copy uploads with rsync for efficiency
        if rsync -av --progress "/opt/raresift/data/uploads/" "$uploads_backup/"; then
            local backup_size=$(du -sh "$uploads_backup" | cut -f1)
            echo -e "${GREEN}✅ Uploads backup completed: $backup_size${NC}"
        else
            echo -e "${RED}❌ Uploads backup failed${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  Uploads directory not found${NC}"
    fi
}

# Function to backup configuration files
backup_config() {
    local backup_path="$1"
    local config_backup="$backup_path/config"
    
    echo -e "${YELLOW}⚙️ Backing up configuration files...${NC}"
    
    mkdir -p "$config_backup"
    
    # Backup specific configuration directories
    for config_dir in "${CONFIG_DIRS[@]}"; do
        if [[ -d "$config_dir" ]]; then
            local dir_name=$(basename "$config_dir")
            if [[ "$dir_name" == "." ]]; then
                # Backup root config files
                cp -r docker-compose*.yml "$config_backup/" 2>/dev/null || true
                cp -r *.md "$config_backup/" 2>/dev/null || true
                cp -r scripts "$config_backup/" 2>/dev/null || true
            else
                cp -r "$config_dir" "$config_backup/" 2>/dev/null || true
            fi
        fi
    done
    
    echo -e "${GREEN}✅ Configuration backup completed${NC}"
}

# Function to create application state backup
backup_application_state() {
    local backup_path="$1"
    local state_file="$backup_path/application_state.json"
    
    echo -e "${YELLOW}📊 Creating application state snapshot...${NC}"
    
    # Collect system information
    cat > "$state_file" << EOF
{
    "backup_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "hostname": "$(hostname)",
    "system_info": {
        "os": "$(uname -s)",
        "kernel": "$(uname -r)",
        "architecture": "$(uname -m)"
    },
    "docker_info": {
        "version": "$(docker --version 2>/dev/null || echo 'not available')",
        "compose_version": "$(docker-compose --version 2>/dev/null || echo 'not available')"
    },
    "services_status": [
EOF

    # Check service status
    if docker-compose -f docker-compose.production.yml ps --format json 2>/dev/null; then
        docker-compose -f docker-compose.production.yml ps --format json >> "$state_file"
    fi
    
    cat >> "$state_file" << EOF
    ],
    "environment_variables": {
        "ENVIRONMENT": "$ENVIRONMENT",
        "LOG_LEVEL": "$LOG_LEVEL"
    }
}
EOF

    echo -e "${GREEN}✅ Application state snapshot created${NC}"
}

# Function to compress backup
compress_backup() {
    local backup_path="$1"
    local compressed_file="$backup_path.tar.gz"
    
    if [[ "$COMPRESS_BACKUPS" == "true" ]]; then
        echo -e "${YELLOW}🗜️ Compressing backup...${NC}"
        
        local backup_dir=$(dirname "$backup_path")
        local backup_name=$(basename "$backup_path")
        
        if tar -czf "$compressed_file" -C "$backup_dir" "$backup_name"; then
            local original_size=$(du -sh "$backup_path" | cut -f1)
            local compressed_size=$(du -sh "$compressed_file" | cut -f1)
            
            echo -e "${GREEN}✅ Backup compressed: $original_size → $compressed_size${NC}"
            
            # Remove uncompressed directory
            rm -rf "$backup_path"
            echo "$compressed_file"
        else
            echo -e "${RED}❌ Backup compression failed${NC}"
            echo "$backup_path"
        fi
    else
        echo "$backup_path"
    fi
}

# Function to encrypt backup
encrypt_backup() {
    local backup_file="$1"
    local encrypted_file="$backup_file.gpg"
    
    if [[ "$ENCRYPT_BACKUPS" == "true" ]] && [[ -n "$BACKUP_PASSWORD" ]]; then
        echo -e "${YELLOW}🔐 Encrypting backup...${NC}"
        
        if gpg --batch --yes --passphrase "$BACKUP_PASSWORD" --cipher-algo AES256 \
            --symmetric --output "$encrypted_file" "$backup_file"; then
            
            echo -e "${GREEN}✅ Backup encrypted${NC}"
            rm -f "$backup_file"
            echo "$encrypted_file"
        else
            echo -e "${RED}❌ Backup encryption failed${NC}"
            echo "$backup_file"
        fi
    else
        echo "$backup_file"
    fi
}

# Function to upload to S3
upload_to_s3() {
    local backup_file="$1"
    
    if [[ -n "$S3_BUCKET" ]] && command -v aws &> /dev/null; then
        echo -e "${YELLOW}☁️ Uploading backup to S3...${NC}"
        
        local s3_key="backups/$(basename "$backup_file")"
        
        if aws s3 cp "$backup_file" "s3://$S3_BUCKET/$s3_key" --region "$AWS_REGION"; then
            echo -e "${GREEN}✅ Backup uploaded to S3: s3://$S3_BUCKET/$s3_key${NC}"
        else
            echo -e "${RED}❌ S3 upload failed${NC}"
        fi
    else
        echo -e "${BLUE}ℹ️  S3 upload skipped (not configured)${NC}"
    fi
}

# Function to clean old backups
cleanup_old_backups() {
    echo -e "${YELLOW}🧹 Cleaning up old backups (older than $RETENTION_DAYS days)...${NC}"
    
    if [[ -d "$BACKUP_DIR" ]]; then
        local deleted_count=0
        
        # Find and delete old backups
        while IFS= read -r -d '' backup; do
            if [[ -f "$backup" ]] || [[ -d "$backup" ]]; then
                rm -rf "$backup"
                ((deleted_count++))
            fi
        done < <(find "$BACKUP_DIR" -maxdepth 1 -type d -mtime +$RETENTION_DAYS -print0 2>/dev/null)
        
        # Also clean compressed/encrypted files
        while IFS= read -r -d '' backup_file; do
            if [[ -f "$backup_file" ]]; then
                rm -f "$backup_file"
                ((deleted_count++))
            fi
        done < <(find "$BACKUP_DIR" -maxdepth 1 \( -name "*.tar.gz" -o -name "*.gpg" \) -mtime +$RETENTION_DAYS -print0 2>/dev/null)
        
        if [[ $deleted_count -gt 0 ]]; then
            echo -e "${GREEN}✅ Cleaned up $deleted_count old backup(s)${NC}"
        else
            echo -e "${BLUE}ℹ️  No old backups to clean up${NC}"
        fi
        
        # Clean S3 if configured
        if [[ -n "$S3_BUCKET" ]] && command -v aws &> /dev/null; then
            echo -e "${YELLOW}☁️ Cleaning up old S3 backups...${NC}"
            
            local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
            
            aws s3api list-objects-v2 --bucket "$S3_BUCKET" --prefix "backups/" \
                --query "Contents[?LastModified<='$cutoff_date'].Key" --output text 2>/dev/null | \
            while read -r key; do
                if [[ -n "$key" ]] && [[ "$key" != "None" ]]; then
                    aws s3 rm "s3://$S3_BUCKET/$key"
                fi
            done
        fi
    fi
}

# Function to verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    echo -e "${YELLOW}🔍 Verifying backup integrity...${NC}"
    
    if [[ "$backup_file" == *.tar.gz ]]; then
        if tar -tzf "$backup_file" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Backup archive integrity verified${NC}"
        else
            echo -e "${RED}❌ Backup archive is corrupted${NC}"
            return 1
        fi
    elif [[ "$backup_file" == *.gpg ]]; then
        if [[ -n "$BACKUP_PASSWORD" ]]; then
            if gpg --batch --yes --passphrase "$BACKUP_PASSWORD" \
                --decrypt "$backup_file" >/dev/null 2>&1; then
                echo -e "${GREEN}✅ Encrypted backup integrity verified${NC}"
            else
                echo -e "${RED}❌ Encrypted backup verification failed${NC}"
                return 1
            fi
        else
            echo -e "${YELLOW}⚠️  Cannot verify encrypted backup (no password)${NC}"
        fi
    fi
    
    return 0
}

# Main backup function
perform_backup() {
    local start_time=$(date +%s)
    
    echo -e "${BLUE}🚀 Starting RareSift backup process...${NC}"
    
    # Create backup directory
    local backup_path=$(create_backup_dir)
    
    # Perform individual backups
    backup_database "$backup_path" || echo -e "${YELLOW}⚠️  Database backup failed${NC}"
    backup_redis "$backup_path" || echo -e "${YELLOW}⚠️  Redis backup failed${NC}"
    backup_uploads "$backup_path" || echo -e "${YELLOW}⚠️  Uploads backup failed${NC}"
    backup_config "$backup_path" || echo -e "${YELLOW}⚠️  Configuration backup failed${NC}"
    backup_application_state "$backup_path" || echo -e "${YELLOW}⚠️  State backup failed${NC}"
    
    # Process backup
    local final_backup=$(compress_backup "$backup_path")
    final_backup=$(encrypt_backup "$final_backup")
    
    # Verify backup
    verify_backup "$final_backup"
    
    # Upload to cloud storage
    upload_to_s3 "$final_backup"
    
    # Clean up old backups
    cleanup_old_backups
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local backup_size=$(du -sh "$final_backup" | cut -f1)
    
    echo ""
    echo -e "${GREEN}🎉 Backup completed successfully!${NC}"
    echo -e "${BLUE}📊 Backup Statistics:${NC}"
    echo -e "${BLUE}   📁 Location: $final_backup${NC}"
    echo -e "${BLUE}   📦 Size: $backup_size${NC}"
    echo -e "${BLUE}   ⏱️  Duration: ${duration}s${NC}"
    echo -e "${BLUE}   📅 Retention: $RETENTION_DAYS days${NC}"
    
    return 0
}

# Function to restore from backup
restore_backup() {
    local backup_file="$1"
    
    if [[ -z "$backup_file" ]]; then
        echo -e "${RED}❌ Backup file not specified${NC}"
        return 1
    fi
    
    if [[ ! -f "$backup_file" ]]; then
        echo -e "${RED}❌ Backup file not found: $backup_file${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}⚠️  WARNING: This will restore from backup and may overwrite current data!${NC}"
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [[ "$confirm" != "yes" ]]; then
        echo "Restore cancelled"
        return 1
    fi
    
    echo -e "${BLUE}🔄 Starting restore process...${NC}"
    
    # Create temporary directory for extraction
    local temp_dir=$(mktemp -d)
    local extracted_backup="$temp_dir/backup"
    
    # Decrypt if needed
    if [[ "$backup_file" == *.gpg ]]; then
        if [[ -z "$BACKUP_PASSWORD" ]]; then
            echo -e "${RED}❌ BACKUP_PASSWORD required for encrypted backup${NC}"
            rm -rf "$temp_dir"
            return 1
        fi
        
        echo -e "${YELLOW}🔐 Decrypting backup...${NC}"
        local decrypted_file="$temp_dir/decrypted.tar.gz"
        
        if gpg --batch --yes --passphrase "$BACKUP_PASSWORD" \
            --decrypt "$backup_file" > "$decrypted_file"; then
            backup_file="$decrypted_file"
        else
            echo -e "${RED}❌ Failed to decrypt backup${NC}"
            rm -rf "$temp_dir"
            return 1
        fi
    fi
    
    # Extract backup
    if [[ "$backup_file" == *.tar.gz ]]; then
        echo -e "${YELLOW}📦 Extracting backup...${NC}"
        if tar -xzf "$backup_file" -C "$temp_dir"; then
            # Find the extracted directory
            extracted_backup=$(find "$temp_dir" -maxdepth 1 -type d ! -path "$temp_dir" | head -1)
        else
            echo -e "${RED}❌ Failed to extract backup${NC}"
            rm -rf "$temp_dir"
            return 1
        fi
    fi
    
    # Stop services
    echo -e "${YELLOW}⏸️  Stopping services...${NC}"
    docker-compose -f docker-compose.production.yml down
    
    # Restore database
    if [[ -f "$extracted_backup/database.sql" ]]; then
        echo -e "${YELLOW}🗄️ Restoring database...${NC}"
        docker-compose -f docker-compose.production.yml up -d postgres
        sleep 10  # Wait for postgres to start
        
        export PGPASSWORD="$DB_PASSWORD"
        docker-compose -f docker-compose.production.yml exec -T postgres psql \
            -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
            < "$extracted_backup/database.sql"
        unset PGPASSWORD
        
        echo -e "${GREEN}✅ Database restored${NC}"
    fi
    
    # Restore uploads
    if [[ -d "$extracted_backup/uploads" ]]; then
        echo -e "${YELLOW}📁 Restoring uploads...${NC}"
        sudo rm -rf "/opt/raresift/data/uploads"
        sudo mkdir -p "/opt/raresift/data/uploads"
        sudo cp -r "$extracted_backup/uploads/"* "/opt/raresift/data/uploads/"
        sudo chown -R $USER:$USER "/opt/raresift/data/uploads"
        echo -e "${GREEN}✅ Uploads restored${NC}"
    fi
    
    # Restore Redis data
    if [[ -f "$extracted_backup/redis.rdb" ]]; then
        echo -e "${YELLOW}📊 Restoring Redis data...${NC}"
        docker-compose -f docker-compose.production.yml up -d redis
        sleep 5
        docker cp "$extracted_backup/redis.rdb" raresift-redis:/data/dump.rdb
        docker-compose -f docker-compose.production.yml restart redis
        echo -e "${GREEN}✅ Redis data restored${NC}"
    fi
    
    # Start all services
    echo -e "${YELLOW}🚀 Starting all services...${NC}"
    docker-compose -f docker-compose.production.yml up -d
    
    # Clean up
    rm -rf "$temp_dir"
    
    echo -e "${GREEN}🎉 Restore completed successfully!${NC}"
    echo -e "${BLUE}💡 Please verify that all services are working correctly${NC}"
    
    return 0
}

# Main script logic
case "${1:-backup}" in
    "backup")
        perform_backup
        ;;
    "restore")
        restore_backup "$2"
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "verify")
        if [[ -n "$2" ]]; then
            verify_backup "$2"
        else
            echo -e "${RED}❌ Please specify backup file to verify${NC}"
            exit 1
        fi
        ;;
    *)
        echo "Usage: $0 {backup|restore|cleanup|verify}"
        echo ""
        echo "Commands:"
        echo "  backup           - Create a full system backup"
        echo "  restore <file>   - Restore from backup file"
        echo "  cleanup          - Clean up old backups"
        echo "  verify <file>    - Verify backup integrity"
        echo ""
        echo "Environment Variables:"
        echo "  BACKUP_DIR       - Backup storage directory (default: /opt/raresift/backups)"
        echo "  RETENTION_DAYS   - Keep backups for N days (default: 30)"
        echo "  S3_BUCKET        - S3 bucket for cloud storage"
        echo "  COMPRESS_BACKUPS - Compress backups (default: true)"
        echo "  ENCRYPT_BACKUPS  - Encrypt backups (default: true)"
        echo "  BACKUP_PASSWORD  - Password for encryption"
        exit 1
        ;;
esac