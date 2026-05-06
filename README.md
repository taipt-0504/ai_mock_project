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

## Quickstart

```bash
docker compose up -d db          # local Postgres on :5432
cp .env.example .env.local       # then fill in secrets — see docs/auth-setup.md
set -a && source .env.local && set +a && npm run db:migrate
npm run dev                      # http://localhost:3000 → /login
```

Run the tests with `npm run test` (Vitest) and `npm run test:e2e`
(Playwright). See [`docs/local-dev.md`](./docs/local-dev.md) for details.

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
