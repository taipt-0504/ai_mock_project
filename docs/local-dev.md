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

### Env file model

| File | Tracked? | Read by |
| --- | --- | --- |
| `.env.example` | ✅ committed | Documentation only — copy this to `.env.local`. |
| `.env.local` | ❌ gitignored | `npm run dev` (Next.js auto-loads). Your real Google OAuth + `AUTH_SECRET`. |
| `.env.test` | ✅ committed | `npm run test` (Vitest auto-loads via `loadEnv` in [`vitest.config.ts`](../vitest.config.ts)). Safe placeholders for shared test runs. |
| `.env.test.local` | ❌ gitignored | Per-developer test overrides — wins over `.env.test`. Use this if your local Postgres listens on a non-default port, etc. |

Vitest follows Vite's standard load order (later wins): `.env` → `.env.local`
→ `.env.test` → `.env.test.local`. Shell-provided vars always win — e.g.
`DATABASE_URL_TEST=postgres://other npm run test` overrides anything in the
files. **You no longer need `set -a && source .env.local && set +a`** before
`npm run test` — that workaround is only required for Prisma CLI commands
(see § 4).

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

### Vitest (unit + integration)

```bash
npm run test            # one-shot run
npm run test:watch      # watch mode
```

Vitest auto-loads env from `.env.test` + `.env.test.local` (see § 3).
You don't need to `source` anything — `DATABASE_URL_TEST` reaches both the
test workers and the `globalSetup` script.

> ⚠️ The Vitest `globalSetup` at [`tests/global-setup.ts`](../tests/global-setup.ts)
> runs `prisma migrate reset --force --skip-seed` against `DATABASE_URL_TEST`
> **before every run**. That destroys the test database (the dedicated
> `saa2025_test` schema, never the dev DB). Prisma's AI-safety guard
> requires `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="<reason>"` when
> the run is invoked from inside an AI assistant — set it explicitly if
> you're driving the suite through Claude or similar.

### Playwright (E2E)

The pre-launch gate splits the E2E suite into two cells. Pick the one you
need:

```bash
# Run the regression suite (Homepage, Login, gate-disabled, smoke).
# SAA_LAUNCH_AT pinned to a past timestamp inside the script.
npm run test:e2e:gate-disabled

# Run only the prelaunch gate-active specs.
# SAA_LAUNCH_AT pinned to a future timestamp inside the script.
npm run test:e2e:gate-active

# Alias for `:gate-disabled` — keeps existing `npm run test:e2e` muscle memory.
npm run test:e2e

# Interactive UI mode (does not pin SAA_LAUNCH_AT — set it yourself):
SAA_LAUNCH_AT=2000-01-01T00:00:00Z npm run test:e2e:ui
```

CI runs both cells as a 2-cell matrix (see
[`.github/workflows/ci.yml`](../.github/workflows/ci.yml)); both must pass
for merge. Playwright spawns its own dev server with whatever
`SAA_LAUNCH_AT` is set when the script starts — if a stray dev server is
already running on `:3000`, Playwright reuses it (per
[`playwright.config.ts`](../playwright.config.ts) `reuseExistingServer`),
so kill the old one if you've changed gate state.

## 7. Useful scripts

| Command                          | What it does                                                    |
| -------------------------------- | --------------------------------------------------------------- |
| `npm run dev`                    | Next.js dev server with Turbopack                               |
| `npm run build`                  | Production build                                                |
| `npm run lint`                   | ESLint (constitution-mandated rules included)                   |
| `npm run test`                   | Vitest unit + integration (auto-loads `.env.test`)              |
| `npm run test:watch`             | Vitest in watch mode                                            |
| `npm run test:e2e`               | Alias for `test:e2e:gate-disabled` (the default regression run) |
| `npm run test:e2e:gate-disabled` | Playwright suite with `SAA_LAUNCH_AT=<past>` — pre-launch gate OFF |
| `npm run test:e2e:gate-active`   | Only `tests/e2e/prelaunch/gate-active*.spec.ts` with `SAA_LAUNCH_AT=<future>` |
| `npm run test:e2e:ui`            | Playwright `--ui` interactive mode (set `SAA_LAUNCH_AT` yourself) |
| `npm run db:migrate`             | Apply pending Prisma migrations to the dev DB                   |
| `npm run db:test:reset`          | Reset the **test** DB (also invoked by Vitest `globalSetup`)    |
| `npm run db:reset`               | Reset the dev DB (destructive!)                                 |
| `npm run db:generate`            | Regenerate the Prisma client                                    |
| `npm run db:seed`                | Run `prisma/seed.ts` (currently a no-op stub)                   |

## Troubleshooting

- **`PrismaClientInitializationError: Can't reach database server`** → make
  sure `docker compose up -d db` is running and `.env.local` points at
  `localhost:5432`.
- **Auth.js redirect loop** → confirm the Google Cloud Console has the
  exact redirect URI `http://localhost:3000/api/auth/callback/google`.
- **Tests stuck on Playwright launching** → run `sudo npx playwright
  install-deps chromium` once on a fresh Linux host.
- **`[tests/global-setup] DATABASE_URL_TEST not set …`** → either
  `.env.test` is missing the var (it ships with one — re-pull) or you
  set `DATABASE_URL_TEST=` (empty) in your shell. Shell vars win, so an
  empty shell value clobbers the file.
- **`Prisma Migrate detected that it was invoked by Claude Code`** → the
  AI-safety guard fired. Re-run with
  `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="<your reason>"` prefixed,
  or run the command in a regular terminal outside the AI session.
- **Every page redirects to `/coming-soon` in dev** → `SAA_LAUNCH_AT` is
  unset / malformed and the proxy is failing CLOSED (spec FR-009). Set
  it to a past ISO-8601 timestamp in `.env.local` to disable the gate.
- **Playwright reuses a stale dev server with the wrong `SAA_LAUNCH_AT`**
  → `playwright.config.ts` reuses an existing server on `:3000` for
  speed. After switching gate state, kill the dev server (`fuser -k
  3000/tcp` or `lsof -ti:3000 | xargs kill`) before re-running.
