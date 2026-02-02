#!/bin/bash

# FairPact Phase 1 Provisioning Script
# This script automates the VPS setup steps described in Phase 1.
# IT MUST BE RUN ON THE VPS AS ROOT OR WITH SUDO.
# 
# Prerequisites:
# 1. You have SSH'd into the VPS.
# 2. You have copied this script AND the 'ops' directory to the VPS.
#    Example: scp -r scripts ops ubuntu@147.135.211.101:~
# 
# Usage: sudo ./provision_vps.sh

set -e

# Configuration
DEPLOY_USER="deploy"
VPS_IP="147.135.211.101" # For reference, though not strictly needed by script
OPS_DIR="$(dirname "$0")/../ops"

# Ensure we are root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root (sudo)"
  exit 1
fi

# Check for ops directory
if [ ! -d "$OPS_DIR" ]; then
  echo "ERROR: 'ops' directory not found at $OPS_DIR. Please copy the entire repository or 'ops' folder."
  exit 1
fi

echo "=== Starting Phase 1 Provisioning ==="

# 1.1 System Updates
echo "--- 1.1 Updating System ---"
apt update && apt upgrade -y && apt autoremove -y

# 1.2 Create Deploy User
echo "--- 1.2 Creating Deploy User ---"
if id "$DEPLOY_USER" &>/dev/null; then
    echo "User $DEPLOY_USER already exists."
else
    adduser --disabled-password --gecos "" "$DEPLOY_USER"
    usermod -aG sudo "$DEPLOY_USER"
    echo "User $DEPLOY_USER created."
fi

# Setup SSH for deploy user
echo "Setting up SSH for $DEPLOY_USER..."
mkdir -p /home/$DEPLOY_USER/.ssh
# Copy authorized_keys from current user (likely root or ubuntu)
if [ -f "$HOME/.ssh/authorized_keys" ]; then
    cp "$HOME/.ssh/authorized_keys" /home/$DEPLOY_USER/.ssh/
    chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
    chmod 700 /home/$DEPLOY_USER/.ssh
    chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys
    echo "SSH keys copied."
else
    echo "WARNING: No authorized_keys found in $HOME/.ssh/. You must manually setup SSH access for $DEPLOY_USER!"
fi

# 1.3 Harden SSH Configuration
echo "--- 1.3 Hardening SSH ---"
# We'll use sed to modify the config in place to be safe, or append if missing.
# But for robustness with the plan, we explicitly set values.
SSHD_CONFIG="/etc/ssh/sshd_config"
cp $SSHD_CONFIG "${SSHD_CONFIG}.bak"

# Function to set ssh config
set_ssh_config() {
    local param=$1
    local value=$2
    if grep -q "^$param" "$SSHD_CONFIG"; then
        sed -i "s/^$param.*/$param $value/" "$SSHD_CONFIG"
    else
        echo "$param $value" >> "$SSHD_CONFIG"
    fi
}

set_ssh_config "PermitRootLogin" "no"
set_ssh_config "PasswordAuthentication" "no"
set_ssh_config "PubkeyAuthentication" "yes"
set_ssh_config "X11Forwarding" "no"
set_ssh_config "MaxAuthTries" "3"

systemctl restart sshd
echo "SSH configuration updated and service restarted."

# 1.4 Configure Firewall (UFW)
echo "--- 1.4 Configuring Firewall (UFW) ---"
apt install ufw -y
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
# Don't enable blindly if running in script without interactive prompt usually, 
# but for automation we force enable.
echo "y" | ufw enable
ufw status verbose

# 1.5 Install Fail2Ban
echo "--- 1.5 Installing Fail2Ban ---"
apt install fail2ban -y
cp "$OPS_DIR/fail2ban/jail.local" /etc/fail2ban/jail.local
systemctl enable fail2ban
systemctl start fail2ban
echo "Fail2Ban installed and started."

# 1.6 Install Docker
echo "--- 1.6 Installing Docker ---"
apt install apt-transport-https ca-certificates curl software-properties-common -y
if [ ! -f /usr/share/keyrings/docker-archive-keyring.gpg ]; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
fi
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y

usermod -aG docker "$DEPLOY_USER"
echo "Docker installed and $DEPLOY_USER added to docker group."

# 1.7 Configure System Limits
echo "--- 1.7 Configuring System Limits ---"
# Append limits if not present (simple check)
if ! grep -q "fairpact-limits" /etc/security/limits.conf; then
    echo "# fairpact-limits" >> /etc/security/limits.conf
    cat "$OPS_DIR/security/limits.conf" >> /etc/security/limits.conf
fi

if ! grep -q "fairpact-sysctl" /etc/sysctl.conf; then
    echo "# fairpact-sysctl" >> /etc/sysctl.conf
    cat "$OPS_DIR/security/sysctl.conf" >> /etc/sysctl.conf
    sysctl -p
fi

# 1.8 Install Additional Tools
echo "--- 1.8 Installing Additional Tools ---"
apt install -y git htop curl wget vim nano unzip certbot python3-certbot-nginx postgresql-client

# 1.9 Setup Directory Structure
echo "--- 1.9 Setting up Directory Structure ---"
mkdir -p /opt/fairpact /var/log/fairpact /backups/fairpact
chown -R "$DEPLOY_USER:$DEPLOY_USER" /opt/fairpact /var/log/fairpact /backups/fairpact

# 1.14 Configure Log Rotation (From Phase 4, but good to do now physically)
echo "--- Config Log Rotation ---"
cp "$OPS_DIR/logrotate/fairpact" /etc/logrotate.d/fairpact
chmod 644 /etc/logrotate.d/fairpact

# 1.10 Unattended Upgrades
echo "--- 1.10 Configuring Unattended Upgrades ---"
apt install unattended-upgrades -y
# Minimal config already defaults to sane values usually

echo "=== Provisioning Complete! ==="
echo "Please REBOOT server now to ensure all updates and kernel parameters apply."
echo "Command: sudo reboot"
