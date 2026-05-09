# Implementation Plan: Hệ thống giải thưởng SAA 2025 (Awards Information)

**Frame**: `zFYDgyj_pD-he-thong-giai`
**Date**: 2026-05-09
**Spec**: `.momorph/specs/zFYDgyj_pD-he-thong-giai/spec.md` (Status: **Ready for plan — Q-HTG1..Q-HTG5 all resolved 2026-05-09**)
**Constitution**: [.momorph/constitution.md](../../constitution.md) (v1.1.1)
**SCREENFLOW**: [.momorph/SCREENFLOW.md](../../SCREENFLOW.md) (Hệ thống giải surveyed 2026-05-09)
**Predecessor specs (shipped)**: Login (`GzbNeVGJHz`), Dropdown — Language (`hUyaaugye2`), Homepage SAA (`i87tDx10uM`, Phases 1–13 shipped), Dropdown — Profile user (`z4sCl3_Qtk`).

---

## Summary

Replace the existing stub at [app/awards/page.tsx](../../../app/awards/page.tsx) (which currently renders a generic `StubPage`) with the real **Hệ thống giải** screen. The page is a **read-only catalog** of all six SAA 2025 award categories, organized as a sticky left-side navigation menu (`C.1`–`C.6`) paired with a vertical list of full detail cards (`D.1`–`D.6`). Each card shows title + thumbnail + description + quantity line ("Số lượng giải thưởng: {n} {unit}") + value line ("Giá trị giải thưởng: {value} VNĐ"). The screen also embeds the same `KudosBlock` component used on Homepage to cross-link `/sun-kudos` (button `D2.1`).

The plan reuses **every** layout-level component already shipped by Homepage Phase 13: `Header` (composed via slot props — `nav={<NavLinks currentPath="/awards" />}` flips the existing `Awards Information` link to its active state automatically; `notification`, `profileMenu`, `logoHref` slots populated identically to Homepage), `Footer`, `KudosBlock`, `Logo`, `LanguageSelector`, `NotificationBell`, `ProfileButton`, `WidgetButton`, plus the existing `NavLinks` component (already includes `{ href: "/awards", labelKey: "home.nav.awards" }` — no change needed). The only *new* code is:

1. **Static-catalog extension** in [src/lib/awards/awards.ts](../../../src/lib/awards/awards.ts) — append four new fields per award (`quantity`, `unit`, `valueVND`, `valueVNDSecondary`) and an `awardImageAsset` field for the 336×336 detail thumbnail (different from the existing card-label asset used on Homepage).
2. **Four new feature-folder components** under `src/components/awards/`: `AwardsLayout`, `AwardsNav` (Client Component island — owns `IntersectionObserver` + active-state), `AwardDetailCard`, `AwardsList`.
3. **Six new asset files** at `public/assets/awards/` — one square thumbnail per award.
4. **New `awards.detail.*` i18n keys** (description, quantity-label, value-label, unit translations) in both `vi-VN` and `en-US` catalogs in lockstep.
5. The `app/awards/page.tsx` Server Component, replacing the stub.

All five originally-open questions are locked: route = `/awards`; data source = static catalog; active-section detection = `IntersectionObserver`; narrow-viewport menu = scroll-only fallback; scroll-margin offset resolved at implementation time. **No new dependency. No new server endpoint. No DB schema change.**

---

## Technical Context

**Language/Framework**: TypeScript 5 (strict) / Next.js 16.2.4 (App Router) — unchanged.
**Primary Dependencies**: React 19, Tailwind CSS v4, Auth.js v5, Prisma. **No new runtime packages.**
**Database**: PostgreSQL via Prisma — **no schema change** (read-only screen, all data is static catalog).
**Testing**: Vitest 4 (unit / integration) + Playwright 1.59 (E2E, chromium) — same harness as Homepage.
**State Management**: Local React state in `AwardsNav` only (`activeSlug`, `IntersectionObserver` ref). No Redux / Zustand / context store.
**API Style**: REST. No new endpoints. Reuses `auth()` (server), `GET /api/notifications/unread-count` (header bell), `POST /api/i18n/locale` (header language chip), `signOutAction` (Server Action via Profile dropdown).
**Path alias**: `@/*` → `./*` (same as Login / Homepage plans).
**Design source**: Figma file `9ypp4enmFmdK3YAFJLIu6C`, frame `zFYDgyj_pD` (revision `bd17cac24871c9513f259333a5431530`). CSS values fetched at implementation time via `query_section` per Node ID; six award thumbnails downloaded via `get_media_files` / `list_media_nodes`.

---

## Constitution Compliance Check

*GATE: Must pass before implementation. Each item maps to a principle in `.momorph/constitution.md` (v1.1.1).*

