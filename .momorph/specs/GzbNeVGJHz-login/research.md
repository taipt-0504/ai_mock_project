# Research: Login

**Frame**: `GzbNeVGJHz-Login`
**Date**: 2026-05-06
**Spec**: `.momorph/specs/GzbNeVGJHz-login/spec.md`

---

## Purpose

Capture the (minimal) findings from a codebase analysis to inform the Login implementation
plan. This project is **greenfield** beyond the create-next-app skeleton, so most of the plan
work is establishing conventions rather than fitting into existing patterns.

---

## Codebase Analysis

### Existing Patterns Identified

The repository contains only the create-next-app skeleton plus the MoMorph spec/constitution
artifacts. **There are no existing services, repositories, components, hooks, or services to
leverage.** The plan therefore ratifies the conventions defined in
[.momorph/constitution.md](.momorph/constitution.md) (v1.1.1) by laying down their first
implementation:

#### Component Patterns

| Pattern | Location | Status |
|---------|----------|--------|
| Server Components by default | `app/**` | Constitutional default — establish in Phase 2 |
| Client components only when interactive | `src/components/**/*.tsx` with `'use client'` | New — establish in Phase 2 |

#### API Patterns

| Pattern | Location | Status |
|---------|----------|--------|
| Thin route handlers → service → repository | `app/api/**/route.ts` → `src/services/**` → `src/repositories/**` | Constitutional rule (Principle II) — first implementation in Phase 2 (`[...nextauth]`) and Phase 4 (`/api/i18n/locale`) |
| Auth.js catch-all | `app/api/auth/[...nextauth]/route.ts` | New — single route file owns all OAuth subpaths |

#### Testing Patterns

| Pattern | Location | Status |
|---------|----------|--------|
| Vitest + jsdom + RTL | `vitest.config.ts`, `tests/unit/**`, `tests/integration/**` | Installed; smoke test passes |
| Playwright (chromium) | `playwright.config.ts`, `tests/e2e/**` | Installed; smoke test in place; Linux system libs need `sudo npx playwright install-deps chromium` once per workstation |

### Existing Dependencies

| Package | Version | Role |
|---------|---------|------|
| `next` | 16.2.4 | Framework (App Router) |
| `react` / `react-dom` | 19.2.4 | UI |
| `tailwindcss` | ^4 | Styling |
| `eslint` / `eslint-config-next` | ^9 / 16.2.4 | Lint |
| `typescript` | ^5 | Strict mode (`tsconfig.json`) |
| `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/*` | (see `package.json`) | Unit/integration tests |
| `@playwright/test` | ^1.59.1 | E2E tests |

### Existing Files To Modify

| File | Change |
|------|--------|
| `app/page.tsx` | Replace boilerplate with auth-gated redirect (authed → `/home` placeholder; unauthed → `/login`). |
| `app/layout.tsx` | No structural change yet; metadata may be updated for SAA 2025 branding (deferred). |
| `app/globals.css` | Add tokens (`--color-primary`, etc.) when implementation reaches the UI styling step (Phase 2 / `query_section`); plan does NOT pre-pick colors. |

---

## Reusable Components / Hooks / Services

**None.** Every component, hook, and service required by Login is new and will become the first
example of its category in this codebase. The plan therefore doubles as a convention reference
for downstream features.

---

## Integration Points

### APIs to Connect

