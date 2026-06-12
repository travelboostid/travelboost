# Local Development

Set up PHP, PostgreSQL, Node, and the dev stack on your machine.

Doc index: [README](../README.md)

## Prerequisites

- **OS**: Windows, macOS, or Linux
- **PHP**: ^8.5 with required extensions:
    - **bcmath** — required for chatbot AI credit billing (`ChatbotAgent`)
    - **imagick**, **gd**, **iconv**, **pgsql** (PostgreSQL)
- **Server**: LAMP, WAMP, XAMPP, Laravel Herd, or equivalent
- **SSH**: Pre-installed on most systems; install if needed
- **PostgreSQL**: v18 with pgvector extension
- **Node.js**: Required for frontend tooling and Vite builds
- **PNPM**: Required for frontend dependency management

Verify PHP extensions:

```bash
php -r 'echo function_exists("bccomp") ? "bcmath OK\n" : "bcmath MISSING — enable php-bcmath\n";'
php -m | rg -i "pgsql|imagick|gd|bcmath"
```

On Arch Linux, `bcmath` is often built as a shared module but not enabled by default:

```bash
echo 'extension=bcmath' | sudo tee /etc/php/conf.d/bcmath.ini
```

For Windows users, pgvector can be installed from:

```text
https://github.com/andreiramani/pgvector_pgsql_windows/releases
```

---

## Required tools

## VS Code

VS Code based editor is mandatory for this project. You can also use Cursor if you want.

Download:

```text
https://code.visualstudio.com/
```

---

## Essential Extensions

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) — JavaScript and TypeScript linting

- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) — Main formatter for frontend files

- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) — Tailwind autocomplete and validation

- [Intelephense](https://marketplace.visualstudio.com/items?itemName=bmewburn.vscode-intelephense-client) — Main PHP language server

- [Laravel Extension Pack](https://marketplace.visualstudio.com/items?itemName=laravel.vscode-laravel) — Laravel tooling and Blade integration

- [PHP Tools](https://marketplace.visualstudio.com/items?itemName=DEVSENSE.phptools-vscode) — Advanced PHP tooling and debugging

- [Composer PHP Extension](https://marketplace.visualstudio.com/items?itemName=DEVSENSE.composer-php-vscode) — Composer integration inside VS Code

- [Continue](https://marketplace.visualstudio.com/items?itemName=Continue.continue) — AI coding assistant integration

- [Intelli PHP](https://marketplace.visualstudio.com/items?itemName=DEVSENSE.intelli-php-vscode) — Additional PHP IntelliSense support

- [PHP Debug](https://marketplace.visualstudio.com/items?itemName=xdebug.php-debug) — Xdebug breakpoint debugging support

---

## Formatter Configuration

After running:

```bash
pnpm install
```

Git hooks run Prettier, ESLint, and Laravel Pint before each commit. Format on save is enabled in the repo — use these formatters:

- **PHP Formatter**: Intelephense
- **TSX / JSX Formatter**: Prettier
- **JavaScript Formatter**: Prettier
- **TypeScript Formatter**: Prettier
- **JSON Formatter**: Prettier
- **CSS Formatter**: Prettier

---

## Recommended extensions

- [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat) — AI coding assistant (paid)

---

## Additional Tools

- **FileZilla** — File transfer and deployment management

Download:

```text
https://filezilla-project.org/
```

- **Node.js**

Download:

```text
https://nodejs.org/
```

- **PNPM**

Install globally:

```bash
npm install -g pnpm
```

---

## Running the Dev Server

Start the full local stack (Reverb, queue worker, Vite, and Laravel):

```bash
pnpm dev:full
```

This is required for features that depend on real-time updates, including **live chat and chatbot replies**. The npm scripts pass `-d extension=bcmath` to PHP so the chatbot works even when bcmath is not enabled system-wide.

Individual processes can also be run separately:

```bash
pnpm dev:serve   # Laravel HTTP server
pnpm dev:reverb  # WebSocket server (chat broadcasts)
pnpm dev:queue   # Queue worker
pnpm dev:vite    # Frontend HMR
```

---

## Regenerating the API client (Orval)

JSON endpoints live under `/webapi`. TypeScript types and React Query hooks are generated from the Scramble OpenAPI spec — do not hand-write types for those routes.

After changing any Webapi controller, Form Request, or API Resource:

```bash
pnpm orval
```

Requires the Laravel server to be running (`pnpm dev:serve` or `pnpm dev:full`) so Orval can fetch `/docs/api.json`.

Full conventions: [Web API & Orval](./webapi-orval.md).

See [Live Chat & Chatbot](./live-chat.md) for how chat auto-reply works and how to troubleshoot it.

For payment gateway webhooks (Midtrans, PrismaLink) and other HTTPS callbacks to your local machine, see [Cloudflare Tunnel](./cloudflare-tunnel.md).
