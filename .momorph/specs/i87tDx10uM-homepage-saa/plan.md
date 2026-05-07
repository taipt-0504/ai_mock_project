# Implementation Plan: Homepage SAA

**Frame**: `i87tDx10uM-homepage-saa`
**Date**: 2026-05-07
**Spec**: `.momorph/specs/i87tDx10uM-homepage-saa/spec.md` (Status: **Locked — all 7 questions resolved**)
**Constitution**: `.momorph/constitution.md` (v1.1.1)
**SCREENFLOW**: `.momorph/SCREENFLOW.md` (Homepage SAA surveyed; access-control flipped to auth-only 2026-05-07)
**Predecessor specs (shipped)**: Login (`GzbNeVGJHz`), Language Dropdown (`hUyaaugye2`)

---

## Summary

Build the authenticated landing page for SAA 2025 at `/`. The auth gate already exists in [app/page.tsx](app/page.tsx) (redirect to `/login` for anonymous requests, shipped with the Login feature) — the placeholder body is what gets replaced. Most of the work is new UI: a richer header (extending the shipped slim variant with nav + notification + profile slots), a hero with a live countdown to `SAA_EVENT_START_AT`, six award-category cards that deep-link to `/awards#<slug>`, a Sun* Kudos promo block, a floating quick-action button, and a footer.

The plan reuses every shipped artifact it can (LanguageSelector, Logo, i18n helper, cookie helpers, `auth()`) and treats the existing `Header` as the seed for a slot-based composition (Q4 resolution). All visual properties are fetched on demand via `query_section` per Node ID at implementation time — no `design-style.md` artifact is produced or consumed.

The Homepage itself is read-only: no `POST` / `PATCH` / `DELETE` from this screen. The only new server endpoint is a predicted `GET /api/notifications/unread-count`; if that backend isn't ready, FR-018 degrades gracefully (no badge, no error).

---

## Technical Context

**Language/Framework**: TypeScript 5 (strict) / Next.js 16.2.4 (App Router) — unchanged.
**Primary Dependencies**: React 19, Tailwind CSS v4, Auth.js v5, Prisma. **No new runtime packages** (the toast primitive is implemented in-house if not already present — see Q6 resolution).
**Database**: PostgreSQL via Prisma — no schema change in this iteration. `User.locale` already exists; `User.role` is intentionally absent (PQ1 resolved 2026-05-07: defer the admin variant). The admin "Admin Dashboard" menu entry ships in a follow-up PR that adds the schema field.
**Testing**: Vitest 4 (unit / integration) + Playwright 1.59 (E2E, chromium) — same as Login.
**State Management**: Local React state in client islands only (LanguageSelector / Countdown / NotificationBell / ProfileButton / WidgetButton). No Redux / Zustand / context store.
**API Style**: REST. Existing endpoints (`/api/i18n/locale`) reused; one new predicted endpoint (`/api/notifications/unread-count`).
**Path alias**: `@/*` → `./*` (root-relative, per Login plan).
**Design source**: Figma file `9ypp4enmFmdK3YAFJLIu6C`, frame `i87tDx10uM` (last edited 2026-01-30). Visual properties fetched at implementation time via `query_section` per Node ID (per spec scope §"Visual properties intentionally omitted").

---

## Constitution Compliance Check

*GATE: Must pass before implementation. Each item maps to a principle in `.momorph/constitution.md` (v1.1.1).*

