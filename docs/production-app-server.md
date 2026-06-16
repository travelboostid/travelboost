# Production App Server

First-time setup for `tb-app-dev` / `tb-app-main`: PHP, Caddy, Supervisor, deploy user.

Doc index: [README](../README.md) · Hosts: [Server Inventory](./server-inventory.md) · Deploy: [Deployment](./deployment.md)

## Installing required packages

Update the package index and install all required dependencies including PHP, Composer, Supervisor, database drivers, and image processing extensions.

```bash
sudo apt update
sudo apt install -y composer supervisor php php-cli php-fpm php-common php-mbstring php-xml php-curl php-zip php-bcmath php-intl php-pgsql php-sqlite3 php-gd php-imagick
```

Verify `bcmath` is loaded after install. The chatbot (`ChatbotAgent`) depends on it for AI credit billing:

```bash
php -r 'echo function_exists("bccomp") ? "bcmath OK\n" : "bcmath MISSING\n";'
```

On some Linux distributions the extension package is installed but not enabled in `php.ini`. Enable it in `/etc/php/conf.d/` if the check above fails.

---

## Installing Caddy

Install Caddy using the official repository.

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list

sudo chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg
sudo chmod o+r /etc/apt/sources.list.d/caddy-stable.list

sudo apt update
sudo apt install caddy
```

---

## Configuring SSL Certificates

Production deployments use Cloudflare Origin SSL certificates instead of generating SSL certificates for every subdomain.

Generate an Origin Certificate from Cloudflare with the following domains:

```text
travelboost.co.id
*.travelboost.co.id
*.dev.travelboost.co.id
```

Store the certificate and private key in:

```text
/etc/ssl/cloudflare/travelboost/origin.crt
/etc/ssl/cloudflare/travelboost/origin.key
```

These files are referenced inside the Caddy configuration.

---

## Configuring PHP Limits

Update PHP configuration for both FPM and CLI.

```bash
sudo nano /etc/php/8.5/fpm/php.ini
sudo nano /etc/php/8.5/cli/php.ini
```

Set the following values:

```ini
max_execution_time = 300
max_input_time = 300
memory_limit = 256M
post_max_size = 100M
upload_max_filesize = 100M
```

Restart PHP FPM after updating the configuration.

```bash
sudo systemctl restart php8.5-fpm
```

---

## Cloning the Repository

Clone the correct branch into the home directory.

```bash
git clone -b <dev | main> --single-branch https://github.com/travelboostid/travelboost.git

cd travelboost
```

---

## Configuring Environment Variables

Create and configure the `.env` file with the required application settings.

```bash
nano .env
```

Fill all required database, cache, queue, mail, and application configuration values before continuing.

For live deployments, media files are stored on S3-compatible object storage. See [Object Storage (S3)](./object-storage.md) for bucket names, credentials, and client setup.

Example live object storage settings (dev — use `tb-media-main` on production):

```env
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=tb-media-dev
AWS_URL=https://nos.wjv-1.neo.id/tb-media-dev
AWS_ENDPOINT=https://nos.wjv-1.neo.id
AWS_USE_PATH_STYLE_ENDPOINT=true
```

Access key and secret are available in the Biznet GIO account.

---

## Installing Dependencies

Install Composer dependencies in production mode.

```bash
composer install --no-dev --optimize-autoloader
```

---

## Running Database Migration

Run database migrations and seeders.

```bash
php artisan migrate:fresh --seed
```

For existing production databases, use:

```bash
php artisan migrate --force
```

---

## Linking Laravel Storage

Create the Laravel public storage symlink when serving uploads from the local disk (development or legacy setups).

```bash
php ~/travelboost/artisan storage:link
```

This links `public/storage` to `storage/app/public`.

On live, user media is stored in S3 (`tb-media-dev`). The symlink is not required for those uploads. See [Object Storage (S3)](./object-storage.md).

---

## Configuring Permissions

Configure ownership and permissions so Laravel, queues, and Caddy can access required directories properly.

```bash
sudo usermod -aG www-data travelboost

sudo chmod 711 /home/travelboost

sudo chown -R travelboost:www-data /home/travelboost/travelboost/public
sudo chown -R travelboost:www-data /home/travelboost/travelboost

sudo find /home/travelboost/travelboost -type d -exec chmod 755 {} \;
sudo find /home/travelboost/travelboost -type f -exec chmod 644 {} \;

sudo chmod -R 775 /home/travelboost/travelboost/storage
sudo chmod -R 775 /home/travelboost/travelboost/bootstrap/cache

sudo find /home/travelboost/travelboost -type d -exec chmod g+s {} \;
```

---

## Configuring Supervisor

Supervisor is used to run Laravel queue workers, scheduler processes, and Reverb services.

Link the Supervisor configuration:

```bash
sudo ln -sf /home/travelboost/travelboost/infra/supervisor/travelboost.conf /etc/supervisor/conf.d/travelboost.conf
```

Reload Supervisor:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all
```

---

## Building Frontend Assets

Frontend assets are built locally because the VPS has limited resources.

Automated path (recommended): `pnpm dev:deploy` — see [Deployment](./deployment.md).

Manual path:

```bash
pnpm dev:setenv    # pick dev or main preset for Vite env vars
pnpm build
```

Upload `public/build/` to `~/travelboost/public/build/` on the server, or run `pnpm dev:deploy -- --skip-backend` to build and rsync automatically.

---

## Optional Development Configuration

To allow deployment scripts to control services without entering sudo passwords, update the sudoers configuration.

```bash
sudo visudo
```

Add the following rules:

```text
# Allow using supervisorctl without password
travelboost ALL=NOPASSWD: /usr/bin/supervisorctl

# Allow reload/restart nginx without password
travelboost ALL=NOPASSWD: /bin/systemctl reload nginx, /bin/systemctl restart nginx
```

---

## Allowing Caddy to Use Low Ports

Allow Caddy to bind to ports 80 and 443 without running as root.

```bash
sudo setcap CAP_NET_BIND_SERVICE=+eip $(which caddy)
```

---

## Starting the Server

Caddy runs as a **systemd service** on the VPS (`caddy.service`). Do **not** run `caddy start` while the service is active — it tries to bind the admin port `127.0.0.1:2019` and fails with `address already in use`.

Install the repo config into `/etc/caddy/Caddyfile`, then reload:

Production (`tb-app-main`):

```bash
cd ~/travelboost
sudo cp infra/caddy/Caddyfile.main /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
ss -tlnp | grep -E ':80|:443'
```

Development (`tb-app-dev`):

```bash
cd ~/travelboost
sudo cp infra/caddy/Caddyfile.dev /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

If you must run Caddy manually (debug only), stop the service first:

```bash
sudo systemctl stop caddy
caddy run --config ./infra/caddy/Caddyfile.main
```
