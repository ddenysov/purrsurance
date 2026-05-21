#!/bin/bash
# =============================================================================
# Purrsurance — EC2 User Data (Amazon Linux 2023)
# =============================================================================
# Paste this ENTIRE file into AWS Console:
#   EC2 → Launch instance → Advanced details → User data
#
# Stack: Docker Compose in apps/backend only
#   - Laravel + Inertia/Vue (Vite production build → public/build)
#   - Postgres, Qdrant, nginx, queue worker
#   - NO Nuxt storefront, NO S3/CloudFront, NO Vite dev server
#
# Before launch, edit the 3 variables in section [CONFIG] below.
#
# Instance requirements:
#   - AMI: Amazon Linux 2023
#   - IAM role: ssm:GetParameter (if SSM_ENV_PARAM is set)
#   - Security group: inbound TCP 80 (SSH 22 optional)
#   - Disk: 20+ GB recommended (Docker images + node_modules volume)
# =============================================================================

set -euxo pipefail
exec > /var/log/purrsurance-user-data.log 2>&1

# ----------------------------- [CONFIG] — edit before launch -----------------
REPO_URL="https://github.com/ddenysov/purrsurance"
REPO_BRANCH="main"
# Full Laravel .env as SecureString (recommended). Leave empty to use .env.example.
SSM_ENV_PARAM=""
APP_DIR="/opt/purrsurance"
BACKEND_DIR="${APP_DIR}/apps/backend"
# -----------------------------------------------------------------------------

log() { echo "[$(date '+%Y-%m-%dT%H:%M:%S')] $*"; }
die() { log "FATAL: $*"; exit 1; }

log "=== Purrsurance bootstrap (Amazon Linux) ==="

# --- Docker (Amazon Linux 2023) ---
log "Installing packages..."
dnf update -y
dnf install -y docker git awscli jq
systemctl enable docker
systemctl start docker

install_cli_plugin() {
  local name="$1" url="$2"
  mkdir -p /usr/local/lib/docker/cli-plugins
  curl -fsSL "$url" -o "/usr/local/lib/docker/cli-plugins/${name}"
  chmod +x "/usr/local/lib/docker/cli-plugins/${name}"
}

case "$(uname -m)" in
  x86_64) DOCKER_ARCH=amd64 ;;
  aarch64) DOCKER_ARCH=arm64 ;;
  *) die "Unsupported CPU arch: $(uname -m)" ;;
esac

# Amazon Linux docker package ships old/missing buildx; Compose build needs >= 0.17.
BUILDX_VERSION="${BUILDX_VERSION:-v0.21.1}"
log "Installing Docker Buildx ${BUILDX_VERSION}..."
install_cli_plugin docker-buildx \
  "https://github.com/docker/buildx/releases/download/${BUILDX_VERSION}/buildx-${BUILDX_VERSION}.linux-${DOCKER_ARCH}"
docker buildx version

if ! docker compose version &>/dev/null; then
  log "Installing Docker Compose plugin..."
  install_cli_plugin docker-compose \
    "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)"
fi

docker --version
docker compose version

# --- Repository ---
if [[ -d "${APP_DIR}/.git" ]]; then
  log "Updating repo at ${APP_DIR}"
  git -C "$APP_DIR" fetch --all --prune
  git -C "$APP_DIR" checkout "$REPO_BRANCH"
  git -C "$APP_DIR" pull --ff-only origin "$REPO_BRANCH" || true
else
  log "Cloning ${REPO_URL}"
  mkdir -p "$(dirname "$APP_DIR")"
  git clone --branch "$REPO_BRANCH" --depth 1 "$REPO_URL" "$APP_DIR"
fi

[[ -f "${BACKEND_DIR}/docker-compose.yml" ]] || die "Missing ${BACKEND_DIR}/docker-compose.yml"

# --- .env ---
ENV_FILE="${BACKEND_DIR}/.env"
if [[ -f "$ENV_FILE" ]]; then
  log ".env already present"
elif [[ -n "$SSM_ENV_PARAM" ]]; then
  log "Loading .env from SSM: ${SSM_ENV_PARAM}"
  aws ssm get-parameter --name "$SSM_ENV_PARAM" --with-decryption \
    --query 'Parameter.Value' --output text > "$ENV_FILE"
  chmod 600 "$ENV_FILE"
