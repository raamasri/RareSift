#!/bin/bash

# Setup automated backup scheduling for RareSift
# Creates cron jobs for regular backups and monitoring

set -e

echo "⏰ RareSift Backup Scheduling Setup"
echo "==================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-system.sh"
LOG_DIR="/var/log/raresift"

# Create log directory
echo -e "${BLUE}📁 Creating log directory...${NC}"
sudo mkdir -p "$LOG_DIR"
sudo chown $USER:$USER "$LOG_DIR"

# Function to create cron job
create_cron_job() {
    local schedule="$1"
    local command="$2"
    local description="$3"
    
    echo -e "${YELLOW}⏰ Setting up: $description${NC}"
    echo "   Schedule: $schedule"
    echo "   Command: $command"
    
    # Add to user's crontab
    (crontab -l 2>/dev/null || echo "") | grep -v "$command" | {
        cat
        echo "$schedule $command"
    } | crontab -
    
    echo -e "${GREEN}✅ Cron job created${NC}"
}

# Function to create backup script wrapper
create_backup_wrapper() {
    local wrapper_script="$SCRIPT_DIR/backup-wrapper.sh"
    
    echo -e "${BLUE}📝 Creating backup wrapper script...${NC}"
    
    cat > "$wrapper_script" << EOF
#!/bin/bash

# Backup wrapper script with logging and error handling
# This script wraps the main backup script with proper logging

set -e

LOGFILE="$LOG_DIR/backup-\$(date +%Y-%m-%d).log"
BACKUP_SCRIPT="$BACKUP_SCRIPT"

# Function to log with timestamp
log() {
    echo "\$(date '+%Y-%m-%d %H:%M:%S') - \$1" | tee -a "\$LOGFILE"
}

# Function to send notification (implement as needed)
send_notification() {
    local subject="\$1"
    local message="\$2"
    local priority="\$3"
    
    # Log the notification
    log "NOTIFICATION [\$priority]: \$subject - \$message"
    
    # Uncomment and configure for actual notifications
    # echo "\$message" | mail -s "\$subject" admin@yourdomain.com
    # curl -X POST "https://hooks.slack.com/your-webhook" -d "{'text':'\$message'}"
}

# Main backup execution
main() {
    log "=== Starting RareSift Backup Process ==="
    
    # Change to project directory
    cd "$PROJECT_DIR"
    
    # Source environment variables if available
    if [[ -f ".env.production" ]]; then
        source .env.production
    fi
    
    # Set backup environment variables
    export BACKUP_DIR="\${BACKUP_DIR:-/opt/raresift/backups}"
    export RETENTION_DAYS="\${RETENTION_DAYS:-30}"
    export S3_BUCKET="\${S3_BUCKET:-}"
    export COMPRESS_BACKUPS="\${COMPRESS_BACKUPS:-true}"
    export ENCRYPT_BACKUPS="\${ENCRYPT_BACKUPS:-true}"
    
    # Run backup
    if "\$BACKUP_SCRIPT" backup >> "\$LOGFILE" 2>&1; then
        log "✅ Backup completed successfully"
        send_notification "RareSift Backup Success" "Daily backup completed successfully" "info"
    else
        local exit_code=\$?
        log "❌ Backup failed with exit code: \$exit_code"
        send_notification "RareSift Backup Failed" "Daily backup failed. Check logs: \$LOGFILE" "error"
        exit \$exit_code
    fi
    
    log "=== Backup Process Completed ==="
}

# Execute main function
main "\$@"
EOF

    chmod +x "$wrapper_script"
    echo -e "${GREEN}✅ Backup wrapper created: $wrapper_script${NC}"
}

# Function to create monitoring script
create_monitoring_script() {
    local monitor_script="$SCRIPT_DIR/backup-monitor.sh"
    
    echo -e "${BLUE}📊 Creating backup monitoring script...${NC}"
    
    cat > "$monitor_script" << EOF
#!/bin/bash

# Backup monitoring script
# Checks backup health and sends alerts if needed

set -e

BACKUP_DIR="\${BACKUP_DIR:-/opt/raresift/backups}"
LOG_DIR="$LOG_DIR"
MAX_BACKUP_AGE_HOURS=26  # Alert if no backup in 26 hours
MIN_BACKUP_SIZE_MB=10    # Alert if backup is smaller than 10MB

# Function to log with timestamp
log() {
    echo "\$(date '+%Y-%m-%d %H:%M:%S') - \$1" | tee -a "\$LOG_DIR/backup-monitor.log"
}

# Function to send alert
send_alert() {
    local subject="\$1"
    local message="\$2"
    
    log "ALERT: \$subject - \$message"
    # Add notification logic here (email, Slack, etc.)
}

# Check if backup directory exists
if [[ ! -d "\$BACKUP_DIR" ]]; then
    send_alert "Backup Directory Missing" "Backup directory \$BACKUP_DIR does not exist"
    exit 1
fi

# Find latest backup
LATEST_BACKUP=\$(find "\$BACKUP_DIR" -name "*.tar.gz*" -o -name "*.gpg" | sort -r | head -1)

if [[ -z "\$LATEST_BACKUP" ]]; then
    send_alert "No Backups Found" "No backup files found in \$BACKUP_DIR"
    exit 1
fi

# Check backup age
BACKUP_AGE_SECONDS=\$((\$(date +%s) - \$(stat -c %Y "\$LATEST_BACKUP")))
BACKUP_AGE_HOURS=\$((BACKUP_AGE_SECONDS / 3600))

if [[ \$BACKUP_AGE_HOURS -gt \$MAX_BACKUP_AGE_HOURS ]]; then
    send_alert "Backup Too Old" "Latest backup is \$BACKUP_AGE_HOURS hours old (max: \$MAX_BACKUP_AGE_HOURS)"
fi

# Check backup size
BACKUP_SIZE_BYTES=\$(stat -c %s "\$LATEST_BACKUP")
BACKUP_SIZE_MB=\$((BACKUP_SIZE_BYTES / 1024 / 1024))

if [[ \$BACKUP_SIZE_MB -lt \$MIN_BACKUP_SIZE_MB ]]; then
    send_alert "Backup Too Small" "Latest backup is only \${BACKUP_SIZE_MB}MB (min: \${MIN_BACKUP_SIZE_MB}MB)"
fi

# Check disk space
BACKUP_DISK_USAGE=\$(df "\$BACKUP_DIR" | awk 'NR==2 {print \$5}' | sed 's/%//')
if [[ \$BACKUP_DISK_USAGE -gt 85 ]]; then
    send_alert "Backup Disk Full" "Backup disk usage is \${BACKUP_DISK_USAGE}% (warning at 85%)"
fi

# Log successful check
log "✅ Backup monitoring check completed"
log "   Latest backup: \$LATEST_BACKUP"
log "   Backup age: \$BACKUP_AGE_HOURS hours"
log "   Backup size: \${BACKUP_SIZE_MB}MB"
log "   Disk usage: \${BACKUP_DISK_USAGE}%"
EOF

    chmod +x "$monitor_script"
    echo -e "${GREEN}✅ Backup monitoring script created: $monitor_script${NC}"
}

