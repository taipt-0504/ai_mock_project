# Feature Specification: Hệ thống giải thưởng SAA 2025 (Awards Information)

**Frame ID**: `313:8436` (screen ID `zFYDgyj_pD`)
**Frame Name**: `Hệ thống giải`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Figma URL**: https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=zFYDgyj_pD
**Created**: 2026-05-09
**Last Updated**: 2026-05-09 (all 5 open questions Q-HTG1..Q-HTG5 resolved)
**Status**: **Ready for `momorph.plan`** — route locked to `/awards`, data source = static
catalog, active-section detection via `IntersectionObserver`, scroll-margin offset resolved
at implementation time, mobile pattern deferred post-MVP (scroll-only fallback).

---

## Overview

The **Hệ thống giải thưởng** screen is the public catalog that explains SAA 2025's full award
system to authenticated employees. It is the destination of every "Awards Information"-class
link emitted from the rest of the product (Homepage header `A1.3`, hero CTA `B3.1` `ABOUT
AWARDS`, footer `7.3`, and the six award cards `C2.1`–`C2.6` on Homepage with
`#<award-slug>` deep-links).

Behaviorally, the screen is **read-only**: a left-side sticky navigation menu (`C`) with six
items that mirror the right-side vertical list of full award detail cards (`D.1`–`D.6`). Each
detail card states the award's title, description, **quantity**, and **monetary value**.
Clicking a menu item scrolls the content area to the matching card and marks the menu item
active; as the user scrolls, the active state follows the visible card. The screen also embeds
the same Sun* Kudos promo block (`D1`/`D2.1`) used on Homepage to cross-link `/sun-kudos`.

It currently exists as a stub at [app/awards/page.tsx](../../../app/awards/page.tsx) (shipped
2026-05-08 as part of the Homepage hydration-bug workaround). This specification backs that
stub with real behavior, validation, navigation, and data contracts.

**Target users**: All authenticated SAA 2025 participants — employees who clicked into the
Awards section from any entry point listed above.

**Business context**: SAA 2025 is Sun*'s annual recognition program. The Hệ thống giải screen
is the single source of truth for "what can I win and how much is it worth?". Clear quantity
and value display drives participation across all six categories.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Browse the full award catalog (Priority: P1)

An authenticated employee lands on the Awards Information screen from any entry point
(Homepage header `Awards Information`, `ABOUT AWARDS` CTA, footer link, or any of the six
Homepage award cards). They see all six award categories rendered as full detail cards: title,
thumbnail, description, quantity (with unit — "Đơn vị" / "Tập thể" / "Cá nhân"), and
monetary value (per giải). They scroll the page and read all six.

**Why this priority**: This is the screen's primary purpose. Without the catalog, the entire
Awards Information funnel from Homepage lands on a stub and the program's value proposition is
invisible.

**Independent Test**: Visit `/awards` while authenticated. Without clicking anything else,
verify all six awards render in order with all five fields (title, thumbnail, description,
quantity + unit, value).

**Acceptance Scenarios**:

1. **Given** I am authenticated and on Homepage, **When** I click the header `Awards
   Information` link (`A1.3`), **Then** the browser navigates to the Awards Information page
   and the page loads with all six award detail cards visible (or scrollable into view) in the
   order: Top Talent → Top Project → Top Project Leader → Best Manager → Signature 2025 → MVP.
2. **Given** I am on Homepage, **When** I click any of the six award cards `C2.1`–`C2.6`,
   **Then** the browser navigates to `/awards#<award-slug>` and the page automatically scrolls
   to the matching detail card with the section title fully visible (not occluded by the
   sticky header — see TR-004).
3. **Given** I am on the Awards Information page, **When** the page has finished loading,
   **Then** each detail card displays exactly five pieces of content from the catalog:
   thumbnail image, title, description text, "Số lượng giải thưởng: {n} {unit}" line, and
   "Giá trị giải thưởng: {value} VNĐ" line. No interactive controls exist on the cards
   themselves.
4. **Given** I am on the Awards Information page, **When** I click `C.1` Top Talent in the
   left menu, **Then** the page scrolls to the `D.1` Top Talent detail card, the `C.1` menu
   item gains the active state (per design system; semantic signal = `aria-current="true"`),
   and any previously active item loses its active state.

---

### User Story 2 — Track scroll position via the left menu (Priority: P1)

As an authenticated employee scrolling through the awards list, I see the left-side menu
highlight the award I am currently reading, so I always know where I am in the catalog and
can jump elsewhere with a single click.

**Why this priority**: The two-column layout is the screen's defining UX pattern. Without
active-state synchronization between scroll and menu, the menu degrades from a navigation aid
to a static list and the catalog feels disorienting.

**Independent Test**: Scroll through the awards list using the mouse wheel only (do not click
any menu item). Verify the menu's active item updates as each detail card crosses into the
viewport.

**Acceptance Scenarios**:

1. **Given** I am at the top of the page with `C.1` Top Talent active, **When** I scroll down
   until the `D.2` Top Project card is the most-visible card in the viewport, **Then** the
   `C.2` Top Project menu item becomes active and `C.1` loses its active state.
2. **Given** I am at the bottom of the awards list with `C.6` MVP active, **When** I scroll
   back up past `D.4` Best Manager, **Then** the `C.4` Best Manager menu item becomes active.
3. **Given** I am on the Awards Information page, **When** I hover over any menu item that is
   not currently active, **Then** the item is highlighted (hover affordance) without changing
   the active state.

---

### User Story 3 — Cross-promote Sun* Kudos (Priority: P2)

After reading the awards catalog, I see the embedded Sun* Kudos promo block at the bottom of
the page and can click `Chi tiết` to learn about the recognition campaign.

**Why this priority**: This block is mirrored from Homepage and is part of the program's
overall story (recognition + competition). It is value-additive but not blocking for the core
catalog story (US1).

**Independent Test**: Scroll to the bottom of `/awards`. Verify the Sun* Kudos block renders
with label "Phong trào ghi nhận", title "Sun* Kudos", short description, illustration, and a
`Chi tiết` button. Click the button and confirm navigation to `/sun-kudos`.

**Acceptance Scenarios**:

1. **Given** I have scrolled past `D.6` MVP, **When** the Sun* Kudos block (`D1`/`D2.1`)
   enters the viewport, **Then** I see the label "Phong trào ghi nhận", the title "Sun*
   Kudos", a short description, an illustration, and a `Chi tiết` button.
2. **Given** the Sun* Kudos block is visible, **When** I click `D2.1` `Chi tiết`, **Then** the
   browser navigates to `/sun-kudos`.

---

### User Story 4 — Maintain header / footer parity (Priority: P2)

As an authenticated user, the Awards Information screen exposes the same shared header and
footer used throughout the app, so language switching, profile menu, notification bell, and
cross-page navigation work identically to Homepage.

