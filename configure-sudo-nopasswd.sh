#!/bin/bash

# Quick script to configure sudo without password for ubuntu user
# Run with: sudo bash configure-sudo-nopasswd.sh

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
    echo "Usage: sudo bash $0"
    exit 1
fi

log_info "Configuring sudo without password..."

# 1. Ensure ubuntu user exists and add to sudo group
if id "ubuntu" &>/dev/null; then
    usermod -aG sudo ubuntu 2>/dev/null || true
    log_info "✓ ubuntu user exists and added to sudo group"
else
    log_warn "ubuntu user does not exist, creating it..."
    useradd -m -s /bin/bash ubuntu
    usermod -aG sudo ubuntu
    log_info "✓ ubuntu user created and added to sudo group"
fi

# 2. Create sudoers file for passwordless sudo
SUDOERS_FILE="/etc/sudoers.d/ubuntu-nopasswd"

cat > "$SUDOERS_FILE" <<'EOF'
# Allow ubuntu user to run sudo without password
ubuntu ALL=(ALL:ALL) NOPASSWD: ALL
EOF

# Set correct permissions (must be 0440)
chmod 0440 "$SUDOERS_FILE"
log_info "✓ Sudoers file created: $SUDOERS_FILE"

# 3. Verify configuration
if visudo -c -f "$SUDOERS_FILE" 2>/dev/null; then
    log_info "✓ Sudoers configuration is valid"
else
    log_error "Sudoers configuration has errors!"
    exit 1
fi

# 4. Test sudo access (if possible)
log_info "Configuration completed!"
echo ""
echo "=== Summary ==="
echo "✓ ubuntu user has sudo privileges"
echo "✓ sudo can be used without password"
echo ""
echo "You can now test with:"
echo "  su - ubuntu"
echo "  sudo whoami"
echo ""
log_info "Done!"

