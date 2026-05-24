#!/bin/bash

set -e

echo "===================================="
echo "🚀 TravelBoost Dev Bootstrap Started"
echo "===================================="

PROJECT_DIR="$HOME/travelboost-dev"

# =========================================
# PRE-CHECKS (FAIL FAST)
# =========================================
echo "🔍 Running pre-checks..."

# Check project directory
if [ ! -d "$PROJECT_DIR" ]; then
  echo "❌ ERROR: Project directory not found: $PROJECT_DIR"
  exit 1
fi

# Check infra files
if [ ! -f "/etc/ssl/cloudflare/travelboost/origin.crt" ]; then
  echo "❌ /etc/ssl/cloudflare/travelboost/origin.crt"
  exit 1
fi

if [ ! -f "/etc/ssl/cloudflare/travelboost/origin.key" ]; then
  echo "❌ ERROR: Missing /etc/ssl/cloudflare/travelboost/origin.key"
  exit 1
fi

echo "✔ Pre-checks passed"

# =========================================
# SYSTEM UPDATE
# =========================================
echo "📦 Updating system..."
sudo apt update && sudo apt upgrade -y

# =========================================
# PACKAGE INSTALL
# =========================================
echo "📦 Installing packages..."
sudo apt install -y \
nginx \
nodejs \
composer \
supervisor \
php \
php-cli \
php-fpm \
php-mbstring \
php-xml \
php-curl \
php-zip \
php-bcmath \
php-intl \
php-pgsql \
php-sqlite3 \
php-gd \
php-imagick

echo "✔ Packages installed"

# =========================================
# APACHE DISABLE
# =========================================
echo "🛑 Disabling Apache..."
sudo systemctl disable --now apache2 2>/dev/null || echo "✔ Apache not installed"

# =========================================
# LINK CONFIGS (SAFE)
# =========================================
echo "⚙️ Linking configs..."

sudo ln -sf "$PROJECT_DIR/infra/nginx/travelboost-dev.conf" \
/etc/nginx/sites-enabled/travelboost-dev.conf

sudo ln -sf "$PROJECT_DIR/infra/supervisor/travelboost-dev.conf" \
/etc/supervisor/conf.d/travelboost-dev.conf

echo "✔ Configs linked"

# =========================================
# START SERVICES
# =========================================
echo "🚀 Starting services..."

sudo systemctl enable --now nginx
sudo systemctl enable --now supervisor

# =========================================
# DONE
# =========================================
echo "===================================="
echo "✅ Dev Bootstrap Completed"
echo "===================================="