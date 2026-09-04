#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/deploy-production.sh [--dry-run]

Deploys an already-approved commit to Digicom LXC 101 through the Proxmox host.
The script requires CI to be checked by the GitHub Actions workflow before this
script runs in deploy mode.
USAGE
}

DRY_RUN=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: ${name}" >&2
    exit 1
  fi
}

shell_quote() {
  printf '%q' "$1"
}

require_env DEPLOY_SHA
require_env PROD_SSH_HOST
require_env PROD_SSH_PORT
require_env PROD_SSH_USER
require_env PROD_APP_PATH

if [[ ! "$DEPLOY_SHA" =~ ^[0-9a-fA-F]{40}$ ]]; then
  echo "DEPLOY_SHA must be a 40-character Git commit SHA." >&2
  exit 1
fi

if [[ "$DRY_RUN" == true ]]; then
  echo "Dry run: deployment environment is complete."
  echo "Dry run: would deploy commit ${DEPLOY_SHA} to Digicom LXC 101 through the configured Proxmox SSH host."
  echo "Dry run: no SSH, production process, Caddy, Proxmox, MikroTik, or database command was executed."
  exit 0
fi

require_env PROD_SSH_KEY_FILE
if [[ ! -f "$PROD_SSH_KEY_FILE" ]]; then
  echo "PROD_SSH_KEY_FILE does not point to an SSH key file." >&2
  exit 1
fi

APP_PATH_QUOTED="$(shell_quote "$PROD_APP_PATH")"
TARGET_SHA_QUOTED="$(shell_quote "$DEPLOY_SHA")"
SMOKE_URL_QUOTED="$(shell_quote "${PROD_SMOKE_URL:-http://127.0.0.1:3000/api/v1/health}")"
PROCESS_NAME_QUOTED="$(shell_quote "${PROD_PM2_PROCESS_NAME:-api_talleres}")"

REMOTE_SCRIPT=$(cat <<REMOTE
set -Eeuo pipefail
app_path=${APP_PATH_QUOTED}
target_sha=${TARGET_SHA_QUOTED}
smoke_url=${SMOKE_URL_QUOTED}
process_name=${PROCESS_NAME_QUOTED}

cd "\$app_path"

if [[ -n "\$(git status --porcelain)" ]]; then
  echo "Production tree is dirty; refusing to deploy." >&2
  git status --short >&2
  exit 1
fi

previous_commit="\$(git rev-parse HEAD)"
echo "Previous commit: \$previous_commit"

git fetch --prune origin
git reset --hard "\$target_sha"
npm ci --omit=dev

if ! command -v pm2 >/dev/null 2>&1; then
  echo "PM2 is required for this deployment, but pm2 was not found." >&2
  exit 1
fi

if [[ -f ecosystem.config.js ]]; then
  pm2 startOrReload ecosystem.config.js --env production --update-env
else
  pm2 restart "\$process_name" --update-env
fi
pm2 save

curl -fsS --max-time 10 "\$smoke_url" >/dev/null

echo "Deployment smoke check passed for /api/v1/health."
echo "Rollback command inside the app path: git reset --hard \$previous_commit && npm ci --omit=dev && pm2 startOrReload ecosystem.config.js --env production --update-env"
REMOTE
)

REMOTE_SCRIPT_QUOTED="$(shell_quote "$REMOTE_SCRIPT")"

ssh \
  -i "$PROD_SSH_KEY_FILE" \
  -p "$PROD_SSH_PORT" \
  -o IdentitiesOnly=yes \
  -o StrictHostKeyChecking=accept-new \
  "$PROD_SSH_USER@$PROD_SSH_HOST" \
  "pct exec 101 -- bash -lc ${REMOTE_SCRIPT_QUOTED}"
