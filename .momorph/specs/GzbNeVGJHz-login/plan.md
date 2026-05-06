# Implementation Plan: Login

**Frame**: `GzbNeVGJHz-Login`
**Date**: 2026-05-06
**Spec**: `.momorph/specs/GzbNeVGJHz-login/spec.md` (Status: **Ready for Plan**)
**Research**: `.momorph/specs/GzbNeVGJHz-login/research.md`
**Constitution**: `.momorph/constitution.md` (v1.1.1)

---

## Summary

Build the unauthenticated entry point for SAA 2025: a Next.js 16 App-Router route at `/login`
that (a) detects an existing session via Auth.js + Prisma database sessions and server-side
redirects authenticated visitors to `/` (Homepage SAA placeholder), (b) renders a localized
hero (`vi-VN` default, `en-US` opt-in) with a single Google sign-in button, and (c) surfaces
a header language selector that persists the choice via cookie (and via `User.locale` once
authenticated).

The technical approach is dictated by Constitution v1.1.1: Server Components by default,
Auth.js (NextAuth v5) catch-all OAuth handler, Prisma + PostgreSQL with database sessions,
layered route → service → repository for the project-owned `/api/i18n/locale`, lightweight
in-house i18n with JSON catalogs, Tailwind v4 tokens (no raw colors). Tests are written
**before** the implementation they cover (TDD — Principle V).

---

## Technical Context

**Language/Framework**: TypeScript 5 (strict) / Next.js 16.2.4 (App Router)
**Primary Dependencies**: React 19, Tailwind CSS v4, Auth.js v5 (`next-auth@5`), Prisma,
`@prisma/client`, `@auth/prisma-adapter`, `zod`
**Database**: PostgreSQL 15+ (Docker compose for dev / managed for staging+prod)
**Testing**: Vitest 4 (unit / integration) + Playwright 1.59 (E2E, chromium)
**State Management**: Local React state only (no global store — Constitution Principle II)
**API Style**: REST. Auth.js endpoints are library-managed via the catch-all
`app/api/auth/[...nextauth]/route.ts`; project endpoints (`/api/i18n/locale`) use thin route
handlers that delegate to services + repositories.
**Path alias**: `@/*` → `./*` (project root, as currently configured in `tsconfig.json`).
Imports therefore look like `@/src/lib/prisma`, `@/app/login/page`, `@/src/components/...`.
Decision rationale: the project hosts both the `app/` directory (Next.js routes) and
`src/` (services, repositories, components, lib); a single root-relative alias keeps both
reachable without adding a second alias.

---

## Constitution Compliance Check

*GATE: Must pass before implementation can begin. Each item maps to a principle in
`.momorph/constitution.md` (v1.1.1).*

- [x] **Principle I — Clean Code & Readable Structure**: file/folder layout below uses
      kebab-case for non-component modules and PascalCase for components; one responsibility
      per file; no dead code; lint-clean enforced.
- [x] **Principle II — Stack Best Practices**: Server Components by default; layered route →
      service → repository for `/api/i18n/locale`; no business logic in Auth.js catch-all
      (library-managed); strict TS with no `any`; Tailwind tokens only (no raw color/spacing
      literals); Prisma singleton; `prisma migrate dev` flow.
- [x] **Principle III — Platform-Appropriate UI Patterns**: responsive web, mobile-first
      (≥360 px); WCAG 2.1 AA (contrast, keyboard, focus, labels, landmarks per spec TR-005 +
      "Behavior at Different Viewports & Accessibility"); evidence-based navigation sourced
      from `SCREENFLOW.md` (Login → Homepage SAA `i87tDx10uM`; Login → Language overlay
      `hUyaaugye2`); `prefers-reduced-motion` respected.
- [x] **Principle IV — OWASP Secure Coding**: threat model captured below; spec TR-002 +
      TR-006 covered; database sessions for revocability (A07); typed env config (no
      `process.env` outside `src/lib/config.ts`); secrets server-only; rate limit on auth
      callback; security headers via `middleware.ts`.
- [x] **Principle V — Test-Driven Development**: every `FR-*` has at least one failing test
      written before its implementation; Auth.js callback rejection of tampered `state` is an
      explicit abuse-case test; coverage targets stated below.

**Threat model summary** *(Principle IV)*:

- **Trust boundaries**: browser ↔ Next.js server; server ↔ PostgreSQL; server ↔ Google OAuth.
- **Sensitive data handled**: Google OAuth client secret (server-only env), `id_token` /
  `access_token` / `refresh_token` (server-only, never logged or returned), `sessionToken`
  (opaque cookie), user email + name (PII, redacted in logs to `userId` only).
- **Abuse cases to test**:
  - Tampered or missing OAuth `state` on callback → MUST reject (Auth.js default) — A01/A07.
  - `saa_locale` cookie set to `'../../etc/passwd'` or any non-allowlisted string → MUST
    fall back to `vi-VN`, MAY clear the cookie (TR-006) — A03.
  - Open-redirect attempt via `?callbackUrl=https://evil.example` → Auth.js rejects
    cross-origin and replaces with default destination (TR-002) — A01/A10.
  - Sign-out then reuse old `sessionToken` → MUST be unauthenticated on next request
    (database session deletion) — A07.
  - Repeated bad callbacks from one IP → rate-limited (TR-002) — A07.

**Violations (if any)**:

| Principle | Violation | Justification | Alternative Rejected |
|-----------|-----------|---------------|---------------------|
| II — "Don't invent project-specific abstractions" | Hand-rolled lightweight i18n module instead of `next-intl` | Cookie-only locale switching (no URL routing — spec forbids) is awkward in `next-intl`; with 2 locales and ~10 keys the in-house module is ~50 lines. Re-evaluate at >50 catalog keys. | `next-intl` (custom routing config), `react-intl` (heavier, no cookie-mode helper). |

---

## Architecture Decisions

### Frontend Approach

