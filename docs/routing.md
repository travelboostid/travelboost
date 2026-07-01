# Routing

Travelboost uses one Laravel app for the main site, company landing pages (subdomains and custom domains), dashboards, and admin.

Doc index: [README](../README.md) · Stack overview: [Architecture](./architecture.md)

---

## Route load order

[`routes/web.php`](../routes/web.php) loads route files in this order:

| Order | File            | Role                                                                                                      |
| ----- | --------------- | --------------------------------------------------------------------------------------------------------- |
| 1     | `customers.php` | Tenant subdomain routes — registered **first** so `{username}.APP_HOST` wins over the main marketing host |
| 2     | `common.php`    | Marketing site, auth, cross-tenant bookings, **webhooks** (`/webhooks/*`), Caddy domain verification      |
| 3     | `me.php`        | Authenticated user profile, onboarding, team invitations                                                  |
| 4     | `webapi.php`    | Session JSON API at `/webapi`                                                                             |
| 5     | `companies.php` | Company login/register and `/companies/{company}/dashboard/*`                                             |
| 6     | `admin.php`     | Platform admin at `/admin/*` (main domain only)                                                           |
| 7     | `affiliate.php` | Affiliate panel                                                                                           |

Without registering `customers.php` before `common.php`, domain/subdomain patterns would conflict — e.g. `{username}.travelboost.co.id/` must resolve to a company landing page, not the marketing homepage.

`channels.php` and `console.php` are loaded separately (broadcast authorization and scheduler).

---

## Domain resolution

- Middleware `DomainResolver` sets tenant context before controllers run.
- `HomeDispatcherController` routes `/` to the correct homepage (marketing vs affiliate vs tenant landing page).
- Webhook routes in `common.php` are CSRF-exempt — see `bootstrap/app.php` (`webhooks/*`).

Full tenancy model: [Architecture — Multi-Tenancy](./architecture.md).

---

## Where to look

| Area                                | Route files                                    |
| ----------------------------------- | ---------------------------------------------- |
| Tenant storefront                   | `routes/customers.php`                         |
| Marketing, auth, bookings, webhooks | `routes/common.php`                            |
| User profile & onboarding           | `routes/me.php`                                |
| Company / affiliate dashboards      | `routes/companies.php`, `routes/affiliate.php` |
| Platform admin                      | `routes/admin.php`                             |
| JSON API for React                  | `routes/webapi.php` (prefix `/webapi`)         |

Webhook paths and payment integration testing: [Integrations](./integrations.md) · [Cloudflare Tunnel](./cloudflare-tunnel.md).
