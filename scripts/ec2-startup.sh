#!/bin/bash
# Re-run bootstrap on an existing Amazon Linux EC2 instance (after .env or code changes).
# User Data for first boot: use scripts/ec2-user-data.sh in the AWS console.
#
#   sudo bash /opt/purrsurance/scripts/ec2-startup.sh
#
# Optional: /etc/purrsurance/ec2.env (see scripts/ec2.env.example)

set -euo pipefail

LOG_FILE="/var/log/purrsurance-startup.log"
CONFIG_FILE="/etc/purrsurance/ec2.env"

PURRSURANCE_APP_DIR="${PURRSURANCE_APP_DIR:-/opt/purrsurance}"
PURRSURANCE_BACKEND_DIR="${PURRSURANCE_BACKEND_DIR:-${PURRSURANCE_APP_DIR}/apps/backend}"
PURRSURANCE_REPO_URL="${PURRSURANCE_REPO_URL:-}"
PURRSURANCE_REPO_BRANCH="${PURRSURANCE_REPO_BRANCH:-main}"
PURRSURANCE_ENV_SSM_PARAM="${PURRSURANCE_ENV_SSM_PARAM:-}"
PURRSURANCE_SKIP_GIT="${PURRSURANCE_SKIP_GIT:-1}"

[[ -f "$CONFIG_FILE" ]] && source "$CONFIG_FILE"

mkdir -p "$(dirname "$LOG_FILE")"
exec > >(tee -a "$LOG_FILE") 2>&1

log() { echo "[$(date '+%Y-%m-%dT%H:%M:%S')] $*"; }
die() { log "ERROR: $*"; exit 1; }

[[ "${EUID:-$(id -u)}" -eq 0 ]] || die "Run as root"

log "=== Purrsurance startup (Amazon Linux) ==="

install_buildx() {
  local buildx_version="${BUILDX_VERSION:-v0.21.1}" arch
  case "$(uname -m)" in
    x86_64) arch=amd64 ;;
    aarch64) arch=arm64 ;;
    *) die "Unsupported CPU arch: $(uname -m)" ;;
  esac
  mkdir -p /usr/local/lib/docker/cli-plugins
  curl -fsSL "https://github.com/docker/buildx/releases/download/${buildx_version}/buildx-${buildx_version}.linux-${arch}" \
    -o /usr/local/lib/docker/cli-plugins/docker-buildx
  chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx
  docker buildx version
}

if ! command -v docker &>/dev/null; then
  dnf install -y docker git awscli jq
  systemctl enable --now docker
fi

log "Ensuring Docker Buildx (Compose build requires >= 0.17)..."
install_buildx

if [[ "$PURRSURANCE_SKIP_GIT" != "1" && -n "$PURRSURANCE_REPO_URL" ]]; then
  if [[ -d "${PURRSURANCE_APP_DIR}/.git" ]]; then
    git -C "$PURRSURANCE_APP_DIR" pull --ff-only origin "$PURRSURANCE_REPO_BRANCH" || true
  else
    git clone --branch "$PURRSURANCE_REPO_BRANCH" --depth 1 "$PURRSURANCE_REPO_URL" "$PURRSURANCE_APP_DIR"
  fi
fi

[[ -d "$PURRSURANCE_BACKEND_DIR" ]] || die "Backend not found: $PURRSURANCE_BACKEND_DIR"

ENV_FILE="${PURRSURANCE_BACKEND_DIR}/.env"
if [[ ! -f "$ENV_FILE" && -n "$PURRSURANCE_ENV_SSM_PARAM" ]]; then
  aws ssm get-parameter --name "$PURRSURANCE_ENV_SSM_PARAM" --with-decryption \
    --query 'Parameter.Value' --output text > "$ENV_FILE"
  chmod 600 "$ENV_FILE"
fi

cd "$PURRSURANCE_BACKEND_DIR"
COMPOSE=(docker compose)

"${COMPOSE[@]}" build
"${COMPOSE[@]}" up -d

for _ in $(seq 1 60); do
  "${COMPOSE[@]}" exec -T app php -r 'exit(0);' 2>/dev/null && break
  sleep 2
done

"${COMPOSE[@]}" exec -T app composer install --no-interaction --prefer-dist --optimize-autoloader
"${COMPOSE[@]}" exec -T app php artisan migrate --force
"${COMPOSE[@]}" exec -T app npm ci || "${COMPOSE[@]}" exec -T app npm install
"${COMPOSE[@]}" exec -T app npm run build
"${COMPOSE[@]}" exec -T app test -f public/build/manifest.json || die "Vite build failed: public/build/manifest.json missing"
"${COMPOSE[@]}" exec -T --user root app chown -R www-data:www-data storage bootstrap/cache
"${COMPOSE[@]}" exec -T --user root app chmod -R ug+rwX storage bootstrap/cache
"${COMPOSE[@]}" exec -T app php artisan optimize

systemctl enable purrsurance-backend.service 2>/dev/null || true
"${COMPOSE[@]}" ps
log "=== Complete ==="
