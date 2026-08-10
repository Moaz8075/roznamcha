# Roznamcha

Business accounting and ledger monorepo — **mobile-first**, with a NestJS API and a Next.js web placeholder for later.

## Stack

| Layer | Tech |
| --- | --- |
| Monorepo | Turborepo + pnpm + TypeScript |
| Mobile | Expo, Expo Router, NativeWind, TanStack Query, React Hook Form, Zod |
| API | NestJS, Prisma, PostgreSQL, JWT, Swagger |
| Web (later) | Next.js + Tailwind placeholder in `apps/web` |
| Shared | `packages/types`, `validation`, `constants`, `api-client`, `config` |

## Requirements

- Node.js 20+
- [pnpm](https://pnpm.io) 9+
- Docker (for local PostgreSQL)

## Install pnpm

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
```

Or: `npm install -g pnpm`

## Install dependencies

```bash
pnpm install
```

## Start PostgreSQL

With Docker:

```bash
docker compose up -d
```

Or use a local PostgreSQL instance and create a database/user matching `.env.example`:

```bash
# example for local Postgres
createuser roznamcha -P   # password: roznamcha
createdb -O roznamcha roznamcha
```

Grant `CREATEDB` to the role if you use `pnpm db:migrate:dev` (Prisma needs a shadow database). Alternatively use `pnpm db:push` for local prototyping.

## Environment setup

```bash
cp .env.example .env
```

Edit `.env` if needed. Defaults work with the Docker Compose Postgres service.

Also copy env into the API app if you prefer local overrides:

```bash
cp .env.example apps/api/.env
```

## Run migrations

```bash
pnpm db:generate
pnpm db:migrate:dev
```

When prompted for a migration name, use something like `init`.

## Seed database

```bash
pnpm db:seed
```

Default users:

| Email | Password | Role |
| --- | --- | --- |
| admin@roznamcha.local | admin123 | ADMIN |
| manager@roznamcha.local | manager123 | MANAGER |
| staff@roznamcha.local | staff123 | STAFF |

## Start API

```bash
pnpm --filter @roznamcha/api dev
```

- API: http://localhost:3001/api/v1
- Swagger: http://localhost:3001/api/docs

## Deploy API (Render)

Root directory: repo root (monorepo).

**Build command** (example):

```bash
pnpm install && pnpm --filter @roznamcha/api build
```

**Start command:**

```bash
pnpm db:migrate && pnpm api:start
```

Set `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, and rely on Render’s `PORT` (see `apps/api/src/main.ts`).

## Start mobile

```bash
pnpm --filter @roznamcha/mobile dev
```

Set `EXPO_PUBLIC_API_URL` in `.env` to your machine LAN IP when testing on a physical device, e.g. `http://192.168.1.10:3001/api/v1`.

## Start everything (Turbo)

```bash
pnpm dev
```

## Future web setup

```bash
pnpm --filter @roznamcha/web dev
```

Opens the placeholder at http://localhost:3000. Share `@roznamcha/api-client` for API calls when building the web UI.

## Useful scripts

```bash
pnpm build
pnpm lint
pnpm test
pnpm db:studio
pnpm db:seed
```

## Architecture notes

- **Money** is stored as PostgreSQL `Decimal(18,4)` and calculated with `decimal.js` on the API. Never use JS floats for money.
- **Balances** for customers/suppliers are derived from `LedgerEntry` rows (or maintained only inside `TransactionService`). Do not update balances from controllers.
- **Roznamcha** (`CashTransaction`) records **actual cash movement only**. Credit sales/purchases do not create cash rows.
- Financial writes go through `TransactionService` inside Prisma `$transaction` so related records commit atomically.
- Soft deletes (`deletedAt`) are used for financial documents; prefer reversals over hard deletes.

## Project layout

```
apps/mobile     Expo app
apps/api        NestJS API
apps/web        Next.js placeholder
packages/*      Shared types, validation, constants, api-client
prisma/         Schema + seed
docker/         Optional API Dockerfile
```
