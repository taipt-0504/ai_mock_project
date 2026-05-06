# Feature Specification: Login

**Frame ID**: `GzbNeVGJHz`
**Frame Name**: `Login`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Created**: 2026-05-06
**Status**: Draft

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
   **Then** the Google OAuth authorization flow starts (in a new tab or popup, per the
   product's chosen integration), and the button enters its loading/disabled state until the flow
   completes or is cancelled.

2. **Given** the OAuth flow is in progress,
   **When** the user authenticates successfully with a valid Google account,
   **Then** the system establishes an authenticated session, returns the user profile (Google
   `sub`, name, email, avatar), and navigates the user to the main application page.

3. **Given** the OAuth flow is in progress,
   **When** the user cancels the Google consent screen or the popup is closed before completion,
   **Then** no session is created, the Login screen returns to its idle state (button re-enabled,
   loader removed), and a non-blocking notice MAY be shown.

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
   **Then** the server detects the session and redirects to the main application page
   (preferably via a Next.js Server Component / `redirect()` call, before any Login markup is
   sent).

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

1. **Given** the Login screen renders with the default language,
   **When** the screen first paints,
   **Then** the language selector (`A.2` / `I662:14391;186:1601`) shows code `VN` with the
   Vietnam flag indicator on the leading side and a chevron indicator on the trailing side.

2. **Given** the language selector is in its default state,
   **When** the user clicks the selector,
   **Then** a dropdown menu of available languages opens.

3. **Given** the dropdown is open,
   **When** the user picks a language other than the current one,
   **Then** the selector updates to display the new language code and flag, the choice is
   persisted (cookie or equivalent so subsequent visits remember it), and any localized copy on
   the screen updates without a hard reload.

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
   **Then** the title text "ROOT FURTHER" and the description lines
   "Bắt đầu hành trình của bạn cùng SAA 2025." and "Đăng nhập để khám phá!" are displayed.

2. **Given** the user attempts to interact with the title or description text,
   **When** the user clicks or hovers over the text,
   **Then** the text is non-interactive — no selection state, no navigation, no cursor change to
   indicate clickability.

---

### Edge Cases

- **No network at OAuth init**: clicking **LOGIN With Google** when offline MUST surface a
  generic "Cannot reach Google" message and re-enable the button — no infinite spinner.
- **Popup blocked**: if the integration uses a popup window and the browser blocks it, the user
  MUST see a recoverable message instructing them to allow popups; the button MUST re-enable.
- **Multiple rapid clicks** on **LOGIN With Google**: only the first click MUST initiate the
  flow; subsequent clicks while the button is in the loading/disabled state are no-ops.
- **Stale or revoked session**: a session cookie present but rejected by the server MUST NOT
  trigger a redirect to the main app (US2); the user MUST be treated as unauthenticated, the
  cookie cleared, and the Login UI rendered.
- **Direct hit on a deep main-app URL while unauthenticated**: the user MUST be redirected to
  Login; after successful sign-in, the original target SHOULD be honored as a post-login
  destination.
- **Logout in another tab** while sitting on the main app: subsequent navigation to a protected
  route MUST funnel back to Login (state MUST be re-validated server-side, not just from a stale
  client cache).

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

### Visual Requirements

- **Responsive**: MUST be usable from `360 px` width upward (Constitution Principle III).
  Header anchors (A.1 left, A.2 right) and footer (D) keep their positions across breakpoints.
- **Animations / Transitions**: limited to the button hover state, dropdown open/close, and
  loader during OAuth. All non-essential motion MUST respect `prefers-reduced-motion`.
- **Accessibility**: WCAG 2.1 AA — contrast ratios, keyboard reachability, visible focus on
  A.2 and B.3, dropdown navigable with arrow keys + `Escape` to close, button announces its
  loading state via `aria-busy` / `aria-disabled`. (Visual token values are out of scope for this
  spec; see Principle II — Tailwind tokens.)

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
- **FR-007**: System MUST display the language selector (`A.2`) in the header with the current
  language code, the matching country flag indicator, and a chevron indicator.
- **FR-008**: Default language on first visit MUST be Vietnamese (`VN`).
- **FR-009**: Clicking the language selector MUST open a dropdown listing the available
  languages.
- **FR-010**: Selecting a language from the dropdown MUST update the active locale, persist the
  choice (cookie or equivalent storage), and update visible localized copy without a full page
  reload.
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
    server-validated.
  - The OAuth client secret MUST live in server-only environment variables — NEVER in
    `NEXT_PUBLIC_*`.
  - The OAuth `state` parameter MUST be cryptographically random and validated on callback to
    prevent CSRF (A03 / A07).
  - The OAuth `redirect_uri` MUST be exact-matched against an allowlist (A10).
  - Authentication events (success, failure, cancel) MUST be logged with a request ID; logs MUST
    NOT contain access tokens, refresh tokens, or PII beyond the user ID (A09).
  - Repeated failed-callback attempts from the same IP MUST be rate-limited (A07).
- **TR-003 (Integration)**: The integration MUST use **Auth.js (NextAuth) with the
  `@auth/prisma-adapter`** (per Constitution v1.1.0 — Technology Stack). Custom hand-rolled
  OAuth code is NOT acceptable without explicit constitution waiver. The Google provider MUST
  be configured server-side; client ID and secret come from the typed config module, never from
  `NEXT_PUBLIC_*`.
- **TR-004 (Internationalization)**: Localized strings (including the hero copy and language
  labels) MUST be sourced from a translation catalog, not hard-coded in components.
- **TR-005 (Accessibility)**: B.3 button MUST be reachable via keyboard tab order with a visible
  focus indicator and MUST announce its busy state via `aria-busy` / `aria-disabled`. A.2
  dropdown MUST be keyboard-operable (arrow keys + `Escape`).

### Key Entities *(if feature involves data)*

> Persistence stack (per Constitution v1.1.0): **PostgreSQL via Prisma ORM**, with Auth.js
> tables owned by `@auth/prisma-adapter`. The four adapter tables below MUST follow the Auth.js
> Prisma adapter contract verbatim — schema deviations are forbidden without an amendment.

- **`User`** (Auth.js adapter table; project-extensible): adapter columns
  (`id`, `name`, `email`, `emailVerified`, `image`) plus optional project columns
  (`locale` default `vi-VN`, `role` if/when admin vs. user is introduced).
- **`Account`** (Auth.js adapter table): one row per linked OAuth provider for a user. For SAA
  2025 the only `provider` value is `"google"`; `providerAccountId` stores the Google `sub`.
  Token columns (`access_token`, `refresh_token`, `id_token`) MUST stay server-side; they MUST
  NOT be exposed via any API response (Principle IV — A02).
- **`Session`** (Auth.js adapter table, only if Auth.js is configured in database-session mode):
  `sessionToken`, `userId`, `expires`. The session cookie carries only the opaque
  `sessionToken`; revocation deletes the row.
- **`VerificationToken`** (Auth.js adapter table): retained per the adapter contract even
  though Login uses OAuth-only and does not currently issue email verification tokens.
- **Language preference**: stored as `User.locale` after sign-in (default `vi-VN`); for
  unauthenticated visitors, persisted in a cookie (`saa_locale`) so the choice survives across
  visits before authentication.

---

## API Dependencies

| Endpoint | Method | Purpose | Triggered by | Status |
|----------|--------|---------|--------------|--------|
| `/api/auth/session` | GET | Check the current session for FR-002 redirect (preferably executed in a Server Component / middleware before render) | Login route mount (server) | Predicted (New) |
| `/api/auth/signin/google` | GET / POST | Initiate the Google OAuth authorization flow (redirects to Google's authorization URL with `state` + `nonce`) | Click on **LOGIN With Google** (`B.3`) — US1 | Predicted (New) |
| `/api/auth/callback/google` | GET | Receive Google's authorization code, exchange it for tokens, create the session, redirect to the main application page | Google redirect after consent — US1 | Predicted (New) |
| `/api/auth/signout` | POST | Clear the session cookie and redirect to Login (used by sign-out from authenticated pages, FR-014) | Sign-out action elsewhere — US2 (incoming) | Predicted (New) |
| `/api/i18n/locale` *(or cookie-based equivalent)* | POST | Persist the user's selected language | Language dropdown selection — US3 | Predicted (New, optional if pure cookie write client-side) |

> All endpoints are predictions. The expected concrete shape will be ratified in `/momorph.apispecs`.

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
  `User`. ORM ratified in Constitution v1.1.0 as **Prisma + PostgreSQL**.
- [x] Screen flow documented (`.momorph/contexts/SCREENFLOW.md`) — Login section confirmed
  outgoing edges to Homepage SAA (`i87tDx10uM`) and the Language overlay (`hUyaaugye2`).
  Incoming edges from profile dropdowns and the 403 page are marked **inferred** and MUST be
  re-confirmed when those screens are surveyed.
- [ ] Google Cloud OAuth client provisioned (Web application client ID + secret stored
  server-side; authorized redirect URIs configured for each environment).
- [x] Auth library decision recorded — **Auth.js (NextAuth) Google provider with the
  `@auth/prisma-adapter`** (Constitution v1.1.0 — Technology Stack).

---

## Notes

- The screen is sourced from `mms_*` design items, indicating an MoMorph-managed component
  taxonomy. Node IDs in this spec correspond directly to those design items and MUST be used by
  the implementer to fetch styles and assets via `query_section`, `get_node`,
  `list_media_nodes`, and `get_media_files` at implementation time.
- All hero copy is currently authored in Vietnamese. When implementing US3, the existing strings
  should seed the `vi-VN` catalog; English (`en-US`) and any other locales need authored
  translations before they appear in the dropdown.
- The Login screen has **no form fields** — there is no client-side input validation surface
  beyond the Google OAuth flow. This intentionally reduces the local attack surface (Principle
  IV — A03).
- Constitution alignment summary: this spec satisfies Principle I (clean structure — single
  feature folder), Principle II (Server-Component-first redirect, layered route → service for
  callback handling), Principle III (responsive + WCAG AA + evidence-based navigation),
  Principle IV (full OAuth threat model captured under TR-002), and Principle V (every FR has
  Given/When/Then scenarios that translate directly to failing tests first).
