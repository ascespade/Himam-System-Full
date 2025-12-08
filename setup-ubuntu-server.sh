#!/bin/bash

# Ubuntu Server Setup Script
# This script sets up a fresh Ubuntu Server installation

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    log_error "Please run as root or with sudo"
    exit 1
fi

log_info "Starting Ubuntu Server setup..."

# 1. Update system packages
log_info "Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

# 2. Install essential packages
log_info "Installing essential packages..."
apt-get install -y \
    curl \
    wget \
    git \
    vim \
    nano \
    htop \
    net-tools \
    ufw \
    fail2ban \
    unattended-upgrades \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    software-properties-common \
    build-essential

# 3. Configure root password (if needed)
log_info "Setting root password..."
if [ -n "${ROOT_PASSWORD:-}" ]; then
    echo "root:${ROOT_PASSWORD}" | chpasswd
    log_info "Root password has been set"
else
    log_warn "ROOT_PASSWORD not set, skipping root password configuration"
fi

# 3.1. Configure sudo without password for ubuntu user
log_info "Configuring sudo without password for ubuntu user..."
SUDOERS_FILE="/etc/sudoers.d/ubuntu-nopasswd"

# Ensure ubuntu user exists and add to sudo group
if id "ubuntu" &>/dev/null; then
    usermod -aG sudo ubuntu 2>/dev/null || true
    log_info "ubuntu user added to sudo group"
else
    log_warn "ubuntu user does not exist, creating it..."
    useradd -m -s /bin/bash ubuntu
    usermod -aG sudo ubuntu
    log_info "ubuntu user created and added to sudo group"
fi

# Create sudoers file for passwordless sudo
cat > "$SUDOERS_FILE" <<'EOF'
# Allow ubuntu user to run sudo without password
ubuntu ALL=(ALL:ALL) NOPASSWD: ALL
EOF

# Set correct permissions (must be 0440)
chmod 0440 "$SUDOERS_FILE"
log_info "Sudo without password configured for ubuntu user"

# Also configure for current user if different
CURRENT_USER="${SUDO_USER:-$(who am i | awk '{print $1}')}"
if [ -n "$CURRENT_USER" ] && [ "$CURRENT_USER" != "root" ] && [ "$CURRENT_USER" != "ubuntu" ]; then
    log_info "Configuring sudo without password for $CURRENT_USER..."
    usermod -aG sudo "$CURRENT_USER" 2>/dev/null || true
    cat > "/etc/sudoers.d/${CURRENT_USER}-nopasswd" <<EOF
# Allow $CURRENT_USER to run sudo without password
$CURRENT_USER ALL=(ALL:ALL) NOPASSWD: ALL
EOF
    chmod 0440 "/etc/sudoers.d/${CURRENT_USER}-nopasswd"
    log_info "Sudo without password configured for $CURRENT_USER"
fi

# 4. Configure SSH
log_info "Configuring SSH..."
SSH_CONFIG="/etc/ssh/sshd_config"

# Backup original config
cp "$SSH_CONFIG" "${SSH_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"

# Secure SSH configuration
sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' "$SSH_CONFIG"
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' "$SSH_CONFIG"
sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' "$SSH_CONFIG"
sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' "$SSH_CONFIG"

# Add security settings
if ! grep -q "^AllowUsers" "$SSH_CONFIG"; then
    echo "" >> "$SSH_CONFIG"
    echo "# Security settings" >> "$SSH_CONFIG"
    echo "MaxAuthTries 3" >> "$SSH_CONFIG"
    echo "ClientAliveInterval 300" >> "$SSH_CONFIG"
    echo "ClientAliveCountMax 2" >> "$SSH_CONFIG"
fi

# Restart SSH if systemd is available
if systemctl is-active --quiet sshd 2>/dev/null || systemctl is-active --quiet ssh 2>/dev/null; then
    systemctl restart sshd 2>/dev/null || systemctl restart ssh 2>/dev/null
    log_info "SSH service restarted"
fi

# 5. Configure Firewall (UFW)
log_info "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
log_info "Firewall configured"

# 6. Configure Fail2Ban
log_info "Configuring Fail2Ban..."
if [ -f /etc/fail2ban/jail.local ]; then
    cp /etc/fail2ban/jail.local /etc/fail2ban/jail.local.backup
fi

cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s
EOF

if systemctl is-active --quiet fail2ban 2>/dev/null; then
    systemctl restart fail2ban
    log_info "Fail2Ban configured and started"
fi

# 7. Configure automatic security updates
log_info "Configuring automatic security updates..."
cat > /etc/apt/apt.conf.d/50unattended-upgrades <<'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF

# 8. Install Docker (optional)
if [ "${INSTALL_DOCKER:-false}" = "true" ]; then
    log_info "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    log_info "Docker installed"
fi

# 9. Install Node.js (optional, for your project)
if [ "${INSTALL_NODEJS:-false}" = "true" ]; then
    log_info "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    log_info "Node.js installed: $(node --version)"
fi

# 10. Set timezone
log_info "Setting timezone to Asia/Riyadh..."
timedatectl set-timezone Asia/Riyadh 2>/dev/null || ln -sf /usr/share/zoneinfo/Asia/Riyadh /etc/localtime

# 11. Create initial user (if not exists)
if [ -n "${NEW_USER:-}" ] && [ -n "${NEW_USER_PASSWORD:-}" ]; then
    log_info "Creating user: $NEW_USER"
    if ! id "$NEW_USER" &>/dev/null; then
        useradd -m -s /bin/bash "$NEW_USER"
        echo "$NEW_USER:$NEW_USER_PASSWORD" | chpasswd
        usermod -aG sudo "$NEW_USER"
        log_info "User $NEW_USER created with sudo privileges"
    else
        log_warn "User $NEW_USER already exists"
    fi
fi

# 12. System information
log_info "System setup completed!"
echo ""
echo "=== System Information ==="
echo "Hostname: $(hostname)"
echo "OS: $(lsb_release -d | cut -f2)"
echo "Kernel: $(uname -r)"
echo "Uptime: $(uptime -p)"
echo "Memory: $(free -h | awk '/^Mem:/ {print $2}')"
echo "Disk: $(df -h / | awk 'NR==2 {print $4}') available"
echo ""
echo "=== Network Configuration ==="
ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -1
echo ""
echo "=== Security Status ==="
echo "Firewall: $(ufw status | head -1)"
if systemctl is-active --quiet fail2ban 2>/dev/null; then
    echo "Fail2Ban: Active"
else
    echo "Fail2Ban: Not active"
fi
echo ""
log_info "Setup completed successfully!"