| URL path | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/auth/session` | GET | New (Auth.js default) | Served by the catch-all; prefer `auth()` helper server-side. |
| `/api/auth/signin/google` | GET / POST | New (Auth.js default) | Initiates full-page redirect to Google. |
| `/api/auth/callback/google` | GET | New (Auth.js default) | Code exchange + Session row creation + redirect. |
| `/api/auth/signout` | GET / POST | New (Auth.js default) | Deletes Session row + clears cookie. |
| `/api/i18n/locale` | POST | New (project route handler) | Authenticated locale persistence (`User.locale` + cookie mirror). |

### Database Entities (Prisma)

| Entity | Table | Status | Notes |
|--------|-------|--------|-------|
| `User` | `User` | New | Auth.js adapter columns + `locale String @default("vi-VN")`; `role` deferred. |
| `Account` | `Account` | New | Auth.js adapter contract verbatim. |
| `Session` | `Session` | New | Active (database-session strategy). |
| `VerificationToken` | `VerificationToken` | New | Adapter contract requires it; unused for OAuth-only Login. |

### External Services

| Service | Purpose | Integration Method |
|---------|---------|-------------------|
| Google OAuth (Cloud project) | Authentication | Auth.js Google provider; Web client ID + secret stored server-side. |
| PostgreSQL 15+ | Persistence | Prisma client; one instance per environment (dev = Docker compose, CI = managed test DB, prod = managed). |

---

## Potential Challenges

### Technical Challenges

| Challenge | Impact | Proposed Solution |
|-----------|--------|-------------------|
| **Auth.js v5 + Next.js 16 compatibility** — Auth.js v5 has been in beta for ~2 years; some integrations vary by minor version. | High (blocks Phase 2) | Pin `next-auth@5` minor; smoke-test the catch-all handler first; fall back to `next-auth@4` if v5 is incompatible (raises a violation flagged in Constitution Compliance because "hand-rolled OAuth code" is forbidden, but v4 is still Auth.js — acceptable). |
| **Database session lookup on every request** | Med | Auth.js's adapter does the lookup; Prisma connection pooling via `prisma generate` defaults handles concurrency. Login route is low-traffic (only unauthenticated traffic); not a hot path. Authenticated routes will benefit from connection-pool tuning later, out of scope here. |
| **Playwright system libs on Linux** | Med (CI gate) | Document `sudo npx playwright install-deps chromium` for local; CI uses a pre-baked image (e.g., `mcr.microsoft.com/playwright`). |
| **`prefers-color-scheme: dark`** in `globals.css` triggers an immediate dark-mode behavior the spec hasn't authored | Low | Remove or scope the dark-mode block until a design-style pass authors a dark variant; flagged in Phase 1. |
| **Locale cookie collision with Auth.js's CSRF/state cookies** | Low | Namespace prefix `saa_*` for our cookies; Auth.js uses `__Secure-` / `next-auth.*` prefixes. No collision. |
| **i18n library choice** | Med | Two options: (a) `next-intl` — the canonical Next.js i18n library, but its cookie-only mode (no URL routing) requires custom request-config; (b) hand-rolled lightweight catalog. With only 2 locales and ~10 keys, **(b)** is simpler and avoids URL routing the spec forbids. Revisit if catalog exceeds ~50 keys. |

### Integration Challenges

| Challenge | Impact | Proposed Solution |
|-----------|--------|-------------------|
| **Google OAuth client provisioning** is a manual prerequisite | High (blocks Phase 2 E2E) | Document required env vars + Google Cloud Console steps in `docs/auth-setup.md`; `.env.example` carries placeholders. |
| **No `design-style.md` yet** | Med | Implementation must call `query_section` and `get_media_files` for B.3 button styles, A.2 chip styles, hero typography, footer styles, plus assets (Google icon, Vietnam flag, USA flag, logo, hero artwork) at the start of Phase 2. Track as a hard prerequisite. |
| **No `BACKEND_API_TESTCASES.md` yet** | Med | The Auth.js endpoints are library-managed (no project test cases needed); only `/api/i18n/locale` needs concrete test cases — these can be drafted inline in Phase 4 or via `/momorph.apispecs` first. |

---

## Recommendations

### Architecture Recommendations

1. **Auth.js v5 (`next-auth@5`) with `@auth/prisma-adapter`, database-session strategy.** Single
   `src/lib/auth.ts` module exports `auth`, `signIn`, `signOut`, `handlers`. The catch-all
   route file is one line (`export const { GET, POST } = handlers`). Aligns with
   Constitution v1.1.1 § Technology Stack.
2. **One `PrismaClient` singleton** in `src/lib/prisma.ts`, exported with the
   `globalThis`-cache pattern Next.js HMR requires. Constitution Principle II rule.
3. **Lightweight in-house i18n** via JSON catalogs at `src/lib/i18n/catalogs/{locale}.json` and
   a typed `t(key, locale)` helper. No URL routing (the spec forbids it on locale switch).
4. **Cookie helpers in one place**: `src/lib/cookies/saa-locale.ts` (read + validate + write
   via `next/headers`). Centralizing cookie attributes (`Path`, `SameSite`, `Max-Age`,
   `Secure`) makes TR-006 easy to audit.
5. **Layered route → service → repository** for `/api/i18n/locale`. Even though the operation
   is small (one column update), establishing the layering on the first project endpoint sets
   the convention for everything that follows. Auth.js subpaths bypass this rule because the
   library owns them.
6. **Server Components for the Login page shell** (FR-002 redirect runs before any markup
   ships); two client components only — `LoginButton` and `LanguageSelector` — for the
   interactive parts.

### Implementation Recommendations

1. **Start with the foundation phase** (DB schema + singleton + auth config + i18n module +
   typed env). All four user stories depend on it; nothing ships without it.
2. **Leverage Auth.js defaults** for OAuth — don't reach into the request to read cookies, use
   `auth()`. Don't override the `state`/`nonce`/`code_verifier` flow (TR-002).
3. **Avoid premature global stores.** No Zustand/Redux/Context for session — Constitution
   Principle II — Stack Best Practices and the spec's State Management section both forbid it.

### Testing Recommendations

1. **Focus on**: the FR-002 redirect path (US2), the locale-cookie validation (TR-006), the
   sign-out → Session row deletion (TR-002), and the Auth.js callback rejecting tampered
   `state` (Principle IV — A01/A07).
2. **Mock**: Google OAuth provider in unit + integration tests (Auth.js's `Credentials`
   provider can be wired in for tests, or use `vi.mock` on `next-auth/providers/google`). For
   E2E, mock the upstream Google call at the network layer (Playwright's
   `page.route('**://accounts.google.com/**', ...)`) so the test never leaves the test
   harness.
3. **E2E scenarios**: (a) unauthenticated visitor → click LOGIN → land on Homepage placeholder;
   (b) authenticated visitor → / login redirects before render; (c) language switch updates
   visible copy without navigation; (d) sign-out → Login.

---

## Files to Review Before Implementation

### Must Read

- [x] `.momorph/constitution.md` — Principles I–V (especially II / IV / V)
- [x] `.momorph/specs/GzbNeVGJHz-login/spec.md` — Ready for Plan
- [x] `.momorph/contexts/SCREENFLOW.md` — Login section
- [x] `.momorph/guidelines/frontend.md` — Tailwind tokens + URL/navigation rules
- [x] `.momorph/guidelines/backend.md` — Layered architecture + Next.js conventions
- [x] `.momorph/guidelines/db_guidelines/PrismaORM_guideline.md` — Prisma conventions

### Recommended

- [ ] Auth.js v5 docs — Google provider + Prisma adapter + database sessions
- [ ] Next.js 16 App Router docs — Server Components, `redirect()`, middleware, `auth()`
- [ ] `prisma/schema.prisma` reference for the Auth.js adapter contract

---

## Open Questions

- [ ] **Homepage SAA route**: The spec redirects authenticated users to "the main application
  page" (Homepage SAA, screenId `i87tDx10uM`). That screen's spec/plan is out of scope here.
  This plan uses **`/`** as the post-login destination; `app/page.tsx` becomes the placeholder
  home page (rendering "Authenticated — placeholder for Homepage SAA" while the real home
  feature is built). Confirm that Login may ship before Homepage SAA.
- [ ] **Sign-out trigger**: FR-014 requires sign-out from authenticated pages to land on
  Login. Login itself does NOT contain a sign-out button. Where does the sign-out action
  live? Options: profile dropdown (`z4sCl3_Qtk` / `54rekaCHG1`, not yet surveyed) or a
  temporary `/api/auth/signout` POST from a debug page. Recommend: defer sign-out UX to the
  profile-dropdown screen surveys; expose `signOut()` server-action in `src/lib/auth.ts` so
  any future page can call it.

---

## Notes

- This research file is intentionally short because the codebase has no prior art for Login to
  reuse. Future-feature research files for surfaces that build on Login (Homepage SAA, profile
  dropdown, etc.) will be longer because they will inherit the patterns this plan establishes.
- Any pattern this plan introduces (route handler shape, repository signature, cookie helper
  API, i18n catalog format) becomes a precedent. Treat it accordingly.
