#!/bin/bash

# Quick Deployment Setup Script
# Sets up essential tools for deployment without full server setup

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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

log_info "Starting quick deployment setup..."

# 1. Install essential deployment tools
log_info "Installing essential tools..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y tmux screen curl wget git build-essential

# 2. Install Node.js and PM2
log_info "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    log_info "Node.js installed: $(node --version)"
fi

log_info "Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || true
    log_info "PM2 installed"
fi

# 3. Configure SSH keepalive
log_info "Configuring SSH keepalive..."
SSH_CONFIG="/etc/ssh/sshd_config"
cp "$SSH_CONFIG" "${SSH_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"

if ! grep -q "^# Deployment SSH settings" "$SSH_CONFIG"; then
    echo "" >> "$SSH_CONFIG"
    echo "# Deployment SSH settings" >> "$SSH_CONFIG"
    echo "ClientAliveInterval 60" >> "$SSH_CONFIG"
    echo "ClientAliveCountMax 10" >> "$SSH_CONFIG"
    echo "TCPKeepAlive yes" >> "$SSH_CONFIG"
fi

# Restart SSH if possible
if systemctl is-active --quiet sshd 2>/dev/null || systemctl is-active --quiet ssh 2>/dev/null; then
    systemctl restart sshd 2>/dev/null || systemctl restart ssh 2>/dev/null
    log_info "SSH restarted with keepalive settings"
fi

# 4. Configure tmux for ubuntu user
log_info "Configuring tmux..."
mkdir -p /home/ubuntu/.config/tmux
cat > /home/ubuntu/.tmux.conf <<'EOF'
set -g default-terminal "screen-256color"
set -g history-limit 10000
set -g mouse on
set -g base-index 1
setw -g pane-base-index 1
set -g renumber-windows on
bind r source-file ~/.tmux.conf \; display "Config reloaded!"
EOF

# 5. Configure screen
cat > /home/ubuntu/.screenrc <<'EOF'
startup_message off
defscrollback 10000
hardstatus alwayslastline
EOF

chown -R ubuntu:ubuntu /home/ubuntu/.tmux.conf /home/ubuntu/.screenrc /home/ubuntu/.config

# 6. Create deployment directories
log_info "Creating deployment directories..."
mkdir -p /home/ubuntu/apps /home/ubuntu/logs /home/ubuntu/backups /home/ubuntu/scripts
chown -R ubuntu:ubuntu /home/ubuntu/apps /home/ubuntu/logs /home/ubuntu/backups /home/ubuntu/scripts

# 7. Create helper scripts
log_info "Creating helper scripts..."
cat > /home/ubuntu/scripts/start-session.sh <<'EOF'
#!/bin/bash
SESSION_NAME="${1:-deploy}"
if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    tmux new-session -d -s "$SESSION_NAME"
    echo "Created new tmux session: $SESSION_NAME"
fi
echo "Attach with: tmux attach -t $SESSION_NAME"
EOF

cat > /home/ubuntu/scripts/deploy.sh <<'EOF'
#!/bin/bash
APP_NAME="${1:-app}"
APP_DIR="/home/ubuntu/apps/${APP_NAME}"
if [ ! -d "$APP_DIR" ]; then
    echo "Error: App directory not found: $APP_DIR"
    exit 1
fi
cd "$APP_DIR"
if [ -f package.json ]; then
    npm ci --production
fi
if [ -f package.json ] && grep -q '"build"' package.json; then
    npm run build
fi
pm2 restart "$APP_NAME" || pm2 start ecosystem.config.js --name "$APP_NAME"
echo "Deployment completed for $APP_NAME"
EOF

chmod +x /home/ubuntu/scripts/*.sh
chown -R ubuntu:ubuntu /home/ubuntu/scripts

# 8. Network stability
log_info "Configuring network stability..."
cat > /etc/sysctl.d/99-network-stability.conf <<'EOF'
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_probes = 5
net.ipv4.tcp_keepalive_intvl = 15
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_tw_reuse = 1
net.core.somaxconn = 65535
EOF

sysctl -p /etc/sysctl.d/99-network-stability.conf 2>/dev/null || true

log_info "Quick deployment setup completed!"
echo ""
echo "=== Quick Start ==="
echo "1. Start tmux session: tmux new -s deploy"
echo "2. Deploy app: cd /home/ubuntu/apps/your-app && pm2 start ecosystem.config.js"
echo "3. Check status: pm2 status"
echo ""
log_info "Done! 🚀"

