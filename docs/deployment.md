# Deployment

Release workflow for `tb-app-dev` and `tb-app-main`. Server names and IPs: [Server Inventory](./server-inventory.md). First-time server setup: [Production App Server](./production-app-server.md).

Doc index: [README](../README.md)

App path on servers: `/home/travelboost/travelboost`. Deploys track the **`dev`** branch unless noted otherwise.

---

## Connect

```bash
ssh <server-ip>
cd ~/travelboost
```

SSH key auth is required — ask a teammate to register your key if needed.

---

## Backend

```bash
git pull
composer install --no-dev --optimize-autoloader   # omit --no-dev on dev servers if you need dev tools
```

Update `.env` when new variables are introduced, then:

```bash
php artisan migrate --force
php artisan optimize:clear
```

Never run `migrate:fresh` on production — it drops all data.

---

## Frontend

Build locally (VPS has limited RAM), then upload to the server:

```bash
pnpm dev:setenv    # pick the target environment
pnpm build
```

Copy `public/build/` to `~/travelboost/public/build/` on the server (replace existing files).

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

Automates build upload, cache clear, and service restart where configured.