**Why this priority**: Consistency is a hard requirement of the constitution (Principle II,
stack best practices). Forking the header / footer would create a maintenance burden and
fragment the locale + auth contracts already shipped. Treat any deviation as a bug.

**Independent Test**: On `/awards`, click the language chip, profile avatar, notification
bell, and each footer / header link in turn. Verify each opens the same overlay or navigates
to the same destination as on Homepage.

**Acceptance Scenarios**:

1. **Given** I am on the Awards Information page, **When** I click the header language chip,
   **Then** the Dropdown — Language overlay (`hUyaaugye2`) opens with the same options and
   persistence behavior as on Homepage / Login.
2. **Given** I am on the Awards Information page, **When** I click my avatar in the header,
   **Then** the Dropdown — Profile overlay (user variant `z4sCl3_Qtk` or admin variant
   `54rekaCHG1`) opens; clicking `Đăng xuất` triggers `signOutAction` and redirects to
   `/login`.
3. **Given** I am on the Awards Information page, **When** I click the header `About SAA
   2025` link or the Logo, **Then** the browser navigates to `/` (Homepage SAA).
4. **Given** I am on the Awards Information page, **When** I click footer `7.4` `Sun* Kudos`,
   **Then** the browser navigates to `/sun-kudos`.

---

### User Story 5 — Authentication gating (Priority: P1)

Only authenticated users may view the Awards Information screen; anonymous visitors are
redirected to `/login` consistent with every other authenticated route in the app.

**Why this priority**: Aligns with Homepage US0 / FR-001a and the project's authenticated-only
posture. Surface drift here would undermine the auth contract.

**Independent Test**: Sign out, then navigate directly to `/awards`. Verify the response is a
redirect to `/login` (no markup leak).

**Acceptance Scenarios**:

1. **Given** I am NOT authenticated, **When** I navigate directly to `/awards`, **Then** I
   am redirected to `/login` before any awards markup is rendered.
2. **Given** I am authenticated, **When** I navigate to `/awards`, **Then** the page renders
   with my header (avatar, language chip, notification bell) populated from `auth()`.
3. **Given** the global pre-launch gate is active (`now() < SAA_LAUNCH_AT`), **When** I
   attempt to navigate to `/awards`, **Then** Next.js `proxy.ts` redirects me to
   `/coming-soon` regardless of auth state — the awards screen is unreachable until the gate
   lifts. (This precondition is project-global; documented here for completeness only.)

---

### Edge Cases

- **Deep-link to an unknown slug**: User visits `/awards#nonexistent-slug`. The page renders
  normally; no automatic scroll occurs because the hash does not match any known slug. The
  first menu item `C.1 Top Talent` is marked active as the default state (per FR-007). No
  JavaScript error is thrown (test case ID-13).
- **JavaScript disabled / before hydration**: Menu items still render as anchor links
  (`<a href="#top-talent">`); native browser anchor scrolling works without JS. Active-state
  highlighting is JS-only and absent until hydration.
- **Image load failure**: A failing `Picture-Award` thumbnail renders the image's `alt`
  text in place of the image; the rest of the card is unaffected. Placeholder behavior is
  delegated to the existing image strategy used on Homepage award cards.
- **Sun* Kudos route unavailable**: If `/sun-kudos` returns an error, the standard Next.js
  error page renders (test case ID-14 — graceful 404 / 500 fallback).
- **Cross-cut precondition (global pre-launch gate)**: While `now() < SAA_LAUNCH_AT`, every
  scenario above is short-circuited by `proxy.ts` redirect to `/coming-soon`. No
  per-screen logic required; covered by the global gate already shipped.
- **Locale switching mid-screen**: Switching `vi-VN ↔ en-US` updates all visible award titles,
  descriptions, and labels in place via the existing `t()` helper without a page reload.

---

## UI/UX Requirements *(from Figma)*

### Screen Components

| Component                        | Node ID         | Description                                                                                                | Interactions                                                                                                  |
|----------------------------------|-----------------|------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------|
| Header                           | `313:8440`      | Reused authenticated `Header` instance: Logo, nav links (`About SAA 2025`, `Awards Information` *selected*, `Sun* Kudos`), Notification, Language chip, Profile avatar. | Same contract as Homepage `A1`. `Awards Information` is the active nav item on this screen.                  |
| `3` Keyvisual / Hero             | `313:8437`      | Decorative banner image (`image 20`).                                                                      | None — purely decorative.                                                                                     |
| `A` Title hệ thống giải thưởng   | `313:8453`      | Caption "Sun* annual awards 2025" + H1 "Hệ thống giải thưởng SAA 2025".                                    | None — static text.                                                                                           |
| `C` Menu list                    | `313:8459`      | Sticky/anchored 6-item navigation column.                                                                  | Click an item → scroll to matching `D.*` card + set active state. Hover → highlight. Active item carries `aria-current="true"` (visual indicator resolved at implementation time). |
| `C.1` Top Talent                 | `313:8460`      | Menu item.                                                                                                 | Click → scroll to `D.1` + activate. Hover → highlight.                                                        |
| `C.2` Top Project                | `313:8461`      | Menu item.                                                                                                 | Click → scroll to `D.2` + activate.                                                                            |
| `C.3` Top Project Leader         | `313:8462`      | Menu item.                                                                                                 | Click → scroll to `D.3` + activate.                                                                            |
| `C.4` Best Manager               | `313:8463`      | Menu item.                                                                                                 | Click → scroll to `D.4` + activate.                                                                            |
| `C.5` Signature 2025 — Creator   | `313:8464`      | Menu item.                                                                                                 | Click → scroll to `D.5` + activate.                                                                            |
| `C.6` MVP                        | `313:8465`      | Menu item.                                                                                                 | Click → scroll to `D.6` + activate.                                                                            |
| `D.1` Top Talent card            | `313:8467`      | Award detail block: thumbnail, title, description, "Số lượng: 10 Đơn vị", "Giá trị: 7.000.000 VNĐ".       | None — read-only.                                                                                              |
| `D.2` Top Project card           | `313:8468`      | Award detail block: "02 Tập thể", "15.000.000 VNĐ".                                                        | None — read-only.                                                                                              |
| `D.3` Top Project Leader card    | `313:8469`      | Award detail block: "03 Cá nhân", "7.000.000 VNĐ".                                                         | None — read-only.                                                                                              |
| `D.4` Best Manager card          | `313:8470`      | Award detail block: "01 Cá nhân", "10.000.000 VNĐ".                                                        | None — read-only.                                                                                              |
| `D.5` Signature 2025 card        | `313:8471`      | Award detail block: "01", "5.000.000 VNĐ (cá nhân) / 8.000.000 VNĐ (tập thể)".                            | None — read-only.                                                                                              |
| `D.6` MVP card                   | `313:8510`      | Award detail block: "01", "15.000.000 VNĐ".                                                                | None — read-only.                                                                                              |
| `D1` / `D2` Sun* Kudos block     | `335:12023`     | Same component used on Homepage `D1`. Label "Phong trào ghi nhận", title "Sun* Kudos", description, illustration, `D2.1` `Chi tiết` button. | Click `Chi tiết` → navigate to `/sun-kudos`.                                                                  |
| Footer                           | `354:4323`      | Reused `Footer` instance: Logo + 4 nav links + copyright.                                                  | Same contract as Homepage `7`.                                                                                 |

