# Single source of truth

**Intent of this doc:** Stop the frontend and backend from both “knowing” the same rule in different ways. Pick **one place** that decides; the other place only **shows** or **sends** data.

Doc index: [README](../README.md)

When two layers both translate text, fix timezones, or check permissions, they drift apart. Bugs show up only for some users, in some languages, or after someone travels. This doc says **who owns what** in Travelboost.

---

## The idea (in plain language)

> _Every piece of knowledge must have a single, unambiguous, authoritative representation within a system._  
> — Andy Hunt & Dave Thomas, _The Pragmatic Programmer_ (DRY principle)

For us that means:

- **One owner** holds the fact or rule (status code, UTC timestamp, price, permission).
- **Everyone else** reads that fact — they do not copy the rule into their own code.

```text
Owner     →  sends a fact     (code, ISO time, number, enum)
Consumer  →  presents it      (translation, date format, button visibility)
```

**Bad sign:** you write the same “if this, then that” in PHP **and** in React.  
**Good sign:** PHP decides; React asks “what did PHP say?” and renders.

---

## Examples: wrong design vs single source of truth

These are small, but they show how duplication spreads into real code and bugs.

### Example 1 — Units (grams, millilitres, and “amount”)

Imagine a recipe app that stores ingredient size two ways: grams for solids and millilitres for liquids, **plus** a free-text `amount` field.

**Wrong — two truths for the same fact**

```json
{ "name": "Olive oil", "amount": 500, "unit": "mL" }
{ "name": "Flour",     "amount": 500, "unit": "g" }
```

```php
// PHP — “is this enough?” logic duplicated per unit
if ($item->unit === 'g' && $item->amount >= 400) { /* ... */ }
if ($item->unit === 'mL' && $item->amount >= 350) { /* ... */ }
```

```ts
// React — another copy of the rules, easy to get wrong
if (item.unit === 'g') return item.amount * 1;
if (item.unit === 'mL') return item.amount * 0.92; // approximate density — now PHP and TS disagree
```

**What breaks:** you cannot sum ingredients, compare stock, or search “≥ 400” without `if (unit === …)` everywhere. Add kilograms or fluid ounces and you touch PHP, SQL, React, and reports.

**Right — one canonical value, display is separate**

```json
{ "name": "Olive oil", "mass_grams": 460 }
{ "name": "Flour",     "mass_grams": 500 }
```

```php
// PHP — one rule
return $recipe->ingredients->sum('mass_grams') >= 400;
```

```ts
// React — only formats for the user (optional: show mL using a shared conversion helper)
const label = formatMass(item.mass_grams, userLocale); // "460 g" or "0.46 kg"
```

**Single source of truth:** store **grams** (or one base unit). **mL, cups, oz** are presentation — computed when rendering, not stored as a second fact.

---

### Example 2 — Booking status (code vs English message)

Same idea in Travelboost: the **status** is the fact; the **label** is presentation.

**Wrong — API sends prose, UI copies the rule**

```json
{ "status_message": "Awaiting payment", "can_pay": true }
```

```tsx
// React — English string is the “ID”
if (booking.status_message === 'Awaiting payment') {
    return <PayButton />;
}
if (booking.status_message.includes('payment')) {
    badgeColor = 'yellow';
}
```

```php
// PHP — wording changes here break the UI
return ['status_message' => 'Payment is pending']; // typo or copy edit → PayButton never shows
```

**What breaks:** Indonesian locale never gets correct labels; marketing rewords copy and buttons disappear; `includes('payment')` matches the wrong rows.

**Right — backend owns the enum, frontend owns the words**

```json
{ "status": "awaiting payment", "can_pay": true }
```

```php
// PHP — one enum, one rule
return [
    'status' => $booking->status->value, // BookingStatus::AWAITING_PAYMENT → 'awaiting payment'
    'can_pay' => $booking->status === BookingStatus::AWAITING_PAYMENT,
];
```

```tsx
// React — translate and style from the code, not from API prose
const label = intl.formatMessage({ id: `booking.status.${booking.status}` });
if (booking.can_pay) return <PayButton />;

const badgeColor = statusColors[booking.status]; // map keyed by enum value
```

**Single source of truth:** `BookingStatus` in PHP/DB. API sends **`awaiting payment`** (the enum value). React maps that to copy in `en.json` / `id.json` — see [i18n](./i18n.md) and booking tabs in `resources/js/pages/companies/dashboard/bookings/index.tsx`.

