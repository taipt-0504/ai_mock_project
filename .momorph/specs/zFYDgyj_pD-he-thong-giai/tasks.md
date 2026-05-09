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

- [ ] T007 [Test] **EXTEND** the existing test [tests/unit/lib/awards/awards.test.ts](../../tests/unit/lib/awards/awards.test.ts) BEFORE the type/data change (TDD red). ADD assertions: every entry has `quantity > 0` and `valueVND > 0`; `unitKey` is `null` XOR a non-empty string starting with `awards.detail.unit.`; `valueVNDSecondary` is non-null only for `signature-2025-creator` (matches 8_000_000); every `awardImageAsset` matches `/^/assets/awards/[a-z0-9-]+\.png$/`. **Do NOT delete or duplicate existing assertions** — additive only. Test must FAIL first | tests/unit/lib/awards/awards.test.ts
- [ ] T008 [P] [Test] CREATE [tests/unit/lib/awards/format.test.ts](../../tests/unit/lib/awards/format.test.ts) BEFORE the helper exists (TDD red). Asserts `formatVndAmount(7000000) === "7.000.000"`, `formatVndAmount(15000000) === "15.000.000"`, `formatVndAmount(0) === "0"`, output contains no `,` separator (sanity guard against system-locale leakage). Test must FAIL first | tests/unit/lib/awards/format.test.ts
- [ ] T009 [Logic] Extend the `Award` type in [src/lib/awards/awards.ts](../../src/lib/awards/awards.ts) with five new readonly fields: `quantity: number`, `unitKey: string \| null`, `valueVND: number`, `valueVNDSecondary: number \| null`, `awardImageAsset: string`. Update the JSDoc block. **Do not change the existing five fields** (`id`, `slug`, `titleKey`, `descriptionKey`, `labelAsset`, `labelWidth`, `labelHeight`) — Homepage AwardCard depends on them | src/lib/awards/awards.ts
- [ ] T010 [Logic] Populate the six entries in `AWARDS` with the new field values per plan.md Phase 1 table: Top Talent (10, `awards.detail.unit.don_vi`, 7_000_000, null), Top Project (2, `awards.detail.unit.tap_the`, 15_000_000, null), Top Project Leader (3, `awards.detail.unit.ca_nhan`, 7_000_000, null), Best Manager (1, `awards.detail.unit.ca_nhan`, 10_000_000, null), Signature 2025 Creator (1, null, 5_000_000, 8_000_000), MVP (1, null, 15_000_000, null). `awardImageAsset` = `/assets/awards/{slug}.png` | src/lib/awards/awards.ts
- [ ] T011 [P] [Logic] Create the pure helper `formatVndAmount(value: number): string` using `value.toLocaleString("vi-VN")` (returns Vietnamese thousand-separator e.g. `7.000.000`). Add explicit return type per Constitution Principle II | src/lib/awards/format.ts
- [ ] T012 [Test] Run T007 + T008. Both tests must now pass (TDD green). Run `npm run lint` + `tsc --noEmit` — must be clean. Run Homepage E2E suite to verify no regression (existing `AwardCard` is unaffected — extension is additive)

**Exit criteria**: T007 + T008 green. Catalog has 6 entries each with all 12 fields. `formatVndAmount` exists at [src/lib/awards/format.ts](../../src/lib/awards/format.ts). Homepage tests still green.

---

## Phase 3: User Story 1 + User Story 5 — Browse the catalog + Auth gating (Priority: P1) 🎯 MVP

