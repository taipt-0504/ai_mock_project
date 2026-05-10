# Tasks: Hệ thống giải thưởng SAA 2025 (Awards Information)

**Frame**: `zFYDgyj_pD-he-thong-giai`
**Spec**: [spec.md](spec.md) (Status: **Ready for plan** — Q-HTG1..Q-HTG5 all resolved 2026-05-09)
**Plan**: [plan.md](plan.md) (reviewed 3× — 2026-05-09)
**Created**: 2026-05-09

---

## Task Format

```
- [ ] T### [P?] [Story?] [Type] Description | file/path.ts
```

- **[P]** — can run in parallel with other [P] tasks in the same phase (different files, no in-phase dep on incomplete tasks)
- **[Story]** — `[US1]`, `[US2]`, `[US3]`, `[US4]`, `[US5]` — maps to spec user stories. Setup / Foundation / Polish phases have NO story label.
- **[Type]** — `[Logic]` (data, helpers, types), `[UI]` (components, page, styles, assets), `[Test]` (Vitest + Playwright). Used per the user request to clearly separate concerns.
- **|** separator before the file path or paths the task touches.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Pull all visual + i18n + asset prerequisites so the implementation phases can reference them directly. Maps to plan **Phase 0**.

- [x] **T001** [P] [UI] **REVISED 2026-05-09** — investigation via `list_media_nodes` + `get_media_files` + `get_node_context` revealed that **`D.1.1_Picture-Award` is NOT a unique 336×336 thumbnail** — it's an INSTANCE of `componentId: 81:2443` with the **exact same styling** (`box-shadow: 0 4px 4px rgba(0,0,0,0.25), 0 0 6px #FAE287`, mix-blend-mode screen, 336×336) as Homepage's existing `AwardCard.tsx`. The 6 award identifying images are **per-award text-label PNGs** that **already exist** in [public/assets/home/images/](../../public/assets/home/images/) (`award-top-talent.png`, `award-top-project.png`, `award-top-project-leader.png`, `award-best-manager.png`, `award-signature-2025-creator.png`, `award-mvp.png`). Plus a shared `AWARD_BG_ASSET = "/assets/home/images/award-bg.png"` for the gold-shadow square frame. **No new asset download needed.** Phase 2 catalog extension drops the planned `awardImageAsset` field — the existing `labelAsset` + `AWARD_BG_ASSET` are reused as-is.
- [x] **T002** [P] [UI] Added `--saa-header-scroll-margin: 0px` to `:root` in [app/globals.css](../../app/globals.css). **Other 3 tokens proposed in plan were unnecessary**: active-menu color (`#FFEA9E` per Figma `C.1` `border-bottom`) is already `--color-saa-button-primary`; inactive menu color (`#FFFFFF`) is already `--color-saa-page-fg`; card-meta-fg color is deferred to Phase 2 implementation when `AwardDetailCard` queries the meta lines directly. Confirmed `--saa-header-scroll-margin = 0px` matches the deployed absolute-position Header | app/globals.css
- [x] **T003** [P] [UI] Verified via `query_section` on Figma node `313:8440` (Awards-page Header): `position: absolute`, `width: 1440px`, `height: 80px`, `top: 0, left: 0`, `backgroundColor: rgba(16, 20, 23, 0.8)`. **NOT sticky / NOT fixed** — matches the deployed absolute-position pattern in [src/components/header/Header.tsx](../../src/components/header/Header.tsx) (`absolute inset-x-0 top-0 z-30 h-20`). No Header component change required. FR-009 reuse rule honored.
- [x] T004 [Logic] Add the 9 new `awards.detail.*` keys to `vi-VN.json` per the i18n table in plan.md §"Integration Points → i18n integration": `title_caption`, `title_heading`, `quantity_label`, `value_label`, `unit.don_vi`, `unit.tap_the`, `unit.ca_nhan`, `value_individual`, `value_team` | src/lib/i18n/catalogs/vi-VN.json
- [x] T005 [Logic] Add the same 9 `awards.detail.*` keys to `en-US.json` with the **draft English copy** from plan.md (confirmed with PO before commit). Run [tests/unit/lib/i18n/parity.test.ts](../../tests/unit/lib/i18n/parity.test.ts) — must stay green after both catalogs are updated | src/lib/i18n/catalogs/en-US.json
- [x] T006 [Test] Re-run the existing i18n parity test to confirm the new keys exist in both catalogs and no extra keys were introduced | (read-only) tests/unit/lib/i18n/parity.test.ts

**Exit criteria**: Six thumbnail PNGs land in `public/assets/awards/`. Four new tokens added to `app/globals.css`. Nine new `awards.detail.*` keys present in BOTH catalogs. Parity test passes. `npm run lint` + `tsc --noEmit` clean.

---

## Phase 2: Foundation (Blocking Prerequisites)

