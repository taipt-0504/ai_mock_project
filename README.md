# Sun Annual Awards 2025 (SAA 2025)

Internal Next.js application for the **Sun Annual Awards 2025** program.
Built with Next.js 16 App Router, React 19, TypeScript, Tailwind v4,
Auth.js v5 (Google OAuth + Prisma database sessions), and PostgreSQL.

## Documentation

- [Local development guide](./docs/local-dev.md) — start here.
- [Auth.js + Google Cloud setup](./docs/auth-setup.md) — provisioning the
  OAuth client and `AUTH_SECRET`.
- [Project constitution](./.momorph/constitution.md) — non-negotiable
  standards: tech stack, layering, security baseline, testing discipline.
- Login feature spec & plan:
  [`spec.md`](./.momorph/specs/GzbNeVGJHz-login/spec.md) ·
  [`plan.md`](./.momorph/specs/GzbNeVGJHz-login/plan.md) ·
  [`tasks.md`](./.momorph/specs/GzbNeVGJHz-login/tasks.md).
- Pre-launch gate spec & plan:
  [`spec.md`](./.momorph/specs/8PJQswPZmU-countdown-prelaunch-page/spec.md) ·
  [`plan.md`](./.momorph/specs/8PJQswPZmU-countdown-prelaunch-page/plan.md) ·
  [`tasks.md`](./.momorph/specs/8PJQswPZmU-countdown-prelaunch-page/tasks.md).

## Quickstart

```bash
docker compose up -d db          # local Postgres on :5432
cp .env.example .env.local       # then fill in secrets — see docs/auth-setup.md
set -a && source .env.local && set +a && npm run db:migrate
npm run dev                      # http://localhost:3000 → /login
```

Run the tests with `npm run test` (Vitest) and `npm run test:e2e`
(Playwright). See [`docs/local-dev.md`](./docs/local-dev.md) for details.

## Pre-launch gate

`proxy.ts` ships a global pre-launch gate. Until `now() >= SAA_LAUNCH_AT`,
every non-whitelisted request is 307'd to `/coming-soon`. Once the gate
lifts, `/coming-soon` itself redirects to `/` and the rest of the app
resumes its normal access semantics.

**`SAA_LAUNCH_AT` is required in every environment** — production,
staging, dev, test, CI. The proxy fails CLOSED when this env var is
unset / empty / malformed (the gate stays ACTIVE in every `NODE_ENV`,
per spec FR-009). Local dev or CI without the env will redirect every
page load to `/coming-soon`.

- Set to a **past** ISO-8601 timestamp to **disable** the gate (normal
  local dev). `npm run dev` reads from `.env.local`; the
  [`.env.example`](./.env.example) `SAA_LAUNCH_AT` block defaults to
  `2025-01-01T00:00:00+07:00` for this reason.
- Set to a **future** timestamp to **activate** the gate and exercise
  the prelaunch surface.

Two Playwright scripts split the gate states for CI + local runs:

| Script                          | Purpose                                                                                                          |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `npm run test:e2e:gate-active`  | Runs `tests/e2e/prelaunch/gate-active*.spec.ts` with `SAA_LAUNCH_AT` set to a future timestamp.                  |
| `npm run test:e2e:gate-disabled` | Runs the rest of the suite with `SAA_LAUNCH_AT` set to a past timestamp. `npm run test:e2e` aliases to this one. |

CI runs both as a 2-cell matrix (see [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)).
Both cells must pass for merge. See
[`./.momorph/specs/8PJQswPZmU-countdown-prelaunch-page/plan.md`](./.momorph/specs/8PJQswPZmU-countdown-prelaunch-page/plan.md)
for the threat model and proxy decision matrix.

## Tech stack

| Layer        | Choice                                        |
| ------------ | --------------------------------------------- |
| Framework    | Next.js 16.2 App Router (Turbopack)           |
| UI           | React 19, Tailwind CSS v4                     |
| Type system  | TypeScript 5 (strict)                         |
| Auth         | Auth.js v5 (NextAuth) + `@auth/prisma-adapter`|
| Database     | PostgreSQL 15 + Prisma ORM                    |
| Validation   | Zod                                           |
| Test         | Vitest + Playwright + React Testing Library   |
| Lint         | ESLint 9 (`eslint-config-next`)               |

Constitution-mandated rules are enforced in lint + tests:

- Only `src/lib/config.ts` may read `process.env`.
- Only `src/lib/logger.ts` may emit `console.*`.
- Auth.js uses **database sessions** (not JWT) — every sign-in writes a
  `Session` row.
- Every test pair is authored *before* its production code (TDD).
