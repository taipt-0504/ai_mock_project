# Feature Specification: Countdown — Prelaunch Page (Global Pre-Launch Gate)

**Frame ID**: `8PJQswPZmU` (Figma node `2268:35127`)
**Frame Name**: `Countdown - Prelaunch page`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Created**: 2026-05-08 (rewritten 2026-05-08 to reflect global-gate architecture)
**Status**: Ready for `momorph.plan` (2026-05-08). All eight pending questions resolved (Q-CP1..Q-CP5, Q-PG1..Q-PG5 — see § Resolved Decisions). No `[NEEDS CLARIFICATION]` markers remain in FR/TR.

---

## Reuse Map (existing artifacts to leverage)

The visible UI of the prelaunch screen is **a stripped-down wrapper around the Homepage SAA countdown component**. The infrastructure that places that UI in front of every visitor is **new**. The implementation MUST reuse existing artifacts where they apply and add only the gate-layer pieces.

| Concern | Existing artifact (REUSE) | Action on this screen |
| --- | --- | --- |
| Days / Hours / Minutes countdown tiles | [src/components/home/Countdown.tsx](../../../src/components/home/Countdown.tsx) | Mount as the only foreground content. Tile shape, two-digit zero-pad, minute-tick driver, `visibilitychange` resync — all already implemented for Homepage SAA Phase 13. **Plan MUST extend** `Countdown` with an optional prop `subtitleAs?: "p" \| "h1"` (default `"p"`) so the prelaunch route can render the same string as `<h1>` while Homepage's existing `<p>` rendering is untouched (Q-CP5 resolved). The component MUST also accept the i18n key for its subtitle as a prop OR consume `prelaunch.heading` directly when invoked from the prelaunch route — see Q-CP4 resolution. |
| Locale resolution (server) | [src/lib/cookies/saa-locale.ts](../../../src/lib/cookies/saa-locale.ts) (`getSaaLocale`) | Use in the prelaunch route Server Component to derive locale before rendering the heading. Identical to Login / Homepage. |
| Translation helper + catalogs | [src/lib/i18n/index.ts](../../../src/lib/i18n/index.ts) + `src/lib/i18n/catalogs/{vi-VN,en-US}.json` | Add a NEW dedicated key `prelaunch.heading` to BOTH catalogs in lockstep (vi-VN: "Sự kiện sẽ bắt đầu sau" or equivalent; en-US: "Coming soon" or equivalent) — Q-CP4 resolved to a dedicated key, NOT reusing `home.hero.subtitle`. The parity test (`tests/unit/lib/i18n/parity.test.ts`) WILL fail if the key is added to one catalog only. Unit labels (DAYS/HOURS/MINUTES) inherit the existing `Countdown` component's `home.hero.countdown.{days,hours,minutes}` keys — no change. |
| Typed config module | [src/lib/config.ts](../../../src/lib/config.ts) | The new env var (working name `SAA_LAUNCH_AT`, see Q-PG1) MUST be added to the Zod schema and exposed via `config.SAA_LAUNCH_AT`. No direct `process.env` reads outside this module (Constitution § Configuration). |
| Background key art | Same SAA root-system illustration family as Homepage hero (`3.5` keyvisual) — `MM_MEDIA_BG Image` (`2268:35129`) + dark `Cover` overlay (`2268:35130`) | Treat as a shared media token. Implementation phase fetches the asset on demand (`get_media_files` / `list_media_nodes`); spec does not enumerate filenames. |