- **Component Structure**: feature-based folders under `src/components/{feature}` —
  `src/components/login/*`, `src/components/header/*`, `src/components/footer/*`. Shared atoms
  (`Button`, `Spinner`) deferred until a second consumer needs them.
- **Server vs Client split**:
  - Server Components: `app/login/page.tsx` (FR-002 auth check), `LoginPage`, `Header`,
    `Logo`, `HeroSection`, `Footer`. They run server-side, read cookies/session, and ship no
    JS.
  - Client Components: `LoginButton` (calls `signIn('google')`, drives `oauthInProgress`),
    `LanguageSelector` (dropdown, keyboard nav, optimistic locale switch). Each starts with
    `'use client'`.
- **Styling Strategy**: Tailwind v4 utilities backed by CSS variables in `app/globals.css`.
  Tokens added when `query_section` data lands in Phase 2 (`--color-primary`,
  `--color-on-primary`, hero typography, spacing scale `--spacing-layout-*`). No raw color or
  pixel literals.
- **Data Fetching**: Server Components read the session via `auth()` and the locale via
  `cookies()` (Next's `next/headers`). Client Components do not fetch session — they pass
  state down as props.
- **Localization**: in-house lightweight module (`src/lib/i18n/index.ts`) with JSON catalogs
  per locale; `t(key, locale)` helper for Server Components; a small client store for
  Client Components that need post-mount switching. No URL routing.

### Backend Approach

- **API Design**: REST. `/api/auth/*` paths → Auth.js catch-all (library-managed).
  `/api/i18n/locale` → project-owned thin route handler delegating to `localeService` →
  `userRepository`.
- **Data Access**: Prisma. One singleton `PrismaClient` at `src/lib/prisma.ts`. Repositories
  are the only callers; services orchestrate; route handlers parse + delegate.
- **Validation**: `zod` schemas at the boundary — env vars, request bodies, cookie reads.
- **Auth**: Auth.js v5 with Google provider + `@auth/prisma-adapter` in **database session
  mode** (`session.strategy = "database"`). Config split into a factory at
  `src/lib/auth.config.ts` (testable) and an instantiation at `src/lib/auth.ts` that
  re-exports `auth`, `signIn`, `signOut`, `handlers`. The catch-all route file
  (`app/api/auth/[...nextauth]/route.ts`) is three lines: re-exports `GET`/`POST` from
  `handlers` AND sets `export const runtime = 'nodejs'` — required because the Prisma
  adapter does NOT run on Edge Runtime.
- **Logging**: Use Next.js's built-in `console.*` for now, structured via a thin wrapper
  `src/lib/logger.ts`. Request IDs are propagated via **Node `AsyncLocalStorage`** populated
  in `middleware.ts` (Phase 6) — every incoming request gets a UUID stored in the ALS
  context; logger reads it lazily. Until middleware lands (Phase 6), `logger` falls back to
  emitting `request_id="(unset)"` and the build still works. Never log access tokens,
  refresh tokens, ID tokens, authorization codes, or PII beyond `userId`. Pluggable to
  `pino` later.

### Integration Points

- **Existing Services**: none.
- **Shared Components**: none — this feature creates the first shared `Header`, `Footer`,
  `Logo`, `LanguageSelector` that downstream features will reuse.
- **API Contracts**: `/api/i18n/locale` shape will be ratified in `/momorph.apispecs`; the
  plan reserves the body schema as `{ "locale": "vi-VN" | "en-US" }`.

### Out-of-scope for this plan (explicit non-goals)

- **Deep-link return after sign-in** ("the original target SHOULD be honored as a post-login
  destination" — Edge Cases). Login itself does NOT generate or store this state. The
  responsibility lives on **protected routes**: when a protected page detects an
  unauthenticated visitor, it redirects to `/login?callbackUrl=<encoded current URL>`.
  Login only forwards that param into `signIn('google', { callbackUrl })`; Auth.js then
  validates same-origin (TR-002) and routes the user there after consent. Implementing
  the protected-route redirect logic is downstream work — not in any of this plan's phases.
- **Profile dropdown sign-out UI**. FR-014 is satisfied at the API level (Auth.js
  `signOut()` deletes the row); the UI surface that calls it lives on the authenticated
  pages whose specs have not been written yet. Plan exposes `signOut` from
  `src/lib/auth.ts` so any future consumer can wire it up.
- **Homepage SAA route content** (screenId `i87tDx10uM`). Plan replaces `app/page.tsx` with
  an auth-gated stub; the real Homepage SAA spec/plan/implementation is a separate feature.

---

## Project Structure

### Documentation (this feature)

```text
.momorph/specs/GzbNeVGJHz-login/
├── spec.md              # Feature specification (Ready for Plan)
├── plan.md              # This file
├── research.md          # Codebase research
├── tasks.md             # (next step — produced by /momorph.tasks)
└── design-style.md      # (deferred — fetched on demand at impl time via query_section)
```

### Source Code (affected areas)

```text
# Database
prisma/
├── schema.prisma                    # NEW — Auth.js adapter tables + User.locale extension
├── migrations/                      # NEW — generated by `prisma migrate dev`
└── seed.ts                          # NEW — idempotent seed (empty for now)

# Library (cross-cutting)
src/
├── lib/
│   ├── prisma.ts                    # NEW — singleton PrismaClient (globalThis cache)
│   ├── auth.config.ts               # NEW — buildAuthConfig({ providers }) factory; testable
│   ├── auth.ts                      # NEW — instantiates NextAuth(buildAuthConfig({...})); re-exports auth/signIn/signOut/handlers
│   ├── config.ts                    # NEW — typed env via zod (reads DATABASE_URL / DATABASE_URL_TEST / AUTH_*)
│   ├── logger.ts                    # NEW — thin wrapper, request-id aware, redacts tokens/PII
│   ├── cookies/
│   │   └── saa-locale.ts            # NEW — read/validate/write helpers + attribute constants
│   └── i18n/
│       ├── index.ts                 # NEW — t(key, locale), catalog loader, locale resolution
│       ├── catalogs/
│       │   ├── vi-VN.json           # NEW — seeded from design strings
│       │   └── en-US.json           # NEW — authored translations
│       └── types.ts                 # NEW — SupportedLocale union, allowlist constant

# Domain (services + repositories)
src/
├── repositories/
│   └── user-repository.ts           # NEW — Prisma boundary; updateLocale(userId, locale)
└── services/
    └── locale-service.ts            # NEW — setLocale(userId | null, locale) — auth-aware

# Types
src/
└── types/
    └── locale.ts                    # NEW — re-exports SupportedLocale; runtime allowlist

# UI components
src/
└── components/
    ├── login/
    │   ├── LoginPage.tsx            # NEW — Server Component; composes Header + HeroSection + Footer
    │   ├── HeroSection.tsx          # NEW — Server Component; container for B/B.1/B.2/C — renders
    │   │                            #        the localized title (B.2 "ROOT FURTHER" text), the two
    │   │                            #        description lines (B.2), the Key Visual artwork (B.1 —
    │   │                            #        as a CSS background-image OR a decorative <img alt="">),
    │   │                            #        the decorative key visual group (C — same treatment),
    │   │                            #        and slots in <LoginButton/> (B.3) below the copy.
    │   │                            #        Decorative images use next/image with empty alt="" + aria-hidden
    │   │                            #        (Constitution Principle II — use next/image).
    │   └── LoginButton.tsx          # NEW — Client; signIn('google', { callbackUrl }), oauthInProgress, oauthError
    ├── header/
    │   ├── Header.tsx               # NEW — Server Component; Logo + LanguageSelector
    │   ├── Logo.tsx                 # NEW — Server Component; non-interactive (FR-012); next/image with alt="Sun Annual Awards 2025" (or empty alt if logo is purely decorative — confirm at query_section)
    │   └── LanguageSelector.tsx     # NEW — Client; chip + flag (LOCALE_DISPLAY) + dropdown + keyboard nav
    └── footer/
        └── Footer.tsx               # NEW — Server Component; non-interactive, fixed (FR-013)

# Routes
app/
├── login/
│   ├── page.tsx                     # NEW — Server Component; auth() check → redirect or LoginPage
│   └── layout.tsx                   # NEW — wraps Login route with Header/Footer slots
├── api/
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts             # NEW — re-exports `GET`/`POST` from handlers; `export const runtime = 'nodejs'` (Prisma adapter requires Node, not Edge)
│   └── i18n/
│       └── locale/
│           └── route.ts             # NEW — thin: parse → localeService.setLocale → 204
├── page.tsx                         # MODIFIED — replace boilerplate with auth-gated redirect
├── layout.tsx                       # (no structural change; metadata may be updated later)
└── globals.css                      # MODIFIED — add tokens once query_section runs (Phase 2)

middleware.ts                        # NEW — security headers (CSP, HSTS, X-CTO, etc.) +
                                     #       rate limit on /api/auth/callback/*

# Configuration
.env.example                         # NEW — DATABASE_URL, DATABASE_URL_TEST, AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_TRUST_HOST, NODE_ENV
.env.local                           # (gitignored — populated by each developer)
docker-compose.yml                   # NEW (recommended) — local PostgreSQL 15 service for `npm run db:*`

# CI
.github/
└── workflows/
    └── ci.yml                       # NEW — three jobs: (1) lint+type, (2) unit (vitest run), (3) integration+e2e
                                     #       Job 3 uses mcr.microsoft.com/playwright:v1.59.x and a
                                     #       services.postgres ephemeral DB; sets DATABASE_URL_TEST

# Tests
tests/
├── global-setup.ts                            # Vitest globalSetup — runs `prisma migrate reset --force` on DATABASE_URL_TEST
├── fixtures/
│   └── users.ts                               # seed helpers (createTestUser, createTestSession, etc.)
├── unit/
│   ├── lib/
│   │   ├── cookies/saa-locale.test.ts        # validate / fallback / cookie-CLEAR on tamper
│   │   ├── i18n/index.test.ts                # t() + missing-key fallback to vi-VN
│   │   ├── i18n/parity.test.ts               # asserts vi-VN.json and en-US.json have identical key sets (Risk: catalog drift)
│   │   └── logger.test.ts                    # redacts access_token/refresh_token/id_token/PII (TR-002 / A09)
│   ├── repositories/user-repository.test.ts
│   ├── services/locale-service.test.ts
│   └── components/
│       ├── login/LoginButton.test.tsx
│       ├── login/HeroSection.test.tsx        # decorative-element ARIA + locale render
│       ├── footer/Footer.test.tsx            # FR-013 — fixed-position class / sticky behavior
│       └── header/LanguageSelector.test.tsx
├── integration/
│   ├── login/auth-redirect.test.ts           # FR-002 server-side redirect
│   ├── login/auth-callback.test.ts           # tampered state, missing state (abuse-case)
│   ├── login/auth-happy-path.test.ts         # buildAuthConfig({ Credentials stub }) → full sign-in flow without Google
│   ├── login/i18n-locale-route.test.ts       # POST /api/i18n/locale — auth + validation
│   ├── login/middleware-headers.test.ts      # security headers present on /login + /api/* (TR-002)
│   └── login/middleware-rate-limit.test.ts   # /api/auth/callback/* rate-limited (TR-002 — A07)
└── e2e/
    ├── login/sign-in.spec.ts                 # US1 happy path (with Google mocked at network layer)
    ├── login/sign-in-cancellation.spec.ts    # US1 — denied consent + browser-back from Google
    ├── login/authenticated-redirect.spec.ts  # US2
    ├── login/language-switch.spec.ts         # US3
    ├── login/hero-content.spec.ts            # US4
    └── login/footer-fixed.spec.ts            # FR-013 — footer stays in viewport across scroll positions
```

### Dependencies to Add

| Package | Type | Version intent | Purpose |
|---------|------|----------------|---------|
| `prisma` | devDependency | latest stable (5.x or 6.x) | Schema + migrations CLI |
| `@prisma/client` | dependency | matches `prisma` | Runtime client |
| `next-auth` | dependency | Pin to a concrete `5.x.y` after Phase 2 smoke build (`^5` is too wide — Auth.js v5 spans pre-GA betas; lockfile freezes the actual install regardless) | OAuth + session management |
| `@auth/prisma-adapter` | dependency | matches `next-auth` major | Maps Auth.js to Prisma |
| `zod` | dependency | latest | Boundary validation (env, request bodies, cookies) |

No frontend framework changes (already on Next 16 + React 19 + Tailwind v4).

---

## Implementation Strategy

> Follows TDD per Principle V: failing test → minimal implementation → refactor. Each phase
> has its own checkpoint.

### Phase 0: Prerequisites (out-of-band)

- [ ] **Google Cloud OAuth client** provisioned (Web application, with redirect URI
  `http://localhost:3000/api/auth/callback/google` for dev; staging/prod URIs added later).
- [ ] **PostgreSQL** running locally — `docker compose up db` or any local PG ≥ 15.
- [ ] **System libs for Playwright** installed once: `sudo npx playwright install-deps chromium`.
- [ ] **Constitution `TODO(TESTING_INSTALL)`** — already resolved in Constitution v1.1.1.
- [ ] Confirm with stakeholder: Login may ship before Homepage SAA (research Q1).

### Phase 1: Foundation

**Goal**: lay down DB, ORM, auth, env, i18n, cookie helpers — everything every user story
needs. Nothing user-facing.

> Order matters: every TS module that needs runtime configuration imports from
> `src/lib/config.ts`, which is therefore step 4 — before `prisma.ts` (step 5),
> `auth.config.ts` (step 8), and any other consumer. Steps 1–3 are file-only authoring or
> CLI commands that read `.env.local` directly via Prisma's own runtime, so they can run
> before `config.ts` exists.

1. **Environment scaffolding** *(must come first so the Prisma CLI in step 3 can read
   `DATABASE_URL` from `.env.local`)*:
   - Author `.env.example` with `DATABASE_URL`, `DATABASE_URL_TEST`, `AUTH_SECRET`,
     `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_TRUST_HOST`, `NODE_ENV` (placeholders
     only). Document `openssl rand -base64 32` for `AUTH_SECRET` in
     `docs/auth-setup.md` (Phase 6).
   - Each developer runs `cp .env.example .env.local` and populates real values
     (Phase 0 prereq).
2. **Add deps** (`prisma`, `@prisma/client`, `next-auth@5`, `@auth/prisma-adapter`, `zod`) +
   `prisma` scripts to `package.json`: `db:migrate` (`prisma migrate dev`),
   `db:generate` (`prisma generate`), `db:seed` (`tsx prisma/seed.ts`), `db:reset`
   (`prisma migrate reset --force`), `db:test:reset`
   (`DATABASE_URL=$DATABASE_URL_TEST prisma migrate reset --force`).
3. **Author `prisma/schema.prisma`** — Auth.js adapter contract (User, Account, Session,
   VerificationToken) + `User.locale String @default("vi-VN")`. Postgres datasource. Run
   `prisma migrate dev --name init_auth` → committed migration files. Requires
   `DATABASE_URL` set in step 1.
4. **`src/lib/config.ts`** *(must come before any TS module that reads runtime config)* —
   `zod` schema reading `process.env` once at module load; throws on missing required vars.
   The ONLY module that touches `process.env` directly (Constitution § Configuration).
   Reads `NODE_ENV`, `DATABASE_URL` (prod/dev), `DATABASE_URL_TEST` (test runs),
   `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_TRUST_HOST`. Exports a
   typed `config` object.
5. **`src/lib/prisma.ts`** — singleton `PrismaClient` with the `globalThis` HMR-safe
   pattern; reads `config.NODE_ENV` (NOT `process.env.NODE_ENV` directly). The
   `PrismaClient` constructor still reads `DATABASE_URL` from process env via Prisma's own
   runtime — that is acceptable because Prisma is library code outside our boundary.
6. **`src/lib/logger.ts`** — `info/warn/error` wrappers; reads request ID from a
   `requestContext` accessor backed by Node `AsyncLocalStorage` (populated by
   `middleware.ts` in Phase 6; falls back to `'(unset)'` until then). Redacts
   token-shaped strings (anything matching `/^ya29\./` for Google access tokens, JWT-shape
   `^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$`, and any property key in a
   blocklist: `access_token`, `refresh_token`, `id_token`, `code`, `state`, `password`).
   Per Principle IV — A09.
7. **`src/types/locale.ts`** + **`src/lib/i18n/types.ts`** —
   `SupportedLocale = 'vi-VN' | 'en-US'`, `SUPPORTED_LOCALES` allowlist constant,
   `isSupportedLocale(value: unknown): value is SupportedLocale` type guard, and
   `LOCALE_DISPLAY: Record<SupportedLocale, { chip: string; flagAsset: string }>`
   mapping each locale to its chip code (`'VN'` / `'US'`) and flag asset path (e.g.,
   `/assets/header/icons/flag-vn.svg`). Single source of truth for FR-007's chip + flag
   rendering and FR-008's default.
8. **`src/lib/auth.config.ts` + `src/lib/auth.ts`** — split for testability:
   - `auth.config.ts` exports `buildAuthConfig({ providers })` returning a NextAuth
     config object with: `adapter: PrismaAdapter(prisma)`,
     `session: { strategy: 'database', maxAge: 60*60*24*30 }`, `secret: config.AUTH_SECRET`,
     `trustHost: config.AUTH_TRUST_HOST`, and the following enumerated callbacks for
     logging:
     - `events.signIn` → `logger.info('auth.signin', { userId, isNewUser })`
     - `events.signOut` → `logger.info('auth.signout', { userId })`
     - `events.linkAccount` → `logger.info('auth.linkAccount', { userId, provider })`
     - `events.createUser` → `logger.info('auth.createUser', { userId })`
     - `callbacks.signIn` → returns `true` for valid Google profiles; logs failures.
     - `callbacks.session` → enriches the session object with `User.locale` so Server
       Components don't need a second DB read.
   - `auth.ts` instantiates `NextAuth(buildAuthConfig({ providers: [Google({...})] }))`
     and re-exports `auth`, `signIn`, `signOut`, `handlers`. Tests call `buildAuthConfig`
     with a stub provider list, side-stepping module-load mocking fragility.
9. **`src/lib/i18n/catalogs/vi-VN.json`** — seeded from spec strings (title `ROOT FURTHER`,
   2 hero descriptions, `loginButton.label`, `loginButton.errorGeneric`,
   `loginButton.errorCookies`, `loginButton.errorCancelled`).
   `en-US.json` — authored translations of the same keys.
10. **`src/lib/i18n/index.ts`** — `t(key: string, locale: SupportedLocale): string`; falls
    back to `vi-VN` if key missing in target locale (logged as a warning via `logger`).
11. **`src/lib/cookies/saa-locale.ts`** — `getSaaLocale()` (read via `cookies()` from
    `next/headers`; validate against allowlist; return `vi-VN` if missing/invalid),
    `setSaaLocale(locale, response)` with attributes per spec API table (`Path=/`,
    `SameSite=Lax`, `Max-Age` 1 year, `Secure` when `config.NODE_ENV === 'production'`),
    `clearSaaLocale(response)`.
12. **Test infrastructure** —
    - `tests/global-setup.ts` (Vitest globalSetup): runs
      `DATABASE_URL=$DATABASE_URL_TEST prisma migrate reset --force` before the suite,
      ensuring the test DB schema matches `schema.prisma` and starts empty.
    - `tests/fixtures/users.ts`: seed helpers for inserting deterministic User/Account/Session
      rows.
    - Wire `globalSetup` into `vitest.config.ts`.
13. **Tests written FIRST** for: i18n fallback, locale-cookie validation (allowlist
    hit/miss/tamper, **including assertion that `clearSaaLocale()` is invoked when an
    invalid cookie is read** — Edge Case "Tampered `saa_locale` cookie"),
    config-schema rejection of missing `AUTH_SECRET`, `isSupportedLocale` type guard,
    `LOCALE_DISPLAY` exhaustive over `SupportedLocale`, `logger` redaction of
    token-shaped payloads (against the regex blocklist above).

**Checkpoint**: `npm run test` green; `prisma migrate dev` produces a working DB; no UI yet.

### Phase 2: User Story 1 (P1) — Sign in with Google 🎯 MVP

**Goal**: an unauthenticated visitor can click LOGIN With Google, complete the OAuth flow,
and land on `/` with a valid session.

**Independent Test**: E2E happy path — clean session → click → mocked Google approves →
redirect to `/`; assertion that the **URL is `/`**, the `Session` cookie is present, and a
matching `Session` row exists in the DB. Note: `app/page.tsx` content is the create-next-app
boilerplate during Phase 2 (replaced in Phase 3); the E2E does NOT assert page content,
only URL + session state. This intermediate state is acceptable.

1. **`app/api/auth/[...nextauth]/route.ts`** — three lines: re-export `GET`/`POST` from
   `handlers` AND `export const runtime = 'nodejs'`. The Node runtime declaration is
   load-bearing: the Prisma adapter cannot run on Edge Runtime. Confirm via a smoke build
   (`npm run build`) before component work starts (Risk #1 mitigation).
2. **Pre-impl tests**: integration tests for Auth.js handler reachability + abuse-case
   (tampered state → 403/redirect).
3. **`app/login/layout.tsx`** + **`app/login/page.tsx`** (Server) — calls `auth()`; if
   session, `redirect('/')`; else renders `LoginPage`.
4. **Component scaffolding** — `LoginPage`, `Header`, `Logo`, `Footer`, `HeroSection`,
   `LoginButton`. Implement non-interactive shells first (Server Components with placeholder
   layout). `LanguageSelector` ships in a static, non-interactive form in this phase
   (chip-only) and gains interactivity in Phase 4.
5. **Asset + style fetch** — at this point the implementer MUST run `query_section` against
   the design (per the spec's Out of Scope) for: B.3 button (idle/hover/disabled/loading),
   A.2 chip, hero typography, footer style; and `get_media_files` for: SAA logo, Vietnam
   flag SVG, USA flag SVG, Google G icon, hero key visual, decorative artwork. Tokens added
   to `app/globals.css`.
6. **`LoginButton`** (`'use client'`) — `useTransition` + `signIn('google', { callbackUrl })`;
   `callbackUrl` is read from the search-params (validated by Auth.js as same-origin per
   TR-002) or defaults to `/`. Manages `oauthInProgress` + `oauthError`; sets
   `aria-busy="true"` + `aria-disabled="true"` while pending; resets state on `pagehide`
   (Edge Cases: cancelled OAuth tab); ignores click if `oauthInProgress` (Edge Cases:
   multiple rapid clicks). Surfaces error copy keyed by failure reason
   (`loginButton.errorCancelled`, `loginButton.errorCookies`, `loginButton.errorGeneric`).
7. **Pre-impl tests**: `LoginButton.test.tsx` — disabled while pending, error state shown
   for each failure reason, no-op on duplicate click, focus restored to button on cancel
   (TR-005); integration test asserting `signIn` is invoked with `'google'` and a
   same-origin `callbackUrl`. Add an offline-simulation case (`navigator.onLine = false`)
   to cover the "No network at OAuth init" Edge Case — surfaces `errorGeneric`.
8. **E2E** — `tests/e2e/login/sign-in.spec.ts` uses Playwright's `page.route()` to intercept
   `https://accounts.google.com/o/oauth2/v2/auth*` and simulate three outcomes (one spec
   each): consent granted → callback succeeds → land on `/`; user denies consent →
   callback returns `error=access_denied` → land on `/login` with `errorCancelled`;
   browser back from Google → land on `/login` with `oauthInProgress` cleared.

**Checkpoint**: US1 acceptance scenarios 1–4 pass; abuse-case state-tampering test passes;
sign-in flow ships behind `/login`.

### Phase 3: User Story 2 (P1) — Authenticated visitor redirect

**Goal**: an already-authenticated user hitting `/login` is redirected to `/` server-side
before any Login markup is sent.

**Independent Test**: E2E — pre-seed a `Session` row + cookie → navigate to `/login` →
assert `302` (or that no Login markup ever rendered) and final URL is `/`.

1. **Tests first** — `tests/integration/login/auth-redirect.test.ts` (calls the page's
   server function with a mocked `auth()` returning a session; expects `redirect()`).
2. **Implementation** — extend `app/login/page.tsx` (already has the auth check from
   Phase 2) to ensure the session-not-found error path renders Login as unauthenticated and
   logs the failure (Edge Case: stale/revoked session, FR-002 DB-down resilience).
3. **`app/page.tsx`** — replace boilerplate with: `auth()` → if session, render Homepage SAA
   placeholder; else `redirect('/login')`. This closes the loop so the post-OAuth redirect
   has somewhere to land.
4. **Sign-out wiring** — add `signOut()` server-action to `src/lib/auth.ts` exports; not
   exposed in any UI in this phase, just available for future profile-dropdown screens.
5. **E2E** — `tests/e2e/login/authenticated-redirect.spec.ts`.

**Checkpoint**: US2 acceptance scenarios pass; no Login flicker for authenticated users
(verified via response status + no Login HTML in body).

### Phase 4: User Story 3 (P2) — Switch UI language

**Goal**: clicking A.2 opens a dropdown; selecting a locale persists it (cookie for
unauthenticated, `User.locale` + cookie mirror for authenticated) and re-renders visible copy
without a full reload.

**Independent Test**: E2E — set cookie to `vi-VN` → load Login → confirm Vietnamese title →
open dropdown → pick `US` (en-US) → confirm English title without page navigation.

1. **`/api/i18n/locale` route handler** + service + repository.
   - Pre-impl tests: `i18n-locale-route.test.ts` — unauth user → 401; auth user with valid
     locale → 204 + cookie set + DB updated; auth user with invalid locale → 400 (zod
     rejection).
   - `localeService.setLocale(userId, locale)` — uses `userRepository.updateLocale`.
   - Repository test uses a real Prisma test database (no mock — Constitution Principle V
     bias toward integration tests for DB).
2. **`LanguageSelector`** (`'use client'`) — full disclosure pattern: button toggles
   `aria-expanded`; menu items as `role="menuitem"`; arrow-key navigation; focus trap; click
   outside / `Escape` closes.
   - Optimistic update: client locale state swaps immediately; cookie write fires; for
     authenticated users, POST to `/api/i18n/locale` runs in the background; on failure,
     revert + non-blocking toast.
3. **Server-side locale plumbing** — `app/login/page.tsx` reads `getSaaLocale()` and passes
   to `HeroSection`; `Header` similarly receives the active locale and renders chip + flag.
4. **Tests** — `LanguageSelector.test.tsx` (keyboard nav, focus trap, ARIA roles,
   click-outside behavior); `i18n/index.test.ts` extended for fallback + parameterization.
5. **E2E** — `tests/e2e/login/language-switch.spec.ts`.

**Checkpoint**: US3 acceptance scenarios pass; SC-004 (≤200 ms switch on median device)
verifiable; the optimistic-update + revert path is tested.

### Phase 5: User Story 4 (P3) — Read program introduction

**Goal**: hero copy renders for the active locale and is non-interactive.

**Independent Test**: E2E — assert that for `vi-VN` and `en-US` the title and 2 description
lines appear, and that clicking/hovering on them yields no state change.

1. Implementation is largely complete after Phases 2 + 4 (the `HeroSection` + catalog cover
   it). Remaining work below.
2. **Test** — `tests/e2e/login/hero-content.spec.ts`: render check both locales; assert
   `user-select: none` on the heading + description container (or absence of selection
   affordance); assert the text nodes are inside semantic elements (`<h1>` + `<p>`) and
   have no `role` overrides.
3. **Decorative-element semantics** — `Logo` (A.1), Key Visual artwork (B.1), decorative
   group (C): verify they are exposed to assistive tech as decorative (`aria-hidden="true"`
   on background `<div>`s, empty `alt=""` on `<img>` elements) per the spec's accessibility
   behaviors. Add a Vitest snapshot or DOM assertion in `tests/unit/components/login/HeroSection.test.tsx`.

**Checkpoint**: All four user stories complete and independently testable.

### Phase 6: Polish & Cross-Cutting

- **Error boundaries** — `app/login/error.tsx` for unhandled exceptions; falls back to a
  static "Something went wrong" page in the active locale.
- **`middleware.ts`** — three responsibilities, all tested:
  - Generate a UUID `request_id` per request and store it in `AsyncLocalStorage` so
    `src/lib/logger.ts` can read it.
  - Set security headers (CSP, HSTS, `X-Content-Type-Options: nosniff`,
    `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`) on
    `/login` + `/api/*` — verified by `tests/integration/login/middleware-headers.test.ts`.
  - **Rate limit** on `/api/auth/callback/*` (token-bucket per IP via an in-memory store for
    dev; Redis or upstream WAF in prod — flagged as a follow-up). Verified by
    `tests/integration/login/middleware-rate-limit.test.ts` — sends N+1 requests to
    `/api/auth/callback/google` from the same IP and asserts the (N+1)th returns 429.
- **Lighthouse audit** on `/login` for a11y ≥95 (SC-005). Fix flagged issues.
- **Logging policy enforcement** — grep for `console.*` outside `src/lib/logger.ts`;
  replace. Verified by `tests/unit/lib/logger.test.ts` asserting that token-shaped
  payloads are redacted before output.
- **SC-001 measurement** — instrument the `signIn` callback in `src/lib/auth.ts` to log a
  duration metric (`request_id`, `provider=google`, `duration_ms` from B.3 click to session
  creation). Wire to the project's logging output (currently `console`; pluggable to a
  metrics backend later). Add a synthetic check to the E2E suite that asserts the redirect
  arrives within a generous threshold (e.g., 5 s in CI to absorb latency); the 3 s target is
  measured on production traffic, not in tests.
- **Documentation** — `docs/auth-setup.md` (Google Cloud client provisioning steps,
  including `openssl rand -base64 32` for `AUTH_SECRET`) + README updates pointing to the
  spec + `docs/local-dev.md` covering `docker compose up db` workflow.

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Auth.js v5 + Next.js 16 incompatibility surfaces in handler types | Med | High | Smoke-test the catch-all FIRST in Phase 2, before component work. Fall back to `next-auth@4` only if v5 truly broken. |
| Auth.js / Prisma adapter cannot run on Edge Runtime; default deployment may pick Edge | Med | High | `export const runtime = 'nodejs'` on the catch-all route file (Phase 2 step 1). Same export on `app/login/page.tsx` if it imports `auth()` and any Edge-incompatible module pulls in. Verified by `npm run build` succeeding with no Edge warnings. |
| Database session lookup latency on every request | Low | Med | Each `auth()` call hits the `Session` table; Auth.js does NOT auto-cache. For Login (low traffic, one `auth()` call per render) this is fine. For authenticated routes that may call `auth()` multiple times per render, wrap in React `cache()` or pass the session via props. Re-evaluate when authenticated routes ship. |
| Playwright system libs missing in CI | High | Med (CI gate) | Use `mcr.microsoft.com/playwright:v1.59.x` image or run `playwright install-deps` step in the pipeline. |
| Locale catalog drift (English keys missing) | Med | Low | i18n module logs a warning on missing key + falls back to `vi-VN`; CI script (Phase 6) lints catalog parity. |
| Open-redirect attack via `callbackUrl` query param | Low | High | Auth.js's same-origin enforcement (TR-002); add an explicit test asserting it (abuse-case). |
| Google OAuth client misconfiguration | Med | High (blocks all of Phase 2 E2E) | Documented in `docs/auth-setup.md`; `.env.example` carries placeholders; CI uses test-double for Google rather than real client. |

### Estimated Complexity

- **Frontend**: Medium (six new components, accessible dropdown, optimistic updates)
- **Backend**: Medium (Auth.js + Prisma + adapter + one custom endpoint)
- **Testing**: Medium-High (TDD across unit / integration / E2E, with Google network mocking)

---

## Integration Testing Strategy

### Test Scope

- [x] **Component/Module interactions**: `LoginPage` → `Header` + `HeroSection` + `Footer`;
      `Header` → `LanguageSelector`; client/server boundary correctness.
- [x] **External dependencies**: Google OAuth (mocked at the network layer in E2E via
      Playwright `page.route()`; replaced with a Credentials stub provider via
      `buildAuthConfig` in integration tests; abuse-case tests invoke the catch-all
      handler directly with malformed callback URLs and need no mock); PostgreSQL (real
      test DB).
- [x] **Data layer**: User + Account + Session table CRUD via Prisma in integration tests.
- [x] **User workflows**: sign-in, redirect, sign-out (via API), language switch.

### Test Categories

| Category | Applicable? | Key Scenarios |
|----------|-------------|---------------|
| UI ↔ Logic | Yes | LoginButton state transitions; LanguageSelector keyboard nav; HeroSection localized render. |
| Service ↔ Service | Yes | `localeService` ↔ `userRepository`; Auth.js callbacks ↔ adapter writes. |
| App ↔ External API | Yes | Google OAuth (mocked); `signIn`/`signOut` round-trip. |
| App ↔ Data Layer | Yes | Prisma CRUD on User + Session; tampered-cookie behavior. |
| Cross-platform | Partial | Responsive ≥360 px verified by E2E with `page.setViewportSize`; iOS/Android tested via the iOS Login frame `8HGlvYGJWq` only when that surface is implemented. |

### Test Environment

- **Environment type**: local (`vitest run`, `playwright test`); CI uses Playwright Docker image.
- **Test data strategy**: integration + E2E tests use a **dedicated test database**
  (`DATABASE_URL_TEST`); the test runner runs `prisma migrate reset --force` before each
  suite to guarantee a known schema and empty state. Per-test fixtures (e.g., a seeded
  `User` row) are inserted via Prisma at the top of the test using a small
  `tests/fixtures/users.ts` helper; cleanup between tests in the same file uses
  `prisma.$transaction([prisma.session.deleteMany(), prisma.account.deleteMany(),
  prisma.user.deleteMany()])`.
- **Isolation approach** *(important — this differs from the naive transaction-rollback
  pattern)*: do NOT wrap tests in Prisma transactions, because the Auth.js Prisma adapter
  creates its own client calls outside any test-owned transaction. Instead rely on:
  (a) `migrate reset` between suites, and (b) explicit `deleteMany` cascade between tests
  within a suite. E2E tests run sequentially against a fresh DB.

### Mocking Strategy

| Dependency Type | Strategy | Rationale |
|-----------------|----------|-----------|
| Google OAuth (E2E) | Playwright `page.route()` interception of `accounts.google.com/o/oauth2/v2/auth*` and `oauth2.googleapis.com/token` | Avoids real Google calls; deterministic test runs; no real client secret in CI. |
| Auth.js handler — abuse-case tests (e.g., tampered `state`) | Invoke the catch-all handler directly with a hand-crafted callback URL whose `state` cookie does NOT match the URL `state` param | Auth.js rejects the mismatch BEFORE any token-endpoint call, so no Google network mock is needed. |
| Auth.js handler — happy-path integration | Use `buildAuthConfig({ providers: [Credentials({...})] })` from `src/lib/auth.config.ts` to construct a TEST instance of NextAuth with a stub Credentials provider that returns a deterministic profile | Sidesteps the module-load-time `vi.mock` problem; exercises the same adapter + session-storage code paths as production. |
| `auth()` helper in Server Components / API route handlers (e.g., `auth-redirect.test.ts`, `i18n-locale-route.test.ts`) | `vi.mock('@/src/lib/auth', () => ({ auth: vi.fn().mockResolvedValue(testSession) }))` at the top of the test file | Server-side session reads are easy to control once `@/src/lib/auth` is the single import surface. |
| PostgreSQL | **Real** dedicated test DB | Constitution Principle V bias — integration tests must hit a real DB to catch migration drift. |
| `next/headers` (`cookies()`, `headers()`) — unit tests | `vi.mock('next/headers', () => ({ cookies: () => ({ get: ... , set: ... , delete: ... }), headers: () => new Headers(...) }))` per test file | The Next.js dev runtime is not available outside `next dev` / `next test` contexts. Unit tests for `saa-locale.ts` and locale-aware components mock the API to inject deterministic cookie state; assertions check `set`/`delete` was called with the expected attributes. |
| `next/headers` — integration tests run via Next's test runner | Real | Integration tests for route handlers run inside Next's request lifecycle, so `cookies()` returns the actual request store. |

### Test Scenarios Outline

1. **Happy Path**
   - [x] Unauthenticated user → click LOGIN → mocked Google approves → land on `/` with
         session.
   - [x] Authenticated user → visit `/login` → server-redirect to `/`.
   - [x] User in `vi-VN` → open A.2 → pick `US` → hero re-renders English without
         navigation.

2. **Error Handling**
   - [x] Tampered OAuth `state` → callback rejects.
   - [x] Tampered `saa_locale` cookie → fallback to `vi-VN` + cookie cleared.
   - [x] DB outage during FR-002 check → render Login as unauthenticated, log; do NOT 5xx.
   - [x] OAuth provider error / user denies consent → land on Login with error message and
         button reset.

3. **Edge Cases**
   - [x] No network at OAuth init (`navigator.onLine = false` simulation) → button
         re-enables, generic error shown.
   - [x] Cookies disabled → recoverable error message; button re-enables.
   - [x] Multiple rapid clicks on B.3 → only one redirect committed.
   - [x] Cross-tab logout → next request re-validated server-side; redirect to Login.
   - [x] Single-locale allowlist (forward-looking) → selector still renders consistently.
   - [x] Tampered `state` on OAuth callback → handler rejects (abuse case).
   - [x] Open-redirect attempt via `?callbackUrl=https://evil.example` → Auth.js rejects
         and falls back to default destination (abuse case — TR-002).

### Tooling & Framework

- **Test framework**: Vitest 4 (unit + integration), Playwright 1.59 (E2E).
- **Supporting tools**: `@testing-library/react`, `@testing-library/user-event`,
  `prisma migrate reset`, Playwright network interception.
- **CI integration**: GitHub Actions (or equivalent) — three parallel jobs: lint+type, unit,
  integration+E2E (the latter against an ephemeral PG container). Pre-baked Playwright image
  used for the E2E job.

### Coverage Goals

| Area | Target | Priority |
|------|--------|----------|
| Auth flow (US1 + US2) | ≥95 % statement / branch | High (security-critical) |
| Locale flow (US3) — `localeService`, `userRepository`, route handler, `saa-locale` cookie, `LanguageSelector` | ≥90 % | High (TR-006 boundary) |
| `LoginButton` interactive states | ≥85 % | Medium |
| Security middleware (headers + rate limit) | ≥90 % | High (TR-002 surface) |
| Logger redaction | 100 % of redaction branches | High (TR-002 / A09) |
| Static composition (LoginPage, HeroSection, Header, Footer, Logo) | smoke-rendered only | Low |

---

## Dependencies & Prerequisites

### Required Before Start

- [x] `.momorph/constitution.md` reviewed and understood (v1.1.1)
- [x] `.momorph/specs/GzbNeVGJHz-login/spec.md` approved by stakeholders (Status: Ready
      for Plan)
- [x] `.momorph/specs/GzbNeVGJHz-login/research.md` completed
- [ ] API contract for `/api/i18n/locale` ratified via `/momorph.apispecs` *(can run in
      parallel with Phase 1; gate is before Phase 4)*
- [x] Database design — Prisma schema + Auth.js adapter contract (covered by this plan)
- [ ] Google Cloud OAuth client provisioned (Phase 0 prereq)
- [ ] Local PostgreSQL available (Phase 0 prereq)
- [ ] Playwright system libs installed (`sudo npx playwright install-deps chromium`)

### External Dependencies

- Google OAuth 2.0 (authorization endpoint + token endpoint + userinfo).
- PostgreSQL 15+.

---

## Next Steps

After plan approval:

1. **Run** `/momorph.apispecs` to ratify `/api/i18n/locale` request/response shapes (parallel
   with Phase 1).
2. **Run** `/momorph.tasks` to generate the executable task breakdown.
3. **Begin** implementation following the task order, with the foundation (Phase 1) before
   any user-story work.

---

## Notes

- This plan establishes the project's first conventions for Server/Client component split,
  layered route handlers, repository pattern, cookie helpers, and localization. Downstream
  features will follow these patterns; deviating requires either a constitution amendment or
  a justified Violations row in the dependent plan.
- The plan deliberately keeps `/api/i18n/locale` simple (one column update) to make it a
  clean reference implementation of the layered route → service → repository pattern. Future,
  more complex endpoints will inherit its shape (validation at the boundary, no business
  logic in the handler, repository owns Prisma).
- Two MoMorph deliverables remain deferred and DO NOT block this plan: `design-style.md`
  (fetched on demand at Phase 2 implementation start) and `BACKEND_API_TESTCASES.md`
  (`/momorph.apispecs` produces it for `/api/i18n/locale`).
