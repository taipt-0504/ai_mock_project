# Feature Specification: Login

**Frame ID**: `GzbNeVGJHz`
**Frame Name**: `Login`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Created**: 2026-05-06
**Status**: Ready for Plan

---

## Overview

The Login screen is the unauthenticated entry point of the **Sun Annual Awards 2025 (SAA 2025)**
web application. It introduces the program with hero copy ("ROOT FURTHER" plus a Vietnamese
tagline) and offers a single authentication mechanism — **Sign in with Google**. A language
selector in the header lets the user switch the UI locale; Vietnamese (`VN`) is the default.

**Target users**: SAA 2025 program participants (employees / contributors) who must authenticate
with their Google identity before viewing program content.

**Business context**: Google is the only authentication provider for the program; there is no
email/password form, no signup form, and no anonymous browsing of the main application. Anyone
already authenticated and landing on this URL MUST be redirected to the main application page.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign in with Google (Priority: P1)

As an unauthenticated SAA 2025 participant, I want to sign in with my Google account so that I
can access the program's main application.

**Why this priority**: This is the only authentication path. Without it the rest of the product is
unreachable, so it is the MVP.

**Independent Test**: Visit the Login URL in a clean browser session, click "LOGIN With Google",
complete the Google OAuth flow with a valid account, and verify the user lands on the main
application page with an authenticated session.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user is on the Login screen,
   **When** the user clicks the **LOGIN With Google** button (`B.3` / `662:14425`),
   **Then** the user agent performs a full-page navigation to Google's OAuth consent URL
   (the standard Auth.js flow — see TR-003), and the button enters its loading/disabled state
   for the brief window before the navigation commits, so that a duplicate click cannot
   trigger a second redirect.

2. **Given** the OAuth flow is in progress,
   **When** the user authenticates successfully with a valid Google account,
   **Then** the system establishes an authenticated session, returns the user profile (Google
   `sub`, name, email, avatar), and navigates the user to the main application page.

