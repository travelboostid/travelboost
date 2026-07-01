# Infrastructure & platform backlog

Living list of **planned improvements** — not committed work. Update this doc when an item is picked up, shipped, or dropped.

Doc index: [README](../README.md)

**How to use this doc**

- Each item has **why** (problem today), **direction** (what we are considering), and **notes** (links, risks).
- Juniors: read for context; do not start large items without a senior and a ticket/PR plan.
- When something ships, move it to a short “Done” note or delete the section and link to the real doc in `docs/`.

---

## Email — AWS SES with per-tenant (per company) sending

**Status:** Not started

### Why

Today all outbound mail uses a **single** global `MAIL_FROM_ADDRESS` from `.env` ([`config/mail.php`](../config/mail.php)). Booking confirmations, verification emails, and team invites appear to come from one platform address.

Product goal: each **agent company** (our B2B customer) should send email **as their brand** — e.g. `noreply@agentname.travelboost.co.id` or `bookings@their-custom-domain.com` — so end travellers trust the sender and reply paths make sense.

### Direction

Integrate **Amazon SES** (Laravel already has an `ses` mailer stub in `config/mail.php`):

| Piece            | Idea                                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Transport        | `MAIL_MAILER=ses` on staging/production; IAM user/role with `ses:SendEmail`                                                                     |
| Per-tenant From  | Store verified sender identity per `Company` (or `Domain`) — address + display name                                                             |
| Verification     | SES domain/email verification or Easy DKIM per agent subdomain or custom domain                                                                 |
| Notifications    | Update `MailMessage` / notification classes to set `->from()` from tenant context (today most use default only)                                 |
| Bounce/complaint | SNS → webhook or queue for suppression list                                                                                                     |
| Dev/testing      | Keep `log` driver locally; staging can use SES sandbox or dedicated test identities — see [Testing Email Accounts](./testing-email-accounts.md) |

### Open questions

- One SES configuration set per company vs shared set with tags?
- Do vendors need separate sending identities, or agents only?
- How do custom agent domains ([`domains` table](../docs/database-design.md)) tie into SES domain verification vs only Cloudflare/DNS?
- Indonesia deliverability: SPF/DKIM/DMARC for `travelboost.co.id` and per-tenant subdomains — coordinate with [Cloudflare DNS](./cloudflare-dns.md) (MX is Google Workspace today).

### References

