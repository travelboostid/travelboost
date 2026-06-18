# Product Requirements

High-level product rules for landing pages, customers, chatbot, and wallets.

Doc index: [README](../README.md)

## Landing Page

We use the Puck editor to make all parts of the landing page customizable. The content is created and stored as JSON in the database, which is later rendered for clients.

## Agent Can Have Customers

Customers can register with multiple agents using the same email address. Registration is done through the landing page.

Agent customers are stored as `users`. This means they share the same entity as agent staff or vendor staff. For this reason, the `users` table includes a `company_id` field, which acts as a tenant identifier.

If `company_id` is `null`, the user operates within the Travelboost global scope. If it has a value, the user is restricted to that specific company and interacts only through the company's landing page as a customer.

From a data modeling perspective, we also need composite unique constraints. Instead of making `email` unique globally, we should define uniqueness on `[company_id, email]`. The same applies to `username`. This allows a single email or username to be registered across multiple companies without conflict.

## Chatbot

The chat feature supports private messaging between customers (authenticated users or anonymous visitors) and a company. Each company can enable or disable the chatbot from its dashboard. When enabled, incoming customer messages trigger an automated AI reply via `ChatbotAgent`.

Anonymous visitors on company landing pages can chat without registering. They are tracked as `anonymous-user` records and subscribe to public Reverb channels for real-time updates.

For implementation details, local setup, prerequisites, and troubleshooting, see [Live Chat & Chatbot](./live-chat.md).

## Wallet

Both users and companies can have wallets. We use the Bavix Wallet package, which supports polymorphic (morph) relationships. This allows a wallet to be owned by either a user or a company.

## Promotion ads

Agent companies will run **Google Performance Max** and **Meta traffic** campaigns funded by a **promotion budget** (separate from the Bavix wallet and AI credits). Users top up via Midtrans; TravelBoost pays ad platforms through platform-owned manager accounts.

**Current state:** Promotion budget top-up is live. Google/Meta ad connections and campaign creation are implemented in code but **disabled by default** (`MARKETING_*_ADS_ENABLED=false`) and shown as **Coming soon** in the dashboard. Google Analytics and Meta Pixel integrations are live for measurement.

See [Paid Ads & Promotion Budget](./google-ads-marketing.md) for architecture, env vars, and rollout.
