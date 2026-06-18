# Database Backups (WAL-G)

WAL-G backs up PostgreSQL to object storage. Admins manage backups from the Laravel admin panel at **Settings → Backups** (`/admin/settings/backups`).

Doc index: [README](../README.md) · DB setup: [Production Database Server](./production-database-server.md) · App setup: [Production App Server](./production-app-server.md) · Storage: [Object Storage](./object-storage.md) · Hosts: [Server Inventory](./server-inventory.md)

## Overview

Backups are split across two servers:

| Responsibility                                        | Server                                      | How                                        |
| ----------------------------------------------------- | ------------------------------------------- | ------------------------------------------ |
| WAL archive + full backup (`wal-push`, `backup-push`) | `tb-db-dev` / `tb-db-main`                  | WAL-G + systemd timer on the database host |
| List backups, apply retention                         | `tb-app-dev` / `tb-app-main` (or local dev) | WAL-G CLI + S3 credentials in `.env`       |
| Trigger manual backup, view schedule                  | App server → DB server                      | SSH + `systemctl`                          |

WAL-G has no built-in web API. The admin panel wraps the CLI and SSH.

Restore is **not** available from the admin panel. Use manual WAL-G restore on the database server when needed.

## Admin panel

**Path:** `/admin/settings/backups`  
**Access:** authenticated users with `access-admin-pages` (admin role).

### What admins can do

| Action                 | What it does                                                    |
| ---------------------- | --------------------------------------------------------------- |
| View backup history    | Lists full backups from S3 (`wal-g backup-list`)                |
| View storage prefix    | Shows configured `WALG_S3_PREFIX`                               |
| View auto backup timer | SSH to DB server; reads `wal-g-backup.timer` status             |
| **Run Backup Now**     | SSH to DB server; starts `wal-g-backup.service`                 |
| **Retain N Full**      | Deletes older full backups in S3 (`wal-g delete retain FULL N`) |

### What is not supported (yet)

- Restore from the admin UI
- Point-in-time recovery UI
- Backup progress streaming

## Environment variables

Set on the **app server** `.env` (and local `.env` if you use the admin panel locally):

```env
WALG_BINARY=/usr/local/bin/wal-g
WALG_S3_PREFIX=s3://tb-backup-dev          # or s3://tb-backup-main
WALG_ACCESS_KEY_ID=                        # backup access key (implicit) — not the media key
WALG_SECRET_ACCESS_KEY=
WALG_ENDPOINT=https://nos.wjv-1.neo.id
WALG_REGION=us-east-1
WALG_USE_PATH_STYLE_ENDPOINT=true
WALG_COMPRESSION_METHOD=zstd
WALG_RETAIN_FULL=7
WALG_BACKUP_SERVICE=wal-g-backup.service
WALG_BACKUP_TIMER=wal-g-backup.timer
DB_SSH_USER=travelboost
DB_SSH_HOST=103.93.160.139                 # tb-db-dev; use 103.150.92.211 for main
DB_SSH_RUN_AS=travelboost                  # app server only — PHP-FPM runs as www-data
```

| Variable                                                         | Required for                | Notes                                                                                                       |
| ---------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `WALG_S3_PREFIX`, `WALG_ACCESS_KEY_ID`, `WALG_SECRET_ACCESS_KEY` | List backups, retention     | Use **backup** bucket (`tb-backup-dev` / `tb-backup-main`) and a backup-only implicit key, not `tb-media-*` |
| `WALG_BINARY`                                                    | List backups, retention     | WAL-G must be installed on the machine running PHP                                                          |
| `DB_SSH_USER`, `DB_SSH_HOST`                                     | Manual backup, timer status | Must point at the **database** server, not the app server                                                   |
| `DB_SSH_RUN_AS`                                                  | Manual backup, timer status | On app servers set to `travelboost` so PHP-FPM (`www-data`) uses the deploy user's SSH keys via `sudo`      |

IAM policy: [`infra/s3/iam-backup-dev.json`](../infra/s3/iam-backup-dev.json) (reference — in Biznet GIO use a backup access key with **Implicit access** to the backup bucket only). See [Object Storage](./object-storage.md).

Config file: [`config/backup.php`](../config/backup.php).

## Database server setup

