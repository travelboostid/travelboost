# Travelboost

Multi-tenant travel platform — Laravel 13, Inertia, React 19.

---

## Quick start

Ask a teammate for `.env` values. Presets live in `.env.preset.*` at the project root.

| Preset   | Purpose                                      |
| -------- | -------------------------------------------- |
| `local`  | Default local dev (`lvh.me`)                 |
| `tunnel` | Payment/OAuth webhooks via Cloudflare tunnel |
| `dev`    | Deploy to dev server (`pnpm dev:deploy`)     |
| `main`   | Deploy to production server                  |

```bash
git clone <repository-url>
cd travelboost
pnpm dev:init      # composer + pnpm install, pick env preset
pnpm dev:full      # Laravel, Vite, queue, Reverb
```

Other dev commands: `pnpm dev:min` (server + Vite only), `pnpm dev` (interactive menu).

**Full local setup:** [Local Development](./docs/local-development.md) · **Env reference:** [Configuration](./docs/configuration.md)

---

## Documentation

### Development

| Doc                                                            | When to read                                      |
| -------------------------------------------------------------- | ------------------------------------------------- |
| [Local Development](./docs/local-development.md)               | First-time setup, PHP extensions, `pnpm dev:full` |
| [Configuration](./docs/configuration.md)                       | Env presets, core variables, adding new config    |
| [Debugging](./docs/debugging.md)                               | Xdebug, Telescope, production logs                |
| [Development Flow](./docs/development-flow.md)                 | Clone → branch → PR → merge → deploy              |
| [Team SOP](./docs/team-sop.md)                                 | Git workflow, PRs, coding standards               |
| [Merging Branch Conflicts](./docs/merging-branch-conflicts.md) | Sync feature branch with `dev`                    |
| [Testing Email Accounts](./docs/testing-email-accounts.md)     | Bulk unique test users (33mail)                   |

### Integrations

| Doc                                              | When to read                                     |
| ------------------------------------------------ | ------------------------------------------------ |
| [Integrations](./docs/integrations.md)           | Payments, OAuth, S3, Reverb, webhooks index      |
| [Cloudflare Tunnel](./docs/cloudflare-tunnel.md) | Payment webhooks & OAuth via tunnel hostname     |
| [Web API & Orval](./docs/webapi-orval.md)        | Scramble docs, `/webapi` endpoints, `pnpm orval` |
| [Translations (i18n)](./docs/i18n.md)            | react-intl, extraction, locale files             |
| [Object Storage (S3)](./docs/object-storage.md)  | Media buckets, AWS CLI, credentials              |

### Architecture & product

| Doc                                            | When to read                           |
| ---------------------------------------------- | -------------------------------------- |
| [Architecture](./docs/architecture.md)         | Stack, tenancy, auth, major subsystems |
| [Database Design](./docs/database-design.md)   | ER diagrams, tables by domain          |
| [Routing](./docs/routing.md)                   | Route load order and domain resolution |
| [Product Requirements](./docs/requirements.md) | Landing pages, customers, wallets      |

### Production

| Doc                                                                | When to read                                |
| ------------------------------------------------------------------ | ------------------------------------------- |
| [Server Inventory](./docs/server-inventory.md)                     | Hosts, IPs, URLs, app↔DB pairing            |
| [Production App Server](./docs/production-app-server.md)           | PHP, Caddy, Supervisor, first install       |
| [Production Database Server](./docs/production-database-server.md) | PostgreSQL, pgvector, WAL-G backups         |
| [Database Backups](./docs/database-backups.md)                     | Admin backup panel, WAL-G env               |
| [Deployment](./docs/deployment.md)                                 | Pull, migrate, build, restart after release |

---

## Deploy

```bash
pnpm dev:deploy              # dev server (default preset)
pnpm dev:deploy -- -e main   # production
```

Workflow: [Development Flow](./docs/development-flow.md) · Commands: [Deployment](./docs/deployment.md)
