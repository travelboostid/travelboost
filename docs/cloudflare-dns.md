# Cloudflare DNS & Routing

How `travelboost.co.id` uses Cloudflare for DNS, TLS, and traffic routing to app servers.

Doc index: [README](../README.md) · Servers: [Server Inventory](./server-inventory.md) · Local tunnel: [Cloudflare Tunnel](./cloudflare-tunnel.md) · Caddy: [Caddy on the Server](./caddy.md) · First install: [Production App Server](./production-app-server.md)

---

## How the domain is set up (read this first)

This section explains the **big picture** before the technical details below.

### Who owns what

| Piece                   | Provider                                  | What it does                                                                                                                                                                     |
| ----------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Domain registration** | [Hostinger](https://www.hostinger.com/)   | We **bought** and **renew** `travelboost.co.id` here. Hostinger is the registrar — the shop that holds our right to use the name.                                                |
| **DNS & CDN**           | [Cloudflare](https://www.cloudflare.com/) | We **do not** manage DNS records in Hostinger anymore. Nameservers point to Cloudflare, so Cloudflare is where we create A/CNAME/MX records and turn the orange cloud on or off. |
| **Application servers** | Biznet GIO VPS                            | The actual Laravel app runs on our VPS hosts (`tb-app-main`, `tb-app-dev`) — see [Server Inventory](./server-inventory.md).                                                      |

You can think of it like this:

```text
Hostinger     =  owns the domain name (like holding the deed to an address)
Cloudflare    =  the phone book + optional security guard at the door
Our VPS       =  the building where the app actually lives
```

### What happens when someone opens `https://travelboost.co.id`

1. **Browser** asks the internet: “What is `travelboost.co.id`?”
2. **DNS lookup** goes to **Cloudflare** (because nameservers are `*.ns.cloudflare.com`, not Hostinger’s).
3. **Cloudflare DNS record** says: for production, send traffic to our VPS (via proxied/orange-cloud routing).
4. **Cloudflare** (if proxied) sits in front of the server: HTTPS to the visitor, DDoS filtering, caching rules.
5. **Caddy** on the VPS receives the request, terminates TLS, and passes PHP to Laravel — see [Caddy on the Server](./caddy.md).
6. **Laravel** uses the `Host` header (`travelboost.co.id`, `agentname.travelboost.co.id`, etc.) to decide which site/dashboard to show — see [Routing](./routing.md).

Staging (`dev.travelboost.co.id`) and local tunnel (`tunnel-8000.travelboost.co.id`) follow slightly different paths; the rest of this doc describes those.

### Nameservers: Hostinger → Cloudflare

In **Hostinger**, we only change one important thing for day-to-day work: **nameservers** are set to Cloudflare’s, for example:

```text
imani.ns.cloudflare.com
kenneth.ns.cloudflare.com
```

After that:

- **Do not** add A/CNAME records in Hostinger for `travelboost.co.id` — they will be **ignored**.
- **Do** add and edit DNS records in the **Cloudflare dashboard** for the `travelboost.co.id` zone.

If a teammate says “I updated DNS in Hostinger and nothing changed,” that is usually why — records must be in **Cloudflare**.

### What juniors should and should not touch

**Usually safe to know (read-only):**

- Look up a hostname with `dig dev.travelboost.co.id` or an online DNS checker.
- Read this doc and [Cloudflare Tunnel](./cloudflare-tunnel.md) before testing webhooks locally.

**Ask a senior before changing:**

- Nameservers in Hostinger (breaking change for the whole domain).
- Orange vs grey cloud (proxy mode) on a DNS record.
- SSL/TLS mode (must stay **Full (strict)** on production).
- Origin certificates on the server.
- Any new public subdomain (e.g. `api.travelboost.co.id`).

**Never:**

- Point production DNS at a random IP without team agreement.
- Commit origin certificate private keys (`.key` files) to git.

### Where to click

| Task                                   | Where                                                      |
| -------------------------------------- | ---------------------------------------------------------- |
| Renew domain / billing                 | Hostinger account                                          |
| Add DNS record, proxy toggle, SSL mode | Cloudflare → `travelboost.co.id` zone                      |
| Deploy app code                        | VPS via `pnpm dev:deploy` — [Deployment](./deployment.md)  |
| Local webhook testing                  | [Cloudflare Tunnel](./cloudflare-tunnel.md) on your laptop |

---

## Overview

```text
                    ┌─────────────────────────────────────┐
                    │         Cloudflare (DNS)            │
                    │  Nameservers: *.ns.cloudflare.com   │
                    └─────────────────────────────────────┘
                          │                    │
           Proxied (orange)│                    │ DNS only (grey)
                          ▼                    ▼
              ┌───────────────────┐   ┌───────────────────┐
              │   tb-app-main     │   │    tb-app-dev     │
              │ 103.93.163.174    │   │ 103.127.138.76    │
              │ Caddy + Origin    │   │ Caddy + Let's     │
              │ certificate       │   │ Encrypt on-demand │
              └───────────────────┘   └───────────────────┘
                          │
              Cloudflare Tunnel (local dev)
                          ▼
              cloudflared → localhost:8000
```

| Layer      | Production (`main`)                                        | Staging (`dev`)                                           | Local (`tunnel` preset)           |
| ---------- | ---------------------------------------------------------- | --------------------------------------------------------- | --------------------------------- |
| DNS        | Cloudflare proxied for apex & key subdomains               | `dev.travelboost.co.id` **DNS-only** → origin IP          | `tunnel-8000` → Cloudflare Tunnel |
| Edge SSL   | Cloudflare terminates visitor HTTPS                        | N/A (grey-cloud hostnames hit origin directly)            | Cloudflare Tunnel HTTPS           |
| Origin SSL | **Full (Strict)** + Cloudflare Origin Certificate on Caddy | Caddy **on-demand TLS** with Let's Encrypt (certbot/ACME) | N/A (tunnel encrypts to edge)     |
| App        | `travelboost.co.id`                                        | `dev.travelboost.co.id`                                   | `tunnel-8000.travelboost.co.id`   |

---

## Nameservers & email

The zone is managed in **Cloudflare** (nameservers were delegated from Hostinger — see [How the domain is set up](#how-the-domain-is-set-up-read-this-first)):

```text
imani.ns.cloudflare.com
kenneth.ns.cloudflare.com
```

Email (Google Workspace):

| Type | Value                                      |
| ---- | ------------------------------------------ |
| MX   | `smtp.google.com` (priority 1)             |
| TXT  | SPF: `v=spf1 include:_spf.google.com ~all` |

Manage DNS records in the Cloudflare dashboard for the `travelboost.co.id` zone. The table below reflects **public DNS** as of the last doc update — proxied records resolve to Cloudflare anycast IPs, not the origin VPS.

---

## Observed DNS records

Verified with public `dig` queries. **Proxied** = orange cloud (traffic through Cloudflare). **DNS only** = grey cloud (clients connect straight to the origin IP).

| Hostname                        | Resolves to (public)              | Proxy mode   | Origin / purpose                                               |
| ------------------------------- | --------------------------------- | ------------ | -------------------------------------------------------------- |
| `travelboost.co.id`             | `104.21.30.212`, `172.67.173.238` | Proxied      | `tb-app-main` — production app                                 |
| `www.travelboost.co.id`         | Cloudflare anycast                | Proxied      | Production (alias)                                             |
| `dev.travelboost.co.id`         | `103.127.138.76`                  | **DNS only** | `tb-app-dev` — staging app                                     |
| `reverb.travelboost.co.id`      | Cloudflare anycast                | Proxied      | Production Reverb WebSocket                                    |
| `reverb.dev.travelboost.co.id`  | `103.127.138.76`                  | **DNS only** | Staging Reverb                                                 |
| `tunnel-8000.travelboost.co.id` | Cloudflare anycast                | Proxied      | [Cloudflare Tunnel](./cloudflare-tunnel.md) → developer laptop |

Tenant landing pages use **wildcard-style hostnames** at the app layer (e.g. `{username}.travelboost.co.id` on production, `{username}.dev.travelboost.co.id` on staging) — see [Routing](./routing.md). They are not separate static DNS rows per agent; Caddy and `DomainResolver` route by `Host` header.

Add or change records in Cloudflare when introducing a new **fixed** subdomain (e.g. `reverb`, `api`). Coordinate with the team before toggling proxy mode.

---

## SSL/TLS strategy

### Production — Full (Strict) + Origin Certificate

In Cloudflare **SSL/TLS** for the zone, production uses **Full (strict)**:

1. Visitor → Cloudflare: standard Cloudflare edge certificate.
2. Cloudflare → origin (`tb-app-main`): encrypted connection validated against a **Cloudflare Origin Certificate** installed on Caddy.

Generate the origin certificate in Cloudflare (**SSL/TLS → Origin Server**) with hostnames:

```text
travelboost.co.id
*.travelboost.co.id
```

Install on the server:

```text
/etc/ssl/cloudflare/travelboost/origin.crt
/etc/ssl/cloudflare/travelboost/origin.key
```

Caddy loads this cert for the main site block — see [`infra/caddy/Caddyfile.main`](../infra/caddy/Caddyfile.main):

```caddyfile
travelboost.co.id, *.travelboost.co.id {
    tls /etc/ssl/cloudflare/travelboost/origin.crt /etc/ssl/cloudflare/travelboost/origin.key
    ...
}
```

This covers the marketing site, `dev` is separate, and **one-level** tenant subdomains like `{username}.travelboost.co.id` without issuing a new cert per agent.

**Custom domains** (agent-owned `example.com`) use Caddy **on-demand TLS** + Laravel verification at `/caddy/verify-domain` — see [Custom domains](#custom-company-domains) below.

### Staging (`tb-app-dev`) — DNS only + Let's Encrypt

`dev.travelboost.co.id` and `reverb.dev.travelboost.co.id` are **DNS-only** (grey cloud) so TLS terminates on the VPS, not at Cloudflare edge.

**Why not Cloudflare Origin certs for all staging hostnames?**

Cloudflare charges for **Advanced Certificate Manager** when you need deep or multi-level wildcards (e.g. `*.*.travelboost.co.id` for `{username}.dev.travelboost.co.id`). To avoid that cost on staging, we:

1. Grey-cloud the dev apex and Reverb hostnames.
2. Let **Caddy on-demand TLS** obtain **Let's Encrypt** certificates per hostname (same role as **certbot** — ACME HTTP-01 on the origin).

Staging Caddy config: [`infra/caddy/Caddyfile.dev`](../infra/caddy/Caddyfile.dev) — fixed blocks for `dev.travelboost.co.id` and `reverb.dev.travelboost.co.id`, plus an `https://` catch-all with `tls { on_demand }` for tenant subdomains and custom domains.

First-time or manual cert operations on the dev server may still use **certbot** alongside Caddy; day-to-day tenant subdomains are covered by Caddy's on-demand ACME flow.

### Local development — Cloudflare Tunnel

`tunnel-8000.travelboost.co.id` is proxied to a **Cloudflare Tunnel** (`cloudflared`) on a developer machine. Edge HTTPS is handled by Cloudflare; no origin certificate on the laptop.

Details: [Cloudflare Tunnel](./cloudflare-tunnel.md).

---

## Custom company domains

Agents can attach custom domains (`domains` table). Caddy issues certificates **on demand** when a new hostname is first accessed.

Flow:

1. Customer points their domain's DNS (A/CNAME) at our server or Cloudflare.
2. Caddy's `on_demand_tls` asks Laravel before issuing: `GET /caddy/verify-domain?domain=example.com` on port `8081` (internal).
3. [`CaddyController`](../app/Http/Controllers/CaddyController.php) returns `200` to allow issuance, `403` to reject.

Configured in both Caddyfiles:

```caddyfile
on_demand_tls {
    ask http://127.0.0.1:8081/caddy/verify-domain
}
```

Production uses origin certs for `*.travelboost.co.id` but still needs on-demand TLS for **arbitrary external domains**. Planned simplification: paid Cloudflare (Advanced Certificate Manager / Cloudflare for SaaS) — [Infrastructure backlog](./todos.md#dns--tls--paid-cloudflare-plan-deep-subdomains--simpler-ssl).

---

## Reverb (WebSockets)

| Environment | Hostname                       | DNS                                                                |
| ----------- | ------------------------------ | ------------------------------------------------------------------ |
| Production  | `reverb.travelboost.co.id`     | Proxied → `tb-app-main`; Caddy reverse-proxies to `127.0.0.1:8080` |
| Staging     | `reverb.dev.travelboost.co.id` | DNS only → `tb-app-dev`                                            |

Set `REVERB_HOST` / `VITE_REVERB_*` in the matching `.env.preset.*` — [Configuration](./configuration.md).

Cloudflare proxied WebSockets require **orange-cloud** records and compatible SSL mode (Full strict on production).

---

## Operational checklist

### New fixed subdomain (e.g. `api.travelboost.co.id`)

1. Add DNS record in Cloudflare (usually **A** → `tb-app-main` or `tb-app-dev` IP from [Server Inventory](./server-inventory.md)).
2. Choose **proxied** (production, behind Cloudflare) vs **DNS only** (staging pattern).
3. Add a Caddy server block in `infra/caddy/Caddyfile.main` or `Caddyfile.dev`.
4. If production + proxied: ensure **SSL/TLS = Full (strict)** and origin cert covers the hostname (or use on-demand TLS).
5. Deploy and reload Caddy: [Production App Server — Starting the Server](./production-app-server.md#starting-the-server).

### Rotating the origin certificate

1. Generate new origin cert in Cloudflare dashboard.
2. Replace files under `/etc/ssl/cloudflare/travelboost/`.
3. `sudo caddy validate` && `sudo systemctl reload caddy` on `tb-app-main`.

---

## Related docs

| Topic                                    | Doc                                                                                     |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| Tunnel for local webhook/OAuth testing   | [Cloudflare Tunnel](./cloudflare-tunnel.md)                                             |
| Caddy install, origin cert paths, reload | [Caddy on the Server](./caddy.md) · [Production App Server](./production-app-server.md) |
| Host IPs and deploy presets              | [Server Inventory](./server-inventory.md)                                               |
| Tenant subdomain routing                 | [Routing](./routing.md)                                                                 |
| Reverb env vars                          | [Integrations](./integrations.md)                                                       |
