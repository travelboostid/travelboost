# Travelboost Project

Travelboost is a platform designed to streamline travel planning and management.
This repository contains the core application along with tools to support development and deployment.

---

## 📚 Documentation

- [Standard Operating Procedures (SOP)](./docs/sop.md)
- [Development Environment Setup](./docs/development-environment-setup.md)
- [Deployment Guidelines](./docs/deployments.md)
- [Architecture Overview](./docs/architecture.md)
- [Translations](./docs/technical/translations.md)

---

## 🚀 Getting Started

Before starting, ask your teammate for the required `.env` configuration.
We provide preset files (`.env.preset.*`)—place them in the root of the project.

### 1. Clone the repository

```bash
git clone <this-repository>
cd <project-folder>
```

### 2. Initialize environment

```bash
pnpm dev:init
```

This will:

- Install PHP dependencies (`composer install`)
- Install JS dependencies (`pnpm install`)
- Prompt you to select an available `.env` preset

### 3. Run development server

**Full stack (recommended)**
Includes:

- Laravel server
- Vite
- Queue worker
- Reverb

```bash
pnpm dev:full
```

**Minimal setup**
Includes:

- Laravel server
- Vite

```bash
pnpm dev:min
```

---

## 🛠 Dev CLI

A helper CLI is available to simplify common tasks:

```bash
pnpm dev
```

This will open an interactive menu for:

- Switching environment presets
- Running development servers
- Deployment helpers
- i18n utilities

---

## 🚢 Deployment

For deployment instructions, refer to:
👉 [Deployment Guidelines](./docs/deployments.md)
