# Cloudflare Tunnel (Local Dev)

Expose your local Laravel app at **`https://tunnel-8000.travelboost.co.id`** so external services (payment gateways, OAuth providers) can reach webhooks and callbacks on your machine.

Doc index: [README](../README.md)

---

## When to use

Use the tunnel preset when you need a **public HTTPS URL** pointing at local `php artisan serve` (port **8000**):

| Use case                       | Why the tunnel is needed                                                                  |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| **Midtrans webhooks**          | Sandbox sends `POST /webhooks/midtrans/notification` after payment                        |
| **PrismaLink callbacks**       | Gateway POSTs backend callback and redirects the browser to your app                      |
| **Google OAuth**               | Redirect URI must match a registered HTTPS callback                                       |
| **End-to-end payment testing** | Finish redirects and webhook settlement must hit the same host you used to start checkout |

For normal UI work (bookings, dashboard, chat), use a local preset such as `lvh.me` or `localhost` instead — no tunnel required.

---

## Overview

```text
Midtrans / PrismaLink / Google
            │
            ▼
  tunnel-8000.travelboost.co.id  (Cloudflare Tunnel, HTTPS)
            │
            ▼
  cloudflared on your machine
            │
            ▼
  http://127.0.0.1:8000  ←  php artisan serve
```

The team maintains a named Cloudflare Tunnel that routes `tunnel-8000.travelboost.co.id` → your local port **8000**. Only one developer should use this hostname at a time, or webhooks will hit the wrong machine.

---

## Simulate payment gateways (step by step)

### 1. Apply the tunnel env preset

```bash
pnpm dev:setenv
```

Choose **`.env.preset.tunnel_localdb_email`** (local PostgreSQL + real SMTP) or another `tunnel_*` preset if your team provides one.

The preset sets:

```dotenv
APP_HOST=tunnel-8000.travelboost.co.id
APP_SCHEME=https
APP_URL=https://tunnel-8000.travelboost.co.id

PRISMALINK_BACKEND_CALLBACK_URL=https://tunnel-8000.travelboost.co.id/webhooks/prismalink/backend-callback
PRISMALINK_FRONTEND_CALLBACK_URL=https://tunnel-8000.travelboost.co.id
```

Sandbox Midtrans and PrismaLink keys are included in the preset. **Do not use production keys with the tunnel.**

### 2. Start the dev stack

```bash
pnpm dev:full
```

Or minimal HTTP only:

```bash
pnpm dev:min
```

Confirm Laravel is listening on port 8000:

```bash
curl -I http://127.0.0.1:8000
```

**Browse the app via the tunnel URL** (`https://tunnel-8000.travelboost.co.id`), not `localhost`, when testing payments — redirects and callbacks must match `APP_URL`.

### 3. Ensure the Cloudflare tunnel is running

Install [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) if needed. Ask a teammate for the tunnel name and credentials file (not committed to the repo).

See [Cloudflare Tunnel docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) for installation, tunnel setup, and `cloudflared` CLI reference.

Typical command:

```bash
cloudflared tunnel run <tunnel-name>
```

Verify the public hostname reaches your machine:

```bash
curl -I https://tunnel-8000.travelboost.co.id
```

You should get a Laravel response (200/302), not Cloudflare **502** (tunnel up, app down) or **530** (tunnel not running).

### 4. Point gateway webhooks at the tunnel

#### Midtrans (Sandbox)

