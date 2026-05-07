# Feature Specification: Language Dropdown (Dropdown-ngôn ngữ)

**Frame ID**: `hUyaaugye2`
**Frame Name**: `Dropdown-ngôn ngữ`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Created**: 2026-05-07
**Status**: Draft (UI refresh of an already-shipped component — see "Implementation Status")

---

## Implementation Status

> **TL;DR — re-implementation is NOT required. This frame is a visual redesign of a fully-built component. The next planning round MUST be scoped as a UI refresh, not a rebuild.**

The behavioral surface described by this spec is already in production code, shipped with the Login screen (commit `8c0022f` "Complete implement and test for login screen"). The relevant artifacts:

| Concern                          | Existing artifact                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| React component                  | [src/components/header/LanguageSelector.tsx](src/components/header/LanguageSelector.tsx) |
| Locale allowlist + display map   | [src/lib/i18n/types.ts](src/lib/i18n/types.ts) (`SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, `LOCALE_DISPLAY`) |
| Translation helper + catalogs    | [src/lib/i18n/index.ts](src/lib/i18n/index.ts) + `src/lib/i18n/catalogs/{vi-VN,en-US}.json` |
| Cookie reader / writer           | [src/lib/cookies/saa-locale.ts](src/lib/cookies/saa-locale.ts) (read/write/clear, allowlist enforcement) |
| Authenticated persistence (API)  | [app/api/i18n/locale/route.ts](app/api/i18n/locale/route.ts) — `POST /api/i18n/locale` (NOT `PATCH /api/users/me/locale`) |
| Service layer                    | [src/services/locale-service.ts](src/services/locale-service.ts) |
| Database column                  | `User.locale` in [prisma/schema.prisma](prisma/schema.prisma) (`String @default("vi-VN")`) |
| Mounting screen                  | [src/components/header/Header.tsx](src/components/header/Header.tsx) |

What that code already does (verified by reading): keyboard nav (`ArrowDown` / `ArrowUp` / `Enter` / `Space` / `Escape`), click-outside-to-close, ARIA roles (`menu` / `menuitem`), `aria-haspopup` / `aria-expanded` / `aria-controls` / `aria-current` / `aria-label`, optimistic locale update with revert-on-API-failure, focus return to the trigger on close, both VN and US rows visible with the active row marked via `aria-current`, cookie persistence (`saa_locale`, 1y, `SameSite=Lax`, `Path=/`, `HttpOnly=false`, `Secure` in production), and authenticated mirror to `User.locale`.

**What this frame (`hUyaaugye2`) actually changes** is the visual treatment of the dropdown — colors, sizing, spacing, layout (selected row above, alternative below in a stacked card with the alternative on a darker panel). Implementation work for this spec is therefore confined to the *implementation* phase (`momorph.implement` — CSS / Tailwind classes / asset paths), not the spec/plan/tasks phase. The behavior FRs, TRs, edge cases, and API rows below are documented for completeness and as a regression guard, not as a fresh build target.

The "Open Questions" section at the end of this document records how the codebase resolves Q1–Q3 from earlier review rounds.

---

## Overview

Reusable language switcher component that lets users toggle the application UI between Vietnamese (`vi-VN`, chip `VN`) and English (`en-US`, chip `EN`). Rendered as a compact dropdown trigger in the header of any screen with localized chrome (confirmed: Login `GzbNeVGJHz`; planned: Homepage SAA and other authenticated screens with the same header per `.momorph/SCREENFLOW.md`). Clicking the trigger opens a menu listing all supported locales with the active one styled as "selected"; clicking the inactive locale switches the active locale, persists the choice, and closes the menu.

**Target users**: All end users of the application (authenticated and unauthenticated). `vi-VN` is the default locale per the SAA 2025 program.

**Business context**: The product is bilingual. The dropdown must be accessible from public screens (Login, error pages) before any user identity exists, and from authenticated screens once a user has signed in. Locale must survive page reloads. The supported-locale allowlist (`vi-VN`, `en-US`) is enforced server-side per the Login screen spec **TR-006**; this dropdown is the only UI that mutates the active locale.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Switch UI Language (Priority: P1)

A user viewing the application in their non-preferred language opens the dropdown and selects the alternative locale. All localized text on the current screen and on subsequent navigations renders in the chosen language.

**Why this priority**: The component has no other purpose. Without this flow there is no feature.

**Independent Test**: Mount the dropdown on any localized screen, click the trigger, click the alternative option, verify (a) trigger now shows the newly-selected language code, (b) on-screen labels re-render in the chosen locale, (c) reloading the page preserves the selection.

**Acceptance Scenarios**:

1. **Given** the trigger shows the chip for the active locale (`VN` for `vi-VN`) and the menu is closed, **When** the user clicks the trigger, **Then** the menu opens and lists all supported locales (`VN` for `vi-VN`, `EN` for `en-US`) with the active locale styled as "selected".
2. **Given** the menu is open and `vi-VN` is the active locale, **When** the user clicks the `en-US` row, **Then** the menu closes, the trigger now shows the `EN` chip, and all localized strings on the screen update to English without a hard reload.
3. **Given** the user has switched the locale to `en-US`, **When** they reload the page or navigate to another screen, **Then** the trigger still shows the `EN` chip and the new screen renders in English.
4. **Given** the trigger shows the `EN` chip, **When** the user opens the menu and clicks the `vi-VN` row, **Then** the trigger updates to the `VN` chip and the UI re-renders in Vietnamese.
5. **Given** the menu is open and `vi-VN` is the active locale, **When** the user clicks the already-active `vi-VN` row, **Then** the menu closes, no locale change is dispatched, no persistence call is made, and no re-render occurs (FR-009).

---

### User Story 2 — Dismiss Without Switching (Priority: P2)

A user opens the dropdown by accident or to inspect it, then dismisses it without changing the language.

**Why this priority**: Standard dropdown affordance. Required for usability but does not change application state.

**Independent Test**: Open the menu, perform a dismiss action (click trigger again, click outside, press Escape), verify menu closes and locale is unchanged.

**Acceptance Scenarios**:

1. **Given** the menu is open, **When** the user clicks the trigger again, **Then** the menu closes and the active locale is unchanged.
2. **Given** the menu is open, **When** the user clicks anywhere outside the dropdown, **Then** the menu closes and the active locale is unchanged.
3. **Given** the menu is open and has keyboard focus, **When** the user presses `Escape`, **Then** the menu closes and focus returns to the trigger.

---

### User Story 3 — Keyboard & Assistive Access (Priority: P3)

A keyboard-only or screen-reader user operates the dropdown without a mouse.

**Why this priority**: Accessibility is required by the project constitution but the visual dropdown is also reachable via direct API/locale URL params if implemented; functional MVP can ship before full A11y polish.

**Independent Test**: Tab to the trigger, activate with `Enter`/`Space`, navigate options with arrow keys, select with `Enter`. Verify ARIA roles and announcements.

**Acceptance Scenarios**:

1. **Given** keyboard focus is on the trigger, **When** the user presses `Enter` or `Space`, **Then** the menu opens and focus moves to the first option.
2. **Given** the menu is open and an option has focus, **When** the user presses `Enter`, **Then** that option is selected and the menu closes.
3. **Given** a screen reader is active, **When** the trigger receives focus, **Then** it announces its role (button/combobox), current value, and expanded state.

---

### Edge Cases

- **Network/persistence failure (authenticated)**: If `POST /api/i18n/locale` fails, the UI MUST keep the new locale and either retry silently or surface a non-blocking notification — the user-visible language MUST NOT "snap back" to the old value. *Note: the shipped implementation in `LanguageSelector.tsx` actually does revert the optimistic update on failure (matching the persisted truth); see `commit` callback at lines 87-111. Either behavior is acceptable as long as it's consistent.*
- **Locale value outside the allowlist**: If a stored locale (`saa_locale` cookie or `User.locale`) is not in the allowlist (`vi-VN`, `en-US`), the component falls back to the default (`vi-VN`) and the server clears or overwrites the bad value, mirroring Login spec TR-006.
- **Server-rendered first paint**: On initial page load, the trigger MUST show the correct locale immediately (no flash from default to actual) by reading the persisted locale on the server before render. Cookie-based persistence is required for this; `localStorage` alone does not satisfy it.
- **Multiple instances on one page**: If the dropdown renders in more than one place, all instances MUST stay in sync after a selection (single source of truth in the i18n provider).
- **Rapid double-click on an option**: Selecting the already-active locale MUST be a no-op (close menu, no re-render, no duplicate persistence calls — FR-009).
- **Locale change in another tab**: If the user changes the locale in tab A while tab B is open, tab B SHOULD pick up the new locale on next navigation. Live cross-tab sync via `storage` events or `BroadcastChannel` is OPTIONAL.

---

## UI/UX Requirements *(from Figma)*

### Screen Components

| Component           | Node ID                  | Description                                                 | Interactions                                                                                  |
| ------------------- | ------------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Dropdown-List       | `525:11713`              | Container holding the trigger and the options menu          | Click trigger → toggle menu open/closed; outside-click or `Escape` → close menu               |
| Option `tiếng Việt` | `I525:11713;362:6085`    | Vietnamese row (flag + `VN` chip) — locale `vi-VN`          | Click → dispatch locale change to `vi-VN`, close menu; hover → highlighted state              |
| Option `tiếng Anh`  | `I525:11713;362:6128`    | English row (flag + chip) — locale `en-US`                  | Click → dispatch locale change to `en-US`, close menu; hover → highlighted state              |

> Visual properties (colors, sizes, spacing, fonts, exact dimensions) are intentionally omitted — the implementer fetches CSS on demand via `query_section` per Node ID. The Figma annotation distinguishes one row as "selected" and the other as "option"; this is the **active-vs-inactive distinction**, not a menu layout rule. When the menu is open BOTH rows are present and clickable, with whichever locale is currently active rendered in the "selected" treatment. See **Open Question Q3** about chip text and flag for `en-US`.

### Navigation Flow

- This component does not navigate to a new screen. It mutates the active locale of the current screen.
- Open/close is overlay behavior, not a route change.
- Locale change re-renders the host screen with translated strings; URL does not change unless the host application uses locale-prefixed routes (out of scope for this spec — defer to host screen specs).

### Behavior & Accessibility (non-visual)

- Menu MUST NOT be clipped by viewport edges — implementer chooses placement strategy (flip / shift) so the menu remains fully reachable.
- A11y target: WCAG 2.1 AA for *behavioral* criteria — keyboard operability, programmatically determinable state, name/role/value via ARIA. Visual contrast and focus-indicator styling are owned by the implementation step, not this spec.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support exactly the locales in the project allowlist — `vi-VN` (default) and `en-US`. The allowlist itself is owned by the Login spec **TR-006**; this component only reads it.
- **FR-002**: System MUST display the active locale's chip (`VN` for `vi-VN`, `EN` for `en-US` per Q5 resolution) plus a flag indicator on the dropdown trigger.
- **FR-003**: Users MUST be able to toggle the menu open and closed by clicking the trigger.
- **FR-004**: When the menu is open, the system MUST render one row per supported locale, with the currently-active locale styled as "selected".
- **FR-005**: Users MUST be able to switch the active locale by clicking any non-active row.
- **FR-006**: System MUST close the menu immediately after a selection (whether or not the locale changed).
- **FR-007**: System MUST close the menu when the user clicks outside the dropdown or presses `Escape`, leaving the active locale unchanged.
- **FR-008**: System MUST persist the selected locale across page reloads and across navigations within the application (cookie + optional `User.locale` mirror — see TR-002 / TR-003).
- **FR-009**: System MUST apply the selected locale to all localized strings on the current screen without requiring a manual page reload (FR-008-style live re-render).
- **FR-010**: Clicking the already-active locale row MUST be a no-op apart from closing the menu — no locale change dispatch, no persistence call, no re-render.
- **FR-011**: System MUST be keyboard-operable: `Tab` to focus, `Enter`/`Space` to open, arrow keys to move between rows, `Enter` to activate the focused row, `Escape` to close and return focus to the trigger.
- **FR-012**: System MUST expose ARIA semantics so assistive tech announces the trigger's role, current value, and expanded/collapsed state, and announces each row's role and selected state.

### Technical Requirements

- **TR-001**: Locale change MUST update the UI within 100ms of the click (perceived as instant).
- **TR-002**: Persistence MUST work for unauthenticated users via the `saa_locale` cookie (1-year max-age, `SameSite=Lax`, `Path=/`, `HttpOnly=false`, `Secure` in production). **Implemented** in [src/lib/cookies/saa-locale.ts](src/lib/cookies/saa-locale.ts) (server) and inline in `LanguageSelector.tsx` (client write). Cookie-based persistence is mandatory (not `localStorage`-only) so server-rendered first paint does not flash the wrong locale.
- **TR-003**: For authenticated users, the chosen locale MUST also be written to `User.locale` via `POST /api/i18n/locale` and the `saa_locale` cookie MUST mirror that value (the route handler does the mirror). **Implemented** in [app/api/i18n/locale/route.ts](app/api/i18n/locale/route.ts) and [src/services/locale-service.ts](src/services/locale-service.ts); `User.locale` column exists with default `"vi-VN"`.
- **TR-004**: The component MUST be a single reusable React component, mountable on any screen with a header. **Implemented** as [src/components/header/LanguageSelector.tsx](src/components/header/LanguageSelector.tsx) (mounted via [src/components/header/Header.tsx](src/components/header/Header.tsx)). Note: the file is named `LanguageSelector.tsx`, not `LanguageDropdown.tsx`. SCREENFLOW.md should be updated to match.
- **TR-005**: Translations MUST come from a centralized i18n module. **Implemented** as a custom `t(key, locale)` helper at [src/lib/i18n/index.ts](src/lib/i18n/index.ts) backed by per-locale JSON catalogs (`src/lib/i18n/catalogs/{vi-VN,en-US}.json`). The project deliberately did NOT adopt `next-intl` or `react-intl`; the parity test at `tests/unit/lib/i18n/parity.test.ts` enforces catalog key parity at build time.
- **TR-006**: Open/close transition (if implemented) MUST complete within 200ms so it does not delay the next user interaction. Whether a transition exists at all is an implementation choice.
- **TR-007**: Allowlist enforcement is OUT OF SCOPE for this component (handled server-side by Login spec TR-006). The dropdown itself only ever offers values from the allowlist, so it cannot produce an out-of-allowlist value; rejecting tampered persisted values is the server's job.

### Key Entities

- **Locale**: BCP 47 locale code. Allowed values: `vi-VN`, `en-US`. Default: `vi-VN`. Canonical allowlist defined as `SUPPORTED_LOCALES` in [src/lib/i18n/types.ts](src/lib/i18n/types.ts) and enforced by `isSupportedLocale()` everywhere a locale value is read.
- **Chip code**: Short label rendered on the dropdown trigger and rows. Mapping defined in `LOCALE_DISPLAY` ([src/lib/i18n/types.ts](src/lib/i18n/types.ts)): `vi-VN` → `{ chip: "VN", flagAsset: "/assets/header/icons/flag-vn.svg" }`, `en-US` → `{ chip: "EN", flagAsset: "/assets/header/icons/flag-en.svg" }`. Aligned 2026-05-07 with Figma frame `hUyaaugye2` per Q5 resolution (was `US` + US flag in the original 2026-05-06 Login-spec resolution).
- **Persistence locations**: `saa_locale` cookie (always); `User.locale` column on the `User` table (authenticated only, non-null, default `"vi-VN"`).

---

## State Management

### Local component state

- `isOpen: boolean` — whether the menu is expanded. Owned by the dropdown component.
- `focusedOptionIndex: number | null` — for keyboard navigation across options (only meaningful while `isOpen === true`).

### Global / shared state

- **Active locale** is a *global* concern (the entire UI re-renders with new translations). It MUST live above this component — owned by the i18n provider (e.g., `next-intl` `NextIntlClientProvider`, React context, or equivalent). The dropdown reads it and dispatches a change.
- All instances of the dropdown on the same page MUST observe the same global locale (FR-008, edge case "multiple instances"). This is automatic when the provider is the source of truth.

### Loading / error state

- Locale change MUST be applied optimistically — UI updates immediately on click; persistence happens in the background.
- For authenticated users (TR-003), if the `POST /api/i18n/locale` request fails, the shipped implementation reverts the optimistic update so the UI matches the persisted truth (`saa_locale` cookie + `User.locale` row). The Edge Cases note above documents that an alternative — keeping the new value and retrying — would also be acceptable; both avoid the worst case of silently losing the user's choice without telling them.
- The dropdown itself does not render a loading spinner — locale switching is perceived as instant (TR-001).

### Cache / invalidation

- Translation bundles for the alternative locale MAY be lazy-loaded on first switch. Once loaded, they SHOULD be cached for the remainder of the session.
- If the user's authenticated profile is cached in a query client (e.g., React Query `users/me`), the cache entry MUST be updated after a successful `POST /api/i18n/locale` so subsequent reads reflect the new value without a refetch round-trip. *Note: the current implementation calls `router.refresh()` after the optimistic update, which invalidates Server Component caches — there is no client query cache to invalidate today.*

### Persistence read order (on initial render / SSR)

1. Authenticated user's `User.locale` (if session exists and field is non-null and value is in the allowlist)
2. `saa_locale` cookie (server-readable on the request)
3. Default `vi-VN`

The first source that yields a supported (allowlist) locale wins. Any value outside the allowlist is treated as missing and the next layer is consulted; the offending storage SHOULD be cleared by the server (Login spec TR-006).

`localStorage` is intentionally NOT in the chain — it is unreadable on the server and would require a post-hydration swap that re-introduces the first-paint flash described in Edge Cases.

---

## API Dependencies

| Endpoint              | Method | Purpose                                                                | Status                                                                                |
| --------------------- | ------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| (browser cookie API)  | —      | Read/write `saa_locale` cookie on the client                           | Implemented inline in `LanguageSelector.tsx` (`writeClientCookie`)                    |
| `/api/i18n/locale`    | POST   | Persist locale for authenticated user (mirrors cookie + writes `User.locale`) | Implemented at [app/api/i18n/locale/route.ts](app/api/i18n/locale/route.ts). Returns 401 unauthenticated, 400 on invalid body, 204 on success |

> Earlier drafts referenced `PATCH /api/users/me/locale`; the actual implementation is `POST /api/i18n/locale` and ALL future spec / plan / task references MUST use the implemented path. The component functions without any server call for unauthenticated users (cookie-only path); `LanguageSelector.tsx` skips the `fetch` when `isAuthenticated === false`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Switching the locale updates ≥ 95% of visible localized strings on the host screen within 200ms.
- **SC-002**: The selected locale persists correctly across reload in 100% of supported browsers (Chromium, Firefox, WebKit) for both unauthenticated (cookie only) and authenticated (cookie + `User.locale`) sessions.
- **SC-003**: Keyboard-only users can complete a full open → select → close cycle without using a pointer.
- **SC-004**: No locale "flash" on first paint — the trigger renders the correct locale on initial load in ≥ 99% of measured page loads (cookie-driven SSR).
- **SC-005**: A tampered `saa_locale` cookie or `User.locale` value outside the allowlist results in the user seeing `vi-VN` (default) and the offending storage being cleared, with no error surface.

---

## Out of Scope

- Adding additional locales beyond `vi-VN` and `en-US` (any new locale requires an amendment to the Login spec allowlist + a new translation catalog).
- Locale-prefixed URL routing (e.g., `/en/login` vs. `/vi/login`) — host application may add this separately.
- Per-screen locale override (each screen always uses the global active locale).
- Translating user-generated content (only application chrome is in scope).
- Right-to-left language support (neither `vi-VN` nor `en-US` is RTL).
- Allowlist enforcement on persisted values (handled server-side per Login spec TR-006).

---

## Dependencies

- [x] Constitution document exists (`.momorph/constitution.md`)
- [x] Component is implemented ([src/components/header/LanguageSelector.tsx](src/components/header/LanguageSelector.tsx))
- [x] API endpoint is implemented ([app/api/i18n/locale/route.ts](app/api/i18n/locale/route.ts)) — supersedes the earlier "predicted" `PATCH /api/users/me/locale`
- [x] `User.locale` column exists in [prisma/schema.prisma](prisma/schema.prisma)
- [x] i18n helper + catalogs exist ([src/lib/i18n/index.ts](src/lib/i18n/index.ts), `src/lib/i18n/catalogs/{vi-VN,en-US}.json`)
- [x] Screen flow documents this component (`.momorph/SCREENFLOW.md` — added 2026-05-07)
- [x] Login screen spec references the dropdown (`.momorph/specs/GzbNeVGJHz-login/spec.md`)
- [x] SCREENFLOW.md drift-synced 2026-05-07 — endpoint, file paths, and locale handling section now match the shipped code

---

## Notes

- This component is **reusable, not a screen**. The directory `hUyaaugye2-dropdown-ngon-ngu/` follows the same convention as screen specs but the artifact describes a component embedded in screens.
- Earlier draft of this spec said "show only the alternative locale" (former FR-010). Reading the design items more carefully (`A.1` says "selected có nền khác để phân biệt") makes clear that BOTH locales are rendered when the menu is open and the active one is just visually distinguished. That is the canonical interpretation, also matching the Login spec's US3 acceptance scenario.
- No test cases were attached to the frame (`get_frame_test_cases` returned empty on review). Acceptance scenarios above should drive the next `momorph.createtestcases` invocation.
- Constitution alignment: the component is a leaf-level reusable React component with no business logic of its own — it composes a centralized i18n module and a persistence helper. This satisfies Principle I (clean structure) and the "reuse over duplication" guidance. The `saa_locale` cookie is named in the Login spec, ensuring no naming drift.

## Resolved Questions

All three open questions from the prior review round are answered by the existing implementation.

- **Q1 — Server-side persistence in this iteration?** **Already implemented.** `User.locale` column ships with default `"vi-VN"` ([prisma/schema.prisma](prisma/schema.prisma)); `POST /api/i18n/locale` ([app/api/i18n/locale/route.ts](app/api/i18n/locale/route.ts)) writes the column and mirrors the cookie; `LanguageSelector.tsx` calls the endpoint only when `isAuthenticated === true` and reverts the optimistic update on failure. Nothing to plan or build.

- **Q2 — i18n library choice.** **No external library was adopted.** The project ships a custom `t(key, locale)` helper at [src/lib/i18n/index.ts](src/lib/i18n/index.ts) over per-locale JSON catalogs (`src/lib/i18n/catalogs/vi-VN.json`, `en-US.json`), with a unit-test parity guard. Future spec / plan / task documents MUST NOT prescribe `next-intl` or similar; if a switch is ever desired it would be a separate cross-cutting initiative.

- **Q3 — Chip text and flag for `en-US`.** **Reversed 2026-05-07 by plan Q5 — Figma is now authoritative.** Original 2026-05-06 resolution favored the codebase (`chip: "US"` + 🇺🇸); the user re-evaluated during plan review and chose to follow Figma's `EN` + UK flag instead. Phase 1.5 of [plan.md](plan.md) flips `LOCALE_DISPLAY["en-US"]` to `chip: "EN"` and the UK flag asset; Phase 4 of the plan updates the Login spec, SCREENFLOW, and this spec to match. Until those phases run, this section and the Login spec's Q1 table will appear contradictory — that is expected and resolves at implementation time.

---

## Recommendation for the Next Round

The user asked: *"Do we need to re-implement, or just update the UI?"* — **just update the UI.**

Concretely, the next round should be a `momorph.implement` pass scoped to:

1. Run `query_section` against nodes `525:11713`, `I525:11713;362:6085`, and `I525:11713;362:6128` to fetch the new visual treatment (colors, sizes, spacing, layout) from `hUyaaugye2`.
2. Update the className strings in [src/components/header/LanguageSelector.tsx](src/components/header/LanguageSelector.tsx) to match. Behavior, props, hooks, callbacks, and the API call path stay as-is.
3. If new flag assets are required (the new design may use different icon styling), download via `get_media_files` / `list_media_nodes` into `public/assets/header/icons/` and update `LOCALE_DISPLAY.flagAsset` paths if the filenames differ. Asset names that match (`flag-vn.svg`, `flag-us.svg`) need only the file replaced.
4. Re-run the existing tests (`tests/unit/...` and the Playwright e2e). Behavior is unchanged, so they should pass without edits; if any test asserts pixel-exact CSS values it may need adjustment.
5. Visually compare the rendered component to the Figma frame using Playwright screenshot diffing (per `momorph.implement-ui` workflow).

What should NOT be in the next round:

- New routes, new API endpoints, new services, new repository methods.
- A new component file (`LanguageDropdown.tsx`) — reuse `LanguageSelector.tsx`.
- Any change to `User.locale`, `saa_locale`, or the cookie helpers.
- Any change to `t()` or the catalogs.
- Any change to keyboard nav, ARIA, or the optimistic-update logic.

If a future change to behavior is requested (e.g., adding a third locale, splitting the chip into icon-only mode, etc.), that warrants its own spec — not this UI refresh.
