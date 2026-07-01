# Debugging

Xdebug for local breakpoints, plus production log and Telescope guidance.

Doc index: [README](../README.md)

See also: [Local Development](./local-development.md) · [Configuration](./configuration.md) · [Cloudflare Tunnel](./cloudflare-tunnel.md) (Telescope on tunnel preset) · [Production App Server](./production-app-server.md)

Use Xdebug when print debugging (`dd()`, logs) is awkward — especially for queued jobs, event listeners, and background workers.

On production servers, start with `storage/logs/laravel.log`, Supervisor logs, and Telescope (exceptions only) — see [Production debugging](#production-debugging) below.

## Production debugging

### Laravel log

```bash
ssh travelboost@<server-ip>
cd ~/travelboost
tail -f storage/logs/laravel.log
```

If the file does not grow during web requests, PHP-FPM (`www-data`) may lack write permission. Typical symptoms:

- **500** with `could not be opened in append mode: Permission denied` (cannot write `storage/logs/laravel.log`)
- **500** with `tempnam(): file created in the system's temporary directory` (cannot write compiled Blade views under `storage/framework/views`)

```bash
ls -la storage/logs/
sudo -u www-data test -w storage/logs/laravel.log && echo "log OK"
sudo -u www-data test -w storage/framework/views && echo "views OK"
```

Fix: [Deployment — Fix storage permissions](./deployment.md#fix-storage-permissions-when-needed).

### Supervisor logs

Queue worker, scheduler, and Reverb stdout:

```text
storage/logs/queue-worker.log
storage/logs/reverb.log
storage/logs/scheduler.log
```

Workers run as `travelboost` per `infra/supervisor/travelboost.conf`. Log files should be `travelboost:www-data`, not `root`.

### Telescope (production)

- URL: `https://travelboost.co.id/telescope` (or your app host + `/telescope`)
- Access: users with the `user:admin` role (`TelescopeServiceProvider` gate)
- **Filtered on production** (`app/Providers/TelescopeServiceProvider.php`): only reportable exceptions, failed requests, failed jobs, scheduled tasks, and monitored tags are stored — not successful HTTP requests

Locally (tunnel preset / `local` environment), Telescope records full request history.

---

## Local Xdebug setup

### Requirements

- PHP with Xdebug extension (CLI — `php artisan` and queue workers use the CLI `php.ini`)
- VS Code or Cursor with [PHP Debug](https://marketplace.visualstudio.com/items?itemName=xdebug.php-debug)
- [Xdebug Helper](https://chromewebstore.google.com/detail/xdebug-helper-by-jetbrain/aoelhdemabeimdhedkidlnbkfhnhgnhm) browser extension (trigger mode)

Verify Xdebug is loaded:

```bash
php -v
php --ini   # note Loaded Configuration File — edit this php.ini
```

### Recommended `php.ini` settings

```ini
[xdebug]
xdebug.mode=debug
xdebug.start_with_request=trigger
xdebug.client_host=127.0.0.1
xdebug.client_port=9003
```

Use `start_with_request=trigger` so Xdebug only runs when the browser extension enables it — otherwise every artisan/queue request slows down.

Restart PHP services after editing `php.ini`. Full walkthrough: [VS Code PHP Debug extension docs](https://marketplace.visualstudio.com/items?itemName=xdebug.php-debug).

### Debug in VS Code

1. Start the dev stack: `pnpm dev:full`
2. Open **Run and Debug** → select **Debug (Backend)** (from `.vscode/launch.json`)
3. Enable Xdebug Helper in the browser, set breakpoints, reload the page

### Frontend debugging

With the dev server running, use **Debug (Frontend)** or **Debug (Fullstack)** from the Run and Debug panel.