3. **Given** the OAuth flow is in progress (the user is on Google's consent page),
   **When** the user denies consent / clicks "Cancel" on Google, OR uses the browser back
   button to return without consenting,
   **Then** the user lands back on Login with no session created (Google's callback carries
   an `error` param in the deny case; the back-navigation case lands on Login directly), the
   button is in its idle state, and a non-blocking notice MAY be shown explaining that
   sign-in was cancelled.

4. **Given** the OAuth flow is in progress,
   **When** the Google provider returns an error (network failure, denied consent, invalid
   client),
   **Then** the user remains on the Login screen, the button returns to its idle state, and an
   error message is shown that does NOT leak provider internals (Principle IV — A09).

---

### User Story 2 - Authenticated visitor is redirected (Priority: P1)

As an already-authenticated user, I want to be sent straight to the main application when I
visit the Login URL so that I do not waste a click re-authenticating.

**Why this priority**: This is a security and UX gate — it prevents a confused authenticated user
from seeing a sign-in button that does not apply to them, and it removes a class of
authentication-loop bugs.

**Independent Test**: With a valid authenticated session cookie, navigate to the Login URL and
verify the response (server-side redirect or client-side bounce) lands on the main application
page without rendering the Login UI.

**Acceptance Scenarios**:

1. **Given** the user has a valid authenticated session,
   **When** the user navigates to the Login URL directly,
   **Then** the server detects the session via the Auth.js `auth()` helper in a Server
   Component or middleware and issues a redirect to the main application page (Next.js
   `redirect()` or middleware `NextResponse.redirect()`) **before** any Login markup is sent
   to the client. No client-side bounce is acceptable (TR-001).

2. **Given** the user signs out from any authenticated page,
   **When** the sign-out action completes,
   **Then** the application navigates the user to the Login screen and the session cookie is
   cleared.

---

### User Story 3 - Switch UI language (Priority: P2)

As a user, I want to switch the UI language from the language selector in the header so that the
introductory copy and the rest of the experience appear in my preferred language.

**Why this priority**: The hero copy is currently authored in Vietnamese only and Vietnamese is
the default. Language switching is a documented surface (component `A.2`) but is not blocking
for the first authenticated session.

**Independent Test**: With the Login screen rendered and the default `VN` selected, click the
language selector, verify the dropdown opens with the available languages, choose a different
language, and verify the visible copy updates to that language while the user remains on the
Login screen.

**Acceptance Scenarios**:

1. **Given** the Login screen renders with the default locale,
   **When** the screen first paints,
   **Then** the language selector (`A.2` / `I662:14391;186:1601`) shows the chip code `VN`
   (mapped from the internal locale `vi-VN`) with the Vietnam flag indicator on the leading
   side and a chevron indicator on the trailing side.

2. **Given** the language selector is in its default state,
   **When** the user clicks the selector,
   **Then** a dropdown menu of available languages opens.

3. **Given** the dropdown is open,
   **When** the user picks a locale other than the current one,
   **Then** the selector updates to display the new chip code and flag, the internal locale
   state updates to the new BCP 47 code, the choice is persisted per
   **Key Entities → Language preference**, and all localized copy on the screen (including
   the US4 hero copy) re-renders in the new locale without a hard reload.

4. **Given** the dropdown is open,
   **When** the user clicks outside the dropdown or presses `Escape`,
   **Then** the dropdown closes without changing the active language.

---

### User Story 4 - Read the program introduction (Priority: P3)

As a first-time visitor, I want to read the program title and short introduction so that I
understand what SAA 2025 is before signing in.

**Why this priority**: Pure informational content. It improves first-impression UX but does not
unlock or block any other capability.

**Independent Test**: Open the Login screen and verify the title and the two description lines
are rendered as static, non-interactive copy in the hero region.

**Acceptance Scenarios**:

1. **Given** the Login screen is rendered,
   **When** the user views the hero region (`B` / `662:14393`),
   **Then** the localized program title and description lines for the active locale are
   displayed. For the default locale `vi-VN` (FR-008) the title is "ROOT FURTHER" and the
   descriptions are "Bắt đầu hành trình của bạn cùng SAA 2025." and "Đăng nhập để khám phá!"
   sourced from the `vi-VN` translation catalog (TR-004). For other supported locales (Q1),
   the localized variants from the same catalog MUST be displayed.

2. **Given** the user attempts to interact with the title or description text,
   **When** the user clicks or hovers over the text,
   **Then** the text is non-interactive — no selection state, no navigation, no cursor change to
   indicate clickability.

---

### Edge Cases

- **No network at OAuth init**: clicking **LOGIN With Google** when offline MUST surface a
  generic "Cannot reach Google" message and re-enable the button — no infinite spinner.
- **Multiple rapid clicks** on **LOGIN With Google**: only the first click MUST initiate the
  full-page redirect to Google; subsequent clicks while the button is in the loading/disabled
  state (the window before navigation commits) MUST be no-ops, so duplicate `state` values
  cannot be issued.
- **Stale or revoked session**: a session cookie present but rejected by the server MUST NOT
  trigger a redirect to the main app (US2); the user MUST be treated as unauthenticated, the
  cookie cleared, and the Login UI rendered.
- **Direct hit on a deep main-app URL while unauthenticated**: the user MUST be redirected to
  Login; after successful sign-in, the original target SHOULD be honored as a post-login
  destination.
- **Logout in another tab** while sitting on the main app: subsequent navigation to a protected
  route MUST funnel back to Login (state MUST be re-validated server-side, not just from a stale
  client cache). With database sessions (TR-003), this is naturally satisfied: the deleted
  `Session` row makes every subsequent `auth()` call return null on every device that was
  using that session.
- **Cookies disabled / blocked**: OAuth requires the user agent to round-trip the `state` cookie.
  If cookies (or specifically third-party / `SameSite=None` cookies) are disabled, B.3 MUST
  surface a recoverable, generic error ("Cookies are required to sign in. Please enable cookies
  for this site and try again.") and re-enable the button. The error path MUST NOT leak the
  underlying Auth.js error code (TR-002 / A09).
- **Tampered `saa_locale` cookie**: if a request arrives with an `saa_locale` value outside the
  supported-locale allowlist (TR-006), the server MUST treat it as if no preference were set
  (default to `vi-VN`); the response MAY clear the cookie. The render MUST NOT throw or surface
  an error to the user.
- **Reduced-allowlist resilience** (forward-looking): if the supported-locale allowlist is
  ever reduced to a single entry by amendment, the A.2 selector MUST continue to render with
  the chip and flag in the same DOM structure used for multi-locale builds, so adding a
  locale back never requires a structural change. With the current allowlist of two locales
  (`vi-VN`, `en-US`) the selector behaves as a normal disclosure dropdown.

---

## UI/UX Requirements *(from Figma)*

### Screen Components

| No. | Node ID | Component | Type | Interactions |
|-----|---------|-----------|------|--------------|
| A | `662:14391` | Header | Instance (container) | Non-interactive container; holds A.1 + A.2. |
| A.1 | `I662:14391;186:2166` | Logo (Sun Annual Awards 2025) | Frame (others) | Non-interactive — no click, no hover effect. Anchored top-left of header. |
| A.2 | `I662:14391;186:1601` | Language selector | Frame (button) | Click opens language dropdown; hover engages the selector's hover state and signals interactivity. Anchored top-right of header. |
| B | `662:14393` | Hero / Cover | Frame (others) | Non-interactive container for B.1 / B.2 / B.3. |
| B.1 | `662:14395` | Key Visual | Frame (others) | Non-interactive background artwork. |
| B.2 | `662:14753` | Hero copy | Text (others) | Non-interactive — title + description; not selectable as a control. |
| B.3 | `662:14425` | LOGIN With Google button | Frame (button) | Click initiates the Google OAuth flow. Hover engages the button's hover state. While the OAuth flow is in progress, the button is disabled and shows a loading indicator. |
| C | `662:14388` | Decorative key visual group | Group (others) | Non-interactive. |
| D | `662:14447` | Footer | Instance (label) | Non-interactive. Fixed at the bottom of the page; remains visible during scroll. |

### Navigation Flow

- **From** (incoming): unauthenticated direct visits to the application; sign-out from any
  authenticated page (profile dropdowns `z4sCl3_Qtk`, `54rekaCHG1` — inferred); the 403 error
  page (`T3e_iS9PCL`) "Back" action — inferred.
- **To** (outgoing):
  - Successful Google OAuth → **Homepage SAA** (`i87tDx10uM`).
  - Authenticated visitor on Login → **Homepage SAA** (`i87tDx10uM`) via server-side redirect
    (US2).
  - Language selector (`A.2`) → opens overlay **Dropdown — Language** (`hUyaaugye2`); the
    selection updates the locale in place and does NOT route away from Login.
  - All other transitions: stay on Login.
- **Triggers**:
  - **B.3 LOGIN With Google** → OAuth flow → `i87tDx10uM` (on success).
  - **A.2 Language selector** → opens overlay `hUyaaugye2`; selection updates locale state but
    does NOT navigate.
  - The authoritative navigation graph for this screen lives in
    `.momorph/contexts/SCREENFLOW.md` (Principle III — evidence-based navigation).

### Behavior at Different Viewports & Accessibility

> Pixel values, contrast ratios, and breakpoint maps are intentionally NOT in this spec — they
> are governed by Constitution Principle III and resolved at implementation time via
> `query_section` against the design.

- **Responsive intent**: Header anchors (A.1 left, A.2 right) keep their positions; footer
  (D) remains fixed at the bottom across all viewports the constitution mandates support for.
- **Animations / transitions** (behavior, not duration/easing): button hover state, dropdown
  open/close, and the OAuth-in-progress loader. All non-essential motion MUST be suppressible
  via `prefers-reduced-motion`.
- **Accessibility behaviors**:
  - A.2 dropdown MUST be keyboard-operable: open via `Enter` / `Space` / `ArrowDown`, navigate
    items with `Arrow` keys, select with `Enter`, dismiss with `Escape`, and trap focus while
    open.
  - B.3 button MUST be reachable in tab order, MUST announce its busy state through
    `aria-busy` and `aria-disabled` while OAuth is in progress, and MUST recover focus to itself
    after a cancelled OAuth flow.
  - Decorative elements (`A.1`, `B.1`, `C`) MUST be exposed to assistive tech as decorative
    (e.g., empty `alt`, `aria-hidden`) so they do not pollute the reading order.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render the Login screen for any unauthenticated visitor.
- **FR-002**: System MUST detect an existing valid session on the server and redirect
  authenticated visitors to the main application page before rendering Login markup.
- **FR-003**: System MUST expose a single authentication action: **LOGIN With Google** (`B.3`).
  Clicking it MUST initiate the Google OAuth authorization flow.
- **FR-004**: While the Google OAuth flow is in progress, the **LOGIN With Google** button MUST
  be disabled, MUST show a loading indicator, and MUST ignore further click events.
- **FR-005**: On successful OAuth completion, the system MUST establish an authenticated session
  (HTTP-only, `Secure`, `SameSite=Lax`-or-stricter cookie — Principle IV — A02) and navigate the
  user to the main application page.
- **FR-006**: On OAuth failure or user cancellation, the system MUST NOT create a session, MUST
  return the Login screen to its idle state, and MUST display a generic error message that does
  NOT leak provider-internal details.
- **FR-007**: System MUST display the language selector (`A.2`) in the header with: the
  current chip code (a 2-letter, country-style label such as `VN` for `vi-VN`, `US` for
  `en-US`), the matching country flag indicator on the leading side, and a chevron indicator
  on the trailing side. The chip code is a display label only — internal state and
  persistence use BCP 47 locale codes (TR-006 allowlist).
- **FR-008**: Default locale on first visit MUST be Vietnamese — internal locale code
  `vi-VN`, displayed in the A.2 chip as `VN` (the 2-letter country code per FR-007's chip
  format).
- **FR-009**: Clicking the language selector MUST open a dropdown listing the available
  languages.
- **FR-010**: Selecting a language from the dropdown MUST update the active locale, persist the
  choice per the rules in **Key Entities → Language preference** (cookie write for
  unauthenticated visitors; `User.locale` write + cookie mirror for authenticated users), and
  update visible localized copy without a full page reload.
- **FR-011**: Clicking outside the open dropdown or pressing `Escape` MUST close it without
  changing the active language.
- **FR-012**: The logo (`A.1`), hero copy (`B.2`), key visual artwork (`B.1`, `C`), and footer
  (`D`) MUST be non-interactive — they MUST NOT respond to click or hover with navigation,
  state changes, or selection affordances.
- **FR-013**: The footer (`D`) MUST remain visible at the bottom of the viewport regardless of
  scroll position.
- **FR-014**: Sign-out from any authenticated page MUST clear the session and return the user
  to the Login screen.

### Technical Requirements

- **TR-001 (Performance)**: Initial Login render MUST not block on a Google network call. The
  authenticated-redirect check (FR-002) MUST run on the server (Server Component or middleware)
  to avoid Login flicker for already-authenticated users.
- **TR-002 (Security — Principle IV)**:
  - Session cookies MUST be `HttpOnly`, `Secure`, `SameSite=Lax` (or stricter), and
    server-validated (A02).
  - The OAuth client ID and secret MUST live in server-only environment variables read through
    the typed config module — NEVER in `NEXT_PUBLIC_*` (A02).
  - The integration MUST NOT disable Auth.js's built-in OAuth `state` / `nonce` /
    `code_verifier` validation. (Auth.js generates and validates these by default to prevent
    CSRF — A01 — and replay — A07.)
  - The OAuth `redirect_uri` MUST be exact-matched against the allowlist configured in the
    Google Cloud OAuth client (A10).
  - **Post-login redirect target** (`callbackUrl` / `next` / equivalent query param) MUST be
    validated as **same-origin** before being used. Auth.js enforces this by default; the
    integration MUST NOT widen the allowed origins. Cross-origin or relative-protocol values
    MUST be rejected and replaced with the default destination (Homepage SAA `i87tDx10uM`).
    Rationale: prevents open-redirect / phishing-pivot attacks (A01 / A10).
  - Authentication events (success, failure, cancel) MUST be logged with a request ID; logs MUST
    NOT contain access tokens, refresh tokens, ID tokens, authorization codes, or any PII beyond
    the internal `userId` (A09).
  - Repeated failed-callback attempts from the same IP MUST be rate-limited at the route
    handler / middleware layer (A07).
  - **Session revocation** (database-session strategy — TR-003): sign-out MUST delete the
    `Session` row server-side, not merely clear the cookie. An admin or future "revoke this
    device" feature MUST be able to invalidate any individual `Session` row immediately;
    after deletion the next request bearing that `sessionToken` MUST be treated as
    unauthenticated (Principle IV — A07).
- **TR-003 (Integration)**: The integration MUST use **Auth.js (NextAuth) with the
  `@auth/prisma-adapter`** (per Constitution v1.1.1 — Technology Stack), configured in
  **database-session mode** (`session.strategy = "database"`). All OAuth subpaths
  (`/api/auth/session`, `/api/auth/signin/google`, `/api/auth/callback/google`,
  `/api/auth/signout`) MUST be served by Auth.js's catch-all route handler at
  `app/api/auth/[...nextauth]/route.ts` — NOT by hand-rolled per-endpoint route files. Custom
  hand-rolled OAuth code is NOT acceptable without an explicit constitution waiver. Session
  expiry MUST be set explicitly (recommended: 30-day rolling expiry with refresh on activity);
  the value is decided in `plan.md`.
- **TR-004 (Internationalization)**: Localized strings (including the hero copy and language
  labels) MUST be sourced from a translation catalog, not hard-coded in components.
- **TR-005 (Accessibility)**: B.3 button MUST be reachable via keyboard tab order with a visible
  focus indicator and MUST announce its busy state via `aria-busy` / `aria-disabled`. A.2
  dropdown MUST be keyboard-operable (arrow keys + `Escape`).
- **TR-006 (Boundary input validation — Principle IV — A03)**: every untrusted input read on
  the Login route MUST be validated against a typed schema before use. In particular:
  - The `saa_locale` cookie value MUST be matched against the **supported-locale allowlist**
    `{ "vi-VN", "en-US" }` (canonical table in **Key Entities → Language preference**) on
    every read. Unrecognized values MUST be discarded and replaced with the default
    (`vi-VN`); they MUST NOT be passed to the i18n catalog lookup.
  - Any query parameter that influences post-login destination is covered by TR-002's
    `callbackUrl` rule.
  - The Google OAuth callback payload (authorization code, ID token) is validated by Auth.js;
    do NOT layer custom parsing on top.

### Key Entities *(if feature involves data)*

> Persistence stack (per Constitution v1.1.1): **PostgreSQL via Prisma ORM**, with Auth.js
> tables owned by `@auth/prisma-adapter`. The four adapter tables below MUST follow the Auth.js
> Prisma adapter contract verbatim — schema deviations are forbidden without an amendment.

- **`User`** (Auth.js adapter table; project-extensible): adapter columns
  (`id`, `name`, `email`, `emailVerified`, `image`) plus optional project columns
  (`locale` default `vi-VN`, `role` if/when admin vs. user is introduced).
- **`Account`** (Auth.js adapter table): one row per linked OAuth provider for a user. For SAA
  2025 the only `provider` value is `"google"`; `providerAccountId` stores the Google `sub`.
  Token columns (`access_token`, `refresh_token`, `id_token`) MUST stay server-side; they MUST
  NOT be exposed via any API response (Principle IV — A02).
- **`Session`** (Auth.js adapter table — actively used; the project ships **database
  sessions**, not JWT sessions): columns `sessionToken` (opaque, server-issued),
  `userId` (FK to `User.id`), `expires` (timestamp). The session cookie carries only the
  opaque `sessionToken`; the server reads the row on every authenticated request to validate
  it. **Sign-out deletes the row** (revocation is immediate). Multi-device sign-in produces
  multiple rows for one user; each row can be revoked independently.
- **`VerificationToken`** (Auth.js adapter table): retained per the adapter contract even
  though Login uses OAuth-only and does not currently issue email verification tokens.
- **Language preference**: persistence rules:
  - **Unauthenticated**: written to a `saa_locale` cookie (HTTP cookie set client-side or via a
    minimal server endpoint; no DB write). Survives across pre-login visits.
  - **Authenticated**: written to `User.locale` AND mirrored to the `saa_locale` cookie so that
    server-rendered Login (FR-002 redirect path, sign-out path) can pick it up before any DB
    read. The mirror is refreshed on sign-in and on every locale change.
  - Default value when neither is present: `vi-VN`.
  - **Supported locale allowlist** (canonical for TR-006):

    | BCP 47 locale | Chip code | Flag indicator | Order in dropdown |
    |---------------|-----------|----------------|-------------------|
    | `vi-VN` | `VN` | Vietnam flag (🇻🇳) | 1 (default) |
    | `en-US` | `US` | United States flag (🇺🇸) | 2 |

    Any value outside this allowlist read from a cookie, query param, or `User.locale`
    column MUST be rejected and replaced with `vi-VN` (TR-006). Adding a new locale requires
    a spec amendment and an authored catalog file (TR-004).

---

## API Dependencies

> The `/api/auth/*` rows below are URL paths served by **one** Auth.js catch-all route file
> (`app/api/auth/[...nextauth]/route.ts`), not five independent route handlers. Server-rendered
> session checks SHOULD use the Auth.js `auth()` helper directly inside Server Components or
> middleware instead of an HTTP round-trip to `/api/auth/session`.

| URL path | Method | Purpose | Triggered by | Implemented by | Status |
|----------|--------|---------|--------------|----------------|--------|
| `/api/auth/session` | GET | Return the current session (used only when an HTTP read is required; prefer the `auth()` helper server-side) | FR-002 redirect check, client-side session refresh | Auth.js catch-all | Predicted (Auth.js default) |
| `/api/auth/signin/google` | GET / POST | Initiate the Google OAuth authorization flow (Auth.js generates `state` / `nonce` / `code_verifier`) | Click on **LOGIN With Google** (`B.3`) — US1 | Auth.js catch-all | Predicted (Auth.js default) |
| `/api/auth/callback/google` | GET | Receive Google's authorization code, exchange it for tokens, create the session, redirect to the post-login destination | Google redirect after consent — US1 | Auth.js catch-all | Predicted (Auth.js default) |
| `/api/auth/signout` | GET / POST | Clear the session and redirect to Login (FR-014) | Sign-out action on authenticated pages | Auth.js catch-all | Predicted (Auth.js default) |
| `/api/i18n/locale` | POST | Persist the user's selected language to `User.locale` (authenticated only); also sets the `saa_locale` cookie on the response | Language dropdown selection — US3 (authenticated path) | Project route handler (thin → service → repository per Principle II) | Predicted (New) |

For unauthenticated visitors, US3 persistence is a **client-side cookie write only** — no API
call is made. The `saa_locale` cookie MUST be set with `Path=/`, `SameSite=Lax`, a 1-year
`Max-Age`, and `Secure` in production.

> All endpoint shapes are predictions. The concrete contracts (request/response schemas, error
> codes) will be ratified in `/momorph.apispecs`.

---

## State Management

### Server-side state (authoritative)

- **Session** — owned by Auth.js + the Prisma adapter, in **database-session mode**
  (TR-003). Only the opaque `sessionToken` cookie reaches the client. Read it server-side via
  the `auth()` helper inside Server Components, Server Actions, route handlers, and middleware
  — each call performs a `Session` row lookup against PostgreSQL. No client mirror of the
  session is required on the Login screen. Revocation is immediate: delete the row.
- **User profile** — read on demand from the `User` row via repository module. Login itself
  does not display profile data; downstream screens consume it.

### Client-side state (Login screen only)

| State | Scope | Lifecycle | Notes |
|-------|-------|-----------|-------|
| `oauthInProgress` | local to the Login page client component | set on B.3 click; cleared on OAuth flow resolution (success / cancel / error) | Drives FR-004 (button disabled + loader). MUST also be cleared on `pagehide` so re-entering the page from a cancelled OAuth window resets the UI. |
| `oauthError` | local to the Login page client component | set on FR-006 error path; cleared on the next B.3 click | Generic message only (TR-002); MUST NOT contain raw provider payloads. |
| `languageDropdownOpen` | local to the A.2 component | toggled by click / `Escape` / outside-click | Standard disclosure pattern; MUST trap focus while open. |
| `currentLocale` | derived from `saa_locale` cookie (read at SSR) plus a small client store for in-place updates | re-hydrated from cookie on mount | Mirrors `User.locale` for authenticated users; cookie is the single source of truth on the client. |

### Global / cross-screen state

- **None introduced by Login.** The Login screen MUST NOT reach into any global store
  (Redux/Zustand/Context) for session — it relies entirely on Auth.js helpers and the
  `saa_locale` cookie. Introducing a global store for auth on this screen is a constitution
  violation (Principle II — Stack Best Practices).

### Cache & invalidation

- The Login route MUST be rendered **dynamically** (no ISR / no static generation) so the
  FR-002 server-side session check runs on every request. Equivalent to
  `export const dynamic = 'force-dynamic'` or a request-time cookie read that opts the route
  out of static caching.
- `Cache-Control: no-store` MUST be set on the Login route response to prevent intermediate
  caches from serving the Login HTML to an authenticated user.
- Auth.js's session endpoint responses are already `Cache-Control: no-store`; do NOT override.

### Optimistic updates

- **None.** Sign-in is a security boundary — no optimistic transition into the authenticated
  app. The button stays in its loading state until the OAuth callback resolves authoritatively.
- Language switching MAY apply optimistically on the client (the dropdown closes and visible
  copy swaps immediately) while the persistence cookie write / `/api/i18n/locale` POST runs in
  the background; if the server write fails, the UI MUST revert and surface a non-blocking
  toast.

### Loading & error states

| Source | Loading affordance | Error affordance |
|--------|--------------------|-------------------|
| OAuth flow (US1) | B.3 disabled + loader (FR-004) | Inline message near B.3, button re-enabled (FR-006) |
| FR-002 redirect check | None visible — runs server-side before paint | If the session lookup itself errors (DB outage), render Login as if unauthenticated; log the failure with request ID (Principle IV — A09); do NOT block sign-in |
| Locale persistence (US3) | None visible (best-effort background write) | Non-blocking toast + revert UI; the choice still applies for the current session via cookie |

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: ≥ 99 % of valid Google sign-in attempts complete and reach the main application
  within 3 seconds of the OAuth callback (excluding Google-side latency).
- **SC-002**: 0 cases per release of an authenticated user seeing the Login UI render before
  being redirected (FR-002 / US2). Verified by integration test.
- **SC-003**: All FR-006 error paths surface a user-readable message; 0 occurrences of raw
  provider error payloads or stack traces leaked to the client (Principle IV — A09).
- **SC-004**: Language switch (US3) reflects in visible copy in under 200 ms after selection on
  a median device, with no full page reload.
- **SC-005**: Lighthouse Accessibility score ≥ 95 on the Login route.

---

## Out of Scope

- **Email / password sign-in** — Google is the only provider for SAA 2025.
- **Account creation form** — accounts are provisioned implicitly by the first successful Google
  sign-in.
- **Password reset / "Forgot password" flow** — no password is stored.
- **Multi-factor authentication on top of Google** — Google's own MFA is relied upon.
- **Detailed visual styling** (colors, spacing, typography, shadows, exact icon assets) — those
  are implementation-time concerns fetched via `query_section` and `get_media_files` per the
  `/momorph.implement-ui` workflow.
- **Translation catalog content** for non-Vietnamese locales — strings are out of scope for
  this spec; placeholders are acceptable until the catalog is filled.
- **The structure and content of the main application page** — only the navigation contract
  ("redirect to main app on success") is in scope.

---

## Dependencies

- [x] Constitution document exists (`.momorph/constitution.md`) — referenced from this spec
  (Principles II, III, IV, V).
- [ ] API specifications (`.momorph/API.yml` / `api-docs.yaml`) — to be produced by
  `/momorph.apispecs` for the four predicted endpoints above.
- [ ] Database design (`prisma/schema.prisma`) — required for the Auth.js adapter tables
  (`User`, `Account`, `Session`, `VerificationToken`) plus any project-specific extensions on
  `User`. ORM ratified in Constitution v1.1.1 as **Prisma + PostgreSQL**.
- [x] Screen flow documented (`.momorph/contexts/SCREENFLOW.md`) — Login section confirmed
  outgoing edges to Homepage SAA (`i87tDx10uM`) and the Language overlay (`hUyaaugye2`).
  Incoming edges from profile dropdowns and the 403 page are marked **inferred** and MUST be
  re-confirmed when those screens are surveyed.
- [ ] Google Cloud OAuth client provisioned (Web application client ID + secret stored
  server-side; authorized redirect URIs configured for each environment).
- [x] Auth library decision recorded — **Auth.js (NextAuth) Google provider with the
  `@auth/prisma-adapter`** (Constitution v1.1.1 — Technology Stack).

---

## Notes

- The screen is sourced from `mms_*` design items, indicating an MoMorph-managed component
  taxonomy. Node IDs in this spec correspond directly to those design items and MUST be used by
  the implementer to fetch styles and assets via `query_section`, `get_node`,
  `list_media_nodes`, and `get_media_files` at implementation time.
- The hero copy in the Figma design is authored in Vietnamese only. The `vi-VN` catalog SHOULD
  be seeded from the design strings verbatim (title "ROOT FURTHER" plus the two description
  lines). The `en-US` catalog MUST be authored before `en-US` is enabled in the dropdown — at
  minimum the keys touched by US3 / US4 (program title, hero descriptions, B.3 button label,
  cancellation notice from US1 scenario 3, and the cookies-disabled / generic OAuth error
  copy from FR-006 + Edge Cases). Translation source is out of this spec (`/momorph.specs`
  for downstream screens may add more keys).
- The Login screen has **no form fields** — there is no client-side input validation surface
  beyond the Google OAuth flow. This intentionally reduces the local attack surface (Principle
  IV — A03).
- Constitution alignment summary: this spec satisfies Principle I (clean structure — single
  feature folder), Principle II (Server-Component-first redirect, layered route → service for
  callback handling), Principle III (responsive + WCAG AA + evidence-based navigation),
  Principle IV (full OAuth threat model captured under TR-002), and Principle V (every FR has
  Given/When/Then scenarios that translate directly to failing tests first).

---

## Resolved Clarifications

All open questions have been answered; the spec is self-contained for `/momorph.plan`.

- ✅ **Q1 — Supported locales** (resolved 2026-05-06): `vi-VN` (chip `VN`, default) +
  `en-US` (chip `US`). Canonical table in **Key Entities → Language preference**; allowlist
  enforced by TR-006.
- ✅ **Q2 — Auth.js session strategy** (resolved 2026-05-06): **database sessions**
  (`session.strategy = "database"`), per Principle IV — A07. Locked into TR-003 and the
  `Session` Key Entity entry; revocation behavior added to TR-002 and the cross-tab logout
  edge case.
