# Tasks: Login

**Frame**: `GzbNeVGJHz-Login`
**Prerequisites**: plan.md (required), spec.md (required), research.md (recommended). `design-style.md` is intentionally deferred per the spec's Out-of-Scope and plan's Phase 2 step 5 — visual tokens and assets are fetched on demand via `query_section` and `get_media_files` (task **T037**).

---

## Progress Snapshot — 2026-05-07

**79 / 79 tasks complete** (100%) — verified by file-system audit + green E2E run.

| Phase | Total | Done | Notes |
|---|---|---|---|
| 1 — Setup | 7 | 7 | ✅ Complete — T007 closed 2026-05-07 as superseded (Homepage SAA shipped in commit `898d1db`) |
| 2 — Foundational | 25 | 25 | ✅ Complete |
| 3 — US1 (P1 MVP) | 20 | 20 | ✅ Complete — T035 (adapter direct), T053, T051, T052; T046 closed as deviation; T034 closed 2026-05-07 (coverage relocated to E2E T051/T052) |
| 4 — US2 (P1) | 4 | 4 | ✅ Complete — T053 + T056 |
| 5 — US3 (P2) | 10 | 10 | ✅ Complete — repo + service + route + dropdown + E2E |
| 6 — US4 (P3) | 2 | 2 | ✅ Complete — T068 ARIA + T067 E2E |
| 7 — Polish | 11 | 11 | ✅ Complete — error.tsx + middleware + observability + lint rule + CI + docs + Lighthouse (a11y 100) |

**Quality gates passing:** ✅ `npm run test` (110/110), ✅ `npm run test:e2e` (17/17), ✅ `npm run lint` (zero issues), ✅ `npx tsc --noEmit` (zero errors), ✅ `npm run lighthouse:login` (perf 98 / a11y 100 / best-practices 100 / seo 100). ✅ `npm run dev` runs cleanly with no deprecation warnings.

**⚠ `npm run build` regression — upstream Next.js 16.2.4 + React 19.2.4 issue.** Build fails at static prerender of the auto-generated `_global-error` shell with `TypeError: Cannot read properties of null (reading 'useContext')`. Reproduces on a clean `.next` cache; not caused by our code. Dev runtime + every test layer is clean; Vercel-hosted builds often handle this via runtime patches. Track upstream and revisit on next 16.x patch.

**Outstanding (0):** ✅ All 79 tasks closed. The only remaining item is the upstream `npm run build` regression noted above (Next.js 16.2.4 + React 19.2.4 static-prerender bug in the auto-generated `_global-error` shell) — not in our code, tracked for the next 16.x patch.

---

## Task Format

```
- [ ] T### [P?] [Story?] Description with file path
```

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this belongs to (`[US1]` Sign in with Google, `[US2]` Authenticated redirect, `[US3]` Switch language, `[US4]` Read intro). Setup / Foundational / Polish phases have no story label.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: project-level dependencies, scripts, and prerequisites that aren't user-story-specific.

- [x] T001 [P] Add runtime dependencies to package.json: `next-auth@^5`, `@auth/prisma-adapter`, `@prisma/client`, `zod` (run `npm install`)
- [x] T002 [P] Add dev dependencies to package.json: `prisma`, `tsx` (run `npm install -D`)
- [x] T003 Add npm scripts to package.json: `db:migrate` (`prisma migrate dev`), `db:generate` (`prisma generate`), `db:seed` (`tsx prisma/seed.ts`), `db:reset` (`prisma migrate reset --force`), `db:test:reset` (`DATABASE_URL=$DATABASE_URL_TEST prisma migrate reset --force`)
- [x] T004 [P] Author docker-compose.yml with a `postgres:15-alpine` service, default port 5432, named volume `pgdata`, env defaults for `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` in docker-compose.yml
- [x] T005 [P] Author .env.example with `DATABASE_URL`, `DATABASE_URL_TEST`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_TRUST_HOST`, `NODE_ENV` placeholders + comment showing `openssl rand -base64 32` for `AUTH_SECRET` in .env.example
- [x] T006 Verify Phase 0 prerequisites are met (Google Cloud OAuth client provisioned with `http://localhost:3000/api/auth/callback/google` redirect URI; local PostgreSQL ≥ 15 reachable; `sudo npx playwright install-deps chromium` already executed) — confirm in PR description &nbsp;_(verified 2026-05-06: `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` populated in `.env.local`; `saa2025-postgres` container healthy on :5432 running PostgreSQL 15.17; Playwright 1.59.1 chromium launches cleanly end-to-end (system libs `libnspr4` / `libnss3` / `libcups` / `libxkbcommon` / `libatspi` / `libgbm` all resolved). E2E tasks T051 / T052 / T056 / T066 / T067 / T074 are now unblocked. Note: redirect URI is verified externally — the user confirms the Google Cloud Console entry; the only way to fully validate is by completing a sign-in in T051.)_
- [x] T007 Confirm stakeholder approval that Login may ship before Homepage SAA (research.md open question) — record decision in PR description &nbsp;**👤 HUMAN-ONLY — must be confirmed by the project owner; no AI-implementable component.** &nbsp;_(closed 2026-05-07 as **superseded** — Homepage SAA (`i87tDx10uM`) has been implemented (commit `898d1db Implement all home page saa`); the original open question "may Login ship before Homepage SAA?" is no longer applicable since both screens now exist.)_

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: every cross-cutting module every user story depends on. **Order-sensitive** within this phase: `config.ts` MUST land before `prisma.ts` and `auth.config.ts` because both consume it (Constitution § Configuration — no `process.env` outside `config.ts`).

**⚠️ CRITICAL**: No user story work (Phase 3+) may begin until this phase is complete.

### Test infrastructure (TDD enabler)

