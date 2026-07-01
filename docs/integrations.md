# Integrations

Developer index of external services — env vars, local testing, and code entry points. For business rules, see [Architecture](./architecture.md) and [Database Design](./database-design.md).

Doc index: [README](../README.md) · Env presets: [Configuration](./configuration.md)

---

## Quick reference

| Integration       | Config                              | Local testing                                          | Code                                                                               |
| ----------------- | ----------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Midtrans          | `config/midtrans.php`, `MIDTRANS_*` | [Tunnel preset](./cloudflare-tunnel.md) + sandbox keys | `MidtransService`, `Webhooks/MidtransWebhookController`                            |
| PrismaLink        | `PRISMALINK_*` in `.env`            | Tunnel preset; callback URLs must match `APP_URL`      | `PrismaLinkService`, `PrismaLinkWebhookController`, `PrismaLinkCallbackController` |
| S3 / media        | `S3_*`, `config/filesystems.php`    | AWS CLI + dev bucket per preset                        | [Object Storage](./object-storage.md)                                              |
| Google OAuth      | `GOOGLE_*`, `config/services.php`   | Tunnel preset for HTTPS redirect                       | `GoogleAuthController`, GA dashboard controllers                                   |
| Mail              | `MAIL_*`, `config/mail.php`         | `local` = log driver; `tunnel`/servers = real SMTP     | Laravel mail + notifications                                                       |
| Reverb / Echo     | `REVERB_*`, `VITE_REVERB_*`         | `pnpm dev:full` starts Reverb                          | `config/reverb.php`, `routes/channels.php`, `@laravel/echo-react`                  |
| Web API           | Scramble + Orval                    | Dev server up for `pnpm orval`                         | [Web API & Orval](./webapi-orval.md)                                               |
| i18n              | `resources/js/lang/*.json`          | `pnpm i18n:extract`                                    | [Translations (i18n)](./i18n.md)                                                   |
| Cloudflare tunnel | `tunnel` preset                     | Team-shared hostname — coordinate before use           | [Cloudflare Tunnel](./cloudflare-tunnel.md)                                        |

---

## Webhook routes

Registered in [`routes/common.php`](../routes/common.php). CSRF validation is disabled for `webhooks/*` in [`bootstrap/app.php`](../bootstrap/app.php).

| Method | Path                                     | Handler                                               |
| ------ | ---------------------------------------- | ----------------------------------------------------- |
| `POST` | `/webhooks/midtrans/notification`        | `MidtransWebhookController@handleNotification`        |
| `POST` | `/webhooks/prismalink/backend-callback`  | `PrismaLinkWebhookController@backendCallback`         |
| `POST` | `/webhooks/prismalink/callback`          | `PrismaLinkWebhookController@backendCallback` (alias) |
| `GET`  | `/webhooks/prismalink/frontend-callback` | `PrismaLinkCallbackController` (browser redirect)     |

Gateway dashboards must point at your public `APP_URL` — use the [tunnel preset](./cloudflare-tunnel.md) locally.

Env vars for callback URLs (from `.env.example`):

```env
PRISMALINK_BACKEND_CALLBACK_URL=${APP_URL}/webhooks/prismalink/backend-callback
PRISMALINK_FRONTEND_CALLBACK_URL=${APP_URL}/webhooks/prismalink/frontend-callback
```

---

## Midtrans

| Variable                 | Purpose                                                    |
| ------------------------ | ---------------------------------------------------------- |
| `MIDTRANS_SERVER_KEY`    | Server-side API                                            |
| `MIDTRANS_CLIENT_KEY`    | Client-side Snap / payment UI (`VITE_MIDTRANS_CLIENT_KEY`) |
| `MIDTRANS_IS_PRODUCTION` | `false` for sandbox                                        |

Local end-to-end flow: [Cloudflare Tunnel](./cloudflare-tunnel.md). Payment status also syncs via scheduled `MarkExpiredPaymentsJob`.

---

## PrismaLink

| Variable                                                                        | Purpose                  |
| ------------------------------------------------------------------------------- | ------------------------ |
| `PRISMALINK_MERCHANT_ID`, `PRISMALINK_MERCHANT_KEY_ID`, `PRISMALINK_SECRET_KEY` | API credentials          |
| `PRISMALINK_IS_PRODUCTION`                                                      | `false` for sandbox      |
| `PRISMALINK_BACKEND_CALLBACK_URL`                                               | Server-to-server webhook |
| `PRISMALINK_FRONTEND_CALLBACK_URL`                                              | Browser return URL       |

---

## Object storage (S3)

Media on staging/production uses Neo S3 (`FILESYSTEM_DISK=s3`). Local presets may use `local` or S3 depending on preset.

Full setup, AWS CLI, and bucket names: [Object Storage (S3)](./object-storage.md).

---

## Google OAuth

Used for connecting Google Analytics accounts in the company dashboard.

| Variable                                   | Purpose                                   |
| ------------------------------------------ | ----------------------------------------- |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | OAuth app credentials                     |
| `GOOGLE_REDIRECT_URL`                      | Default `${APP_URL}/auth/google/callback` |

HTTPS redirect URI required — use the tunnel preset when testing OAuth locally.

---

## Mail

| Preset         | Typical `MAIL_MAILER` | Notes                                           |
| -------------- | --------------------- | ----------------------------------------------- |
| `local`        | `log`                 | Messages in `storage/logs/laravel.log`          |
| `tunnel`       | SMTP (real)           | For testing verification emails with tunnel URL |
| `dev` / `main` | SMTP                  | Real delivery on servers                        |

Bulk unique test addresses: [Testing Email Accounts](./testing-email-accounts.md).

---

## Reverb / Laravel Echo

| Variable                                               | Purpose              |
| ------------------------------------------------------ | -------------------- |
| `BROADCAST_CONNECTION`                                 | Set to `reverb`      |
| `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET` | App credentials      |
| `REVERB_HOST`, `REVERB_PORT`, `REVERB_SCHEME`          | Server connection    |
| `VITE_REVERB_*`                                        | Frontend Echo client |

Local: `pnpm dev:full` runs Reverb alongside queue and Vite. Production: Supervisor manages Reverb — [Production App Server](./production-app-server.md).

Channel authorization: [`routes/channels.php`](../routes/channels.php).

---

## Web API (Scramble + Orval)

Session-authenticated JSON at `/webapi` — not a public token API.

Conventions, regeneration workflow, and troubleshooting: [Web API & Orval](./webapi-orval.md).

---

## Related docs

| Topic                               | Doc                                         |
| ----------------------------------- | ------------------------------------------- |
| Env presets & maintenance checklist | [Configuration](./configuration.md)         |
| Tunnel setup for webhooks/OAuth     | [Cloudflare Tunnel](./cloudflare-tunnel.md) |
| Local dev stack                     | [Local Development](./local-development.md) |
| Deploy & server env upload          | [Deployment](./deployment.md)               |