- [Laravel mail — Amazon SES](https://laravel.com/docs/mail#driver-prerequisites)
- [AWS SES verified identities](https://docs.aws.amazon.com/ses/latest/dg/verify-addresses-and-domains.html)

---

## Application server — move beyond PHP-FPM

**Status:** Idea / spike

### Why

Current stack: **Caddy** → **PHP-FPM** (`php_fastcgi`) → Laravel ([`docs/caddy.md`](./caddy.md)). This is the classic, stable model but:

- Every request boots Laravel from a clean state (unless optimized with config/route caching).
- PHP-FPM + Caddy is two processes to tune (workers, `pm.max_children`, slow logs).
- Long-lived connections (Octane) can reduce latency for dashboard-heavy traffic.

### Direction (options under consideration)

| Option                                                                                   | Summary                                                                                                                 | Fit for Travelboost                                                                                     |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **[FrankenPHP](https://frankenphp.dev/)**                                                | Caddy module — PHP runs **inside** Caddy via worker mode; official Laravel docs for `php-server` and Octane integration | **Strongest fit** — we already standardized on Caddy; could replace `php_fastcgi` + FPM with one binary |
| **[Laravel Octane](https://laravel.com/docs/octane)** + FrankenPHP / Swoole / RoadRunner | Keeps Laravel API; workers stay warm between requests                                                                   | Good if profiling shows bootstrap cost matters; requires careful state hygiene (singletons, auth)       |
| **RoadRunner / Spiral**                                                                  | Separate Go server + PHP workers                                                                                        | More moving parts; less alignment with current Caddy-centric ops                                        |
| **Stay on PHP-FPM**                                                                      | Optimize OPcache, Redis session/cache, DB queries first                                                                 | Lowest risk; may be enough for current scale                                                            |

### Suggested spike order

1. Benchmark TTFB on a representative dashboard route with current PHP-FPM baseline.
2. Local/dev FrankenPHP trial with `frankenphp php-server` or Caddy FrankenPHP image.
3. Run Pest suite under Octane worker mode and fix state leaks if any.
4. Only then change production `Caddyfile` and systemd layout.

### Risks

- Octane incompatible patterns in app code (static state, `die()`, some packages).
- Deploy/runbook changes ([Production App Server](./production-app-server.md)).
- Reverb, queue workers, and scheduler stay separate regardless — this only affects **HTTP**.

---

## DNS & TLS — paid Cloudflare plan (deep subdomains + simpler SSL)

**Status:** Under consideration

### Why

Staging uses **grey-cloud** DNS and **Caddy on-demand TLS** for `{username}.dev.travelboost.co.id` because Cloudflare **Advanced Certificate Manager** charges for deep wildcards like `*.*.travelboost.co.id` ([Cloudflare DNS — staging](./cloudflare-dns.md#ssltls-strategy)).

That works but adds operational complexity:

- Dev server must obtain and renew many Let's Encrypt certs.
- Staging and production behave differently (proxy vs DNS-only).
- Custom agent domains still need Caddy `on_demand_tls` + [`CaddyController`](../app/Http/Controllers/CaddyController.php) (currently always returns `200` — see below).

### Direction

Evaluate a **paid Cloudflare** offering:

| Product                                                                                                                       | What it could simplify                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **[Advanced Certificate Manager](https://developers.cloudflare.com/ssl/edge-certificates/advanced-certificate-manager/)**     | Total TLS wildcard coverage for `*.dev.travelboost.co.id` and deeper patterns at the **edge** — orange-cloud staging like production |
| **[Cloudflare for SaaS](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/)** (Custom Hostnames) | Automatic edge certificates for **agent custom domains** — similar to “Caddy auto SSL” but at Cloudflare; customer CNAMEs to us      |

**If adopted:**

- Proxy `dev.travelboost.co.id` (and tenant subdomains) through Cloudflare.
- Use **Full (strict)** + origin certificate on Caddy for all app servers (same as production).
- Remove or shrink Caddy `tls { on_demand }` catch-all blocks where Cloudflare issues edge certs instead.
- Document cost vs ops time saved; update [`infra/caddy/Caddyfile.dev`](../infra/caddy/Caddyfile.dev) and [Cloudflare DNS](./cloudflare-dns.md).

### Open questions

- Exact wildcard depth needed: `*.travelboost.co.id` vs `*.dev.travelboost.co.id` vs both?
- Does Cloudflare for SaaS replace custom-domain on-demand TLS entirely, or only external domains?
- Reverb WebSockets through orange-cloud on staging — already works on production; verify dev `reverb.dev.*` path.

---

## Security — enforce custom domain TLS approval in Laravel

**Status:** Code TODO

### Why

[`CaddyController::verifyDomain`](../app/Http/Controllers/CaddyController.php) always returns `200`. Caddy will request a certificate for **any** hostname that hits the on-demand TLS catch-all if the ask endpoint allows it.

### Direction

- Check `domains` table (and `domain_enabled` flags) before returning `200`.
- Add tests for allow/deny cases.
- Document behaviour in [Caddy](./caddy.md) and [Cloudflare DNS](./cloudflare-dns.md).

---

## Caching & sessions — Redis on production app servers

**Status:** Partially documented, not default everywhere

### Why

Deploy presets support `SESSION_DRIVER=redis` and `CACHE_STORE=redis` ([Production App Server — Redis](./production-app-server.md#redis-production)) but not all environments may use them yet. Database-backed sessions add load on PostgreSQL for every dashboard request.

### Direction

- Confirm `dev` and `main` presets use Redis where `php-redis` and `redis-server` are installed.
- Measure session/cache hit rate before/after.
- Document required packages in server setup checklist.

---

## Documentation — product / workflow guides (deferred)

**Status:** Backlog (intentionally out of scope for infra docs pass)

Business-process docs not written yet — keep as product backlog, not infra:

- Booking & payment lifecycle
- Waiting list operations
- Vendor–agent partnerships
- Commission resolution at payment time

Schema reference remains in [Database Design](./database-design.md) and [Architecture](./architecture.md).

---

## How to propose a new item

Add a section with:

1. **Status** — Not started / Spike / In progress / Done
2. **Why** — problem in plain language
3. **Direction** — options considered
4. **Open questions** — what needs a decision
5. **References** — docs, ADRs, tickets

Keep items **actionable** — if it is vague, mark it as “idea” until scoped.
