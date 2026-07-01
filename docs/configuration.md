# Configuration

How environment files are organized — presets, core variables, and what to update when adding new config.

Doc index: [README](../README.md)

---

## Presets (`.env.preset.*`)

Preset files live at the project root. They are the source of truth for each environment.

| Preset   | When to use                                                           | Apply locally                                  |
| -------- | --------------------------------------------------------------------- | ---------------------------------------------- |
| `local`  | Normal UI work on `lvh.me`, local PostgreSQL, `MAIL_MAILER=log`       | `pnpm dev:setenv` → copies to `.env`           |
| `tunnel` | Payment webhooks, OAuth callbacks via `tunnel-8000.travelboost.co.id` | `pnpm dev:setenv`                              |
| `dev`    | Deploy target for staging (`tb-app-dev`)                              | Deploy reads preset directly — no `dev:setenv` |
| `main`   | Deploy target for production (`tb-app-main`)                          | Deploy reads preset directly                   |

**Local work:** `pnpm dev:setenv` copies a preset to `.env`.

**Deploy:** `pnpm dev:deploy` loads `.env.preset.<name>` into the deploy process and uploads it as `~/travelboost/.env` on the server. You do **not** need `pnpm dev:setenv` before deploy.

First-time clone: `pnpm dev:init` runs `dev:setenv` as part of setup. Ask a teammate for preset files if they are missing from your clone.

Full preset → host/URL/server mapping: [Server Inventory](./server-inventory.md).

---

## Preset → environment map

| Preset   | App URL (typical)                       | Database         | Deploy server | Branch |
| -------- | --------------------------------------- | ---------------- | ------------- | ------ |
| `local`  | `http://lvh.me:8000`                    | Local PostgreSQL | —             | —      |
| `tunnel` | `https://tunnel-8000.travelboost.co.id` | Local PostgreSQL | —             | —      |
| `dev`    | `https://dev.travelboost.co.id`         | `tb-db-dev`      | `tb-app-dev`  | `dev`  |
| `main`   | `https://travelboost.co.id`             | `tb-db-main`     | `tb-app-main` | `main` |

S3 buckets, mail drivers, and gateway keys differ per preset — see [Integrations](./integrations.md) and [Object Storage](./object-storage.md).

Tunnel setup: [Cloudflare Tunnel](./cloudflare-tunnel.md). Deploy commands: [Deployment](./deployment.md).

---

## Core application variables

| Variable                                        | Purpose                                                     |
| ----------------------------------------------- | ----------------------------------------------------------- |
| `APP_URL`, `APP_HOST`, `APP_PORT`, `APP_SCHEME` | Public app URL and host routing                             |
| `VITE_APP_*`                                    | Frontend mirror of app URL (Vite build and Orval fetch URL) |
| `DB_*`                                          | PostgreSQL connection                                       |
| `SESSION_DRIVER`, `CACHE_STORE`                 | `database` locally; deploy presets may use `redis`          |
| `FILESYSTEM_DISK`                               | `local` for dev; `s3` on staging/production                 |
| `QUEUE_CONNECTION`                              | `sync` locally; `database` or `redis` on servers            |
| `BROADCAST_CONNECTION`                          | `reverb` when using websockets                              |

Reference template: [`.env.example`](../.env.example) at the project root.

---

## Deploy variables

Present in `dev` and `main` presets:

```env
DEPLOY_BRANCH=dev
APP_IP_HOST=103.127.138.76
DEPLOY_SSH_USER=travelboost
DEPLOY_SSH_HOST=${APP_IP_HOST}
DEPLOY_TARGET_PATH=~/travelboost
```

Server names and IPs: [Server Inventory](./server-inventory.md). Deploy workflow: [Deployment](./deployment.md).

---

## Integration variables

Payment gateways, OAuth, S3, Reverb, and mail use env vars documented in [Integrations](./integrations.md). Do not duplicate full setup here — link to the integration doc and the relevant preset.

---

## Adding or changing env vars

When you introduce a new variable:

1. Add it to [`.env.example`](../.env.example) with a safe default or empty placeholder
2. Update every affected `.env.preset.*` (ask a teammate for values not in the repo)
3. Note the change in your PR description ([Team SOP — Deploy awareness](./team-sop.md#deploy-awareness))
4. If the variable controls an external service, add a row to [Integrations](./integrations.md)

Never commit secrets, production keys, or personal `.env` files.

---

## Related docs

| Topic                         | Doc                                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| Local setup & `pnpm dev:full` | [Local Development](./local-development.md)                                         |
| External services & webhooks  | [Integrations](./integrations.md)                                                   |
| Payment/OAuth tunnel testing  | [Cloudflare Tunnel](./cloudflare-tunnel.md) · [Cloudflare DNS](./cloudflare-dns.md) |
| S3 buckets & AWS CLI          | [Object Storage](./object-storage.md)                                               |
| Deploy presets & script       | [Deployment](./deployment.md)                                                       |
| Bulk test signups & mail      | [Testing Email Accounts](./testing-email-accounts.md)                               |
