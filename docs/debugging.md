# Debugging

Xdebug for local breakpoints, plus production log and Telescope guidance.

Doc index: [README](../README.md)

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

Queue worker, scheduler, and Reverb stdout (including queued `ChatMessageCreated` broadcast jobs):

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
- Do not expect chat `POST` history in Telescope on live; use `laravel.log` and the database (`chat_messages`) instead

Locally (tunnel preset / `local` environment), Telescope records full request history.

---

## Requirements

Make sure you have installed:

- PHP with Xdebug extension
- VSCode
- PHP Debug extension for VSCode
- Google Chrome
- Xdebug Helper by JetBrains

Chrome extension:

[Xdebug Helper by JetBrains](https://chromewebstore.google.com/detail/xdebug-helper-by-jetbrain/aoelhdemabeimdhedkidlnbkfhnhgnhm?utm_source=chatgpt.com)

VSCode extension:

[PHP Debug Extension](https://marketplace.visualstudio.com/items?itemName=xdebug.php-debug&utm_source=chatgpt.com)

---

## Verify Xdebug Installed

Run:

```bash
php -v
```

## Configuring

Configure Xdebug in your active `php.ini` file.

First, ensure the Xdebug extension is installed and available on your machine. Download the appropriate version matching your:

- PHP version
- Thread safety (`ts` / `nts`)
- Architecture (`x64`)
- Visual Studio build

Then enable the extension by adding the following under the `[xdebug]` section in `php.ini`.

### Important Notes About Multiple `php.ini` Files

Many PHP environments can contain multiple `php.ini` files depending on how PHP is executed, including:

- WAMP
- XAMPP
- Laragon
- Docker
- PHP-FPM
- Apache
- CLI installations

Commonly there are separate configurations for:

- web server requests
- CLI/terminal execution

This is important because our Laravel project is typically run through CLI commands such as:

```bash
php artisan serve
```

as well as:

- `php artisan queue:work`
- `php artisan schedule:work`
- `composer`
- PHPUnit tests

which means the active configuration is usually the **CLI `php.ini`**, not Apache's configuration.

Because of this, do not rely only on tray-menu editors or control panel shortcuts, since they may open a different `php.ini` than the one currently used by your terminal environment.

Instead, always verify the active configuration manually.

### Find CLI `php.ini`

Run:

```bash
php --ini
```

Look for:

```text
Loaded Configuration File
```

Example:

```text
Loaded Configuration File: C:\wamp64\bin\php\php8.4.15\php.ini
```

This is the configuration used by:

- artisan
- queues
- scheduler
- CLI scripts

---

### Find Apache `php.ini`

This is optional. In our project, we only need to adjust `php.ini` that used by CLI.

Create a temporary Laravel route or PHP file:

```php
phpinfo();
```

Then open it in browser and search for:

```text
Loaded Configuration File
```

Example:

```text
Loaded Configuration File: C:\wamp64\bin\apache\apache2.4.62\bin\php.ini
```

This is the configuration used by:

- browser requests
- APIs
- controllers
- middleware

---

### Important Xdebug Setting

Use:

```ini
xdebug.start_with_request=trigger
```

This ensures the debugger only activates when requests are explicitly triggered by the browser extension. Without this configuration, Xdebug will run on every PHP execution, including:

- normal web requests
- artisan commands
- queues
- scheduler
- composer commands

which can significantly slow down development performance.

---

### Example `php.ini` Configuration

```ini
[xdebug]
zend_extension="c:/wamp64/bin/php/php8.4.15/zend_ext/php_xdebug-3.4.7-8.4-ts-vs17-x86_64.dll"

; Available modes:
; off, develop, coverage, debug, gcstats, profile, trace
xdebug.mode=debug

xdebug.output_dir="c:/wamp64/tmp"
xdebug.show_local_vars=0

xdebug.log="c:/wamp64/logs/xdebug.log"

; Log levels:
; 0 = Critical
; 1 = Connection
; 3 = Warnings
; 5 = Communication
; 7 = Information
; 10 = Debug / Breakpoints
xdebug.log_level=7

xdebug.profiler_output_name=trace.%H.%t.%p.cgrind"
xdebug.use_compression=false

; Only start debugger when triggered by browser extension
xdebug.start_with_request=trigger

xdebug.client_host=127.0.0.1
xdebug.client_port=9003
```

After updating the configuration, restart Apache, PHP services, Laragon, Herd, Docker containers, or any related PHP process depending on your environment.

## Develop with Debugging

Start the Laravel development environment:

```bash
pnpm dev:full
```

After the development server has started, open VSCode and start the Xdebug listener.

In VSCode:

1. Open the **Run and Debug** panel
2. Select:
    - `Debug (Backend)`
3. Click the run/play button

This configuration is defined in:

```text
.vscode/launch.json
```

Example configuration:

```json
{
    "configurations": [
        {
            "name": "Debug (Backend)",
            "type": "php",
            "request": "launch",
            "port": 9003
        }
    ]
}
```

Once the listener is active, open the application in browser with the Xdebug Helper extension enabled. Any active breakpoints in VSCode should now pause execution automatically.

## Frontend Debugging

After the dev server is running, open the **Run and Debug** panel and run the **Debug (Frontend)** configuration. Additionally, you can run the backend and frontend simultaneously using the **Debug (Fullstack)** configuration.

---

## Troubleshooting Chatbot Auto-Reply

Chatbot auto-reply runs outside a normal controller response: a model event triggers `ChatbotAutoReply`, which calls `ChatbotAgent`. This makes it a good candidate for log inspection or Xdebug breakpoints rather than `dd()` in the controller.

**Quick checks:**

```bash
# Watch for listener failures
tail -f storage/logs/laravel.log | rg -i "ChatbotAutoReply"

# Confirm bcmath is loaded (required for credit checks)
php -r 'echo function_exists("bccomp") ? "bcmath OK\n" : "bcmath MISSING\n";'

# Confirm a bot message was created in the database
php artisan tinker --execute 'dump(App\Models\ChatMessage::where("is_bot", true)->latest()->first()?->only(["id", "message", "created_at"]));'
```

**Useful breakpoint locations:**

- `app/Listeners/ChatbotAutoReply.php` — listener entry
- `app/Ai/Agents/ChatbotAgent.php` — `setup()` (conditions gate) and `reply()` (AI call)

For the full flow, prerequisites, and common errors (including **server error but message saved**), see [Live Chat & Chatbot](./live-chat.md).
