# Feature Specification: Homepage SAA

**Frame ID**: `i87tDx10uM`
**Frame Name**: `Homepage SAA`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Created**: 2026-05-07
**Status**: Implemented (shipped 2026-05-07). All 73 tasks in [tasks.md](tasks.md) are `[x]`. Verification gates green: vitest 184/184, Playwright Homepage 11/11 + Login regression 16/16, lint clean, `tsc --noEmit` clean, `next build` succeeds. Visual diff against Figma frame `i87tDx10uM` accepted in `assets/`. Follow-ups (out of this spec): `User.role` schema migration + ProfileButton admin variant (PQ1 = b), notification panel (replaces the Q6 "Coming soon" toast), profile/quick-action menu contents.

---

## Reuse Map (existing artifacts to leverage)

The Homepage shares header chrome with the Login screen and the Language Dropdown component. Reuse — do NOT re-implement — the following:

| Concern | Existing artifact | Action on this screen |
| --- | --- | --- |
| Language chip + menu (`A1.7`) | [src/components/header/LanguageSelector.tsx](src/components/header/LanguageSelector.tsx) | Mount inside the Homepage header. Behavior, persistence, ARIA already shipped. |
| Locale allowlist + chip + flag map | [src/lib/i18n/types.ts](src/lib/i18n/types.ts) (`SUPPORTED_LOCALES`, `LOCALE_DISPLAY`) | Read for both server and client locale resolution. |
| Translation helper + catalogs | [src/lib/i18n/index.ts](src/lib/i18n/index.ts) + `src/lib/i18n/catalogs/{vi-VN,en-US}.json` | Add Homepage strings (program copy, nav labels, award titles/descriptions, footer copy) to BOTH catalogs in lockstep — `tests/unit/lib/i18n/parity.test.ts` will fail loudly otherwise. |
| `saa_locale` cookie helper | [src/lib/cookies/saa-locale.ts](src/lib/cookies/saa-locale.ts) | Use `getSaaLocale()` in the Server Component for SSR locale read; identical to Login's pattern. |
| Authenticated locale persistence | [app/api/i18n/locale/route.ts](app/api/i18n/locale/route.ts) | Already wired into LanguageSelector — no change. |
| Auth.js session helper | `auth()` from `@/src/lib/auth` (per Login spec TR-003) | Use in the Homepage Server Component to derive `isAuthenticated` and the user's `role` for conditional UI (notification bell, profile menu's "Admin Dashboard" entry). |
| Logo component | [src/components/header/Logo.tsx](src/components/header/Logo.tsx) | Mount at Homepage header `A1.1` and footer `7.1`. Click behavior on `A1.1` scrolls to top; footer logo reuses the same handler. |
| Header shell | [src/components/header/Header.tsx](src/components/header/Header.tsx) | Currently a thin wrapper around Logo + LanguageSelector (used by Login). The Homepage needs a fuller header with nav links + notification + profile menu. **Decision**: extend the existing `Header` component to accept optional slots (nav, notification, profile) rather than fork — Login keeps its slim variant by simply not passing the extra props. Open question Q4 below. |

The decision elsewhere — what the user, the implementer, and downstream specs (Awards, Kudos, Profile, Notification) build on — is documented in `.momorph/SCREENFLOW.md` (Component Details + Screen Details sections, dated 2026-05-07).

---

## Overview

The Homepage SAA is the **authenticated landing page** for the **Sun Annual Awards 2025 (SAA 2025)** program. It is the primary navigation hub once a user has signed in. It introduces the "Root Further" theme, displays a live countdown to the event, surfaces the six award categories, and promotes the Sun* Kudos campaign.

**Access control**: Homepage SAA is **authenticated-only**. Anonymous visitors who hit `/` MUST be redirected to `/login`. This mirrors (in reverse) the Login spec's US2: an authenticated visitor landing on `/login` is redirected to `/`. Together the two redirects guarantee the user is always on the right surface for their session state.

**Target users**:
- **Authenticated regular users** — see the full Homepage (header with nav + notification + profile, hero, countdown, event info, CTAs, Root Further essay, awards grid, Sun* Kudos block, FAB, footer). Profile menu lists "Profile" and "Sign out".
- **Authenticated admin users** — same as regular users plus an additional "Admin Dashboard" entry in the profile menu.

There is no anonymous variant of this screen — anonymous users never see Homepage chrome at all.

**Business context**: The SAA 2025 program runs annually; the Homepage is the central touchpoint that orients employees and award participants to the program theme, schedule, award categories, and the Kudos recognition movement. The countdown is a **time-sensitive marketing element** that must accurately reflect the event start datetime configured for the deployed environment. Restricting the Homepage to authenticated users ensures program-internal content (the event metadata, the FAB quick-action surface for writing Kudos, role-gated UI) stays gated to actual SAA participants.

---

## User Scenarios & Testing *(mandatory)*

### User Story 0 — Authenticated access only (Priority: P1)

The Homepage `/` is gated behind authentication. Anonymous users who visit the URL are redirected to `/login` before any Homepage content renders.

**Why this priority**: Access control is a hard prerequisite for every other story on this screen. If this story isn't implemented correctly, all the FR-* / TR-* below fail their security premise.

**Independent Test**: From a clean browser session (no `authjs.session-token`), visit `/`. Verify the response is a server-side redirect to `/login`. Authenticate via Google, verify the post-auth landing is `/` rendering the full Homepage. Sign out, verify the next visit to `/` redirects again to `/login`.

**Acceptance Scenarios**:

1. **Given** a user has no valid session, **When** they request `/` (direct URL or marketing share), **Then** the server-side `auth()` check returns null and the Homepage Server Component MUST issue a redirect to `/login` BEFORE flushing any markup. No Homepage HTML reaches the browser.
2. **Given** a user has a session cookie that fails `auth()` validation (revoked / expired / tampered), **When** they request `/`, **Then** the same redirect to `/login` happens; the cookie SHOULD also be cleared so subsequent requests don't re-validate.
3. **Given** a user successfully signs in via the Login flow (Login US1), **When** the OAuth callback completes, **Then** they land on `/` rendering the full Homepage with their session active.
4. **Given** an authenticated user signs out (any path that ends the session), **When** they next attempt to visit `/`, **Then** they are redirected to `/login`.
5. **Given** the redirect chain exists, **When** an authenticated user lands on `/login` directly, **Then** the Login spec's US2 redirects them back to `/`. No infinite loop is possible because the two redirects key off opposite session states.

