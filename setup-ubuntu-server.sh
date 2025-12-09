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
    build-essential \
    tmux \
    screen \
    nginx \
    supervisor \
    logrotate \
    rsync \
    zip \
    unzip \
    jq \
    tree \
    iotop \
    iftop \
    nethogs \
    tcpdump \
    wireshark-common

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

# Add security and stability settings
if ! grep -q "^# Enhanced SSH settings" "$SSH_CONFIG"; then
    echo "" >> "$SSH_CONFIG"
    echo "# Enhanced SSH settings for stability and deployment" >> "$SSH_CONFIG"
    echo "MaxAuthTries 3" >> "$SSH_CONFIG"
    echo "ClientAliveInterval 60" >> "$SSH_CONFIG"
    echo "ClientAliveCountMax 10" >> "$SSH_CONFIG"
    echo "TCPKeepAlive yes" >> "$SSH_CONFIG"
    echo "ServerAliveInterval 60" >> "$SSH_CONFIG"
    echo "ServerAliveCountMax 10" >> "$SSH_CONFIG"
    echo "Compression yes" >> "$SSH_CONFIG"
    echo "MaxStartups 10:30:100" >> "$SSH_CONFIG"
    echo "MaxSessions 10" >> "$SSH_CONFIG"
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

# 9. Install Node.js and PM2 (for deployment)
log_info "Installing Node.js and PM2..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    log_info "Node.js installed: $(node --version)"
else
    log_info "Node.js already installed: $(node --version)"
fi

# Install PM2 globally for process management
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    pm2 startup systemd -u ubuntu --hp /home/ubuntu
    log_info "PM2 installed and configured for auto-start"
else
    log_info "PM2 already installed"
fi

# Create PM2 ecosystem template
mkdir -p /home/ubuntu/.pm2
cat > /home/ubuntu/.pm2/ecosystem.config.js.example <<'EOF'
module.exports = {
  apps: [{
    name: 'app',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', 'logs']
  }]
};
EOF
chown -R ubuntu:ubuntu /home/ubuntu/.pm2
log_info "PM2 ecosystem template created"

# 10. Set timezone
log_info "Setting timezone to Asia/Riyadh..."
timedatectl set-timezone Asia/Riyadh 2>/dev/null || ln -sf /usr/share/zoneinfo/Asia/Riyadh /etc/localtime

# 11. Configure tmux and screen for persistent sessions
log_info "Configuring tmux and screen for persistent sessions..."
# Create tmux config for ubuntu user
mkdir -p /home/ubuntu/.config/tmux
cat > /home/ubuntu/.tmux.conf <<'EOF'
# Tmux configuration for persistent sessions
set -g default-terminal "screen-256color"
set -g history-limit 10000
set -g mouse on
set -g base-index 1
setw -g pane-base-index 1
set -g renumber-windows on
set -g set-titles on
set -g set-titles-string "#T"
set -g status-interval 1
set -g status-left-length 20
set -g status-right-length 50
bind r source-file ~/.tmux.conf \; display "Config reloaded!"
EOF

# Create screen config
cat > /home/ubuntu/.screenrc <<'EOF'
# Screen configuration for persistent sessions
startup_message off
defscrollback 10000
hardstatus alwayslastline
hardstatus string '%{= kG}[ %{G}%H %{g}][%= %{= kw}%?%-Lw%?%{r}(%{W}%n*%f%t%?(%u)%?%{r})%{w}%?%+Lw%?%?%= %{g}][%{B} %m-%d %{W}%c %{g}]'
EOF

chown -R ubuntu:ubuntu /home/ubuntu/.tmux.conf /home/ubuntu/.screenrc /home/ubuntu/.config
log_info "tmux and screen configured for persistent sessions"

# 12. Configure systemd for auto-restart services
log_info "Configuring systemd for service management..."
# Create systemd service template directory
mkdir -p /etc/systemd/system
log_info "Systemd ready for service management"

# 13. Configure Nginx as reverse proxy
log_info "Configuring Nginx..."
# Backup original nginx config
if [ -f /etc/nginx/nginx.conf ]; then
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
fi

# Optimize nginx for production
cat > /etc/nginx/nginx.conf <<'EOF'
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF

# Create sites-available and sites-enabled directories
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

# Create default site template
cat > /etc/nginx/sites-available/default <<'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable default site
ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Test nginx configuration
if nginx -t 2>/dev/null; then
    log_info "Nginx configuration is valid"
    if systemctl is-active --quiet nginx 2>/dev/null; then
        systemctl reload nginx 2>/dev/null || true
    fi
else
    log_warn "Nginx configuration has issues, please check manually"
fi

log_info "Nginx configured as reverse proxy"

# 14. Create deployment directory structure
log_info "Creating deployment directory structure..."
mkdir -p /var/www
mkdir -p /home/ubuntu/apps
mkdir -p /home/ubuntu/logs
mkdir -p /home/ubuntu/backups
mkdir -p /home/ubuntu/scripts
chown -R ubuntu:ubuntu /home/ubuntu/apps /home/ubuntu/logs /home/ubuntu/backups /home/ubuntu/scripts
log_info "Deployment directories created"

