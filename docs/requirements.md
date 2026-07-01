# Product Requirements

High-level product rules for landing pages, customers, and wallets.

Doc index: [README](../README.md)

## Landing Page

We use the Puck editor to make all parts of the landing page customizable. The content is created and stored as JSON in the database, which is later rendered for clients.

## Agent Can Have Customers

Customers can register with multiple agents using the same email address. Registration is done through the landing page.

Agent customers are stored as `users`. This means they share the same entity as agent staff or vendor staff. For this reason, the `users` table includes a `company_id` field, which acts as a tenant identifier.

If `company_id` is `null`, the user operates within the Travelboost global scope. If it has a value, the user is restricted to that specific company and interacts only through the company's landing page as a customer.

From a data modeling perspective, we also need composite unique constraints. Instead of making `email` unique globally, we should define uniqueness on `[company_id, email]`. The same applies to `username`. This allows a single email or username to be registered across multiple companies without conflict.

## Wallet

Both users and companies can have wallets. We use the Bavix Wallet package, which supports polymorphic (morph) relationships. This allows a wallet to be owned by either a user or a company.
