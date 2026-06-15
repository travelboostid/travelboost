# Team SOP

Git workflow, pull request conventions, and coding best practices.

Doc index: [README](../README.md)

---

## Branches

| Branch | Purpose               |
| ------ | --------------------- |
| `main` | Production            |
| `dev`  | Integration / staging |

Never commit or push directly to `main` or `dev`.

### Branch naming

Use short, descriptive names with a prefix:

```text
feat/chat-widget-settings
fix/wallet-deposit-validation
docs/webapi-orval
refactor/media-upload-service
chore/deps-bump
```

One logical change per branch. Split unrelated work into separate PRs.

---

## Commits

Recommended format:

```text
[TAG]: short imperative summary
```

Tags: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`

Examples:

```text
feat: add tour category policy checks
fix: prevent duplicate wallet deposits
docs: simplify deployment steps
```

### Commit hygiene

- One concern per commit when possible — easier to review and revert
- Write messages for reviewers, not just yourself
- Do not commit secrets, `.env` values, or local-only config
- Do not commit generated noise unless the repo expects it (e.g. run `pnpm orval` when Web API types change)

---

## Pull requests

### Workflow

1. Pull latest `dev` before starting work
2. Create a feature branch from `dev`
3. Push and open a PR targeting `dev`
4. Request review; address feedback
5. Merge after approval and green CI

For production: open PRs targeting `main` from stable feature branches, or merge `dev` → `main` when both branches are aligned and tested.

### PR description

Include:

- **What** changed and **why**
- **How to test** (steps, URLs, accounts if needed)
- **Screenshots / recordings** for UI changes
- **Migration / deploy notes** if schema, env vars, or server steps changed

Link related issues or chat threads when relevant.

### Scope

- Keep PRs focused — small PRs merge faster and are easier to review
- Avoid drive-by refactors mixed with feature work
- Split large changes into stacked or sequential PRs when needed

### Review etiquette

**Authors**

- Respond to every comment — fix, explain, or resolve with reason
- Re-request review after meaningful updates
- Do not merge your own PR without a review (except agreed hotfix process)

**Reviewers**

- Be specific: file, line, and suggested direction
- Approve when ready; do not block on style nits already handled by linters
- Test non-trivial changes locally when you can

### Git history rules

**Do**

- Keep branch up to date with `dev` (merge `dev` into your branch)
- Pull latest `dev` before starting new work
- Use feature branches for isolated work

**Don't**

- Force-push a branch others are using or that was already merged to remote
- Rebase a shared/pushed branch — prefer **merge** over rebase
- Rebase after merging `dev` into your branch — use merge instead
- Mix unrelated changes in one commit or PR

---

## Before you push

Pre-commit hooks (Husky + lint-staged) run on staged files. Fix what they report before committing.

Run these before opening a PR when your change touches the relevant area:

| Check            | Command             | When                                         |
| ---------------- | ------------------- | -------------------------------------------- |
| PHP tests + Pint | `composer test`     | Backend logic, migrations, policies          |
| Frontend types   | `pnpm types`        | TypeScript / React changes                   |
| Frontend lint    | `pnpm lint`         | JS/TS changes (also in CI)                   |
| API client regen | `pnpm orval`        | Webapi controllers, Form Requests, Resources |
| i18n strings     | `pnpm i18n:extract` | New user-facing copy in React                |

CI runs tests and lint on PRs to `dev` and `main` — fix failures before merge.

Local full stack for chat, queues, and real-time features: `pnpm dev:full` ([Local Development](./local-development.md)).

---

## Coding standards

### General

- **English** for code, comments, commits, and PR text
- **Descriptive names** — `isRegisteredForDiscounts`, not `check()`
- **Match existing patterns** — read sibling files before adding new code
- **DRY** — extract repeated logic; do not copy-paste
- **Minimal comments** — code should be clear; comment only non-obvious business rules
- **Remove dead code** — no commented-out blocks left behind
- **Balance simplicity and scale** — requirements are often complex; do not add unnecessary abstraction

### Laravel (backend)

- Follow the Laravel way: Form Requests, Policies, API Resources, Eloquent relationships
- Put Web API actions in `App\Http\Controllers\Webapi\` with routes in `routes/webapi.php`
- Validate with Form Request classes, not inline `$request->validate()` in controllers
- Authorize with Policies; register permissions in `config/travelboost.php` when adding new abilities
- Return API Resources from `/webapi` endpoints for typed OpenAPI output
- Use `@operationId` on Webapi actions and run `pnpm orval` — see [Web API & Orval](./webapi-orval.md)
- Add or update **Pest tests** for behavior you introduce or fix
- Use factories in tests; avoid hand-built model setup when a factory state exists

### Database

- One migration per logical change; never edit a migration already merged to `dev`
- Destructive changes (`dropColumn`, data wipes) need explicit review and deploy notes
- Never run `migrate:fresh` on shared or production databases
- Seeders/factories: keep realistic defaults; production seeders live under `database/seeders/Production/`

### Frontend (React + Inertia)

- Pages live in `resources/js/pages/`; reuse existing components before creating new ones
- User-facing strings via `<FormattedMessage />` or `intl.formatMessage()` — see [Translations (i18n)](./i18n.md)
- Use generated Orval hooks/types from `@/api/` for `/webapi` calls — do not duplicate TS types by hand
- Prefer Wayfinder route helpers (`@/routes/`, `@/actions/`) over hard-coded URLs
- Keep client state predictable — follow existing Zustand / Inertia patterns in the area you touch

### Security

- Never commit `.env`, credentials, or API keys
- Ask a teammate for env values; use `.env.preset.*` locally
- Validate and authorize on the server — frontend checks are UX only
- Treat uploads, webhooks, and admin actions as untrusted input

---

## Environment & config

- Local setup: `pnpm dev:init` then `pnpm dev:full` — see [Local Development](./local-development.md)
- Switch presets with `pnpm dev:setenv`; do not hand-edit env files without knowing the preset
- New env vars need `.env.example` updates and deploy notes in the PR

---

## Deploy awareness

Changes that affect production need callouts in the PR:

- New or changed `.env` variables (update matching `.env.preset.*` and `.env.example`)
- Migrations (`php artisan migrate --force` on server)
- Frontend build upload (`pnpm build` → `public/build/` on VPS)
- Supervisor restart (`sudo supervisorctl restart all`)

Release from a clean tree on the correct branch:

```bash
git push origin dev    # or main
pnpm dev:deploy -- -e dev    # or -e main for production
```

See [Deployment](./deployment.md) for manual steps, skip flags, and server mapping.

---

## Related docs

| Topic         | Doc                                         |
| ------------- | ------------------------------------------- |
| Local setup   | [Local Development](./local-development.md) |
| Architecture  | [Architecture](./architecture.md)           |
| Web API types | [Web API & Orval](./webapi-orval.md)        |
| Translations  | [Translations (i18n)](./i18n.md)            |
| Deploy        | [Deployment](./deployment.md)               |