### Navigation Flow

- **From**: Homepage SAA (header `A1.3`, hero CTA `B3.1`, footer `7.3`, six award cards
  `C2.1`–`C2.6` with `#<award-slug>` deep-links). Direct URL visit.
- **To**: Sun* Kudos (`/sun-kudos`) via `D2.1` button or header/footer Sun* Kudos link;
  Homepage SAA (`/`) via header Logo / `About SAA 2025` link / footer link; Login (`/login`)
  via Profile dropdown `Đăng xuất`; Tiêu chuẩn chung (`/general-rules`) via footer `7.5`.
- **Triggers**: Click events on header / footer / menu items / Sun* Kudos `Chi tiết`. Scroll
  events drive active-state synchronization (no navigation).

### Behavior-Affecting UI Notes

Visual / CSS / pixel / asset / responsive-breakpoint specifications are intentionally out of
scope for this specification per the skill contract — the implementation step fetches CSS
via `query_section` and assets via `get_media_files` / `list_media_nodes`. Only behavior
that is observable to users (and therefore testable in acceptance scenarios) is documented
here:

- **Active-state semantics**: The menu item corresponding to the most-visible award card is
  marked active. Active state MUST be communicated semantically via `aria-current="true"`
  on the menu item (TR-005) so that assistive technology can convey it independent of any
  visual indicator chosen at implementation time.
- **Narrow-viewport menu behavior**: Resolved per Q-HTG4 — MVP ships **scroll-only** as the
  fallback. On narrow viewports the menu (`C`) is hidden / collapsed and the user scrolls
  through the six `D.*` cards directly. A structured pattern (sticky tab strip /
  accordion) is deferred post-MVP and is NOT in scope here.
- **Accessibility (behavior-affecting only)**: WCAG 2.1 AA. Focus order follows DOM order.
  Each menu item is a keyboard-focusable anchor and Enter activates it (parallel to click).
  Active-section state is announced via `aria-current`, not via visual signal alone.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST gate the Awards Information route behind authentication. Anonymous
  requests MUST be redirected to `/login` before any awards markup is rendered (parallels
  Homepage FR-001a / US0).
- **FR-002**: System MUST render the awards catalog as six detail cards in the order:
  Top Talent → Top Project → Top Project Leader → Best Manager → Signature 2025 — Creator →
  MVP. Each card MUST display: title, thumbnail, description, "Số lượng giải thưởng: {n}
  {unit}", and "Giá trị giải thưởng: {value} VNĐ" (with the Signature 2025 card showing both
  cá nhân + tập thể tiers).
- **FR-003**: System MUST render a six-item navigation menu (`C.1`–`C.6`) that mirrors the six
  detail cards in the same order.
- **FR-004**: Users MUST be able to click any menu item to scroll the content area to the
  matching `D.*` detail card. The clicked item MUST gain the active state (per design system)
  and the previously active item MUST lose it.
- **FR-005**: System MUST keep the menu's active state synchronized with the user's scroll
  position: as the user scrolls, the menu item corresponding to the most-visible detail card
  MUST become active. Implementation MUST use `IntersectionObserver` (resolved decision per
  TR-003).
- **FR-006**: System MUST accept `#<award-slug>` deep-links from Homepage award cards. On
  arrival, the matching detail card MUST be scrolled into view and the matching menu item MUST
  be marked active. Slugs MUST match the existing `AwardSlug` union exported from
  [src/lib/awards/awards.ts](../../../src/lib/awards/awards.ts): `top-talent`, `top-project`,
  `top-project-leader`, `best-manager`, `signature-2025-creator`, `mvp`.
- **FR-007**: System MUST gracefully degrade for unknown / missing fragment hashes: render
  the page with no card pre-scrolled, default to `C.1` Top Talent active, and emit no
  JavaScript error (covers test case ID-13).
- **FR-008**: Users MUST be able to click `D2.1` `Chi tiết` on the embedded Sun* Kudos block
  to navigate to `/sun-kudos`.
- **FR-009**: System MUST reuse the shipped `Header` component with the active nav link set
  to `Awards Information` (selected state). Reuse rule: do NOT fork or duplicate the header.
- **FR-010**: System MUST reuse the shipped `Footer` and `KudosBlock` components without
  modification.
- **FR-011**: Award titles, descriptions, "Số lượng giải thưởng" / "Giá trị giải thưởng"
  labels, and unit words ("Đơn vị", "Tập thể", "Cá nhân") MUST be available in both `vi-VN`
  and `en-US` and switchable via the existing `LanguageSelector` without a page reload.
- **FR-012**: Numeric values (quantity, monetary value) MUST be rendered with locale-aware
  formatting. VNĐ amounts MUST keep the `.` thousands separator used in the Vietnamese
  catalog (e.g., `7.000.000 VNĐ`); the suffix `VNĐ` MUST appear regardless of locale.
- **FR-013**: System MUST NOT expose any write / mutation endpoint or interactive form on
  this screen. The screen is read-only.
- **FR-014**: System MUST emit `<a href="#<slug>">` anchor markup for every menu item so that
  the page is navigable without JavaScript (graceful degradation per Edge Cases).

### Technical Requirements

- **TR-001**: First contentful paint of the awards list MUST occur on the server (Next.js
  Server Component) — no waterfall API call from the client. The awards data MUST come from
  the static catalog at [src/lib/awards/awards.ts](../../../src/lib/awards/awards.ts) (no
  `GET /api/awards` endpoint at MVP, resolved decision per Q-HTG3).
- **TR-002**: The route handler MUST call `auth()` and redirect to `/login` for anonymous
  sessions; this MUST happen before any markup is sent.
- **TR-003**: Active-section detection (FR-005) MUST be implemented as a Client Component
  island using `IntersectionObserver` and MUST NOT block hydration of the awards markup.
  Observer `rootMargin` MUST be tuned to the deployed sticky header height (specific value
  resolved at implementation time — see TR-004).
- **TR-004**: Deep-link anchor jumps MUST land with the section title fully visible — not
  occluded by the sticky header. Implementation MUST use CSS `scroll-margin-top` (or
  `scroll-padding-top` on the scroll container) on each `D.*` card. The exact offset value
  is resolved at implementation time against the deployed header height; this spec
  intentionally asserts no pixel value.
- **TR-005**: Active state — both for header navigation links and for the in-page menu
  items `C.1`–`C.6` — MUST be communicated semantically via `aria-current="true"` so that
  assistive technology can convey it independent of any visual indicator.
