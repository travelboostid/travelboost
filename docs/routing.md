# Routing

Travelboost uses one Laravel app for the main site, company landing pages (subdomains and custom domains), dashboards, and admin.

Doc index: [README](../README.md)

## Route priority

`routes/tenant.php` is registered **before** other route files. That way:

- `{username}.travelboost.co.id/` → company landing page
- `travelboost.co.id/` → marketing homepage

Without this order, domain/subdomain patterns would conflict.

## Where to look

| Area                           | Route files                                    |
| ------------------------------ | ---------------------------------------------- |
| Tenant storefront              | `routes/tenant.php`, `routes/customers.php`    |
| Company / affiliate dashboards | `routes/companies.php`, `routes/affiliate.php` |
| Platform admin                 | `routes/admin.php`                             |
| JSON API for React             | `routes/webapi.php` (prefix `/webapi`)         |
| Webhooks                       | `routes/webhooks.php`                          |

Middleware `DomainResolver` sets tenant context before controllers run. See [Architecture](./architecture.md).
