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

**Full local setup:** [Local Development](./docs/local-development.md)

---

## Documentation

### Getting started

| Doc                                                            | When to read                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------------ |
| [Local Development](./docs/local-development.md)               | First-time setup, PHP extensions, `pnpm dev:full`            |
| [Testing Email Accounts](./docs/testing-email-accounts.md)     | Bulk unique test users with 33mail forwarding                |
| [Cloudflare Tunnel](./docs/cloudflare-tunnel.md)               | Payment webhooks & OAuth via `tunnel-8000.travelboost.co.id` |
| [Development Flow](./docs/development-flow.md)                 | Clone → branch → PR → merge → deploy (charts)                |
| [Merging Branch Conflicts](./docs/merging-branch-conflicts.md) | Sync feature branch with `dev` and resolve conflicts         |
| [Team SOP](./docs/team-sop.md)                                 | Git workflow, PRs, coding standards                          |

### Architecture & product

| Doc                                            | When to read                            |
| ---------------------------------------------- | --------------------------------------- |
| [Architecture](./docs/architecture.md)         | Stack, tenancy, auth, major subsystems  |
| [Database Design](./docs/database-design.md)   | ER diagrams, tables by domain           |
| [Routing](./docs/routing.md)                   | Why `routes/tenant.php` runs first      |
| [Product Requirements](./docs/requirements.md) | Landing pages, customers, chatbot scope |

### Frontend & API

| Doc                                       | When to read                                     |
| ----------------------------------------- | ------------------------------------------------ |
| [Web API & Orval](./docs/webapi-orval.md) | Scramble docs, `/webapi` endpoints, `pnpm orval` |
| [Translations (i18n)](./docs/i18n.md)     | react-intl, extraction, locale files             |

### Features

| Doc                                              | When to read                                          |
| ------------------------------------------------ | ----------------------------------------------------- |
| [Live Chat & Chatbot](./docs/live-chat.md)       | Reverb, auto-reply, troubleshooting                   |
| [Cloudflare Tunnel](./docs/cloudflare-tunnel.md) | Payment webhooks, PrismaLink/Midtrans sandbox testing |

### Production

| Doc                                                                | When to read                                    |
| ------------------------------------------------------------------ | ----------------------------------------------- |
| [Server Inventory](./docs/server-inventory.md)                     | Host names and IPs                              |
| [Production App Server](./docs/production-app-server.md)           | PHP, Caddy, Supervisor, first install           |
| [Production Database Server](./docs/production-database-server.md) | PostgreSQL, pgvector, WAL-G backups             |
| [Database Backups](./docs/database-backups.md)                     | Admin backup panel, WAL-G env, app + DB setup   |
| [Object Storage (S3)](./docs/object-storage.md)                    | Media buckets, AWS CLI, credentials, s3fs mount |
| [Deployment](./docs/deployment.md)                                 | Pull, migrate, build, restart after release     |

### Debugging

| Doc                              | When to read                           |
| -------------------------------- | -------------------------------------- |
| [Debugging](./docs/debugging.md) | Xdebug, Telescope, chatbot log tracing |

---

## Deploy

Push your branch, then:

```bash
pnpm dev:deploy              # dev server (default preset)
pnpm dev:deploy -- -e main     # production
```

Workflow charts: [Development Flow](./docs/development-flow.md). Deploy commands and flags: [Deployment](./docs/deployment.md).
