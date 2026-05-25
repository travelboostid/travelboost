# Debugging Setup Guide

This document explains how to configure PHP Xdebug for local debugging in our project using VSCode, Xdebug v3, Google Chrome, and the Xdebug Helper by JetBrains extension.

The goal of this setup is to provide a more efficient and maintainable debugging workflow compared to relying only on `echo`, `dump()`, `dd()`, or log statements. While those methods are still useful for quick inspections, they become difficult to manage when debugging complex Laravel applications, especially when working with queued jobs, event listeners, middleware pipelines, service classes, background workers, and asynchronous processes.

With Xdebug, developers can pause application execution at specific lines using breakpoints, inspect variables and object states in real time, follow the execution flow step-by-step, and analyze stack traces directly from the editor. This makes it much easier to identify the root cause of issues without repeatedly modifying the source code to add temporary debug statements.

Using a proper debugger also helps reduce noise in commits and prevents accidental debug code from being left in the codebase. Instead of inserting multiple `dd()` or logging statements throughout the application, developers can inspect the runtime behavior interactively without changing business logic.

This setup is particularly important for our project because many parts of the system run outside normal HTTP request flows, such as queues, event listeners, scheduled tasks, and background processes. These flows are often difficult to debug effectively using traditional print-based debugging techniques alone.

## Requirements

Make sure yo have installed:

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
