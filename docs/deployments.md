# Deployments Guide

## Internal Server Details

- Project location: `/home/travelboost/travelboost-dev`
- Synced with the `dev` branch of the repository

## Backend Update Steps

### Connect via SSH

```bash
ssh [IP_TO_SERVER]
```

You'll need a public key to connect. Ask a teammate if you need credentials.

### Navigate to the project folder

```bash
cd ~/travelboost-dev
```

### Pull the latest changes

```bash
git pull
```

### Update Composer dependencies (if needed)

```bash
composer install
```

### Update `.env` if needed

```bash
nano .env
```

Press `Ctrl + S` to save, then `Ctrl + X` to exit.

## Frontend

### Update `.env` using the development configuration

### Build the frontend

```bash
pnpm build
```

### Upload the build

Upload the build directory to `~/travelboost/public/build`

## Clear cache

Run this command on the server:

```bash
php artisan optimize:clear
```
