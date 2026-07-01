# Server Inventory

Travelboost infrastructure — hosts, URLs, and how app servers pair with databases. Use these names for SSH, deploy targets, and env-specific config.

Doc index: [README](../README.md) · Deploy: [Deployment](./deployment.md) · Setup: [App Server](./production-app-server.md) · [Database Server](./production-database-server.md)

---

## Infrastructure map

| Host          | Instance | IP             | URL                                                    | Role                          | Paired DB    | Deploy preset (`-e`) | SSH user      |
| ------------- | -------- | -------------- | ------------------------------------------------------ | ----------------------------- | ------------ | -------------------- | ------------- |
| `tb-app-dev`  | XS 1.1   | 103.127.138.76 | [dev.travelboost.co.id](https://dev.travelboost.co.id) | Staging app                   | `tb-db-dev`  | `dev` (default)      | `travelboost` |
| `tb-db-dev`   | XS 1.1   | 103.93.160.139 | —                                                      | Staging PostgreSQL + WAL-G    | —            | —                    | `travelboost` |
| `tb-app-main` | XS 1.1   | 103.93.163.174 | [travelboost.co.id](https://travelboost.co.id)         | Production app                | `tb-db-main` | `main`               | `travelboost` |
| `tb-db-main`  | SS 2.1   | 103.150.92.211 | —                                                      | Production PostgreSQL + WAL-G | —            | —                    | `travelboost` |

App path on servers: `~/travelboost` (`DEPLOY_TARGET_PATH` in deploy presets).

Branch mapping: `dev` preset deploys `dev` branch; `main` preset deploys `main` branch.

---

## Local-only environments

Not servers — listed here so preset names stay in one place.

| Preset   | Host / URL                              | Purpose                                |
| -------- | --------------------------------------- | -------------------------------------- |
| `local`  | `http://lvh.me:8000`                    | Default local dev                      |
| `tunnel` | `https://tunnel-8000.travelboost.co.id` | Webhooks & OAuth against local machine |

Details: [Configuration](./configuration.md) · [Local Development](./local-development.md) · [Cloudflare DNS](./cloudflare-dns.md) · [Cloudflare Tunnel](./cloudflare-tunnel.md).

---

## Related docs

| Topic                       | Doc                                       |
| --------------------------- | ----------------------------------------- |
| Env presets & variables     | [Configuration](./configuration.md)       |
| Deploy commands & checklist | [Deployment](./deployment.md)             |
| Release workflow            | [Development Flow](./development-flow.md) |
| Database backups (WAL-G)    | [Database Backups](./database-backups.md) |
| S3 media buckets            | [Object Storage](./object-storage.md)     |
