# SOP

## Git

- `main` is used for production
- `dev` is used for development

## Commit Format

Format:

```
[TAG]: message
```

Tags:

- feat
- fix
- docs
- refactor
- chore

This is not mandatory, but recommended for consistency and readability.

## Making Changes

To keep everything aligned, never push commits directly to the `dev` or `main` branches. Instead, always create a feature branch from `dev` and commit your changes there.

Once development and testing on `dev` are complete, push your branch to the remote repository and open a pull request (PR). Request a review from your teammates if needed. After the code review is approved, merge the PR into `dev`.

For production releases, it is recommended to recreate pull requests from the previously merged feature branches—this time targeting `main`. This flow is important because changes that work in the `dev` environment may not always pass tests or behave correctly when evaluated against `main`.

However, if all changes in `dev` are stable and both `dev` and `main` share the same base commit, you can merge `dev` directly into `main`.

### ✅ Do

- Keep your branch up to date with the target branch (e.g. `dev`)
- Use clear and meaningful commit messages
- Pull latest changes from base branch (e.g. `dev`) before starting new work
- Use feature branches for isolated work

### ❌ Don’t

- **Never force push** if your branch has ever been merged to the remote (`origin`)
- **Never rebase** a branch that has already been pushed and shared with others. Once a branch is shared (your branch also used by your friend), prefer **merge over rebase** to avoid breaking history for others
- **Never rebase** if your branch has been merged with the target branch (e.g. `origin/dev`) — use merge instead
- Don’t commit directly to protected branches (e.g. `main`, `dev`)
- Don’t mix unrelated changes in a single commit

## Coding Standards

- Follow best practices and common patterns. Avoid reinventing solutions. Using widely accepted approaches helps reduce bugs and makes issues easier to debug. It also makes it easier to find solutions online, since similar problems have likely already been encountered and solved by others.

- Always use English. Choose variable, function, and file names that are descriptive, intuitive, and concise.

- Apply the DRY principle (Don’t Repeat Yourself). If logic is reused in multiple places, extract it into a reusable function or module.

- Avoid unnecessary comments. Only add comments when the logic is not obvious. Remove unused or commented-out code.

- Maintain consistent naming conventions across the project, including files, variables, and functions.

- Write code for readability and maintainability. Code should be easy to understand and extend by other developers.

- **Complexity will come naturally from real requirements—especially from business needs that we can’t always control or reject**. If the requirements are already complex, don’t make things worse by inventing complicated things. BALANCE simplicity and scalability. Overly simple designs can be limiting, but over-engineering for scalability can make the system unnecessarily complex.

- Stay consistent with PATTERNS and avoid going off-track. When the codebase follows clear and consistent patterns, it becomes much easier to understand the system as a whole. Navigating files, tracing logic from top to bottom, and working with the code all become more straightforward. Even if the business logic is complex, consistent patterns make it manageable.