- **TR-006**: i18n catalogs (`vi-VN`, `en-US`) MUST be updated in lockstep — the parity test
  used on Homepage (every key present in both) MUST extend to the new `awards.detail.*` keys.
- **TR-007**: No new dependency MAY be added to fulfil this spec. Active-section detection
  uses native `IntersectionObserver`; smooth scroll uses the browser's native behavior.
  Constitution Principle II forbids new libraries when an idiomatic stack option exists.

### Key Entities

- **Award (catalog entity)**: A single SAA 2025 award category. Attributes:
  - `slug` (string, kebab-case, stable URL fragment) — primary key, e.g., `top-talent`.
  - `title` (i18n key) — display name.
  - `description` (i18n key) — narrative explaining the award's intent.
  - `thumbnail` (string, asset path or imported asset) — image source for the card.
  - `quantity` (number) — number of giải awarded.
  - `unit` (i18n key, optional) — `Đơn vị` / `Tập thể` / `Cá nhân` or empty string.
  - `valueVND` (number, primary tier) — monetary value in Vietnamese đồng.
  - `valueVNDSecondary` (number, optional) — secondary tier (Signature 2025 has cá nhân +
    tập thể tiers).
  Source of truth: [src/lib/awards/awards.ts](../../../src/lib/awards/awards.ts) — extend the
  existing six entries with the new `quantity`, `unit`, `valueVND`, `valueVNDSecondary`
  fields. Static catalog locked at MVP (resolved decision per Q-HTG3); no API or DB
  required.

---

## API Dependencies

| Endpoint                            | Method | Purpose                                                                                          | Status                                     |
|-------------------------------------|--------|--------------------------------------------------------------------------------------------------|--------------------------------------------|
| `auth()` helper                     | —      | Server-side session check; redirect to `/login` for anon (FR-001 / TR-002).                      | Exists (used on Homepage / Login)          |
| `GET /api/notifications/unread-count` | GET  | Header bell badge (already shipped via Homepage Phase 13).                                       | Exists.                                    |
| `POST /api/i18n/locale`             | POST   | Persist locale change for authenticated users (Header language chip).                            | Exists.                                    |
| `signOutAction` (Server Action)     | —      | Logout — invoked from Profile dropdown.                                                          | Exists ([src/actions/auth.ts](../../../src/actions/auth.ts)). |

**No new server endpoints are required for this screen.** Awards data is loaded from the
static catalog [src/lib/awards/awards.ts](../../../src/lib/awards/awards.ts) at build time
(resolved per Q-HTG3); Sun* Kudos block content reuses the same static i18n keys as
Homepage `D1`.

---

## State Management

**Local component state** (Client Component island for active-section detection):

| State           | Type                       | Initial                              | Purpose                                                                                          |
|-----------------|----------------------------|--------------------------------------|--------------------------------------------------------------------------------------------------|
| `activeSlug`    | `AwardSlug \| null`        | derived from `window.location.hash` or `null` | Currently active menu item / detail card slug.                                                  |
| `observerRef`   | `IntersectionObserver \| null` | `null`                          | Lazily-created observer that watches all six `D.*` cards (FR-005).                              |

**Global state**: None new. The screen reuses the existing global state already present on
every authenticated page:
- `auth()` session for Header user fields.
- Locale via cookie (`saa_locale`) + `User.locale` row, owned by `LanguageSelector`.

**Cache / invalidation**: None — awards data is a static module import; the bundler embeds
it at build time. Resolved per Q-HTG3.

**Optimistic updates**: Not applicable — read-only screen.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of award cards render on first paint (server-rendered) — no card is gated
  behind a client-side fetch.
- **SC-002**: Active-state synchronization tracks scroll position with no perceivable lag —
  the matching menu item activates within one viewport scroll's worth of the user crossing
  into a new card.
- **SC-003**: Deep-link arrivals from Homepage award cards (`#<award-slug>`) land on the
  correct card with the title fully visible (not occluded by the sticky header) — TR-004.
- **SC-004**: Lighthouse accessibility score ≥ 95 on this page (parity with Homepage).
- **SC-005**: i18n parity test passes — every `awards.detail.*` key exists in both `vi-VN` and
  `en-US` catalogs (TR-006).
- **SC-006**: Lint, `tsc`, and unit tests all pass; no regressions in Homepage or Login.

---

## Out of Scope

- **Award winner showcase / leaderboard**: This screen explains *what* the awards are, not
  *who won*. Winner data, voting flows, and ceremony content belong to separate screens
  (e.g., Sun* Kudos detail, future winners pages) and are out of scope here.
- **Admin editing of award catalog**: Q-HTG3 is locked to a static catalog (resolved
  2026-05-09); an admin CRUD UI for editing awards is explicitly deferred.
- **Structured narrow-viewport menu pattern (post-MVP)**: Resolved per Q-HTG4 — MVP ships
  **scroll-only** on narrow viewports (menu hidden, six cards scrolled directly). Any
  structured alternative (sticky horizontal tab strip, collapsible accordion, bottom-sheet,
  etc.) is explicitly deferred to a later iteration and is OUT of scope for this spec /
  plan.
- **Animations / transitions on scroll**: No specific motion spec is in design. Defer to
  default browser smooth-scroll. Card hover behavior is out of scope (cards are read-only
  and carry no per-card `Chi tiết` button — unlike Homepage's award cards, which DO have
  one).
- **Notification panel**: Header bell click opens the same overlay as on Homepage; the panel
  itself is a separate, not-yet-surveyed frame.
- **Visual / CSS / typography spec**: Per constitution Principle II, those are fetched at
  implementation time via `query_section`.

---

## Dependencies

- [x] Constitution document exists ([.momorph/constitution.md](../../constitution.md))
- [x] Screen flow documented ([.momorph/SCREENFLOW.md](../../SCREENFLOW.md) — surveyed
      2026-05-09; this spec follows that survey)
- [x] Homepage SAA spec exists ([.momorph/specs/i87tDx10uM-homepage-saa/spec.md](../i87tDx10uM-homepage-saa/spec.md))
      — Awards Information is the destination of `A1.3`, `B3.1`, footer `7.3`, and award cards
      `C2.1`–`C2.6`.
- [x] Static awards catalog at [src/lib/awards/awards.ts](../../../src/lib/awards/awards.ts)
      — extend with `quantity`, `unit`, `valueVND`, `valueVNDSecondary` fields per Q-HTG3.
- [x] Shared `Header`, `Footer`, `KudosBlock` components shipped via Homepage Phase 13.
- [x] **Q-HTG1..Q-HTG5 resolved (2026-05-09)** — see "Resolved Decisions" below. Spec is
      cleared for `momorph.plan`.
- [ ] API specifications ([.momorph/api-docs.yaml](../../api-docs.yaml)) — N/A per Q-HTG3
      (no new endpoints).