First-time WAL-G, PostgreSQL archiving, and the daily systemd timer: [Production Database Server — Automatic Backup Setup](./production-database-server.md#automatic-backup-setup).

The admin panel expects these units on the DB host:

- `wal-g-backup.service` — oneshot full backup + retention
- `wal-g-backup.timer` — daily schedule (default 01:00)

### SSH sudo (for manual backup from admin)

On the **database** server, allow the deploy user to start the backup service without a password:

```text
travelboost ALL=NOPASSWD: /bin/systemctl start wal-g-backup.service
```

Add via `sudo visudo` on `tb-db-dev` / `tb-db-main`.

### SSH sudo on the app server (admin panel)

Web requests run as **`www-data`** (PHP-FPM). The admin backup panel runs SSH as the deploy user via `sudo`:

```text
www-data ALL=(travelboost) NOPASSWD: /usr/bin/ssh
```

Set `DB_SSH_RUN_AS=travelboost` in the app server `.env`. Ensure `travelboost` can SSH to the DB host (same key as manual deploy/debug).

Add via `sudo visudo` on `tb-app-dev` / `tb-app-main`.

## App server setup

In addition to normal app server setup ([Production App Server](./production-app-server.md)):

1. **Install WAL-G** (same binary as the DB server):

    ```bash
    wget https://github.com/wal-g/wal-g/releases/download/v3.0.8/wal-g-pg-24.04-amd64.tar.gz
    tar -zxvf wal-g-pg-24.04-amd64.tar.gz
    sudo mv ./wal-g-pg-24.04-amd64 /usr/local/bin/wal-g
    sudo chmod +x /usr/local/bin/wal-g
    ```

2. **Set backup env vars** in `~/travelboost/.env` (backup IAM key + `WALG_S3_PREFIX`).

3. **Configure SSH** from the deploy user to the DB host:
    - Generate a key on the app server if missing: `ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ""`
    - Add `~/.ssh/id_ed25519.pub` to `~/.ssh/authorized_keys` on the DB server for `DB_SSH_USER`
    - Set `DB_SSH_RUN_AS=travelboost` on the app server — see [SSH sudo on the app server](#ssh-sudo-on-the-app-server-admin-panel)

4. **Clear config** after env changes: `php artisan config:clear`.

## Local development

To use the admin backups page on your laptop:

- Install WAL-G locally (or set `WALG_BINARY` to your install path).
- Set the same `WALG_*` variables (backup bucket credentials).
- Set `DB_SSH_HOST` to the dev DB IP (`103.93.160.139`) — not the app server IP.
- Your machine must reach the DB host over SSH (VPN/firewall).

Listing backups only needs WAL-G + S3. Timer status and **Run Backup Now** need working SSH to the DB server.

## Verification

**On app server (or local):**

```bash
/usr/local/bin/wal-g backup-list --detail
# with env vars from .env, or export WALG_S3_PREFIX / AWS_* first
```

**Timer on DB server:**

```bash
ssh travelboost@103.93.160.139 "systemctl status wal-g-backup.timer"
```

**Manual backup trigger (same as admin button):**

```bash
ssh travelboost@103.93.160.139 "sudo systemctl start wal-g-backup.service"
```

## Troubleshooting

| Symptom                                            | Likely cause                                    | Fix                                                                                                                           |
| -------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `/usr/local/bin/wal-g: No such file or directory`  | WAL-G not installed where PHP runs              | Install on app server (or local machine)                                                                                      |
| No backups listed / S3 errors                      | Wrong bucket or access key                      | Use `tb-backup-*` + backup implicit key, not media credentials                                                                |
| Timer shows **Inactive** / empty dates             | Wrong `DB_SSH_HOST` or timer not enabled        | Point SSH at DB server; run `systemctl enable --now wal-g-backup.timer` on DB                                                 |
| "Unable to load timer status"                      | SSH failed                                      | Check keys, firewall, `DB_SSH_USER` / `DB_SSH_HOST`; on app server set `DB_SSH_RUN_AS=travelboost` and sudoers for `www-data` |
| `/var/www/.ssh` or `Permission denied (publickey)` | PHP-FPM (`www-data`) cannot use deploy SSH keys | Set `DB_SSH_RUN_AS=travelboost`; add `www-data ALL=(travelboost) NOPASSWD: /usr/bin/ssh` on app server                        |
| Manual backup fails                                | Missing sudoers on DB                           | Add NOPASSWD rule for `systemctl start wal-g-backup.service`                                                                  |
| Panel shows "WAL-G is not configured"              | Missing `WALG_S3_PREFIX` or credentials         | Fill required env vars                                                                                                        |

## Related code

| Piece      | Location                                              |
| ---------- | ----------------------------------------------------- |
| Controller | `app/Http/Controllers/Admin/BackupController.php`     |
| Service    | `app/Services/WalGBackupService.php`                  |
| Routes     | `routes/admin.php` (`admin.settings.backups.*`)       |
| UI         | `resources/js/pages/admin/settings/backups/index.tsx` |
| Tests      | `tests/Feature/Admin/BackupManagementTest.php`        |
