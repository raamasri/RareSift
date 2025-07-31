# RareSift Disaster Recovery Plan

## Overview

This document outlines the disaster recovery procedures for RareSift, including backup strategies, recovery processes, and business continuity measures.

## Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)

- **RTO (Recovery Time Objective)**: 4 hours maximum downtime
- **RPO (Recovery Point Objective)**: 24 hours maximum data loss
- **Critical Services**: Database, File Storage, Application Backend
- **Non-Critical Services**: Monitoring, Logging (can be restored later)

## Backup Strategy

### Automated Backups

1. **Full System Backup**: Daily at 2:00 AM UTC
2. **Database Backup**: Every 6 hours
3. **Incremental File Backup**: Every 2 hours
4. **Configuration Backup**: Weekly

### Backup Components

- **PostgreSQL Database**: Complete dump with schema and data
- **Redis Cache**: RDB snapshots (for session persistence)
- **Uploaded Files**: Video files and processed frames
- **Application Configuration**: Docker configs, SSL certificates, secrets
- **System State**: Service status and environment information

### Storage Locations

1. **Primary**: Local storage (`/opt/raresift/backups`)
2. **Secondary**: AWS S3 bucket with versioning
3. **Tertiary**: Optional external storage or different cloud provider

## Disaster Scenarios and Recovery Procedures

### Scenario 1: Database Corruption/Failure

**Detection**:
- Health check failures
- Application errors connecting to database
- Data inconsistencies

**Recovery Steps**:
1. Stop all application services
2. Assess database state and corruption level
3. Restore from latest backup:
   ```bash
   ./scripts/backup-system.sh restore /path/to/latest/backup.tar.gz.gpg
   ```
4. Verify database integrity
5. Restart services in order: postgres → redis → backend → frontend
6. Run application health checks

**Estimated Recovery Time**: 30-60 minutes

### Scenario 2: Complete Server Failure

**Detection**:
- Server unreachable
- All services down
- Hardware/infrastructure failure

**Recovery Steps**:
1. Provision new server with same specifications
2. Install Docker and Docker Compose
3. Download latest backup from S3:
   ```bash
   aws s3 cp s3://raresift-backups/backups/latest-backup.tar.gz.gpg ./
   ```
4. Clone application repository
5. Restore from backup:
   ```bash
   ./scripts/backup-system.sh restore latest-backup.tar.gz.gpg
   ```
6. Update DNS records to point to new server
7. Generate new SSL certificates if needed
8. Start all services and verify functionality

**Estimated Recovery Time**: 2-4 hours

### Scenario 3: Data Center/Cloud Region Failure

**Detection**:
- Multiple services unreachable
- Cloud provider status page indicates outage
- All infrastructure in region affected

**Recovery Steps**:
1. Activate secondary region/data center
2. Provision infrastructure in secondary location
3. Restore from S3 backup (cross-region replication)
4. Update DNS to point to secondary location
5. Notify users of temporary service location
6. Monitor primary region for restoration

**Estimated Recovery Time**: 4-8 hours (including DNS propagation)

### Scenario 4: Ransomware/Security Breach

**Detection**:
- Unusual file modifications
- Encrypted files with ransom notes
- Unexpected system behavior
- Security alerts

**Recovery Steps**:
1. **IMMEDIATE**: Isolate affected systems (disconnect from network)
2. Assess scope of breach and data compromise
3. Activate incident response team
4. Restore from clean backup (verify backup integrity first):
   ```bash
   ./scripts/backup-system.sh verify /path/to/backup.tar.gz.gpg
   ./scripts/backup-system.sh restore /path/to/clean/backup.tar.gz.gpg
   ```
5. Change all passwords and secrets
6. Update security configurations
7. Perform security audit before going live
8. Monitor for additional threats

**Estimated Recovery Time**: 4-24 hours (depending on scope)

### Scenario 5: Application Code Corruption

**Detection**:
- Application won't start
- Runtime errors
- Corrupted Docker images

**Recovery Steps**:
1. Revert to last known good code version
2. Rebuild Docker images from clean source
3. Restore configuration files from backup if needed
4. Test in staging environment first
5. Deploy to production

**Estimated Recovery Time**: 1-2 hours

## Backup Restoration Testing

### Monthly Backup Testing (First Sunday of each month)