# Function to create log rotation config
create_log_rotation() {
    local logrotate_config="/etc/logrotate.d/raresift-backup"
    
    echo -e "${BLUE}🔄 Setting up log rotation...${NC}"
    
    sudo tee "$logrotate_config" > /dev/null << EOF
$LOG_DIR/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    su $USER $USER
}
EOF

    echo -e "${GREEN}✅ Log rotation configured: $logrotate_config${NC}"
}

# Function to display current cron jobs
show_cron_schedule() {
    echo -e "${BLUE}📅 Current RareSift backup schedule:${NC}"
    echo ""
    
    crontab -l | grep -E "(backup|raresift)" | while read -r line; do
        echo "   $line"
    done
    
    echo ""
    echo -e "${BLUE}ℹ️  Cron schedule format: minute hour day month weekday command${NC}"
    echo -e "${BLUE}ℹ️  Log files location: $LOG_DIR${NC}"
}

# Main setup function
main() {
    echo -e "${BLUE}🚀 Setting up RareSift backup automation...${NC}"
    
    # Verify backup script exists
    if [[ ! -f "$BACKUP_SCRIPT" ]]; then
        echo -e "${RED}❌ Backup script not found: $BACKUP_SCRIPT${NC}"
        exit 1
    fi
    
    # Create wrapper and monitoring scripts
    create_backup_wrapper
    create_monitoring_script
    create_log_rotation
    
    echo ""
    echo -e "${YELLOW}⏰ Setting up cron jobs...${NC}"
    
    # Daily full backup at 2:00 AM
    create_cron_job "0 2 * * *" \
        "cd $PROJECT_DIR && $SCRIPT_DIR/backup-wrapper.sh" \
        "Daily full backup"
    
    # Backup monitoring every 6 hours
    create_cron_job "0 */6 * * *" \
        "$SCRIPT_DIR/backup-monitor.sh" \
        "Backup health monitoring"
    
    # Weekly cleanup on Sundays at 3:00 AM
    create_cron_job "0 3 * * 0" \
        "cd $PROJECT_DIR && $BACKUP_SCRIPT cleanup >> $LOG_DIR/cleanup.log 2>&1" \
        "Weekly backup cleanup"
    
    # Monthly backup verification on first Sunday at 4:00 AM
    create_cron_job "0 4 1-7 * 0" \
        "cd $PROJECT_DIR && $SCRIPT_DIR/backup-verify-monthly.sh >> $LOG_DIR/verify.log 2>&1" \
        "Monthly backup verification"
    
    echo ""
    show_cron_schedule
    
    echo ""
    echo -e "${GREEN}🎉 Backup automation setup completed!${NC}"
    echo ""
    echo -e "${BLUE}📋 What was configured:${NC}"
    echo "   ✅ Daily backups at 2:00 AM"
    echo "   ✅ Backup monitoring every 6 hours"
    echo "   ✅ Weekly cleanup on Sundays"
    echo "   ✅ Monthly verification tests"
    echo "   ✅ Log rotation for backup logs"
    echo "   ✅ Monitoring and alerting scripts"
    echo ""
    echo -e "${BLUE}📝 Next steps:${NC}"
    echo "   1. Configure notification settings in backup-wrapper.sh"
    echo "   2. Test backup manually: $BACKUP_SCRIPT backup"
    echo "   3. Set up S3_BUCKET environment variable for cloud backups"
    echo "   4. Review disaster recovery plan: $SCRIPT_DIR/disaster-recovery-plan.md"
    echo ""
    echo -e "${BLUE}📊 Monitor backups:${NC}"
    echo "   • View logs: tail -f $LOG_DIR/backup-*.log"
    echo "   • Check status: $SCRIPT_DIR/backup-monitor.sh"
    echo "   • Manual backup: $SCRIPT_DIR/backup-wrapper.sh"
}

# Check if running as root (not recommended)
if [[ $EUID -eq 0 ]]; then
    echo -e "${YELLOW}⚠️  Warning: Running as root. Consider running as a regular user.${NC}"
    read -p "Continue anyway? (y/N): " continue_root
    if [[ "$continue_root" != "y" ]]; then
        exit 1
    fi
fi

# Run main function
main "$@"