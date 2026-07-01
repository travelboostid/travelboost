# Merging Branch Conflicts

Step-by-step guide to updating your feature branch with latest `dev` and resolving merge conflicts.

Doc index: [README](../README.md) · Workflow: [Development Flow](./development-flow.md) · Git rules: [Team SOP](./team-sop.md)

---

## When you need this

- GitHub shows **“This branch has conflicts that must be resolved”** on your PR
- You want to sync your branch before opening a PR
- `dev` moved ahead while you were working on `feat/...` or `fix/...`

**Team rule:** merge `dev` into your branch — do **not** rebase a branch already pushed to GitHub ([Team SOP — Git history](./team-sop.md#git-history-rules)).

---

## Step-by-step

### 1. Save your work

```bash
git status
```

Commit or stash anything unfinished. Start from a clean working tree on your feature branch:

```bash
git checkout feat/my-feature
git add -A && git commit -m "wip: save progress"   # if needed
```

### 2. Update `dev`

```bash
git fetch origin
git checkout dev
git pull origin dev
```

### 3. Merge `dev` into your branch

```bash
git checkout feat/my-feature
git merge origin/dev
```

**No conflicts** — Git creates a merge commit. Skip to [step 6](#6-verify-and-push).

**Conflicts** — Git stops and lists conflicted files:

```text
CONFLICT (content): Merge conflict in app/Models/Booking.php
Automatic merge failed; fix conflicts and then commit the result.
```

### 4. Resolve each conflicted file

**Important:** In most real conflicts you need **both** sides — combine your feature with what landed on `dev`, not only “mine” or “theirs.” Removing the `<<<<<<<` / `=======` / `>>>>>>>` markers is only the first step. **The merge is not done until the combined code actually works** — fix imports, types, duplicate logic, naming, and behavior, then run tests before you commit.

Open each file. Git marks conflicts like this:

```text
<<<<<<< HEAD
your branch's code
=======
code from dev
>>>>>>> origin/dev
```

For each conflict:

1. Decide what the final code should be — **usually a combination of both sides**
2. Remove the `<<<<<<<`, `=======`, and `>>>>>>>` lines
3. **Adjust the merged result** so it compiles, types check, and behavior is correct (not just syntactically valid)
4. Save the file

List conflicted files:

```bash
git status
# or
git diff --name-only --diff-filter=U
```

#### PHP / TypeScript / React

- Keep **both** changes when they touch different concerns
- Prefer **incoming `dev`** for unrelated fixes that landed while you worked
- Prefer **your branch** for the feature you are building
- Run formatters after editing: `vendor/bin/pint --dirty` (PHP), `pnpm lint` (frontend)

#### `composer.lock` / `pnpm-lock.yaml`

Resolve `composer.json` / `package.json` first, then regenerate locks (do not keep conflict markers in lock files):

```bash
composer install
pnpm install
```

#### Database migrations

If two branches added migrations with the same timestamp prefix, **rename one** to a later time so both can run:

```bash
mv database/migrations/2026_07_01_120000_add_foo.php \
   database/migrations/2026_07_01_120500_add_foo.php
```

Then run:

```bash
php artisan migrate
```

Never edit a migration already merged to `dev` — only resolve **new** files from your branch.

#### Generated files (`pnpm orval`, Wayfinder)

If `dev` changed Web API routes, regenerate after merge:

```bash
pnpm orval    # Laravel server must be running
```

Resolve conflicts in source files first, then regenerate — do not manually merge generated hooks.

### 5. Mark resolved and commit the merge

```bash
git add path/to/resolved-file.php
# add all resolved files:
git add -A

git status    # should show "All conflicts fixed"
git commit    # uses default merge message; edit if you want
```

If you used `git merge` and conflicts are fixed, `git commit` completes the merge (no `-m` required unless you want a custom message).

### 6. Verify and push

**Do not skip this step** — conflict resolution is incomplete until tests pass on the merged code.

```bash
composer test
pnpm lint
pnpm types     # if you changed frontend
```

Push the updated branch:

```bash
git push origin feat/my-feature
```

GitHub should show the PR as mergeable. Re-request review if the diff changed significantly.

---

## Resolve on GitHub (optional)

For simple text conflicts, GitHub’s **“Resolve conflicts”** button works on the PR page. Same rules apply: remove markers, keep correct code, commit the merge.

For lock files, migrations, or large refactors — resolve **locally** (steps above) so you can run tests.

---

## Common mistakes

| Mistake                                                               | Fix                                                                   |
| --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `git rebase dev` on a pushed branch                                   | Use `git merge origin/dev` instead                                    |
| Leaving conflict markers in files                                     | Search repo for `<<<<<<<` before commit                               |
| Stopping after picking “both” in the editor without fixing the result | Re-read the merged block; run tests; fix logic, types, and duplicates |
| Deleting someone else's `dev` changes by always picking HEAD          | Read both sides; combine when needed; test after merge                |
| Force-pushing after others pulled your branch                         | Avoid `git push --force`; ask the team first                          |
| Editing merged migrations on `dev`                                    | Add a new forward migration                                           |

---

## Quick reference

```bash
git fetch origin
git checkout feat/my-feature
git merge origin/dev
# fix files, git add, git commit
composer test && pnpm lint
git push origin feat/my-feature
```

---

## Related docs

| Topic             | Doc                                                         |
| ----------------- | ----------------------------------------------------------- |
| Full git workflow | [Development Flow](./development-flow.md)                   |
| Git history rules | [Team SOP](./team-sop.md)                                   |
| Pre-push checks   | [Team SOP — Before you push](./team-sop.md#before-you-push) |
