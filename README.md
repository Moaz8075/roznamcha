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

Root directory: **repo root** (leave blank / `.`).

Do **not** use `corepack enable` on Render — it fails with `EROFS: read-only file system`.

In the Render service → **Settings** → **Build & Deploy**, set:

**Build Command** (replace the old one entirely):

```bash
npm install -g pnpm@9.15.0 && pnpm run render:build
```

`render:build` installs **including devDependencies** (`turbo`, Nest CLI) even when Render sets `NODE_ENV=production`.

**Start Command:**

```bash
pnpm db:migrate && pnpm api:start
```

Then **Manual Deploy** → Clear build cache & deploy (or push a new commit).

Env vars: `DATABASE_URL`, `JWT_SECRET`. Render injects `PORT`.

**Neon `DATABASE_URL` on Render** (fixes `P1001` cold-start timeouts):

1. Neon dashboard → open **SQL Editor** once (wakes the DB).
2. **Connect** → copy the **pooled** connection string.
3. On Render → Environment → set `DATABASE_URL` to that string and append:
   `&connect_timeout=30` (keep `sslmode=require`).

Example shape:

```text
postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require&connect_timeout=30
```

“No open ports detected” during start is normal if migrate fails first — fix the DB URL and redeploy.

## Android APK (points at Render API)

1. Put your Render API base URL in `apps/mobile/eas.json` under `preview.env.EXPO_PUBLIC_API_URL`  
   (and the same in `production.env`), e.g.:

```text
https://roznamcha-api.onrender.com/api/v1
```

   Must be **https**, and include `/api/v1`.

2. From the repo (no global install needed — avoids `EACCES` on `/usr/local`):

```bash
cd apps/mobile
pnpm install
pnpm eas:login
pnpm eas:configure
pnpm build:apk
```

Or without installing eas locally first:

```bash
cd apps/mobile
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build -p android --profile preview
```

3. When the build finishes, open the Expo build URL → download the **APK** → install on the phone  
   (allow “Install unknown apps” if needed).

4. On first open, confirm login works against Render. Settings shows the API URL.

**Notes**
- Free Render services sleep; the first request after idle can be slow.
- Expo Go still uses Metro/`localhost` unless you set `EXPO_PUBLIC_API_URL` for that session; the **APK** uses the URL baked in at build time.
- For Play Store later, use `build:aab` (production profile).
- EAS runs `eas-build-post-install` to compile workspace packages (`constants`, `types`, etc.) into `dist/` before bundling.

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
