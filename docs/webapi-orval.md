# Web API & Orval

React calls JSON endpoints under **`/webapi`**. TypeScript types and TanStack Query hooks are **generated** from the OpenAPI spec — do not hand-write types for those routes when Orval already covers them.

Doc index: [README](../README.md)

## Stack

| Tool                                         | Role                                                                              |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| [Dedoc Scramble](https://scramble.dedoc.co/) | Builds OpenAPI from Laravel controllers, Form Requests, and API Resources         |
| [Orval](https://orval.dev/)                  | Reads OpenAPI and generates `resources/js/api/**` (React Query hooks + TS models) |
| Axios (`resources/js/api/api-instance.ts`)   | HTTP client with `baseURL: '/webapi'`                                             |

Scramble is configured in `config/scramble.php` with `api_path => 'webapi'`, so **only routes whose URI starts with `/webapi`** appear in the spec. Inertia pages, webhooks, and admin HTML routes are excluded automatically.

Orval reads the live spec from:

```text
{VITE_APP_SCHEME}://{VITE_APP_HOST}:{VITE_APP_PORT}/docs/api.json
```

Generated clients call paths like `/medias`; Axios prepends `/webapi`, so the final URL is `/webapi/medias`.

---

## Workflow after changing a Web API

1. Update the **Webapi controller** (`app/Http/Controllers/Webapi/`).
2. Prefer **Form Request** classes for query/body validation (Scramble documents rules as parameters).
3. Return **API Resource** classes (or explicit `@operationId` + return types) so responses are typed.
4. Ensure the dev server is running and `.env` / `pnpm dev:setenv` matches the host Orval will fetch.
5. Regenerate the client:

```bash
pnpm orval
```

6. Import hooks/types from `@/api/...` in React — e.g. `useGetMedias`, `MediaResource`, `StoreMediaRequest`.

There is no watch mode: **run `pnpm orval` manually** after each API change you want reflected in the frontend.

---

## Scramble conventions (Webapi controllers)

### `@operationId`

Unique, stable camelCase id — Orval uses it for function names (`getMedias`, `createMedia`, …).

```php
/**
 * List media for an owner.
 *
 * @operationId getMedias
 */
public function index(MediaIndexRequest $request): AnonymousResourceCollection
```

### Form Requests

Move inline `$request->validate([...])` into `app/Http/Requests/*` when possible. Scramble exports:

- Query parameters from `rules()` on GET requests
- Request body schemas on POST/PUT/PATCH

Use Enums in rules (`MediaType`, etc.) so Orval generates string union types.

### API Resources

Return `MediaResource`, `PaymentResource::collection(...)`, etc. Document nested arrays in PHPDoc when JSON shape is not obvious:

```php
/** @var array{files?: list<array{code: string, url: string}>}|array{url?: string}|null */
'data' => $this->data,
```

### Multipart uploads

```php
/**
 * @operationId createMedia
 * @requestMediaType multipart/form-data
 */
public function store(StoreMediaRequest $request): MediaResource
```

### Delete / message responses

Return a shared `MessageResource` so Orval generates a consistent `{ data: { message: string } }` shape.

---

## Generated output layout

```text
resources/js/api/
├── api-instance.ts       # Axios instance (baseURL /webapi)
├── model/                  # TypeScript interfaces (StoreMediaRequest, MediaResource, …)
├── media/media.ts          # getMedias, useCreateMedia, …
├── payment/payment.ts
└── …                       # One folder per OpenAPI tag
```

Import examples:

```tsx
import { useGetMedias, useCreateMedia } from '@/api/media/media';
import type { MediaResource, StoreMediaRequest } from '@/api/model';
```

---

## Local OpenAPI UI

With the app running:

- Spec JSON: `/docs/api.json`
- Interactive docs: `/docs/api`

Use these to verify new endpoints before running Orval.

---

## Configuration files

| File                               | Purpose                                           |
| ---------------------------------- | ------------------------------------------------- |
| `config/scramble.php`              | API path prefix (`webapi`), export path, UI       |
| `orval.config.js`                  | Orval input URL, output paths, React Query client |
| `resources/js/api/api-instance.ts` | Shared Axios instance and error handling          |

---

## Checklist for new `/webapi` endpoints

- [ ] Route registered under `routes/webapi.php` (inside `Route::prefix('webapi')`)
- [ ] Controller lives in `App\Http\Controllers\Webapi\`
- [ ] `@operationId` set on the action
- [ ] Form Request (or Resource) defines input shape
- [ ] API Resource (or typed JsonResource) defines response shape
- [ ] `pnpm orval` run and generated hooks used in React
- [ ] No duplicate hand-written types in `resources/js/` for the same payload

---

## Troubleshooting

| Issue                      | Fix                                                              |
| -------------------------- | ---------------------------------------------------------------- |
| Orval fetch fails          | Start `pnpm dev:serve`; check `VITE_APP_*` in `.env`             |
| Endpoint missing from spec | Route must be under `/webapi`; clear config cache                |
| Wrong TypeScript shape     | Add/adjust Form Request or API Resource; re-run `pnpm orval`     |
| 401 in Try It              | Scramble uses session cookies — log in on the same host first    |
| Generated path 404         | Client uses `/webapi` base URL; route must exist in `webapi.php` |