- [x] **Principle I — Clean Code & Readable Structure**: Feature-folder layout (`src/components/awards/` + `src/lib/awards/`) parallels the Homepage convention (`src/components/home/`, `src/lib/awards/`). One responsibility per file: `AwardsLayout` handles structure, `AwardsNav` owns scroll-tracking, `AwardDetailCard` renders one card, `AwardsList` enumerates the six cards. Kebab-case for non-component modules; PascalCase for components. No dead code; lint-clean enforced (SC-006).
- [x] **Principle II — Stack Best Practices**: **Server Components by default** — `app/awards/page.tsx`, `AwardsLayout`, `AwardsList`, `AwardDetailCard` are all Server Components (TR-001 mandates server-rendered first paint). Only `AwardsNav` is a Client Component island (`"use client"`) because it needs `IntersectionObserver` + `useEffect` + `useState`. No business logic in route handlers (route handler is just `auth()` gate + render). No `any`. Tailwind tokens only — extend `app/globals.css` with new tokens BEFORE referencing them (anticipated tokens: `saa-awards-nav-active`, `saa-awards-nav-fg`, `saa-awards-card-meta-fg`; verified during Phase 0). Static module import for awards data (zero IO at runtime). Reuses Prisma singleton via `auth()`.
- [x] **Principle III — Platform-Appropriate UI Patterns**: Responsive ≥360 px. Two-column wide-viewport layout (sticky `AwardsNav` left + scrolling `AwardsList` right); narrow-viewport fallback = scroll-only with menu hidden (Q-HTG4 resolution). Specific breakpoint values resolved at implementation time using existing Tailwind tokens. WCAG 2.1 AA: keyboard-focusable anchors with `aria-current="true"` on active item (TR-005); focus order follows DOM; menu items render as `<a href="#<slug>">` (FR-014) so the page is navigable without JS. **Touch targets ≥ 44 × 44 CSS-px on mobile breakpoints** (Constitution Principle III mandate): each `C.x` menu-item anchor and the `D2.1` `Chi tiết` button MUST have padding sized to meet this minimum at the 360 px viewport (verified in Phase 6 by a Playwright bounding-rect assertion at the smallest supported width). `prefers-reduced-motion` respected on menu-click smooth-scroll and on any hover transition that ships. Active state announced via `aria-current`, not via colour alone.
- [x] **Principle IV — OWASP Secure Coding**: Trust boundaries handled — `auth()` gates the page (TR-002 mirrors Homepage FR-001a); the global pre-launch gate in `proxy.ts` already redirects every non-whitelisted route to `/coming-soon` while `now() < SAA_LAUNCH_AT` (covered project-wide). No new untrusted input is read — the only user input is the URL hash, and arbitrary hashes are handled gracefully (FR-007: unknown slug → no scroll, default `C.1` active, no error). Static module import means no SSRF / no injection surface. Threat-model details in §Risk Assessment.
- [x] **Principle V — Test-Driven Development**: Failing tests written before implementation for every FR. Vitest covers: `AwardsNav` active-state synchronization (FR-005), `IntersectionObserver` mock, hash-on-mount derivation (FR-006), unknown-slug fallback (FR-007), six-card render order (FR-002), six-menu-item render order (FR-003), value-formatter locale-invariance (FR-012), i18n parity (TR-006 / SC-005). Playwright covers: anonymous redirect to `/login` (US5 acceptance #1), Homepage-card → Awards deep-link with anchor scroll (US1 acceptance #2), menu-click → matching card scroll + active-state flip (US1 #4), scroll-tracked menu sync (US2), Sun* Kudos `Chi tiết` → `/sun-kudos` (US3), header parity (US4). Coverage targets: unit ≥80%, E2E covers all P1 user stories (US1, US2, US5).

**Threat model summary** *(Principle IV)*:

- **Trust boundaries**: browser ↔ Next.js server. No new server-to-DB or server-to-third-party edge.
- **Sensitive data handled**: session token (Auth.js, already protected); `User.locale` (low sensitivity, reused). The awards catalog is non-sensitive marketing copy.
- **Abuse cases to test**:
  - Anonymous request to `/awards` → redirected to `/login` (TR-002 — covered by Playwright).
  - URL hash injection (`/awards#<script>...`) → renders the page; no scroll triggered (Edge Case "unknown slug"); React's default escaping prevents XSS (no `dangerouslySetInnerHTML` anywhere in this feature).
  - Hash-flooding via `replaceState` from devtools — IntersectionObserver only updates `activeSlug` from observed DOM nodes, so external hash mutation cannot bypass the observed-card invariant.
  - Cross-tab session revocation → next request to `/awards` redirects to `/login` (already covered by `auth()`).
  - Pre-launch gate active → request to `/awards` returns 302 to `/coming-soon` (covered by existing `proxy.ts` test matrix).

**Violations**: none.

---

## Architecture Decisions

### Frontend Approach

- **Component Structure**: New feature folder `src/components/awards/` for screen-specific components; reuse `src/components/home/` for `KudosBlock`, `WidgetButton`, `Footer`, `NotificationBell`, `ProfileButton`; reuse `src/components/header/` for `Header` + `LanguageSelector` + `Logo`. No atomic-design split — flat per-feature folder per project convention.
- **Server / Client boundary**:
  - **Server (default)**: `app/awards/page.tsx`, `AwardsLayout`, `AwardsList`, `AwardDetailCard`. These compose static markup from the `AWARDS` array + i18n strings + `auth()` session.
  - **Client (`"use client"`)**: `AwardsNav` (single client island for the entire screen). Owns `useState({ activeSlug })`, `useEffect` with `IntersectionObserver` watching all six `D.*` card DOM nodes by id, click-handlers that smooth-scroll to the matching card (with respect for `prefers-reduced-motion`), and on-mount hash parsing (FR-006).
  - Existing client islands continue unchanged: `LanguageSelector`, `NotificationBell`, `ProfileButton`, `WidgetButton` (all reused via `Header`).
- **Styling Strategy**: Tailwind v4 utilities only. Reuse existing tokens; extend `app/globals.css` with any new tokens needed for the awards screen — anticipated:
  - `--color-saa-awards-nav-active` — colour for the active menu item.
  - `--color-saa-awards-nav-fg` — base menu-item text colour.
  - `--color-saa-awards-card-meta-fg` — muted text colour for "Số lượng giải thưởng:" / "Giá trị giải thưởng:" labels.
  - `--saa-header-scroll-margin` — CSS custom property representing the deployed header overlap height. **Important header-positioning note**: the existing shipped `Header` ([src/components/header/Header.tsx](../../../src/components/header/Header.tsx)) uses `position: absolute; top: 0` (not sticky / not fixed) with `h-20` (80px). On the current Homepage, the header scrolls AWAY with the page on scroll — there is **no occlusion** of deep-linked content during programmatic / hashchange-driven scroll. Consequently, today the correct value for `--saa-header-scroll-margin` is `0px`. The CSS-variable mechanism is kept as future-proofing per spec TR-004: if a later iteration converts the Header to `position: sticky` / `position: fixed`, only the value of `--saa-header-scroll-margin` needs to change (set to `5rem` / 80px) and both the cards' `scroll-margin-top` and the observer `rootMargin` pick it up. The `IntersectionObserver` `rootMargin` likewise reads from this var via `getComputedStyle(document.documentElement).getPropertyValue("--saa-header-scroll-margin")`. **Action in Phase 0**: confirm the Awards-page Figma frame does not require a sticky header (re-survey the frame `query_section` on `Header` and `B_Hệ thống giải thưởng` to validate); if Figma shows the header sticky on Awards, file a follow-up to convert the Header component (out of scope for this plan — header reuse rule per FR-009).
  Token names finalized during Phase 0 against Figma values (`query_section` on the relevant nodes).
- **Data Fetching**: All data is a **static module import** — no `fetch()`, no API call, no async waterfall. `app/awards/page.tsx` reads the `AWARDS` constant from `src/lib/awards/awards.ts` and the user session via `auth()`. The header bell badge fetch (`/api/notifications/unread-count`) is already encapsulated inside `Header` — no per-screen wiring.
- **State Management**:
  - `AwardsNav` (client island): `useState({ activeSlug: AwardSlug | null })`. Initial value derived from `window.location.hash` on mount, falls back to `top-talent` if no/unknown hash (FR-007). `useEffect` instantiates a single `IntersectionObserver` watching the six `D.*` cards by `id`; observer callback updates `activeSlug` to the slug whose card has the highest visible intersection ratio. A separate `useEffect` listens to `hashchange` events so manual URL-bar edits trigger the same scroll + active-state update as a click. Cleanup disconnects the observer on unmount.
  - All other components: stateless / static.
- **No global store** required. Locale + auth come from server. The screen has no cross-component shared state beyond what `Header` already manages.

### Backend Approach

- **API Design**: **No new endpoints.** Static catalog at build time satisfies all data needs (Q-HTG3 resolution). Reuses `auth()`, `GET /api/notifications/unread-count`, `POST /api/i18n/locale`, `signOutAction`.
- **Data Access**: N/A (no DB read).
- **Validation**: N/A (no user input).

### Codebase Research Findings (2026-05-09)

Discoveries from reading the existing codebase that shape this plan; collected here so a developer doesn't need to re-survey:

- **`Header` (`src/components/header/Header.tsx`)** — slot-based composition; props are `locale`, `isAuthenticated?`, `nav?` (ReactNode), `notification?` (ReactNode), `profileMenu?` (ReactNode), `logoHref?`. Positioning: `position: absolute; top: 0; h-20` (80px tall, scrolls with the page). **No `selected` prop** — active-link state is delegated to whichever ReactNode the consumer puts in the `nav` slot.
- **`NavLinks` (`src/components/home/NavLinks.tsx`)** — already enumerates `[{href:"/", labelKey:"home.nav.about"}, {href:"/awards", labelKey:"home.nav.awards"}, {href:"/sun-kudos", labelKey:"home.nav.kudos"}]` and applies `aria-current="page"` when `item.href === currentPath`. **Reusable as-is** — Awards page passes `currentPath="/awards"` and gets the active state automatically.
- **`AwardCard` (`src/components/home/AwardCard.tsx`)** — Homepage-only card layout; uses a 336×336 background asset (`AWARD_BG_ASSET = "/assets/home/images/award-bg.png"`) + per-award label asset overlay (`award.labelAsset`, sizes vary per slug 222×36 to 232×64). **NOT reused on Awards screen** — the Awards page card design (per Figma `D.1`–`D.6`) uses a unique 336×336 thumbnail per award (the new `awardImageAsset` field). The `AWARD_BG_ASSET` and the `labelAsset` set continue to belong to Homepage exclusively.
- **`Award` type / `AWARDS` array (`src/lib/awards/awards.ts`)** — six entries with `id`, `slug`, `titleKey`, `descriptionKey`, `labelAsset`, `labelWidth`, `labelHeight`. Slugs use `kebab-case`; i18n keys use the same slug with `-` → `_` substitution applied **manually per entry** (e.g., slug `signature-2025-creator` ↔ key `home.awards.signature_2025_creator.title`). **The mapping is not auto-derived** — Phase 1 must populate the new fields with explicit string literals matching this pattern.
- **`KudosBlock` (`src/components/home/KudosBlock.tsx`)** — already includes the `Chi tiết` link to `/sun-kudos` (Homepage Phase 13). Awards page mounts it without modification; no new props or wrapping required.
- **`Footer`, `NotificationBell`, `ProfileButton`, `WidgetButton`, `LanguageSelector`, `Logo`** — all shipped, all reused unchanged.
- **`auth()` (`src/lib/auth.ts`)** — Auth.js v5 wrapper. Pattern from existing stub `app/awards/page.tsx`: `const session = await auth().catch(() => null); if (!session?.user) redirect("/login")`. The Awards page reuses this exact gate.
- **i18n keys**: `home.awards.{slug_with_underscores}.title` / `.description` already exist for all six awards; `home.awards.section.*` keys exist but are Homepage-section-specific and not reused on this screen.
- **Tests harness**: `vitest.config.ts` + `vitest.setup.ts` shipped with Vitest 4 + jsdom + RTL (`@testing-library/jest-dom/vitest` is already imported in `vitest.setup.ts`). Playwright at `playwright.config.ts` with chromium + `tests/global-setup.ts`. Both wired into CI (`npm run lint`, `npm run test`, `npm run test:e2e`). Existing seeded-test-user fixture in `tests/fixtures/` is in use by Login + Homepage E2E suites — Awards reuses the same fixture. Test directory convention: `tests/unit/{layer}/{module}/` mirrors `src/{layer}/{module}/` (e.g., existing `tests/unit/lib/awards/awards.test.ts` ↔ `src/lib/awards/awards.ts`; existing `tests/unit/components/home/NavLinks.test.tsx` ↔ `src/components/home/NavLinks.tsx`).

### Integration Points

- **Existing Services / Helpers reused (DO NOT rebuild)**:
  - [src/lib/auth.ts](../../../src/lib/auth.ts) — `auth()` for session check.
  - [src/lib/cookies/saa-locale.ts](../../../src/lib/cookies/saa-locale.ts) — locale cookie parser.
  - [src/lib/i18n/index.ts](../../../src/lib/i18n/index.ts) — `t(key, locale)` translator.
  - [src/lib/i18n/types.ts](../../../src/lib/i18n/types.ts) — `SupportedLocale` + `SUPPORTED_LOCALES`.
  - [src/lib/awards/awards.ts](../../../src/lib/awards/awards.ts) — `AWARDS` array + `AwardSlug` union (extended in Phase 1).
- **Existing Components reused (DO NOT rebuild)**:
  - [src/components/header/Header.tsx](../../../src/components/header/Header.tsx) — slot-based composition. Awards page passes `locale`, `isAuthenticated={true}`, `nav={<NavLinks currentPath="/awards" locale={locale} />}`, `notification={<NotificationBell ... />}`, `profileMenu={<ProfileButton ... />}`, `logoHref="/"`. **No new prop on Header.**
  - [src/components/home/NavLinks.tsx](../../../src/components/home/NavLinks.tsx) — already enumerates `[{href:"/", ...}, {href:"/awards", ...}, {href:"/sun-kudos", ...}]` and applies `aria-current="page"` when `item.href === currentPath`. Awards page just passes `currentPath="/awards"` and the active-state styling falls out automatically (TR-005 satisfied for the top-level header nav).
  - [src/components/header/LanguageSelector.tsx](../../../src/components/header/LanguageSelector.tsx) — header language chip (mounted inside Header).
  - [src/components/header/Logo.tsx](../../../src/components/header/Logo.tsx) — header + footer logo (mounted inside Header / Footer).
  - [src/components/home/Footer.tsx](../../../src/components/home/Footer.tsx) — full footer.
  - [src/components/home/KudosBlock.tsx](../../../src/components/home/KudosBlock.tsx) — Sun* Kudos promo block (`D1`/`D2`/`D2.1`).
  - [src/components/home/NotificationBell.tsx](../../../src/components/home/NotificationBell.tsx) — bell + badge.
  - [src/components/home/ProfileButton.tsx](../../../src/components/home/ProfileButton.tsx) — profile dropdown trigger.
  - [src/components/home/WidgetButton.tsx](../../../src/components/home/WidgetButton.tsx) — floating quick-action FAB.
- **API Contracts**: N/A (no new endpoints).
- **i18n integration**: Two-tier strategy.
  - **Reused keys (no change)** — title + description per award already exist as `home.awards.{slug_with_underscores}.title` / `.description` (created in Homepage Phase 13). The Awards screen reuses these directly via `award.titleKey` / `award.descriptionKey` from the catalog. Slug-to-key mapping is *manually wired* in `src/lib/awards/awards.ts` (existing pattern: slug `signature-2025-creator` ↔ key `home.awards.signature_2025_creator.title` — note the hyphen → underscore substitution is explicit per-entry, not auto-derived).
  - **New keys (added in lockstep to both catalogs in Phase 0)** — placed under a new `awards.detail.*` namespace dedicated to this screen:
    | Key | vi-VN value | en-US value | Used by |
    |-----|-------------|-------------|---------|
    | `awards.detail.title_caption` | `Sun* annual awards 2025` | `Sun* annual awards 2025` | `AwardsTitleBlock` (caption above H1) |
    | `awards.detail.title_heading` | `Hệ thống giải thưởng SAA 2025` | `SAA 2025 Awards System` | `AwardsTitleBlock` (H1) |
    | `awards.detail.quantity_label` | `Số lượng giải thưởng:` | `Number of awards:` | `AwardDetailCard` quantity line |
    | `awards.detail.value_label` | `Giá trị giải thưởng:` | `Award value:` | `AwardDetailCard` value line |
    | `awards.detail.unit.don_vi` | `Đơn vị` | `units` | Top Talent quantity unit |
    | `awards.detail.unit.tap_the` | `Tập thể` | `team(s)` | Top Project quantity unit |
    | `awards.detail.unit.ca_nhan` | `Cá nhân` | `individual(s)` | Top Project Leader / Best Manager unit |
    | `awards.detail.value_individual` | `cá nhân` | `individual` | Signature 2025 secondary-tier annotation |
    | `awards.detail.value_team` | `tập thể` | `team` | Signature 2025 secondary-tier annotation |
  English copy is **draft** for the table above — Phase 0 confirms with PO before commit. **Not reused**: any `home.awards.section.*` keys (these are Homepage section header copy and don't apply to the standalone Awards page).
  - Existing parity test at [tests/unit/lib/i18n/parity.test.ts](../../../tests/unit/lib/i18n/parity.test.ts) automatically extends to cover the new `awards.detail.*` namespace — it iterates the union of keys in both catalogs and asserts every key resolves in both, with no "extra" key in either.

---

## Project Structure

### Documentation (this feature)

```text
.momorph/specs/zFYDgyj_pD-he-thong-giai/
├── spec.md       # Feature specification (Q-HTG1..Q-HTG5 resolved)
├── plan.md       # This file
├── tasks.md      # Generated next via /momorph.tasks
└── assets/       # (optional, only if research artifacts are saved)
```

### Source Code (affected areas)

```text
# Frontend — NEW
src/components/awards/
├── AwardsLayout.tsx       # Server Component — page-level layout container
├── AwardsNav.tsx          # Client Component island — IntersectionObserver + active state
├── AwardsList.tsx         # Server Component — renders six AwardDetailCard
└── AwardDetailCard.tsx    # Server Component — one card (thumbnail + title + desc + meta lines)
src/lib/awards/
└── format.ts              # NEW pure helper: formatVndAmount(value: number): string (FR-012)

# Inline within app/awards/page.tsx (NOT extracted into separate files; "no premature abstraction" per Constitution Principle I):
#   Keyvisual           — decorative banner, server component, ~10 LoC
#   AwardsTitleBlock    — H1 + caption block, server component, ~15 LoC

# Frontend — MODIFIED
app/awards/page.tsx        # Replace StubPage with the real screen (composes Header / Keyvisual / AwardsTitleBlock / AwardsLayout / KudosBlock / Footer / WidgetButton)
src/lib/awards/awards.ts   # Extend Award type with quantity / unitKey / valueVND / valueVNDSecondary / awardImageAsset; populate the six existing entries with new field values
src/lib/i18n/catalogs/vi-VN.json   # Add 9 awards.detail.* keys (see §"Integration Points → i18n integration")
src/lib/i18n/catalogs/en-US.json   # Add same 9 awards.detail.* keys (parity with vi-VN; English copy confirmed with PO in Phase 0)
app/globals.css            # Add 4 new tokens: --color-saa-awards-nav-active, --color-saa-awards-nav-fg, --color-saa-awards-card-meta-fg, --saa-header-scroll-margin

# Assets — NEW
public/assets/awards/
├── top-talent.png         # 336×336 award thumbnail
├── top-project.png
├── top-project-leader.png
├── best-manager.png
├── signature-2025-creator.png
└── mvp.png

# Tests — NEW (paths mirror src/ structure per project convention — see tests/unit/components/home/* and tests/unit/lib/awards/awards.test.ts)
tests/unit/components/awards/
├── AwardsNav.test.tsx          # IntersectionObserver active-state, hash parsing, hashchange listener, anchor markup (Phase 4)
├── AwardDetailCard.test.tsx    # Renders all 5 content pieces per FR-002, unit substitution, dual-tier value for Signature 2025, FR-012 VNĐ format (Phase 2)
└── AwardsList.test.tsx         # Six cards rendered in fixed order (Phase 3)
tests/unit/lib/awards/
└── format.test.ts                # formatVndAmount(7000000) === "7.000.000" + invariants (FR-012) (Phase 1)
tests/e2e/awards.spec.ts          # All P1 user stories end-to-end (Phases 3 + 4 + 5 + 6)

# Tests — MODIFIED
vitest.setup.ts                                    # Phase 4 adds an IntersectionObserver global stub (file does not currently ship one). Stub is inert by default — only Awards tests call its `triggerEntries` API; Homepage / Login / other suites are unaffected.
tests/unit/lib/awards/awards.test.ts               # Phase 1 EXTENDS the existing file (already shipped: validates slug ordering, id uniqueness, titleKey + descriptionKey resolution in both i18n catalogs, labelAsset paths). NEW assertions: every entry has `quantity > 0`, `valueVND > 0`, `unitKey` is null XOR a non-empty string starting with `awards.detail.unit.`, `valueVNDSecondary` is non-null only for `signature-2025-creator`, every `awardImageAsset` resolves to `/assets/awards/<slug>.png`.
```

### Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| (none)  | (none)  | **No new runtime or dev dependencies.** Native `IntersectionObserver`, native CSS `scroll-margin-top`, existing Vitest + Playwright + Tailwind. |

---

## Implementation Strategy

### Phase Breakdown

#### Phase 0: Asset Preparation & Token Extension

**Goal**: Pull all visual prerequisites from Figma so the implementation phases can reference them directly.

- Use `query_section` against the Figma frame for each of `A_Title`, `B_Hệ thống giải thưởng`, `C_Menu list`, `C.1`–`C.6`, `D.1`–`D.6`, `D2.1` to extract: text colours, surface colours, sticky-header offset, active-menu colour, card meta-text colour. Map values to NEW Tailwind tokens added to `app/globals.css`.
- Use `get_media_files` / `list_media_nodes` against `D.1.1_Picture-Award` (and equivalent in `D.2`–`D.6`) to download the six 336×336 thumbnails. Save under `public/assets/awards/` with the slug-based filenames listed above.
- Extract / confirm the deployed sticky-header height; expose as a CSS custom property (`--saa-header-scroll-margin`) on `:root` in `app/globals.css` so both `scroll-margin-top` (per `D.*` card) and `IntersectionObserver` `rootMargin` (in `AwardsNav`) read from a single source (resolves Q-HTG5 cleanly).
- **Reuse existing `home.awards.{slug}.title` / `.description` keys** for all six awards (already shipped in Homepage Phase 13; copy verified accurate against Figma during this plan). **Add new `awards.detail.*` keys** in lockstep to both `vi-VN` and `en-US` catalogs — exact key list and English copy in §"Integration Points → i18n integration" above. **Confirm English copy** for `awards.detail.title_heading`, `awards.detail.unit.*`, and `awards.detail.value_individual` / `value_team` with PO before commit.

**Exit criteria**: All assets land in `public/assets/awards/`. All new tokens added to `app/globals.css`. All `awards.detail.*` keys present in both `vi-VN` and `en-US` catalogs. Lint + tsc clean.

#### Phase 1: Foundation — Static catalog extension

**Goal**: Make the data layer ready for the screen.

- Extend the `Award` type in [src/lib/awards/awards.ts](../../../src/lib/awards/awards.ts) with:
  - `quantity: number` — number of giải.
  - `unitKey: string | null` — i18n key for the unit ("Đơn vị" / "Tập thể" / "Cá nhân"), or `null` for awards with no unit (Signature 2025 / MVP).
  - `valueVND: number` — primary monetary value.
  - `valueVNDSecondary: number | null` — secondary tier (only Signature 2025).
  - `awardImageAsset: string` — path to the new 336×336 detail thumbnail (distinct from the existing 232×n `labelAsset` used on Homepage cards).
- Populate the six entries with values per the spec catalog table:
  | slug | quantity | unitKey | valueVND | valueVNDSecondary |
  |------|----------|---------|----------|-------------------|
  | `top-talent` | 10 | `awards.detail.unit.don_vi` | 7_000_000 | null |
  | `top-project` | 2 | `awards.detail.unit.tap_the` | 15_000_000 | null |
  | `top-project-leader` | 3 | `awards.detail.unit.ca_nhan` | 7_000_000 | null |
  | `best-manager` | 1 | `awards.detail.unit.ca_nhan` | 10_000_000 | null |
  | `signature-2025-creator` | 1 | null | 5_000_000 | 8_000_000 |
  | `mvp` | 1 | null | 15_000_000 | null |
- Add a small pure helper `formatVndAmount(value: number): string` that produces `7.000.000` (Vietnamese thousand-separator) regardless of locale — FR-012 mandate. Co-locate with the catalog: [src/lib/awards/format.ts](../../../src/lib/awards/format.ts). Implementation hint: `value.toLocaleString("vi-VN")` returns `7.000.000` for `7000000` — single-line wrapper is sufficient.
- Update Vitest unit tests BEFORE the catalog / helper change (TDD):
  - **EXTEND the existing** [tests/unit/lib/awards/awards.test.ts](../../../tests/unit/lib/awards/awards.test.ts) — file already exists with passing assertions on slug order / id uniqueness / titleKey + descriptionKey i18n resolution / labelAsset paths. ADD new assertions: every entry has `quantity > 0` and `valueVND > 0`; `unitKey` is `null` XOR a non-empty string starting with `awards.detail.unit.`; `valueVNDSecondary` is non-null only for `signature-2025-creator` (and matches the spec value 8_000_000); every `awardImageAsset` matches `/^/assets/awards/[a-z0-9-]+\.png$/`.
  - **CREATE** `tests/unit/lib/awards/format.test.ts` — asserts `formatVndAmount(7000000) === "7.000.000"`, `formatVndAmount(15000000) === "15.000.000"`, `formatVndAmount(0) === "0"`, and that the output contains no `,` separator (sanity guard against system-locale leakage).
  Both test changes must FAIL first (helper / fields don't exist), then PASS after the catalog extension and helper land. **Do NOT delete or duplicate** the existing assertions in `awards.test.ts` — the new fields are additive.

**Exit criteria**: `awards-data.test.ts` passes. tsc passes. Lint passes. Homepage continues to render correctly (regression check — `AwardCard` only consumes `slug` / `titleKey` / `descriptionKey` / `labelAsset` / `labelWidth` / `labelHeight`, none of the new fields).

#### Phase 2: Core Foundation — `AwardDetailCard` (US1, partial)

**Goal**: Implement the smallest read-only unit of the screen.

- TDD: write `tests/unit/components/awards/AwardDetailCard.test.tsx` first asserting:
  - All 5 content pieces render (thumbnail, title, description, quantity line with unit substitution, value line).
  - Signature 2025 card renders BOTH value tiers.
  - MVP / Signature cards render quantity without a unit segment.
  - Each card has `id="{slug}"` for FR-006 anchor target.
  - VNĐ values render with `.` thousands-separator (FR-012).
- Implement [src/components/awards/AwardDetailCard.tsx](../../../src/components/awards/AwardDetailCard.tsx) as a Server Component. Props: `{ award: Award, locale: SupportedLocale }`.
- Use `next/image` for the 336×336 thumbnail (alt = i18n title key resolved at render). Add `scroll-margin-top: var(--saa-header-scroll-margin)` to the card's root `<article id="{slug}">` (TR-004 / Q-HTG5). **Tailwind v4 consumption pattern**: use the arbitrary-value utility `[scroll-margin-top:var(--saa-header-scroll-margin)]` directly on the `<article>` className — no theme extension required (the CSS variable is already declared on `:root` in `app/globals.css` per Phase 0).
- Run unit tests. All green.

**Exit criteria**: `AwardDetailCard.test.tsx` passes. Visual sanity-check via Storybook is OUT of scope (project does not use Storybook); rely on screenshot comparisons in Phase 4 / 6.

#### Phase 3: Core US1 — `AwardsList` + `AwardsLayout` + page route

**Goal**: User can land on `/awards` (authed) and see all six cards in order. **Delivers US1 (Browse the catalog) and US5 (Auth gating) end-to-end.**

- TDD: write `tests/unit/components/awards/AwardsList.test.tsx` (six cards in fixed order) and a Playwright smoke test `tests/e2e/awards.spec.ts` covering US5 #1 (anon → `/login`) + US1 #1 (six cards visible after auth).
- Implement [src/components/awards/AwardsList.tsx](../../../src/components/awards/AwardsList.tsx) — Server Component, iterates `AWARDS` and renders one `AwardDetailCard` each.
- Implement [src/components/awards/AwardsLayout.tsx](../../../src/components/awards/AwardsLayout.tsx) — Server Component, two-column wide-viewport layout (sticky `AwardsNav` left + `AwardsList` right) with single-column scroll-only fallback on narrow viewports per Q-HTG4. `AwardsNav` is rendered as `null` placeholder in this phase; its real implementation lands in Phase 4.
- Replace [app/awards/page.tsx](../../../app/awards/page.tsx):
  ```
  Server Component pseudo-code:
    1. const session = await auth().catch(() => null); if (!session?.user) redirect("/login")
    2. const locale = await getSaaLocale()
    3. let unreadCount = 0;
       try { unreadCount = await getUnreadCount(session.user.id); } catch { /* graceful: badge hides */ }
       // matches the exact pattern in app/page.tsx (Homepage); imports getUnreadCount from
       // src/services/notification-service. The userId argument is required (the function
       // signature is getUnreadCount(userId: string): Promise<number>).
    4. Compose:
       <Header
         locale={locale}
         isAuthenticated
         logoHref="/"
         nav={<NavLinks currentPath="/awards" locale={locale} />}
         notification={<NotificationBell locale={locale} unreadCount={unreadCount} />}
         profileMenu={<ProfileButton locale={locale} user={session.user} />}
       />
       <Keyvisual />               // inline server component, decorative banner
       <AwardsTitleBlock />        // inline server component, "Sun* annual awards 2025" caption + H1
       <AwardsLayout locale={locale} />
       <KudosBlock locale={locale} />
       <Footer locale={locale} />
       <WidgetButton locale={locale} />
  ```
  (`Keyvisual` + `AwardsTitleBlock` are tiny inline server components within the page file — keep them inline to honour "no premature abstraction" per Constitution Principle I.)
- Run unit + Playwright. US1 + US5 all green.

**Exit criteria**: Anonymous request → 302 `/login`. Authed request renders six cards in order. Header has `Awards Information` marked active via `aria-current="true"`. Footer renders. KudosBlock renders.

#### Phase 4: US1 #4 + US2 — `AwardsNav` Client Island

**Goal**: Add the sticky menu with click-to-scroll AND scroll-tracked active state.

- TDD: write `tests/unit/components/awards/AwardsNav.test.tsx` covering:
  - Renders six menu items in order (FR-003).
  - Initial `activeSlug` derives from `window.location.hash` on mount (FR-006).
  - Unknown hash → defaults to `top-talent` (FR-007).
  - Click on item → scrolls to matching card + flips `aria-current` to that item.
  - `IntersectionObserver` callback fires → `aria-current` updates to most-visible card.
  - `hashchange` event re-syncs activeSlug.
  - Each item is `<a href="#<slug>">` (FR-014).
- Implement [src/components/awards/AwardsNav.tsx](../../../src/components/awards/AwardsNav.tsx) as `"use client"`. Use a single `IntersectionObserver` instance whose `rootMargin` is read once on mount from the CSS custom property:
  ```
  const headerOffset = getComputedStyle(document.documentElement)
    .getPropertyValue("--saa-header-scroll-margin")
    .trim() || "0px";
  const observer = new IntersectionObserver(callback, {
    rootMargin: `-${headerOffset} 0px 0px 0px`,
    threshold: [0.5],
  });
  ```
  Tie-breaker if multiple cards qualify: prefer the topmost card (smallest `boundingClientRect.top`). On click, call `element.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" })` where `prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches`. **Touch-target constitution rule**: each menu-item anchor MUST have an inner padding that yields a ≥ 44 × 44 CSS-px hit area on mobile breakpoints (Constitution Principle III); use Tailwind utilities (e.g., `block py-3 px-4` or token-based equivalent) — verify in Phase 6 with a Playwright bounding-rect assertion at the smallest supported viewport (360 px).
- Add corresponding Playwright scenarios:
  - US1 #2 — Homepage card click → `/awards#mvp` → page scrolls to MVP card with title visible (no header occlusion); `MVP` menu item active.
  - US1 #4 — Click `Top Talent` in menu → `D.1` scrolls into view, `C.1` gains `aria-current`.
  - US2 #1 — Manual mouse-wheel scroll past `D.2` → `C.2` becomes active.
- Wire `AwardsNav` into `AwardsLayout` (replace the placeholder).
- Run all tests. US1 + US2 + US5 all green.

**Exit criteria**: All P1 user stories (US1, US2, US5) pass end-to-end. `aria-current` switching works in jsdom + browser. Smooth-scroll respected `prefers-reduced-motion`.

#### Phase 5: US3 + US4 — Sun* Kudos cross-link + Header parity

**Goal**: Wire the bottom Sun* Kudos block and verify header parity.

- The `KudosBlock` component is already shipped from Homepage Phase 13 and already includes the `Chi tiết` button → `/sun-kudos`. **No new UI code.**
- Playwright: US3 #1 (block visible at bottom with all 5 elements) + US3 #2 (`Chi tiết` → navigates to `/sun-kudos`). Both should pass without code change since the component is reused.
- Playwright: US4 #1–#4 (header parity — language chip opens overlay; profile menu opens; `About SAA 2025` → `/`; footer `Sun* Kudos` → `/sun-kudos`). Reuses existing E2E coverage from Homepage suite — only verify NO regressions on `/awards`.

**Exit criteria**: US3 + US4 green on `/awards`. Homepage E2E still green (no regression).

#### Phase 6: Edge Cases + Polish

**Goal**: Cover the six Edge Cases listed in spec.

- Playwright: deep-link to unknown slug `/awards#nonexistent-slug` → page renders, no scroll, `Top Talent` active by default (FR-007).
- Playwright: navigate with JS disabled (`page.context().setJavaScriptEnabled(false)`) → menu items still work as native anchor links (FR-014); active-state highlight is absent (acceptable, documented in Edge Cases).
- Vitest: simulate `Picture-Award` image load failure → alt text renders (Edge Case "Image load failure"). React's default behavior covers this; just assert the alt prop is present and non-empty.
- Manual smoke: visit `/sun-kudos` (currently a stub) — confirm graceful 200/200 default and that errors fall through to Next.js error page (Edge Case ID-14). No code change needed.
- Locale-switch mid-screen: Playwright clicks language chip → selects EN → asserts award titles re-render in English without page reload (Edge Case "Locale switching mid-screen"). Reuses `LanguageSelector` test helpers.
- Pre-launch gate: NOT tested per-screen — `proxy.ts` matrix already covers the redirect.

**Exit criteria**: All Edge Cases green or documented as out-of-scope.

#### Phase 7: Documentation + Cross-cut Sync

**Goal**: Close the loop with `SCREENFLOW.md` and any cross-screen artifacts.

- Update [.momorph/SCREENFLOW.md](../../SCREENFLOW.md) Discovery Log: add a "UI implementation" entry analogous to the Homepage 2026-05-07 entry.
- Update Screen Details — Hệ thống giải block: change "(stub 2026-05-08)" → "shipped {date}" in the Mermaid graph + Main Application screen group.
- Confirm Homepage card-click → `/awards#<slug>` E2E remains green (Homepage test suite was already passing the link, only the destination changes from stub to real).

**Exit criteria**: SCREENFLOW.md synced. All E2E suites green. Lint + tsc clean. PR ready for review.

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **`IntersectionObserver` threshold tuning is fiddly across viewport heights** — multiple cards may all qualify as "≥0.5 visible" on tall displays, leading to ambiguous active-state | Medium | Medium | Use `rootMargin` (sourced from `--saa-header-scroll-margin`, `0px` today since the Header is absolute — see Issue #2 risk row) to constrain the observed band to the upper portion of the viewport, and break ties by preferring the topmost intersecting card. Unit-test with synthetic IntersectionObserverEntry mocks at multiple ratios using the Phase 4 stub. |
| **Header positioning assumption (sticky vs absolute) drift** — spec TR-004 references "sticky header" but the deployed Header uses `position: absolute; top: 0` (scrolls away). If the Awards-page Figma frame later requires sticky behaviour, a code change to Header is needed | Low | Medium | Plan locks `--saa-header-scroll-margin` = `0px` for current absolute-header layout (no occlusion possible). Phase 0 includes a `query_section` on the Awards-page Header node to confirm. If Figma indicates sticky, raise as a separate Header-component change (out-of-scope per FR-009 reuse rule) before merging this spec. CSS-variable mechanism is in place either way; only the value differs. |
| **i18n parity drift** if a contributor adds an `awards.detail.*` key to one catalog but forgets the other | Low | Low | Existing parity test (added Phase 13 Homepage) catches mismatched keys. Same test extends automatically to the new namespace. |
| **Homepage regression** from extending the static catalog (`awards.ts`) with new fields | Low | Medium | Catalog change is purely additive — new fields don't replace existing ones. Run Homepage E2E in the same PR. `AwardCard.tsx` only reads the existing fields (`slug`, `titleKey`, `descriptionKey`, `labelAsset`, `labelWidth`, `labelHeight`) so it is unaffected. |
| **Browser hash-jump occludes title under sticky header** (Q-HTG5 not honoured) | Low | High | Asserted by Playwright in US1 #2 — the test snapshots the bounding rect of the deep-linked card title and asserts `top >= header.height`. CI fails if `scroll-margin-top` wiring is broken. |
| **Static catalog reaches its limits (e.g., admin wants to edit values)** | Low | Low | Q-HTG3 explicitly defers admin CRUD. If/when needed, the `Award` type is the single boundary: swap a static `AWARDS` import for a `getAwards()` async helper without touching components. |
| **Mobile menu behavior pushback after MVP ships** (user wants tab strip back) | Medium | Low | Q-HTG4 explicitly defers structured patterns post-MVP. The `AwardsNav` Client Island is the single integration point — adding a tab-strip variant later is a localized change. |

### Estimated Complexity

- **Frontend**: **Medium**. ~4 new components (~80–120 LoC each), one Client Island with `IntersectionObserver` (~80 LoC), one new helper, six new asset files, ~14 new i18n keys, 1 new Tailwind token group, 1 page-route refactor.
- **Backend**: **None**. No new endpoints, no DB change, no migrations.
- **Testing**: **Medium**. ~4 new Vitest files (~50–100 LoC each), 1 new Playwright suite (~10 scenarios). Reuses existing test harness from Homepage Phase 13.

---

## Integration Testing Strategy

### Test Scope

- [x] **Component/Module interactions**: `AwardsLayout` → `AwardsNav` (client) ↔ `AwardsList` (server) — observer must register against DOM nodes that the server rendered. Verify hydration order: server markup arrives first, client island attaches observer post-hydration without dropping initial-hash scroll.
- [x] **External dependencies**: None new. Existing `auth()`, `getSaaLocale()`, `t()`, `LanguageSelector`, `Header`, `Footer`, `KudosBlock`.
- [ ] **Data layer**: N/A — static module import, no DB read.
- [x] **User workflows**: anonymous redirect → login; Homepage award-card click → Awards deep-link with anchor scroll; in-screen menu navigation; scroll-tracked menu sync; cross-link to Sun* Kudos.

### Test Categories

| Category | Applicable? | Key Scenarios |
|----------|-------------|---------------|
| UI ↔ Logic | **Yes** | Click menu item → smooth-scroll + active-state flip. Manual scroll → IntersectionObserver-driven active update. Hash-on-mount → initial card scroll. Unknown hash → default `top-talent` active. |
| Service ↔ Service | No | No service-to-service composition new to this screen. |
| App ↔ External API | **Yes** (reused) | Header bell badge calls `GET /api/notifications/unread-count` (stub returns 0). Verifies no regression vs Homepage. |
| App ↔ Data Layer | No | No DB. Static module import only. |
| Cross-platform | **Yes** | Wide-viewport (≥1024px-class) two-column layout vs narrow-viewport scroll-only. Both must render the six cards in order; menu visibility differs. |

### Test Environment

- **Environment type**: Local (Vitest + jsdom for unit), Local Playwright headless chromium for E2E. Same harness as Homepage Phase 13.
- **Test data strategy**: Static catalog + a single seeded test user (Auth.js + Prisma test fixture, already shipped).
- **Isolation approach**: Per-test fresh page load. Cookie-based locale reset between tests via existing helper.

### Mocking Strategy

| Dependency Type | Strategy | Rationale |
|-----------------|----------|-----------|
| `auth()` session | **Real** in E2E (with seeded test user); mocked at module-boundary in Vitest | E2E proves the real auth gate. Unit-level just needs to bypass the gate. |
| `IntersectionObserver` | **Real** in headless chromium; **stubbed** in Vitest jsdom | jsdom does not implement IntersectionObserver natively, and the existing [vitest.setup.ts](../../../vitest.setup.ts) does NOT yet ship a stub. Phase 4 ADDS a minimal global stub (in `vitest.setup.ts` or a per-test helper at `tests/helpers/intersection-observer.ts`) that exposes a manual `triggerEntries(entries: Partial<IntersectionObserverEntry>[])` API for deterministic tests. |
| `next/image` | **Real** | Renders fine in tests; no asset-level concerns at unit level. |
| `next/navigation` `redirect` | **Real** in E2E; mocked in unit | Standard Next.js pattern. |

### Test Scenarios Outline

1. **Happy Path (P1 user stories)**
   - [ ] Anonymous request to `/awards` → 302 `/login` (US5 #1).
   - [ ] Authed request to `/awards` → page renders with six cards in order, header active nav = `Awards Information` (US1 #1).
   - [ ] Homepage award card → `/awards#mvp` → MVP card scrolled into view, title fully visible (US1 #2).
   - [ ] Click `C.1 Top Talent` in menu → `D.1` scrolls into view, `C.1` gains `aria-current` (US1 #4).
   - [ ] Manual scroll past `D.2` → `C.2` becomes active (US2 #1).
   - [ ] Bottom of page → Sun* Kudos block with `Chi tiết` → `/sun-kudos` (US3 #2).

2. **Error Handling**
   - [ ] Unknown slug `/awards#xyz` → page renders, no scroll, `top-talent` active by default (FR-007).
   - [ ] `/sun-kudos` route 5xx → standard Next.js error page; `Awards` page unaffected (Edge Case ID-14).
   - [ ] Image asset 404 → `alt` text renders (Edge Case "Image load failure").

3. **Edge Cases**
   - [ ] JS disabled → menu items still scroll via native anchor; no active-state highlight (FR-014).
   - [ ] Locale switch mid-screen → titles + descriptions re-render in target locale, no page reload (Edge Case "Locale switching").
   - [ ] Pre-launch gate active → 302 `/coming-soon` (covered by `proxy.ts` matrix; no per-screen test needed).
   - [ ] Hash mutation via devtools `history.replaceState('/awards#mvp')` → `hashchange` listener fires → MVP becomes active.

### Tooling & Framework

- **Test framework**: Vitest 4 + @testing-library/react + jsdom (unit/integration); Playwright 1.59 + chromium (E2E).
- **Supporting tools**: `IntersectionObserver` stub added by Phase 4 to `vitest.setup.ts` (the file ships without one today); existing seeded-user fixture in `tests/fixtures/`; existing `LanguageSelector` test helpers.
- **CI integration**: same job as Homepage — `npm run lint && npm run test && npm run test:e2e`.

### Coverage Goals

| Area | Target | Priority |
|------|--------|----------|
| Core user flows (US1, US2, US5 — all P1) | **100%** scenario coverage in E2E | High |
| Component unit tests (`AwardDetailCard`, `AwardsList`, `AwardsNav`) | **≥80%** line coverage | High |
| Edge cases (FR-007 fallback, JS-disabled, locale-switch) | **All scenarios listed in spec** | Medium |
| i18n parity (`awards.detail.*` namespace) | **100%** key coverage | High |

---

## Dependencies & Prerequisites

### Required Before Start

- [x] [.momorph/constitution.md](../../constitution.md) (v1.1.1) reviewed.
- [x] [spec.md](spec.md) Status = "Ready for momorph.plan"; Q-HTG1..Q-HTG5 all resolved.
- [x] Homepage SAA shipped (Phases 1–13) — provides reused components.
- [x] Existing static catalog [src/lib/awards/awards.ts](../../../src/lib/awards/awards.ts) — to be extended (additive).
- [ ] Phase 0 asset download + token extension complete.
- [ ] (Optional) `research.md` if Phase 0 surfaces unknowns. Not anticipated.

### External Dependencies

- None. No new packages, no new services, no new env vars.

---

## Next Steps

After plan approval:

1. **Run** `/momorph.tasks` to generate the task breakdown.
2. **Review** tasks.md for parallelization opportunities (Phase 0 assets ↔ Phase 1 catalog can run in parallel; Phase 2 + Phase 3 are sequential because Phase 3 depends on `AwardDetailCard`).
3. **Begin** implementation following the phase order: Phase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7.

---

## Notes

- **No new dependencies** is a strict constraint per Constitution Principle II + spec TR-007. The plan uses only native browser APIs (`IntersectionObserver`, `scroll-margin-top`, `<a href="#...">`) and existing project libraries (Tailwind, Vitest, Playwright, Auth.js, Prisma — none of which need to be touched).
- **Spec amendment 2026-05-09**: During plan research, the spec FR-006 / Items C.1–C.6 description had a slug mismatch (`signature-2025` vs the actual `signature-2025-creator` exported from [src/lib/awards/awards.ts](../../../src/lib/awards/awards.ts)). Spec corrected to match the codebase. Plan proceeds with the correct slug.
- **No `research.md` produced** — the codebase research uncovered everything needed (existing `AWARDS` array, six award labels already keyed by `home.awards.*`, Header / Footer / KudosBlock all shipped, `auth()` helper available). All research findings are folded directly into this plan instead of a separate document.
- **Mobile is explicitly out-of-scope post-MVP** per Q-HTG4. The plan ships the wide-viewport experience first; if a structured narrow-viewport menu (tab strip / accordion) is later requested, only `AwardsNav` and `AwardsLayout` need touching — the page route, data, and other components are untouched.
- **Spec ↔ plan cross-reference**: Every FR / TR / SC in spec.md maps to a phase in this plan.
  - FR-001 (auth gate) / TR-002 (`auth()` redirect) → **Phase 3**.
  - FR-002 (six cards in fixed order) / FR-003 (six menu items) / FR-009 (Header reuse) / FR-010 (Footer + KudosBlock reuse) → **Phase 3**.
  - FR-004 (click → scroll + active flip) / FR-005 (scroll-tracked active state) / FR-006 (deep-link `#<slug>`) / FR-007 (unknown-slug fallback) / FR-014 (anchor-link markup) / TR-003 (IntersectionObserver client island) → **Phase 4**.
  - FR-008 (`Chi tiết` → `/sun-kudos`) / US3 / US4 → **Phase 5** (no new code; Playwright assertion only).
  - FR-011 (i18n parity) / FR-012 (VNĐ format) / TR-006 (locked-step catalogs) → **Phases 0 + 1 + 2 + 6**.
  - **FR-013 (no write/mutation endpoint, no interactive form)** → architectural invariant enforced across **all phases**; specifically: Phase 3 page composition has zero `<form>` / Server Action / mutation route; Backend Approach §"No new endpoints"; State Management §"Optimistic updates: Not applicable — read-only screen". Tests: Playwright asserts no `<form>` element on `/awards` and no `POST` / `PUT` / `DELETE` request observed during a typical session.
  - TR-001 (server-rendered first paint) → **Phase 3** architecture choice (Server Component for page + Layout + List + Card).
  - TR-004 (scroll-margin offset) / TR-005 (`aria-current` for both header nav and in-page menu) → **Phase 0** CSS-variable token + **Phase 4** wiring on cards / menu items.
  - TR-007 (no new deps) → enforced throughout; gated by `package.json` review at PR time.
  - SC-001..SC-006 → exit criteria distributed across phases (SC-001 at Phase 3 exit; SC-002 at Phase 4 exit; SC-003 at Phase 4 exit via Playwright bounding-rect check; SC-004 at Phase 7; SC-005 at Phase 0 exit; SC-006 at every phase exit).
