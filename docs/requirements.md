# Requirements

## Landing Page

We use the Puck editor to make all parts of the landing page customizable. The content is created and stored as JSON in the database, which is later rendered for clients.

## Agent Can Have Customers

Customers can register with multiple agents using the same email address. Registration is done through the landing page.

Agent customers are stored as `users`. This means they share the same entity as agent staff or vendor staff. For this reason, the `users` table includes a `company_id` field, which acts as a tenant identifier.

If `company_id` is `null`, the user operates within the Travelboost global scope. If it has a value, the user is restricted to that specific company and interacts only through the company’s landing page as a customer.

From a data modeling perspective, we also need composite unique constraints. Instead of making `email` unique globally, we should define uniqueness on `[company_id, email]`. The same applies to `username`. This allows a single email or username to be registered across multiple companies without conflict.

## Chatbot

The chat feature is implemented in a standard way. Each company can choose whether to enable the chatbot. If enabled, the system will generate automated replies.

One challenge is how to implement this without requiring users to log in. We considered using an anonymous login approach similar to Firebase Auth. However, adopting Firebase Auth or replicating its logic is not practical. Another concern is handling inactive users, which could result in a large amount of unused chat data that needs to be cleaned up.

Our initial design allowed either regular chat or auto-reply. However, combining customer support chat with a chatbot may introduce several drawbacks. This approach is still under consideration.

## Wallet

Both users and companies can have wallets. We use the Bavix Wallet package, which supports polymorphic (morph) relationships. This allows a wallet to be owned by either a user or a company.
