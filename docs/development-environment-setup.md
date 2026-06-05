# Development Environment Setup

## System Requirements

- **OS**: Windows, macOS, or Linux
- **PHP**: ^8.5 (require additional extensions: imagick, gd, iconv, psql)
- **Server**: LAMP, WAMP, XAMPP, Laravel Herd, or equivalent
- **SSH**: Pre-installed on most systems; install if needed
- **PostgreSQL**: v18 with pgvector extension
- **Node.js**: Required for frontend tooling and Vite builds
- **PNPM**: Required for frontend dependency management

For Windows users, pgvector can be installed from:

```text id="x5lq2m"
https://github.com/andreiramani/pgvector_pgsql_windows/releases
```

---

# Required Tools

## VS Code

VS Code based editor is mandatory for this project. You can also use Cursor if you want.

Download:

```text id="4ykg7n"
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

```bash id="sz6mfd"
pnpm install
```

the repository automatically installs and updates Git hooks.

These hooks run formatting and linting checks before every commit to keep code quality and formatting consistent across all developers.

The pre-commit hooks automatically run:

- **Prettier** for frontend and general file formatting
- **ESLint** for JavaScript and TypeScript linting
- **Laravel Pint** for PHP formatting

Because of this setup, developers usually do not need to run formatters manually before committing changes. If formatting issues are detected, the hooks may automatically fix them or block the commit until issues are resolved.

But for convenience during development, current project configured to run code formatting on save. So make sure the following formatter available:

- **PHP Formatter**: Intelephense
- **TSX / JSX Formatter**: Prettier
- **JavaScript Formatter**: Prettier
- **TypeScript Formatter**: Prettier
- **JSON Formatter**: Prettier
- **CSS Formatter**: Prettier

This keeps formatting consistent across the project.

---

## Recommended Extensions

- [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat) — AI coding assistant (paid)

---

## Additional Tools

- **FileZilla** — File transfer and deployment management

Download:

```text id="5t10gp"
https://filezilla-project.org/
```

- **Node.js**

Download:

```text id="wz2xj8"
https://nodejs.org/
```

- **PNPM**

Install globally:

```bash id="igjlwm"
npm install -g pnpm
```
