# Deployment Guide

## Server Information

The application is deployed inside the following directory:

```text id="rz3p4j"
/home/travelboost/travelboost
```

The server deployment is synced with the `dev` branch unless stated otherwise. All deployment commands in this guide assume the application is already installed and configured on the server.

---

## Connecting to the Server

Connect to the server using SSH.

```bash id="k5j4f7"
ssh [IP_TO_SERVER]
```

SSH public key authentication is required. If your key has not been registered yet, ask a teammate or server administrator to add it before attempting deployment.

After connecting successfully, navigate to the project directory.

```bash id="rkf2wy"
cd ~/travelboost
```

---

# Backend Deployment

## Pulling Latest Changes

Fetch and apply the latest changes from the repository.

```bash id="fq9u7n"
git pull
```

This updates the local server copy with the latest commits from the configured branch.

If there are merge conflicts or uncommitted changes on the server, resolve them before continuing.

---

## Installing Composer Dependencies

If the update includes new PHP dependencies or package changes, install Composer dependencies again.

```bash id="wmh34f"
composer install
```

For production deployments, it is recommended to use optimized autoloading.

```bash id="y9grt6"
composer install --no-dev --optimize-autoloader
```

This ensures Laravel loads classes more efficiently in production environments.

---

## Updating Environment Variables

If the deployment introduces new environment variables or changes existing configuration, update the `.env` file.

```bash id="8upjsm"
nano .env
```

Save changes using:

```text id="pdb0fp"
Ctrl + S
```

Exit the editor using:

```text id="px1xnl"
Ctrl + X
```

After changing environment variables, Laravel cache should be cleared to ensure the new values are loaded correctly.

---

## Running Database Migration

If the deployment contains database schema changes, run Laravel migrations.

```bash id="a2m8a4"
php artisan migrate --force
```

The `--force` flag is required for production environments because Laravel blocks migrations in production mode by default.

Do not use `migrate:fresh` on production servers because it recreates the database and deletes all existing data.

---

# Frontend Deployment

## Configuring Frontend Environment

Before building frontend assets, ensure the correct frontend environment configuration is selected.

```bash id="l7n7s5"
pnpm dev:setenv
```

Select the appropriate environment when prompted.

---

## Building Frontend Assets

Build the frontend using Vite.

```bash id="l5m1h8"
pnpm build
```

The generated production assets will be stored inside the local `public/build` directory.

Because the VPS uses limited resources, frontend builds are usually performed on a local development machine instead of directly on the server.

---

## Uploading Frontend Build

Upload the generated frontend build files into the server build directory:

```text id="l9h6q3"
~/travelboost/public/build
```

Replace the existing build files with the new generated assets from the latest deployment.

---

# Clearing Laravel Cache

After backend or frontend updates, clear Laravel caches to prevent stale configuration, routes, compiled views, or cached service metadata.

Run the following command on the server:

```bash id="f4m9t2"
php artisan optimize:clear
```

This clears:

- Config cache
- Route cache
- View cache
- Event cache
- Compiled services

---

# Restarting Background Services

Restart Supervisor-managed processes after deployment.

```bash id="c8s8yu"
sudo supervisorctl restart all
```

This reloads Laravel queue workers, scheduler processes, and Reverb websocket services using the latest deployed code.

---

# Quick Deployment Shortcut

To simplify the deployment workflow, a helper command is available:

```bash id="v1m2j0"
pnpm dev:deploy
```

This command automates the deployment process including build upload, cache clearing, and service restart steps, reducing the need to execute commands manually.