# 15. Create helper scripts for deployment
log_info "Creating deployment helper scripts..."

# Script to start persistent tmux session
cat > /home/ubuntu/scripts/start-session.sh <<'EOF'
#!/bin/bash
SESSION_NAME="${1:-deploy}"

if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    tmux new-session -d -s "$SESSION_NAME"
    echo "Created new tmux session: $SESSION_NAME"
else
    echo "Session $SESSION_NAME already exists"
fi

echo "Attach with: tmux attach -t $SESSION_NAME"
EOF

# Script for PM2 deployment
cat > /home/ubuntu/scripts/deploy.sh <<'EOF'
#!/bin/bash
# Deployment script
APP_NAME="${1:-app}"
APP_DIR="/home/ubuntu/apps/${APP_NAME}"

if [ ! -d "$APP_DIR" ]; then
    echo "Error: App directory not found: $APP_DIR"
    exit 1
fi

cd "$APP_DIR"

# Install dependencies
if [ -f package.json ]; then
    npm ci --production
fi

# Build if needed
if [ -f package.json ] && grep -q '"build"' package.json; then
    npm run build
fi

# Restart PM2
pm2 restart "$APP_NAME" || pm2 start ecosystem.config.js --name "$APP_NAME"

echo "Deployment completed for $APP_NAME"
EOF

chmod +x /home/ubuntu/scripts/*.sh
chown -R ubuntu:ubuntu /home/ubuntu/scripts
log_info "Deployment helper scripts created"

# 16. Configure network stability
log_info "Configuring network stability..."
# TCP keepalive settings
cat > /etc/sysctl.d/99-network-stability.conf <<'EOF'
# Network stability and performance
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_probes = 5
net.ipv4.tcp_keepalive_intvl = 15
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_tw_reuse = 1
net.core.somaxconn = 65535
net.ipv4.ip_local_port_range = 1024 65535
EOF

sysctl -p /etc/sysctl.d/99-network-stability.conf 2>/dev/null || true
log_info "Network stability settings applied"

# 17. Create initial user (if not exists)
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

# 18. System information
log_info "System setup completed!"
echo ""
echo "=========================================="
echo "=== Ubuntu Server Deployment Setup ==="
echo "=========================================="
echo ""
echo "=== System Information ==="
echo "Hostname: $(hostname)"
echo "OS: $(lsb_release -d | cut -f2)"
echo "Kernel: $(uname -r)"
echo "Uptime: $(uptime -p 2>/dev/null || uptime)"
echo "Memory: $(free -h | awk '/^Mem:/ {print $2}')"
echo "Disk: $(df -h / | awk 'NR==2 {print $4}') available"
echo ""
echo "=== Network Configuration ==="
ip -4 addr show 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -1 || echo "N/A"
echo ""
echo "=== Installed Services ==="
echo "✓ SSH: Enhanced with keepalive"
echo "✓ Nginx: Reverse proxy configured"
if command -v node &> /dev/null; then
    echo "✓ Node.js: $(node --version)"
fi
if command -v pm2 &> /dev/null; then
    echo "✓ PM2: Process manager installed"
fi
if command -v tmux &> /dev/null; then
    echo "✓ tmux: Persistent sessions ready"
fi
if command -v screen &> /dev/null; then
    echo "✓ screen: Persistent sessions ready"
fi
echo ""
echo "=== Security Status ==="
echo "Firewall: $(ufw status | head -1 2>/dev/null || echo 'Not active')"
if systemctl is-active --quiet fail2ban 2>/dev/null; then
    echo "Fail2Ban: Active"
else
    echo "Fail2Ban: Not active"
fi
echo ""
echo "=== Deployment Directories ==="
echo "Apps: /home/ubuntu/apps"
echo "Logs: /home/ubuntu/logs"
echo "Backups: /home/ubuntu/backups"
echo "Scripts: /home/ubuntu/scripts"
echo ""
echo "=== Quick Start Commands ==="
echo "# Start persistent tmux session:"
echo "  tmux new -s deploy"
echo "  # Or use: /home/ubuntu/scripts/start-session.sh deploy"
echo ""
echo "# Deploy application with PM2:"
echo "  cd /home/ubuntu/apps/your-app"
echo "  pm2 start ecosystem.config.js"
echo "  pm2 save"
echo ""
echo "# Check PM2 status:"
echo "  pm2 status"
echo "  pm2 logs"
echo ""
echo "# Nginx management:"
echo "  sudo systemctl status nginx"
echo "  sudo nginx -t"
echo "  sudo systemctl reload nginx"
echo ""
echo "=== Important Notes ==="
echo "• SSH sessions will persist with keepalive settings"
echo "• Use tmux/screen for long-running processes"
echo "• PM2 will auto-restart apps on server reboot"
echo "• Nginx is configured as reverse proxy on port 80"
echo "• All deployment files are in /home/ubuntu/apps"
echo ""
log_info "Setup completed successfully! 🚀"

