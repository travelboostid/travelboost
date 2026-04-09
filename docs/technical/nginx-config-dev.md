# Nginx Setup (dev)

## Overview

This setup enables all subdomains under:

```
*.dev.travelboost.co.id
```

to be served by a single Nginx configuration, with a wildcard SSL certificate issued via DNS verification.

## DNS Configuration (Required First)

Create the following DNS records:

### Wildcard record

```
Type: A
Name: *.dev.travelboost.co.id
Value: <YOUR_SERVER_IP>
```

### Root dev subdomain

```
Type: A
Name: dev.travelboost.co.id
Value: <YOUR_SERVER_IP>
```

### For SSL verification (temporary)

You will later add:

```
Type: TXT
Name: _acme-challenge.dev.travelboost.co.id
Value: <TOKEN_FROM_CERTBOT>
```

⚠️ DNS must fully propagate before proceeding.

## Generate Wildcard SSL Certificate

Use Certbot with DNS challenge:

```bash
sudo certbot certonly \
  --manual \
  --preferred-challenges dns \
  -d dev.travelboost.co.id \
  -d '*.dev.travelboost.co.id'
```

When prompted, add the TXT record:

```
_acme-challenge.dev.travelboost.co.id
```

Wait for propagation, then continue.

Certificates will be stored at:

```
/etc/letsencrypt/live/dev.travelboost.co.id/
```

## Nginx Configuration

Create file:

```
/etc/nginx/sites-available/travelboost-dev
```

### Basic wildcard config

```nginx
server {
    listen 443 ssl;
    server_name reverb.dev.travelboost.co.id;

    ssl_certificate /etc/letsencrypt/live/dev.travelboost.co.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev.travelboost.co.id/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;

    location / {
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_pass http://127.0.0.1:8080;
    }
}

server {
    listen 443 ssl;
    server_name dev.travelboost.co.id *.dev.travelboost.co.id;

    root /home/travelboost/travelboost-dev/public;
    index index.php index.html;

    ssl_certificate /etc/letsencrypt/live/dev.travelboost.co.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev.travelboost.co.id/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;

    access_log /var/log/nginx/dev-access.log;
    error_log /var/log/nginx/dev-error.log;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.4-fpm.sock;
        # Laravel PHP-FPM buffer
        fastcgi_buffers 16 16k;
        fastcgi_buffer_size 32k;
        fastcgi_busy_buffers_size 64k;
        fastcgi_temp_file_write_size 64k;
    }

    location ~ /\. {
        deny all;
    }
}

server {
    listen 80;
    server_name dev.travelboost.co.id *.dev.travelboost.co.id;
    return 301 https://$host$request_uri;
}
```

## Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/travelboost-dev /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Notes / Pitfalls

- Wildcard DNS does **not** cover the root (`dev.travelboost.co.id`) → must be added separately
- Wildcard SSL **requires DNS challenge**, not HTTP
- DNS propagation delays are the most common failure point
- Manual certbot requires renewal every 90 days unless automated