| Concern | NEW artifact to add | Notes |
| --- | --- | --- |
| Launch datetime parser | Extend [src/lib/event/event-config.ts](../../../src/lib/event/event-config.ts) with `parseLaunchAt(envValue): Date \| null` | Mirrors the existing `parseEventStart` shape (returns `null` for missing / malformed). Co-located with `parseEventStart` since both are SAA event-config helpers. |
| Global gate proxy | [`proxy.ts`](../../../proxy.ts) at the project root — **already exists** (shipped with Login: stamps `x-request-id`, applies OWASP security headers via `applySecurityHeaders`, and runs an in-process token-bucket rate limit on `/api/auth/callback/*` per Login spec TR-007). Tests at [tests/integration/login/proxy-headers.test.ts](../../../tests/integration/login/proxy-headers.test.ts) and [tests/integration/login/proxy-rate-limit.test.ts](../../../tests/integration/login/proxy-rate-limit.test.ts). | **EXTEND** the existing proxy — do NOT create a parallel file. Add a gate-evaluation step that runs **before** the existing security-headers / rate-limit pipeline. The gate either returns a 307 redirect (non-whitelisted requests during the active window, or `/coming-soon` post-gate-lift) or falls through to the existing pipeline. Redirect responses MUST flow through `applySecurityHeaders` so CSP/HSTS/etc. attach (TR-002 A05) and MUST stamp `x-request-id`. The existing rate-limit branch becomes unreachable during gate-active because `/api/auth/*` is NOT whitelisted (Q-PG4) — acceptable; rate-limit serves post-gate-lift only. **Next.js 16 convention note**: the project is on Next.js 16.2.4 (Constitution § Technology Stack); the `proxy.ts` filename + exported `proxy` function are the Next.js 16 convention (renamed from `middleware.ts`; see [upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16#middleware-to-proxy)). The `proxy` runtime is Node.js — Edge runtime is not supported (TR-001). The current docstring in `proxy.ts` calls itself "Edge-runtime"; that string is **stale** and MUST be corrected as part of this work. |
| Prelaunch route component | `app/coming-soon/page.tsx` (Q-PG3 resolved to `/coming-soon`) | Thin Server Component: reads the env via `config`, parses with `parseLaunchAt`, passes the resulting `Date` to `<Countdown subtitleAs="h1" subtitleKey="prelaunch.heading">`. Auth-agnostic — does NOT call `auth()`. Does NOT need its own gate check; proxy owns FR-008. |

**Cross-spec dependencies**: This spec **no longer depends on Homepage SAA's `SAA_EVENT_START_AT` contract**. The two countdowns are now anchored on **two independent env vars**:

- `SAA_EVENT_START_AT` → unchanged Homepage `B1` countdown (counts to the SAA event/ceremony start).
- `SAA_LAUNCH_AT` → this spec's countdown (counts to when the program/site opens to users — i.e. when the gate lifts).

Logically `SAA_LAUNCH_AT <= SAA_EVENT_START_AT` (the site opens before the ceremony) but **this is not enforced in code** — they are operator-managed configs. The gate-lift event and the SAA ceremony are distinct moments.

> **Important**: Homepage SAA is **shipped and locked** (Status header reads "Implemented (shipped 2026-05-07). All 73 tasks ... `[x]`. Verification gates green: vitest 184/184, Playwright Homepage 11/11 + Login regression 16/16."). The global-gate architecture intentionally **does NOT modify [app/page.tsx](../../../app/page.tsx)** or any other shipped route handler — the gate sits at the proxy layer, *above* the route layer. Shipped routes continue to compile, type-check, and pass their existing tests; the proxy simply intercepts requests before any route handler runs. **However** — Homepage's existing Playwright regression suite assumes anonymous-`/`-redirects-to-`/login`; with the gate active that assertion is overridden by the proxy. The Homepage Playwright suite MUST be re-run with `SAA_LAUNCH_AT` set to a past ISO-8601 timestamp (gate disabled — note that with Q-PG2 = always fail closed, "unset" means gate ACTIVE, not disabled) — see TR-005.

---

## Overview

The Countdown — Prelaunch page is a **global pre-launch gate** for the SAA 2025 program. Until the gate-lift datetime (`SAA_LAUNCH_AT`), it is the only route any visitor can reach: every other URL — `/`, `/login`, `/awards`, `/sun-kudos`, `/profile`, `/general-rules`, and every API route except whitelisted infrastructure paths — is redirected here at the proxy layer. Once the gate lifts, the prelaunch route itself becomes unreachable and the rest of the app resumes its normal access semantics.

**Visible UI**: a deliberately minimal full-bleed surface with the SAA root-system key art, a localized heading from the dedicated i18n key `prelaunch.heading` (Q-CP4), and a Days/Hours/Minutes countdown anchored on `SAA_LAUNCH_AT`. No header. No footer. No nav. No CTA. No interactive controls.

**Target users**: every visitor — anonymous or authenticated — who attempts to reach any route in the SAA app while `now() < SAA_LAUNCH_AT`. The gate is **auth-agnostic**: a logged-in user with a valid session sees the prelaunch screen *exactly* like a never-seen-this-site visitor does, because the proxy does not consult the Auth.js session.

**Business context**: SAA 2025 is launched in two phases — first the program/site opens to users (the moment `SAA_LAUNCH_AT` elapses), then the actual award ceremony happens (the moment `SAA_EVENT_START_AT` elapses, which is later). During the pre-launch phase, the team needs the entire surface area of the app to be invisible to users — even authenticated employees who somehow obtained an early-access link should not be able to bypass the gate. The prelaunch page is the only legitimate pre-launch surface; everything else is hidden behind it.

**What this spec is NOT**:
- Not a refactor of the existing `Countdown` component (Homepage Phase 13 ships it; this spec reuses it).
- Not a modification to any shipped route handler. The gate sits in proxy, above the route layer.
- Not an admin tool to flip the gate at runtime — `SAA_LAUNCH_AT` is operator-set + redeploy.
- Not a deep-link-preservation system. A user redirected from `/awards` to prelaunch during the gate window does NOT get sent back to `/awards` post-gate-lift; they land on `/` and follow the normal flow from there.
- Not a notification/email surface for "the gate has lifted".

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — See live countdown to gate-lift (Priority: P1)

A visitor (anon or authed) lands on any URL in the SAA app while the prelaunch period is active. The proxy redirects them to the prelaunch route, where they see the localized `prelaunch.heading` string (e.g. "Sự kiện sẽ bắt đầu sau" / "Coming soon") plus three tiles showing remaining days, hours, and minutes until `SAA_LAUNCH_AT`. The values tick down at minute granularity and re-sync when the tab regains focus.

**Why this priority**: This is the only thing the visitor sees during the entire prelaunch window. Without it, the gate would be a blank wall. P1.

**Independent Test**: Set `SAA_LAUNCH_AT` to `now + 5 days 3 hours 17 minutes`. From a fresh browser session (no cookies), visit `/`. Verify the response is a server-side redirect to the prelaunch path. Verify the prelaunch page renders with three tiles showing `05`, `03`, `17`. Wait one minute → minutes tile decrements to `16` (or rolls over). Tab-switch for ≥ 1 minute, return → tiles re-sync. Repeat with a session cookie present — same outcome (auth-agnostic).

**Acceptance Scenarios**:

1. **Given** `parseLaunchAt(SAA_LAUNCH_AT) > now()` and a visitor (anon or authed) requests the prelaunch path directly, **When** the screen renders, **Then** the heading is visible above a horizontal row of three tiles labelled `DAYS`, `HOURS`, `MINUTES`. Each tile shows two zero-padded digits computed by the existing `Countdown` component's `computeParts` against the `SAA_LAUNCH_AT` `Date`.
2. **Given** the countdown is rendered with non-zero minutes, **When** one minute elapses on the wall clock, **Then** the minutes tile decrements by 1 (or rolls over: minutes `00` → minutes `59` and hours decrements; analogously hours → days). No reload required.
3. **Given** the countdown renders with single-digit values (e.g. days `5`, hours `9`, minutes `0`), **When** the screen renders, **Then** every tile shows two digits with a leading zero (`05`, `09`, `00`) — the existing `pad2` rule.
4. **Given** the prelaunch tab is backgrounded for several minutes, **When** the visitor refocuses, **Then** tiles re-sync immediately via the existing `visibilitychange` handler — no drift.
5. **Given** an authenticated user with a valid Auth.js session cookie, **When** they request the prelaunch path or any other path, **Then** the rendered prelaunch UI is **identical** to what an anonymous visitor sees. The proxy MUST NOT branch on session state.

---

### User Story 2 — Global redirect of every non-whitelisted route to prelaunch during the gate window (Priority: P1)

While the prelaunch period is active, every request to any non-whitelisted URL — `/`, `/login`, `/awards`, `/sun-kudos`, `/profile`, `/general-rules`, every Auth.js route (`/api/auth/*`), and every other application API route — MUST be intercepted at the proxy layer and redirected to the prelaunch path. No application route handler runs; no Homepage HTML or Login HTML is flushed; no Auth.js callback completes.

**Why this priority**: The gate IS the prelaunch product. Without this, US1's countdown is just an optional surface someone has to know about — not a gate. Every route that escapes the redirect is a leak. P1.

**Independent Test**: Set `SAA_LAUNCH_AT` to a future timestamp. From a fresh browser session, request each of the shipped routes in turn: `/`, `/login`, `/awards`, `/sun-kudos`, `/profile`, `/general-rules`, plus an Auth.js path (`/api/auth/session`). Each MUST respond with a server-side redirect (302/307) to `/coming-soon`. Repeat with a valid session cookie — same outcome. Then explicitly verify whitelisted paths (Next.js internals, static assets, `/coming-soon` itself) are reachable without redirect.

**Acceptance Scenarios**:

1. **Given** `parseLaunchAt(...) > now()`, **When** an anonymous visitor requests `/`, `/login`, `/awards`, `/sun-kudos`, `/profile`, `/general-rules`, or any other shipped non-whitelisted route, **Then** the proxy MUST issue a server-side redirect to the prelaunch path BEFORE any route handler runs. No HTML or JSON from the redirected route MAY reach the browser.
2. **Given** `parseLaunchAt(...) > now()` and a valid Auth.js session cookie, **When** the same set of requests is made, **Then** the redirect outcome is identical — session state is NOT consulted.
3. **Given** `parseLaunchAt(...) > now()`, **When** a request hits any whitelisted path (Next.js internals `/_next/*`, public static assets, `/coming-soon` itself, the favicon, `/api/health` if added per FR-007), **Then** the proxy MUST allow the request through unchanged.
4. **Given** `parseLaunchAt(...) > now()`, **When** an unauthenticated visitor attempts to begin OAuth login by requesting `/login` or by directly POSTing to the Auth.js `signIn` endpoint, **Then** the proxy redirects them to the prelaunch path. Login is unreachable during the gate window — by design.
5. **Given** the gate is active across many requests within a minute, **When** the proxy runs on each request, **Then** each request adds ≤ 5ms to TTFB (TR-001 budget). The gate decision is a pure compare against `config.SAA_LAUNCH_AT` parsed once per request — no DB hit, no fetch, no session lookup.

---

### User Story 3 — Prelaunch becomes unreachable after gate-lift (Priority: P1)

Once `now() >= SAA_LAUNCH_AT`, the prelaunch route is **no longer a destination**. Visitors who land on it (via stale links, browser history, etc.) are redirected to `/`, where Homepage's existing `US0` auth gate takes over (anon → `/login`, authed → render Homepage). Other routes resume their normal access semantics — Homepage's auth gate works again, Login becomes reachable, etc.

**Why this priority**: Without this story, post-launch the prelaunch URL still serves a frozen all-zeros countdown — confusing users and contradicting reality. P1, symmetric with US2.

**Independent Test**: Set `SAA_LAUNCH_AT` to a past timestamp (gate is "lifted"). Request the prelaunch path → verify a server-side redirect to `/`. As an anonymous visitor, that redirect chain ends at `/login` (Homepage US0); as an authenticated visitor, it ends on Homepage. Request other routes (`/login`, `/awards`, etc.) → verify the proxy does NOT redirect them; they resolve to their normal handlers.

**Acceptance Scenarios**:

1. **Given** `parseLaunchAt(...) <= now()`, **When** any visitor requests `/coming-soon`, **Then** the response MUST be a server-side redirect to `/` (Q-PG5 resolved). No prelaunch markup is served. The `Countdown` component's `00/00/00` memorial state is NOT rendered to the user.
2. **Given** `parseLaunchAt(...) <= now()`, **When** any visitor requests any other route, **Then** the proxy MUST NOT intervene — the request reaches its normal handler. Homepage US0 (anon → `/login`), Login US2 (authed → `/`), and every other access rule resumes.
3. **Given** `parseLaunchAt(...) <= now()` and a user has the `/coming-soon` tab open across the moment when `now()` crosses the threshold, **When** the underlying `Countdown` component reaches its `isInPast: true` branch, **Then** within ≤ 1 minute (the `Countdown` minute tick) the surface MUST hand off to `/`. Acceptable mechanisms: (a) on-tick client-side `router.refresh()` that re-runs the proxy (which now redirects `/coming-soon` → `/`), (b) a server-side soft-revalidation tag the client opts into. Exact mechanism is plan-phase; the visitor-observable outcome is "no frozen `00 00 00` after launch".
4. **Given** an authenticated user was issued a valid session during a previous post-gate-lift visit, was then signed out by ops, **When** they revisit the prelaunch path post-gate-lift, **Then** the redirect chain (prelaunch → `/` → `/login` via Homepage US0) clears them out symmetrically. No special-case logic.

---

### User Story 4 — No interactive surface (Priority: P2)

The prelaunch page is **deliberately inert**: no header, no footer, no nav, no language switcher, no profile menu, no notification bell, no CTA button, no clickable logo, no "notify me" form. Visitors arriving here can only read the countdown — there is nothing to click.

**Why this priority**: Important for marketing intent (focus on the moment) and spec correctness (any future "let's add a 'Subscribe for updates' button" request is a deliberate amendment, not an oversight). P2 — a regression that adds chrome here is a defect.

**Independent Test**: Open the prelaunch URL in a fresh session. Verify no `<header>`, no `<footer>`, no `<nav>`. Pressing Tab from a fresh page load does not focus any in-page control. The DOM contains zero `<button>` / non-metadata `<a>` elements.

**Acceptance Scenarios**:

1. **Given** the prelaunch screen is rendered, **When** the visitor inspects the DOM, **Then** there is no `<header>`, no `<footer>`, no `<nav>`, no language-selector chip, no logo link, no notification bell, no profile button, and no `<button>` / `<a>` element exposing user-facing navigation. (`<a rel="canonical">` and similar `<head>` metadata are exempt.)
2. **Given** the prelaunch screen is rendered, **When** the visitor presses Tab from a fresh page load, **Then** focus does not land on any prelaunch-owned interactive control.
3. **Given** the prelaunch screen is rendered, **When** the visitor uses keyboard or mouse, **Then** there is no in-page click target that triggers navigation, mutation, network request, or state change.

---

### Edge Cases

- **Single-minute remaining**: when only minutes (no days, no hours) remain, days and hours tiles MUST show `00` — inherited from `Countdown.tsx`'s arithmetic.
- **Past datetime (gate lifted)**: handled by US3 — the prelaunch route redirects to `/`.
- **Missing / malformed `SAA_LAUNCH_AT`**: always fail closed (Q-PG2 resolved). The proxy behaves AS IF the gate is active across every `NODE_ENV`. Operations gets a clear signal — production never accidentally launches early, AND local dev / CI receive a hard failure mode that surfaces the unset env immediately rather than masking it. The trade-off: every environment MUST set `SAA_LAUNCH_AT` to either a past timestamp (gate disabled) or a future timestamp (gate active); leaving it unset blocks the entire app from local dev. See FR-009 / TR-005 for the dev / CI workflow consequences.
- **Clock skew between user device and server**: the `Countdown` component reads `new Date()` on the client. If the user's local clock is wrong by minutes, their tiles can drift from the true remaining time. Known limitation inherited from Homepage; out of scope to fix here.
- **Tab backgrounded across minutes**: handled by US1 scenario 4.
- **First paint before client hydration**: `Countdown` renders `--` placeholders for `eventStart === null` OR before the first `useEffect` reconciliation. Acceptable.
- **Crossing the zero boundary while a tab is open on prelaunch**: handled by US3 scenario 3 — within one minute, the surface hands off to `/`.
- **Crossing the zero boundary while a tab is open on a non-prelaunch route**: cannot happen during the gate window because the proxy would have redirected that request away. After-gate-lift, this situation is not gate-relevant.
- **Pre-existing valid session at gate-lift moment**: a user with a valid session cookie was redirected to prelaunch throughout the gate window. The session cookie was untouched — no `auth()` call ran on prelaunch requests. Once the gate lifts and the user navigates anywhere, their session resumes normally. No re-authentication required.
- **OAuth flow attempted during the gate window**: the user clicks something (perhaps a stale link) that triggers OAuth init. The proxy redirects the OAuth init request to prelaunch. The OAuth provider never receives the request. This is the intended behavior — no special-case handling needed.
- **Deep-link preservation**: a user arrived during the gate window targeting `/awards#some-award`. After gate-lift, they would have to navigate back manually — the proxy does NOT remember and replay the original target. Out of scope for v1; flagged in § Out of Scope.
- **Prelaunch endpoint hit by uptime monitors / health checks during the gate**: a hypothetical `/api/health` (none ships today) is whitelisted by FR-007 if added — uptime monitors keep working through the gate window.
- **Race at the zero boundary on the server**: a request hits the proxy at a moment ambiguous between "gate active" and "gate lifted" because of sub-millisecond clock differences. The proxy reads `now()` once per request and decides; the result is deterministic for that request. Subsequent requests resolve consistently because clocks move forward.
- **Request to a non-existent path during the gate**: a 404 path (e.g. `/typo-foo`) hits the proxy first; the proxy redirects it to the prelaunch path (since it is not whitelisted). The user does NOT see a 404 during the gate window. Post-gate-lift, 404 paths reach Next.js's normal 404 handler. This is intentional — the gate is total during its window.
- **API caller expecting JSON during the gate**: any external or internal client that calls an application API route (e.g. `/api/notifications/unread-count`) during the gate gets the redirect response (HTML body, `Location` header) instead of JSON. In practice this should not happen because the application's own UI is gated and never makes those calls; external callers are out of contract during the gate window. If a client integration relies on a specific API being callable during the gate, that path MUST be added to the FR-007 whitelist via amendment with security review (per TR-002 A04).
- **Operator misconfigures `SAA_LAUNCH_AT` to a far-future datetime**: gate is effectively permanent until ops corrects it. Mitigated by deployment-time review of env values; not solvable in spec.

---

## UI/UX Requirements *(behavior only — see SCREENFLOW for Figma node IDs)*

### Screen Components

| Component | Node ID | Description | Interactions |
|-----------|---------|-------------|--------------|
| Background key art | `2268:35129` | Full-bleed SAA root-system illustration. Same asset family as Homepage hero `3.5`. Implementation fetches via `get_media_files` / `list_media_nodes` at build/asset-prep time. | None — purely decorative. |
| Dark cover overlay | `2268:35130` | Dark overlay on top of the BG image to keep the countdown legible. | None. |
| Centered content container | `2268:35131` (`Bìa`) | Centered flex column wrapping heading + countdown row. | None. |
| Heading text | `2268:35137` | Localized text from i18n key `prelaunch.heading` (e.g. vi-VN: "Sự kiện sẽ bắt đầu sau" / en-US: "Coming soon"). Renders as `<h1>` via `Countdown`'s new `subtitleAs="h1"` prop (Q-CP5 resolved). | None — non-interactive. |
| Days unit | `2268:35139` (`1_Days`) | Two-digit zero-padded display + `DAYS` label. Range `00`+. Shows `00` if `< 1` day remains. | None — display only. Auto-updates per the `Countdown` minute tick. |
| Hours unit | `2268:35144` (`2_Hours`) | Two-digit zero-padded display + `HOURS` label. Range `00`–`23`. Out-of-range upstream values normalize to `00` (existing `Countdown` arithmetic guarantees this by construction). | None — display only. |
| Minutes unit | `2268:35149` (`3_Minutes`) | Two-digit zero-padded display + `MINUTES` label. Range `00`–`59`. Out-of-range upstream values normalize to `00` (same guarantee). | None — display only. |

> Visual / pixel / color / font / spacing / asset-filename details are deliberately out of scope here. They live in Figma (fetched by the implementer via `query_section`, `get_node`, `list_media_nodes`) and inherit the existing `Countdown` component's already-shipped styling. See [.momorph/SCREENFLOW.md](../../SCREENFLOW.md) "Screen Details — Countdown - Prelaunch page" for the structural map.

### Navigation Flow

- **Entry (during gate window, `now() < SAA_LAUNCH_AT`)**: every non-whitelisted URL in the SAA app — `/`, `/login`, `/awards`, `/sun-kudos`, `/profile`, `/general-rules`, plus every API route except whitelisted ones — is redirected by proxy to the prelaunch path. There is no other way onto the screen, and no other screen is reachable.
- **Entry (after gate-lift, `now() >= SAA_LAUNCH_AT`)**: `/coming-soon` is unreachable as a destination. Direct visits via stale links or browser history get redirected to `/` (Q-PG5 resolved), where Homepage's existing `US0` decides.
- **Exit (during gate window)**: there is no user-driven exit. The visitor either waits, leaves the site entirely, or returns when the gate has lifted.
- **Exit (logical, at gate-lift)**: the prelaunch route hands off to `/` — see US3 scenario 3 for the in-tab transition mechanism.

### Accessibility (WCAG 2.1 AA — Constitution Principle III)

- **Semantic landmarks**: the prelaunch route MUST use a `<main>` element to wrap the visible content even though there is no `<header>`/`<nav>`/`<footer>`.
- **Heading order**: the heading MUST render as `<h1>` — the prelaunch route has no other headings, and this is the page's primary content title. The existing `Countdown` component renders the same string as `<p>` for Homepage; Q-CP5 resolved → extend the component with an optional `subtitleAs?: "p" | "h1"` prop (default `"p"`) so the prelaunch route can opt into `<h1>` without forking.
- **Color contrast**: digit and label foregrounds MUST meet WCAG AA against the dark-overlaid background. The existing `Countdown` already meets this on Homepage; reused.
- **Reduced motion**: per-minute tick is a value swap, not animation. No `prefers-reduced-motion` guard required.
- **Keyboard reachability**: there are no interactive controls; the requirement is vacuously satisfied. Verify via test that Tab from a fresh load lands on no in-page control (US4 scenario 2).
- **Screen-reader announcement**: the underlying `Countdown` component does not use an `aria-live` region (Homepage shipped without one and audited as acceptable for a marketing countdown). The prelaunch screen INHERITS this decision.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render the prelaunch surface at `/coming-soon` when `parseLaunchAt(config.SAA_LAUNCH_AT) > now()`. The surface MUST contain exactly: the SAA root-system background, the dark overlay, the localized heading rendered as `<h1>` from i18n key `prelaunch.heading`, and the three Days/Hours/Minutes tiles via the existing [`Countdown`](../../../src/components/home/Countdown.tsx) component (extended with `subtitleAs="h1"`) anchored on `SAA_LAUNCH_AT`.
- **FR-002**: The prelaunch route Server Component MUST be **auth-agnostic** — it MUST NOT call `auth()`, MUST NOT read the session cookie, and MUST NOT branch on session state. Anonymous and authenticated visitors see the identical UI.
- **FR-003**: System MUST NOT render any header, footer, navigation, language selector, logo link, notification bell, profile menu, or call-to-action button on the prelaunch surface (US4).
- **FR-004**: System MUST display days remaining, hours-within-day remaining, and minutes-within-hour remaining via the existing `Countdown` component's `computeParts` arithmetic. Values MUST be zero-padded to two digits via `pad2`.
- **FR-005**: System MUST tick the values once per minute and re-sync when the document `visibilitychange` event fires with `visibilityState === "visible"`. Inherited from `Countdown`.
- **FR-006 (Global gate)**: A Next.js `proxy.ts` at the project root MUST run on every request. While `parseLaunchAt(config.SAA_LAUNCH_AT) > now()`, the proxy MUST issue a server-side redirect (HTTP 307 preferred — preserve method) to the prelaunch path for every request that does not match the whitelist (FR-007). The redirect MUST happen BEFORE any route handler, layout, page, or API handler runs. **The proxy therefore short-circuits Homepage's existing `auth()` call (in [app/page.tsx](../../../app/page.tsx)) during the gate window** — the auth call never fires because the request never reaches the route handler.

  **Proxy decision matrix** (the entire gate behavior in one table):

  | Request path | Gate active (`parseLaunchAt > now()` OR `parseLaunchAt === null`) | Gate lifted (`parseLaunchAt <= now()`) |
  | --- | --- | --- |
  | Prelaunch path itself | Pass through (renders the prelaunch UI) | Redirect to `/` (FR-008) |
  | Whitelisted infrastructure path (FR-007) | Pass through | Pass through |
  | Any other application route or API | Redirect to prelaunch path | Pass through (normal route handler runs) |

  > Note: `parseLaunchAt === null` (env unset / empty / malformed) falls into the **gate-active** column regardless of `NODE_ENV` — Q-PG2 resolved to always-fail-closed (FR-009).

  The route handler at the prelaunch path does **not** need its own gate check — the proxy owns FR-008. If the proxy fails to register or is bypassed, the all-zeros memorial state would briefly leak; that is a deployment-config problem, not a route-handler responsibility.
- **FR-007 (Gate whitelist)**: While the gate is active, the proxy MUST allow ONLY the following request paths through unchanged:
  - The prelaunch route itself: `/coming-soon`.
  - Next.js internals: `/_next/*`.
  - Static assets served from `/public/*` (typically rewritten by Next; implementer confirms in plan-phase).
  - The favicon and similar root-level static files.
  - Diagnostic / health endpoints — `/api/health` if such a route exists or is added (none currently shipped). Adding new diagnostic paths to the whitelist requires security review (TR-002 A04).
  - **NOT whitelisted** (Q-PG4 resolved): all Auth.js routes (`/api/auth/*`, including `callback`, `csrf`, `session`, `signin`, `signout`). Rationale — `/login` is unreachable during the gate, so OAuth init never happens, so the callback path receives no legitimate traffic. Allowing it open would create a probe surface during the gate window. Every Auth.js path is redirected to `/coming-soon` like any other application route.
- **FR-008 (Post-gate redirect of the prelaunch path)**: When `parseLaunchAt(...) <= now()`, requests to `/coming-soon` MUST receive a server-side redirect (HTTP 307) to `/` (Q-PG5 resolved → always `/`). Homepage's existing US0 then handles anon → `/login` and authed → render Homepage; the prelaunch route does NOT duplicate that logic. The prelaunch UI MUST NOT render and MUST NOT serve a memorial `00/00/00` state.
- **FR-009 (Missing / malformed env — always fail closed)**: When `parseLaunchAt(...) === null` (env unset, empty, or unparseable as ISO-8601), the proxy MUST behave AS IF the gate is active **regardless of `NODE_ENV`** (Q-PG2 resolved → always fail closed). The proxy redirects every non-whitelisted request to `/coming-soon`; the prelaunch route renders `--/--/--` placeholders via the existing `Countdown` fallback. Rationale: maximum safety — no scenario where the gate accidentally lets traffic through because of a missing env. **Consequence for local dev and CI** — `SAA_LAUNCH_AT` MUST be set explicitly in every environment (production, development, test, CI). To run the app with the gate **disabled** (e.g. for non-prelaunch CI suites and routine local dev), set `SAA_LAUNCH_AT` to a past ISO-8601 timestamp. To run the app with the gate **active**, set it to a future timestamp. The plan MUST update `.env.example`, the dev onboarding doc, and the CI workflow files accordingly.
- **FR-010 (Heading from i18n)**: Heading text MUST come from the i18n catalog. The key is `prelaunch.heading` (Q-CP4 resolved → dedicated key, NOT reuse of `home.hero.subtitle`). Both catalogs (`vi-VN`, `en-US`) MUST be updated in lockstep — the parity test will fail otherwise. The string MUST NOT be hard-coded in the route component.
- **FR-011 (Unit labels from i18n)**: Unit labels (`DAYS` / `HOURS` / `MINUTES`) inherit the existing `Countdown` component's i18n keys (`home.hero.countdown.days` etc.) — already localized for `vi-VN` and `en-US`.

### Technical Requirements

- **TR-001 (Proxy performance + runtime)**: The gate decision MUST add ≤ 5ms p50 / ≤ 15ms p99 to TTFB on every request. The decision is a pure compare: read `config.SAA_LAUNCH_AT` (already parsed at module load), compare against `new Date()`. No DB query, no `fetch`, no `auth()` call. **Runtime**: Next.js 16 `proxy.ts` runs on the **Node.js runtime** — the Edge runtime is **NOT supported** in `proxy` (per the [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16#middleware-to-proxy); the `proxy` runtime is `nodejs` and cannot be configured otherwise). Full Node APIs (`fs`, Node `crypto`, etc.) are technically available, but the gate logic intentionally uses only `Date`, `URL`, and string comparison to keep the perf budget tight. Any I/O addition (file reads, network calls, DB queries) in `proxy.ts` MUST re-validate the perf budget and explicitly justify the regression.
- **TR-002 (Security — Constitution Principle IV)**:
  - **A01 Broken Access Control**: The gate IS the access control during the prelaunch window. The proxy redirect is the only authoritative gate; no route handler may rely on its own check (ideally route handlers don't need the check at all because the proxy ran first). The whitelist (FR-007) MUST be conservative — adding a route to it is a deliberate exemption, not a default.
  - **A02 Cryptographic Failures**: `SAA_LAUNCH_AT` is a non-secret display value but MUST be read through the typed config module. The new env var MUST NOT be `NEXT_PUBLIC_*`-prefixed.
  - **A04 Insecure Design**: Threat model. Trust boundaries: the env var (operator-controlled), the wall clock (server-controlled). Abuse cases: (1) operator misconfigures the env — far-past datetime leaks the program early, far-future datetime locks the program out of view indefinitely. Mitigated by Q-PG2's always-fail-closed resolution (null/malformed env keeps the gate active), plus a deployment-time sanity check on the parsed value; (2) attacker sends crafted requests trying to bypass the proxy (e.g. via path traversal in the whitelist) — mitigated by exact path matching, no regex with backreferences, no user-data influence on the whitelist; (3) replay attack of stale cookies during gate window — moot because proxy does not consult cookies for the gate decision; (4) **whitelist-driven gate weakening**: every entry on the FR-007 whitelist is a route reachable during the gate. Q-PG4 resolved to deliberately exclude all Auth.js paths (`/api/auth/*`); the only narrow whitelist entries are Next.js internals, static assets, the prelaunch path itself, and a hypothetical `/api/health` (not yet shipped). Adding any new whitelist entry requires security review.
  - **A05 Security Misconfiguration**: The gate MUST inherit the app-level CSP / HSTS / `X-Content-Type-Options` / `Referrer-Policy` / `X-Frame-Options` headers. Proxy MUST NOT override or strip them.
  - **A09 Logging**: The proxy MUST log gate decisions at `debug` level (not `info`) — every request hits it, so `info`-level would flood. A redirect SHOULD include the original path in the log entry to aid debugging stale-link issues. Logs MUST NOT contain session tokens or cookies.
- **TR-003 (Env contract)**: `SAA_LAUNCH_AT` is the **launch / gate-lift datetime** in ISO-8601 (e.g. `2026-06-01T09:00:00+07:00`). It is **distinct** from `SAA_EVENT_START_AT` (the SAA ceremony / event start, used by Homepage `B1`). Logically `SAA_LAUNCH_AT <= SAA_EVENT_START_AT` but this is operator-managed and not enforced in code. The Zod schema in [src/lib/config.ts](../../../src/lib/config.ts) MUST add `SAA_LAUNCH_AT: z.string().optional()` (consistent with `SAA_EVENT_START_AT`'s shape) — the **runtime fail-closed behavior is implemented in the proxy** (FR-009), not at schema-parse time. This keeps `next build` runnable without `.env.local` populated (matching the current pattern for `SAA_EVENT_START_AT`).
- **TR-004 (Test coverage — Constitution Principle V)**:
  - Vitest unit tests for `parseLaunchAt` (future / past / null / malformed inputs).
  - Vitest unit / integration tests for the proxy:
    - Future-end-datetime + non-whitelisted route → redirect.
    - Future-end-datetime + whitelisted route (each whitelist entry) → pass-through.
    - Past-end-datetime + non-whitelisted route → pass-through.
    - Past-end-datetime + prelaunch route → redirect to `/`.
    - Null / empty / malformed env → redirect (fail closed) — verified across `NODE_ENV=production`, `development`, and `test` (Q-PG2 resolved → always fail closed).
    - With Auth.js session cookie + future-end-datetime → still redirect (auth-agnostic).
  - Vitest unit test for the prelaunch route component:
    - Renders `Countdown` anchored on the parsed datetime.
    - Does NOT call `auth()`.
    - Does NOT render `<header>` / `<footer>` / `<nav>` / interactive control.
  - Playwright E2E with stubbed `SAA_LAUNCH_AT`:
    - Future timestamp + visit each shipped route → all redirect to prelaunch.
    - Past timestamp + visit prelaunch → redirect to `/` and onward to `/login` (anon) or Homepage (authed).
    - Future timestamp + Tab through prelaunch → no focusable in-page control.
- **TR-005 (Cross-spec compatibility — shipped-routes regression)**: Shipped Homepage SAA, Login, Profile / Awards / Kudos / General Rules stub routes MUST continue to pass their existing test suites with the gate disabled. **With Q-PG2 resolved to "always fail closed", "gate disabled" means `SAA_LAUNCH_AT` MUST be set to a past ISO-8601 timestamp (NOT unset)** — an unset env now triggers the gate. The gate's CI test job sets `SAA_LAUNCH_AT` to a future timestamp; the non-gate CI jobs set it to a past timestamp. The plan MUST update:
  - `.env.example` to document `SAA_LAUNCH_AT` with both example values (past for dev, future for testing the gate).
  - The CI workflow files to inject the appropriate value per job.
  - The dev onboarding / `README.md` to flag that `SAA_LAUNCH_AT` is required-or-fail-closed.
  - Test scripts (`test:e2e:gate-active` vs `test:e2e:gate-disabled`).

### Key Entities

This screen has no data entities. Data sources are two environment variables (`SAA_LAUNCH_AT`, `SAA_EVENT_START_AT`) parsed to `Date`s. There is no row, no record, no relation. **Database design impact: none.** This MUST be reflected in `plan.md` (a "no schema changes" entry).

---

## API Dependencies

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| _(none)_ | _(n/a)_ | The prelaunch route serves no API. Its data input is the `SAA_LAUNCH_AT` env var parsed at request time via `parseLaunchAt`. The proxy also serves no API — it intercepts requests but does not respond with structured data; it only redirects. | n/a |

No future-endpoint speculation here — adding a runtime-tunable gate (admin UI to flip `SAA_LAUNCH_AT` without redeploy) would be a separate spec, not an extension of this one. Today's contract is operator-set env + redeploy.

---

## State Management

- **Proxy state**: stateless. Each request reads `config.SAA_LAUNCH_AT` (parsed once at module load) and `new Date()`. No memoization, no caching, no per-request mutation.
- **Route component state**: the prelaunch route Server Component reads `config.SAA_LAUNCH_AT` and `getSaaLocale()` per request. No `await fetch(...)`, no Prisma call, no Auth.js session lookup. Static at request time.
- **Client state** (already implemented in `Countdown.tsx`): `now: Date`, ticked once per minute and on `visibilitychange`. The prelaunch route does NOT add new client-side state.
- **Global state**: none. The prelaunch screen does NOT consume the Auth.js session, the toast system, or any other app-wide state.
- **Cache / invalidation**: the prelaunch route MUST be marked `dynamic = "force-dynamic"` (or equivalent) so each request re-evaluates the gate decision. A stale ISR cache that serves prelaunch markup *after* the gate has lifted would violate US3. Same for the proxy's effective behavior — proxy runs per request by definition; no extra cache semantics to set.
- **Optimistic updates**: not applicable.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001 (Functional)**: 100% of the FR / TR / acceptance scenarios pass automated tests (Vitest + Playwright) before merge. No `.skip` / `.only` / disabled jobs (Constitution Principle V).
- **SC-002 (Visual fidelity)**: The implementer's screenshot of the rendered prelaunch route MUST match Figma frame `2268:35127` to within the visual-diff tolerance the project uses for Homepage SAA. Verified at implementation time via `momorph.implement-ui`'s screenshot-vs-Figma loop; this behavior spec does not encode pixel values.
- **SC-003 (Performance)**: Proxy adds ≤ 5ms p50 / ≤ 15ms p99 to TTFB. The prelaunch route's TTFB ≤ 200ms on a warm production build. The redirected-route TTFB ≤ 50ms (just the redirect, no markup).
- **SC-004 (Operational — always fail closed)**: A missing, empty, or unparseable `SAA_LAUNCH_AT` MUST keep the gate active (redirect every non-whitelisted request to `/coming-soon`, render `--/--/--` placeholders) regardless of `NODE_ENV`. Verified by Vitest cases for `production`, `development`, and `test`, each with a `null` parse result.
- **SC-005 (Cross-spec)**: All existing test suites (vitest, Playwright Homepage 11/11, Playwright Login regression 16/16, lint, `tsc --noEmit`, `next build`) MUST continue to pass with the gate disabled — i.e. with `SAA_LAUNCH_AT` set to a past ISO-8601 timestamp (NOT unset, since Q-PG2 = always fail closed). The CI job matrix MUST include both modes: a gate-disabled run for existing-suite regression, and a gate-active run for the new prelaunch tests (TR-004). `.env.example` MUST be updated; dev onboarding MUST flag the requirement.

---

## Out of Scope

- Visual / CSS specification (consumed by the implementation step via `query_section` / `get_node`).
- Asset preparation and filenames for the SAA root-system key art (consumed by `get_media_files` / `list_media_nodes`).
- An admin UI to flip `SAA_LAUNCH_AT` at runtime. Today's behavior is "operator sets env, redeploys" — sufficient for v1.
- A second-level "final hour" countdown surge (Q-CP3 resolved → minute-only forever; deferred unless marketing escalates).
- A subscription / "notify me when launched" form, social-share buttons, or any other CTA on the prelaunch surface (US4).
- Email or push notification triggered by gate-lift events.
- Per-user customization (timezone override, locale override beyond the existing `saa_locale` cookie).
- Internationalization beyond `vi-VN` and `en-US` (the existing app-wide locale floor).
- Notification panel, profile menu, language switcher — none belong on this screen by design.
- **Deep-link preservation across the gate**: a user redirected from `/awards` during the gate window does NOT get sent back to `/awards` post-gate-lift. They land on `/` and follow the normal flow. Deferred until product asks.
- **Per-route gate exemption**: the gate is binary (active or not) for the entire app modulo the FR-007 whitelist. Allowing some application routes to remain reachable during the gate (e.g., a "press preview" route) is out of scope; if needed, it is added to the whitelist via a documented amendment.
- **Auth-token rotation across the gate**: sessions persist untouched through the gate window; no rotation logic on gate-lift. If a future security review requires rotation, it is a separate spec.

---

## Resolved Decisions

All eight previously-open questions are now answered (2026-05-08). No `[NEEDS CLARIFICATION]` markers remain. The spec is ready for `momorph.plan`.

| Question | Resolution | Where it lands |
| --- | --- | --- |
| **Q-CP1** Routing strategy | Dedicated route (resolved by gate architecture). | FR-001, FR-008. |
| **Q-CP2** Auth gating | Auth-agnostic (resolved by gate architecture). Proxy redirects everyone; route does NOT call `auth()`. | FR-002, FR-006. |
| **Q-CP3** Countdown granularity | **Minute-only forever.** No seconds tile. Matches Figma + Homepage `B1`; lower jitter/battery/test surface. | FR-005. |
| **Q-CP4** i18n of heading | **Dedicated key `prelaunch.heading`.** Both `vi-VN` and `en-US` catalogs MUST be updated in lockstep — parity test enforces it. NOT reusing Homepage's `home.hero.subtitle` (avoids conflating the gate-lift moment with the ceremony-start moment). | FR-010, Reuse Map (Translation helper row). |
| **Q-CP5** Heading element | **Extend `Countdown` with optional `subtitleAs?: "p" \| "h1"` prop (default `"p"`).** Surgical change — Homepage continues to render `<p>`, the prelaunch route opts into `<h1>`. Adds one Vitest case for the prop. | Reuse Map (Countdown row), FR-001. |
| **Q-PG1** Env var name | **`SAA_LAUNCH_AT`** (chosen over the recommended `SAA_PRELAUNCH_END_AT` — terser, marketing-friendly). | TR-003, every FR/TR mentioning env, Zod schema in `src/lib/config.ts`. |
| **Q-PG2** Missing-env behavior | **Always fail closed**, regardless of `NODE_ENV` (chosen over the recommended env-aware default). Maximum safety; trade-off is that `SAA_LAUNCH_AT` MUST be set explicitly in every environment (set to a past timestamp to disable the gate). | FR-009, SC-004, TR-005, Edge Cases, dev onboarding. |
| **Q-PG3** Prelaunch route path | **`/coming-soon`.** | FR-001, FR-007 (whitelist), FR-008, the new file at `app/coming-soon/page.tsx`. |
| **Q-PG4** Whitelist details | **Whitelisted**: `/coming-soon` itself, `/_next/*`, `/public/*` static assets, favicon, `/api/health` (if/when added). **NOT whitelisted**: any Auth.js route (`/api/auth/*` — including `callback`, `csrf`, `session`, `signin`, `signout`). | FR-007, TR-002 (A04). |
| **Q-PG5** Post-gate redirect target | **Always redirect `/coming-soon` → `/`**. Homepage US0 then handles anon → `/login` and authed → render Homepage. No duplicated logic. | FR-008, US3 scenario 1. |

The previous spec's "Conflict Audit (`SAA_EVENT_START_AT` shared with Homepage SAA)" section is also resolved — the shared-env-var concern no longer applies because the prelaunch countdown anchors on `SAA_LAUNCH_AT` and Homepage's `B1` countdown continues to anchor on `SAA_EVENT_START_AT`.

---

## Dependencies

- [x] Constitution document exists ([.momorph/constitution.md](../../constitution.md), v1.1.1).
- [x] Screen flow documented ([.momorph/SCREENFLOW.md](../../SCREENFLOW.md) "Screen Details — Countdown - Prelaunch page", revised 2026-05-08).
- [x] Existing `Countdown` component shipped ([src/components/home/Countdown.tsx](../../../src/components/home/Countdown.tsx), Homepage SAA Phase 13, 2026-05-07).
- [x] Existing `getSaaLocale` helper shipped ([src/lib/cookies/saa-locale.ts](../../../src/lib/cookies/saa-locale.ts)).
- [x] Existing typed config module shipped ([src/lib/config.ts](../../../src/lib/config.ts), uses Zod).
- [x] Homepage SAA frozen and verified (vitest 184/184, Playwright Homepage 11/11 + Login regression 16/16).
- [x] Q-PG1..Q-PG5 resolved (see § Resolved Decisions, 2026-05-08).
- [x] Q-CP3, Q-CP4, Q-CP5 resolved.
- [ ] No API specifications required (FR / API table show zero endpoints; nothing to add to `.momorph/API.yml`).
- [ ] No database design required (Key Entities = none; nothing to add to `prisma/schema.prisma`).

---

## Notes

- This is a **substantial revision** of the prior draft. The prior version modeled the prelaunch screen as an inline-or-dedicated countdown that handed off to Homepage at zero. This revision elevates it to a **global pre-launch gate** with its own env var, its own proxy infra, and auth-agnostic semantics. Q-CP1 and Q-CP2 are resolved by the architecture; the prior "Conflict Audit" against Homepage's `SAA_EVENT_START_AT` is moot.
- The prelaunch screen now has **two distinct lifecycle states** (US2 = active gate, US3 = lifted gate) plus the always-true US1 (display) and US4 (inert UI). All four are P1/P2 — there is no P3 in this spec.
- The proxy is **NOT new infrastructure**: [`proxy.ts`](../../../proxy.ts) ships today with the Login security-headers + `/api/auth/callback` rate-limit pipeline. This spec **extends** the existing proxy with a gate-evaluation step that runs first (and 307s out before the existing pipeline runs for non-whitelisted requests). Plan-phase scopes (a) which step runs first, (b) how redirects still pick up the existing security-header helper, (c) `config.matcher` — today's value `"/((?!_next/static|_next/image|favicon.ico|assets).*)"` already excludes the FR-007 whitelist's static-asset entries, so static assets bypass the proxy entirely and the gate is naturally satisfied for them. Verify the matcher still routes API paths through the proxy so the gate covers them (TR-004).
- The Figma test-case set (19 cases) is largely about display behavior of the countdown tiles. They map cleanly to FR-004 / FR-005 and inherit the existing `Countdown` component's contract. The four Figma "Access control" test cases for "Login as a valid user" / "Ensure user not logged in" / etc. are **superseded** by the auth-agnostic gate model (US2 scenarios 1+2 now cover both states uniformly). Plan should link the Figma test-case IDs to the new Vitest / Playwright test surface and explicitly mark the access-control IDs as "covered by gate behavior, not by per-route auth".
- The shipped routes (Homepage `/`, `/login`, `/awards`, `/sun-kudos`, `/profile`, `/general-rules`) are **not modified** by this spec. Their handlers continue to compile and pass tests as-is. The proxy sits *above* them.
- Any `momorph.apispecs` or `momorph.database` step for this screen MUST conclude "nothing to do" and exit cleanly — there are no endpoints and no entities.