---

## How to read the sections below

Each topic has three roles:

| Role        | Meaning                                              |
| ----------- | ---------------------------------------------------- |
| **Owner**   | Only this layer may **define** the value or rule     |
| **Sends**   | What crosses the wire (machine-friendly)             |
| **UI does** | Display, translate, format — never redefine the rule |

---

## Translations

**Owner:** Frontend — [i18n](./i18n.md) (`react-intl`, `en.json` / `id.json`)

|                    |                                                        |
| ------------------ | ------------------------------------------------------ |
| **Sends from API** | `status`, `code`, enum value — stable strings          |
| **Also OK on API** | `message` in English — for logs and debugging **only** |
| **UI does**        | `intl.formatMessage(...)` → text the user reads        |

```json
{ "status": "awaiting_payment", "message": "Payment is pending" }
```

- UI picks copy from **`status`**, not from `message`.
- `message` helps developers in Telescope; it is **not** product translation.

**Do not:** show backend `message` directly to users, or branch with `if (error.message.includes('payment'))`.

---

## Timestamps

**Owner:** Backend — UTC in DB and API ([Date & time](./datetime.md))

|                    |                                                       |
| ------------------ | ----------------------------------------------------- |
| **Sends from API** | ISO 8601, e.g. `2026-07-01T08:30:00Z`                 |
| **UI does**        | `dayjs(iso).format(...)` in the user’s local timezone |

**Do not:** `addHours(7)` in PHP or TS between save and display.

---

## Status & enums

**Owner:** Backend — PHP enums / DB (`BookingStatus`, `PaymentStatus`, …)

|                    |                                                  |
| ------------------ | ------------------------------------------------ |
| **Sends from API** | `awaiting payment`, `full payment`, `pending`, … |
| **UI does**        | Map value → translated label, badge color, icon  |

Same pattern as booking status tabs in `resources/js/pages/companies/dashboard/bookings/index.tsx`: API gives a **value**; React gives the **words**.

---

## Money & business rules

**Owner:** Backend — services, actions, pricing

|                    |                                                    |
| ------------------ | -------------------------------------------------- |
| **Sends from API** | Final amounts, eligibility flags                   |
| **UI does**        | Format currency for display; optional preview only |

Checkout and saved records use **server numbers**, not client math.

---

## Permissions

**Owner:** Backend — policies, middleware

|                    |                                                       |
| ------------------ | ----------------------------------------------------- |
| **Sends from API** | 403 / validation errors; Inertia `permissions` for UX |
| **UI does**        | Hide or disable buttons                               |

Hiding a button is convenience. **Security lives on the server.**

---

## Web API types

**Owner:** Backend — controllers, Resources, Scramble → Orval

|                    |                                                                             |
| ------------------ | --------------------------------------------------------------------------- |
| **Sends from API** | OpenAPI spec                                                                |
| **UI does**        | Import generated types from `@/api/` — [Web API & Orval](./webapi-orval.md) |

**Do not:** hand-write TS types for endpoints Orval already generates.

---

## Validation

**Owner:** Backend — Form Request `rules()`

|                    |                        |
| ------------------ | ---------------------- |
| **Sends from API** | 422 + field errors     |
| **UI does**        | Optional instant hints |

If client validation passes but server rejects, **the server is right**.

---

## Cheat sheet

| Topic                   | Owner    | API carries       | UI carries        |
| ----------------------- | -------- | ----------------- | ----------------- |
| Wording (EN/ID)         | Frontend | `code` / `status` | Translation       |
| When something happened | Backend  | ISO 8601 UTC      | Local display     |
| Booking/payment state   | Backend  | Enum value        | Label + style     |
| Price / total           | Backend  | Number            | Formatted display |
| Can user do this?       | Backend  | Policy result     | Show/hide         |
| `/webapi` shapes        | Backend  | OpenAPI           | Orval types       |

---

## Before you duplicate logic

1. **Who already owns this?** Use them.
2. **Am I using English prose as an ID?** Use a code or enum instead.
3. **Would Indonesian or a timezone change break my `if`?** Wrong layer — read the owner doc above.

---

## Related

[i18n](./i18n.md) · [Date & time](./datetime.md) · [Team SOP](./team-sop.md)
