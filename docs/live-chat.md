# Live Chat & Chatbot

How live chat and AI auto-reply work, local prerequisites, and troubleshooting.

Doc index: [README](../README.md)

---

## Overview

Travelboost supports private chat between:

- **Authenticated users** (`user`)
- **Anonymous visitors** (`anonymous-user`) on company landing pages
- **Companies** (`company`) as the chat recipient / support side

Each company can enable or disable the chatbot from the company dashboard (**Chatbot settings**). When enabled, the system generates automated replies to incoming customer messages using `ChatbotAgent`.

The chat UI is a floating widget on tenant landing pages. Messages are persisted via the Web API and delivered in real time through **Laravel Reverb** (Echo).

---

## End-to-End Flow

When a user sends a message:

1. The frontend calls `POST /webapi/chat/rooms/{roomId}/messages`.
2. Laravel creates a `ChatMessage` record.
3. The model dispatches `ChatMessageCreated` (also broadcast via Reverb).
4. The `ChatbotAutoReply` listener handles the event and calls `ChatbotAgent::make($message)->reply()`.
5. If all conditions are met, the agent generates a reply and creates a bot `ChatMessage` (`is_bot = true`).
6. That bot message also dispatches `ChatMessageCreated`, which is broadcast to room members.
7. The frontend Echo listener in `resources/js/components/chat/state.tsx` upserts the message into the Zustand chat store.

```text
User sends message
  → ChatMessageController::store
  → ChatMessage created
  → ChatMessageCreated event
      → ChatbotAutoReply listener
          → ChatbotAgent::reply()
              → AI completion + optional embedding lookup
              → bot ChatMessage created
      → Reverb broadcast to users.{id} / anonymous-users.{id}
  → Frontend Echo listener updates chat UI
```

---

## When the Chatbot Replies

`ChatbotAgent` only responds when **all** of the following are true:

| Requirement                                                  | Where it is configured                                    |
| ------------------------------------------------------------ | --------------------------------------------------------- |
| PHP `bcmath` extension is available                          | System PHP / `composer.json` (`ext-bcmath`)               |
| Global chatbot models are configured                         | `app_configs` key `chatbot` (seeded by `AppConfigSeeder`) |
| Room type is `private`                                       | Set when opening a chat room                              |
| Message is not from the bot (`is_bot = false`)               | —                                                         |
| Other room member is a `company`                             | Live chat recipient is the tenant company                 |
| Company has AI credit (`ai_credits`) with sufficient balance | Company wallet / AI credit                                |
| Company setting `chatbot_enabled` is `true`                  | Company dashboard → Chatbot settings                      |

If any condition fails, the user's message is still saved and broadcast, but no bot reply is generated. Failures inside `ChatbotAutoReply` are logged — they do not fail the HTTP request.

---

## Local Development Requirements

### PHP extension: `bcmath`

The chatbot uses BCMath functions (`bccomp`, `bcmul`, etc.) for AI credit checks and cost calculation. Without this extension, auto-reply fails silently from the user's perspective.

**Verify:**

```bash
php -r 'echo function_exists("bccomp") ? "bcmath OK\n" : "bcmath MISSING\n";'
```

**Enable on Arch Linux** (extension is often installed but not loaded):

```bash
echo 'extension=bcmath' | sudo tee /etc/php/conf.d/bcmath.ini
```

**Enable on Debian/Ubuntu** (usually included in `php-bcmath`):

```bash
sudo apt install php-bcmath
```

The project also declares `ext-bcmath` in `composer.json`, so `composer install` will warn if the extension is missing.

### Dev scripts load bcmath automatically

`pnpm dev:full` and related scripts run PHP with `-d extension=bcmath` so local development works even when the system-wide PHP config has not been updated yet:

```bash
pnpm dev:full   # reverb + queue + vite + artisan serve (all with bcmath)
```

Restart the dev server after pulling changes to `package.json` scripts.

### Reverb (real-time updates)

Bot replies appear in the UI through websocket broadcasts. Reverb must be running:

```bash
pnpm dev:full
# or separately:
pnpm dev:reverb
```

Check `.env` for `REVERB_*` settings and that the frontend Echo configuration matches.

### AI provider credentials