1. Open [Midtrans Sandbox Dashboard](https://dashboard.sandbox.midtrans.com/) → **Settings** → **Configuration**.
2. Set **Payment Notification URL** to:

    ```text
    https://tunnel-8000.travelboost.co.id/webhooks/midtrans/notification
    ```

3. Save. New charges will notify this URL when payment status changes.

In `local` / `development` environments, Midtrans signature verification is skipped (`MidtransWebhookController`), so sandbox POSTs are accepted without extra header setup.

**Simulate payment (no real money):** after starting checkout in the app, complete the charge using [Midtrans Payment Simulator](https://simulator.sandbox.midtrans.com/). Which tool you need depends on the payment method — e.g. paste the VA number into the matching bank simulator, or the QR image URL into the QRIS simulator. See [Testing Payment on Sandbox](https://docs.midtrans.com/docs/testing-payment-on-sandbox) for method-specific steps.

#### PrismaLink (Sandbox)

Callback URLs come from `.env` (`PRISMALINK_BACKEND_CALLBACK_URL`, `PRISMALINK_FRONTEND_CALLBACK_URL`). The tunnel preset already targets `tunnel-8000.travelboost.co.id`.

If your PrismaLink merchant portal has separate callback fields, set them to the same URLs:

| Purpose                     | URL                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------ |
| Backend (server-to-server)  | `https://tunnel-8000.travelboost.co.id/webhooks/prismalink/backend-callback`         |
| Frontend (browser redirect) | `https://tunnel-8000.travelboost.co.id` or `…/webhooks/prismalink/frontend-callback` |

PrismaLink **always** verifies the `mac` header — use sandbox credentials from the preset.

**Simulate payment:** use the [PrismaLink Staging Simulator](https://dashboard-staging.plink.co.id/simulator) to trigger or complete sandbox payments and callbacks after creating a charge in the app.

#### Webhook routes (reference)

Defined in `routes/common.php`:

| Gateway             | Method | Path                                     |
| ------------------- | ------ | ---------------------------------------- |
| Midtrans            | `POST` | `/webhooks/midtrans/notification`        |
| PrismaLink backend  | `POST` | `/webhooks/prismalink/backend-callback`  |
| PrismaLink frontend | `GET`  | `/webhooks/prismalink/frontend-callback` |

### 5. Run a test payment

1. Open `https://tunnel-8000.travelboost.co.id` and log in.
2. Start an online payment (booking checkout, wallet top-up, agent subscription, etc.).
3. Complete payment in the sandbox simulator — **do not use real money or real bank accounts**:
    - **Midtrans:** [simulator.sandbox.midtrans.com](https://simulator.sandbox.midtrans.com/) — use the VA / QRIS / deeplink tool that matches your payment method.
    - **PrismaLink:** [dashboard-staging.plink.co.id/simulator](https://dashboard-staging.plink.co.id/simulator)
4. Confirm the booking/payment status updates to **paid** without manual intervention (webhook received via tunnel).

**Debug webhook delivery:**

- Laravel log: `storage/logs/laravel.log`
- [Telescope](debugging.md) → Requests / Logs (enabled in tunnel preset)
- Midtrans Dashboard → **Transactions** → open transaction → notification history

---

## Troubleshooting

| Symptom                               | Likely cause                                         | Fix                                                      |
| ------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| **502** from tunnel URL               | Laravel not running on 8000                          | Start `pnpm dev:min` or `pnpm dev:full`                  |
| **530** / connection error            | `cloudflared` not running                            | Start the tunnel; verify with `curl -I`                  |
| Payment stays **pending**             | Webhook URL wrong or tunnel on another dev's machine | Align Midtrans notification URL; coordinate tunnel usage |
| **404** on webhook                    | Typo in gateway dashboard URL                        | Match paths in the table above exactly                   |
| Redirect after pay goes to wrong host | Opened app via `localhost` instead of tunnel         | Use `https://tunnel-8000.travelboost.co.id` consistently |
| PrismaLink **Invalid signature**      | Wrong merchant keys or body altered                  | Use preset sandbox keys; check `PRISMALINK_*` in `.env`  |

---

## Related docs

- [Local Development](./local-development.md) — PHP, PostgreSQL, `pnpm dev:full`
- [Architecture — Payments](./architecture.md#payments-and-wallets) — Midtrans, PrismaLink, settlement flow
- [Debugging](./debugging.md) — Xdebug, Telescope

### Cloudflare Tunnel (official)

- [Cloudflare Tunnel overview](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) — what tunnels are and how routing works
- [Get started with Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/) — create and configure a tunnel
- [Download `cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) — install the connector on your machine
- [Run a tunnel locally](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/local-management/create-local-tunnel/) — `cloudflared tunnel run` and local config