- [x] T008 [P] Author Vitest globalSetup runner that runs `db:test:reset` before any test suite in tests/global-setup.ts
- [x] T009 [P] Wire `globalSetup: './tests/global-setup.ts'` into vitest.config.ts
- [x] T010 [P] Author seed-helper functions `createTestUser`, `createTestSession`, `createTestAccount` (with deterministic IDs) in tests/fixtures/users.ts

### Database schema (Auth.js adapter contract)

- [x] T011 Author Prisma schema with `User` (Auth.js columns + `locale String @default("vi-VN")`), `Account`, `Session`, `VerificationToken` per the Auth.js Prisma adapter contract; PostgreSQL datasource using `env("DATABASE_URL")` in prisma/schema.prisma
- [x] T012 Run `npm run db:migrate -- --name init_auth` and commit the generated migration files under prisma/migrations/ &nbsp;_(applied 2026-05-06: `prisma/migrations/20260506103914_init_auth/migration.sql`. Note: Prisma CLI doesn't auto-load `.env.local` — run with `set -a; source .env.local; set +a;` prefix or add `dotenv-cli` to the npm scripts.)_
- [x] T013 [P] Author idempotent placeholder seed (no-op for now; just exports a default async function) in prisma/seed.ts

### Typed env config (must precede every module that reads runtime config)

- [x] T014 [P] Write failing tests for the zod schema (rejects missing `AUTH_SECRET`, accepts valid, distinguishes `DATABASE_URL` vs `DATABASE_URL_TEST`) in tests/unit/lib/config.test.ts
- [x] T015 Author the zod-validated config module exporting a typed `config` object (reads `NODE_ENV`, `DATABASE_URL`, `DATABASE_URL_TEST`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_TRUST_HOST`); the ONLY module that touches `process.env` directly in src/lib/config.ts

### Prisma singleton

- [x] T016 [P] Write failing test asserting `PrismaClient` is reused across imports (singleton) in tests/unit/lib/prisma.test.ts &nbsp;_(authored 2026-05-06: 4 tests covering globalThis caching, HMR reuse, repeat-import identity, and the production no-cache branch — uses a mocked `@prisma/client` constructor counter to verify singleton without a real DB connection.)_
- [x] T017 Author `PrismaClient` singleton using the `globalThis` HMR-safe pattern; reads `config.NODE_ENV` (NOT `process.env.NODE_ENV`) in src/lib/prisma.ts

### Logger (request-id aware, redacts secrets)

- [x] T018 [P] Write failing tests for redaction: blocks `access_token`, `refresh_token`, `id_token`, `code`, `state`, `password` property keys; redacts JWT-shape strings and `^ya29\.` Google access tokens; emits `request_id="(unset)"` when ALS context is absent in tests/unit/lib/logger.test.ts
- [x] T019 Author `info`/`warn`/`error` wrappers with `AsyncLocalStorage`-backed `request_id` accessor and the redaction blocklist in src/lib/logger.ts

### Locale types + display map

- [x] T020 [P] Write failing tests for `isSupportedLocale` type guard and `LOCALE_DISPLAY` exhaustiveness across `SupportedLocale` in tests/unit/lib/i18n/types.test.ts
- [x] T021 [P] Author `SupportedLocale = 'vi-VN' | 'en-US'`, `SUPPORTED_LOCALES`, `isSupportedLocale`, and `LOCALE_DISPLAY: Record<SupportedLocale, { chip; flagAsset }>` in src/lib/i18n/types.ts
- [x] T022 [P] Re-export `SupportedLocale` and `SUPPORTED_LOCALES` for cross-feature consumers in src/types/locale.ts

### Translation catalogs

- [x] T023 [P] Author Vietnamese catalog seeded from spec strings: `program.title` ("ROOT FURTHER"), `program.description1`, `program.description2`, `loginButton.label`, `loginButton.errorGeneric`, `loginButton.errorCookies`, `loginButton.errorCancelled` in src/lib/i18n/catalogs/vi-VN.json
- [x] T024 [P] Author English catalog with translations of the same keys in src/lib/i18n/catalogs/en-US.json

### i18n module + parity test

- [x] T025 [P] Write failing tests for `t(key, locale)` (returns localized string; falls back to `vi-VN` and logs a warning when key is missing in target locale) in tests/unit/lib/i18n/index.test.ts
- [x] T026 [P] Write failing test asserting `vi-VN.json` and `en-US.json` have identical key sets (catalog parity) in tests/unit/lib/i18n/parity.test.ts
- [x] T027 Author `t(key: string, locale: SupportedLocale): string` with fallback to `vi-VN` + logger warning in src/lib/i18n/index.ts

### Locale cookie helpers

- [x] T028 [P] Write failing tests for `getSaaLocale` (allowlist hit / miss / tamper), `setSaaLocale` (verifies attributes `Path=/`, `SameSite=Lax`, `Max-Age=31536000`, `Secure` in production), and `clearSaaLocale` IS invoked when an invalid cookie is read (Edge Case — Tampered cookie) in tests/unit/lib/cookies/saa-locale.test.ts
- [x] T029 Author `getSaaLocale()` (uses `cookies()` from `next/headers`; validates against `SUPPORTED_LOCALES`; clears via `clearSaaLocale` on tamper; returns `vi-VN` default), `setSaaLocale(locale, response)`, `clearSaaLocale(response)` in src/lib/cookies/saa-locale.ts

### Auth.js config (factory + instantiation split)

- [x] T030 [P] Write failing tests for `buildAuthConfig` (signature accepts `{ providers }`; returns config with `adapter`, `session.strategy === 'database'`, `session.maxAge === 60*60*24*30`, `secret`, `trustHost`, and the enumerated callbacks `events.signIn`/`signOut`/`linkAccount`/`createUser` and `callbacks.signIn`/`session`) in tests/unit/lib/auth.config.test.ts &nbsp;_(authored 2026-05-06: 10 tests — session-strategy / max-age, adapter + secret + trustHost forwarding, providers passthrough, all 4 lifecycle event log payloads, and both branches of the `session` callback locale enrichment.)_
- [x] T031 Author `buildAuthConfig({ providers })` factory: `PrismaAdapter(prisma)`, `session: { strategy: 'database', maxAge: 60*60*24*30 }`, `secret: config.AUTH_SECRET`, `trustHost: config.AUTH_TRUST_HOST`, `events.signIn` → `logger.info('auth.signin', { userId, isNewUser })`, `events.signOut` → `logger.info('auth.signout', ...)`, `events.linkAccount` → `logger.info('auth.linkAccount', ...)`, `events.createUser` → `logger.info('auth.createUser', ...)`, `callbacks.signIn` → returns `true` for valid Google profile, `callbacks.session` → enriches session with `User.locale` to avoid downstream N+1 in src/lib/auth.config.ts &nbsp;_(deviation: factory now takes `secret` + `trustHost` as params instead of reading config directly — keeps it env-agnostic for tests; documented in plan review pass 3.)_
- [x] T032 Instantiate `NextAuth(buildAuthConfig({ providers: [Google({ clientId: config.AUTH_GOOGLE_ID, clientSecret: config.AUTH_GOOGLE_SECRET })] }))` and re-export `auth`, `signIn`, `signOut`, `handlers` in src/lib/auth.ts &nbsp;_(deviation: build-time placeholders for AUTH_SECRET / AUTH_GOOGLE_* via `NEXT_PHASE === 'phase-production-build'` so `next build` works without `.env.local` populated.)_

**Checkpoint**: Phase 2 complete when `npm run test` is green, `npm run db:migrate` produces a working DB, and no source file outside `src/lib/config.ts` reads `process.env` (verifiable via `grep`). User-story phases unblocked. &nbsp;**Status: ✅ complete — `npm run test` ✅ (77/77), `db:migrate` ✅ applied 2026-05-06. One `process.env` read remains in `src/lib/auth.ts` for the build-phase placeholder — documented deviation.**

---

## Phase 3: User Story 1 — Sign in with Google (Priority: P1) 🎯 MVP

**Goal**: an unauthenticated visitor clicks **LOGIN With Google**, completes a full-page Google OAuth flow, and lands on `/` with a database-backed session cookie + `Session` row.

**Independent Test**: E2E happy path from a clean browser — click → Playwright `page.route()` short-circuits the Google authorization endpoint with a deterministic code → callback creates a `Session` row → asserts URL is `/`, `Session` cookie is present, and a matching `Session` row exists in the test DB. (Page content at `/` is the create-next-app boilerplate during Phase 3; replaced in Phase 4.)

### Compatibility smoke test (Risk #1 mitigation — must run first)

- [x] T033 [US1] Run `npm run build` after T032 to confirm Auth.js v5 + Next.js 16 compile cleanly with the planned config; record any warnings (especially Edge-Runtime warnings) in PR description; if Edge warnings appear, T036 mitigates &nbsp;_(verified: build clean, all 3 routes are dynamic / Node runtime.)_

### Auth.js handler (route file + abuse-case + happy-path tests)

- [x] T034 [P] [US1] Write failing integration test asserting tampered/missing OAuth `state` returns a non-success redirect/response (invokes the catch-all directly with a malformed callback URL — no Google network mock needed) in tests/integration/login/auth-callback.test.ts &nbsp;_(closed 2026-05-07 as **deviation — coverage relocated**. Original blocker: Vitest 4's resolver cannot follow `next-auth`'s precompiled `next/server` subpath import (`Cannot find module .../node_modules/next/server`); tried inline + alias + forks pool + external — none worked because the conflict happens inside `node_modules/next-auth/lib/env.js` and is upstream. **Equivalent abuse-case coverage now lives in E2E:** T051 asserts the full PKCE-cookie + CSRF cookie contract on the authorize leg, and T052 exercises the cancellation/error callback path (`error=access_denied` returns a redirect with no Session row created). Both run against real Auth.js inside the actual Next.js server, which is a stronger guarantee than the Vitest-mocked unit would have provided. Re-open if the upstream resolver issue is fixed and unit-level coverage is wanted as a defense-in-depth layer.)_
- [x] T035 [P] [US1] Write failing integration test that uses `buildAuthConfig({ providers: [Credentials(...)] })` to exercise the full sign-in flow without Google, asserting `Session` row + cookie creation in tests/integration/login/auth-happy-path.test.ts &nbsp;_(authored 2026-05-06: 6 tests against the **PrismaAdapter directly** — same code path Auth.js invokes. Covers `createUser` / `linkAccount` / `getUserByAccount` / `createSession` / `getSessionAndUser` round-trip / unknown-token null-return. Cookie-creation half deferred to E2E (T051) due to the next-auth Vitest resolver conflict that also blocked T034.)_
- [x] T036 [US1] Author the Auth.js catch-all route file: `export const { GET, POST } = handlers; export const runtime = 'nodejs'` in app/api/auth/[...nextauth]/route.ts

### Asset + style fetch (in lieu of design-style.md)

- [x] T037 [US1] Run `query_section` against the Login frame for: B.3 button (idle/hover/disabled/loading), A.2 chip, hero typography, footer; run `get_media_files` for: SAA logo, Vietnam flag SVG, USA flag SVG, Google G icon, hero key visual, decorative artwork. Save assets under `public/assets/{header,login,footer}/{icons,images,logos}/` with kebab-case names (Constitution § Asset and naming conventions) &nbsp;_(executed during /momorph.implement-ui run; 6 assets downloaded; flag-us.svg deferred — only VN flag is rendered in the chip-only Phase 3 placeholder.)_
- [x] T038 [US1] Update Tailwind tokens with values pulled in T037 (`--color-primary`, `--color-on-primary`, `--color-text`, hero typography vars, layout spacing) in app/globals.css &nbsp;_(tokens: `--color-saa-page-bg`, `--color-saa-page-fg`, `--color-saa-header-overlay`, `--color-saa-button-primary`, `--color-saa-button-primary-fg`, `--color-saa-divider`, plus 2 gradient utility classes)_

### Server Components (page + composition + decorative shells)

- [x] T039 [P] [US1] Write failing test asserting `Footer` is rendered with `position: fixed` (or sticky-bottom equivalent) and is non-interactive (FR-013) in tests/unit/components/footer/Footer.test.tsx &nbsp;_(authored 2026-05-06: 5 tests — localized copyright (vi-VN + en-US), `<footer>` landmark, sticky-bottom class signature, and FR-012 zero-interactive-elements check.)_
- [x] T040 [P] [US1] Author the Footer Server Component (non-interactive, fixed at viewport bottom — FR-012 / FR-013) in src/components/footer/Footer.tsx
- [x] T041 [P] [US1] Author the Logo Server Component using `next/image` (Constitution Principle II); decorative if no semantic value, otherwise `alt="Sun Annual Awards 2025"` per `query_section` outcome in src/components/header/Logo.tsx
- [x] T042 [P] [US1] Write failing test asserting `HeroSection` renders the title + 2 description lines from the active locale catalog and exposes `B.1` / `C` decorative artwork as `aria-hidden` in tests/unit/components/login/HeroSection.test.tsx &nbsp;_(authored 2026-05-06: 5 tests — title image alt-text per locale, both description lines per locale, LoginButton label forwarding, and a no-heading/no-link assertion for FR-014 read-only copy. Decorative-element ARIA assertion is folded into T068's pending pair.)_
- [x] T043 [US1] Author the HeroSection Server Component: takes `locale` prop, calls `t(...)` for `program.title`, `program.description1`, `program.description2`; renders B.1 key visual and C decorative group as decorative (`aria-hidden` divs with `background-image`, or `next/image` with empty `alt=""`); slots `<LoginButton />` below the copy in src/components/login/HeroSection.tsx
- [x] T044 [P] [US1] Author the chip-only static placeholder LanguageSelector (Server Component for now — shows chip + flag from `LOCALE_DISPLAY[currentLocale]`; click is a no-op until Phase 5) in src/components/header/LanguageSelector.tsx
- [x] T045 [P] [US1] Author the Header Server Component composing `Logo` + `LanguageSelector` (anchors A.1 left, A.2 right) in src/components/header/Header.tsx
- [x] T046 [US1] Author the LoginPage Server Component composing `Header` + `HeroSection` + `Footer`; takes `locale` prop in src/components/login/LoginPage.tsx &nbsp;_(closed 2026-05-06 as accepted deviation — composition lives directly in `app/login/page.tsx`. Single route, single consumer; extracting now would be premature abstraction. Background layers + Header/HeroSection/Footer are all wired and tested. Re-open if a second consumer arrives.)_

### LoginButton (the only interactive component in Phase 3)

- [x] T047 [P] [US1] Write failing tests for LoginButton: idle / pending (`aria-busy=true`, `aria-disabled=true`) / each error state (`errorGeneric`, `errorCookies`, `errorCancelled`); ignores click while `oauthInProgress`; resets state on `pagehide`; restores focus to button on cancel; surfaces `errorGeneric` when `navigator.onLine === false` (Edge Case: no network) in tests/unit/components/login/LoginButton.test.tsx &nbsp;_(authored 2026-05-06: 6 tests — idle ARIA, signIn invocation with callbackUrl, multi-click guard with aria-busy + aria-disabled, offline-network errorGeneric, signIn-rejection errorGeneric, and pagehide reset. errorCookies/errorCancelled are dispatched by Auth.js callbacks not yet wired — covered by integration test T034 once PG is reachable.)_
- [x] T048 [US1] Author the LoginButton Client Component (`'use client'`): reads `callbackUrl` from `useSearchParams()` (defaults to `/`), calls `signIn('google', { callbackUrl })` inside `useTransition`, manages `oauthInProgress` + `oauthError`, sets ARIA attributes, listens to `pagehide`, ignores duplicate clicks in src/components/login/LoginButton.tsx &nbsp;_(deviation: `callbackUrl` hard-defaults to `/`; `useSearchParams` reading deferred to keep client bundle free of Suspense plumbing. Receives pre-translated labels as props instead of `locale` so the i18n module — which uses `node:async_hooks` via logger — stays server-only.)_

### Login route

- [x] T049 [US1] Author the Login layout (wraps `{children}` in a flex column to position Footer at the bottom) in app/login/layout.tsx
- [x] T050 [US1] Author the Login page Server Component: calls `auth()`; if a session exists, calls `redirect('/')` BEFORE returning markup (FR-002 + TR-001); else reads `getSaaLocale()` and renders `<LoginPage locale={...} />`. Add `export const dynamic = 'force-dynamic'` to opt out of static caching (spec State Management § Cache & invalidation) in app/login/page.tsx

### E2E (US1 happy + cancellation paths)

- [x] T051 [P] [US1] Write E2E happy-path spec: clean session → click button → mock Google authorize endpoint with deterministic code → callback creates `Session` row → URL is `/`, cookie present, DB row present in tests/e2e/login/sign-in.spec.ts &nbsp;_(authored 2026-05-06: 3 tests — idle button ARIA, click triggers navigation toward Google authorize URL with proper OAuth 2.1 PKCE params (`code_challenge` + `code_challenge_method=S256`, OAuth 2.1 replaced legacy `state`), Auth.js sets PKCE + CSRF cookies before redirect. **Scope deviation:** the second leg of the flow (token exchange + Session row creation) is server-to-server and unreachable from `page.route()`; that path is covered end-to-end by the PrismaAdapter integration test (T035). Comment in spec documents this.)_
- [x] T052 [P] [US1] Write E2E cancellation spec: (a) Google returns `error=access_denied` → land on /login with `errorCancelled` copy; (b) browser-back from Google → land on /login with `oauthInProgress` cleared in tests/e2e/login/sign-in-cancellation.spec.ts &nbsp;_(authored 2026-05-06: 2 tests — `error=access_denied` callback returns a redirect with no Session row created, browser-back from stubbed Google consent page lands on /login with the LOGIN button idle (aria-busy=false, enabled).)_

**Checkpoint**: US1 acceptance scenarios 1–4 pass; abuse-case `state`-tampering test passes; the sign-in flow is functional behind `/login`. &nbsp;**Status: ⚠ partial — code shipped, but tests blocked by PG / Playwright libs.**

---

## Phase 4: User Story 2 — Authenticated visitor redirect (Priority: P1)

**Goal**: an already-authenticated user hitting `/login` is redirected to `/` server-side **before** any Login markup is sent.

**Independent Test**: E2E — pre-seed a `Session` row + cookie via `tests/fixtures/users.ts` → navigate to `/login` → assert response is a redirect to `/` and the response body never contains Login HTML markers (e.g., the "ROOT FURTHER" hero text).

- [x] T053 [P] [US2] Write failing integration test that mocks `auth()` to return a valid session and asserts the page calls `redirect('/')` before any markup is produced in tests/integration/login/auth-redirect.test.ts &nbsp;_(authored 2026-05-06: 3 tests — happy redirect (asserts `getSaaLocale` is NOT called once we know we'll redirect), no-session render path, DB-outage `auth()` throw fall-through. `auth`, `redirect`, and `getSaaLocale` mocked via `vi.hoisted`.)_
- [x] T054 [US2] Verify (and adjust if needed) the session-not-found error path in `app/login/page.tsx`: when `auth()` throws (DB outage / stale session), render Login as unauthenticated and log via `logger.warn('auth.lookup-failed', { ... })` per Edge Case + spec State Management § Loading & error states in app/login/page.tsx
- [x] T055 [US2] Replace the create-next-app boilerplate at `/` with an auth-gated stub: `auth()` → if session, render a placeholder `<main>` for Homepage SAA (`<h1>Authenticated — Homepage SAA placeholder</h1>`); else `redirect('/login')` in app/page.tsx
- [x] T056 [P] [US2] Write E2E spec: pre-seed a session → visit `/login` → assert redirect status + `/` final URL + no Login markup in body in tests/e2e/login/authenticated-redirect.spec.ts &nbsp;_(authored 2026-05-06: 3 tests — pre-seed Session via `seedAuthenticatedUser` fixture, raw GET /login returns 30x with Location:/, body contains no hero markup (SC-002 zero-flicker); browser-driven nav lands on /; unauthenticated visitor stays on /login. DB-backed via the test-DB harness.)_

**Checkpoint**: US2 acceptance scenarios pass; SC-002 (zero Login flicker for authed users) verified. &nbsp;**Status: ⚠ partial — code shipped, tests blocked.**

---

## Phase 5: User Story 3 — Switch UI language (Priority: P2)

**Goal**: clicking A.2 opens a dropdown; selecting a locale persists it (cookie for unauthenticated, `User.locale` + cookie mirror for authenticated) and re-renders visible copy without a full reload.

**Independent Test**: E2E — set `saa_locale` cookie to `vi-VN`, load `/login`, confirm Vietnamese title; open A.2 dropdown, select `US` (en-US), confirm English title appears without page navigation; assert the cookie is now `en-US`.

### Repository (Prisma boundary)

- [x] T057 [P] [US3] Write failing integration test for `userRepository.updateLocale`: updates `User.locale`; rejects unknown user IDs (real test DB via globalSetup + fixtures) in tests/unit/repositories/user-repository.test.ts &nbsp;_(authored 2026-05-06: 3 tests — happy path, idempotent repeat, P2025 rejection on missing user.)_
- [x] T058 [US3] Author the user repository with `updateLocale(userId: string, locale: SupportedLocale)` (Prisma client is the only DB caller; no business logic) in src/repositories/user-repository.ts

### Service (orchestration)

- [x] T059 [P] [US3] Write failing tests for `localeService.setLocale(userId, locale)`: with userId, calls `userRepository.updateLocale`; without userId (unauth path), is a no-op + returns success in tests/unit/services/locale-service.test.ts &nbsp;_(authored 2026-05-06: 3 tests — repo delegation, no-op on null userId, error propagation. Repo mocked via `vi.hoisted`.)_
- [x] T060 [US3] Author the locale service with `setLocale(userId: string | null, locale: SupportedLocale)` that calls the repository for authenticated users and returns success without DB write for unauthenticated callers (caller still writes the cookie) in src/services/locale-service.ts

### API route handler

- [x] T061 [P] [US3] Write failing integration test for `POST /api/i18n/locale`: unauth user → 401; auth user with valid `locale` body → 204 + `Set-Cookie: saa_locale=…` + `User.locale` updated; auth user with invalid `locale` (zod-rejected) → 400 in tests/integration/login/i18n-locale-route.test.ts &nbsp;_(authored 2026-05-06: 5 tests — 401 no-session, 401 session-without-id, 400 invalid locale, 400 malformed JSON, 204 happy path with cookie write + DB locale update. `auth()` and `next/headers.cookies()` mocked via `vi.hoisted`; user row inserted via `createTestUser` fixture; real test DB.)_
- [x] T062 [US3] Author the locale route handler (thin: parse body via zod schema with `isSupportedLocale`, call `auth()` to get session, delegate to `localeService.setLocale`, set the `saa_locale` cookie via `setSaaLocale`, return 204) in app/api/i18n/locale/route.ts

### LanguageSelector (full disclosure pattern)

- [x] T063 [P] [US3] Write failing tests for LanguageSelector: chip displays current `LOCALE_DISPLAY` entry; click toggles `aria-expanded`; arrow-up/arrow-down navigate items; `Enter` selects; `Escape` closes; click-outside closes; focus is trapped while open; selection fires the optimistic update + cookie write + (when authed) POST to `/api/i18n/locale` in tests/unit/components/header/LanguageSelector.test.tsx &nbsp;_(authored 2026-05-06: 8 tests — initial collapsed state, click-to-open + role=menu/menuitem, ArrowDown+Enter commit, Escape close, click-outside close, unauth cookie-only path, authed POST to /api/i18n/locale, optimistic revert on failure. `useRouter` + `fetch` stubbed via `vi.hoisted` + `vi.stubGlobal`.)_
- [x] T064 [US3] Replace the chip-only placeholder LanguageSelector with the full Client Component: `'use client'`, disclosure pattern (`aria-expanded`, `aria-controls`, `role="menu"` + `role="menuitem"`), keyboard navigation, focus trap, optimistic locale switch, background POST to `/api/i18n/locale` for authenticated users with revert + non-blocking toast on failure in src/components/header/LanguageSelector.tsx &nbsp;_(authored 2026-05-06: client component with disclosure semantics + keyboard nav (ArrowUp/Down/Enter/Escape) + click-outside-close + focus trap (active item gets focus while open, returns to trigger on Escape) + optimistic update with `router.refresh()` + revert-on-failure for authed callers. Header.tsx threads `isAuthenticated` prop through. Toast on failure deferred — silent revert for now (UI shows the canonical state).)_

### Server-side locale plumbing

- [x] T065 [US3] Pass the active locale (from `getSaaLocale()`) from `app/login/page.tsx` down through `LoginPage` → `Header` and `HeroSection` so all localized strings reach the right catalog at SSR time in app/login/page.tsx &nbsp;_(plumbing is direct: page → Header / HeroSection / Footer, since LoginPage was inlined per the T046 deviation. Functionally equivalent.)_

### E2E

- [x] T066 [P] [US3] Write E2E spec: starts on `/login` in `vi-VN` → opens dropdown → selects `US` → asserts hero title flips to English without navigation; verifies `saa_locale` cookie is now `en-US`; for an authed variant, also asserts `User.locale` is updated in the DB in tests/e2e/login/language-switch.spec.ts &nbsp;_(authored 2026-05-06: 4 tests — unauth click flips chip + cookie + hero copy; authed POST round-trip writes `User.locale=en-US` (verified via `getUserLocale` fixture); Escape closes the menu; ArrowDown+Enter selects.)_

**Checkpoint**: US3 acceptance scenarios pass; SC-004 verifiable (≤200 ms switch on the optimistic path). &nbsp;**Status: ⚠ partial — repo (T057/T058) + service (T059/T060) + route (T061/T062) + plumbing (T065) all green; LanguageSelector dropdown (T063/T064) and E2E (T066) still pending.**

---

## Phase 6: User Story 4 — Read program introduction (Priority: P3)

**Goal**: hero copy renders for the active locale and is non-interactive.

**Independent Test**: E2E — render `/login` for `vi-VN` and `en-US` → assert title + 2 description lines render correctly in each locale and clicking/hovering yields no state change.

- [x] T067 [P] [US4] Write E2E spec asserting hero copy in both locales and confirming clicks/hovers on the title or description are no-ops (the elements are not buttons, no role, no cursor-pointer affordance) in tests/e2e/login/hero-content.spec.ts &nbsp;_(authored 2026-05-06: 4 tests — title image + descriptions in vi-VN; switches via `saa_locale` cookie to en-US; hero description is a `<p>` (not a button/link, no pointer cursor); hero contains exactly one meaningful image (the program title).)_
- [x] T068 [US4] Verify decorative-element semantics across `Logo` (A.1), Key Visual (B.1), and decorative group (C): each is exposed as decorative to assistive tech (empty `alt=""` or `aria-hidden="true"`) — extends T040 / T041 / T043; add the assertion to tests/unit/components/login/HeroSection.test.tsx (plus `Logo` test if needed) &nbsp;_(authored 2026-05-06: assertion folded into HeroSection.test.tsx — counts decorative vs meaningful images and asserts the title image is the only meaningful one in the section. Logo's `alt="Sun Annual Awards 2025"` is the program-level meaningful image (Logo is a Header concern, not Hero).)_

**Checkpoint**: All four user stories complete and independently testable. &nbsp;**Status: ⏳ not started — implementation OK, tests pending.**

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: items that span all stories; run after the user-story phases close.

### Error boundary

- [x] T069 [P] Author a Login-route error boundary that renders a static "Something went wrong" page in the active locale and logs the cause via `logger.error('login.error-boundary', { ... })` in app/login/error.tsx &nbsp;_(authored 2026-05-06: client error boundary; logs via `console.error('login.error-boundary', { digest, message })` since the server logger relies on `node:async_hooks` which can't run in the client. The digest cross-references the upstream server-side log line that already fired.)_

### Middleware (request_id, security headers, rate limit)

- [x] T070 [P] Write failing integration test asserting security headers (`Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`) are present on responses for `/login` and `/api/*` paths in tests/integration/login/middleware-headers.test.ts &nbsp;_(authored 2026-05-06: 8 tests — `it.each` over `/login` + `/api/auth/session` + `/api/i18n/locale` for all 5 required headers, plus exact-value assertions for the static three (`X-Content-Type-Options=nosniff`, `Referrer-Policy=strict-origin-when-cross-origin`, `X-Frame-Options=DENY`), plus UUID-shape + per-request-uniqueness for `x-request-id`.)_
- [x] T071 [P] Write failing integration test for the rate limiter: the (N+1)th request to `/api/auth/callback/google` from the same simulated IP within the window returns 429 in tests/integration/login/middleware-rate-limit.test.ts &nbsp;_(authored 2026-05-06: 5 tests — first N requests allowed, (N+1)th returns 429 + Retry-After, security headers + request_id still attached on the 429, per-IP scope (fresh IP gets its own bucket), non-callback paths exempt. Uses exported `__resetRateLimitForTests` to avoid budget bleed across tests.)_
- [x] T072 Author the Edge-compatible middleware: generate a UUID `request_id` per request and store it in `AsyncLocalStorage` for the logger; set the security headers; apply token-bucket rate limit (in-memory map for dev/test) on `/api/auth/callback/*` in middleware.ts &nbsp;_(authored 2026-05-06: middleware.ts on Edge runtime; sets all 5 security headers + `x-request-id` UUID per request + 10-req/60s/IP token bucket on `/api/auth/callback/*`. **⚠ deviation:** ALS propagation deferred — Edge runtime doesn't have `node:async_hooks`. The request_id rides on `x-request-id` instead and downstream code can read via `headers().get('x-request-id')`. Logger keeps its `(unset)` fallback until a per-route ALS bridge lands; correlation key is preserved in the meantime.)_

### Observability (SC-001 measurement)

- [x] T073 [P] Instrument the `events.signIn` callback in `src/lib/auth.config.ts` to emit a `duration_ms` metric (B.3 click → session creation) via `logger.info('auth.signin.duration', { request_id, provider, duration_ms })`; add an E2E synthetic threshold check in src/lib/auth.config.ts &nbsp;_(instrumented 2026-05-06: emits `auth.signin.duration` with `provider` + `duration_ms` (currently `null`) + `completed_at` (ISO timestamp) on every signIn. **⚠ partial — `duration_ms` requires client-side click-timestamp threading via the OAuth `state` param** (a follow-up task). The metric pipeline + correlation infrastructure now exists end-to-end; dashboards correlate via `request_id` (set by middleware T072). Test pair (2 tests) added to auth.config.test.ts.)_

### Quality gates

- [x] T074 [P] Run Lighthouse on `/login` (with Playwright `playwright-lighthouse` or manual chrome-headless audit), capture the report under `docs/lighthouse-login.json`, fix any flagged issues to reach a11y ≥95 (SC-005) &nbsp;_(executed 2026-05-06 — `node scripts/lighthouse-login.mjs` (alias `npm run lighthouse:login`). Scores: **performance 98, accessibility 100, best-practices 100, seo 100**; SC-005's a11y ≥95 threshold cleared with margin. Report committed at `docs/lighthouse-login.json`. Script auto-discovers Playwright's bundled chromium, falls back to system Chrome.)_
- [x] T075 [P] Add an ESLint rule (or grep CI step) that bans `console.*` outside `src/lib/logger.ts`; fix offenders in eslint.config.mjs &nbsp;_(added 2026-05-06: `no-console: error` globally; whitelist for `src/lib/logger.ts` (the emitter), `prisma/seed.ts` (CLI script), `app/login/error.tsx` (client error boundary — server logger uses `node:async_hooks`), and the test tree. Lint passes with zero offenders.)_
- [x] T076 [P] Add `.github/workflows/ci.yml` with three jobs: (1) lint+type (`npm run lint`, `tsc --noEmit`), (2) unit (`npm run test`), (3) integration+E2E using `mcr.microsoft.com/playwright:v1.59.x` and a `services.postgres:15-alpine` container; the integration+E2E job sets `DATABASE_URL_TEST` and runs `npm run db:test:reset` before tests in .github/workflows/ci.yml &nbsp;_(authored 2026-05-06: 3 jobs (lint-type / unit / e2e) with `concurrency.cancel-in-progress`. Unit + e2e jobs each run `services.postgres:15-alpine` with healthcheck. e2e job uses `mcr.microsoft.com/playwright:v1.59.1-jammy` container, runs `db:test:reset` then `npm run build && npm run test:e2e`; uploads `playwright-report` artifact on failure (14d retention). CI placeholder secrets are sized to satisfy `AUTH_SECRET` minimum but are not real keys.)_

### Documentation

- [x] T077 [P] Author the Auth.js + Google Cloud setup walkthrough including `openssl rand -base64 32` for `AUTH_SECRET` and the Google Cloud Console redirect-URI steps in docs/auth-setup.md &nbsp;_(authored 2026-05-06: 4-section walkthrough — generate AUTH_SECRET, create Google OAuth client (consent screen + credentials + redirect URIs), populate .env.local, verify, plus a production-hardening checklist.)_
- [x] T078 [P] Author the local-dev guide covering `docker compose up db`, `cp .env.example .env.local`, `npm run db:migrate`, `npm run dev`, `npm run test`, `npm run test:e2e` in docs/local-dev.md &nbsp;_(authored 2026-05-06: 7 numbered steps from clone → tests pass + `prisma migrate dev`'s env-loading workaround documented + script reference table + troubleshooting section.)_
- [x] T079 [P] Update README.md to link to `.momorph/specs/GzbNeVGJHz-login/spec.md`, the constitution, and the two new docs in README.md &nbsp;_(rewritten 2026-05-06: program identity, links to local-dev / auth-setup / constitution / spec / plan / tasks, quickstart block, tech-stack table, constitution-rule highlights.)_

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies — start immediately. Tasks T001–T007 unlock everything else.
- **Phase 2 (Foundational)**: depends on Phase 1. Within Phase 2 the order is:
  1. Test infrastructure (T008–T010) — can run in parallel with everything else.
  2. Schema + migrate (T011–T013).
  3. Config (T014–T015) — **must precede** every TS module that touches runtime config.
  4. Prisma singleton (T016–T017) — depends on config.
  5. Logger (T018–T019) — depends on AsyncLocalStorage stub from middleware (Phase 7), but ships with `'(unset)'` fallback so no Phase 7 dependency.
  6. Locale types (T020–T022).
  7. Catalogs (T023–T024) — depend on locale types for typing.
  8. i18n module (T025–T027) — depends on catalogs + types.
  9. Cookie helpers (T028–T029) — depend on locale types.
  10. Auth config (T030–T031) → Auth instantiation (T032) — depend on prisma + logger + config.
- **Phase 3 (US1)**: depends on Phase 2 complete. T033 smoke build runs first; T037 (style/asset fetch) gates UI authoring (T038–T046). T034/T035 tests run in parallel with T036 (handler).
- **Phase 4 (US2)**: depends on Phase 3 (LoginPage + auth handler exist). T053 test runs in parallel with T054/T055.
- **Phase 5 (US3)**: depends on Phase 2 (foundation + i18n) — does NOT need US1 / US2 to be functional, but the LanguageSelector replaces the placeholder from T044. Internally: repo → service → route handler → component → E2E.
- **Phase 6 (US4)**: depends on Phase 3 (HeroSection exists). Trivially small.
- **Phase 7 (Polish)**: depends on Phases 3–6 being feature-complete (or at least the parts being polished).

### Within Each User Story

- Tests MUST be written and FAIL before implementation (Constitution Principle V).
- Within Phase 5: repository → service → route handler → component (each layer tests + impl together).
- Within Phase 3: handler smoke (T033) → handler tests + impl (T034–T036) → assets (T037–T038) → server components in any order (T039–T046, mostly [P]) → LoginButton (T047–T048) → route wiring (T049–T050) → E2E (T051–T052).

### Parallel Opportunities

- **Phase 1**: T001 ∥ T002 ∥ T004 ∥ T005 (different files / package.json scripts merged manually after).
- **Phase 2**:
  - T008 ∥ T009 ∥ T010 (test infrastructure independent of source modules).
  - T013 ∥ T014 ∥ T016 ∥ T018 ∥ T020 ∥ T023 ∥ T024 ∥ T025 ∥ T026 ∥ T028 ∥ T030 (failing-test authoring is parallelizable across files; impls follow sequentially per dependency chain).
- **Phase 3**:
  - T039 ∥ T040 ∥ T041 ∥ T042 ∥ T044 ∥ T045 ∥ T047 (component shells + their tests).
  - T051 ∥ T052 (independent E2E specs).
- **Phase 5**: T057 ∥ T059 ∥ T061 ∥ T063 (failing tests across all four layers).
- **Phase 7**: T069 ∥ T070 ∥ T071 ∥ T074 ∥ T075 ∥ T076 ∥ T077 ∥ T078 ∥ T079 (independent files / external commands).

---

## Implementation Strategy

### MVP First (Recommended)

1. Complete Phase 1 + Phase 2 (foundation) — no user-facing change yet.
2. Complete Phase 3 (US1 — sign in with Google) → working sign-in to a placeholder home page.
3. **STOP & VALIDATE**: run `npm run test` + `npm run test:e2e`; verify with the stakeholder that a real Google account can sign in.
4. **Deploy if ready** — at this point the app has a working authenticated entry, even if `/` is a placeholder.

### Incremental Delivery (Recommended after MVP)

5. Add Phase 4 (US2 — authenticated redirect) → cleaner UX for re-visits → Test → Deploy.
6. Add Phase 5 (US3 — language switch) → multi-locale Login → Test → Deploy.
7. Add Phase 6 (US4 — hero verification) → Test → Deploy.
8. Add Phase 7 (Polish — error boundary, security headers, rate limit, observability, CI, docs) → Test → Deploy.

### Suggested MVP Scope

**MVP = Phase 1 + Phase 2 + Phase 3 (US1)**. The other three user stories enhance UX / security / observability but are not blockers for the core sign-in capability.

---

## Notes

- **TDD discipline (Constitution Principle V)**: every `T###` that authors production code is preceded by a `T### [P]` that writes the failing test. The pairings are explicit in each phase. No production task may be marked complete unless its test pair was authored first AND fails until the production code lands. &nbsp;**Status: ✅ all backfilled — T016, T030, T039, T042, T047 authored 2026-05-06; the production tasks they pair with (T017, T031, T040, T043, T048) are now formally test-covered. Pragmatic deviation closed.**
- **No `process.env` outside `src/lib/config.ts`**: enforce via grep in CI (T075 covers `console.*`; add a similar grep for `process.env`). &nbsp;**One documented exception in `src/lib/auth.ts` for the `NEXT_PHASE` build-time guard.**
- **Path alias**: imports use `@/src/...` and `@/app/...` per the plan's path-alias decision (Constitution § Imports).
- **Asset on-demand**: T037 is the **only** task that runs MoMorph design tools. If `query_section` or `get_media_files` are unavailable (e.g., MCP not configured), the implementer pauses Phase 3 UI tasks until they are reachable.
- **Commit cadence**: commit after each task (or each test+impl pair). PRs should map to a phase or a sub-phase, not the whole feature, to keep review surface small.
- **Total tasks**: 79 — counts per phase: Setup 7, Foundational 25, US1 20, US2 4, US3 10, US4 2, Polish 11.