- [ ] Database design ([.momorph/database.sql](../../database.sql)) — N/A; read-only screen,
      no persistence.

---

## Resolved Decisions

All five originally-open questions were resolved on 2026-05-09. The decisions below are
asserted as binding for `momorph.plan` and downstream implementation.

- **Q-HTG1 — Route path**: **`/awards`** (canonical). Existing stub at
  [app/awards/page.tsx](../../../app/awards/page.tsx) is replaced by the real implementation
  at the same path. Homepage's six award cards `C2.1`–`C2.6` keep their existing `#<slug>`
  deep-link contract. No alias / redirect is added for `/he-thong-giai`. Test cases that
  reference `/he-thong-giai` (ID-0..ID-2) MUST be updated to `/awards` when the test plan
  is regenerated.
- **Q-HTG2 — Active-section detection**: **`IntersectionObserver`** (native, zero new
  dependencies). Anchor-click-only is rejected because US2 (scroll-tracked menu) is a P1
  user story. Specifics in TR-003.
- **Q-HTG3 — Source of truth for `quantity` / `unit` / `value`**: **Static catalog** at
  [src/lib/awards/awards.ts](../../../src/lib/awards/awards.ts), extended with the four
  new fields (`quantity`, `unit`, `valueVND`, `valueVNDSecondary`). No `GET /api/awards`
  endpoint is created at MVP. No DB schema, no admin CRUD UI. Aligns with Homepage Q-H2.
- **Q-HTG4 — Narrow-viewport menu pattern**: **Scroll-only fallback** for MVP. The menu is
  hidden / collapsed on narrow viewports and the user scrolls through the six cards
  directly. A structured pattern (tab strip / accordion) is explicitly deferred post-MVP
  and is out of scope for this spec / plan.
- **Q-HTG5 — Scroll-margin offset for deep-link anchor jumps**: Implementation MUST use
  CSS `scroll-margin-top` (or `scroll-padding-top` on the scroll container) on each `D.*`
  card so the title is fully visible after a hash jump. The exact offset value is
  resolved at implementation time against the deployed sticky header height. The spec
  intentionally asserts no pixel value (per skill no-style-leakage rule). See TR-004.

---

## UI Component Specifications

> **Generated by `/momorph.specs` on 2026-05-09.** Per-component specifications for every
> design item in frame `313:8436`. Follows the standard 22-field schema (No, itemId,
> itemName, nameJP, nameTrans, itemType, itemSubtype, buttonType, dataType, required,
> format, minLength, maxLength, defaultValue, validationNote, description, userAction,
> transitionNote, databaseTable, databaseColumn, databaseNote, qa). `dataType`, `format`,
> `minLength`, `maxLength`, `defaultValue` are empty for every item on this screen because
> the screen has no input fields. `databaseTable` / `databaseColumn` / `databaseNote` are
> empty for every item because the screen is read-only. **Detail Level**: Medium.
> **Output language**: English (descriptions, validation, QA). Source: `list_design_items`
> on `zFYDgyj_pD`.

### Overview

| No    | itemId                       | itemName                          | itemType       | subtype / buttonType | userAction      | required | Notes                                |
|-------|------------------------------|-----------------------------------|----------------|----------------------|-----------------|----------|--------------------------------------|
| 3     | `313:8437`                   | 3_Keyvisual                       | `file_or_image`| `hero_banner`        | (none)          | false    | Decorative hero artwork              |
| A     | `313:8453`                   | A_Title hệ thống giải thưởng       | `label`        | —                    | (none)          | false    | Static caption + H1                  |
| B     | `313:8458`                   | B_Hệ thống giải thưởng             | `others`       | `info_block`         | (none)          | false    | Two-column container                 |
| C     | `313:8459`                   | C_Menu list                       | `others`       | `navigation`         | (none)          | false    | 6-item navigation column             |
| C.1   | `313:8460`                   | C.1_Top talent                    | `others`       | `navigation_item`    | `on_click`      | false    | Scroll to D.1                        |
| C.2   | `313:8461`                   | C.2_Top project                   | `others`       | `navigation_item`    | `on_click`      | false    | Scroll to D.2                        |
| C.3   | `313:8462`                   | C.3_Top Project leader            | `others`       | `navigation_item`    | `on_click`      | false    | Scroll to D.3                        |
| C.4   | `313:8463`                   | C.4_Best manager                  | `others`       | `navigation_item`    | `on_click`      | false    | Scroll to D.4                        |
| C.5   | `313:8464`                   | C.5_Signature 2025                | `others`       | `navigation_item`    | `on_click`      | false    | Scroll to D.5                        |
| C.6   | `313:8465`                   | C.6_MVP                           | `others`       | `navigation_item`    | `on_click`      | false    | Scroll to D.6                        |
| D.1   | `313:8467`                   | D.1_Top talent                    | `others`       | `info_block`         | (none)          | false    | Award detail card — Top Talent       |
| D.1.1 | `I313:8467;214:2525`         | D.1.1_Picture-Award               | `file_or_image`| `image`              | (none)          | false    | Award thumbnail                      |
| D.1.2 | `I313:8467;214:2526`         | D.1.2_Content                     | `others`       | `info_block`         | (none)          | false    | Text content sub-block of D.1        |
| D.2   | `313:8468`                   | D.2_Top Project                   | `others`       | `info_block`         | (none)          | false    | Award detail card — Top Project      |
| D.3   | `313:8469`                   | D.3_Top Project Leader            | `others`       | `info_block`         | (none)          | false    | Award detail card — Top Project Leader|
| D.4   | `313:8470`                   | D.4_Thông tin giải                 | `others`       | `info_block`         | (none)          | false    | Award detail card — Best Manager     |
| D.5   | `313:8471`                   | D.5_Signature 2025                | `others`       | `info_block`         | (none)          | false    | Award detail card — Signature 2025   |
| D.6   | `313:8510`                   | D.6_MVP                           | `others`       | `info_block`         | (none)          | false    | Award detail card — MVP              |
| D1    | `335:12023`                  | D1_Sunkudos                       | `others`       | `info_block`         | (none)          | false    | Sun* Kudos promo container           |
| D2    | `I335:12023;313:8419`        | D2_Content                        | `others`       | `info_block`         | (none)          | false    | Sun* Kudos text content sub-block    |
| D2.1  | `I335:12023;313:8426`        | D2.1_Button-IC                    | `button`       | `text_link`          | `on_click`      | false    | "Chi tiết" → /sun-kudos              |

