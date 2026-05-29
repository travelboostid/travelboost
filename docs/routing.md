# Routing

Both the Travelboost main domain and user landing page domains share the same routing system.

When a request comes in, the application first checks routes defined in `routes/tenant.php` before other route files. This priority is necessary because domain and subdomain routes can overlap. For example, accessing `/` on a subdomain should display the landing page, while accessing `/` on the main domain should display the Travelboost homepage.

This design decision allows us to maintain a single Laravel project instead of splitting into multiple projects. It reduces development overhead and avoids the need to constantly switch between repositories.

We understand this structure can be confusing for new team members at first. However, once familiar with the pattern, it becomes manageable. That said, a single Laravel project can still feel complex. Even simple navigation—such as moving from a controller to a view—can be tedious. Many developers rely on shortcuts like `Ctrl+P` in VS Code to quickly locate files, but this can still be inefficient.

Managing multiple projects would make things even more cumbersome—not only because of the need to switch between projects, but also due to the challenge of keeping shared models in sync. This increases the risk of inconsistencies and bugs.
