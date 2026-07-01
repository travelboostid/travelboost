# Caddy on the Server

How Caddy serves Travelboost on `tb-app-main` and `tb-app-dev`.

Doc index: [README](../README.md) · Install steps: [Production App Server](./production-app-server.md) · DNS & TLS: [Cloudflare DNS](./cloudflare-dns.md) · Tenant routing: [Routing](./routing.md)

---

## What Caddy does for us

Caddy is the **web server** on our VPS. It sits in front of Laravel and handles:

| Job                | How                                                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HTTPS**          | TLS certificates on port 443 (origin cert on production, Let's Encrypt on-demand on staging/custom domains)                                           |
| **Static files**   | Serves `public/` (Vite build assets, images, fonts) with cache headers                                                                                |
| **PHP**            | Forwards `.php` requests to **PHP-FPM** via `php_fastcgi`                                                                                             |
| **WebSockets**     | Reverse-proxies `reverb.*.travelboost.co.id` to Reverb on `127.0.0.1:8080`                                                                            |
| **Many hostnames** | One process accepts `travelboost.co.id`, `{username}.travelboost.co.id`, custom agent domains, etc. — Laravel picks the tenant from the `Host` header |

Local development does **not** use Caddy — we run `php artisan serve` via `pnpm dev:full`. Caddy is for **staging and production VPS only**.

### Request path (simplified)

```text
Browser  →  Cloudflare (optional)  →  Caddy :443  →  PHP-FPM  →  Laravel
                                              ↘
                                         file_server (CSS/JS/images)
```

1. User opens `https://agentname.travelboost.co.id`.
2. DNS sends them to our VPS (directly on staging, via Cloudflare on production).
3. **Caddy** terminates HTTPS and passes the request to `public/index.php` through PHP-FPM.
4. **Laravel** `DomainResolver` middleware reads the hostname and loads the correct company/tenant.

Caddy does **not** run queue workers, scheduler, or Reverb — those are separate processes under **Supervisor** ([Production App Server](./production-app-server.md)).

---

## Key capabilities

Travelboost is **multi-tenant** — many hostnames, one Laravel app, plus optional **custom domains** per agent. Caddy handles that with a small amount of config in the repo.

### On-demand TLS

When a hostname is accessed for the first time, Caddy can request a Let's Encrypt certificate automatically. Before issuing, it asks our app:

```http
GET http://127.0.0.1:8081/caddy/verify-domain?domain=example.com
```

Laravel [`CaddyController`](../app/Http/Controllers/CaddyController.php) returns `200` (allow) or `403` (deny). That lets agents attach custom domains without an ops ticket for every cert.

### Wildcard + catch-all in one file

Production uses a fixed origin certificate for `travelboost.co.id` and `*.travelboost.co.id`, plus a catch-all `https://` block for external custom domains — see [`infra/caddy/Caddyfile.main`](../infra/caddy/Caddyfile.main).

Staging uses on-demand TLS for `{username}.dev.travelboost.co.id` — [Cloudflare DNS — staging](./cloudflare-dns.md#ssltls-strategy).

### PHP-FPM via `php_fastcgi`

Laravel's `public/` docroot and PHP-FPM socket in a few lines:

```caddyfile
root * /home/travelboost/travelboost/public
php_fastcgi unix//run/php/php8.5-fpm.sock
file_server
```

### Static asset caching

The shared `cache_static` snippet in both Caddyfiles sets long cache headers for Vite hashed assets under `/build/assets/`.

### Future: FrankenPHP

A possible evolution is running PHP inside Caddy (FrankenPHP) instead of a separate PHP-FPM pool — [Infrastructure backlog](./todos.md#application-server--move-beyond-php-fpm).

---

## Config files in the repo

| File                                                          | Server        | Purpose    |
| ------------------------------------------------------------- | ------------- | ---------- |
| [`infra/caddy/Caddyfile.main`](../infra/caddy/Caddyfile.main) | `tb-app-main` | Production |
| [`infra/caddy/Caddyfile.dev`](../infra/caddy/Caddyfile.dev)   | `tb-app-dev`  | Staging    |

Install on the VPS:

```bash
cd ~/travelboost
sudo cp infra/caddy/Caddyfile.main /etc/caddy/Caddyfile   # or Caddyfile.dev on tb-app-dev
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Full first-time install (packages, `setcap`, systemd): [Production App Server — Installing Caddy](./production-app-server.md#installing-caddy).

### What each block does (production)

| Block                                    | Listens for                               | TLS                         | Backend                                            |
| ---------------------------------------- | ----------------------------------------- | --------------------------- | -------------------------------------------------- |
| `:8081` (localhost only)                 | Internal HTTP                             | None                        | PHP-FPM — used by `on_demand_tls` **ask** callback |
| `reverb.travelboost.co.id`               | Reverb subdomain                          | Auto / LE                   | `reverse_proxy 127.0.0.1:8080`                     |
| `travelboost.co.id, *.travelboost.co.id` | Main site + one-level tenant subdomains   | Cloudflare **origin cert**  | PHP-FPM + static files                             |
| `https://` (catch-all)                   | Any other HTTPS hostname (custom domains) | **On-demand** Let's Encrypt | PHP-FPM + static files                             |

Staging [`Caddyfile.dev`](../infra/caddy/Caddyfile.dev) is similar but uses on-demand TLS for tenant subdomains under `dev.travelboost.co.id` instead of the Cloudflare origin cert — [Cloudflare DNS — staging](./cloudflare-dns.md#ssltls-strategy).

---

## PHP-FPM and users

| Process                        | Unix user     | Notes                                                            |
| ------------------------------ | ------------- | ---------------------------------------------------------------- |
| Caddy / PHP-FPM (web requests) | `www-data`    | Must write to `storage/` and `bootstrap/cache/`                  |
| Queue, scheduler, Reverb       | `travelboost` | Supervisor — [Production App Server](./production-app-server.md) |

If the site returns **500** with permission errors in `storage/logs/laravel.log`, see [Deployment — Fix storage permissions](./deployment.md#fix-storage-permissions-when-needed).

---

## Day-to-day operations

### Check Caddy is listening

```bash
ss -tlnp | grep -E ':80|:443'
sudo systemctl status caddy
```

### After editing the Caddyfile in the repo

```bash
cd ~/travelboost
git pull   # get latest infra/caddy/*
sudo cp infra/caddy/Caddyfile.main /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

**Do not** run `caddy start` while `caddy.service` is active — port `2019` will conflict. Use `systemctl reload caddy`.

### Logs

```bash
sudo journalctl -u caddy -f
```

Laravel application errors are still in `~/travelboost/storage/logs/laravel.log`.

---

## Changing Caddy config safely

1. Edit `infra/caddy/Caddyfile.main` or `Caddyfile.dev` in a **feature branch** and open a PR.
2. Explain which hostnames are affected (production apex, Reverb, custom domains).
3. After merge and deploy, SSH to the server and run validate + reload (above).
4. Smoke-test: main site, one tenant subdomain, Reverb if you touched that block.

For **new fixed subdomains** (e.g. `api.travelboost.co.id`), also add a Cloudflare DNS record — [Cloudflare DNS — Operational checklist](./cloudflare-dns.md#operational-checklist).

---

## Related docs

| Topic                                                 | Doc                                                 |
| ----------------------------------------------------- | --------------------------------------------------- |
| First-time Caddy install, `setcap`, origin cert paths | [Production App Server](./production-app-server.md) |
| Cloudflare proxy, origin cert, staging TLS            | [Cloudflare DNS](./cloudflare-dns.md)               |
| How Laravel uses the `Host` header                    | [Routing](./routing.md)                             |
| Reverb env vars                                       | [Integrations](./integrations.md)                   |
| Deploy workflow                                       | [Deployment](./deployment.md)                       |