---

### User Story 1 — Read program theme & see live countdown to the event (Priority: P1)

An authenticated user lands on `/` and immediately sees the "ROOT FURTHER" key visual, a live ticking countdown to the event, and the venue/time metadata.

**Why this priority**: This is the centerpiece of the screen. Without it the Homepage doesn't communicate its core message.

**Independent Test**: Open `/` in any browser. Verify (a) the hero shows "ROOT FURTHER" and the "Coming soon" subtitle, (b) three countdown tiles render `DD HH MM` with two-digit zero-padded numbers, (c) waiting one minute decrements the minutes value (or rolls over hours/days), (d) when the configured event datetime has passed, all tiles show `00` and the "Coming soon" subtitle disappears.

**Acceptance Scenarios**:

1. **Given** the configured event start datetime (`SAA_EVENT_START_AT` ISO-8601, see TR-003) is in the future and the user opens `/`, **When** the screen renders, **Then** the hero shows "ROOT FURTHER", the "Coming soon" label is visible, and the countdown reflects `floor(diff/days)`, `floor(diff%days/hours)`, `floor(diff%hours/minutes)` rendered as two-digit zero-padded values (`05` not `5`).
2. **Given** the countdown is rendered with non-zero minutes, **When** one minute elapses on the wall clock, **Then** the minutes tile decrements by 1 (or rolls over: minutes `00` → minutes `59` and hours `--` decrements; analogous for hours → days).
3. **Given** the configured event start datetime is now in the past, **When** the screen renders, **Then** all three countdown tiles show `00`, the "Coming soon" subtitle is hidden, and no further ticking is attempted.
4. **Given** the event start environment value is missing or not a parseable ISO-8601 datetime, **When** the screen renders, **Then** the countdown shows a graceful fallback (three `--` tiles or the last known good value) and the page still renders the rest of the content; no exception is thrown into the user's view.
5. **Given** the page has been open for more than a minute, **When** the user looks at the static event metadata block (`B2`), **Then** they see fixed copy `Thời gian: 18h30`, `Địa điểm: Nhà hát nghệ thuật quân đội`, plus the supporting `Tường thuật trực tiếp tại Group Facebook Sun* Family` note. This is static content (not dependent on the countdown).

---

### User Story 2 — Navigate via the header (Priority: P1)

The user uses the header to move around the site: click the logo to scroll to top, click a nav link to switch sections/screens, click the language chip to switch UI locale.

**Why this priority**: The header is the primary navigation surface. The active "About SAA 2025" link signals where the user currently is; the other links are the only way to reach Awards Information, Sun* Kudos, and the user's profile menu.

**Independent Test**: Sign in. Click each header element and assert the resulting navigation. Verify the active link is visually distinct, hover state appears on the others. All header controls (nav links, notification bell, language chip, profile button) MUST be present on every render of the Homepage — there is no anonymous variant.

**Acceptance Scenarios**:

1. **Given** the user is on `/`, **When** they click the logo (`A1.1`), **Then** the page scrolls to the top of the Homepage (no navigation, no reload).
2. **Given** the user is on `/`, **When** they click the active nav link "About SAA 2025" (`A1.2`), **Then** the page scrolls to the top of the Homepage. The link's "selected" treatment is preserved.
3. **Given** the user is on `/`, **When** they click "Awards Information" (`A1.3`), **Then** they navigate to `/awards` (Awards Information screen — out-of-scope for this spec, see SCREENFLOW pending entry).
4. **Given** the user is on `/`, **When** they click "Sun* Kudos" (`A1.5`), **Then** they navigate to `/sun-kudos` (Sun* Kudos screen — out-of-scope for this spec).
5. **Given** the user hovers any non-active nav link, **When** the hover state engages, **Then** the link enters its hover treatment. Leaving the link reverts to the normal state.
6. **Given** the user navigates to `/awards`, **When** the destination renders, **Then** the header's selected-link treatment shifts from `A1.2` to `A1.3` (per FR-019). Same logic for `/sun-kudos` → `A1.5`.
7. **Given** the user clicks the language chip (`A1.7`), **When** the menu opens, **Then** behavior matches the shipped LanguageSelector exactly (cf. dropdown spec `hUyaaugye2`). No new code path.
8. **Given** an authenticated regular user is on `/`, **When** they click the profile button (`A1.8`), **Then** the profile dropdown opens (overlay component `z4sCl3_Qtk`, deferred to its own spec; this Homepage spec only documents the trigger). The menu lists "Profile" and "Sign out".
9. **Given** an authenticated admin user is on `/`, **When** they click the profile button, **Then** the menu lists "Profile", "Sign out", AND "Admin Dashboard" (admin-only entry).

---

### User Story 3 — Browse award categories and jump to a specific award (Priority: P1)

The user reviews the six award category cards (Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 — Creator, MVP) and clicks one to jump to its detail on the Awards Information page.

**Why this priority**: Awards are the program's substantive content. The Homepage is the canonical entry point to award details.

**Independent Test**: Render `/`, scroll to the awards grid, click any card's image / title / "Chi tiết" button — verify navigation to `/awards#<slug>` so the browser scrolls to the matching section.

**Acceptance Scenarios**:

