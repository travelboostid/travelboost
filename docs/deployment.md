# Deployment

Release workflow for `tb-app-dev` and `tb-app-main`. Server names and IPs: [Server Inventory](./server-inventory.md). First-time server setup: [Production App Server](./production-app-server.md).

Doc index: [README](../README.md) · When to deploy: [Development Flow](./development-flow.md)

App path on servers: `~/travelboost` (see `DEPLOY_TARGET_PATH` in `.env.preset.*`). Deploys track the branch set in `DEPLOY_BRANCH` (`dev` or `main`).

---

## Environment presets (deploy)

Deploy reads `.env.preset.<name>` directly — you do **not** need `pnpm dev:setenv` first. The script loads the full preset into the process environment so `pnpm build` uses the correct `VITE_*` and app URLs.

| Preset (`-e`)   | Server      | Site                  |
| --------------- | ----------- | --------------------- |
| `dev` (default) | tb-app-dev  | dev.travelboost.co.id |
| `main`          | tb-app-main | travelboost.co.id     |

Host names, IPs, app↔DB pairing, and SSH user: [Server Inventory](./server-inventory.md). Env variable reference: [Configuration](./configuration.md).

Local-only presets (`local`, `tunnel`) are for development — see [Local Development](./local-development.md).

Deploy-specific variables in each preset:

```env
DEPLOY_BRANCH=dev
APP_IP_HOST=103.127.138.76
DEPLOY_SSH_USER=travelboost
DEPLOY_SSH_HOST=${APP_IP_HOST}
DEPLOY_TARGET_PATH=~/travelboost
```

SSH key auth is required — ask a teammate to register your key if needed.

---

## Prerequisites (dev machine)

| Tool           | Purpose                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| **SSH**        | Remote git pull, `.env` upload, supervisor restart                                                         |
| **rsync**      | Upload `public/build/` to VPS (`scp` fallback if rsync is missing)                                         |
| **AWS CLI v2** | Inspect and manage S3 media buckets — install and configure per [Object Storage (S3)](./object-storage.md) |

AWS CLI is **not** required for deploy itself — only for S3 media debugging and bucket management.

---

## Before you deploy

1. **Commit and push** your changes to `origin` — the script runs `git pull` on the VPS; unpushed commits will not reach the server.
2. **Clean working tree** — uncommitted changes block deploy.
3. **Correct branch** — local branch must match `DEPLOY_BRANCH` (unless `--skip-local-branch`).
4. **VPS branch** — remote repo on the server must already be on `DEPLOY_BRANCH` (unless `--skip-remote-branch`).

---

## Automated deploy (recommended)

From your dev machine:

```bash
pnpm dev:deploy
```

Runs `scripts/dev-deploy.mjs`. Each step prints `> command` and streams output so long runs (composer, build) do not look frozen.

### What the script does

1. **Prechecks** — local branch, clean git tree, remote VPS branch
2. **Backend** (unless `--skip-backend`):
    - `git pull origin <DEPLOY_BRANCH>` on the VPS
    - Upload `.env.preset.<name>` as `~/travelboost/.env`
    - `composer install --no-dev --optimize-autoloader`
    - `php artisan migrate --force`
    - `php artisan optimize:clear` then `php artisan optimize` (config/route/view cache)
    - `sudo chown -R travelboost:www-data storage bootstrap/cache`
    - `sudo chmod -R 775 storage bootstrap/cache`
    - `sudo chmod -R g+w storage/logs`
    - `sudo supervisorctl restart all`
3. **Frontend** (unless `--skip-frontend`):
    - `pnpm install --frozen-lockfile` and `pnpm build` locally
    - `rsync -rlvz --delete --no-perms --chmod=D755,F644 public/build/` to the VPS (`scp` fallback)
    - `find public/build -type d/f -exec chmod 755/644` on VPS to ensure Caddy can serve assets

User media on live servers uses S3 (`FILESYSTEM_DISK=s3`). Frontend assets are served from VPS disk (`public/build/`), not S3 — see [Object Storage (S3)](./object-storage.md).

### CLI options

Pass flags after `--` so pnpm does not swallow them:

```bash
pnpm dev:deploy -- -e dev              # .env.preset.dev (default)
pnpm dev:deploy -- -e main             # production preset → tb-app-main
pnpm dev:deploy -- --skip-frontend     # backend only
pnpm dev:deploy -- --skip-backend      # frontend build + upload only
pnpm dev:deploy -- --skip-composer     # skip remote composer install
pnpm dev:deploy -- --skip-migrate      # skip remote migrate --force
pnpm dev:deploy -- --skip-optimize     # skip remote optimize:clear && optimize
pnpm dev:deploy -- --skip-supervisor     # skip supervisorctl restart
pnpm dev:deploy -- --skip-local-branch # skip local branch vs DEPLOY_BRANCH check
pnpm dev:deploy -- --skip-remote-branch # skip VPS branch vs DEPLOY_BRANCH check
pnpm dev:deploy -- --help
```

---

## Manual deploy

Use when debugging or when you need finer control than the script provides.

### Connect

```bash
ssh travelboost@<server-ip>
cd ~/travelboost
```

### Backend

```bash
git pull origin dev    # or main on tb-app-main
composer install --no-dev --optimize-autoloader   # omit --no-dev on dev if you need dev tools
```

Update `.env` when new variables are introduced (copy from the matching `.env.preset.*`), then:

```bash
php artisan migrate --force
php artisan optimize:clear
sudo chown -R travelboost:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
sudo chmod -R g+w storage/logs
```

Never run `migrate:fresh` on production — it drops all data.

### Frontend

Build locally (VPS has limited RAM), then upload:

```bash
pnpm dev:setenv    # pick the target environment preset for Vite env vars
pnpm build
```

Copy `public/build/` to `~/travelboost/public/build/` on the server. After copying, run:

```bash
find ~/travelboost/public/build -type d -exec chmod 755 {} +
find ~/travelboost/public/build -type f -exec chmod 644 {} +
```

Or use `pnpm dev:deploy -- --skip-backend` to build, rsync, and fix permissions automatically.

### Restart services

```bash
sudo supervisorctl restart all
```

Restarts queue workers, scheduler, and Reverb with the new code.

### Fix storage permissions (when needed)

Web requests run as `www-data` (PHP-FPM); workers run as `travelboost` (Supervisor). `storage/` and `bootstrap/cache/` must be group-writable by `www-data` (owner `travelboost:www-data`, mode `775`).

If permissions drift after deploy, you may see **500** with `tempnam(): file created in the system's temporary directory` (Blade cannot write compiled views) or `Permission denied` in `storage/logs/laravel.log`.

`pnpm dev:deploy` reapplies ownership and permissions automatically after `optimize:clear`. To fix manually:

```bash
cd ~/travelboost
sudo chown -R travelboost:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
sudo chmod -R g+w storage/logs
sudo -u www-data test -w storage/logs/laravel.log && echo "OK"
```

Full first-time setup: [Production App Server — Configuring Permissions](./production-app-server.md#configuring-permissions).