> The Header (`313:8440`), Footer (`354:4323`), and the Bìa cover (`313:8449`) frames are
> reused container instances, not standalone interactive items, and are documented in
> [SCREENFLOW.md → Screen Details — Hệ thống giải](../../SCREENFLOW.md#screen-details--hệ-thống-giải--awards-information-zfydgyj_pd).
> Their per-item specs live with the source components (Header → Homepage SAA spec; Footer
> → Homepage SAA spec).

### Per-Item Detail

#### Item 3: `3_Keyvisual` (`313:8437`)

| Field          | Value                                                |
|----------------|------------------------------------------------------|
| nameTrans      | Keyvisual / Hero banner                              |
| itemType       | `file_or_image`                                      |
| itemSubtype    | `hero_banner`                                        |
| dataType       | (empty)                                              |
| required       | `false`                                              |
| userAction     | (empty)                                              |
| transitionNote | None — decorative                                    |

**Description**

Purpose and Context
Hero artwork that anchors the SAA 2025 awards page with the campaign's "Root Further" theme.

Display Elements:
- Image: Background artwork (`image 20`).
- Logo: SAA 2025 mark in the upper-left corner (decorative).

Function & Logic:
- Click: No action — purely decorative.
- State: Always rendered. Visual fitting (cover/contain, crop anchor) is resolved at
  implementation time per Figma, not asserted in this spec.
- Accessibility: Image MUST carry `alt="Keyvisual Sun* Annual Awards 2025"` so the
  decorative artwork is announced meaningfully (or `alt=""` if treated as purely decorative
  per WAI-ARIA — see QA).

**Validation Note**: (none — display-only)

**Candidate QA**
- Should the keyvisual be `alt=""` (decorative) or carry a meaningful alt text? Affects
  screen-reader announcement.
- Is the asset finalized in the design library, or will the implementer pull a different
  resolution for retina displays?

---

#### Item A: `A_Title hệ thống giải thưởng` (`313:8453`)

| Field          | Value                                                |
|----------------|------------------------------------------------------|
| nameTrans      | Awards system title                                  |
| itemType       | `label`                                              |
| itemSubtype    | —                                                    |
| dataType       | (empty)                                              |
| required       | `false`                                              |
| userAction     | (empty)                                              |
| transitionNote | None — static                                        |

**Description**

Purpose and Context
Title block introducing the SAA 2025 award system, sitting above the two-column award area.

Display Elements:
- Caption: Text "Sun* annual awards 2025" (small, above the headline).
- Headline: Text "Hệ thống giải thưởng SAA 2025" (H1).
- Children: Caption + Headline.

Function & Logic:
- Click: No action — static.
- State: Always rendered. Translated keys for both lines exist in `vi-VN` and `en-US`
  catalogs (i18n parity required per FR-011).

**Validation Note**: (none — display-only)

**Candidate QA**
- Confirm the H1 element is `<h1>` for SEO/a11y rather than a styled `<div>`. Critical for
  document outline.
- Should the caption "Sun* annual awards 2025" remain Latin in both locales, or be
  localized for `en-US`? It is brand copy — typically kept identical across locales.

---

#### Item B: `B_Hệ thống giải thưởng` (`313:8458`)

| Field          | Value                                                |
|----------------|------------------------------------------------------|
| nameTrans      | Awards system section                                |
| itemType       | `others`                                             |
| itemSubtype    | `info_block`                                         |
| hasChildren    | `true` (contains `C` and `D`)                        |
| userAction     | (empty)                                              |
| transitionNote | None — container                                     |

**Description**

Purpose and Context
Two-column container that pairs the navigation menu (`C`) with the vertical list of award
detail cards (`D.1`–`D.6`).

Display Elements:
- Children: `C_Menu list` (left), `D.Danh sách giải thưởng` (right).

Function & Logic:
- Layout: When the viewport is wide enough, the menu (`C`) and the award list (`D.1`–`D.6`)
  are presented side-by-side. On narrower viewports MVP falls back to scroll-only — the
  menu is hidden / collapsed and the user scrolls through `D.*` cards directly (resolved
  per Q-HTG4). Specific breakpoint values are NOT asserted in this spec.
- Logic: No business logic at the container level; all interactions are delegated to child
  items (`C.1`–`C.6`, `D2.1`).
- State: Always rendered.

**Validation Note**: (none — container)

**Candidate QA**: (none remaining — narrow-viewport behavior locked to scroll-only at MVP
per Q-HTG4)

---

#### Item C: `C_Menu list` (`313:8459`)

| Field          | Value                                                |
|----------------|------------------------------------------------------|
| nameTrans      | Awards navigation menu                               |
| itemType       | `others`                                             |
| itemSubtype    | `navigation`                                         |
| hasChildren    | `true` (contains `C.1`–`C.6`)                        |
| userAction     | (empty — actions are on child items)                 |
| transitionNote | None — container                                     |

**Description**

Purpose and Context
Sticky navigation menu listing the six SAA 2025 award categories. Acts as a table of
contents synchronized with the user's scroll position over the `D.*` cards.

Display Elements:
- Children: `C.1` Top Talent, `C.2` Top Project, `C.3` Top Project Leader, `C.4` Best
  Manager, `C.5` Signature 2025 — Creator, `C.6` MVP.
- Active indicator: One child item carries the active state at any time (semantic signal
  = `aria-current="true"`; visual treatment resolved at implementation time per Figma).

Function & Logic:
- Click on any child: Scrolls the page so the matching `D.*` card is visible (FR-004).
- Scroll synchronization: As the user scrolls, the active child updates to match the
  most-visible `D.*` card (FR-005, `IntersectionObserver` per TR-003).
- Sticky behavior: When the layout renders the menu alongside the award list, the menu
  remains in view while the award list scrolls. On narrow viewports MVP hides the menu
  entirely (scroll-only fallback per Q-HTG4 resolution).
- State: At least one child is active at all times after first paint; default `C.1` if no
  hash is present and no card is in view yet.

**Validation Note**: (none — container)

**Candidate QA**
- On keyboard navigation, does Tab move through `C.1`–`C.6` then to the right column, or
  does the menu trap focus?

---

#### Items C.1 – C.6: Navigation menu items (`313:8460`–`313:8465`)

| Field          | Value                                                                          |
|----------------|--------------------------------------------------------------------------------|
| nameTrans      | C.1 Top Talent / C.2 Top Project / C.3 Top Project Leader / C.4 Best Manager / C.5 Signature 2025 — Creator / C.6 MVP |
| itemType       | `others`                                                                       |
| itemSubtype    | `navigation_item`                                                              |
| hasChildren    | `false`                                                                        |
| dataType       | (empty)                                                                        |
| required       | `false`                                                                        |
| userAction     | `on_click`                                                                     |
| transitionNote | Scrolls page to the matching `D.x` card and sets the active state on the clicked item; previously active item loses its active state. |
| navigation.action | `navigate_in_page` (anchor link to `#<award-slug>`)                         |

**Description**

Purpose and Context
Clickable menu entry that scrolls the page to its matching award detail card and marks
itself as active.

Display Elements:
- Icon: Leading bullet/icon (per design instance, decorative).
- Label: Award name — "Top Talent" / "Top Project" / "Top Project Leader" / "Best Manager"
  / "Signature 2025 — Creator" / "MVP".

Function & Logic:
- Click: Scrolls to the matching `D.x` card via anchor `#<award-slug>` (slugs from
  `AwardSlug` in [src/lib/awards/awards.ts](../../../src/lib/awards/awards.ts):
  `top-talent`, `top-project`, `top-project-leader`, `best-manager`, `signature-2025-creator`,
  `mvp`); sets the clicked item's active state and clears the previously active item.
- Hover: Item shows hover affordance without changing the active state.
- Keyboard: Each item is a focusable anchor (`<a href="#<slug>">`); pressing Enter triggers
  the same scroll behavior as click.
- State: Active = `aria-current="true"` (FR-004 / TR-005); visual treatment resolved at
  implementation time.

**Validation Note**: (none — display / navigation)

**Candidate QA**
- Should the menu entry be a `<button>` (programmatic scroll) or `<a href="#slug">`
  (native browser anchor)? Default per FR-014 is `<a>` for graceful no-JS degradation.
- Should hover and active states be merged for touch devices, or is hover suppressed on
  pointer-coarse devices?

---

#### Items D.1 – D.6: Award detail cards (`313:8467` / `313:8468` / `313:8469` / `313:8470` / `313:8471` / `313:8510`)

| Field          | Value                                                                         |
|----------------|-------------------------------------------------------------------------------|
| nameTrans      | D.1 Top Talent / D.2 Top Project / D.3 Top Project Leader / D.4 Best Manager / D.5 Signature 2025 — Creator / D.6 MVP |
| itemType       | `others`                                                                      |
| itemSubtype    | `info_block`                                                                  |
| hasChildren    | `true` (each contains `Picture-Award` + `Content`)                            |
| userAction     | (empty — read-only)                                                            |
| transitionNote | None                                                                          |

**Description**

Purpose and Context
Read-only catalog cards. Each card explains one SAA 2025 award category in full — title,
description, quantity, and monetary value. Six cards in fixed order; the user reads them
top-to-bottom or jumps via the menu.

Display Elements (per card):
- Image: `Picture-Award` thumbnail — `D.1.1` / equivalent in each card.
- Title: Award name (e.g., "Top Talent").
- Description: Short paragraph explaining the award's intent.
- Number-of-awards line: "Số lượng giải thưởng: {n} {unit}". Per the catalog data:
  - `D.1` Top Talent: 10 Đơn vị
  - `D.2` Top Project: 02 Tập thể
  - `D.3` Top Project Leader: 03 Cá nhân
  - `D.4` Best Manager: 01 Cá nhân
  - `D.5` Signature 2025 — Creator: 01 (no unit)
  - `D.6` MVP: 01 (no unit)
- Value line: "Giá trị giải thưởng: {value} VNĐ {note}". Per the catalog data:
  - `D.1` 7.000.000 VNĐ (per giải)
  - `D.2` 15.000.000 VNĐ (per giải)
  - `D.3` 7.000.000 VNĐ
  - `D.4` 10.000.000 VNĐ
  - `D.5` 5.000.000 VNĐ (cá nhân) / 8.000.000 VNĐ (tập thể)
  - `D.6` 15.000.000 VNĐ

Function & Logic:
- Click: No action — cards are read-only.
- Anchor: Each card carries `id="{slug}"` so deep-links from Homepage award cards (FR-006)
  land here.
- Scroll-margin: Anchor jumps land with the title fully visible (offset value resolved at
  implementation time per TR-004 / Q-HTG5).
- Logic: When the card crosses into the viewport, the matching `C.x` menu item becomes
  active (FR-005).
- State: Always rendered.

**Validation Note**: (none — read-only)

**Candidate QA**
- Card image (`Picture-Award`) — fallback when load fails? Default per Edge Cases is
  `alt`-text rendering.
- Should the value line be locale-aware-formatted (e.g., `7,000,000 VND` for `en-US`) or
  always retain the Vietnamese `7.000.000 VNĐ` formatting? FR-012 currently mandates the
  Vietnamese formatting in both locales — confirm with PO.

---

#### Item D.1.1: `D.1.1_Picture-Award` (`I313:8467;214:2525`)

| Field          | Value                                                |
|----------------|------------------------------------------------------|
| nameTrans      | Award thumbnail                                      |
| itemType       | `file_or_image`                                      |
| itemSubtype    | `image`                                              |
| dataType       | (empty)                                              |
| required       | `false`                                              |
| userAction     | (empty)                                              |
| transitionNote | None                                                 |

**Description**

Purpose and Context
Square thumbnail representing the award visually within each `D.*` card.

Display Elements:
- Image: Award icon / artwork (one of six unique assets, mapped by slug).

Function & Logic:
- Click: No action — display-only image (read-only screen).
- Source: Asset path resolved per slug at build time; downloaded via
  `get_media_files` / `list_media_nodes` during implementation.
- State: Renders identically; missing-image fallback shows `alt` text per Edge Cases.

**Validation Note**: (none — display-only)

**Candidate QA**
- Are the six thumbnails finalized in MoMorph media library, or will marketing replace
  them before launch? Affects build-time asset import strategy.
- Should the image be a Next.js `<Image>` component for automatic optimization, or a raw
  `<img>` tag? Default = `<Image>`.

---

#### Item D.1.2: `D.1.2_Content` (`I313:8467;214:2526`)

| Field          | Value                                                |
|----------------|------------------------------------------------------|
| nameTrans      | Award content sub-block                              |
| itemType       | `others`                                             |
| itemSubtype    | `info_block`                                         |
| hasChildren    | `true`                                               |
| userAction     | (empty)                                              |
| transitionNote | None                                                 |

**Description**

Purpose and Context
Text-side sub-block of every `D.*` award card. Holds the title, description, and the two
metadata lines (quantity + value).

Display Elements:
- Title: Award name.
- Description: Award intent paragraph.
- Quantity line: "Số lượng giải thưởng: {n} {unit}".
- Value line: "Giá trị giải thưởng: {value} VNĐ".

Function & Logic:
- Click: No action — read-only.
- Logic: All values resolved from the static catalog at
  [src/lib/awards/awards.ts](../../../src/lib/awards/awards.ts) (extend with `quantity`,
  `unit`, `valueVND` per Q-HTG3).
- State: Always rendered.

**Validation Note**: (none — read-only)

**Candidate QA**
- Confirm the order of the metadata lines (quantity above value) is fixed across all six
  cards.
- Is there ever a case where one of the metadata lines is hidden (e.g., a future award
  with no fixed value)? Affects template flexibility.

---

#### Item D1: `D1_Sunkudos` (`335:12023`)

| Field          | Value                                                |
|----------------|------------------------------------------------------|
| nameTrans      | Sun* Kudos promo block                               |
| itemType       | `others`                                             |
| itemSubtype    | `info_block`                                         |
| hasChildren    | `true` (contains `D2_Content`)                       |
| userAction     | (empty — actions live on child `D2.1`)               |
| transitionNote | None — container                                     |

**Description**

Purpose and Context
Cross-promotional block at the bottom of the page that introduces the Sun* Kudos
recognition campaign. Same component instance as Homepage `D1`.

Display Elements:
- Children: `D2_Content` (text), illustration (decorative), `D2.1_Button-IC` ("Chi tiết").

Function & Logic:
- Layout: Delegates entirely to the shipped `KudosBlock` component; identical responsive
  adaptation to Homepage `D1` (no per-screen layout fork).
- Logic: Container only — text + button live in `D2`/`D2.1`.
- State: Always rendered.

**Validation Note**: (none — container)

**Candidate QA**
- Does this block respect the same i18n keys as Homepage's `D1` (i.e., the same
  translation strings), or does Hệ thống giải have its own `awards.kudos.*` keys?
  Recommended: reuse Homepage's keys to avoid divergence.