The chatbot uses Laravel AI with the models configured in `app_configs.chatbot`. Ensure the relevant provider API keys are set in `.env` (for example OpenRouter, depending on seeded config).

### Company setup for testing

To test auto-reply on a tenant landing page:

1. Open the company subdomain (for example `john.test8000.localhost`).
2. Start live chat (recipient is the tenant company).
3. Confirm **Chatbot enabled** is on in the company dashboard.
4. Confirm the company has AI credit balance.

---

## Configuration Reference

### Company settings (`company_settings`)

- `chatbot_enabled` — master switch per company
- `chatbot_response_style` — `professional`, `friendly`, or `casual`
- `chatbot_default_language` — `auto`, `en`, or `id`

Managed from the company dashboard chatbot page.

### Global app config (`app_configs`, key `chatbot`)

Platform-wide model and billing settings, managed from the admin panel:

- `chatbot_model_provider` / `chatbot_model_name`
- `embedding_model_provider` / `embedding_model_name`
- Token cost rates and `user_cost_per_interaction`

Seeded by `database/seeders/Common/AppConfigSeeder.php`. Changes invalidate the config cache key `app_config.chatbot.value`.

---

## Key Files

| Area                           | Path                                                    |
| ------------------------------ | ------------------------------------------------------- |
| Auto-reply listener            | `app/Listeners/ChatbotAutoReply.php`                    |
| AI agent                       | `app/Ai/Agents/ChatbotAgent.php`                        |
| Message model + event dispatch | `app/Models/ChatMessage.php`                            |
| Broadcast event                | `app/Events/ChatMessageCreated.php`                     |
| Message API                    | `app/Http/Controllers/Webapi/ChatMessageController.php` |
| Open chat room API             | `app/Http/Controllers/Webapi/ChatRoomController.php`    |
| Frontend Echo listeners        | `resources/js/components/chat/state.tsx`                |
| Chat store                     | `resources/js/stores/chat/chat-store.ts`                |
| Reverb channels                | `routes/channels.php`                                   |

---

## Troubleshooting

### User message appears, but no bot reply

1. **Check Laravel logs** for `ChatbotAutoReply job failed`:

    ```bash
    tail -f storage/logs/laravel.log | rg -i "ChatbotAutoReply|ChatMessage"
    ```

2. **Verify bcmath** (most common local issue):

    ```bash
    php -r 'echo function_exists("bccomp") ? "OK\n" : "MISSING\n";'
    ```

3. **Verify chatbot is enabled** for the company and AI credit balance is sufficient.

4. **Verify Reverb is running** if the reply exists in the database but not in the UI:

    ```bash
    php artisan tinker --execute 'echo App\Models\ChatMessage::where("is_bot", true)->latest()->first()?->message;'
    ```

5. **Verify global chatbot config** exists:

    ```bash
    php artisan tinker --execute 'dump(App\Models\AppConfig::where("key", "chatbot")->value("value"));'
    ```

### Misleading log: `Unsupported operand types: array * int`

This was caused by incorrect `retry()` usage in `ChatbotAutoReply` — the backoff array was passed as the sleep parameter instead of the attempts parameter. That masked the real underlying error (usually missing `bcmath`).

Correct usage:

```php
retry([3000, 5000], fn () => ChatbotAgent::make($event->message)->reply());
```

If you still see this error after updating, pull the latest code.

### Bot reply is slow

Auto-reply runs **synchronously** in the `ChatbotAutoReply` listener during the request lifecycle. The agent may call the LLM twice (intent detection + reply) and optionally generate embeddings for knowledge-base lookup. A reply can take several seconds. The user's message returns immediately; the bot message arrives via Reverb when generation completes.

### Anonymous users on landing pages

Anonymous chat uses public Echo channels (`anonymous-users.{id}`). Authenticated users use private channels (`users.{id}`). Both are wired in `resources/js/components/chat/state.tsx`.

---

## Related Docs

- [Local Development](./local-development.md) — PHP extensions and local dev commands
- [Production App Server](./production-app-server.md) — production PHP packages including `php-bcmath`
- [Debugging](./debugging.md) — Xdebug for stepping through listeners and agents
- [Product Requirements](./requirements.md) — product context for chat and anonymous users
