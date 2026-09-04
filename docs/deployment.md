# Production Deployment

Production deployment is separate from CI. CI must pass for the exact commit before the protected production workflow can deploy it.

## Target

- Network context: Digicom LAN
- Proxmox PVE: `<PROXMOX_LAN_HOST>`
- LXC 101: `<LXC_APP_LAN_IP>`
- Host command pattern: `ssh -i <ssh-key-path> -p 22 <ssh-user>@<PROXMOX_LAN_HOST> "pct exec 101 -- bash -lc '<command>'"`

The workflow must not modify Caddy, Proxmox host configuration, MikroTik rules, or database schema.

## Process manager

PM2 is selected because the SDD design prefers PM2 unless current production proves otherwise, and this slice does not execute production inspection commands. If production later proves systemd is the owner, update the decision and script before deploying.

## Required GitHub configuration

Create a protected GitHub environment named `production` with required reviewers. Define these secrets without printing their values: `PROD_SSH_HOST`, `PROD_SSH_PORT`, `PROD_SSH_USER`, `PROD_SSH_KEY`, and `PROD_APP_PATH`.

The deployment runner must have Digicom LAN access. The workflow uses the runner label `production-lan` to avoid deploying from a runner that cannot reach Proxmox.

## Deployment flow

1. A human starts `Deploy Production` with the Git ref to deploy.
2. The workflow resolves the exact commit SHA.
3. The workflow refuses to deploy unless `CI` succeeded for that SHA.
4. The workflow validates `scripts/deploy-production.sh` with `bash -n`.
5. The script executes inside LXC 101 through Proxmox.
6. The script refuses dirty production trees, records the previous commit, resets to the approved commit, runs `npm ci --omit=dev`, restarts PM2, and smoke-checks `http://127.0.0.1:3000/api/v1/health`.

## Rollback

Use the previous commit printed by the deployment script. Run this inside the application path on LXC 101:

```bash
git reset --hard <previous-commit>
npm ci --omit=dev
pm2 startOrReload ecosystem.config.js --env production --update-env
pm2 save
curl -fsS --max-time 10 http://127.0.0.1:3000/api/v1/health >/dev/null
```

Rollback still requires a clean production tree. Do not use this procedure for schema, Caddy, Proxmox, or MikroTik changes.

## Local validation without production execution

`bash -n scripts/deploy-production.sh`

`DEPLOY_SHA=0000000000000000000000000000000000000000 PROD_SSH_HOST=example.invalid PROD_SSH_PORT=22 PROD_SSH_USER=deploy PROD_APP_PATH=app-path-placeholder scripts/deploy-production.sh --dry-run`

The dry run validates required inputs but does not open SSH and does not touch LXC 101.
