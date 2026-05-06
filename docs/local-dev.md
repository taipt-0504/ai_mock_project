# Local Development Guide

Get the SAA 2025 app running on your machine in under five minutes.

## Prerequisites

- **Node.js 20.9+** (use `nvm use 20` if you have nvm)
- **Docker** + Docker Compose (for the local Postgres)
- **PostgreSQL 15+** if you'd rather run it natively (skip the Docker step)

## 1. Clone + install

```bash
git clone <repo-url> ai_mock_project
cd ai_mock_project
npm install
```

## 2. Start the database

```bash
docker compose up -d db
```

This starts a `postgres:15-alpine` container on `:5432` with database
`saa2025`. The data persists in the named volume `pgdata`.

> The same container hosts a separate `saa2025_test` database for the test
> suite. If `npm run test` complains about a missing test DB, create it
> manually:
> ```bash
> docker exec saa2025-postgres \
>   psql -U saa2025 -d postgres -c \
>   "CREATE DATABASE saa2025_test OWNER saa2025;"
> ```

## 3. Configure environment

```bash
cp .env.example .env.local
```

Then fill in the secrets — see [`auth-setup.md`](./auth-setup.md) for the
Google OAuth + `AUTH_SECRET` walkthrough.

## 4. Apply migrations

Prisma's CLI doesn't auto-load `.env.local`. Use either:

```bash
# Quick one-off:
set -a && source .env.local && set +a && npm run db:migrate

# Or install dotenv-cli and prefix npm scripts.
```

## 5. Run the app

```bash
npm run dev
```

Open <http://localhost:3000>. You'll be redirected to `/login` until you
complete the Google sign-in flow.

## 6. Run the tests

```bash
# Unit + integration (Vitest):
npm run test

# E2E (Playwright):
npm run test:e2e
```

> The Vitest `globalSetup` runs `prisma migrate reset --force --skip-seed`
> against `DATABASE_URL_TEST` before any test file. That command destroys
> the test database — Prisma's safety guard requires the env var
> `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` to be set when running
> from inside an AI assistant.

## 7. Useful scripts

| Command                        | What it does                                       |
| ------------------------------ | -------------------------------------------------- |
| `npm run dev`                  | Next.js dev server with Turbopack                  |
| `npm run build`                | Production build                                   |
| `npm run lint`                 | ESLint (constitution-mandated rules included)      |
| `npm run test`                 | Vitest unit + integration                          |
| `npm run test:e2e`             | Playwright E2E                                     |
| `npm run db:migrate`           | Apply pending Prisma migrations to the dev DB      |
| `npm run db:test:reset`        | Reset the **test** DB (used by `globalSetup`)      |
| `npm run db:reset`             | Reset the dev DB (destructive!)                    |
| `npm run db:generate`          | Regenerate the Prisma client                       |
| `npm run db:seed`              | Run `prisma/seed.ts` (currently a no-op stub)      |

## Troubleshooting

- **`PrismaClientInitializationError: Can't reach database server`** → make
  sure `docker compose up -d db` is running and `.env.local` points at
  `localhost:5432`.
- **Auth.js redirect loop** → confirm the Google Cloud Console has the
  exact redirect URI `http://localhost:3000/api/auth/callback/google`.
- **Tests stuck on Playwright launching** → run `sudo npx playwright
  install-deps chromium` once on a fresh Linux host.