1. **Test Database Restore**:
   ```bash
   # Create test environment
   docker-compose -f docker-compose.test.yml up -d postgres-test
   
   # Restore latest backup to test database
   PGPASSWORD=$TEST_DB_PASSWORD pg_restore -h localhost -p 5433 \
     -U test_user -d test_db latest_backup.sql
   
   # Verify data integrity
   ./scripts/verify-database-integrity.py --test-db
   ```

2. **Test File Restore**:
   ```bash
   # Restore files to test directory
   mkdir -p /tmp/restore-test
   tar -xzf latest_backup.tar.gz -C /tmp/restore-test
   
   # Verify file integrity
   ./scripts/verify-file-integrity.py /tmp/restore-test/uploads
   ```

3. **Test Full System Restore**:
   - Perform complete restore in isolated environment
   - Verify all services start correctly
   - Run automated tests
   - Document any issues found

### Backup Verification Checklist

- [ ] Backup files are not corrupted
- [ ] Database restore completes without errors
- [ ] All uploaded files are present
- [ ] Configuration files are complete
- [ ] Secrets are properly encrypted
- [ ] Backup size is within expected range
- [ ] S3 backup sync is working
- [ ] Retention policy is working correctly

## Recovery Infrastructure

### Minimum Server Requirements

- **CPU**: 4 cores minimum, 8 cores recommended
- **Memory**: 8GB minimum, 16GB recommended
- **Storage**: 100GB minimum, 500GB+ recommended
- **Network**: 1Gbps minimum bandwidth
- **OS**: Ubuntu 20.04 LTS or similar

### Required Software

- Docker (latest stable)
- Docker Compose (v2.0+)
- AWS CLI (if using S3)
- PostgreSQL client tools
- SSL certificate tools

### Emergency Contacts

- **Primary Administrator**: [Your Name] - [Your Phone] - [Your Email]
- **Secondary Administrator**: [Backup Contact]
- **Cloud Provider Support**: AWS Support (if applicable)
- **DNS Provider Support**: [DNS Provider Contact]

## Prevention Measures

### Regular Maintenance

1. **System Updates**: Apply security patches monthly
2. **Dependency Updates**: Update Docker images quarterly
3. **Certificate Renewal**: Automate SSL certificate renewal
4. **Resource Monitoring**: Monitor disk space, memory, CPU usage
5. **Security Scanning**: Regular vulnerability assessments

### Monitoring and Alerting

1. **Service Health**: Monitor all services with health checks
2. **Backup Status**: Alert on backup failures
3. **Resource Usage**: Alert on high resource consumption
4. **Security Events**: Monitor for suspicious activity
5. **Performance**: Track response times and error rates

### High Availability Options

1. **Database Replication**: PostgreSQL streaming replication
2. **Load Balancing**: Multiple backend instances
3. **CDN**: CloudFlare or AWS CloudFront for static assets
4. **Multi-Region**: Deploy in multiple AWS regions

## Business Continuity

### Communication Plan

1. **Internal Team**: Slack/Teams notification within 15 minutes
2. **Customers**: Status page update within 30 minutes
3. **Stakeholders**: Email notification within 1 hour
4. **Public**: Social media updates if needed

### Service Degradation

If full restoration takes longer than expected:

1. **Read-Only Mode**: Allow users to browse existing content
2. **Status Page**: Keep users informed of progress
3. **Alternative Access**: Provide API access if web interface is down
4. **Customer Support**: Dedicated support for critical users

## Recovery Validation

After any disaster recovery:

1. **Functional Testing**: Verify all features work correctly
2. **Data Integrity**: Check for data loss or corruption
3. **Performance Testing**: Ensure system performance is acceptable
4. **Security Review**: Verify security configurations
5. **User Acceptance**: Get confirmation from key users
6. **Documentation Update**: Update procedures based on lessons learned

## Contact Information for Recovery

- **Hosting Provider**: [Provider Support]
- **Domain Registrar**: [Registrar Support]
- **SSL Certificate Authority**: [CA Support]
- **Payment Processor**: [Payment Support]
- **Third-party APIs**: [API Provider Support]

## Review and Updates

This disaster recovery plan should be:
- Reviewed quarterly
- Updated after any major system changes
- Tested annually with full recovery simulation
- Approved by management annually

---

**Document Version**: 1.0  
**Last Updated**: $(date +%Y-%m-%d)  
**Next Review Date**: $(date -d '+3 months' +%Y-%m-%d)  
**Approved By**: [Management Signature]