- [x] **Principle I — Clean Code & Readable Structure**: file/folder layout below uses kebab-case for non-component modules and PascalCase for components; one responsibility per file; no dead code; lint-clean enforced. Awards static config goes in `src/lib/awards/awards.ts`; one component per file under `src/components/home/`.
- [x] **Principle II — Stack Best Practices**: Server Components by default — only LanguageSelector (shipped), Countdown, NotificationBell, ProfileButton, WidgetButton are client components; everything else (Header, Logo, NavLinks, EventInfo, CTAButtons, RootFurtherEssay, AwardsGrid, AwardCard, KudosBlock, Footer) is server. Layered route → service → repository for the new `/api/notifications/unread-count` (route handler delegates to a notification service which delegates to a repository — the repository may itself stub against an unimplemented backend during development). No `any`. Tailwind tokens only — extend `app/globals.css` BEFORE referencing new tokens. Prisma singleton already in place.
- [x] **Principle III — Platform-Appropriate UI Patterns**: responsive (≥360 px); 3-col awards grid on desktop, 2-col on tablet/mobile (per FR-011 + US3 scenario 1, breakpoint values resolved at implementation time using existing Tailwind tokens). WCAG 2.1 AA for keyboard / focus / ARIA / contrast. `prefers-reduced-motion` respected on hero / chevron / award-card hover / FAB animations. Countdown is decorative for assistive tech (Q7 resolution: no `aria-live` wrapper); the surrounding "Coming soon" subtitle and event metadata carry the time signal once at page load.
- [x] **Principle IV — OWASP Secure Coding**: trust boundaries handled — `auth()` gates the page (FR-001a); `getSaaLocale()` validates the cookie against the allowlist (already shipped); the new `/api/notifications/unread-count` route handler returns 401 for unauthenticated callers and applies the same security-header set as the rest of the project (`proxy.ts` already adds these globally). No new untrusted input is read on this screen. Threat model summary in §Risk Assessment below.
- [x] **Principle V — Test-Driven Development**: failing tests written before implementation for every FR landing in this iteration. Specifically: countdown calculation (FR-007 / FR-008), award-slug navigation (FR-011 / FR-012), notification-badge degradation (FR-018), active-nav-link derivation (FR-019), auth-gate redirect for anonymous requests (FR-001a / US0), header slot composition (FR-004), profile menu user-variant (FR-005's admin branch is deferred to the schema follow-up per PQ1 = b). Coverage targets: unit ≥80%, E2E covers all P1 user stories (US0 / US1 / US2 / US3 / US4).

**Threat model summary** *(Principle IV)*:

- **Trust boundaries**: browser ↔ Next.js server, server ↔ Postgres (via Prisma), server ↔ env vars (`SAA_EVENT_START_AT`).
- **Sensitive data handled**: session token (`authjs.session-token`) — already protected by Auth.js + `proxy.ts` security headers; `User.locale` (low sensitivity); notification unread count (low sensitivity).
- **Abuse cases to test**:
  - Anonymous request to `/` → redirected to `/login` (FR-001a — covered by E2E).
  - Tampered `saa_locale` cookie → cleared, falls back to default (already covered by saa-locale unit test).
  - Tampered `SAA_EVENT_START_AT` env (e.g. malformed string) → countdown shows fallback, page renders the rest (FR-007 fallback path).
  - `/api/notifications/unread-count` called without a session → 401 (no leak).
  - Cross-tab session revocation → next Homepage request redirects to `/login` (already covered by Login spec's `Session.deleteMany` E2E).

**Violations**: none.

---

## Architecture Decisions

### Frontend Approach

- **Component Structure**: feature-folder per domain — `src/components/home/` for Homepage-specific components; `src/components/header/` for the shared Header (already populated with Logo + LanguageSelector); `src/lib/awards/` for the static awards config + slug helpers. NO atomic design split into atoms/molecules/organisms — flat per-feature folders are the project convention (cf. Login's `src/components/login/`).
- **Server / Client boundary**:
  - **Server (default)**: `app/page.tsx`, `Header` (composed from existing slim variant + new slot props), `NavLinks`, `EventInfo`, `CTAButtons`, `RootFurtherEssay`, `AwardsSectionHeader`, `AwardsGrid`, `AwardCard`, `KudosBlock`, `Footer`.
  - **Client (`"use client"`)**: existing `LanguageSelector` (no change); new `Countdown` (per-minute tick), `NotificationBell` (toast-on-click stub per Q6), `ProfileButton` (trigger only — dropdown deferred), `WidgetButton` FAB (toggle quick-action menu — menu contents are deferred to its own spec but the trigger needs client interactivity).
  - **Toast primitive**: a minimal client-side `Toaster` provider rendered once in `app/layout.tsx`; Homepage components push messages via a tiny imperative `toast()` helper. If the project decides to introduce `sonner` or similar later, the helper provides a clean swap point.
- **Styling Strategy**: Tailwind CSS v4 utilities only. Reuse existing tokens (`saa-page`, `saa-page-fg`, `saa-button-primary`, `saa-button-primary-fg`, `saa-divider`, `saa-header-overlay`, `saa-dropdown-surface`, `saa-dropdown-border`); extend the system in `app/globals.css` BEFORE referencing any Figma value not in the token set. New tokens likely needed (to be confirmed during Phase 0):
  - `saa-card-surface`, `saa-card-border` — for award cards and Kudos block.
  - `saa-essay-fg`, `saa-essay-quote-fg` — for the Root Further essay & pull-quote.
  - `saa-fab-bg`, `saa-fab-fg` — for the floating quick-action button (yellow pill per Figma).
  - `saa-footer-bg`, `saa-footer-fg` — for the footer.
- **Data Fetching**: Server Components fetch via `auth()` (already shipped), `getSaaLocale()` (already shipped), and `fetch("/api/notifications/unread-count", { cache: "no-store" })` for the badge (graceful-degradation on error). The countdown takes its target as a prop derived from `process.env.SAA_EVENT_START_AT` parsed in `app/page.tsx`.
- **State Management**:
  - Countdown: local `useState({ now })` + `useEffect` with `setInterval(60_000)` and `visibilitychange` listener (per spec edge case "Browser tab inactive").
  - NotificationBell: `useState({ isOpen: false })` is unused in this iteration (click triggers the toast directly — no panel); the open state will return when the panel ships.
  - ProfileButton: `useState({ isOpen })`. Menu contents are placeholder; full dropdown deferred.
  - WidgetButton: `useState({ isOpen })`. Menu contents are placeholder; full quick-action menu deferred.
  - LanguageSelector: unchanged (already manages its own state).
  - No global store — locale comes from server, auth comes from server, notifications come from server. Each client island owns only its open/close state.

### Backend Approach

- **API Design**: `GET /api/notifications/unread-count` — thin route handler that returns `{ unreadCount: number }`. Returns 401 if `auth()` is null. Implementation in this iteration is a **stub** that returns `{ unreadCount: 0 }` always (until the notification panel spec ships); behind a feature flag or simply deferred. Spec FR-018 + State Management §Loading-error already document graceful degradation (no badge if endpoint missing or 5xx). The route layered as `app/api/notifications/unread-count/route.ts → src/services/notification-service.ts → src/repositories/notification-repository.ts`.
- **Data Access**: no schema change. Repository may either (a) read a real `Notification` table (deferred) or (b) be a no-op returning 0 in this iteration.
- **Validation**: zod schema in the route handler if/when a query param appears — not needed for v1.

### Integration Points

- **Existing module**: [src/components/header/Header.tsx](src/components/header/Header.tsx) — extended (not forked) per Q4 resolution. New optional props: `nav?: ReactNode`, `notification?: ReactNode`, `profileMenu?: ReactNode`, `currentPath?: string`. Login passes only `locale` + `isAuthenticated` (slim variant unchanged).
- **Existing component**: [src/components/header/LanguageSelector.tsx](src/components/header/LanguageSelector.tsx) — no change.
- **Existing component**: [src/components/header/Logo.tsx](src/components/header/Logo.tsx) — currently parameterless (renders `<Image>` only, no link). Needed change for the Homepage: wrap or extend to take an `href` prop and behave as a link (`/` for the header, anchor `/#top` or scroll-to-top handler for in-page click). Login keeps current behavior by defaulting `href="/login"` or by leaving the new prop optional with a sensible default. **Mandatory edit**, not "may need" — see Phase 4 step 2.
- **Existing module**: [src/lib/i18n/index.ts](src/lib/i18n/index.ts) + catalogs — extend `vi-VN.json` and `en-US.json` with all new Homepage keys (hero, nav, event, CTAs, essay, awards, Kudos, footer, "Coming soon" toast) in lockstep so `tests/unit/lib/i18n/parity.test.ts` stays green.
- **Existing module**: [src/lib/cookies/saa-locale.ts](src/lib/cookies/saa-locale.ts) — used as-is.
- **Existing module**: `@/src/lib/auth` — `auth()` returns the session with `user.id`, `user.email`, `user.name`, `user.image`, `user.locale` (the locale field is augmented in `auth.config.ts`'s `session` callback). Per PQ1 = b, `user.role` stays absent in this iteration; ProfileButton receives `name` + `image` only. The follow-up PR that adds `User.role` will also extend the session callback in the same file.
- **Existing route**: [app/page.tsx](app/page.tsx) — currently a placeholder with the auth gate already in place. Replace the body; keep the auth gate.

---

## Project Structure

### Documentation (this feature)

```text
.momorph/specs/i87tDx10uM-homepage-saa/
├── spec.md          # Feature specification (locked, all 7 questions resolved)
├── plan.md          # This file
├── tasks.md         # Generated next by /momorph.tasks
└── research.md      # NOT created — see "Why no research.md" below
```

### New files

| File                                                                   | Purpose                                                                           |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `src/lib/awards/awards.ts`                                             | Static array of six awards with `{ id, slug, titleKey, descriptionKey, thumbnailAsset }`. Single source of truth for the awards grid + cross-spec deep links. |
| `src/lib/awards/awards.test.ts`                                        | Unit tests: slug uniqueness, titleKey/descriptionKey present in both catalogs, deterministic ordering.                                                        |
| `src/components/home/Countdown.tsx`                                    | Client island. Per-minute tick + `visibilitychange` recompute. Renders three tiles with 2-digit padding.                                                      |
| `src/components/home/Hero.tsx`                                         | Server. Wraps "ROOT FURTHER" title + "Coming soon" subtitle + Countdown.                                                                                      |
| `src/components/home/EventInfo.tsx`                                    | Server. Static `Thời gian / Địa điểm / Facebook live` block from i18n.                                                                                       |
| `src/components/home/CTAButtons.tsx`                                   | Server. Two anchor buttons → `/awards` / `/sun-kudos`.                                                                                                        |
| `src/components/home/RootFurtherEssay.tsx`                             | Server. Three paragraphs + pull-quote, all from i18n.                                                                                                         |
| `src/components/home/AwardsSectionHeader.tsx`                          | Server. Wraps `C1` caption + H1 + supporting copy from i18n. Static, non-interactive.                                                                          |
| `src/components/home/AwardsGrid.tsx`                                   | Server. Maps the awards config to `AwardCard` instances. Handles responsive grid.                                                                             |
| `src/components/home/AwardCard.tsx`                                    | Server. Single card — image + title + clamp-2 description + "Chi tiết" button. Whole card is one anchor to `/awards#<slug>`.                                  |
| `src/components/home/KudosBlock.tsx`                                   | Server. Promo block with label + title + description + illustration + "Chi tiết" button → `/sun-kudos`.                                                       |
| `src/components/home/WidgetButton.tsx`                                 | Client. FAB — opens a quick-action menu (menu contents are placeholder for this iteration).                                                                   |
| `src/components/home/NotificationBell.tsx`                             | Client. Trigger button + unread indicator. Click fires a "Coming soon" toast (Q6 resolution).                                                                 |
| `src/components/home/ProfileButton.tsx`                                | Client. Trigger button + minimal placeholder menu — **Profile** + **Sign out** only (per PQ1 = b). The admin "Admin Dashboard" menu entry is deferred to the follow-up PR that adds `User.role`. Real full dropdown deferred to `z4sCl3_Qtk` / `54rekaCHG1` specs. |
| `src/components/home/NavLinks.tsx`                                     | Server. Renders the three header nav links; derives `aria-current` from `currentPath` per FR-019. Reused in footer with the additional `7.5` link.            |
| `src/components/home/Footer.tsx`                                       | Server. Logo + four nav links + "Tiêu chuẩn chung" + copyright.                                                                                               |
| `src/components/ui/Toaster.tsx`                                        | Client. Minimal toast primitive — listens on the `toast.ts` event bus and renders queued messages with auto-dismiss. One `Toaster` mounted in `app/layout.tsx`. |
| `src/components/ui/toast.ts`                                           | Imperative helper. Public surface: `toast(message: string, options?: { variant?: "info" \| "error"; durationMs?: number }): void`. Backed by an in-memory `EventTarget`. Replaceable later if a third-party lib is adopted — the call sites depend only on this surface, not on the implementation. |
| `tests/unit/components/ui/toast.test.tsx`                              | Asserts (a) `toast(...)` resolves without a Toaster mounted (no-op fallback); (b) Toaster shows then auto-dismisses; (c) multiple rapid calls queue.            |
| `tests/unit/components/home/WidgetButton.test.tsx`                     | Click toggles open state; menu items render; click outside closes.                                                                                            |
| `app/api/notifications/unread-count/route.ts`                          | `GET` returning `{ unreadCount }`. 401 if `auth()` null. v1 stub may return 0 always.                                                                         |
| `src/services/notification-service.ts`                                 | Service layer. `getUnreadCount(userId)`. v1 returns 0 (no DB hit).                                                                                            |
| `src/repositories/notification-repository.ts`                          | Repository layer. v1 stub. Real implementation deferred.                                                                                                      |
| `src/lib/event/event-config.ts`                                        | Reads `SAA_EVENT_START_AT` from env, parses to `Date`, returns `null` on failure. Pure function for testability.                                              |
| `src/lib/event/event-config.test.ts`                                   | Unit tests for the env parsing — valid ISO-8601, missing, malformed, past timestamp.                                                                          |
| `tests/unit/components/home/Countdown.test.tsx`                        | Unit tests for tick + visibilitychange + zero-state + fallback.                                                                                               |
| `tests/unit/components/home/AwardCard.test.tsx`                        | Renders correct slug href, ellipsis behavior (`line-clamp-2` class on description), click on title vs button vs image all link to same href.                  |
| `tests/unit/components/home/NotificationBell.test.tsx`                 | Click fires toast (uses the toast helper mock).                                                                                                               |
| `tests/unit/components/home/NavLinks.test.tsx`                         | Active link derivation from `currentPath`.                                                                                                                    |
| `tests/unit/components/home/EventInfo.test.tsx`                        | Renders `Thời gian` / `Địa điểm` / Facebook live note from i18n catalog.                                                                                       |
| `tests/unit/components/home/CTAButtons.test.tsx`                       | Two anchors with hrefs `/awards` and `/sun-kudos`.                                                                                                            |
| `tests/unit/components/home/RootFurtherEssay.test.tsx`                 | Three paragraphs + pull-quote rendered from i18n catalog.                                                                                                     |
| `tests/unit/components/home/KudosBlock.test.tsx`                       | Renders label + title + description + illustration + "Chi tiết" button with `href="/sun-kudos"`.                                                              |
| `tests/unit/components/home/Footer.test.tsx`                           | All five footer links render with the right hrefs (incl. `/general-rules` for `7.5`); copyright string from i18n.                                              |
| `tests/unit/components/home/ProfileButton.test.tsx`                    | Renders Profile + Sign out menu items; click toggles open state; click outside closes. Admin variant is out-of-scope for this PR (PQ1 = b — covered in the schema follow-up). |
| `tests/unit/components/header/Header.test.tsx`                         | Slim-variant snapshot (Login regression guard) + full-variant assertion (all five slots present + ordered).                                                    |
| `tests/integration/home/notifications-route.test.ts`                   | 401 unauthenticated, 200 + JSON body authenticated.                                                                                                           |
| `tests/e2e/home/auth-redirect.spec.ts`                                 | Anonymous → `/login`; authenticated → Homepage rendered.                                                                                                      |
| `tests/e2e/home/awards-deep-link.spec.ts`                              | Click two distinct cards → URL becomes `/awards#<slug>` for each.                                                                                             |
| `tests/e2e/home/language-switch.spec.ts`                               | Switch on Homepage flips hero/nav/awards/footer copy. Reuses Login E2E pattern.                                                                                |
| `tests/e2e/home/notification-bell.spec.ts`                             | Click bell → toast appears with localized text.                                                                                                                |

### Modified files

| File                                                                   | Change                                                                                                                                                              |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [app/page.tsx](app/page.tsx)                                           | Replace placeholder body with full Homepage. Keep the existing auth gate (FR-001a).                                                                                 |
| [app/layout.tsx](app/layout.tsx)                                       | Mount the new `<Toaster />` in the body so any client component on any page can call `toast()`.                                                                     |
| [src/components/header/Header.tsx](src/components/header/Header.tsx)   | Extend with optional slot props (`nav`, `notification`, `profileMenu`, `currentPath`). Login keeps its slim variant by passing none. Slot fallback = render nothing. |
| [src/components/header/Logo.tsx](src/components/header/Logo.tsx)       | **Mandatory edit** — currently parameterless (returns `<div><Image/></div>`). Add an optional `href?: string` prop; when set, wrap `<Image>` in a `<Link href={href}>`. Both Header `A1.1` and Footer `7.1` pass `href="/"`. Login keeps current behavior by passing no prop. |
| [app/globals.css](app/globals.css)                                     | Add new Tailwind tokens identified in Phase 0 (e.g. `saa-card-surface`, `saa-fab-bg`, `saa-footer-bg`).                                                              |
| [src/lib/i18n/catalogs/vi-VN.json](src/lib/i18n/catalogs/vi-VN.json)   | Add ~30 new keys: hero, nav (3), event (3), CTAs (2), essay (3+1 quote), award titles + descriptions (12), Kudos block (4), footer (5), "Coming soon" toast (1).    |
| [src/lib/i18n/catalogs/en-US.json](src/lib/i18n/catalogs/en-US.json)   | Same 30 keys, English.                                                                                                                                              |
| [.env.example](.env.example) and `.env.local`                          | New row: `SAA_EVENT_START_AT="2025-12-31T18:30:00+07:00"` (or whatever the program target is).                                                                       |
| [src/lib/config.ts](src/lib/config.ts)                                  | **Mandatory edit** — Constitution § Configuration declares `config.ts` is the ONLY module allowed to read `process.env`. Add `SAA_EVENT_START_AT: z.string().optional()` to the zod schema; the parsed value is read by the new `parseEventStart()` util via `config.SAA_EVENT_START_AT`. The countdown's "missing/malformed" fallback (US1 scenario 4) is preserved by zod's `.optional()` + downstream parse-failure handling. |

### Untouched files (regression guards)

| File                                                                 | Why untouched                                            |
| -------------------------------------------------------------------- | -------------------------------------------------------- |
| [src/components/header/LanguageSelector.tsx](src/components/header/LanguageSelector.tsx) | Already shipped + tested. Behavior is final.             |
| [src/lib/i18n/types.ts](src/lib/i18n/types.ts)                       | Locale allowlist + chip + flag map are stable.           |
| [src/lib/cookies/saa-locale.ts](src/lib/cookies/saa-locale.ts)       | Cookie attributes + allowlist enforcement unchanged.     |
| [app/api/i18n/locale/route.ts](app/api/i18n/locale/route.ts)         | API contract is stable.                                  |
| [src/services/locale-service.ts](src/services/locale-service.ts)     | Service contract is stable.                              |
| [prisma/schema.prisma](prisma/schema.prisma)                         | Untouched. PQ1 = b: `User.role` is deferred to the schema follow-up PR.                                                                                                       |
| [proxy.ts](proxy.ts)                                                 | Security headers + rate limit are global; do not modify. |

### Dependencies

**Zero new runtime packages.** The toast primitive is implemented in-house (small, replaceable later). If the team decides during Phase 1 that an existing library is preferable, that's a one-line swap behind the `toast()` helper.

---

## Implementation Strategy

### Phase Breakdown

The work splits cleanly into seven phases. Within each user-story phase, follow strict TDD per Constitution V — failing tests land first, code lands second.

### Phase 0 — Asset & Token Preparation

1. Run `query_section` against `i87tDx10uM` for each top-level section (`A1`, `3.5`, `B1`, `B2`, `B3`, `B4`, `C1`, `C2`, `D1`, `6`, `7`) to fetch concrete CSS values. **Do this on demand, per-section, during the relevant Phase below — NOT all at once. The dropdown plan's Phase 0 lesson holds: the `query_section` window of context is small.**
2. Run `list_media_nodes` on `i87tDx10uM` to enumerate referenced assets:
   - Hero key-visual artwork (likely a large PNG / SVG).
   - Award card thumbnails (six images).
   - Kudos block illustration.
   - FAB icons (pencil + SAA brand mark + the `/` separator — verify whether they are vector components or embedded assets).
3. Download via `get_media_files` into `public/assets/home/` with kebab-case filenames: `key-visual.{ext}`, `award-top-talent.{ext}`, `award-top-project.{ext}`, etc., `kudos-illustration.{ext}`.
4. Identify any new color / spacing / radius / shadow values not present in the token system. Register them in [app/globals.css](app/globals.css) as CSS variables under `:root` and again in `@theme inline` so Tailwind utilities pick them up. Document each new token in the PR description.

### Phase 1 — Foundation (config + types + i18n + tests-as-shells)

1. Write [src/lib/event/event-config.ts](src/lib/event/event-config.ts) — pure function, no side effects: `parseEventStart(env: string | undefined): Date | null`. **Tests first** ([src/lib/event/event-config.test.ts](src/lib/event/event-config.test.ts)): valid ISO, missing, garbage, past datetime, future datetime. Implementation makes them green.
2. Write [src/lib/awards/awards.ts](src/lib/awards/awards.ts) — exported `AWARDS: ReadonlyArray<Award>` constant of six entries. **Tests first** ([src/lib/awards/awards.test.ts](src/lib/awards/awards.test.ts)): exactly six entries; slugs match the canonical list (`top-talent` / `top-project` / `top-project-leader` / `best-manager` / `signature-2025-creator` / `mvp`); each `titleKey` and `descriptionKey` resolves in BOTH `vi-VN.json` and `en-US.json` (this enforces the spec's parity rule for awards data).
3. Add the ~30 new keys to BOTH [vi-VN.json](src/lib/i18n/catalogs/vi-VN.json) and [en-US.json](src/lib/i18n/catalogs/en-US.json) in lockstep. Run the existing parity test (`tests/unit/lib/i18n/parity.test.ts`) — MUST stay green.
4. Update `.env.example` and `.env.local` with the `SAA_EVENT_START_AT` row. If [src/lib/config.ts](src/lib/config.ts) validates env via zod, extend the schema and rerun the config tests.

### Phase 2 — User Story 0: Auth gate (P1, MVP precondition)

The auth gate is **already implemented** at [app/page.tsx](app/page.tsx) lines 12-24 (shipped with Login). Verify and harden:

1. Add E2E [tests/e2e/home/auth-redirect.spec.ts](tests/e2e/home/auth-redirect.spec.ts) — covers all five US0 scenarios:
   - Anon GET `/` → 307/308 redirect to `/login`.
   - Tampered session cookie → redirect to `/login`.
   - Post-OAuth callback → land on `/` with the real Homepage rendering (cross-references Login US1).
   - Sign-out then visit `/` → redirect to `/login`.
   - Authenticated visit to `/login` → redirected to `/` per Login spec US2 — verify no infinite loop.
2. Confirm [app/page.tsx](app/page.tsx)'s `auth()` call is wrapped in the existing `try / catch` (already done) — degrades correctly if the auth backend is offline, so the user sees the redirect rather than a 500.
3. No code change here unless the tests find a bug — the gate ships from Login.

### Phase 3 — User Story 1: Hero + Countdown (P1)

1. **Tests first**:
   - [tests/unit/components/home/Countdown.test.tsx](tests/unit/components/home/Countdown.test.tsx): 5 cases mirroring US1 acceptance scenarios (future, ticking, zero state, fallback, static event-info bystander). Use `vi.useFakeTimers()` for the tick and `vi.setSystemTime()` for time travel.
   - [tests/unit/components/home/EventInfo.test.tsx](tests/unit/components/home/EventInfo.test.tsx): renders the three i18n keys verbatim (US1 scenario 5 — static `B2` block alongside the countdown).
2. **Code**:
   - [src/components/home/Countdown.tsx](src/components/home/Countdown.tsx): `"use client"` component; props `{ eventStart: Date | null; locale: SupportedLocale }`. Initial values are SSR-safe — server renders the snapshot, client hydrates and starts ticking.
   - [src/components/home/Hero.tsx](src/components/home/Hero.tsx): server component composing the title + "Coming soon" subtitle + `<Countdown />`.
   - [src/components/home/EventInfo.tsx](src/components/home/EventInfo.tsx): server component rendering the static `Thời gian / Địa điểm / Facebook live` copy from i18n.
3. Wire `Hero` and `EventInfo` into [app/page.tsx](app/page.tsx) below the header.
4. Verify visibilitychange recovery manually: open the page, switch tabs for 2 minutes, return — values should jump to current.

### Phase 4 — User Story 2: Header navigation (P1)

1. **Tests first**:
   - [tests/unit/components/home/NavLinks.test.tsx](tests/unit/components/home/NavLinks.test.tsx): renders three links; the one matching `currentPath` has `aria-current="page"` and the others don't (FR-019).
   - [tests/unit/components/header/Header.test.tsx](tests/unit/components/header/Header.test.tsx) — **new file** (no Header tests exist today). Cover (a) slim variant: pass only `locale` + `isAuthenticated`, assert Logo + LanguageSelector render, no nav/notification/profile slot DOM; (b) full variant: pass all four slot props, assert the slot contents render in the right order; (c) Login regression: snapshot the slim DOM and lock it as the contract.
2. **Code**:
   - **Modify [src/components/header/Logo.tsx](src/components/header/Logo.tsx)** to accept an optional `href` prop (default behavior preserves the parameterless render — wrap the existing `<Image>` in a `<Link>` only when `href` is set, otherwise return the existing div). This unlocks both Header `A1.1` (`href="/"`) and Footer `7.1` (`href="/"`) usage without breaking the Login screen, which can keep passing no prop or pass `href="/login"` if a click should re-anchor.
   - Extend [src/components/header/Header.tsx](src/components/header/Header.tsx) with the four optional props from §Architecture. Default each to `null`. Use a balanced flex layout: `Logo` left, optional `nav` center, slot stack right (notification + LanguageSelector + profileMenu).
   - Write [src/components/home/NavLinks.tsx](src/components/home/NavLinks.tsx): server component; takes `currentPath` from `app/page.tsx` (the page passes a hardcoded `"/"` since this IS the Homepage). Future host pages (e.g. `/awards`) will pass their own path.
3. Cross-screen regression: re-run the existing Login E2E (`tests/e2e/login/*`) — MUST stay green. The slim Header variant has not changed.

### Phase 5 — User Stories 3 + 5 + 6: Awards grid + Kudos block + Footer (P1 / P2 / P2)

1. **Tests first**:
   - [tests/unit/components/home/AwardCard.test.tsx](tests/unit/components/home/AwardCard.test.tsx): card href is `/awards#<slug>`; clicking the wrapper anchor produces the same navigation as clicking the title or "Chi tiết" button (all three are the same anchor — single-tabstop A11y per spec). Also asserts the description has the `line-clamp-2` Tailwind utility (FR-013).
   - [tests/unit/components/home/KudosBlock.test.tsx](tests/unit/components/home/KudosBlock.test.tsx): renders label + title + description + illustration + "Chi tiết" button with `href="/sun-kudos"` (US5).
   - [tests/unit/components/home/Footer.test.tsx](tests/unit/components/home/Footer.test.tsx): all five footer links render with the right hrefs (incl. `/general-rules` for `7.5`); copyright string from i18n (US6 / FR-016).
   - E2E [tests/e2e/home/awards-deep-link.spec.ts](tests/e2e/home/awards-deep-link.spec.ts): click the Top Talent card → URL becomes `/awards#top-talent`. Repeat for one more card (e.g. MVP).
2. **Code**:
   - [src/components/home/AwardCard.tsx](src/components/home/AwardCard.tsx): server component. Single `<Link>` wrapping the whole content. Description uses `line-clamp-2` (or equivalent — implementer's call). Title and "Chi tiết" inside the same anchor → no nested-link warnings.
   - [src/components/home/AwardsGrid.tsx](src/components/home/AwardsGrid.tsx): server. Maps `AWARDS` to `<AwardCard />`s in a responsive grid (Tailwind's `grid grid-cols-2 lg:grid-cols-3` or similar — values resolved during Phase 0 query).
   - [src/components/home/AwardsSectionHeader.tsx](src/components/home/AwardsSectionHeader.tsx): server. Wraps `C1` caption + H1 + supporting copy from i18n.
   - [src/components/home/KudosBlock.tsx](src/components/home/KudosBlock.tsx): server. Static promo block with a single `<Link href="/sun-kudos">` for the "Chi tiết" button.
   - [src/components/home/Footer.tsx](src/components/home/Footer.tsx): server. Reuses `Logo` + `NavLinks` + adds the `7.5` "Tiêu chuẩn chung" link to `/general-rules`.

### Phase 6 — User Story 4: Locale switch on Homepage (P1)

1. **Tests first**: E2E [tests/e2e/home/language-switch.spec.ts](tests/e2e/home/language-switch.spec.ts) mirrors the existing Login E2E — flip locale on Homepage, assert hero title + nav label + an award title + footer copyright all switched. Cookie persists across reload.
2. **Code**: nothing new — `LanguageSelector` is already shipped. Just mount it inside the new Header's right-hand stack.
3. Run the existing LanguageSelector unit test to confirm no behavior regression from the additional mount surface.

### Phase 7 — User Stories 7 + 8 + 9 + Polish (P2 / P2 / P3)

1. **Tests first**:
   - [tests/unit/components/ui/toast.test.tsx](tests/unit/components/ui/toast.test.tsx): `toast()` no-ops if no Toaster mounted; Toaster renders + auto-dismisses; multiple rapid calls queue.
   - [tests/unit/components/home/NotificationBell.test.tsx](tests/unit/components/home/NotificationBell.test.tsx): click the bell → mocked `toast()` is called with the localized "Coming soon" key (Q6 resolution). When `unreadCount > 0` is provided, the unread indicator renders; when 0, it doesn't (FR-018).
   - [tests/unit/components/home/ProfileButton.test.tsx](tests/unit/components/home/ProfileButton.test.tsx): renders Profile + Sign out menu items; click toggles open state; click outside closes. The admin variant + test are out-of-scope for this PR (PQ1 = b — added in the schema follow-up).
   - [tests/unit/components/home/WidgetButton.test.tsx](tests/unit/components/home/WidgetButton.test.tsx): click toggles open state; menu items render; click outside closes.
   - [tests/unit/components/home/RootFurtherEssay.test.tsx](tests/unit/components/home/RootFurtherEssay.test.tsx): renders three paragraphs + pull-quote from i18n.
   - [tests/unit/components/home/CTAButtons.test.tsx](tests/unit/components/home/CTAButtons.test.tsx): two anchors with hrefs `/awards` and `/sun-kudos`.
   - [tests/integration/home/notifications-route.test.ts](tests/integration/home/notifications-route.test.ts): 401 unauthenticated, 200 + `{ unreadCount: 0 }` authenticated.
   - E2E [tests/e2e/home/notification-bell.spec.ts](tests/e2e/home/notification-bell.spec.ts): click bell → toast appears with localized text (US8 / Q6).
2. **Code**:
   - [src/components/ui/Toaster.tsx](src/components/ui/Toaster.tsx) + [src/components/ui/toast.ts](src/components/ui/toast.ts) — minimal in-house primitive. Mount Toaster in [app/layout.tsx](app/layout.tsx).
   - [src/components/home/NotificationBell.tsx](src/components/home/NotificationBell.tsx): client component. Receives `unreadCount` as a prop; renders the bell + indicator + `aria-label`. Click → `toast(t("home.notification.toast.coming_soon", locale))`.
   - [src/components/home/ProfileButton.tsx](src/components/home/ProfileButton.tsx): client component. Receives `name` + `image` as props. Renders the avatar + an inline `<details>`-style placeholder menu listing **Profile** and **Sign out**. Per PQ1 = b, the admin "Admin Dashboard" entry is out-of-scope for this PR; the schema follow-up will grow a `role?: "user" | "admin"` prop and add the entry. Real full-fledged dropdown (the `z4sCl3_Qtk` overlay component) is deferred regardless.
   - [src/components/home/WidgetButton.tsx](src/components/home/WidgetButton.tsx): client component. Click toggles a placeholder menu that lists "Write Kudos" / "Read general rules" entries (their target routes are deferred).
   - [src/components/home/RootFurtherEssay.tsx](src/components/home/RootFurtherEssay.tsx): server. Static three-paragraph + pull-quote block from i18n.
   - [src/components/home/EventInfo.tsx](src/components/home/EventInfo.tsx): server. Static metadata block.
   - [src/components/home/CTAButtons.tsx](src/components/home/CTAButtons.tsx): server. Two `<Link>`s.
   - [app/api/notifications/unread-count/route.ts](app/api/notifications/unread-count/route.ts) + service + repository: stub returning `{ unreadCount: 0 }`. 401 if `auth()` null. Unit + integration tests cover.
3. **Wire everything into [app/page.tsx](app/page.tsx)**: replace the placeholder body with the full composition: `<Header nav={<NavLinks currentPath="/" />} notification={<NotificationBell unreadCount={...} />} profileMenu={<ProfileButton name={session.user.name} image={session.user.image} />} ... />` followed by `<Hero /> <EventInfo /> <CTAButtons /> <RootFurtherEssay /> <AwardsSectionHeader /> <AwardsGrid /> <KudosBlock /> <WidgetButton /> <Footer />`.
4. **Polish**: run `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npm run test:e2e`, `npm run build`. Capture a Playwright screenshot of `/` (signed-in) and side-by-side compare to the Figma frame image.

### Risk Assessment

| Risk                                                                              | Probability | Impact | Mitigation                                                                                                                                        |
| --------------------------------------------------------------------------------- | ----------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Implementer wires `LanguageSelector` against a fresh prop signature instead of reusing the shipped contract | Low         | Med    | Reuse Map at the top of the spec is explicit; the existing component takes `{ locale, isAuthenticated? }` and that's what Header passes through. |
| Countdown drift (tab-inactive, system-clock skew, `setInterval` throttling)       | Medium      | Med    | `visibilitychange` listener recomputes on focus return (per spec edge case). Unit test with `vi.setSystemTime()` covers the jump.                |
| Awards i18n drift — title/description key in one catalog only                     | Medium      | Low    | Existing parity test catches it at build time. Awards-config unit test additionally enforces both catalogs at the source-array level.            |
| Notification endpoint not ready / fails                                           | Medium      | Low    | Spec FR-018 + State Management documented graceful degradation. SSR fetch wrapped in try/catch returns `0` → no badge, no error surface.         |
| Implementer flattens the auth gate (removes the `redirect("/login")`)             | Low         | High   | E2E `auth-redirect.spec.ts` covers all five US0 scenarios. Removing the gate flips the test red immediately. CI gate will block the PR.          |
| New Tailwind token added without registering in `app/globals.css` first          | Medium      | Low    | Constitution Principle II forbids raw literals. Phase 0 step 4 mandates token registration before reference.                                     |
| Profile button's placeholder menu accidentally exposes routes that don't exist    | Low         | Low    | Menu items in this iteration link to `/login` (Sign out via Auth.js's default flow) and `/profile` / `/admin` placeholders that 404 gracefully.   |
| Award card's "single anchor wraps title + button" structure produces nested `<a>` warnings | Low         | Low    | Test asserts no nested anchors; the "Chi tiết" element is rendered as a `<span>` inside the wrapping `<Link>`, not as a separate `<a>`.           |
| Toast primitive collides with future library adoption                             | Low         | Low    | The `toast()` helper is the API surface; the in-house implementation is private. Swapping in `sonner` is a one-line change inside `Toaster.tsx`.  |
| `proxy.ts` rate limit accidentally hits Homepage assets                           | Low         | Low    | Current matcher already excludes `_next/static`, `_next/image`, `favicon.ico`, `assets`. New `public/assets/home/*` falls under the existing exclusion. |
| **PQ1 resolved (b)**: `User.role` deferred — FR-005 admin branch + SC-006 ship in follow-up | Resolved    | Med    | Schema migration + session-callback augmentation are scheduled into the follow-up PR (one-task focus). This Homepage PR ships the user-only ProfileButton (Profile + Sign out) and `Header.test.tsx` is coded against that variant. Spec FR-005 admin behavior remains acknowledged in spec only; admin users see the user menu in the meantime. |

### Estimated Complexity

- **Frontend**: Medium — many small components but each is well-scoped. The Countdown (with visibilitychange recovery) is the trickiest unit; everything else is straightforward composition.
- **Backend**: Low — one stub route handler.
- **Testing**: Medium — five new E2E specs plus several unit/integration suites. Each is small individually.
- **Documentation**: Low — Phase 7 final commit updates the SCREENFLOW Discovery Log.

---

## Integration Testing Strategy

### Test Scope

- [x] **Component / module interactions**: Header ↔ slot-injected NavLinks/NotificationBell/LanguageSelector/ProfileButton; AwardsGrid ↔ AwardCard ↔ awards config; Countdown ↔ event-config util.
- [x] **External dependencies**: none new (no third-party SDK).
- [x] **Data layer**: no new schema; the notification stub returns `0` without DB hit in v1.
- [x] **User workflow**: auth-redirect, language switch, award deep-link — all covered by E2E.

### Test Categories

| Category               | Applicable? | Coverage                                                                              |
| ---------------------- | ----------- | ------------------------------------------------------------------------------------- |
| UI ↔ Logic             | Yes         | NavLinks active-state derivation, AwardCard slug navigation, Countdown ticking, NotificationBell click → toast |
| Service ↔ Service      | Yes         | notification-service unit + i18n-locale-route integration (already shipped)            |
| App ↔ External API     | No          | No external API on this screen                                                         |
| App ↔ Data Layer       | Partial     | Notification repository is a stub for v1; full integration deferred                    |
| Cross-platform         | Partial     | Responsive web only; no native variant                                                  |

### Mocking Strategy

| Dependency                        | Strategy                          | Rationale                                                            |
| --------------------------------- | --------------------------------- | -------------------------------------------------------------------- |
| `next/navigation` `useRouter`     | Mocked in unit tests              | Same pattern as existing LanguageSelector test                       |
| `Date.now()` / `setInterval`      | `vi.useFakeTimers()`              | Deterministic countdown tests                                        |
| `auth()`                          | Mocked at module level            | Page test stubs the session for authed/anon variants                  |
| `fetch("/api/notifications/...")` | Mocked                            | Page test asserts graceful degradation when fetch rejects             |
| Prisma client                     | In-memory mock for service tests  | Hermetic test runs                                                    |
| `process.env.SAA_EVENT_START_AT`  | Set in test setup via `vi.stubEnv` | Different countdown scenarios                                         |

### Coverage Goals

| Area                              | Target | Action                                                            |
| --------------------------------- | ------ | ----------------------------------------------------------------- |
| Awards config / event-config util | 100%   | Pure functions — easy 100%                                        |
| Countdown                         | 90%+   | All five US1 scenarios + visibilitychange branch                  |
| NavLinks                          | 100%   | Three branches (one selected, two unselected) cover the function   |
| NotificationBell + toast helper   | 90%+   | Click + indicator + 401 path                                       |
| Header (extended)                 | 80%+   | Slim variant (Login) + full variant (Homepage)                    |
| AwardCard                         | 90%+   | All six slugs + ellipsis behavior                                 |
| `app/page.tsx`                    | E2E    | Auth-redirect E2E covers the page-level gating                    |

### Spec → Verification Coverage Matrix

| Spec item | Verification artifact |
| --------- | --------------------- |
| **US0 / FR-001a** auth-gate redirect | `tests/e2e/home/auth-redirect.spec.ts` — five scenarios |
| **FR-001** SSR root route at `/` | Existing route test in CI build; `auth-redirect.spec.ts` confirms the URL responds at `/` |
| **FR-002** locale resolution (cookie → `User.locale` → default) | `tests/unit/lib/cookies/saa-locale.test.ts` (already shipped) + page test that asserts the Server Component reads `getSaaLocale()` once and passes it to children |
| **FR-003** `auth()` provides display fields | `tests/unit/components/home/ProfileButton.test.tsx` covers `name` + `image` rendering. Role-based rendering is out-of-scope for this PR (PQ1 = b — covered in the schema follow-up). |
| **FR-004** Header always renders all controls | `tests/unit/components/header/Header.test.tsx` — full-variant render asserts Logo, NavLinks, NotificationBell, LanguageSelector, ProfileButton are all in the tree |
| **US1 / FR-006** hero + "Coming soon" subtitle | `Countdown.test.tsx` (subtitle visibility branch) + Phase 7 visual diff |
| **US1 / FR-007** countdown calculation + 2-digit padding | `Countdown.test.tsx` (future scenario, fake timers) |
| **US1 / FR-008** zero-state + subtitle hidden | `Countdown.test.tsx` (zero scenario) |
| **US1** invalid datetime fallback | `event-config.test.ts` (parsing) + `Countdown.test.tsx` (rendering with `null`) |
| **FR-009** static event-info copy | `tests/unit/components/home/EventInfo.test.tsx` (renders the three i18n keys verbatim) |
| **FR-010** CTA buttons → `/awards` and `/sun-kudos` | `tests/unit/components/home/CTAButtons.test.tsx` (anchor href assertions) + E2E click navigation in `awards-deep-link.spec.ts` |
| **US2 / FR-019** active-link derivation | `NavLinks.test.tsx` |
| **US2** logo scroll-to-top | E2E click + scroll assertion in `auth-redirect.spec.ts` (post-auth state) |
| **US2 / FR-005** profile menu admin entry | **Deferred** to the schema follow-up PR (PQ1 = b). This PR ships `ProfileButton` with the user-only menu (Profile + Sign out). The admin variant + its unit test land alongside the `User.role` schema migration. |
| **US3 / FR-011** + **FR-012** awards grid + slug navigation | `awards.test.ts` + `AwardCard.test.tsx` + `awards-deep-link.spec.ts` |
| **US3 / FR-013** description ellipsis | `AwardCard.test.tsx` asserts the description element has the `line-clamp-2` Tailwind utility class (or whatever class is chosen during implementation); visual confirmation via Phase 7 screenshot |
| **FR-020** slugs language-agnostic | `awards.test.ts` — slugs constant across `t()` calls in both locales |
| **US4** locale switch | `language-switch.spec.ts` E2E |
| **FR-014 / US5** Kudos block "Chi tiết" → `/sun-kudos` | `tests/unit/components/home/KudosBlock.test.tsx` (renders all required elements) + E2E click navigation |
| **FR-016 / US6** footer links | `tests/unit/components/home/Footer.test.tsx` (asserts all five link hrefs incl. `/general-rules`) + E2E click navigation |
| **FR-015 / US7** FAB visibility + open menu | `WidgetButton.test.tsx` + manual smoke |
| **US8 / FR-018** notification badge | `NotificationBell.test.tsx` + `notifications-route.test.ts` |
| **US8 / Q6** "Coming soon" toast on bell click | `notification-bell.spec.ts` E2E + `tests/unit/components/ui/toast.test.tsx` |
| **FR-017** i18n parity | `tests/unit/lib/i18n/parity.test.ts` (already shipped) |
| **US9** Root Further essay | `tests/unit/components/home/RootFurtherEssay.test.tsx` (renders three paragraphs + pull-quote from i18n) |
| **TR-001** SSR-first | Page test mounts auth in test setup; absence of client-side fetch on first paint is asserted; build output confirms `app/page.tsx` is a Server Component |
| **TR-002** Server/Client boundary | No automated lint rule today — guarded by code review. `"use client"` directive is present only on the listed files. Add a follow-up grep gate in Phase 7 polish if drift is observed. |
| **TR-003** env var ISO-8601 | `event-config.test.ts` (also exercises the zod-validated `config.SAA_EVENT_START_AT`) |
| **TR-004** Tailwind tokens only | `npm run lint` + code review. No raw color/spacing literals — extending `app/globals.css` first per Phase 0 step 4. |
| **TR-005** custom `t()` helper | Spec design — no library introduced. PR diff review confirms zero `next-intl` / `react-intl` imports. |
| **TR-006** Header reuse via slots | `Header.test.tsx` covers both variants; Login E2E remains green (regression guard for the slim variant) |
| **TR-007** TDD per FR | Each Phase enforces test-first ordering; failing tests committed before code in the PR history |
| **TR-008** OWASP boundary checks | Notification route test (401 path); existing cookie/auth tests cover the rest of the trust boundaries |
| **SC-001** SSR FCP target | Lighthouse CI gate (project-level) — out-of-band verification, not duplicated here |
| **SC-002** Countdown drift ±5s/hour | Manual smoke + an optional `Countdown` long-running unit test using fake timers stepping by 60s × 60 |
| **SC-003** 100% award slug routing | `awards-deep-link.spec.ts` E2E asserts at least two slugs end-to-end |
| **SC-004** Locale switch perceived 200ms | Inherited from the dropdown spec's SC; the LanguageSelector is reused without modification, so the budget is maintained automatically |
| **SC-005** Notification badge correctness | `NotificationBell.test.tsx` |
| **SC-006** Admin-only menu entry | **Deferred** to the schema follow-up PR (PQ1 = b). This PR's `ProfileButton.test.tsx` only covers the user variant. |
| **SC-007** Anonymous redirect to `/login` | `auth-redirect.spec.ts` |

---

## Why no `research.md`?

The plan template offers an optional `research.md` for codebase findings. For this Homepage plan it would duplicate context already in:

1. The spec's "Reuse Map" table (top of `spec.md`).
2. The SCREENFLOW.md "Component Details" + "Screen Details" sections.
3. The Login plan's existing technical-context narrative (we are reusing every Login-shipped artifact 1:1).

A separate research doc would just paraphrase those. If a future iteration introduces something genuinely new (e.g. moving awards data to a CMS, adding a real-time WebSocket for notifications), that future plan SHOULD include a `research.md` because the architecture surface would actually change.

---

## Dependencies & Prerequisites

### Required before start

- [x] `constitution.md` reviewed (v1.1.1).
- [x] `spec.md` locked (all 7 questions resolved 2026-05-07).
- [x] `SCREENFLOW.md` reflects the Homepage as authenticated-only (updated 2026-05-07).
- [x] Existing Login + Dropdown features shipped end-to-end (commits `8c0022f`, refresh round 2026-05-07).
- [x] Auth.js + Prisma session strategy in place.
- [x] `auth()` returns user with `id`, `name`, `email`, `image`, `locale` (the locale augmentation is in `auth.config.ts` already). `role` is intentionally absent (PQ1 = b — covered in follow-up PR).
- [x] LanguageSelector / Logo / Header (slim) shipped.
- [x] i18n helper + parity test green.
- [x] **PQ1 resolved 2026-05-07: option (b)** — `User.role` deferred to the follow-up PR; this PR ships ProfileButton with the user-only menu.
- [ ] Decide & set the production `SAA_EVENT_START_AT` value. The placeholder `2025-12-31T18:30:00+07:00` must be replaced before deployment.
- [ ] Award assets exported from Figma OR sourced separately. If `list_media_nodes` returns empty for the award thumbnails (similar to the dropdown's flag situation), the implementer authors fallback assets matching the project's existing icon style.

### External dependencies

None. No third-party API, no new SaaS, no new vendor library.

---

## Next Steps

After plan approval:

1. **Run `/momorph.tasks`** to generate the task breakdown. The tasks file MUST mirror Phases 0-7 above and respect TDD ordering within each user-story phase. Aim for ~30-45 numbered tasks given the size of this feature.
2. **Run `/momorph.reviewplan`** if there is any doubt about whether the plan correctly scopes the work or if any FR is unaccounted for.
3. **Begin** implementation following the phase order. The MVP shippable point is Phase 6 complete (Phases 0-6 = US0/US1/US2/US3/US4/US5/US6). Phases 7's polish + US7/US8/US9 are P2/P3 and can ship in a follow-up if pressure.

---

## Resolved Questions

All 7 spec questions are resolved (per `spec.md` §Resolved Questions). The plan adopts each resolution:

- **Q1** `/general-rules` → footer link `7.5` href.
- **Q2** static awards config → `src/lib/awards/awards.ts`.
- **Q3** FAB visibility → always render (Homepage is auth-only).
- **Q4** Header reuse → extend with optional slots (TR-006).
- **Q5** Sign-in CTA → not applicable (auth-only).
- **Q6** Bell click → "Coming soon" toast (in-house Toaster primitive).
- **Q7** Countdown a11y → no `aria-live`; tiles are decorative for AT.

## Resolved Questions (plan-level)

- **PQ1 — `User.role` schema field.** **Resolved 2026-05-07: option (b) — defer.** The Homepage PR ships ProfileButton with the user-only menu (Profile + Sign out). `prisma/schema.prisma` is untouched in this PR; the `auth.config.ts` session callback is untouched. FR-005's admin branch + SC-006 land alongside the `User.role` migration in a follow-up PR. The follow-up's scope is small and well-defined: schema migration → session-callback augmentation → ProfileButton `role?` prop → admin variant test → admin-route guards (if any).

No open questions remain.

---

## Notes

- The Homepage is the largest single screen the project has spec'd to date (9 user stories, 20 FRs, 8 TRs, 6 SCs, 11 design-item rows). The phased breakdown is essential to keep PRs small — recommend one PR per Phase (or per logical sub-phase) rather than a single mega-PR.
- The notification stub returning `0` is a deliberate design choice: it lets FR-018 + the bell + the toast all land cleanly without coupling to an unbuilt notification feature. When that feature ships, only the repository implementation changes.
- The Toaster primitive is small (≈80 LoC including styling). It is NOT a competing dependency on `sonner` / `react-hot-toast` — it's a temporary primitive sized to Q6's modest needs. The `toast()` helper is the boundary; swapping the implementation later is a one-file change.
- The `Footer`'s `7.5` "Tiêu chuẩn chung" link routes to `/general-rules` (Q1). That destination screen is owned by a separate spec; this plan emits the link only. If the destination screen doesn't exist when this PR ships, the link 404s gracefully — not great UX but consistent with the rest of the project's "destinations TBD" approach.
- Constitution v1.1.1 already documents the testing toolchain; nothing to install.
- The project's existing `proxy.ts` adds OWASP security headers globally — the Homepage inherits them automatically. No headers need to be added here.
- One subtle quality bar to maintain: the Server/Client boundary. Most of this screen is server. If a tempting refactor would make the whole page a single client component, push back — Constitution Principle II is explicit about Server Components being the default.
