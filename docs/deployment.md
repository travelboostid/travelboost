# Deployment

Release workflow for `tb-app-dev` and `tb-app-main`. Server names and IPs: [Server Inventory](./server-inventory.md). First-time server setup: [Production App Server](./production-app-server.md).

Doc index: [README](../README.md)

App path on servers: `~/travelboost` (see `DEPLOY_TARGET_PATH` in `.env.preset.*`). Deploys track the branch set in `DEPLOY_BRANCH` (`dev` or `main`).

---

## Prerequisites (dev machine)

| Tool           | Purpose                                                                         |
| -------------- | ------------------------------------------------------------------------------- |
| **SSH**        | Remote git pull, `.env` upload, supervisor restart                              |
| **rsync**      | Upload `public/build/` to VPS (`scp` fallback if rsync is missing)              |
| **AWS CLI v2** | Inspect and manage S3 media buckets — see [Object Storage](./object-storage.md) |

Install AWS CLI v2:

```text
https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
```

Verify:

```bash
aws --version
```

Configure credentials for Neo object storage (use a Biznet GIO key with appropriate IAM policy):

```bash
aws configure --profile travelboost-s3
# AWS Access Key ID: ...
# AWS Secret Access Key: ...
# Default region: us-east-1
# Default output format: json
```

Example — list media bucket:

```bash
aws s3 ls s3://tb-media-dev --endpoint-url https://nos.wjv-1.neo.id --profile travelboost-s3
```

Deploy env vars live in `.env.preset.<name>` (loaded by `scripts/dev-deploy.mjs`):

```env
DEPLOY_BRANCH=dev
DEPLOY_SSH_USER=travelboost
DEPLOY_SSH_HOST=103.127.138.76
DEPLOY_TARGET_PATH=~/travelboost
```

SSH key auth is required — ask a teammate to register your key if needed.

---

## Connect

```bash
ssh travelboost@<server-ip>
cd ~/travelboost
```

---

## Backend

```bash
git pull origin dev    # or main on tb-app-main
composer install --no-dev --optimize-autoloader   # omit --no-dev on dev if you need dev tools
```

Update `.env` when new variables are introduced (upload from the matching `.env.preset.*`), then:

```bash
php artisan migrate --force
php artisan optimize:clear
```

Never run `migrate:fresh` on production — it drops all data.

---

## Frontend

Build locally (VPS has limited RAM), then upload to the server:

```bash
pnpm dev:setenv    # pick the target environment preset
pnpm build
```

Copy `public/build/` to `~/travelboost/public/build/` on the server (replace existing files). Assets are served from the VPS disk, not S3.

---

## Restart services

```bash
sudo supervisorctl restart all
```

Restarts queue workers, scheduler, and Reverb with the new code.

---

## Shortcut

From your dev machine:

```bash
pnpm dev:deploy
```

Runs `scripts/dev-deploy.mjs` — automates prechecks, backend steps, local build, and `rsync` upload.

Common options:

```bash
pnpm dev:deploy -- -e dev              # preset .env.preset.dev (default)
pnpm dev:deploy -- -e main             # production preset
pnpm dev:deploy -- --skip-frontend     # backend only
pnpm dev:deploy -- --skip-backend      # frontend build + upload only
pnpm dev:deploy -- --skip-local-branch # skip local branch vs DEPLOY_BRANCH check
pnpm dev:deploy -- --help
```

The script uploads `.env.preset.<name>` to the server as `.env`, pulls git on the VPS, runs composer/migrate/optimize/supervisor (unless skipped), builds with pnpm, and syncs `public/build/`.

User media uploads on live servers use S3 (`FILESYSTEM_DISK=s3`) — manage buckets with the AWS CLI; see [Object Storage (S3)](./object-storage.md).
