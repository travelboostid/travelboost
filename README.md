# Travelboost Project Setup & Technical Documentation

## Table of Contents

Prerequisites
Initial Setup
Development Workflow
Package Documentation
Useful Commands
Troubleshooting

## Prerequisites

### Backend Requirements

PHP (Version specified in `composer.json`)

- Local environment: XAMPP (team standard)
- [Read more about PHP requirements](https://laravel.com/docs/12.x/deployment#server-requirements)
  Composer - PHP dependency manager
- [Download Composer](https://getcomposer.org/download/)
  Laravel Installer - For creating/managing Laravel projects

```sh
composer global require laravel/installer
```

### Frontend & Tooling Requirements

Node.js (LTS version) - Required for frontend assets and build tooling

- [Download Node.js](https://nodejs.org/)
  PNPM (Required) - Preferred package manager for consistency and faster installs

```sh
npm install -g pnpm
```

- ⚠️ Do not use npm or yarn for this project

### Development Environment

Visual Studio Code (Recommended) - Standard editor for team consistency
Required VS Code Extensions:

- Prettier - Code formatting consistency
- ESLint - JavaScript/TypeScript linting
- PHP Intelephense - PHP intelligence & autocompletion

## Initial Setup

### 1. Create New Laravel Project

```sh
laravel new travelboost
```

During installation:

- Starter kit: Select `react`
- Authentication: Choose Laravel's built-in authentication
- Testing framework: Select `Pest` (recommended)
- Laravel Boost: Yes (for AI-assisted coding)
- npm install: Select `no` (we'll use pnpm)

### 2. Navigate & Install Dependencies

```sh
cd travelboost
pnpm install && pnpm build
```

### 3. Environment Configuration

```sh
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

## Development Workflow

### Running Development Servers

Open three terminal tabs for full development environment:

**Tab 1 - Backend Server (Laravel):**

```sh
php artisan serve
```

**Tab 2 - Frontend Server (Vite):**

```sh
pnpm dev
```

**Tab 3 - Real-time & Queue Processing:**
Open a third tab and run both services in sequence:

_Option 1: Run one at a time (in separate tabs or windows):_

```sh
# For WebSocket/real-time features
php artisan reverb:start

# For background job processing (queues)
php artisan queue:work
```

_Option 2: Run required process concurrently using a process manager:_

```sh
# Install a process manager first
pnpm add -D concurrently

# Then run all together
pnpm run dev:laravel
```

Add this script to your `package.json`:

```json
"scripts": {
  "dev:laravel": "concurrently \"php artisan reverb:start\" \"php artisan queue:work\" \"pnpm dev\" \"php artisan serve\""
}
```

**Important Notes:**

- **Reverb (WebSocket Server):** Required for real-time features like notifications, chat, live updates
- Runs on port 8080 by default (configurable in `.env`)
- Must be running for broadcasting/real-time events to work
- **Queue Worker:** Required for processing background jobs (emails, notifications, heavy tasks)
- Processes jobs from the database/redis queue
- Must be running for queued jobs to execute
- Both services support auto-restart on file changes
- Both servers (and the main Laravel server) must be running simultaneously

### Hot Reload Features

- **Frontend (Vite):** Automatic CSS/JS updates without page refresh
- **Backend (Laravel):** Auto-detects PHP changes (may need manual refresh)
- **Reverb Server:** Restarts automatically when configuration changes
- **Queue Worker:** Restarts when job classes or configuration changes

### Editor Configuration

#### Prettier Setup

```sh
pnpm add -D prettier-plugin-organize-imports
```

Create `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "singleAttributePerLine": false,
  "htmlWhitespaceSensitivity": "css",
  "printWidth": 80,
  "plugins": [
    "prettier-plugin-tailwindcss",
    "prettier-plugin-organize-imports"
  ],
  "tailwindFunctions": ["clsx", "cn", "cva"],
  "tailwindStylesheet": "resources/css/app.css",
  "tabWidth": 2,
  "overrides": [
    {
      "files": "**/*.yml",
      "options": {
        "tabWidth": 2
      }
    }
  ]
}
```

#### ESLint Configuration

Update `eslint.config.js`:

```js
{
  ...importPlugin.flatConfigs.typescript,
  files: ['**/*.{ts,tsx}'],
  rules: {
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
        fixStyle: 'separate-type-imports',
      },
    ],
    'import/order': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
}
```

## Package Documentation

### Core Laravel Packages

#### Laravel Reverb (Broadcasting)

```sh
php artisan install:broadcasting
```

- **Purpose:** Real-time WebSocket communication
- **Why used:** Enables live updates and notifications
- **Configuration:** Select `reverb` when prompted
- **Default Port:** 8080 (configurable in `.env`)
- **How to start:** `php artisan reverb:start`
- **Must run alongside:** Laravel server (`php artisan serve`)
- [Laravel Reverb Documentation](https://laravel.com/docs/12.x/reverb)

**Configuration Tips:**

- Check `.env` for `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET`
- Ensure `BROADCAST_CONNECTION=reverb` in `.env`
- WebSocket client connects to `ws://localhost:8080` by default

#### Queue Setup & Processing

**Purpose:** Handle background jobs (emails, notifications, heavy processing)

**Queue Driver Configuration (in `.env`):**

```env
QUEUE_CONNECTION=database  # or 'redis' for better performance
```

**Required Setup:**

```sh
# Create jobs table (if using database driver)
php artisan queue:table
php artisan migrate

# Or install Redis (recommended for production)
# sudo apt-get install redis-server
```

**How to start queue worker:**

```sh
# Basic queue worker
php artisan queue:work

# With specific connection
php artisan queue:work --connection=database

# With retry failed jobs
php artisan queue:work --tries=3

# Process specific queue
php artisan queue:work --queue=emails,notifications

# With supervisor (production)
# See Laravel documentation for supervisor configuration
```

**Queue Monitoring:**

```sh
# View failed jobs
php artisan queue:failed

# Retry failed jobs
php artisan queue:retry all

# Clear failed jobs
php artisan queue:flush

# List all jobs in queue
php artisan queue:list
```

#### Storage Setup

```sh
php artisan storage:link
```

Creates symbolic link from `storage/app/public` to `public/storage`

#### CORS Configuration

```sh
php artisan config:publish cors
```

Update `config/cors.php`:

```php
'paths' => ['api/*', 'webapi/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['http://127.0.0.1:8000', 'http://localhost:8000', 'https://travelboost.co.id'],
'supports_credentials' => true,
```

#### Laravel Pennant (Feature Flags)

```sh
php artisan vendor:publish --provider="Laravel\Pennant\PennantServiceProvider"
php artisan migrate
```

- Purpose: Feature flag management
- Why used: Gradual feature rollout and A/B testing
- [Laravel Pennant Documentation](https://laravel.com/docs/12.x/pennant)

#### Laravel Telescope (Debugging)

```sh
composer require laravel/telescope
php artisan telescope:install
php artisan migrate
```

- Purpose: Application debugging and monitoring
- Why used: Insight into requests, exceptions, queries, etc.
- Access: http://localhost:8000/telescope
- [Laravel Telescope Documentation](https://laravel.com/docs/12.x/telescope)

#### Laravel Wallet (Payment Management)

```sh
composer require bavix/laravel-wallet
php artisan vendor:publish --tag=laravel-wallet-migrations
php artisan vendor:publish --tag=laravel-wallet-config
php artisan migrate
```

- Purpose: Digital wallet and transaction management
- Why used: Handle user balances, payments, and transfers
- [Laravel Wallet Documentation](https://github.com/bavix/laravel-wallet)

#### Scramble (API Documentation)

```sh
composer require dedoc/scramble
php artisan vendor:publish --provider="Dedoc\Scramble\ScrambleServiceProvider" --tag="scramble-config"
```

- Purpose: Automatic API documentation
- Why used: Generates OpenAPI documentation from Laravel code
- Access: http://localhost:8000/docs/api
- [Scramble Documentation](https://scramble.dedoc.co/)

#### Image Processor

```sh
composer require intervention/image
```

- Purpose: Image manipulation and processing.
- Always prefer Dependency Injection for services used in multiple places.

Setup in `app\Providers\AppServiceProvider.php`:

```php
public function register(): void
{
  $this->app->singleton(ImageManager::class, function () {
    return new ImageManager(new Driver());
  });
}
```

Usage Example in a Controller:

```php
class MediaController extends Controller
{
  public function __construct(
    private ImageManager $imageManager
  ) {}

  public function uploadImage(Request $request){
    $validated = $request->validate([
    'data' => ['required', 'file'],
    ]);
    $file = $validated['data'];

    $image = $this->imageManager->read($file);
    $image->scale(width: 100);
    Storage::disk('public')->put("uploaded_100.jpg", (string) $clone->encode(new JpegEncoder(quality: $variant['quality'])));
    ...
  }
}
```

#### LLM Library

```sh
composer require theodo-group/llphant
```

Add API key to `.env`:

```
OPENAI_API_KEY=xxx
```

Setup Dependency Injection in `app\Providers\AppServiceProvider.php`:

```php
public function register(): void
{
  $this->app->singleton(OpenAIConfig::class, function () {
    $config = new OpenAIConfig();
    $config->apiKey = env('OPENAI_API_KEY');
    return $config;
  });
  $this->app->singleton(ChatInterface::class, function ($app) {
    $config = $app->make(OpenAIConfig::class);
    $chat = new OpenAIChat($config);
    return $chat;
  });
  $this->app->singleton(EmbeddingGeneratorInterface::class, function ($app) {
    $config = $app->make(OpenAIConfig::class);
    $chat = new OpenAI3SmallEmbeddingGenerator($config);
    return $chat;
  });
}
```

### Frontend Packages

#### Core UI & Utilities

```sh
pnpm dlx shadcn@latest add --all
pnpm add axios @tanstack/react-query @tanstack/react-table next-themes
```

- shadcn/ui: Pre-designed, accessible React components
- Axios: HTTP client for API requests
- React Query: Server state management
- React Table: Headless table utilities
- next-themes: Theme switching support

#### Additional Utilities

```sh
pnpm add @tabler/icons-react dayjs react-markdown react-easy-crop react-intersection-observer
```

- @tabler/icons-react: Icon library
- dayjs: Lightweight date manipulation
- react-markdown: Markdown rendering
- react-easy-crop: Image cropping component
- react-intersection-observer: Lazy loading utilities

#### TypeScript API Generation (Orval)

```sh
pnpm add -D orval@^7.17.2
```

- Purpose: Generate TypeScript API clients from OpenAPI spec
- Why used: Type-safe API calls with React Query integration

Create `orval.config.js`:

```js
import { defineConfig } from 'orval';

export default defineConfig({
  traveboostQuery: {
    output: {
      mode: 'tags-split',
      target: 'resources/js/api/traveboost.ts',
      schemas: 'resources/js/api/model',
      client: 'react-query',
      override: {
        mutator: {
          path: './resources/js/api/api-instance.ts',
          name: 'apiInstance',
        },
      },
    },
    input: {
      target: 'http://localhost:8000/docs/api.json',
    },
  },
});
```

Create API instance (`resources/js/api/api-instance.ts`):

```ts
import type { AxiosRequestConfig } from 'axios';
import Axios from 'axios';

export const AXIOS_INSTANCE = Axios.create({
  baseURL: '/webapi',
  withCredentials: true,
  withXSRFToken: true,
});

// Error handling interceptor...

export const apiInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
  }).then(({ data }) => data);

  return promise;
};
```

Generate TypeScript types:

```sh
pnpm orval
```

### Custom Application Setup

#### User Model Extensions

1.  Create UserType enum in `app/Enums/UserType.php`:
    ```php
    namespace App\Enums;
    enum UserType: string
    {
      case Generic = 'generic';
      case Agent = 'agent';
      case Vendor = 'vendor';
    }
    ```
2.  Update users migration:
    ```php
    $table->enum('type', UserType::cases())->default('agent');
    $table->foreignId('photo_id')
      ->nullable()
      ->constrained('medias')
      ->nullOnDelete();
    ```
3.  Configure Fortify for username/email login in `config/fortify.php`:
    ```php
    'username' => 'usernameOrEmail',
    ```
4.  Update `app/Providers/FortifyServiceProvider.php`:
    ```php
    Fortify::authenticateUsing(function (Request $request) {
      $usernameOrEmail = $request->input('usernameOrEmail');
      $user = User::where('email', $usernameOrEmail)
        ->orWhere('username', $usernameOrEmail)
        ->first();
      if ($user && Hash::check($request->password, $user->password)) {
        return $user;
      }
      return null;
    });
    ```

#### Application Configuration

Update React providers in `app.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/sonner';

const queryClient = new QueryClient();

root.render(
  <StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <App {...props} />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
```

## Useful Commands

### Database Management

```sh
# Fresh migration with seeding
php artisan migrate:fresh --seed
# Run migrations
php artisan migrate
# Rollback last migration
php artisan migrate:rollback
# Show migration status
php artisan migrate:status
```

### Development Utilities

```sh
# Clear application cache
php artisan optimize:clear
# Clear route cache
php artisan route:clear
# Clear config cache
php artisan config:clear
# Clear view cache
php artisan view:clear
# Generate IDE helper files
php artisan ide-helper:generate
```

### Server Management Commands

```sh
# Start Laravel development server
php artisan serve

# Start WebSocket server (Reverb)
php artisan reverb:start

# Start queue worker for background jobs
php artisan queue:work

# Start both Reverb and Queue together (using concurrently)
pnpm run dev:services

# Check if Reverb is running
curl http://localhost:8080/apps/your-app-id

# Restart queue worker
php artisan queue:restart

# Stop all running services
# Use Ctrl+C in each terminal tab
```

### Frontend Commands

```sh
# Install dependencies
pnpm install
# Development build
pnpm dev
# Production build
pnpm build
# Generate TypeScript API types
pnpm orval
# Run tests
pnpm test
```

## Troubleshooting

### Common Issues

1.  **Port Already in Use:**

    ```sh
    # Kill process on port 8000 (Laravel)
    sudo lsof -ti:8000 | xargs kill -9

    # Kill process on port 8080 (Reverb)
    sudo lsof -ti:8080 | xargs kill -9

    # Kill process on port 5173 (Vite)
    sudo lsof -ti:5173 | xargs kill -9
    ```

2.  **Reverb Not Connecting:**
    - Check if Reverb is running: `php artisan reverb:start`
    - Verify `.env` has correct Reverb configuration
    - Ensure `BROADCAST_CONNECTION=reverb` in `.env`
    - Check browser console for WebSocket connection errors

3.  **Queue Jobs Not Processing:**
    - Check if queue worker is running: `php artisan queue:work`
    - Verify queue driver in `.env`: `QUEUE_CONNECTION=database`
    - Run migrations: `php artisan migrate` (if using database driver)
    - Check failed jobs: `php artisan queue:failed`

4.  **Storage Link Issues:**

    ```sh
    # Remove existing link and recreate
    rm public/storage
    php artisan storage:link
    ```

5.  **Composer Dependencies:**

    ```sh
    # Clear composer cache
    composer clear-cache
    # Update dependencies
    composer update
    ```

6.  **Node/PNPM Issues:**
    ```sh
    # Clear pnpm cache
    pnpm store prune
    # Reinstall dependencies
    rm -rf node_modules
    pnpm install
    ```

### Environment Variables

Ensure `.env` is properly configured for all services:

```env
APP_URL=http://localhost:8000
APP_ENV=local
APP_DEBUG=true

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=travelboost
DB_USERNAME=root
DB_PASSWORD=

# Broadcasting (Reverb)
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=travelboost
REVERB_APP_KEY=app-key
REVERB_APP_SECRET=app-secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http

# Queue
QUEUE_CONNECTION=database  # or 'redis' for better performance
```

### Development Tips

1.  **Running All Services:**
    - Use terminal tabs or a terminal multiplexer (like tmux)
    - Consider using `concurrently` to run multiple commands
    - Create a start script in `package.json` for convenience

2.  **Monitoring:**
    - Laravel Telescope: http://localhost:8000/telescope
    - Queue status: `php artisan queue:work --once` (test processing)
    - Reverb status: Check terminal output of `reverb:start` command

3.  **Debugging Real-time Issues:**
    - Check browser console for WebSocket errors
    - Use Laravel Echo debugging: `window.Echo.connector.socket.on('connect', ...)`
    - Check Laravel logs: `tail -f storage/logs/laravel.log`

### Support & Resources

- [Laravel Documentation](https://laravel.com/docs)
- [Laravel Reverb Documentation](https://laravel.com/docs/12.x/reverb)
- [Laravel Queues Documentation](https://laravel.com/docs/12.x/queues)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- Project Issue Tracker: _[Add your project's issue tracker link]_

---

_Last Updated: February 2026_  
_Maintainer: Travelboost Development Team_

composer require midtrans/midtrans-php
