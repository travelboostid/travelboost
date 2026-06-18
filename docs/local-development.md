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
- **Node.js**: Required for frontend tooling and Vite builds — install via [nvm](#nodejs-nvm) (recommended)
- **PNPM**: Required for frontend dependency management — install via npm after Node.js ([nvm](#nodejs-nvm))
- **AWS CLI v2**: Required for S3 bucket inspection and media debugging — see [Object Storage (S3)](./object-storage.md)

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

### Node.js (nvm)

Install [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager), then install the latest Node.js release (includes npm):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

Reload your shell (or open a new terminal):

```bash
source ~/.bashrc   # bash
# source ~/.zshrc  # zsh
```

Install and use the latest Node.js, then install PNPM globally via npm:

```bash
nvm install node
nvm use node
node -v
npm -v

npm install -g pnpm
pnpm -v
```

`nvm install node` tracks the [current release](https://github.com/nvm-sh/nvm#usage) from nodejs.org. To pin a version later: `nvm install 22` then `nvm use 22`.

Official docs: [github.com/nvm-sh/nvm](https://github.com/nvm-sh/nvm)

On **Windows**, use [WSL](https://learn.microsoft.com/en-us/windows/wsl/) and follow the steps above, or [nvm-windows](https://github.com/coreybutler/nvm-windows) as a separate tool.

- **AWS CLI v2**

Required for working with Neo object storage (media buckets). Install from:

```text
https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
```

Verify:

```bash
aws --version
```

Configure a named profile (recommended — do not commit keys):

```bash
aws configure --profile travelboost-s3
```

Quick test (readonly dev key or any key with implicit access to the bucket):

```bash
aws s3 ls s3://tb-media-dev --endpoint-url https://nos.wjv-1.neo.id --profile travelboost-s3
```

Full setup: [Object Storage (S3)](./object-storage.md).

---

## Environment presets

Presets live at the project root as `.env.preset.*`. Pick one with:

```bash
pnpm dev:setenv
```

This copies the selected file to `.env` for local work. Deploy uses presets directly — see [Deployment](./deployment.md).

| File                 | Use for                                                               |
| -------------------- | --------------------------------------------------------------------- |
| `.env.preset.local`  | Normal local dev — `lvh.me`, local PostgreSQL, no outbound email      |
| `.env.preset.tunnel` | Payment webhooks & OAuth — public URL `tunnel-8000.travelboost.co.id` |
| `.env.preset.dev`    | Dev server deploy target (`pnpm dev:deploy -- -e dev`)                |
| `.env.preset.main`   | Production deploy target (`pnpm dev:deploy -- -e main`)               |

First-time setup runs `pnpm dev:setenv` as part of `pnpm dev:init`. Ask a teammate for preset files if they are not in your clone.

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
