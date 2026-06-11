# Production Database Server

First-time setup for `tb-db-dev` / `tb-db-main`: PostgreSQL 18, pgvector, WAL-G backups.

Doc index: [README](../README.md) · Hosts: [Server Inventory](./server-inventory.md)

## Installing PostgreSQL

Install PostgreSQL, additional PostgreSQL utilities, and the pgvector extension.

```bash
sudo apt update

sudo apt install postgresql postgresql-contrib

sudo apt install postgresql-18-pgvector
```

---

## Checking PostgreSQL Version

Verify the installed PostgreSQL version.

```bash
psql --version
```

Example output:

```text
psql (PostgreSQL) 18.4 (Ubuntu 18.4-0ubuntu0.26.04.1)
```

---

## Checking PostgreSQL Service

Check whether PostgreSQL is running correctly.

```bash
sudo systemctl status postgresql
```

Enable PostgreSQL to start automatically during boot and start the service immediately.

```bash
sudo systemctl enable --now postgresql
```

---

# Automatic Backup Setup

## Installing WAL-G

We use WAL-G for PostgreSQL backup because it is lightweight, mature, and widely used. Other solutions such as Databasus provide a friendlier UI, but consume more server resources.

Download and install WAL-G:

```bash
wget https://github.com/wal-g/wal-g/releases/download/v3.0.8/wal-g-pg-24.04-amd64.tar.gz

tar -zxvf wal-g-pg-24.04-amd64.tar.gz

sudo mv ./wal-g-pg-24.04-amd64 /usr/local/bin/wal-g
```

---

## Configuring WAL-G

Create the WAL-G configuration file.

```bash
sudo nano /etc/wal-g.json
```

Example configuration:

```json
{
    "WALG_S3_PREFIX": "s3://tb-backup-main",
    "AWS_ACCESS_KEY_ID": "<access-key>",
    "AWS_SECRET_ACCESS_KEY": "<secret-key>",
    "AWS_ENDPOINT": "https://nos.wjv-1.neo.id",
    "AWS_S3_FORCE_PATH_STYLE": "true",
    "AWS_REGION": "us-east-1",
    "WALG_COMPRESSION_METHOD": "zstd",
    "WALG_UPLOAD_CONCURRENCY": "4"
}
```

---

## Enabling WAL Archiving

Open the PostgreSQL configuration file:

```bash
sudo nano /etc/postgresql/18/main/postgresql.conf
```

Add or update the following configuration:

```ini
wal_level = replica
archive_mode = on
archive_command = 'wal-g --config /etc/wal-g.json wal-push %p'
archive_timeout = 60
```

This enables continuous WAL archiving for point-in-time recovery support.

---

## Configuring Automatic Daily Backup

Create the WAL-G backup service.

```bash
sudo nano /etc/systemd/system/wal-g-backup.service
```

Add the following configuration:

```ini
[Unit]
Description=WAL-G PostgreSQL Base Backup

[Service]
Type=oneshot
User=postgres
ExecStart=/bin/bash -c '/usr/local/bin/wal-g backup-push /var/lib/postgresql/18/main --config /etc/wal-g.json && /usr/local/bin/wal-g delete retain FULL 7 --confirm --config /etc/wal-g.json'
```

Create the daily backup timer.

```bash
sudo nano /etc/systemd/system/wal-g-backup.timer
```

Add the following configuration:

```ini
[Unit]
Description=Run WAL-G backup daily at 01:00

[Timer]
OnCalendar=*-*-* 01:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

Reload systemd and enable the timer.

```bash
sudo systemctl daemon-reload

sudo systemctl enable --now wal-g-backup.timer
```

---

## Accessing PostgreSQL Shell

Switch into the PostgreSQL shell using the postgres user.

```bash
sudo -u postgres psql
```

---

## Creating Database and User

Create the application database user and database.

```sql
CREATE USER travelboost WITH PASSWORD '<password>';

CREATE DATABASE travelboost OWNER travelboost;

GRANT ALL PRIVILEGES ON DATABASE travelboost TO travelboost;
```

Connect to the database and enable the pgvector extension.

```sql
\c travelboost

CREATE EXTENSION IF NOT EXISTS vector;
```

Exit PostgreSQL shell:

```sql
\q
```

---

## Configuring Remote Access

Open the PostgreSQL host authentication configuration file.

```bash
sudo nano /etc/postgresql/18/main/pg_hba.conf
```

For production environments, it is recommended to allow only the application server IP.

```text
host    travelboost    all    103.127.138.76/32    scram-sha-256
```

For development environments, all IP addresses may be allowed.

```text
host    travelboost    all    0.0.0.0/0    scram-sha-256
```

---

## Enabling External Connections

Open the PostgreSQL main configuration file.

```bash
sudo nano /etc/postgresql/18/main/postgresql.conf
```

Change:

```ini
#listen_addresses = 'localhost'
```

to:

```ini
listen_addresses = '*'
```

This allows PostgreSQL to listen on all network interfaces.

---

## Restarting PostgreSQL

Restart PostgreSQL after all configuration changes are completed.

```bash
sudo systemctl restart postgresql
```