elif [[ -f "${BACKEND_DIR}/.env.example" ]]; then
  log "Copying .env.example (add secrets and re-run if needed)"
  cp "${BACKEND_DIR}/.env.example" "$ENV_FILE"
else
  die "No .env source. Set SSM_ENV_PARAM or ship .env.example"
fi

# Production defaults + public URL from instance metadata
TOKEN=$(curl -sf -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" || true)
PUBLIC_IP=""
if [[ -n "${TOKEN:-}" ]]; then
  PUBLIC_IP=$(curl -sf -H "X-aws-ec2-metadata-token: $TOKEN" \
    http://169.254.169.254/latest/meta-data/public-ipv4 || true)
fi

if [[ -n "$PUBLIC_IP" ]]; then
  APP_URL="http://${PUBLIC_IP}"
  grep -q '^APP_URL=' "$ENV_FILE" && sed -i "s|^APP_URL=.*|APP_URL=${APP_URL}|" "$ENV_FILE" || echo "APP_URL=${APP_URL}" >> "$ENV_FILE"
  grep -q '^PUBLIC_APP_URL=' "$ENV_FILE" && sed -i "s|^PUBLIC_APP_URL=.*|PUBLIC_APP_URL=${APP_URL}|" "$ENV_FILE" || echo "PUBLIC_APP_URL=${APP_URL}" >> "$ENV_FILE"
fi
sed -i 's/^APP_ENV=local/APP_ENV=production/' "$ENV_FILE" 2>/dev/null || true
sed -i 's/^APP_DEBUG=true/APP_DEBUG=false/' "$ENV_FILE" 2>/dev/null || true

NEED_APP_KEY=0
grep -qE '^APP_KEY=base64:' "$ENV_FILE" || NEED_APP_KEY=1

# --- systemd: survive reboot ---
cat > /etc/systemd/system/purrsurance-backend.service <<EOF
[Unit]
Description=Purrsurance backend (Docker Compose)
After=docker.service network-online.target
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${BACKEND_DIR}
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=600

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable purrsurance-backend.service

# --- Docker Compose bootstrap ---
cd "$BACKEND_DIR"
COMPOSE=(docker compose)

log "Building images..."
"${COMPOSE[@]}" build

log "Starting containers..."
"${COMPOSE[@]}" up -d

log "Waiting for app container..."
for _ in $(seq 1 90); do
  if "${COMPOSE[@]}" exec -T app php -r 'exit(0);' 2>/dev/null; then
    break
  fi
  sleep 2
done

log "Installing PHP dependencies..."
"${COMPOSE[@]}" exec -T app composer install --no-interaction --prefer-dist --optimize-autoloader

if [[ "$NEED_APP_KEY" -eq 1 ]]; then
  log "Generating APP_KEY..."
  "${COMPOSE[@]}" exec -T app php artisan key:generate --force
fi

log "Running migrations..."
"${COMPOSE[@]}" exec -T app php artisan migrate --force

log "Installing JS deps and building production frontend bundle (Vite → public/build)..."
"${COMPOSE[@]}" exec -T app npm ci || "${COMPOSE[@]}" exec -T app npm install
"${COMPOSE[@]}" exec -T app npm run build
"${COMPOSE[@]}" exec -T app test -f public/build/manifest.json || die "Vite build failed: public/build/manifest.json missing"

log "Fixing storage permissions for php-fpm (www-data)..."
"${COMPOSE[@]}" exec -T --user root app chown -R www-data:www-data storage bootstrap/cache
"${COMPOSE[@]}" exec -T --user root app chmod -R ug+rwX storage bootstrap/cache

log "Caching Laravel..."
"${COMPOSE[@]}" exec -T app php artisan config:cache
"${COMPOSE[@]}" exec -T app php artisan route:cache
"${COMPOSE[@]}" exec -T app php artisan view:cache

"${COMPOSE[@]}" ps

log "=== Done ==="
log "Logs: /var/log/purrsurance-user-data.log"
[[ -n "$PUBLIC_IP" ]] && log "Open: http://${PUBLIC_IP}"
log "Manage: cd ${BACKEND_DIR} && docker compose logs -f"
