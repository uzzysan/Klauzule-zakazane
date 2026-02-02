# Maintenance Schedule

## Daily (Automated)
- **02:00**: Full Database & Config Backup (`scripts/backup.sh`)
- **09:00**: System Health Report (`scripts/monitor.sh`)
- **Every 5m**: Health Check (`scripts/health-check.sh`)
- **10:00**: Disk Space Check (`scripts/check-disk.sh`)

## Weekly (Manual)
- **Review Application Logs**: Check for recurring errors in backend/frontend logs.
- **Disk Usage Trends**: Compare `df -h` output with previous week.
- **Backup Verification**: Verify backup files exist in `/backups/fairpact/` and have non-zero size.

## Monthly (Manual)
- **System Updates**:
  ```bash
  sudo apt update && sudo apt upgrade -y
  # Reboot if kernel updated
  ```
- **Test Restoration**: Restore a backup to a local test environment to verify integrity.
- **SSL Check**: Verify certificate expiry date (auto-renewal should handle this, but verify).
  ```bash
  sudo certbot certificates
  ```
- **Cleanup**: Remove unused Docker images/volumes.
  ```bash
  docker system prune
  ```