---

#### Item D2: `D2_Content` (`I335:12023;313:8419`)

| Field          | Value                                                |
|----------------|------------------------------------------------------|
| nameTrans      | Sun* Kudos content sub-block                         |
| itemType       | `others`                                             |
| itemSubtype    | `info_block`                                         |
| hasChildren    | `true`                                               |
| userAction     | (empty)                                              |
| transitionNote | None                                                 |

**Description**

Purpose and Context
Text content sub-block of the Sun* Kudos promo block. Holds the label, title, description,
and the call-to-action button.

Display Elements:
- Label: Text "Phong trào ghi nhận".
- Title: Text "Sun* Kudos".
- Description: Short paragraph summarizing the campaign.
- Button: `D2.1_Button-IC` "Chi tiết".

Function & Logic:
- Click: No action at the container level — the embedded button handles navigation.
- Logic: All strings resolved via i18n keys mirrored from Homepage `D1`.
- State: Always rendered.

**Validation Note**: (none — read-only)

**Candidate QA**
- Is the description copy fixed across SAA 2025, or seasonal? Affects whether to embed it
  as a static i18n key or a CMS-driven value.

---

#### Item D2.1: `D2.1_Button-IC` (`I335:12023;313:8426`)

| Field             | Value                                                                            |
|-------------------|----------------------------------------------------------------------------------|
| nameTrans         | "Details" link button                                                            |
| itemType          | `button`                                                                         |
| buttonType        | `text_link`                                                                      |
| dataType          | (empty)                                                                          |
| required          | `false`                                                                          |
| userAction        | `on_click`                                                                       |
| transitionNote    | Navigates to the Sun* Kudos detail page (`/sun-kudos`).                          |
| navigation.action | `navigate:sun_kudos`                                                             |