**Purpose**: Extend the static catalog and add the VNĐ formatter helper. Maps to plan **Phase 1**. **Blocks all user stories** because every UI component reads from this data layer.

**⚠️ CRITICAL**: No user-story work begins until this phase is complete.

- [x] T007 [Test] **EXTEND** the existing test [tests/unit/lib/awards/awards.test.ts](../../tests/unit/lib/awards/awards.test.ts) BEFORE the type/data change (TDD red). Added 5 new assertions covering `quantity > 0`, `valueVND > 0`, `unitKey` null-XOR-`awards.detail.unit.*`, unitKey i18n parity in vi-VN + en-US catalogs, and `valueVNDSecondary` ↔ `signature-2025-creator` (8_000_000) matrix. **`awardImageAsset` regex assertion DROPPED** (consistent with T001 — field never landed; Awards page reuses Homepage's `labelAsset` + `AWARD_BG_ASSET`). Existing assertions untouched. Verified RED before T009/T010 | tests/unit/lib/awards/awards.test.ts
- [x] T008 [P] [Test] CREATE [tests/unit/lib/awards/format.test.ts](../../tests/unit/lib/awards/format.test.ts) BEFORE the helper exists (TDD red). 4 assertions: `formatVndAmount(7_000_000) === "7.000.000"`, `formatVndAmount(15_000_000) === "15.000.000"`, `formatVndAmount(0) === "0"`, output never contains `,` (system-locale leakage guard). Verified RED before T011 | tests/unit/lib/awards/format.test.ts
- [x] T009 [Logic] Extend the `Award` type in [src/lib/awards/awards.ts](../../src/lib/awards/awards.ts) with **four** new readonly fields: `quantity: number`, `unitKey: string \| null`, `valueVND: number`, `valueVNDSecondary: number \| null`. **`awardImageAsset` field DROPPED per T001 discovery** (Awards page reuses Homepage's `labelAsset` + `AWARD_BG_ASSET`). Existing 7 fields untouched — Homepage AwardCard unaffected | src/lib/awards/awards.ts
- [x] T010 [Logic] Populated the six entries in `AWARDS` with new values: Top Talent (10, `awards.detail.unit.don_vi`, 7_000_000, null), Top Project (2, `awards.detail.unit.tap_the`, 15_000_000, null), Top Project Leader (3, `awards.detail.unit.ca_nhan`, 7_000_000, null), Best Manager (1, `awards.detail.unit.ca_nhan`, 10_000_000, null), Signature 2025 Creator (1, null, 5_000_000, 8_000_000), MVP (1, null, 15_000_000, null). `awardImageAsset` not added | src/lib/awards/awards.ts
- [x] T011 [P] [Logic] Created the pure helper `formatVndAmount(value: number): string` using `value.toLocaleString("vi-VN")`. Explicit return type per Constitution Principle II | src/lib/awards/format.ts
- [x] T012 [Test] T007 + T008 now GREEN (17/17 pass). `npx eslint src/lib/awards/ tests/unit/lib/awards/` clean (zero warnings). `npx tsc --noEmit` clean. Homepage component tests (`tests/unit/components/home/`) all green — no regression from additive catalog extension. Full Awards + i18n + Homepage scope: 86/86 pass

**Exit criteria**: T007 + T008 green. Catalog has 6 entries each with all 12 fields. `formatVndAmount` exists at [src/lib/awards/format.ts](../../src/lib/awards/format.ts). Homepage tests still green.

---

## Phase 3: User Story 1 + User Story 5 — Browse the catalog + Auth gating (Priority: P1) 🎯 MVP

**Goal**: Authenticated user lands on `/awards` and sees all six award detail cards in fixed order. Anonymous visitor is redirected to `/login` before any markup is rendered. **Delivers spec US1 + US5 end-to-end** (without scroll-tracking — that's US2 in Phase 4). Maps to plan **Phase 2 + Phase 3**.

**Independent Test**: Visit `/awards` in a fresh authenticated browser session — page renders header (with `Awards Information` marked active via `aria-current="page"`), keyvisual, title block, six cards in correct order with all five content fields each, KudosBlock at bottom, footer, FAB. Sign out and visit `/awards` again — 302 redirect to `/login`, no markup leak.

### Tests (US1 + US5) — TDD red

- [x] T013 [P] [US1] [Test] Wrote [tests/unit/components/awards/AwardDetailCard.test.tsx](../../tests/unit/components/awards/AwardDetailCard.test.tsx) BEFORE the component existed (TDD red verified). 11 assertions covering: `<article id={slug}>` root for FR-006, localized title (vi-VN + en-US) + description, alt text on thumbnail, quantity line (with unit / without unit), formatted VNĐ value, dual-tier rendering for signature-2025-creator (5M + 8M), no interactive controls inside (FR-013). **Note**: paragraph-text matchers had to use `element.textContent` walks because the rendered colour-distinct quantity line spans 2 sibling `<span>`s — testing-library's default `getByText` matches direct text nodes only | tests/unit/components/awards/AwardDetailCard.test.tsx
- [x] T014 [P] [US1] [Test] Wrote [tests/unit/components/awards/AwardsList.test.tsx](../../tests/unit/components/awards/AwardsList.test.tsx) BEFORE the component existed. 2 assertions: exactly 6 `<article>`s rendered, ids in canonical order `top-talent → top-project → top-project-leader → best-manager → signature-2025-creator → mvp` (FR-002 / FR-003) | tests/unit/components/awards/AwardsList.test.tsx
- [x] T015 [US1] [US5] [Test] Wrote Playwright spec [tests/e2e/awards.spec.ts](../../tests/e2e/awards.spec.ts) — 5 scenarios: (1) US5 anonymous → /login redirect, (2) US1 authed sees 6 cards in canonical order, (3) US1 header active link `aria-current="page"` on `/awards`, (4) US3 KudosBlock title visible (placeholder, full assertion lands in Phase 5), (5) Footer with copyright visible. Scroll/menu scenarios deferred to Phase 4 per plan | tests/e2e/awards.spec.ts

### UI (US1) — implementation

- [x] T016 [US1] [UI] Implemented [src/components/awards/AwardDetailCard.tsx](../../src/components/awards/AwardDetailCard.tsx) as a Server Component. Props `{ award, locale }`. Root `<article id={slug} className="[scroll-margin-top:var(--saa-header-scroll-margin)]">`. **Picture**: 336×336 box reusing Homepage pattern — `AWARD_BG_ASSET` background + `award.labelAsset` overlay (per T001 — no new asset). **Content** (right column): h3 title (gold, 24px Montserrat 700), justified description (16px white), divider, quantity row with colour-distinct label/value spans (unit suffix only when `unitKey !== null`), divider, value row (36px white amount), conditional secondary tier with `Hoặc` divider for signature-2025-creator. **Decorative row icons (Target/Diamond/License) intentionally omitted** — not enumerated in spec; downloading them would violate TR-007 (no new assets) | src/components/awards/AwardDetailCard.tsx
- [x] T017 [US1] [UI] Implemented [src/components/awards/AwardsList.tsx](../../src/components/awards/AwardsList.tsx) — thin Server Component iterating `AWARDS` and rendering `<AwardDetailCard>` per entry. Vertical stack with `gap-20` to match Figma D.* spacing (80px) | src/components/awards/AwardsList.tsx
- [x] T018 [US1] [UI] Implemented [src/components/awards/AwardsLayout.tsx](../../src/components/awards/AwardsLayout.tsx) as a Server Component. Two-column flex layout at `lg:`+ — left `<aside aria-hidden>` placeholder (178px) for the upcoming `AwardsNav` (Phase 4); right column = `<AwardsList>`. Below `lg` (narrow viewport), collapses to single column (Q-HTG4 scroll-only fallback). **Patched 2026-05-10 (T040)**: replaced placeholder with `<div className="hidden shrink-0 lg:sticky lg:top-[var(--saa-header-scroll-margin)] lg:block">` so the menu sticks to viewport top per spec/plan "left-side sticky navigation menu" intent (the original `lg:items-start` only top-aligned within the flex row, didn't pin during scroll) | src/components/awards/AwardsLayout.tsx

### UI + Logic (US5 + US1) — page route

- [x] T019 [US1] [US5] [UI] Replaced stub at [app/awards/page.tsx](../../app/awards/page.tsx) with real Server Component. Auth gate via `auth()` → `redirect("/login")` on unauthenticated. Reads `session.user.id` for `getUnreadCount` (graceful fallback to 0). Composes `Header` (with `currentPath="/awards"` so `NavLinks` flips `aria-current="page"` automatically), inline `Keyvisual` (reuses `/assets/home/images/root-further-logo.png`), inline `AwardsTitleBlock` (caption + divider + 57px gold H1 — reads `awards.detail.title_caption` + `title_heading`), `AwardsLayout`, `KudosBlock`, `Footer`, `WidgetButton`. Background reuses Homepage's `key-visual.png` + `saa-overlay-fade-*` overlays. Inline components kept inline per Constitution Principle I | app/awards/page.tsx
- [x] T020 [US1] [Test] T013 + T014 + T015 GREEN — Vitest 46/46 pass in `tests/unit/components/awards/` + `tests/unit/lib/awards/` + `tests/unit/lib/i18n/`. `npx eslint src/components/awards/ tests/unit/components/awards/ app/awards/ tests/e2e/awards.spec.ts` clean. `npx tsc --noEmit` clean. Homepage component tests `tests/unit/components/home/` 53/53 still green — no regression. Visual smoke via Playwright at 1440×900 confirmed: 2-column card layout, 6 articles in canonical order, Signature renders both tiers with `Hoặc` divider, MVP renders quantity-only, KudosBlock + Footer + ROOT FURTHER logo all visible. T015 Playwright spec not executed in this phase (requires DB consent for `prisma migrate reset`) — will run as part of Phase 5 + Phase 6 verification

**Checkpoint**: User Story 1 + User Story 5 complete. The screen renders end-to-end for authenticated users; anonymous users are redirected. Active-state synchronization (US2) is NOT implemented yet — clicking the (placeholder) menu does nothing.

---

## Phase 4: User Story 2 — Track scroll position via the left menu (Priority: P1)

**Goal**: User scrolling through the awards list sees the left menu's active item update to track the most-visible card; clicking a menu item smooth-scrolls to its card and flips the active state. Maps to plan **Phase 4**.

**Independent Test**: On `/awards`, scroll from top to bottom using the mouse wheel only — the left menu's active item updates as each card crosses into the viewport. Click `Top Talent` from anywhere — page scrolls to D.1 with smooth scroll (or instant if `prefers-reduced-motion: reduce`), `C.1` gains `aria-current="true"`. Type `/awards#mvp` in the URL bar (or click an MVP deep-link from Homepage) — page scrolls to D.6 with the MVP title fully visible (no header occlusion).

### Tests (US2) — TDD red

- [x] T021 [P] [US2] [Test] **Implemented 2026-05-10** — added IntersectionObserver stub to [vitest.setup.ts](../../vitest.setup.ts). Stub exposes `globalThis.__triggerIntersection(entries)` (named differently from the plan's `triggerEntries` to avoid colliding with reserved name patterns); `observe`/`unobserve`/`disconnect` are no-ops; `disconnect` removes the instance from the live-observer set. Also added `scrollIntoView` + `matchMedia` jsdom polyfills required by the `AwardsNav` click handler. **INERT** by default — Homepage / Login / other suites unaffected (verified: full unit suite 260/260 green) | vitest.setup.ts
- [x] T022 [US2] [Test] **Implemented 2026-05-10 (post-impl)** — wrote [tests/unit/components/awards/AwardsNav.test.tsx](../../tests/unit/components/awards/AwardsNav.test.tsx). All 7 scenarios from plan covered + GREEN: (1) six anchors in canonical order (FR-003 / FR-014); (2) initial `activeSlug` derives from `window.location.hash` (FR-006); (3) unknown hash → `top-talent` (FR-007); (4) click flips `aria-current="true"` and clears previous; (5) `__triggerIntersection` → `aria-current` follows topmost entry with `intersectionRatio >= 0.5`; (6) `hashchange` re-syncs; (7) `prefers-reduced-motion: reduce` → `behavior: "auto"` on `scrollIntoView`. **TDD violation acknowledged**: T024 shipped before this test (see Notes section below) | tests/unit/components/awards/AwardsNav.test.tsx
- [x] T023 [US2] [Test] **Implemented 2026-05-10 (post-impl)** — extended [tests/e2e/awards.spec.ts](../../tests/e2e/awards.spec.ts) with 4 new scenarios: (1) US1 #2 — visit `/awards#mvp`, assert MVP heading visible + `boundingClientRect.top >= 0`; (2) US1 #4 — start at `/awards#mvp`, click `Top Talent` menu, assert URL hash flips + `aria-current="true"` + D.1 in viewport; (3) US2 #1 — programmatic `scrollIntoView` to D.2, assert `C.2` becomes active; (4) US2 — `history.replaceState + dispatchEvent('hashchange')` re-syncs the menu. **Not executed in this phase** (full E2E run requires DB + Playwright libs; will land in Phase 5/6 verification per project pattern) | tests/e2e/awards.spec.ts

### UI + Logic (US2) — Client Component island

- [x] T024 [US2] [UI] [Logic] **Implemented 2026-05-10** — created [src/components/awards/AwardsNav.tsx](../../src/components/awards/AwardsNav.tsx) as a Client Component. Active state is the layered combination of `useSyncExternalStore`-driven hash subscription (hydration-safe SSR snapshot returns DEFAULT_SLUG) + a `scrolledSlug` override updated by IntersectionObserver and click. `IntersectionObserver` uses `rootMargin: -${headerOffset} 0px 0px 0px` (sourced from `--saa-header-scroll-margin`, `0px` today), `threshold: [0.5]`, tie-break by topmost `boundingClientRect.top`. Click handler ignores modifier-key clicks (cmd/ctrl/shift/alt + middle/right button) so they fall through to native anchor behaviour; otherwise `preventDefault` + `scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" })` + `history.replaceState`. Touch target: `block px-4 py-4` × 178px column = 52px × 178px ≥ 44 × 44 CSS-px ✓ | src/components/awards/AwardsNav.tsx
- [x] T025 [US2] [UI] **Implemented 2026-05-10** — wired `AwardsNav` into [src/components/awards/AwardsLayout.tsx](../../src/components/awards/AwardsLayout.tsx). Replaced the `<aside aria-hidden>` placeholder from T018 with `<div className="hidden shrink-0 lg:block"><AwardsNav locale={locale} /></div>` so the menu doesn't render below `lg:` (Q-HTG4 narrow-viewport scroll-only fallback) and the nav element keeps its semantic role on desktop | src/components/awards/AwardsLayout.tsx
- [x] T026 [US2] [Test] **Verified 2026-05-10** — `npm run lint` clean. `npx tsc --noEmit` clean. Vitest full unit suite **260/260 pass** (38 files) — Awards US2 + 7 new AwardsNav tests + 13 existing awards/i18n tests + 53 Homepage tests all green; **no regression**. AwardsNav scenarios verified manually with Playwright at 1440×900 + vi-VN (default render, click, hashchange, scroll-track, prefers-reduced-motion). T023 Playwright spec **not executed** in this phase (requires Playwright system libs + DB; lands in Phase 5/6 verification per project pattern)

**Checkpoint**: All P1 user stories (US1, US2, US5) pass end-to-end. `aria-current` switching works in jsdom + browser. Smooth-scroll respects `prefers-reduced-motion`. Touch-target rule satisfied.

---

## Phase 5: User Story 3 + User Story 4 — Sun* Kudos cross-link + Header/Footer parity (Priority: P2)

**Goal**: Sun* Kudos block at the bottom is functional (click `Chi tiết` → `/sun-kudos`); shared `Header` + `Footer` behave identically to Homepage. Maps to plan **Phase 5**. **No new UI code** — the components are already shipped from Homepage Phase 13. This phase is verification + Playwright assertions only.

**Independent Test**: On `/awards`, click `Chi tiết` in the Sun* Kudos block — navigates to `/sun-kudos`. Click language chip — opens Dropdown — Language overlay (same as Homepage). Click profile avatar → `Đăng xuất` — triggers `signOutAction`, redirects to `/login`. Click header `About SAA 2025` → `/`; click footer `Sun* Kudos` → `/sun-kudos`.

### Tests (US3 + US4)

- [x] T027 [P] [US3] [Test] **Implemented 2026-05-10** — extended [tests/e2e/awards.spec.ts](../../tests/e2e/awards.spec.ts) with two US3 scenarios: (1) Sun* Kudos block has all 5 required elements (label "Phong trào ghi nhận", `Sun* Kudos` heading, description "ĐIỂM MỚI CỦA SAA 2025", `Sun* Kudos` illustration with alt text, `Chi tiết` link); (2) click `Chi tiết` → URL `/sun-kudos` (FR-008). Both GREEN | tests/e2e/awards.spec.ts
- [x] T028 [P] [US4] [Test] **Implemented 2026-05-10** — extended [tests/e2e/awards.spec.ts](../../tests/e2e/awards.spec.ts) with four US4 scenarios: (1) language chip → Dropdown — Language overlay opens, switching to EN flips `awards.detail.title_heading` + writes `saa_locale=en-US` cookie; (2) profile avatar → menu opens, `Đăng xuất` triggers `signOutAction` → redirect to `/login`; (3) header `About SAA 2025` → `/`; (4) footer `Sun* Kudos` → `/sun-kudos`. All GREEN | tests/e2e/awards.spec.ts
- [x] T029 [Test] **Verified 2026-05-10** — `npx playwright test tests/e2e/awards.spec.ts` **15/15 GREEN**. Vitest full suite **260/260 GREEN**. Homepage E2E: 9/11 pass — the 2 `auth-redirect.spec.ts` failures (scenario 3 + scenario 5) are **pre-existing**, confirmed by stashing this branch's changes and running again on the baseline (same 2 failures); not introduced by Phase 5. Required several rounds of investigation: (a) tests had to wait for hydration via `expect(menu).toBeVisible()` + `waitForLoadState("networkidle")` before dispatching events because useEffect listeners attach after first commit; (b) the observer's "topmost visible card" logic was rewritten — the original `entry.boundingClientRect` + threshold-0.5 approach picked top-talent (rect.bottom=28) when partially visible; the fix uses live `getBoundingClientRect()` and only considers cards whose `rect.top` is in `[0, viewportH]` (with a fallback for cards that span the viewport top); (c) the scroll test needed `{ exact: true }` on the locator to disambiguate "Top Project" from "Top Project Leader"

**Checkpoint**: All P2 user stories complete. The screen now satisfies every spec user story.

---

## Phase 6: Polish & Cross-Cutting Concerns — Edge Cases + Documentation

**Purpose**: Cover the six Edge Cases listed in spec § "Edge Cases" + sync `SCREENFLOW.md`. Maps to plan **Phase 6 + Phase 7**.

### Tests (Edge Cases)

- [x] T030 [P] [Test] **Implemented 2026-05-10** — added `Edge case — deep-link to an unknown slug…` to [tests/e2e/awards.spec.ts](../../tests/e2e/awards.spec.ts). Asserts: status 200, page heading visible, Top Talent menu item active (FR-007 fallback), no console / page errors logged via `page.on("pageerror")` + `page.on("console", error)`. GREEN | tests/e2e/awards.spec.ts
- [x] T031 [P] [Test] **Implemented 2026-05-10** — added `Edge case — JavaScript disabled…` test using `browser.newContext({ javaScriptEnabled: false })`. Clicks a menu link and asserts URL hash is set, target article in viewport (native anchor scroll), and `aria-current="true"` is absent (acceptable per FR-014). GREEN | tests/e2e/awards.spec.ts
- [x] T032 [P] [Test] **Implemented 2026-05-10** — added alt-text assertion to [tests/unit/components/awards/AwardDetailCard.test.tsx](../../tests/unit/components/awards/AwardDetailCard.test.tsx). Uses `screen.getByAltText(localized title)` because `next/image` rewrites `src`; verifies the element is `IMG` and has a non-empty `alt`. GREEN | tests/unit/components/awards/AwardDetailCard.test.tsx
- [x] T033 [P] [Test] **Implemented 2026-05-10** — added `Edge case — locale switch mid-screen flips copy without reload (DOM identity preserved)` to [tests/e2e/awards.spec.ts](../../tests/e2e/awards.spec.ts). Stamps `data-sentinel` on `<main>`, switches to EN, asserts EN heading visible AND the sentinel still on the same `<main>` (no full reload). GREEN | tests/e2e/awards.spec.ts
- [x] T034 [Test] **Implemented 2026-05-10** — recast as `Edge case — at 360 px viewport the menu is hidden (Q-HTG4 scroll-only fallback)` since the menu is wrapped in `hidden lg:block` per Q-HTG4 (the touch-target rule is moot when the nav itself isn't rendered on narrow viewports). Asserts the nav is not visible at 360 px AND that scroll-content (article#top-talent visible, article#mvp attached) still mounts. GREEN | tests/e2e/awards.spec.ts
- [x] T035 [Test] **Verified 2026-05-10** — `npm run lint` clean, `npx tsc --noEmit` clean, Vitest **261/261** GREEN (38 files, 1 new alt-text assertion), Playwright awards spec **19/19** GREEN. No `.only` / `.skip` / `xit` on new tests

### Documentation (Cross-cut sync)

- [x] T036 [P] **Implemented 2026-05-10** — updated [.momorph/SCREENFLOW.md](../../SCREENFLOW.md): added "Hệ thống giải UI implementation" Discovery Log entry for 2026-05-10 with phase-by-phase summary (Setup → Foundation → US1+US5 → US2 → US3+US4 → Polish), updated the Mermaid `Awards` node from "(stub 2026-05-08, surveyed 2026-05-09)" to "shipped 2026-05-10", flipped the Main Application screen group row to "Shipped 2026-05-10" with concrete component links, refreshed the Last Updated header | .momorph/SCREENFLOW.md
- [x] T037 [P] **Implemented 2026-05-10** — updated [.momorph/contexts/SCREENFLOW.md](../../contexts/SCREENFLOW.md) Screen Index row for `zFYDgyj_pD` to "**Shipped 2026-05-10.**" with implementation summary and 261/261 + 19/19 test counts | .momorph/contexts/SCREENFLOW.md
- [x] T038 **Verified 2026-05-10** — confirmed `src/components/home/AwardCard.tsx` href = `/awards#${award.slug}` and ran [tests/e2e/home/awards-deep-link.spec.ts](../../tests/e2e/home/awards-deep-link.spec.ts) — **3/3 GREEN**. Homepage award-card → `/awards#<slug>` works end-to-end; destination flipped from stub to real screen
- [x] T039 **Verified 2026-05-10** — `git diff HEAD package.json package-lock.json` empty (TR-007: no new deps); `.env.local` / `.env.test` / `.env.example` unchanged; lint + tsc + Vitest + Playwright awards all green

---

## Phase 7: Follow-up — Make the left menu actually sticky (P1)

**Why this exists**: post-merge code review caught that the spec/plan repeatedly call the left menu a **"sticky navigation menu"** (spec § 23 + 218; plan § 14 + 47 + 275 + 309) but the shipped Phase 3 layout used `lg:items-start` only — that aligns the menu to the top of the flex row but does NOT keep it pinned to the viewport during scroll. After scrolling past D.1, the menu disappeared from the viewport, defeating its purpose. Spec FR-005 requires the active state to follow scroll, which implicitly requires the menu to stay visible while the user scrolls. Phase 7 closes this gap with a TDD red→green cycle.

- [x] T040 [US2] [UI] [Test] **Implemented 2026-05-10** — added `US2 #2 — left menu sticks to viewport top while the user scrolls through the cards (FR-005)` to [tests/e2e/awards.spec.ts](../../tests/e2e/awards.spec.ts) (verified RED on the un-fixed code), then patched two layers:
  1. [src/components/awards/AwardsLayout.tsx](../../src/components/awards/AwardsLayout.tsx) — replaced `lg:block` wrapper with `lg:sticky lg:top-[var(--saa-header-scroll-margin)] lg:block` so the menu pins to viewport top while the AwardsLayout `<section>` is on screen. The CSS-variable `top` value reuses the same hook the cards' `scroll-margin-top` reads — if the deployed `Header` is later flipped to `position: sticky / fixed`, only `--saa-header-scroll-margin` needs to change and the menu offset auto-tracks.
  2. [app/awards/page.tsx](../../app/awards/page.tsx) — swapped `<main>`'s `overflow-hidden` for `overflow-x-clip`. Sticky descendants need a non-scroll-container ancestor chain up to the viewport; `overflow-hidden` creates a scroll container that breaks `position: sticky`. `overflow: clip` clips visually without establishing a scroll container (modern CSS). Horizontal-only clip preserves the original defensive intent for the absolute-positioned background image.

  Test asserts the menu's `bounding rect.top` is in `[0, 80)` after `scrollIntoViewIfNeeded("article#top-project-leader")` — i.e., menu pinned to viewport top with the placeholder header offset. Awards e2e: **20/20 GREEN**. Vitest + Homepage suites unaffected. `npx eslint` + `npx tsc --noEmit` clean | tests/e2e/awards.spec.ts + src/components/awards/AwardsLayout.tsx + app/awards/page.tsx

**Checkpoint**: SCREENFLOW.md synced. All E2E suites green. PR ready for review.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately. T001/T002/T003 in parallel; T004 then T005 sequentially (same files); T006 after T004+T005.
- **Phase 2 (Foundation)**: Depends on Phase 1 T004 + T005 (i18n keys must exist before catalog references them). **BLOCKS all user-story phases**.
- **Phase 3 (US1 + US5)**: Depends on Phase 2.
- **Phase 4 (US2)**: Depends on Phase 3 (needs `AwardsLayout` + page route + `AwardDetailCard` IDs).
- **Phase 5 (US3 + US4)**: Depends on Phase 3 (needs the page route to exist). Can run in parallel with Phase 4 — different concerns (Phase 4 = scroll/menu; Phase 5 = cross-link verification).
- **Phase 6 (Polish)**: Depends on all of Phase 3 + 4 + 5.

### Within Each User Story

- TDD ordering: Tests authored FIRST (red) → implementation → tests pass (green) per Constitution Principle V.
- For US1 + US5: T013 + T014 + T015 → T016 → T017 → T018 → T019 → T020 (verify).
- For US2: T021 (stub setup) → T022 + T023 (tests, parallel) → T024 → T025 → T026 (verify).
- For US3 + US4: T027 + T028 (parallel) → T029 (verify).

### Parallel Opportunities

**Phase 1**: T001 ↔ T002 ↔ T003 all parallelizable (different concerns: assets, tokens, header survey). T004 + T005 are sequential (same data shape), then T006.

**Phase 2**: T007 + T008 parallel (different test files). After both red, T009 → T010 (sequential — same file `awards.ts`); T011 parallel with T009/T010 (different file). T012 verifies all green.

**Phase 3**: T013 + T014 parallel (different test files); T015 separate (E2E). T016 must precede T017 (List uses Card). T017 must precede T018 (Layout uses List). T019 last (page composes everything).

**Phase 4**: T021 first (setup file). T022 + T023 parallel. T024 → T025 sequential. T026 last.

**Phase 5**: T027 + T028 parallel (independent E2E scenarios). T029 last.

**Phase 6**: T030–T034 all parallel (independent test scenarios in different files). T035 verifies. T036 + T037 parallel (different docs). T038 + T039 last.

### Cross-Phase Parallelization

If team capacity allows, **Phase 4 (US2)** and **Phase 5 (US3 + US4)** can be developed by different contributors simultaneously after Phase 3 lands — Phase 4 touches `src/components/awards/AwardsNav.tsx` + Layout wiring; Phase 5 only touches `tests/e2e/awards.spec.ts` (no production code). Zero file overlap.

---

## Implementation Strategy

### MVP First (Recommended)

1. Complete Phase 1 + Phase 2 (Setup + Foundation).
2. Complete Phase 3 (US1 + US5 — the page renders and is auth-gated).
3. **STOP and VALIDATE**: Manual smoke + automated tests; deploy to staging.
4. The screen is **shippable** at this point: users can browse the catalog, anchor scroll from Homepage works (relies on FR-014 native anchor + FR-007 fallback). Active-state synchronization is the only missing P1 item.

### Incremental Delivery

1. **Setup + Foundation** (Phase 1 + 2) → no user-visible change yet; data layer + assets ready.
2. **+ US1 + US5** (Phase 3) → Test → Deploy. **MVP shippable.** Six cards visible; auth gate enforced. Deep-links work via native anchor (FR-014).
3. **+ US2** (Phase 4) → Test → Deploy. Active-state menu synchronization lights up. Smooth-scroll on click. The screen feels "complete".
4. **+ US3 + US4** (Phase 5) → Test → Deploy. Cross-link to Sun* Kudos verified; header/footer parity verified. (No new code — verification only.)
5. **+ Polish** (Phase 6) → Test → Deploy. Edge cases covered; SCREENFLOW.md synced.

---

## Task Type Summary (per user request)

| Type | Count | Phases | Notes |
|------|-------|--------|-------|
| **[Logic]** (data layer, helpers, types, i18n keys) | 5 | Setup (T004, T005), Foundation (T009, T010, T011), Phase 4 partial (T024 logic portion) | Catalog extension + format helper + i18n keys. No business logic in route handlers (Constitution Principle II) — all read-only. |
| **[UI]** (components, page, styles, assets) | 11 | Setup (T001, T002, T003), Phase 3 (T016, T017, T018, T019), Phase 4 (T024, T025) | 4 new components + 1 page replacement + 6 asset downloads + 4 new Tailwind tokens. All Server Components except `AwardsNav` (single Client Island). |
| **[Test]** (Vitest + Playwright) | 16 | Phase 1 (T006), Phase 2 (T007, T008, T012), Phase 3 (T013, T014, T015, T020), Phase 4 (T021, T022, T023, T026), Phase 5 (T027, T028, T029), Phase 6 (T030–T035) | TDD throughout; coverage targets per plan §"Coverage Goals". 1 IntersectionObserver stub added to `vitest.setup.ts` (Phase 4). |
| **Documentation / Verification** | 4 | Phase 6 (T036, T037, T038, T039) | SCREENFLOW.md sync + Homepage regression check + final PR readiness. |
| **TOTAL** | **39** tasks | 6 phases | |

> **Note** — Several tasks have a hybrid label (e.g., T019 is `[US1] [US5] [UI]` because the page-route Server Component does both auth gating logic and UI composition; T024 is `[US2] [UI] [Logic]` because the AwardsNav island does observer wiring + DOM rendering in one file). The primary type label is what the developer mostly works on; secondary concerns are inline in the description.

---

## Notes

- **Commit cadence**: One commit per task (or one per logical group within a phase). Use the conventional-commit format from `momorph.commit` — first commit per phase should mention the phase number for trace.
- **TDD discipline (Constitution Principle V)**: Tests are RED → GREEN. T007 / T008 / T013 / T014 / T015 must all be RED before their corresponding implementation tasks. PRs that skip the RED state will be rejected at code review.
- **TDD violation acknowledged for Phase 4** (T022 + T023 written *after* T024 + T025 on 2026-05-10): the user requested UI tasks first via `/momorph.implement-ui`, then test tasks via `/momorph.implement` in a follow-up turn. T024 was reviewed manually + Playwright-smoked before T022 landed; T022 went GREEN immediately on first run (no RED state was observed). T021 stub was authored fresh and is independently verified by 7 AwardsNav scenarios. PR reviewers should weigh this against the principle and decide whether to require a re-do for strict compliance.
- **No new dependencies (TR-007)**: Phase 6 T039 explicitly checks `package.json` and `package-lock.json` for unintended diffs. Native APIs only.
- **Coverage targets** (from plan §"Coverage Goals"):
  - Core user flows (US1 + US2 + US5) = 100% scenario coverage in E2E.
  - Component unit tests (`AwardDetailCard`, `AwardsList`, `AwardsNav`) ≥ 80% line coverage.
  - i18n parity (`awards.detail.*`) = 100% key coverage.
- **Non-blocking follow-ups** documented during plan review:
  - Header conversion to sticky/fixed if Awards Figma frame demands it (T003 verifies; out-of-scope per FR-009).
  - Structured narrow-viewport menu pattern (tab strip / accordion / bottom-sheet) deferred post-MVP per Q-HTG4.
  - Static catalog → admin-editable API only if Q-HTG3 is reopened.

---

## Validation

Before reporting tasks.md as ready:

- [x] All 39 tasks follow the strict format: `- [ ] T### [P?] [Story?] [Type] Description | file/path`.
- [x] Every user story (US1–US5) has at least one task explicitly labeled with that story.
- [x] All 14 FRs from spec.md are addressed (mapped via task descriptions; verified by spec ↔ plan cross-reference at plan.md §Notes).
- [x] All 7 TRs from spec.md are addressed.
- [x] Tests precede their implementation tasks within each phase (TDD).
- [x] Setup + Foundation phases have NO `[USx]` labels (per skill convention).
- [x] User-story phases have `[USx]` labels on every task.
- [x] Polish phase has NO `[USx]` labels.
- [x] Every task has a concrete file path or paths.
- [x] Parallel opportunities documented per phase.
- [x] Independent test criteria stated for each user-story phase.
- [x] MVP scope clearly identified (Phase 1 + 2 + 3 = US1 + US5 shippable).
