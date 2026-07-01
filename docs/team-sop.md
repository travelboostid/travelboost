# Team SOP

Git workflow, pull request conventions, and coding best practices.

Doc index: [README](../README.md)

**End-to-end flow (charts):** [Development Flow](./development-flow.md) — clone → branch → PR → merge → deploy, production release, and hotfix paths.

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

See [Development Flow](./development-flow.md) for full diagrams. Summary:

1. Pull latest `dev` before starting work
2. Create a feature branch from `dev`
3. Push and open a PR targeting `dev`
4. Request review when possible; address feedback (required GitHub approvals are **not** configured yet)
5. Merge when CI is green and the change is ready
6. Deploy staging: `pnpm dev:deploy`

For production: merge `dev` → `main` when staging is verified, then `pnpm dev:deploy -- -e main`. For urgent live fixes, use the [hotfix flow](./development-flow.md#hotfix-flow-urgent-production-fix).

### PR description

Include:

- **What** changed and **why**
- **How to test** (steps, URLs, accounts if needed — see [Testing Email Accounts](./testing-email-accounts.md) when you need many unique signup emails)
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

- Keep branch up to date with `dev` (merge `dev` into your branch) — see [Merging Branch Conflicts](./merging-branch-conflicts.md)
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

Local full stack for queues and real-time features: `pnpm dev:full` ([Local Development](./local-development.md)).

---

## Coding standards

Principles we aim for — and common traps to avoid — with links for deeper reading: [Engineering principles](#engineering-principles-recommended-reading).

### General

- **English** for code, comments, commits, and PR text
- **Descriptive names** — `isRegisteredForDiscounts`, not `check()`
- **Match existing patterns** — read sibling files before adding new code
- **DRY** — extract repeated logic; do not copy-paste (but do not abstract too early — see [YAGNI](https://martinfowler.com/bliki/Yagni.html))
- **KISS** — prefer the simplest solution that meets the requirement
- **Guard clauses** — validate preconditions and exit early; keep the happy path flat — see [Guard clauses in the principles table](#engineering-principles-recommended-reading)
- **Refactor continuously** — small tidy steps with tests green; don't defer all cleanup to a mythical refactor week
- **Minimal comments** — code should be clear; comment only non-obvious business rules
- **Remove dead code** — no commented-out blocks left behind
- **Balance simplicity and scale** — requirements are often complex; resist unnecessary abstraction and [speculative generality](https://martinfowler.com/bliki/SpeculativeGenerality.html)
- **Boy Scout Rule** — leave touched code slightly cleaner than you found it
- **Optimize when measured** — profile first; avoid [premature optimization](https://hlopko.com/2019/08/03/premature-optimization/)

### Laravel (backend)

- Follow the Laravel way: Form Requests, Policies, API Resources, Eloquent relationships
- Put Web API actions in `App\Http\Controllers\Webapi\` with routes in `routes/webapi.php`
- Validate with Form Request classes, not inline `$request->validate()` in controllers
- Authorize with Policies; register permissions in `config/travelboost.php` when adding new abilities
- Return API Resources from `/webapi` endpoints for typed OpenAPI output
- Use `@operationId` on Webapi actions and run `pnpm orval` — see [Web API & Orval](./webapi-orval.md)
- Add or update **Pest tests** for behavior you introduce or fix
- Datetimes: [Date & time](./datetime.md)
- API → UI: [Single source of truth](./single-source-of-truth.md)
- Use factories in tests; avoid hand-built model setup when a factory state exists

### Database

- One migration per logical change; never edit a migration already merged to `dev`
- Destructive changes (`dropColumn`, data wipes) need explicit review and deploy notes
- Never run `migrate:fresh` on shared or production databases
- Seeders/factories: keep realistic defaults; production seeders live under `database/seeders/Production/`

### Frontend (React + Inertia)

- Pages live in `resources/js/pages/`; reuse existing components before creating new ones
- User-facing strings via `<FormattedMessage />` or `intl.formatMessage()` — see [Translations (i18n)](./i18n.md)
- **Instants:** [Date & time](./datetime.md) — backend owns UTC; no adjust-before-save/send
- **UI copy & locale:** [Single source of truth](./single-source-of-truth.md) — frontend owns translations; API sends codes not prose
- Use generated Orval hooks/types from `@/api/` for `/webapi` calls — do not duplicate TS types by hand
- Prefer Wayfinder route helpers (`@/routes/`, `@/actions/`) over hard-coded URLs
- Keep client state predictable — follow existing Zustand / Inertia patterns in the area you touch

### Security

- Never commit `.env`, credentials, or API keys
- Ask a teammate for env values; use `.env.preset.*` locally
- Validate and authorize on the server — frontend checks are UX only
- Treat uploads, webhooks, and admin actions as untrusted input

---

## Engineering principles (recommended reading)

These are **guidelines**, not laws. Apply judgment in context — Travelboost code should be boring, readable, and easy to change. When in doubt, prefer clarity over cleverness.

### Principles to follow

| Principle                            | In practice                                                                                                                                                                    | Further reading                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **KISS** (Keep It Simple, Stupid)    | Solve today's problem with the smallest clear design. Fewer moving parts = fewer bugs.                                                                                         | [KISS principle](https://en.wikipedia.org/wiki/KISS_principle)                                                                                                                                                                                                                                                                                                                                                                              |
| **YAGNI** (You Aren't Gonna Need It) | Do not build features, hooks, or abstractions for hypothetical future needs.                                                                                                   | [YAGNI — Martin Fowler](https://martinfowler.com/bliki/Yagni.html)                                                                                                                                                                                                                                                                                                                                                                          |
| **DRY** (Don't Repeat Yourself)      | One source of truth for business rules. Copy-paste across files is a maintenance tax.                                                                                          | [The Pragmatic Programmer](https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/) (book); [DRY in practice — freeCodeCamp](https://www.freecodecamp.org/news/dry-theory-practice/)                                                                                                                                                                                                                           |
| **SOLID**                            | Single responsibility, open/closed, substitutability, small interfaces, depend on abstractions — use as a **smell detector**, not a reason to add layers everywhere.           | [SOLID Revisited — Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Revisited.html)                                                                                                                                                                                                                                                                                                                                 |
| **Make it work → right → fast**      | Correctness first, structure second, performance last — and only where data proves it matters.                                                                                 | [Kent Beck — WikiWikiWeb](https://wiki.c2.com/?MakeItWorkMakeItRightMakeItFast)                                                                                                                                                                                                                                                                                                                                                             |
| **Rule of Three**                    | Wait until you have three similar cases before generalizing into a shared abstraction.                                                                                         | [Rule of Three — WikiWikiWeb](https://wiki.c2.com/?RuleOfThree)                                                                                                                                                                                                                                                                                                                                                                             |
| **Guard clauses (early exit)**       | Handle invalid input, missing auth, and edge cases at the top; `return` early so the main logic is not buried in nested `if` blocks.                                           | [Replace Nested Conditional with Guard Clauses — Refactoring.Guru](https://refactoring.guru/replace-nested-conditional-with-guard-clauses); [Guard Clause — Kent Beck](https://www.informit.com/articles/article.aspx?p=1149121&seqNum=11); [Fowler — Simplifying (Ch. 7 PDF)](https://www.laputan.org/pub/patterns/fowler/Seven.pdf)                                                                                                       |
| **Continuous refactoring (courage)** | Improve structure in **small steps** while tests stay green — not a separate “refactor phase.” Courage means fixing messy code you touch instead of leaving it for later.      | [Opportunistic Refactoring — Martin Fowler](https://martinfowler.com/bliki/OpportunisticRefactoring.html); [Tidy First? — Kent Beck](https://www.kentbeck.com/TidyFirst); [Refactoring — Martin Fowler](https://martinfowler.com/books/refactoring.html); [Two Hats — Martin Fowler](https://martinfowler.com/bliki/TwoHats.html); [Design Stamina Hypothesis — Martin Fowler](https://martinfowler.com/bliki/DesignStaminaHypothesis.html) |
| **Boy Scout Rule**                   | Small improvements in files you touch (naming, dead code, tests) compound over time.                                                                                           | [The Clean Code Blog — Uncle Bob](https://blog.cleancoder.com/)                                                                                                                                                                                                                                                                                                                                                                             |
| **Real solution, not workaround**    | Fix the **root cause** so the problem stays fixed. A workaround is only OK when named, time-boxed, and scheduled for a real fix — see [below](#real-solutions-vs-workarounds). | [Technical Debt — Martin Fowler](https://martinfowler.com/bliki/TechnicalDebt.html)                                                                                                                                                                                                                                                                                                                                                         |

### Real solutions vs workarounds

| English        | Bahasa Indonesia                        | Meaning                                                                           |
| -------------- | --------------------------------------- | --------------------------------------------------------------------------------- |
| **Solution**   | **Solusi**                              | Fixes the **root cause**. Correct for the long term; safe to build on.            |
| **Workaround** | **Solusi sementara** / **jalan pintas** | Patches the **symptom** to unblock today. Adds tech debt if it becomes permanent. |

**Rule:** do **real solutions**, not workarounds — unless the workaround is deliberate, documented in the PR, and has a ticket to replace it.

|                              | Workaround (jalan pintas)                                 | Real solution (solusi)                                                                         |
| ---------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Booking race**             | `sleep(1)` in the controller so two requests do not clash | Lock or transaction in the action that owns availability                                       |
| **Wrong timezone in UI**     | `addHours(7)` in React **and** PHP                        | Store UTC once; format in the UI only — [Date & time](./datetime.md)                           |
| **Missing permission check** | Hide the button in React                                  | Policy + middleware on the server                                                              |
| **Flaky test**               | `@skip` or delete the assertion                           | Fix timing/data setup so the test proves real behavior                                         |
| **API error handling**       | `if (message.includes('payment'))`                        | Branch on `status` / enum from the API — [Single source of truth](./single-source-of-truth.md) |

Workarounds feel faster for one ticket. They multiply — the next developer does not know which hacks are still “temporary.” That is how [technical debt](#technical-debt) starts.

### Anti-patterns to avoid

| Trap                                  | Why it hurts                                                                                                                                                                                                                       | Further reading                                                                                                                                                                                     |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Premature optimization**            | Wasted effort on non-bottlenecks; harder to read and change code. Knuth's full quote includes the **critical 3%** — optimize _after_ you identify hot paths.                                                                       | [Knuth quote in context](https://hlopko.com/2019/08/03/premature-optimization/); [original paper (1974)](https://homepages.cwi.nl/~storm/teaching/reader/Knuth74.pdf)                               |
| **Over-engineering**                  | Extra indirection, factories, and “flexibility” that nobody asked for slows every future change.                                                                                                                                   | [Speculative Generality — Martin Fowler](https://martinfowler.com/bliki/SpeculativeGenerality.html); [Simple Made Easy — Rich Hickey](https://www.infoq.com/presentations/Simple-Made-Easy/) (talk) |
| **Golden hammer**                     | Forcing one pattern (events, microservices, DDD layers) on every problem.                                                                                                                                                          | [Law of the instrument — Wikipedia](https://en.wikipedia.org/wiki/Law_of_the_instrument)                                                                                                            |
| **Arrow of doom** (deep nesting)      | Layers of `if/else` hide the happy path and breed bugs — refactor to guard clauses or extract methods.                                                                                                                             | [Guard Clauses — Tidy First? (O'Reilly excerpt)](https://www.oreilly.com/library/view/tidy-first/9781098151232/ch01.html)                                                                           |
| **Big Ball of Mud**                   | No boundaries, globals everywhere, “just one more `if`” — how legacy pain starts.                                                                                                                                                  | [Big Ball of Mud — Foote & Yoder (PDF)](https://lapruebaadaptada.files.wordpress.com/2014/03/bigballofmud.pdf)                                                                                      |
| **Technical debt (ignored)**          | Messy or shortcut code makes **every future change cost more** (interest). Teams that skip quality to ship fast often deliver **slower** than if they had kept the codebase healthy — see [Technical debt](#technical-debt) below. | [Technical Debt — Martin Fowler](https://martinfowler.com/bliki/TechnicalDebt.html)                                                                                                                 |
| **Abstraction addiction**             | Wrapping one implementation behind three interfaces “for testing” when a simple function would do.                                                                                                                                 | [A Philosophy of Software Design — John Ousterhout](https://web.stanford.edu/~ouster/cgi-bin/book.php) (book; deep vs shallow modules)                                                              |
| **Refactor later** (deferred cleanup) | “We'll clean it up in v2” without a PR or ticket — code rots, velocity drops, and the cleanup never ships.                                                                                                                         | [Opportunistic Refactoring — Martin Fowler](https://martinfowler.com/bliki/OpportunisticRefactoring.html)                                                                                           |
| **Workaround as permanent fix**       | `sleep`, hardcoded IDs, duplicate logic, or UI-only security — ships fast but never gets replaced; see [Real solutions vs workarounds](#real-solutions-vs-workarounds).                                                            | [Technical Debt — Martin Fowler](https://martinfowler.com/bliki/TechnicalDebt.html)                                                                                                                 |

Guard clauses: check preconditions at the top and `return` early so the happy path stays flat. Examples and refactoring patterns: [Replace Nested Conditional with Guard Clauses — Refactoring.Guru](https://refactoring.guru/replace-nested-conditional-with-guard-clauses).

### Technical debt

**What is it?** [Technical debt](https://martinfowler.com/bliki/TechnicalDebt.html) is cruft or shortcuts in the codebase that make every future change harder — like a loan where the extra time you spend on the next feature is the **interest**. Ward Cunningham coined the metaphor; Martin Fowler’s article is the standard explanation of what it is, why shortcuts often backfire, and how to pay it down.

**Why it hurts (not just “messy code”)**

- **Interest compounds.** Each hack adds friction to the next change in that area — reviews take longer, bugs hide in tangled code, deploys get riskier.
- **The shortcut often backfires.** Fowler’s point: cruft slows down the urgent features you took debt to ship. Teams can end up “maxing out the credit card” and still delivering later than if they had kept quality up from the start.
- **Silent debt is the worst kind.** Unnamed shortcuts disappear from memory; nobody plans paydown until something breaks in production.
- **Stale stack is debt too.** Falling behind on PHP, Laravel, React, or package versions turns small upgrades into large, risky migrations — and leaves known security fixes unapplied.

**How to prevent it (team habits)**

| Habit                               | What to do                                                                                                                                                                                            |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name deliberate debt**            | In the PR: what we shortcut, why, and how/when we pay it back (ticket or follow-up PR).                                                                                                               |
| **Prudent vs reckless**             | OK: “ship now, fix next sprint” with a plan. Not OK: “no time for tests/design” with no owner — [Technical Debt Quadrant — Martin Fowler](https://martinfowler.com/bliki/TechnicalDebtQuadrant.html). |
| **Pay down in small steps**         | Tidy code you touch (rename, extract, guard clause) in the same PR when tests cover it — [Opportunistic Refactoring](https://martinfowler.com/bliki/OpportunisticRefactoring.html).                   |
| **Never defer without a trace**     | “Clean up in v2” without a ticket is how debt becomes permanent.                                                                                                                                      |
| **Keep dependencies updated**       | Bump `composer` and `pnpm` packages in small, tested PRs — not once a year. Security advisories and framework minors are paydown, not optional polish.                                                |
| **Follow tech & framework updates** | Read Laravel, Inertia, and major library release notes; upgrade in steps while the gap is small. Deferred upgrades are one of the most expensive forms of debt.                                       |

Deliberate trade-offs are fine. **Unacknowledged** debt is what kills velocity.

Further reading: [What is technical debt? — Martin Fowler](https://martinfowler.com/bliki/TechnicalDebt.html) · [Technical Debt Quadrant](https://martinfowler.com/bliki/TechnicalDebtQuadrant.html)

---

## Environment & config

- Local setup: `pnpm dev:init` then `pnpm dev:full` — see [Local Development](./local-development.md)
- Env presets and variable reference: [Configuration](./configuration.md)
- Switch presets with `pnpm dev:setenv`; do not hand-edit env files without knowing the preset
- New env vars need `.env.example` updates and deploy notes in the PR

---

## Deploy awareness

Changes that affect production need callouts in the PR — especially new env vars, migrations, frontend builds, and Supervisor restarts.

Pre-deploy checklist and deploy commands: [Deployment — Before you deploy](./deployment.md#before-you-deploy).

See [Deployment](./deployment.md) for manual steps, skip flags, and server mapping.

---

## Related docs

| Topic                  | Doc                                                       |
| ---------------------- | --------------------------------------------------------- |
| Flow charts            | [Development Flow](./development-flow.md)                 |
| Merge conflicts        | [Merging Branch Conflicts](./merging-branch-conflicts.md) |
| Local setup            | [Local Development](./local-development.md)               |
| Configuration & env    | [Configuration](./configuration.md)                       |
| Integrations           | [Integrations](./integrations.md)                         |
| Architecture           | [Architecture](./architecture.md)                         |
| Web API types          | [Web API & Orval](./webapi-orval.md)                      |
| Translations           | [Translations (i18n)](./i18n.md)                          |
| Date & time            | [Date & time (UTC / ISO 8601)](./datetime.md)             |
| Single source of truth | [single-source-of-truth.md](./single-source-of-truth.md)  |
| Deploy                 | [Deployment](./deployment.md)                             |