**Description**

Purpose and Context
Call-to-action that opens the Sun* Kudos detail page. The only interactive button on the
Hệ thống giải screen aside from the menu items.

Display Elements:
- Label: Text "Chi tiết".
- Icon: Trailing chevron / link icon (decorative).

Function & Logic:
- Click: Navigates to `/sun-kudos` (FR-008). Uses Next.js `<Link>` for client-side
  navigation; native `Cmd/Ctrl + Click` opens in a new tab.
- Hover: Hover affordance per shared `text_link` button styling (visual handled by the
  reused component; no per-screen visual override).
- State: Always enabled — there is no precondition for navigating to the Kudos detail
  page on this screen. Disabled / loading states are not applicable for this read-only
  navigation action.
- Keyboard: Focusable; Enter triggers navigation.

**Validation Note**: (none — navigation only; no server-side validation expected)

**Candidate QA**
- Does the link open a new tab (`target="_blank"`) or stay in the same tab? Default = same
  tab (in-app navigation).
- Should the click emit an analytics event (e.g., `click_kudos_cta_from_awards`)? Spec is
  silent — defer to analytics owner.
- Loading state required while navigating? Default = no (Next.js `<Link>` handles
  prefetch + transition natively).

---

> **Cross-cut decisions (applies to the whole screen — all locked 2026-05-09)**
> - Q-HTG1 → Route = `/awards`.
> - Q-HTG2 → Active-state detection = `IntersectionObserver`.
> - Q-HTG3 → Data source = static catalog at
>   [src/lib/awards/awards.ts](../../../src/lib/awards/awards.ts).
> - Q-HTG4 → Narrow-viewport menu = scroll-only fallback (MVP); structured patterns
>   deferred post-MVP.
> - Q-HTG5 → Scroll-margin-top offset resolved at implementation time; no pixel value
>   asserted in this spec.
>
> See `## Resolved Decisions` above for the full rationale on each.

---

## Notes

- This spec was authored from Figma frame `313:8436` (`zFYDgyj_pD`) on 2026-05-09 using
  `list_design_items` (which returned 22 entries — 21 valid design items covering the six
  `C.*` menu items, the six `D.*` info-blocks plus their `Picture-Award` / `Content`
  sub-items, the `D1`/`D2`/`D2.1` Sun* Kudos block, the title `A`, the section container
  `B`, the menu container `C`, and the keyvisual `3` — plus 1 empty placeholder) plus the
  existing 15-test-case suite (`get_frame_test_cases`, IDs ID-0..ID-14). All stated
  quantities and values in this spec are sourced verbatim from the Figma design-item
  descriptions — they MUST NOT be edited unless the Figma frame is updated and the spec is
  re-derived.
- The screen reuses **every** layout-level component already shipped on Homepage. The new
  components anticipated in plan phase are limited to the awards-list layout primitives:
  `AwardsLayout`, `AwardsNav`, `AwardDetailCard`, `AwardsList`. Plan phase MUST verify this
  list against the constitution's "no premature abstraction" principle.
- Test case ID-13 ("Invalid section ID") and ID-14 ("Failed navigation to Sun* Kudos") are
  covered by Edge Cases above (graceful degradation + native error page) — no custom error
  UI is required at MVP.
- **Source-data quirk for `C.6_MVP` (`313:8465`)**: `list_design_items` describes `C.6` with
  the *card* content text ("Thẻ 'MVP' hiển thị thông tin giải thưởng và giá trị…"),
  identical to `D.6_MVP`'s card description. Every other `C.x` entry is described as a
  navigation-menu item ("Hiển thị mục điều hướng…"). This spec treats `C.6` as a menu item
  consistent with its position inside `C_Menu list` (`313:8459`) and the rest of the menu
  family. If the design is updated, re-derive both `C.6` and `D.6` together to confirm
  the inconsistency is resolved.
- **Test case ID-3 (overall structure)** — "Title at top, menu on left, content in center,
  banner Sun* Kudos at bottom" — is covered implicitly by `FR-002` (six cards in fixed
  order), `FR-003` (six-item menu), `FR-009` / `FR-010` (header / footer / Kudos block
  reuse) and the Screen Components table. No additional FR is needed.