**Goal**: Authenticated user lands on `/awards` and sees all six award detail cards in fixed order. Anonymous visitor is redirected to `/login` before any markup is rendered. **Delivers spec US1 + US5 end-to-end** (without scroll-tracking — that's US2 in Phase 4). Maps to plan **Phase 2 + Phase 3**.

**Independent Test**: Visit `/awards` in a fresh authenticated browser session — page renders header (with `Awards Information` marked active via `aria-current="page"`), keyvisual, title block, six cards in correct order with all five content fields each, KudosBlock at bottom, footer, FAB. Sign out and visit `/awards` again — 302 redirect to `/login`, no markup leak.

### Tests (US1 + US5) — TDD red

- [ ] T013 [P] [US1] [Test] Write [tests/unit/components/awards/AwardDetailCard.test.tsx](../../tests/unit/components/awards/AwardDetailCard.test.tsx) BEFORE the component exists. Assert all 5 content pieces render (thumbnail with non-empty alt, title via `t(award.titleKey, locale)`, description via `t(award.descriptionKey, locale)`, quantity line `Số lượng giải thưởng: {n} {unit}` with unit substitution from `t(award.unitKey, locale)` when non-null, value line `Giá trị giải thưởng: {value} VNĐ` via `formatVndAmount`); Signature 2025 renders BOTH tiers; MVP/Signature render quantity without unit segment; root element is `<article id="{slug}">` for FR-006 anchor; no interactive controls inside | tests/unit/components/awards/AwardDetailCard.test.tsx
- [ ] T014 [P] [US1] [Test] Write [tests/unit/components/awards/AwardsList.test.tsx](../../tests/unit/components/awards/AwardsList.test.tsx) BEFORE the component exists. Assert exactly six `<article>` elements rendered, ids appear in order `top-talent → top-project → top-project-leader → best-manager → signature-2025-creator → mvp` (FR-002 / FR-003) | tests/unit/components/awards/AwardsList.test.tsx
- [ ] T015 [US1] [US5] [Test] Write Playwright spec [tests/e2e/awards.spec.ts](../../tests/e2e/awards.spec.ts) covering: (1) anonymous visit to `/awards` returns 302 to `/login` with no markup leak (US5 #1); (2) authenticated visit renders six cards in order with the header `Awards Information` link having `aria-current="page"` (US1 #1); (3) Sun* Kudos block visible at bottom (US3 placeholder, full assertion in Phase 5); (4) `<footer>` rendered with copyright. **Do not include** scroll/menu scenarios yet — those are added in Phase 4 | tests/e2e/awards.spec.ts

### UI (US1) — implementation

- [ ] T016 [US1] [UI] Implement [src/components/awards/AwardDetailCard.tsx](../../src/components/awards/AwardDetailCard.tsx) as a Server Component. Props: `{ award: Award; locale: SupportedLocale }`. Renders `<article id={award.slug} className="[scroll-margin-top:var(--saa-header-scroll-margin)] ...">` with `<Image src={award.awardImageAsset} alt={t(award.titleKey, locale)} width={336} height={336} />`, `<h3>{t(award.titleKey, locale)}</h3>`, description paragraph, quantity line, value line. Conditionally render unit segment only when `award.unitKey !== null`. Conditionally render secondary tier only when `award.valueVNDSecondary !== null` (Signature 2025 case) | src/components/awards/AwardDetailCard.tsx
- [ ] T017 [US1] [UI] Implement [src/components/awards/AwardsList.tsx](../../src/components/awards/AwardsList.tsx) as a Server Component. Props: `{ locale: SupportedLocale }`. Iterates `AWARDS` and renders one `<AwardDetailCard award={a} locale={locale} key={a.id} />` per entry | src/components/awards/AwardsList.tsx
- [ ] T018 [US1] [UI] Implement [src/components/awards/AwardsLayout.tsx](../../src/components/awards/AwardsLayout.tsx) as a Server Component with the two-column wide-viewport layout. Props: `{ locale: SupportedLocale }`. In this phase render the right column (`<AwardsList />`) only; left-column placeholder is `<div aria-hidden />` (`AwardsNav` lands in Phase 4). Single-column scroll-only fallback on narrow viewports per Q-HTG4 (Tailwind responsive utilities) | src/components/awards/AwardsLayout.tsx

### UI + Logic (US5 + US1) — page route

- [ ] T019 [US1] [US5] [UI] Replace the stub at [app/awards/page.tsx](../../app/awards/page.tsx) with the real Server Component composing the page. Steps: (1) `const session = await auth().catch(() => null); if (!session?.user) redirect("/login")`; (2) `const locale = await getSaaLocale()`; (3) `let unreadCount = 0; try { unreadCount = await getUnreadCount(session.user.id); } catch {}`; (4) compose `<Header locale isAuthenticated logoHref="/" nav={<NavLinks currentPath="/awards" locale={locale} />} notification={<NotificationBell locale unreadCount />} profileMenu={<ProfileButton locale user={session.user} />} />`, `<Keyvisual />`, `<AwardsTitleBlock locale />`, `<AwardsLayout locale />`, `<KudosBlock locale />`, `<Footer locale />`, `<WidgetButton locale />`. Keep `Keyvisual` and `AwardsTitleBlock` as **inline server components** within this file (Constitution Principle I — no premature abstraction) | app/awards/page.tsx
- [ ] T020 [US1] [Test] Run T013 + T014 + T015 — all must pass (TDD green). Run `npm run lint` + `tsc --noEmit` — must be clean. Smoke-test in dev server (`npm run dev`) — no console errors

**Checkpoint**: User Story 1 + User Story 5 complete. The screen renders end-to-end for authenticated users; anonymous users are redirected. Active-state synchronization (US2) is NOT implemented yet — clicking the (placeholder) menu does nothing.

---

## Phase 4: User Story 2 — Track scroll position via the left menu (Priority: P1)

**Goal**: User scrolling through the awards list sees the left menu's active item update to track the most-visible card; clicking a menu item smooth-scrolls to its card and flips the active state. Maps to plan **Phase 4**.

**Independent Test**: On `/awards`, scroll from top to bottom using the mouse wheel only — the left menu's active item updates as each card crosses into the viewport. Click `Top Talent` from anywhere — page scrolls to D.1 with smooth scroll (or instant if `prefers-reduced-motion: reduce`), `C.1` gains `aria-current="true"`. Type `/awards#mvp` in the URL bar (or click an MVP deep-link from Homepage) — page scrolls to D.6 with the MVP title fully visible (no header occlusion).

### Tests (US2) — TDD red

- [ ] T021 [P] [US2] [Test] Add an `IntersectionObserver` global stub to [vitest.setup.ts](../../vitest.setup.ts) (file does not currently ship one). Stub exposes `triggerEntries(entries: Partial<IntersectionObserverEntry>[])` for deterministic tests; `observe`/`unobserve`/`disconnect` are no-ops. Stub is INERT — only Awards tests call `triggerEntries`; Homepage / Login / other suites are unaffected | vitest.setup.ts
- [ ] T022 [US2] [Test] Write [tests/unit/components/awards/AwardsNav.test.tsx](../../tests/unit/components/awards/AwardsNav.test.tsx) BEFORE the component exists. Cover: (1) renders six `<a href="#<slug>">` items in canonical order (FR-003 / FR-014); (2) initial `activeSlug` derives from `window.location.hash` on mount (FR-006); (3) unknown hash → `top-talent` active by default (FR-007); (4) click on item flips `aria-current="true"` to that item and clears the previously active one; (5) `triggerEntries` fires → `aria-current` follows the topmost entry with `intersectionRatio >= 0.5`; (6) `hashchange` event re-syncs `activeSlug`; (7) `prefers-reduced-motion: reduce` causes `behavior: "auto"` instead of `"smooth"` on `scrollIntoView` | tests/unit/components/awards/AwardsNav.test.tsx
- [ ] T023 [US2] [Test] Extend [tests/e2e/awards.spec.ts](../../tests/e2e/awards.spec.ts) with three new scenarios: (1) US1 #2 — visit `/awards#mvp` and assert MVP card title's `boundingClientRect.top >= 0` (no header occlusion); (2) US1 #4 — click `Top Talent` menu item, assert D.1 in viewport + `C.1` has `aria-current="true"`; (3) US2 #1 — programmatic scroll past D.2, assert `C.2` becomes active. Also add: `hashchange` via `page.evaluate('history.replaceState(...)')` triggers menu sync (Edge Case from spec) | tests/e2e/awards.spec.ts

### UI + Logic (US2) — Client Component island

- [ ] T024 [US2] [UI] [Logic] Implement [src/components/awards/AwardsNav.tsx](../../src/components/awards/AwardsNav.tsx) with `"use client"`. Props: `{ locale: SupportedLocale }`. State: `useState<AwardSlug>(...)`. On mount: read `window.location.hash`; set initial `activeSlug` to matching `AwardSlug` or `"top-talent"` (FR-007). Use `useEffect` to instantiate one `IntersectionObserver` whose `rootMargin` is sourced from `getComputedStyle(document.documentElement).getPropertyValue("--saa-header-scroll-margin").trim() \|\| "0px"`, `threshold: [0.5]`. Observe all six `D.*` cards by `document.getElementById(slug)`. Tie-break by topmost `boundingClientRect.top`. Add a second `useEffect` for `hashchange`. Click handler calls `element.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" })` where `prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches`. Render `<nav aria-label="Awards categories">` with six `<a href="#<slug>" aria-current={activeSlug === slug ? "true" : undefined}>` items. Touch target: ensure `block py-3 px-4` (or token equivalent) yields ≥ 44 × 44 CSS-px on 360 px viewport (Constitution Principle III) | src/components/awards/AwardsNav.tsx
- [ ] T025 [US2] [UI] Wire `AwardsNav` into `AwardsLayout` — replace the `<div aria-hidden />` placeholder from T018 with `<AwardsNav locale={locale} />` in the left column | src/components/awards/AwardsLayout.tsx
- [ ] T026 [US2] [Test] Run T022 + T023 — all must pass (TDD green). Run `npm run lint` + `tsc --noEmit`. Run Homepage E2E to verify no regression

**Checkpoint**: All P1 user stories (US1, US2, US5) pass end-to-end. `aria-current` switching works in jsdom + browser. Smooth-scroll respects `prefers-reduced-motion`. Touch-target rule satisfied.

---

## Phase 5: User Story 3 + User Story 4 — Sun* Kudos cross-link + Header/Footer parity (Priority: P2)

**Goal**: Sun* Kudos block at the bottom is functional (click `Chi tiết` → `/sun-kudos`); shared `Header` + `Footer` behave identically to Homepage. Maps to plan **Phase 5**. **No new UI code** — the components are already shipped from Homepage Phase 13. This phase is verification + Playwright assertions only.

**Independent Test**: On `/awards`, click `Chi tiết` in the Sun* Kudos block — navigates to `/sun-kudos`. Click language chip — opens Dropdown — Language overlay (same as Homepage). Click profile avatar → `Đăng xuất` — triggers `signOutAction`, redirects to `/login`. Click header `About SAA 2025` → `/`; click footer `Sun* Kudos` → `/sun-kudos`.

### Tests (US3 + US4)

- [ ] T027 [P] [US3] [Test] Extend [tests/e2e/awards.spec.ts](../../tests/e2e/awards.spec.ts) with US3 scenarios: (1) Sun* Kudos block visible at bottom with all 5 elements (label "Phong trào ghi nhận", title "Sun* Kudos", description, illustration, `Chi tiết` button); (2) click `Chi tiết` → URL = `/sun-kudos` (FR-008) | tests/e2e/awards.spec.ts
- [ ] T028 [P] [US4] [Test] Extend [tests/e2e/awards.spec.ts](../../tests/e2e/awards.spec.ts) with US4 scenarios: (1) language chip click → Dropdown — Language overlay opens with same options as Homepage; (2) profile avatar click → Profile dropdown opens, `Đăng xuất` triggers `signOutAction` → `/login`; (3) header `About SAA 2025` link → `/` (Homepage SAA); (4) footer `7.4` Sun* Kudos link → `/sun-kudos` | tests/e2e/awards.spec.ts
- [ ] T029 [Test] Run full E2E suite (`npm run test:e2e`) — Awards US3 + US4 green; Homepage suite still green (no regression)

**Checkpoint**: All P2 user stories complete. The screen now satisfies every spec user story.

---

## Phase 6: Polish & Cross-Cutting Concerns — Edge Cases + Documentation

**Purpose**: Cover the six Edge Cases listed in spec § "Edge Cases" + sync `SCREENFLOW.md`. Maps to plan **Phase 6 + Phase 7**.

### Tests (Edge Cases)

- [ ] T030 [P] [Test] Extend [tests/e2e/awards.spec.ts](../../tests/e2e/awards.spec.ts): visit `/awards#nonexistent-slug` → page renders, no automatic scroll, `Top Talent` menu item active, no JavaScript console error (FR-007 / Edge Case "Deep-link to unknown slug" / test case ID-13) | tests/e2e/awards.spec.ts
- [ ] T031 [P] [Test] Extend Playwright with JS-disabled scenario: `browserContext.setJavaScriptEnabled(false)`; navigate to `/awards`; click first menu item; assert URL hash is set and document scrolled (native browser anchor behavior); active-state highlight is absent — acceptable per FR-014 / Edge Case "JavaScript disabled" | tests/e2e/awards.spec.ts
- [ ] T032 [P] [Test] Extend [tests/unit/components/awards/AwardDetailCard.test.tsx](../../tests/unit/components/awards/AwardDetailCard.test.tsx): assert the `<Image>` renders with a non-empty `alt` prop (Edge Case "Image load failure"; React's default behavior covers the actual fallback) | tests/unit/components/awards/AwardDetailCard.test.tsx
- [ ] T033 [P] [Test] Extend [tests/e2e/awards.spec.ts](../../tests/e2e/awards.spec.ts): on `/awards`, click language chip → select EN; assert award titles + meta-line labels switch to English; assert no full page reload (URL fragment + DOM identity preserved) — Edge Case "Locale switching mid-screen" | tests/e2e/awards.spec.ts
- [ ] T034 [Test] Extend [tests/e2e/awards.spec.ts](../../tests/e2e/awards.spec.ts) with touch-target verification: at 360 px viewport (`page.setViewportSize({ width: 360, height: 800 })`), assert every menu-item anchor's bounding box has both `width >= 44` and `height >= 44` CSS pixels (Constitution Principle III; covers US2 narrow-viewport degradation) | tests/e2e/awards.spec.ts
- [ ] T035 [Test] Run full unit + E2E + lint + tsc one more time. All must be green. **No `.only` / `.skip` / `xit` annotations on new tests** (Constitution Principle V)

### Documentation (Cross-cut sync)

- [ ] T036 [P] Update [.momorph/SCREENFLOW.md](../../SCREENFLOW.md) Discovery Log: add a "UI implementation" entry for 2026-05-XX with phase-by-phase summary (analogous to Homepage 2026-05-07 entry). Update Screen Details — Hệ thống giải block: change "(stub 2026-05-08)" to "shipped {YYYY-MM-DD}" in the Mermaid graph + Main Application screen group | .momorph/SCREENFLOW.md
- [ ] T037 [P] Update [.momorph/contexts/SCREENFLOW.md](../../contexts/SCREENFLOW.md) Screen Index: change status note for `zFYDgyj_pD` from "Ready for `momorph.plan`" to "shipped {YYYY-MM-DD}" | .momorph/contexts/SCREENFLOW.md
- [ ] T038 Verify Homepage award-card → `/awards#<slug>` navigation in a browser session — the destination flips from stub to real screen with anchor scroll honored. No code change expected; Homepage test suite already passes the link
- [ ] T039 Final PR check: lint + tsc + Vitest + Playwright all green; no `package.json` / `package-lock.json` diff (TR-007 — no new deps); no `.env*` modifications

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
- **TDD discipline (Constitution Principle V)**: Tests are RED → GREEN. T007 / T008 / T013 / T014 / T015 / T022 / T023 must all be RED before their corresponding implementation tasks. PRs that skip the RED state will be rejected at code review.
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