1. **Given** the awards grid (`C2`) is rendered, **When** the user views it on a desktop viewport, **Then** the six cards lay out in a 3-column grid; on mobile / tablet they lay out in 2 columns. (Specific responsive breakpoints are decided at implementation time using the project's Tailwind tokens; behavioral contract is "≥3 cols on desktop, 2 cols below".)
2. **Given** a card is rendered, **When** the user views it, **Then** they see (a) a thumbnail image, (b) the award title (e.g. "Top Talent"), (c) a 1–2 line description (truncated with `…` ellipsis if it exceeds 2 lines), (d) a "Chi tiết" button.
3. **Given** the user clicks anywhere on a card's image, title, or "Chi tiết" button, **When** the click fires, **Then** the user navigates to `/awards#<slug>` where `<slug>` is the kebab-case identifier for the card (e.g. `top-talent`, `top-project`, `top-project-leader`, `best-manager`, `signature-2025-creator`, `mvp`). The browser handles the scroll-to-anchor automatically once the destination renders.
4. **Given** an award card is rendered, **When** the user hovers over it, **Then** the card enters its hover treatment (visual treatment described in Figma; concrete styling resolved at implementation time).
5. **Given** an award card has no slug configured (degenerate case), **When** the user clicks it, **Then** the user navigates to `/awards` without the hash so the destination renders without an anchor jump.

---

### User Story 4 — Switch UI language (Priority: P1)

The user clicks the chip in the header and switches between Vietnamese (`vi-VN`, chip `VN`) and English (`en-US`, chip `EN`).

**Why this priority**: Localization is mandated for the program audience. The mechanism is already shipped — this story exists to confirm reuse on the Homepage.

**Independent Test**: Open `/`, click the chip, click the alternative locale, verify all visible Homepage strings (hero, "Coming soon", event metadata, nav, award titles & descriptions, Kudos block, footer) re-render in the chosen language; reload preserves the selection via the `saa_locale` cookie.

**Acceptance Scenarios**:

1. **Given** `vi-VN` is the active locale, **When** the user clicks the language chip and selects the `EN` row, **Then** the chip flips to `EN`, the `saa_locale` cookie is set to `en-US`, and `router.refresh()` re-renders the Server Component tree with English strings — including hero, nav, award copy, Kudos block, and footer.
2. **Given** `en-US` is active and the user is authenticated, **When** the locale is switched, **Then** the choice is also persisted to `User.locale` via `POST /api/i18n/locale` (already shipped).
3. **Given** the user reloads `/` after switching to `EN`, **When** the Server Component renders, **Then** the chip and copy still reflect `en-US` because `getSaaLocale()` reads the cookie before render.
4. **Given** the locale change is in flight and the API call fails (authenticated user only), **When** the failure is handled, **Then** the chip + cookie revert to the previous locale (already covered by the LanguageSelector unit test).

---

### User Story 5 — Read about Sun* Kudos and navigate to its detail (Priority: P2)

The user reads the Sun* Kudos promotional block (`D1` / `D2`) and clicks "Chi tiết" to learn more.

**Why this priority**: Promotes a parallel program. Important context but not blocking the awards flow.

**Independent Test**: Scroll to the Sun* Kudos block, verify it shows label "Phong trào ghi nhận", title "Sun* Kudos", a description paragraph, an illustration, and a "Chi tiết" button. Click the button → navigate to `/sun-kudos`.

**Acceptance Scenarios**:

1. **Given** the user has scrolled to the Sun* Kudos block, **When** the block renders, **Then** they see the label, title, description, illustration, and `D2.1` "Chi tiết" button.
2. **Given** the user clicks the "Chi tiết" button, **When** the click fires, **Then** they navigate to `/sun-kudos` (Sun* Kudos detail screen — out-of-scope for this spec).

---

### User Story 6 — Navigate via the footer (Priority: P2)

The user scrolls to the footer (`7`) and uses its links: logo (back to top), About SAA 2025, Awards Information, Sun* Kudos, Tiêu chuẩn chung. Footer also displays copyright "Bản quyền thuộc về Sun* © 2025".

**Why this priority**: Footer is a secondary navigation; many users reach it after consuming the page. Links must mirror header behavior to avoid surprise.

**Independent Test**: Scroll to footer, click each link, verify navigation matches the corresponding header behavior. The footer additionally exposes a "Tiêu chuẩn chung" link not present in the header.

**Acceptance Scenarios**:

1. **Given** the user clicks the footer logo (`7.1`), **When** the click fires, **Then** the page scrolls to top of `/` (same as `A1.1`).
2. **Given** the user clicks "About SAA 2025" (`7.2`), **When** the click fires, **Then** the page scrolls to top of `/`.
3. **Given** the user clicks "Awards Information" (`7.3`), **When** the click fires, **Then** they navigate to `/awards`.
4. **Given** the user clicks "Sun* Kudos" (`7.4`), **When** the click fires, **Then** they navigate to `/sun-kudos`.
5. **Given** the user clicks "Tiêu chuẩn chung" (`7.5`), **When** the click fires, **Then** they navigate to `/general-rules` (route currently undefined elsewhere — see Q1 below).
6. **Given** the footer is visible, **When** the user reads the right-hand side, **Then** they see the static copyright text in the active locale.

---

### User Story 7 — Open the floating quick-action menu (Priority: P2)

The user clicks the FAB (`6`, anchored bottom-right) to access quick actions like writing a Kudos or jumping to standards. Because Homepage is now authenticated-only, every user reaching this screen sees the FAB.

**Why this priority**: Power-user shortcut. Not the primary path to any feature, but expected by the Figma design.

**Independent Test**: Sign in, scroll the page, verify the FAB stays anchored bottom-right, click it, verify a quick-action menu opens.

**Acceptance Scenarios**:

1. **Given** the user is on `/`, **When** they look at the bottom-right of the viewport, **Then** the FAB is visible regardless of scroll position. (Anonymous users never reach `/` per US0.)
2. **Given** the user clicks the FAB, **When** the click fires, **Then** a quick-action menu opens. The menu's contents (specific actions, deep links) are out-of-scope for this spec.

---

### User Story 8 — See unread notification badge and open the panel (Priority: P2)

The user sees a badge on the bell icon (`A1.6`) when there are unread notifications, and can click to open a notification panel.

**Why this priority**: Notifications drive engagement. Without a badge users miss program updates; the panel itself can be a stub for now if backend is not ready (see Q6).

**Independent Test**: Sign in as a user with N unread notifications; verify the bell renders its "has unread" treatment. Click the bell → either the panel opens, or the configured stub behavior fires (Q6). Sign in as a user with 0 unread → bell renders without the badge.

**Acceptance Scenarios**:

1. **Given** the user has at least one unread notification, **When** the Homepage renders, **Then** the bell icon renders its "has unread" treatment — Figma uses a binary indicator (a dot), not a numeric counter.
2. **Given** the user has zero unread notifications, **When** the Homepage renders, **Then** the bell icon has no unread indicator.
3. **Given** the user clicks the bell icon, **When** the click fires, **Then** the configured behavior runs — see Q6 for whether this iteration ships the panel itself or stubs the click. The Homepage spec only owns the trigger button + badge logic.

---

### User Story 9 — Read the "Root Further" essay (Priority: P3)

The user scrolls past the hero and reads the three-paragraph theme essay (`B4`) ending with the pull-quote "A tree with deep roots fears no storm".

**Why this priority**: Static informational content. Improves first-impression UX, doesn't unblock other capabilities.

**Independent Test**: Verify the essay renders below the hero, copy is sourced from the active-locale catalog, and the layout responds to viewport width (paragraphs reflow, no horizontal scroll on mobile).

**Acceptance Scenarios**:

1. **Given** the user scrolls below the hero, **When** the essay block (`B4`) is in view, **Then** they see three paragraphs of theme copy and the pull-quote, all in the active locale.
2. **Given** the user attempts to interact with the essay text, **When** they click or hover, **Then** the text is non-interactive (no selection state beyond the browser default, no cursor change to indicate clickability).

---

### Edge Cases

- **Stale cookie / no session**: An expired or revoked session cookie that fails server-side `auth()` validation MUST trigger the same redirect as US0 (302/303 to `/login`) BEFORE any Homepage markup is flushed. The cookie SHOULD be cleared so subsequent requests don't re-validate.
- **Session revoked mid-session (database session deletion)**: With Auth.js v5 + Prisma database sessions (Login spec TR-003), deleting a `Session` row makes every subsequent `auth()` call return null. The Homepage's normal redirect path handles this — no special case needed.
- **Direct deep-link as anonymous**: An anonymous user hitting a deep link or marketing share that lands on `/` MUST be redirected to `/login`. The post-login destination SHOULD honor the original target (`/?` or `/` itself for this screen) when the OAuth callback completes, per Login spec's "Direct hit on a deep main-app URL while unauthenticated" edge case.
- **Clock skew between server and client**: The countdown SHOULD use the server's notion of "now" for the initial render and the client's local clock for ticking. A small skew (≤1 minute) is acceptable; larger skews are not Homepage's concern (the production environment governs NTP).
- **Browser tab inactive for hours**: When the tab regains focus after a long idle period, the countdown MUST re-compute against the current wall clock rather than continuing from where it stopped (browsers throttle `setInterval` in background tabs and may suspend it entirely; the same applies to `setTimeout` and `requestAnimationFrame`). Listen on `visibilitychange` and re-derive the displayed values when `document.visibilityState === "visible"`. Otherwise the user sees a stale value for a few seconds after refocus.
- **i18n catalog drift**: If a translation key exists in `vi-VN.json` but not `en-US.json`, the existing parity test will fail at build time — no runtime issue (the helper falls back to the default locale).
- **Award copy too long for 2 lines**: The description is truncated after 2 lines with a trailing ellipsis (Figma instruction). Implementation tactic — `line-clamp-2` or equivalent — is decided at implementation time.
- **Hash navigation to a missing award slug**: If the user navigates to `/awards#<unknown>`, the destination screen handles the missing anchor gracefully (out-of-scope here). This Homepage spec only emits well-known slugs.
- **Multiple rapid clicks on a CTA button**: `B3.1` / `B3.2` use plain anchor navigations (full-page or client-side via Next router) — multiple rapid clicks are debounced naturally by the navigation itself; no explicit lock needed.
- **Accessibility — reduced motion**: Hero parallax / award-card hover lift / FAB animations MUST respect `prefers-reduced-motion: reduce`. Use `motion-safe:` Tailwind variants (the existing `LanguageSelector` chevron uses this pattern after the dropdown refresh).

---

## UI/UX Requirements *(from Figma)*

### Screen Components

| Component                       | Node ID                                | Type / Description                                                                                                | Interactions                                                                                                              |
| ------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `A1` Header                     | `2167:9091`                            | Top navigation bar (instance of `186:1602`).                                                                      | Container — see child controls below.                                                                                     |
| `A1.1` Logo                     | `I2167:9091;178:1033`                  | SAA logo, click target.                                                                                           | Click → scroll-to-top of `/`.                                                                                              |
| `A1.2` Nav "About SAA 2025"     | `I2167:9091;186:1579`                  | Selected-state nav link (currently active route is `/`).                                                          | Click → scroll-to-top of `/`. Renders the "selected" treatment.                                                           |
| `A1.3` Nav "Awards Information" | `I2167:9091;186:1587`                  | Hover-state nav link (Figma's hover-state example).                                                               | Click → navigate to `/awards`. Renders hover treatment on pointer hover.                                                  |
| `A1.5` Nav "Sun* Kudos"         | `I2167:9091;186:1593`                  | Normal-state nav link.                                                                                            | Click → navigate to `/sun-kudos`. Renders hover treatment on pointer hover.                                               |
| `A1.6` Notification bell        | `I2167:9091;186:2101`                  | Icon button.                                                                                                      | Click → open notification panel (or Q6 stub). Unread indicator visible iff `notifications.unreadCount > 0` (binary, no count).|
| `A1.7` Language chip            | `I2167:9091;186:1696`                  | Reuses [src/components/header/LanguageSelector.tsx](src/components/header/LanguageSelector.tsx).                  | Already shipped. No changes needed here.                                                                                  |
| `A1.8` Profile avatar           | `I2167:9091;186:1597`                  | Avatar button.                                                                                                    | Click → open profile dropdown (`z4sCl3_Qtk` for user, `54rekaCHG1` for admin — both deferred to their own specs).         |
| `3.5` Hero "ROOT FURTHER"       | `2167:9027`                            | Key-visual + title block.                                                                                         | Static. Static copy includes the program title and "Coming soon" subtitle.                                                |
| `B1` Countdown section          | `2167:9035`                            | Wraps `B1.2` subtitle and `B1.3` tile group.                                                                      | Auto-updates per minute against `SAA_EVENT_START_AT`. Hides "Coming soon" once the target is reached.                     |
| `B1.2` "Coming soon" subtitle   | `2167:9036`                            | Label only.                                                                                                       | Hidden when `now >= eventStart`.                                                                                          |
| `B1.3` Countdown tile group     | `2167:9037`                            | Wraps the three tiles below.                                                                                      | Container; per-tile behavior delegated.                                                                                   |
| `B1.3.1` Days tile              | `2167:9038`                            | 2-digit zero-padded numeric tile + `DAYS` label.                                                                  | Auto-updates per minute. Renders `00` once event start is in the past.                                                    |
| `B1.3.2` Hours tile             | `2167:9043`                            | 2-digit zero-padded + `HOURS` label.                                                                              | Same behavior as `B1.3.1`.                                                                                                |
| `B1.3.3` Minutes tile           | `2167:9048`                            | 2-digit zero-padded + `MINUTES` label.                                                                            | Same behavior as `B1.3.1`.                                                                                                |
| `B2` Event info block           | `2167:9053`                            | Static `Thời gian` / `Địa điểm` / Facebook live note.                                                             | Static. Copy comes from i18n catalog.                                                                                     |
| `B3.1` "ABOUT AWARDS" CTA       | `2167:9063`                            | Primary CTA button.                                                                                               | Click → navigate to `/awards`. Hover → state change per Figma.                                                            |
| `B3.2` "ABOUT KUDOS" CTA        | `2167:9064`                            | Secondary CTA button.                                                                                             | Click → navigate to `/sun-kudos`. Hover → state change per Figma.                                                         |
| `B4` "Root Further" essay       | `5001:14827`                           | Static three-paragraph block + pull-quote.                                                                        | Non-interactive. Copy comes from i18n catalog.                                                                            |
| `C1` Awards section header      | `2167:9069`                            | Caption + H1 + supporting copy.                                                                                   | Static.                                                                                                                   |
| `C2` Awards grid                | `5005:14974`                           | Responsive grid (3-col desktop / 2-col mobile-tablet) of six cards.                                               | Container; see card behavior below.                                                                                       |
| `C2.1` Top Talent               | `2167:9075`                            | Award card. Children: `C2.1.1` Picture-Award, `C2.1.2` Title, `C2.1.3` Description, `C2.1.4` "Chi tiết" button.   | Click card / title / "Chi tiết" → `/awards#top-talent`. Hover treatment per FR-013.                                       |
| `C2.2` Top Project              | `2167:9076`                            | Award card. Same shape as `C2.1`.                                                                                 | Click → `/awards#top-project`.                                                                                            |
| `C2.3` Top Project Leader       | `2167:9077`                            | Award card. Same shape as `C2.1`.                                                                                 | Click → `/awards#top-project-leader`.                                                                                     |
| `C2.4` Best Manager             | `2167:9079`                            | Award card. Same shape as `C2.1`. *(Figma node ID 9078 is intentionally not used; index gap is by design.)*       | Click → `/awards#best-manager`.                                                                                           |
| `C2.5` Signature 2025 — Creator | `2167:9080`                            | Award card. Same shape as `C2.1`.                                                                                 | Click → `/awards#signature-2025-creator`.                                                                                 |
| `C2.6` MVP                      | `2167:9081`                            | Award card. Same shape as `C2.1`.                                                                                 | Click → `/awards#mvp`.                                                                                                    |
| `D1` Kudos promo container      | `3390:10349`                           | Promo card — label, title, description, illustration, CTA.                                                        | Container; see `D2`/`D2.1`.                                                                                               |
| `D2` Kudos content frame        | `I3390:10349;313:8419`                 | Wraps the Kudos label, title, description, and CTA.                                                               | Container; see `D2.1`.                                                                                                    |
| `D2.1` Kudos "Chi tiết" button  | `I3390:10349;313:8426`                 | Detail-link button.                                                                                               | Click → navigate to `/sun-kudos`.                                                                                         |
| `6` Widget FAB                  | `5022:15169`                           | Floating quick-action pill anchored bottom-right.                                                                 | Click → open quick-action menu (out-of-scope for this spec). Visible only when `isAuthenticated === true` (per Q3).       |
| `7` Footer                      | `5001:14800`                           | Wraps logo, four nav links, copyright text.                                                                       | Container; see `7.1`–`7.5`.                                                                                               |
| `7.1` Footer logo               | `I5001:14800;342:1408`                 | SAA logo.                                                                                                         | Click → scroll-to-top of `/`.                                                                                             |
| `7.2`–`7.4` Footer nav links    | `I5001:14800;342:1410`–`342:1412`      | "About SAA 2025" / "Awards Information" / "Sun* Kudos".                                                           | Same destinations as the matching header links (`A1.2` / `A1.3` / `A1.5`).                                                |
| `7.5` Footer "Tiêu chuẩn chung" | `I5001:14800;1161:9487`                | Standards link (footer-only).                                                                                     | Click → navigate to `/general-rules` (see Q1).                                                                                |

> Visual properties (colors, sizes, spacing, fonts, shadows, gradients, exact dimensions, asset paths) are intentionally omitted — the implementer fetches CSS on demand via `query_section` per Node ID and downloads any `MM_MEDIA_*` assets via `get_media_files` / `list_media_nodes`.

### Navigation Flow

- **Entry points**: signed-in users land here after a successful Login (Login spec US1) and via the Login spec US2 redirect when an authenticated user hits `/login` directly. Anonymous users never enter Homepage — they are redirected to `/login` per FR-001a.
- **Outgoing**:
  - `A1.3` / `7.3` / `B3.1` / `C2.x` → `/awards` (Awards Information; deep link `#<slug>` from card cards).
  - `A1.5` / `7.4` / `B3.2` / `D2.1` → `/sun-kudos` (Sun* Kudos detail).
  - `7.5` → `/general-rules` (Tiêu chuẩn chung; route name pending Q1).
  - `A1.7` (Language chip) → opens `hUyaaugye2` overlay (already shipped).
  - `A1.8` (Profile) → opens `z4sCl3_Qtk` (user) or `54rekaCHG1` (admin); both deferred to their own specs.
  - `A1.6` (Notification bell) → opens notification panel overlay (deferred to its own spec).
  - `6` (FAB) → opens quick-action menu (deferred to its own spec).
- **Self-loops** (do NOT route): `A1.1` / `A1.2` / `7.1` / `7.2` all scroll-to-top of the current page.

### Behavior & Accessibility (non-visual)

- All interactive elements MUST be keyboard-operable in source order: `Tab` reaches each in turn, `Enter` / `Space` activates buttons and links, `Escape` dismisses any overlay (language menu, profile menu, notification panel, FAB menu).
- The notification bell button MUST have `aria-label="Notifications"` (or the localized equivalent) and `aria-haspopup="dialog"`. The unread-state badge MUST be exposed to assistive tech (e.g., a visually-hidden `<span>You have unread notifications</span>` rendered conditionally).
- The profile button MUST have `aria-label` reflecting the user's display name + role (e.g., `aria-label="Account: Jane Doe (admin)"`) so screen readers can identify whose menu it is.
- Each award card MUST be keyboard-reachable as a single tabstop with a clear `aria-labelledby` pointing to the title; the "Chi tiết" button is supplementary, not the only path. Hover treatments MUST be paired with `:focus-visible` styles for keyboard users.
- The FAB button MUST have an accessible name describing its function (e.g., `aria-label="Quick actions"`).
- The countdown tiles are decorative for assistive tech (per Q7 resolution): NO `aria-live` wrapper, NO live announcements. The surrounding context (`B1.2` "Coming soon" + `B2` event metadata + hero copy) carries the time signal at page load. Sighted users continue to see the per-minute visual update.
- WCAG 2.1 AA target for all interactive elements (focus-visible, name/role/value, contrast — visual contrast is enforced at implementation time).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render the Homepage as a Server Component at the application root route `/`. Initial paint MUST come from the server with the active locale already resolved (no FOUC / locale flash).
- **FR-001a (auth gate)**: BEFORE rendering any Homepage markup, the Server Component MUST call `auth()` from `@/src/lib/auth`. If the call returns null (no session or invalid session), the response MUST be a server-side redirect to `/login` — no Homepage HTML is allowed to leak. Similarly for middleware-level enforcement: if a route matcher gates `/`, it MUST redirect anonymous requests to `/login` with the same semantics.
- **FR-002**: System MUST resolve the active locale by reusing `getSaaLocale()` from [src/lib/cookies/saa-locale.ts](src/lib/cookies/saa-locale.ts). For authenticated users (every Homepage visitor, per FR-001a), the locale MUST come from the cookie if set, falling back to `User.locale`, then to default `vi-VN`.
- **FR-003**: System MUST resolve the user's `role` and display fields (`name`, `image`) by reading the `auth()` session (already loaded in FR-001a — no second round-trip). The role drives the admin-only "Admin Dashboard" entry in the profile menu (FR-005).
- **FR-004**: Header (`A1`) MUST render ALL controls on every Homepage paint: Logo (`A1.1`), the three nav links (`A1.2` selected, `A1.3`, `A1.5`), the notification bell (`A1.6`), the language chip (`A1.7`), and the profile button (`A1.8`). There is no anonymous variant — anonymous users never reach this screen (per FR-001a).
- **FR-005**: Profile menu (`A1.8`) MUST list "Profile" and "Sign out" for any authenticated user; admin users MUST additionally see "Admin Dashboard". Role check uses the `role` field returned by `auth()` (the underlying schema is owned by the Login feature).
- **FR-006**: Hero (`3.5`) MUST display the program title "ROOT FURTHER" and (when the event is in the future) the "Coming soon" subtitle. Both strings come from the i18n catalog.
- **FR-007**: Countdown (`B1`) MUST render three two-digit zero-padded tiles for `Days`, `Hours`, `Minutes`, computed as the difference between `SAA_EVENT_START_AT` and the current wall clock. The tiles MUST update at most once per minute on the client.
- **FR-008**: When `now >= SAA_EVENT_START_AT`, the countdown MUST display `00` for all tiles, hide the "Coming soon" subtitle, and stop ticking. Re-render on the next mount picks this up automatically.
- **FR-009**: Event info block (`B2`) MUST render the static copy `Thời gian: 18h30`, `Địa điểm: Nhà hát nghệ thuật quân đội`, plus the supporting Facebook live note. All three strings come from the i18n catalog.
- **FR-010**: CTA buttons (`B3.1`, `B3.2`) MUST navigate to `/awards` and `/sun-kudos` respectively when clicked. They MUST render visible focus rings and respect `prefers-reduced-motion` for any hover transition.
- **FR-011**: Awards grid (`C2`) MUST render six award cards in priority order: Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 — Creator, MVP. Each card has a deterministic `slug` field derived from its identifier (`top-talent`, `top-project`, etc.); the slug list is the canonical source of truth for cross-spec deep links.
- **FR-012**: Each award card MUST be a single accessible link to `/awards#<slug>`. Clicking the image, title, or "Chi tiết" button MUST trigger the same navigation.
- **FR-013**: Award card description MUST clamp to 2 lines with a trailing ellipsis when the source string overflows; the underlying CSS tactic is left to implementation.
- **FR-014**: Sun* Kudos block (`D1`) MUST render the label, title, description, illustration, and "Chi tiết" button. The button MUST navigate to `/sun-kudos`.
- **FR-015**: FAB (`6`) MUST render on every Homepage paint (every visitor is authenticated per FR-001a). Click MUST open a quick-action menu (contents deferred to its own spec).
- **FR-016**: Footer (`7`) MUST render the logo, four nav links (`7.2` About / `7.3` Awards / `7.4` Sun* Kudos / `7.5` Tiêu chuẩn chung), and the localized copyright string. Links route as documented in §Navigation Flow.
- **FR-017**: All localized strings on this screen MUST exist in BOTH `vi-VN.json` and `en-US.json` catalogs. The parity test (`tests/unit/lib/i18n/parity.test.ts`) MUST pass.
- **FR-018**: Notification bell (`A1.6`) MUST render its "has unread" indicator iff the authenticated user's unread count is > 0. The exact count is not displayed (Figma uses a binary indicator).
- **FR-019**: The header's nav-link "selected" state MUST be derived from the current route, NOT from a hardcoded prop. On `/` the selected link is `A1.2` (About SAA 2025); on `/awards` it shifts to `A1.3`; on `/sun-kudos` to `A1.5`. The shared `Header` component takes `currentPath` (or uses `usePathname()` internally) so each host route lights up the correct link without forking the component. Footer nav links (`7.2`–`7.5`) follow the same derivation.
- **FR-020**: Award titles and 1-2 line descriptions MUST come from the active-locale i18n catalog. Award `slug` values are language-agnostic identifiers (e.g. `top-talent`) and stay constant across locales — they are NOT translated.

### Technical Requirements

- **TR-001**: SSR-first rendering. The Server Component MUST resolve locale, `isAuthenticated`, `role`, the initial countdown values, and the notification badge state on the server before flushing the response — no client round-trip is allowed before first paint. The countdown is hydrated by a small client island for per-minute ticking; everything else stays static or interactive-via-events. Concrete performance budgets are owned by the project's Lighthouse / CI gates (constitution v1.1.1, Principle II), not duplicated here.
- **TR-002**: The countdown ticker MUST be a client component but everything else SHOULD be Server Components by default (constitution Principle II). Concretely: `Header`, awards grid, footer = Server; `LanguageSelector`, `Countdown`, profile menu trigger, FAB, notification bell trigger = Client.
- **TR-003**: Event start datetime MUST come from the environment variable `SAA_EVENT_START_AT` in ISO-8601 format (e.g. `2025-12-31T18:30:00+07:00`). The Server Component reads this once per render; passes the parsed timestamp to the client `Countdown` component as a prop. Missing or unparseable values MUST trigger the fallback documented in US1 scenario 4.
- **TR-004**: Tailwind CSS v4 tokens only. No raw colors / spacing / shadows in components — extend the token system (in `app/globals.css`) BEFORE referencing new tokens. Reuse the `saa-page`, `saa-page-fg`, `saa-button-primary`, `saa-divider`, `saa-dropdown-surface`, `saa-dropdown-border` tokens already in place.
- **TR-005**: Translations come from the project's custom `t(key, locale)` helper at [src/lib/i18n/index.ts](src/lib/i18n/index.ts) — DO NOT introduce `next-intl` or any other library.
- **TR-006**: Header reuse: the existing `Header` component MUST be extended (not forked) to accept optional slots for nav links, notification, and profile menu. Login keeps its slim variant by passing only `locale` and `isAuthenticated`. See Q4.
- **TR-007**: Per Constitution Principle V (TDD), failing tests for new behavior (countdown ticking, conditional rendering of bell + profile + FAB based on auth state, slug navigation from cards, locale parity for new keys) MUST be written before the implementation. Existing LanguageSelector tests stay untouched.
- **TR-008**: Per Constitution Principle IV (OWASP), all untrusted inputs that reach this screen are read at trust boundaries: `auth()` validates the session cookie; `getSaaLocale()` validates the `saa_locale` cookie value against the allowlist. The Homepage itself does not read any new untrusted input.

### Key Entities

- **Award**: An award category. Fields: `id` (kebab-case slug — e.g. `top-talent`), `titleKey` (i18n key for the title), `descriptionKey` (i18n key for the 1-2 line description), `thumbnailAsset` (path to the card image). The set of six awards is **static configuration** (not DB-backed) for this iteration; defined in a new module `src/lib/awards/awards.ts`. See Q2.
- **EventConfig**: `{ startAt: Date }`. Read once from `SAA_EVENT_START_AT`. No DB row.
- **NotificationsBadge**: `{ unreadCount: number }`. Used only to decide badge visibility on `A1.6`. Read at SSR time per request from a backend endpoint (see API table). Out-of-scope for this spec: the panel itself.
- **User** (existing entity): adds no new fields here. Reuses `id`, `name`, `email`, `image`, `role`, `locale` already established by Login.

---

## State Management

### Local component state

- **Countdown** (`B1` client island): `{ now: number }` derived from `Date.now()`, refreshed via `setInterval(60_000)` (or `setTimeout` chained at the next minute boundary for accuracy). The `eventStart` timestamp is a prop, never mutated.
- **Hover / focus** state on nav links, CTA buttons, award cards: native CSS-driven (Tailwind `hover:` / `focus-visible:`), no React state.
- **Profile menu / FAB / notification bell**: each owns its own `isOpen` boolean — same pattern as `LanguageSelector`. Independent open/close state per overlay.

### Global / shared state

- **Active locale**: owned by the i18n provider already in place (cookie + Server Component read). The Homepage does not introduce its own locale state.
- **Auth state**: owned by Auth.js; the Homepage reads `auth()` once at SSR time and passes `isAuthenticated` + `role` down as props.

### Loading / error state

- Countdown initial render uses the SSR'd values, so there is NO client loading state on first paint.
- Notification badge: SSR fetch — if the upstream API fails, render the bell WITHOUT a badge rather than crashing the page. Logged for ops visibility.
- Awards grid: static config, no loading state.

### Cache / invalidation

- Notification badge SSR fetch SHOULD use Next.js's per-request fetch cache with `revalidate: 30` (seconds) so the same Homepage render burst doesn't re-fetch six times. Per-user cache key (cookie / session ID).
- Translation bundles: served as part of the JS bundle; no runtime cache invalidation needed.

### Persistence read order (for the language chip — already shipped)

Documented in the dropdown spec; not repeated here.

---

## API Dependencies

| Endpoint                          | Method | Purpose                                                                                            | Triggered by                                          | Status                                                                                                                  |
| --------------------------------- | ------ | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| (no API)                          | —      | Read `SAA_EVENT_START_AT` env var for countdown target                                             | Server Component render                               | Existing infra — Next.js loads the env at boot.                                                                          |
| (no API)                          | —      | Read `auth()` session for `isAuthenticated`, `name`, `image`, `role`, `locale` (profile button + role-gated UI) | Server Component render                               | Already shipped via Auth.js + Prisma session augmentation (Login feature). No new endpoint needed for the profile button. |
| `/api/i18n/locale`                | POST   | Persist locale to `User.locale` for authenticated users                                            | LanguageSelector commit (US4 scenario 2)              | **Implemented** ([app/api/i18n/locale/route.ts](app/api/i18n/locale/route.ts)). No change.                                |
| `/api/notifications/unread-count` | GET    | Return `{ unreadCount: number }` for the authenticated user                                        | Server Component render (FR-018)                      | Predicted — backend dependency. If unavailable, render bell with no badge (graceful degradation per State Management §Loading / error). |

> Awards data is **static config in this iteration** — no API. If a future iteration moves it to the DB, a new endpoint `/api/awards` will be predicted; documented in SCREENFLOW for tracking.

> The Homepage itself is read-only — no `POST` / `PATCH` / `DELETE` from this screen.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: First Contentful Paint on `/` renders the hero, header, and event-info block within the budget the constitution mandates for SSR'd routes (no fixed number here — defer to constitution / Lighthouse target on the deployed environment).
- **SC-002**: Countdown stays within ±5 seconds of the wall-clock target across a 1-hour open session in 100% of supported browsers (Chromium, Firefox, WebKit). Tab-inactive recovery (US1 edge case) succeeds within one minute of focus return.
- **SC-003**: All six award cards link to the correct `/awards#<slug>` and the destination scroll-jump works in 100% of clicks (verified by E2E for at least two distinct slugs).
- **SC-004**: Locale switch on the Homepage re-renders 100% of localized strings within the same budget the dropdown spec defines (200 ms perceived). No new strings are missed (parity test stays green).
- **SC-005**: Notification badge correctly reflects `unreadCount > 0` in 100% of Homepage renders.
- **SC-007**: Anonymous requests to `/` are redirected to `/login` in 100% of cases — verified by E2E with no session cookie. Zero Homepage HTML bytes leak to anonymous clients.
- **SC-006**: Admin role sees the "Admin Dashboard" entry in 100% of profile-menu opens for admin sessions; regular users never see it.

---

## Out of Scope

- The Awards Information screen itself (`/awards`) — destination only.
- The Sun* Kudos detail screen (`/sun-kudos`) — destination only.
- The Tiêu chuẩn chung screen (`/general-rules`) — destination only; route name pending Q1.
- The notification panel content / live updates / mark-as-read — only the badge and bell trigger are in scope.
- The profile dropdown content (`z4sCl3_Qtk` / `54rekaCHG1`) — only the trigger button is in scope.
- The FAB quick-action menu content — only the trigger button visibility/anchoring is in scope.
- Adding new locales beyond `vi-VN` / `en-US`.
- Award data moving to the DB — static config sufficient for this iteration.
- Marketing analytics / GA / page-view tracking — handled at a higher layer if/when introduced.

---

## Dependencies

- [x] Constitution document exists (`.momorph/constitution.md`)
- [x] Login screen + auth scaffolding shipped — `auth()`, `User.role`, `User.locale`, `saa_locale` cookie
- [x] LanguageSelector + i18n helper + cookie helper shipped
- [x] Tailwind v4 token system in place (`app/globals.css`)
- [x] Screen flow documents this screen (`.momorph/SCREENFLOW.md` updated 2026-05-07)
- [x] Login screen spec for cross-references (`.momorph/specs/GzbNeVGJHz-login/spec.md`)
- [x] Dropdown spec for cross-references (`.momorph/specs/hUyaaugye2-dropdown-ngon-ngu/spec.md`)
- [ ] Backend endpoint `/api/notifications/unread-count` (or substitute graceful-degradation rendering)
- [ ] Routes `/awards`, `/sun-kudos`, `/general-rules` defined elsewhere (this spec only emits links)
- [ ] Profile-dropdown component spec (`z4sCl3_Qtk` and `54rekaCHG1`) — needed before authenticated profile menu can be fully wired

---

## Resolved Questions

- **Q1 — Footer "Tiêu chuẩn chung" route.** **Resolved 2026-05-07: `/general-rules`.** All references updated. The route itself (the destination screen) is owned by a separate spec.
- **Q2 — Awards data source.** **Resolved 2026-05-07: static hardcoded config.** The six awards live in a new module `src/lib/awards/awards.ts` (per FR-011). Titles + descriptions resolve at SSR time via i18n catalog lookups (`titleKey` / `descriptionKey`). No DB schema, no `/api/awards` endpoint. If a future iteration migrates the list to a CMS, a new spec will redefine FR-011 and add the API row.
- **Q3 — FAB visibility for unauthenticated users.** **Resolved 2026-05-07 by access-control change: not applicable.** The Homepage is now authenticated-only (FR-001a, US0); anonymous users never reach the screen. FR-015 simply requires the FAB to render on every Homepage paint.
- **Q4 — Header reuse strategy.** **Resolved 2026-05-07: extend the existing `Header` component (option a).** Login keeps its slim variant by passing only `locale` + `isAuthenticated`. Homepage passes additional optional slots (`nav`, `notification`, `profileMenu`) per TR-006. No `HomeHeader` fork.
- **Q5 — Sign-in CTA on the unauthenticated Homepage.** **Resolved 2026-05-07 by access-control change: not applicable.** Anonymous users are redirected to `/login` before any Homepage chrome renders, so there is no "unauthenticated header" to add a CTA to.
- **Q6 — Notification bell click behavior in this iteration.** **Resolved 2026-05-07: option (b) — show a "Coming soon" toast.** When the user clicks the bell on the Homepage, a non-blocking toast surfaces a localized "Coming soon" message (catalog keys to be added in both `vi-VN.json` and `en-US.json`). The bell still renders and shows the unread indicator per FR-018; only the click-action is a stub until the notification panel spec ships. Toast component is the project's existing notification primitive; if none exists yet, the implementer adds a minimal one (deferred to plan).
- **Q7 — Countdown screen-reader announcement.** **Resolved 2026-05-07: option (a) — no live announcement.** The countdown tiles are decorative for assistive tech in this iteration. The surrounding text ("Coming soon" subtitle, event metadata `B2`, hero copy) is read once at page load and is sufficient for context. The numeric tiles are NOT wrapped in `aria-live` — the visual clock continues to tick (sighted users see fresh numbers) without producing any spoken announcements. If a future iteration needs accessibility parity for time-sensitive content (e.g., live event countdowns inside the last hour), a follow-up spec can revisit this with the dynamic-cadence pattern (announce hourly far from zero, per-minute in the last hour).

---

## Notes

- The existing Header has only Logo + LanguageSelector. The Homepage's full header needs nav links + notification + profile. The cleanest reuse is to extend the existing `Header` with optional `nav?: ReactNode`, `notification?: ReactNode`, `profileMenu?: ReactNode` slots — Login passes none, Homepage passes all three. This is the path TR-006 recommends.
- Figma frame `2167:9091` for the header is itself an instance of `186:1602` — i.e. the header is a designed reusable component in Figma. That confirms the shared-header strategy.
- Award cards (`C2.1`–`C2.6`) all share the same instance shape; implement as a single `AwardCard` React component driven by an awards-config array.
- The "selected" treatment on `A1.2` (About SAA 2025) assumes the URL is `/`. On `/awards`, that selected state shifts to `A1.3`; on `/sun-kudos` to `A1.5`. The selected-state derivation logic SHOULD live in the shared `Header` component, driven by `usePathname()` or by a `currentRoute` prop. Out of scope to fully implement here — but the design contract is documented.
- Test cases attached to the Figma frame (60+, see `get_frame_test_cases`) cover header layout, countdown auto-update + fallback, language switch, notification badge, profile menu admin/non-admin variation, award card hashtag navigation, and footer links. The `momorph.createtestcases` step on this screen should fold those into the test plan.
- This screen is the last anchor needed before downstream specs (Awards Information, Sun* Kudos, Profile dropdown user/admin, Notification panel, General Rules) can begin in parallel.
- **Auth-gate symmetry**: Homepage redirects anon → `/login` (US0/FR-001a); Login redirects authed → `/` (Login spec US2). Together they form a closed two-state machine. The chain MUST NOT introduce a third state — for example, do NOT render a partially-public Homepage variant for anon users, since that re-opens the question of which slots are visible to whom.
