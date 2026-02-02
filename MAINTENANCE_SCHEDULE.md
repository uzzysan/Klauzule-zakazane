# Maintenance Schedule

## Daily (Automated)
- **02:00** - Full system backup (Database + Config)
- **Hourly** - Log rotation check
- **Every 5 min** - Health check ping

## Weekly (Manual)
- Check disk usage trends
- Review error logs for recurring issues
- Verify backup file integrity (check file sizes)

## Monthly
- **1st Monday**:
  - Test restoration of a backup to a local dev environment
  - Check for OS security updates (`apt update`)
  - clean up unused Docker images (`docker system prune`)

## Quarterly
- **Jan/Apr/Jul/Oct**:
  - Rotate SSL certificates (automated via Certbot, but verify expiry)
  - Review access logs for suspicious activity
  - Update application dependencies (Python/Node) if security patches exist
