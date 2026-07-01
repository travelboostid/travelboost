# Single source of truth

One system owns each kind of data or rule. The other side **consumes** it — does not re-implement it.

Doc index: [README](../README.md)

Mixing logic on both sides (translate backend text, adjust timestamps in the middle, re-check permissions only in React) creates bugs that are hard to find and harder to maintain.

---

## The idea

```text
Source of truth  →  sends facts (code, number, ISO timestamp, enum)
Consumer         →  presents them (translation, format, hide/show UI)
```

If you need the **same decision** in two places, pick **one** owner. The other reads the result.

---

## Translations — frontend owns UI language

**Owner:** React + `react-intl` ([i18n](./i18n.md))

All user-facing copy that we control lives in the frontend: `<FormattedMessage />`, `intl.formatMessage()`, `resources/js/lang/*.json`.

**Backend `message` strings are not the translation source.** They are for:

- Logs and debugging
- API clients / developers reading responses
- Rare one-off errors where we have not added a code yet

**To drive UI text from the backend, send a stable code — not prose to translate.**

| Do                                                                                            | Don't                                                                       |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Backend: `{ "status": "awaiting_payment", "message": "Payment is pending" }`                  | Backend: `{ "message": "Menunggu pembayaran" }` and frontend shows it as-is |
| Frontend: map `status` → `intl.formatMessage({ id: 'booking.status.awaiting_payment', ... })` | Frontend: `if (error.message.includes('payment'))`                          |
| Keep `message` in English for Telescope/logs                                                  | Treat `message` as locale-aware product copy                                |

Example pattern in the app: booking filters map **status value** from the API to labels in `getStatusTabs()` — see `resources/js/pages/companies/dashboard/bookings/index.tsx`.

Payment errors may include `response_code` or `status_code` from the gateway **plus** `message` for debugging — UI should branch on the **code**, not parse `message`.

---

## Timestamps — backend owns instants

**Owner:** Laravel + PostgreSQL (UTC)

**Consumer:** React formats for display (dayjs).

Backend sends ISO 8601. Frontend does not fix timezone before save or after read. Details: [Date & time](./datetime.md).

**Strong smell:** `addHours(7)` in PHP or TS between client and database.

---

## Status & enums — backend owns values

**Owner:** PHP enums / DB values (`BookingStatus`, `PaymentStatus`, `TourWaitingListStatus`, …)

**Consumer:** Frontend maps value → label, color, icon.

Backend stores and returns **stable string values** (`awaiting payment`, `full payment`, `pending`). Frontend owns how that **looks** and reads in EN/ID.

Do not compare UI state to English labels returned from another layer. Compare to the **enum value** you agreed on.

---

## Money & business rules — backend owns calculations

**Owner:** Laravel (services, actions, pricing rules)

**Consumer:** Frontend displays formatted amounts (`Intl.NumberFormat`, existing formatters).

Totals, commissions, down-payment amounts, and eligibility are computed on the server. The UI may show a preview for UX, but **checkout and persistence use server numbers only**.

---

## Authorization — backend owns access

**Owner:** Policies, middleware, Form Requests (server)

**Consumer:** Frontend hides buttons / routes for UX (`permissions` from Inertia, Laratrust)

If the API allows an action only when a policy passes, hiding the button in React is **not** security — it is convenience. Never implement permission logic only on the frontend.

---

## Web API shape — backend owns the contract

**Owner:** Webapi controllers + Form Requests + API Resources → Scramble → Orval

**Consumer:** `resources/js/api/**` generated types and hooks.

Do not hand-write TypeScript types for `/webapi` endpoints that Orval already generates. Regenerate with `pnpm orval` after API changes — [Web API & Orval](./webapi-orval.md).

---

## Validation — backend owns rules

**Owner:** Form Request `rules()` on the server

**Consumer:** Frontend may mirror for instant feedback (optional)

A passing client-side check does not mean the request is valid. Server validation is authoritative. Error responses: prefer field keys + codes; avoid relying on English `message` alone for UI branching.

---

## Quick reference

| Concern             | Source of truth          | Consumer sends/receives                            |
| ------------------- | ------------------------ | -------------------------------------------------- |
| UI language         | Frontend (react-intl)    | Codes/enums from API; not backend prose for labels |
| Instants            | Backend (UTC + ISO 8601) | ISO strings; display locally                       |
| Status / type enums | Backend                  | Map to translated label in UI                      |
| Prices / totals     | Backend                  | Display formatted numbers                          |
| Who can do what     | Backend policies         | Hide/disable UI only                               |
| `/webapi` types     | Backend OpenAPI          | Orval-generated client                             |
| Input validity      | Backend validation       | Optional client hints                              |

---

## Before you add logic — ask

1. **Does the other layer already own this?** If yes, use its output.
2. **Am I branching on a human-readable string?** Switch to a code or enum.
3. **Would a copy or timezone change break this?** Wrong owner.

---

## Related

[Translations (i18n)](./i18n.md) · [Date & time](./datetime.md) · [Team SOP](./team-sop.md) · [Web API & Orval](./webapi-orval.md)
