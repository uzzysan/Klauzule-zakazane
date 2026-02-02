# Quick Reference

## Paths
| Item | Path |
|------|------|
| App Dir | `/opt/fairpact` |
| Logs | `/var/log/fairpact` |
| Backups | `/backups/fairpact` |
| Config | `/opt/fairpact/.env.production` |

## Common Commands

**View Status**
```bash
cd /opt/fairpact && docker compose -f docker-compose.prod.yml ps
```

**Tail Logs**
```bash
/opt/fairpact/scripts/view-logs.sh backend-1 50
```

**Deploy Update**
```bash
sudo -u deploy /opt/fairpact/scripts/deploy.sh
```

**Emergency Stop**
```bash
cd /opt/fairpact && docker compose -f docker-compose.prod.yml down
```

**Manual Backup**
```bash
/opt/fairpact/scripts/backup.sh
```

**System Stats**
```bash
htop
docker stats
```
