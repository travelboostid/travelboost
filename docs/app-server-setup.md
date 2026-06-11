# App Server Setup

## Installing Required Packages

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

Create the Laravel public storage symlink.

```bash
php ~/travelboost/artisan storage:link
```

This links `public/storage` to `storage/app/public`.

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

Select the environment configuration:

```bash
pnpm dev:setenv
```

Build the frontend assets:

```bash
pnpm build
```

Upload the generated build files into the server public directory.

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

Start Caddy using the appropriate configuration file.

Production:

```bash
caddy start --config ./infra/caddy/Caddyfile.main
```

Development:

```bash
caddy start --config ./infra/caddy/Caddyfile.dev
```
