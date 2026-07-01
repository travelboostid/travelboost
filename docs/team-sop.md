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
- **Guard clauses** — validate preconditions and exit early; keep the happy path flat (see [guard clauses](#principles-to-follow))
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

## Engineering principles (recommended reading)

These are **guidelines**, not laws. Apply judgment in context — Travelboost code should be boring, readable, and easy to change. When in doubt, prefer clarity over cleverness.

### Principles to follow

| Principle                            | In practice                                                                                                                                                               | Further reading                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **KISS** (Keep It Simple, Stupid)    | Solve today's problem with the smallest clear design. Fewer moving parts = fewer bugs.                                                                                    | [KISS principle](https://en.wikipedia.org/wiki/KISS_principle)                                                                                                                                                                                                                                                                                                                                                                              |
| **YAGNI** (You Aren't Gonna Need It) | Do not build features, hooks, or abstractions for hypothetical future needs.                                                                                              | [YAGNI — Martin Fowler](https://martinfowler.com/bliki/Yagni.html)                                                                                                                                                                                                                                                                                                                                                                          |
| **DRY** (Don't Repeat Yourself)      | One source of truth for business rules. Copy-paste across files is a maintenance tax.                                                                                     | [The Pragmatic Programmer](https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/) (book); [DRY in practice — freeCodeCamp](https://www.freecodecamp.org/news/dry-theory-practice/)                                                                                                                                                                                                                           |
| **SOLID**                            | Single responsibility, open/closed, substitutability, small interfaces, depend on abstractions — use as a **smell detector**, not a reason to add layers everywhere.      | [SOLID Revisited — Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Revisited.html)                                                                                                                                                                                                                                                                                                                                 |
| **Make it work → right → fast**      | Correctness first, structure second, performance last — and only where data proves it matters.                                                                            | [Kent Beck — WikiWikiWeb](https://wiki.c2.com/?MakeItWorkMakeItRightMakeItFast)                                                                                                                                                                                                                                                                                                                                                             |
| **Rule of Three**                    | Wait until you have three similar cases before generalizing into a shared abstraction.                                                                                    | [Rule of Three — WikiWikiWeb](https://wiki.c2.com/?RuleOfThree)                                                                                                                                                                                                                                                                                                                                                                             |
| **Guard clauses (early exit)**       | Handle invalid input, missing auth, and edge cases at the top; `return` early so the main logic is not buried in nested `if` blocks.                                      | [Replace Nested Conditional with Guard Clauses — Refactoring.Guru](https://refactoring.guru/replace-nested-conditional-with-guard-clauses); [Guard Clause — Kent Beck](https://www.informit.com/articles/article.aspx?p=1149121&seqNum=11); [Fowler — Simplifying (Ch. 7 PDF)](https://www.laputan.org/pub/patterns/fowler/Seven.pdf)                                                                                                       |
| **Continuous refactoring (courage)** | Improve structure in **small steps** while tests stay green — not a separate “refactor phase.” Courage means fixing messy code you touch instead of leaving it for later. | [Opportunistic Refactoring — Martin Fowler](https://martinfowler.com/bliki/OpportunisticRefactoring.html); [Tidy First? — Kent Beck](https://www.kentbeck.com/TidyFirst); [Refactoring — Martin Fowler](https://martinfowler.com/books/refactoring.html); [Two Hats — Martin Fowler](https://martinfowler.com/bliki/TwoHats.html); [Design Stamina Hypothesis — Martin Fowler](https://martinfowler.com/bliki/DesignStaminaHypothesis.html) |
| **Boy Scout Rule**                   | Small improvements in files you touch (naming, dead code, tests) compound over time.                                                                                      | [The Clean Code Blog — Uncle Bob](https://blog.cleancoder.com/)                                                                                                                                                                                                                                                                                                                                                                             |

### Anti-patterns to avoid

| Trap                                  | Why it hurts                                                                                                                                                 | Further reading                                                                                                                                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Premature optimization**            | Wasted effort on non-bottlenecks; harder to read and change code. Knuth's full quote includes the **critical 3%** — optimize _after_ you identify hot paths. | [Knuth quote in context](https://hlopko.com/2019/08/03/premature-optimization/); [original paper (1974)](https://homepages.cwi.nl/~storm/teaching/reader/Knuth74.pdf)                               |
| **Over-engineering**                  | Extra indirection, factories, and “flexibility” that nobody asked for slows every future change.                                                             | [Speculative Generality — Martin Fowler](https://martinfowler.com/bliki/SpeculativeGenerality.html); [Simple Made Easy — Rich Hickey](https://www.infoq.com/presentations/Simple-Made-Easy/) (talk) |
| **Golden hammer**                     | Forcing one pattern (events, microservices, DDD layers) on every problem.                                                                                    | [Law of the instrument — Wikipedia](https://en.wikipedia.org/wiki/Law_of_the_instrument)                                                                                                            |
| **Arrow of doom** (deep nesting)      | Layers of `if/else` hide the happy path and breed bugs — refactor to guard clauses or extract methods.                                                       | [Guard Clauses — Tidy First? (O'Reilly excerpt)](https://www.oreilly.com/library/view/tidy-first/9781098151232/ch01.html)                                                                           |
| **Big Ball of Mud**                   | No boundaries, globals everywhere, “just one more `if`” — how legacy pain starts.                                                                            | [Big Ball of Mud — Foote & Yoder (PDF)](https://lapruebaadaptada.files.wordpress.com/2014/03/bigballofmud.pdf)                                                                                      |
| **Technical debt (ignored)**          | Shortcuts are fine **if acknowledged**; silent debt becomes surprise outages and slow delivery.                                                              | [Technical Debt — Martin Fowler](https://martinfowler.com/bliki/TechnicalDebt.html); [Google Engineering Practices](https://google.github.io/eng-practices/)                                        |
| **Abstraction addiction**             | Wrapping one implementation behind three interfaces “for testing” when a simple function would do.                                                           | [A Philosophy of Software Design — John Ousterhout](https://web.stanford.edu/~ouster/cgi-bin/book.php) (book; deep vs shallow modules)                                                              |
| **Refactor later** (deferred cleanup) | “We'll clean it up in v2” without a PR or ticket — code rots, velocity drops, and the cleanup never ships.                                                   | [Opportunistic Refactoring — Martin Fowler](https://martinfowler.com/bliki/OpportunisticRefactoring.html); [Technical Debt — Martin Fowler](https://martinfowler.com/bliki/TechnicalDebt.html)      |

### Why continuous refactoring is a good thing

Refactoring is not a reward for finishing features — it **is** how you keep shipping features fast. Martin Fowler argues that teams should treat it as **opportunistic**: whenever you touch unclear or duplicated code, improve it in small, test-backed steps instead of scheduling a separate “refactor sprint.”

> “From the beginning I've always seen refactoring as something you do continuously, as regular and indivisible a part of programming as typing if statements.”  
> — [Opportunistic Refactoring — Martin Fowler](https://martinfowler.com/bliki/OpportunisticRefactoring.html)

The payoff: code stays on the “good design” curve of the [Design Stamina Hypothesis](https://martinfowler.com/bliki/DesignStaminaHypothesis.html) — short-term speed without design decays into slower delivery later. Continuous integration and tests (our CI on every PR) make these small changes safe.

**Read next:** [Opportunistic Refactoring](https://martinfowler.com/bliki/OpportunisticRefactoring.html) · [Continuous Integration — refactoring section](https://martinfowler.com/articles/continuousIntegration.html) · [Tidy First? — Kent Beck](https://www.kentbeck.com/TidyFirst)

### Guard clauses: before, after, and gotchas

#### Without guard clauses (nested “arrow of doom”)

Each new edge case adds another indentation level. The happy path ends up buried on the right:

```php
public function release(Request $request, Booking $booking): RedirectResponse
{
    $user = $request->user();

    if ($user !== null) {
        if ($booking->user_id === $user->id) {
            if ($booking->agent_id === tenant()->id) {
                if ($booking->canBeReleased()) {
                    app(ReleaseCustomerBookingHoldAction::class)->execute($booking);

                    return back()->with('status', 'Hold released.');
                } else {
                    return back()->withErrors(['booking' => 'Cannot release this hold.']);
                }
            } else {
                abort(403);
            }
        } else {
            abort(403);
        }
    } else {
        abort(403);
    }
}
```

#### With guard clauses (flat happy path)

Preconditions are checked up front; the main logic reads top-to-bottom:

```php
public function release(Request $request, Booking $booking): RedirectResponse
{
    $user = $request->user();

    if ($user === null) {
        abort(403);
    }

    if ($booking->user_id !== $user->id || $booking->agent_id !== tenant()->id) {
        abort(403);
    }

    if (! $booking->canBeReleased()) {
        return back()->withErrors(['booking' => 'Cannot release this hold.']);
    }

    app(ReleaseCustomerBookingHoldAction::class)->execute($booking);

    return back()->with('status', 'Hold released.');
}
```

#### Gotchas if you skip guard clauses

| Problem                                    | What happens                                                                                                            |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **Happy path is hard to find**             | Reviewers and future-you must scan right through nested blocks to see what actually runs on success.                    |
| **Easy to break when adding a case**       | A new `if` often goes in the wrong branch; you fix one path and miss another.                                           |
| **Duplicate or divergent error handling**  | Three `abort(403)` copies in nested `else` branches drift apart (one returns JSON, one redirects, one forgets logging). |
| **Harder to test**                         | Tests need to navigate the same nesting; missing one branch gives false confidence.                                     |
| **“Temporary” `else` blocks grow forever** | Each bug fix adds `else if` instead of an early return — the method becomes a liability nobody wants to touch.          |

Use guard clauses when one path is **normal** and the others are **exceptions**. Do not add eight guards in a row — extract a method or policy check if preconditions pile up ([Kent Beck — don't overdo guard clauses](https://www.oreilly.com/library/view/tidy-first/9781098151232/ch01.html)).

### How this applies here

- **New feature:** match existing Laravel + Inertia patterns in the same directory before inventing a framework.
- **Guard clauses:** prefer the flat style above in controllers, actions, and agent context methods — see [before/after example](#guard-clauses-before-after-and-gotchas).

- **Continuous refactor:** when you understand the code while implementing a fix, tidy locally (rename, extract method, guard clause) in the **same PR** if tests cover it; otherwise a small follow-up PR — never “I'll clean it up later” without a ticket or PR.
- **Two hats:** separate **behavior changes** (feature/fix) from **structure-only** tidies when possible so reviewers can follow the diff; both are encouraged, just not hidden inside each other without mention.
- **Performance:** reproduce the slow path, measure (Telescope, query log, `EXPLAIN`), then fix — do not cache or queue “just in case.”
- **Tech debt:** note deliberate shortcuts in the PR description so the team can schedule paydown.
- **Tests:** prove behavior, not architecture — a readable feature test beats an elaborate mock hierarchy.

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

| Topic           | Doc                                                       |
| --------------- | --------------------------------------------------------- |
| Flow charts     | [Development Flow](./development-flow.md)                 |
| Merge conflicts | [Merging Branch Conflicts](./merging-branch-conflicts.md) |
| Local setup     | [Local Development](./local-development.md)               |
| Architecture    | [Architecture](./architecture.md)                         |
| Web API types   | [Web API & Orval](./webapi-orval.md)                      |
| Translations    | [Translations (i18n)](./i18n.md)                          |
| Deploy          | [Deployment](./deployment.md)                             |
