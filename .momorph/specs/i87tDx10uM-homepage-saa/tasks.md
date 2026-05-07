# Tasks: Homepage SAA

**Frame**: `i87tDx10uM-homepage-saa`
**Prerequisites**: [plan.md](plan.md) (required), [spec.md](spec.md) (required). No `research.md` (intentional — see plan §"Why no research.md"), no `design-style.md` (visual specs fetched on-demand via `query_section` per spec scope; same convention as Login + Dropdown).

---

## Task Format

```
- [ ] T### [P?] [Story?] Description with file path
```

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: User-story label (US0..US9) — required in story phases only

---

## Status Rollup (initial — pre-implementation)

**Total tasks**: 73 across 13 phases.
**MVP scope**: Phases 1 + 2 + 3 (US0) + 4 (US1) + 5 (US2) + 6 (US3) + 7 (US4) → 47 tasks. The remaining stories (US5/US6/US7/US8/US9) are P2/P3 and can ship incrementally after MVP.
**PQ1 = b**: `User.role` schema is deferred. ProfileButton ships with the user-only menu (Profile + Sign out). The admin variant + its test land in a follow-up PR alongside the schema migration.

---

## Phase 1: Setup (Asset & Token Prep — plan Phase 0)

**Purpose**: Fetch Figma's visual treatment per section, download referenced media, and register any new Tailwind tokens BEFORE any component code lands. Constitution Principle II forbids raw color/spacing literals — so token registration MUST come before reference.

- [ ] T001 Run `query_section` for each top-level Homepage section; record the values listed in plan §Phase 0 step 2 (trigger dimensions, header layout, hero, countdown, CTA buttons, essay, awards section, Kudos block, FAB, footer). Record findings in a scratch note for use across Phases 4-11 | (no file change — Figma read; per-section, not all at once)
- [ ] T002 [P] Run `list_media_nodes` on `screenId=i87tDx10uM` to enumerate all `MM_MEDIA_*` assets (hero key-visual, six award thumbnails, Kudos illustration, FAB icons, any chevron/icon variants) | (no file change — Figma read)
- [ ] T003 [P] Download via `get_media_files` into `public/assets/home/`: hero key-visual, six award thumbnails (`award-top-talent.{ext}`, `award-top-project.{ext}`, etc.), Kudos illustration. Use kebab-case filenames. If `list_media_nodes` returns empty for any expected asset, author a fallback in the project's existing icon style (mirroring the dropdown's `flag-en.svg` workaround) | public/assets/home/
- [ ] T004 [P] Identify any color/spacing/radius/shadow values from T001 that are NOT in the existing token system (`saa-page`, `saa-page-fg`, `saa-button-primary`, `saa-button-primary-fg`, `saa-divider`, `saa-header-overlay`, `saa-dropdown-surface`, `saa-dropdown-border`). Likely additions: `saa-card-surface`, `saa-card-border`, `saa-essay-fg`, `saa-essay-quote-fg`, `saa-fab-bg`, `saa-fab-fg`, `saa-footer-bg`, `saa-footer-fg`. Add each as a CSS variable under `:root` AND register in `@theme inline` so Tailwind picks them up | app/globals.css

**Checkpoint**: Phase 1 complete — Figma values recorded, assets on disk, all needed tokens addressable. Phase 2 may proceed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Configuration, static data, i18n keys, and the Toaster primitive — everything that ALL user stories depend on.

**⚠️ CRITICAL**: No user story phase can begin until Phase 2 is complete.

- [ ] T005 Add `SAA_EVENT_START_AT: z.string().optional()` to the zod schema. Constitution § Configuration: `config.ts` is the ONLY module allowed to read `process.env`. The countdown's "missing/malformed" fallback (US1 scenario 4) is preserved by `.optional()` + downstream parse-failure handling | src/lib/config.ts
- [ ] T006 [P] Add `SAA_EVENT_START_AT="2025-12-31T18:30:00+07:00"` (placeholder; replace with the program target before deployment) | .env.example, .env.local
- [ ] T007 [P] Write failing unit tests for the event-config parsing util — valid ISO-8601, missing, malformed, future timestamp, past timestamp | src/lib/event/event-config.test.ts
- [ ] T008 Implement the event-config parser to make T007 pass — pure function `parseEventStart(envValue: string | undefined): Date | null`. No side effects; returns `null` on any failure | src/lib/event/event-config.ts
- [ ] T009 [P] Write failing unit tests for the awards static config — exactly six entries; slugs match the canonical list (`top-talent`, `top-project`, `top-project-leader`, `best-manager`, `signature-2025-creator`, `mvp`); each `titleKey` and `descriptionKey` resolves in BOTH `vi-VN.json` and `en-US.json`; deterministic ordering | src/lib/awards/awards.test.ts
- [ ] T010 Implement the awards static config (six entries with `id`, `slug`, `titleKey`, `descriptionKey`, `thumbnailAsset`) to make T009 pass | src/lib/awards/awards.ts
- [ ] T011 Add ~30 new keys to vi-VN catalog: hero (title + "Coming soon" subtitle), nav (3), event-info (3), CTAs (2), Root Further essay (3 paragraphs + 1 quote), award titles + descriptions (12), Kudos block (4 — label/title/description/CTA), footer (5 — 4 links + copyright), notification "Coming soon" toast (1) | src/lib/i18n/catalogs/vi-VN.json
- [ ] T012 [P] Add the same ~30 keys to en-US catalog in lockstep with T011. Run `tests/unit/lib/i18n/parity.test.ts` — MUST pass | src/lib/i18n/catalogs/en-US.json
- [ ] T013 Write failing unit tests for the toast primitive — (a) `toast(...)` is a no-op when no `Toaster` is mounted; (b) Toaster shows then auto-dismisses after `durationMs`; (c) multiple rapid calls queue | tests/unit/components/ui/toast.test.tsx
- [ ] T014 Implement the imperative `toast()` helper backed by an in-memory `EventTarget`. Public surface: `toast(message: string, options?: { variant?: "info" \| "error"; durationMs?: number }): void` | src/components/ui/toast.ts
- [ ] T015 Implement the minimal `Toaster` client component to make T013 pass — listens to the event bus, renders queued messages with auto-dismiss | src/components/ui/Toaster.tsx
- [ ] T016 Mount `<Toaster />` in the root layout so any client component on any page can call `toast()` | app/layout.tsx

**Checkpoint**: Foundation ready — config + awards data + i18n keys + Toaster all in place. User story phases can now proceed in parallel (if staffed).

---

## Phase 3: User Story 0 — Authenticated access only (Priority: P1) 🎯 MVP precondition

**Goal**: Anonymous requests to `/` redirect to `/login`. The auth gate already exists in [app/page.tsx](app/page.tsx) (shipped with Login). This phase verifies via E2E and hardens against regressions.

**Independent Test**: From a clean browser session (no `authjs.session-token`), visit `/` — receive 307/308 redirect to `/login`. Authenticate via Google → land on `/`. Sign out → next visit to `/` redirects again.

- [ ] T017 [US0] Write failing E2E covering all 5 US0 acceptance scenarios: (1) anon GET `/` → redirect to `/login`; (2) tampered cookie → redirect; (3) post-OAuth landing on `/`; (4) sign-out then visit `/` → redirect; (5) authed visit to `/login` redirected to `/` (no infinite loop) | tests/e2e/home/auth-redirect.spec.ts
- [ ] T018 [US0] Run T017 against the existing [app/page.tsx](app/page.tsx). The auth gate is already shipped (`auth()` + `redirect("/login")` lines 12-24). All 5 scenarios MUST pass without code change. If any scenario fails, file a bug — do NOT silently bypass | (no file change — verification only)

**Checkpoint**: US0 (auth gate) verified. The `/` route is provably gated; downstream user stories build on top.

---

## Phase 4: User Story 1 — Hero + Countdown (Priority: P1)

**Goal**: Authenticated user lands on `/` and immediately sees "ROOT FURTHER" key visual, "Coming soon" subtitle, three live-ticking countdown tiles (DD/HH/MM zero-padded), and the static event-info block.

**Independent Test**: Sign in, open `/`. Verify hero copy, "Coming soon" visible, three tiles render `XX XX XX` with leading-zero padding. Wait one minute → minutes decrements (or rolls over). Set `SAA_EVENT_START_AT` to a past datetime → all `00`, "Coming soon" hidden. Set to garbage → fallback renders, page doesn't crash.

- [ ] T019 [US1] Write failing unit tests for `Countdown` covering 5 scenarios: future (full ticking + 2-digit padding), per-minute decrement (use `vi.useFakeTimers()` + `vi.setSystemTime()`), zero-state (`00 00 00` + Coming soon hidden), null-eventStart fallback (`-- -- --` or last-known), visibilitychange recovery from inactive tab | tests/unit/components/home/Countdown.test.tsx
- [ ] T020 [P] [US1] Write failing unit tests for `EventInfo` — renders the three i18n keys verbatim (`Thời gian: 18h30`, `Địa điểm: Nhà hát nghệ thuật quân đội`, Facebook live note); no interactive elements | tests/unit/components/home/EventInfo.test.tsx
- [ ] T021 [US1] Implement `Countdown` (`"use client"`) with props `{ eventStart: Date | null; locale: SupportedLocale }`. Initial values are SSR-safe — server renders the snapshot, client hydrates and starts ticking via `setInterval(60_000)` + `visibilitychange` listener | src/components/home/Countdown.tsx
- [ ] T022 [P] [US1] Implement `EventInfo` (server component) — static block from i18n catalog | src/components/home/EventInfo.tsx
- [ ] T023 [US1] Implement `Hero` (server component) — composes "ROOT FURTHER" title + "Coming soon" subtitle (i18n) + `<Countdown />`. Hides the subtitle when `eventStart` is in the past | src/components/home/Hero.tsx
- [ ] T024 [US1] Wire `<Hero />` and `<EventInfo />` into [app/page.tsx](app/page.tsx) below the existing auth gate. Pass `eventStart={parseEventStart(config.SAA_EVENT_START_AT)}` and `locale={await getSaaLocale()}` to `Hero` | app/page.tsx
- [ ] T025 [US1] Manual smoke: open `/` signed-in, switch tabs for 2 minutes, return — countdown values jump to current via the visibilitychange handler | (no file change — manual verification)

**Checkpoint**: User Story 1 complete and independently testable.

---

## Phase 5: User Story 2 — Header navigation (Priority: P1)

**Goal**: Header renders Logo + 3 nav links (active = "About SAA 2025") + notification bell + language chip + profile button. Clicks route correctly. The selected-link treatment derives from `currentPath` (FR-019).

**Independent Test**: Signed in on `/`. Click logo → scroll to top. Click each nav link → correct destination. Hover non-active links → hover treatment. Click language chip → dropdown opens (existing component). Click profile → user menu opens.

- [ ] T026 [US2] Write failing unit tests for `NavLinks` — three links render; link matching `currentPath` has `aria-current="page"` and the others don't (FR-019). Snapshot the order | tests/unit/components/home/NavLinks.test.tsx
- [ ] T027 [P] [US2] Write failing unit tests for the extended `Header` — (a) slim variant: pass only `locale` + `isAuthenticated`, assert Logo + LanguageSelector render, no nav/notification/profileMenu DOM; (b) full variant: pass all four slot props, assert each slot's content renders in source order; (c) Login regression: snapshot the slim variant DOM | tests/unit/components/header/Header.test.tsx
- [ ] T028 [US2] **Modify `Logo`** — add optional `href?: string` prop. When set, wrap the `<Image>` in a `<Link href={href}>`; when unset, return the existing parameterless render (Login regression guard) | src/components/header/Logo.tsx
- [ ] T029 [US2] **Extend `Header`** with optional slot props `nav?: ReactNode`, `notification?: ReactNode`, `profileMenu?: ReactNode`, `currentPath?: string`. Default each to undefined/null. Layout: Logo left, optional `nav` center, slot stack right (notification + LanguageSelector + profileMenu). Login keeps slim variant by passing only `locale` + `isAuthenticated` | src/components/header/Header.tsx
- [ ] T030 [US2] Implement `NavLinks` (server component) — renders three links to `/`, `/awards`, `/sun-kudos` with `aria-current` derived from `currentPath` (FR-019). Will be reused in the footer with the additional `7.5` link | src/components/home/NavLinks.tsx
- [ ] T031 [US2] Wire `<Header nav={<NavLinks currentPath="/" />} ... />` into [app/page.tsx](app/page.tsx) above `<Hero />`. The notification + profileMenu slots will be added in Phases 11/12; for now pass `null` placeholders | app/page.tsx
- [ ] T032 [US2] Cross-screen regression: re-run the existing Login E2E (`tests/e2e/login/*`). Slim Header variant has not changed; all Login tests MUST stay green | (no file change — verification only)

**Checkpoint**: User Story 2 complete. Header is mounted with the correct structural shape; notification + profile slots will fill in Phases 11/12.

---

## Phase 6: User Story 3 — Awards grid + deep-link navigation (Priority: P1)

**Goal**: Six award cards render in a 3-col / 2-col responsive grid. Each card is a single anchor to `/awards#<slug>`. Clicking title / image / "Chi tiết" all trigger the same navigation.

**Independent Test**: Signed in on `/`. Scroll to awards section. Verify 6 cards visible (Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 — Creator, MVP). Click any card's image, title, or button → URL becomes `/awards#<slug>` for that card.

- [ ] T033 [US3] Write failing unit tests for `AwardCard` — card href is `/awards#<slug>`; clicking the wrapper anchor produces the same navigation as clicking the title or "Chi tiết" button (single accessible link); description has `line-clamp-2` Tailwind utility (FR-013); thumbnail renders with the slug-derived asset path | tests/unit/components/home/AwardCard.test.tsx
- [ ] T034 [P] [US3] Write failing E2E covering FR-012 + SC-003 — click the Top Talent card → URL `/awards#top-talent`; repeat for MVP card → URL `/awards#mvp` | tests/e2e/home/awards-deep-link.spec.ts
- [ ] T035 [US3] Implement `AwardCard` (server component) — single `<Link href={`/awards#${slug}`}>` wrapping image + title + description + "Chi tiết". Description uses `line-clamp-2`. Title and "Chi tiết" are inside the same anchor (no nested `<a>`) | src/components/home/AwardCard.tsx
- [ ] T036 [US3] Implement `AwardsGrid` (server component) — maps the static `AWARDS` config to `<AwardCard />` instances in a Tailwind responsive grid (`grid grid-cols-2 lg:grid-cols-3` or values resolved during T001) | src/components/home/AwardsGrid.tsx
- [ ] T037 [P] [US3] Implement `AwardsSectionHeader` (server component) — wraps `C1` caption + H1 + supporting copy from i18n. Static, non-interactive | src/components/home/AwardsSectionHeader.tsx
- [ ] T038 [US3] Wire `<AwardsSectionHeader />` and `<AwardsGrid />` into [app/page.tsx](app/page.tsx) below the hero/event-info block | app/page.tsx

**Checkpoint**: User Story 3 complete. The MVP-critical deep-link path is testable end-to-end.

---

## Phase 7: User Story 4 — Locale switch on Homepage (Priority: P1)

**Goal**: User clicks the language chip → switches `vi-VN` ↔ `en-US`. All localized strings (hero, nav, awards, footer) re-render in the chosen language; cookie persists across reload.

**Independent Test**: Signed in on `/`, current locale `vi-VN`. Click chip, click `EN`. Verify hero title, "Coming soon", nav labels, an award title, and footer copyright all switch to English. Reload — `EN` persists.

- [ ] T039 [US4] Write failing E2E that mirrors the Login `language-switch.spec.ts` pattern — open `/` (signed-in), flip locale to EN, assert hero title + a nav label + an award title + footer copyright all switched. Reload — cookie persists, copy still EN | tests/e2e/home/language-switch.spec.ts
- [ ] T040 [US4] Mount the existing `LanguageSelector` inside the new Header's right-hand slot stack (already wired structurally via Header's slot prop in T031; this task confirms the actual `LanguageSelector` is passed as the `notification`-adjacent slot). No new component code | app/page.tsx
- [ ] T041 [US4] Run the existing LanguageSelector unit suite (`tests/unit/components/header/LanguageSelector.test.tsx`) — MUST pass without edits. The component's behavior contract has not changed | (no file change — verification only)

**Checkpoint**: User Story 4 complete via reuse alone — no new component code.

---

## Phase 8: User Story 5 — Sun* Kudos block (Priority: P2)

**Goal**: A promo block introducing Sun* Kudos with label + title + description + illustration + "Chi tiết" button → `/sun-kudos`.

**Independent Test**: Scroll to the Kudos block. Verify all five elements render. Click "Chi tiết" → navigate to `/sun-kudos`.

- [ ] T042 [US5] Write failing unit tests for `KudosBlock` — renders label, title, description, illustration `<img>`, and "Chi tiết" button with `href="/sun-kudos"` | tests/unit/components/home/KudosBlock.test.tsx
- [ ] T043 [US5] Implement `KudosBlock` (server component) — static promo block with a single `<Link href="/sun-kudos">` for the "Chi tiết" button; copy from i18n; illustration from `public/assets/home/` | src/components/home/KudosBlock.tsx
- [ ] T044 [US5] Wire `<KudosBlock />` into [app/page.tsx](app/page.tsx) below the awards grid | app/page.tsx

**Checkpoint**: User Story 5 complete.

---

## Phase 9: User Story 6 — Footer (Priority: P2)

**Goal**: Footer with logo + 4 nav links (About / Awards / Sun* Kudos / Tiêu chuẩn chung → `/general-rules`) + copyright. Logo + footer-nav links mirror header behavior.

**Independent Test**: Scroll to footer. Verify logo, four links, copyright string. Click each link → correct destination (`/`, `/awards`, `/sun-kudos`, `/general-rules`).

- [ ] T045 [US6] Write failing unit tests for `Footer` — all five footer links render with correct hrefs (`/` for logo + About, `/awards`, `/sun-kudos`, `/general-rules`); copyright string from i18n | tests/unit/components/home/Footer.test.tsx
- [ ] T046 [US6] Implement `Footer` (server component) — reuses `Logo` (with `href="/"`) + `NavLinks` (passing the same `currentPath` so the active state matches the header) + adds the `7.5` "Tiêu chuẩn chung" link to `/general-rules` + copyright | src/components/home/Footer.tsx
- [ ] T047 [US6] Wire `<Footer />` into [app/page.tsx](app/page.tsx) at the bottom | app/page.tsx

**Checkpoint**: User Story 6 complete.

---

## Phase 10: User Story 7 — Floating quick-action button (Priority: P2)

**Goal**: A FAB anchored bottom-right of the viewport. Click → opens a placeholder quick-action menu (real menu contents deferred to its own spec).

**Independent Test**: Scroll the page. Verify the FAB stays anchored bottom-right at all scroll positions. Click → menu opens. Click outside → menu closes.

- [ ] T048 [US7] Write failing unit tests for `WidgetButton` — click toggles open state; menu items render (placeholder); click outside closes; FAB is positioned `fixed bottom-X right-X` (Tailwind classes verified by `toHaveClass`) | tests/unit/components/home/WidgetButton.test.tsx
- [ ] T049 [US7] Implement `WidgetButton` (`"use client"`) — anchored FAB with `useState({ isOpen })` toggling a placeholder menu listing "Write Kudos" / "Read general rules" entries (their target routes are deferred to their own specs) | src/components/home/WidgetButton.tsx
- [ ] T050 [US7] Wire `<WidgetButton />` into [app/page.tsx](app/page.tsx) — placement after the rest of the page content; CSS handles the floating anchor | app/page.tsx

**Checkpoint**: User Story 7 complete.

---

## Phase 11: User Story 8 — Notification bell + badge + toast (Priority: P2)

**Goal**: Bell icon in the header (right-stack slot). Shows an unread indicator iff `unreadCount > 0`. Click → "Coming soon" toast (Q6 resolution). Backed by a stub `GET /api/notifications/unread-count` route that returns `{ unreadCount: 0 }` and 401 if unauthenticated.

**Independent Test**: Signed-in user with 0 unread → bell renders, no indicator. Click → toast appears with localized text. Authenticated `GET /api/notifications/unread-count` returns 200 + `{ unreadCount: 0 }`. Anon GET → 401.

- [ ] T051 [US8] Write failing unit tests for `NotificationBell` — renders the bell + ARIA label; `unreadCount > 0` shows the indicator; `unreadCount === 0` hides it; click invokes mocked `toast()` with the localized "Coming soon" key | tests/unit/components/home/NotificationBell.test.tsx
- [ ] T052 [P] [US8] Write failing integration tests for the new notifications route — anon GET → 401 (no leak); authenticated GET → 200 + `{ unreadCount: 0 }` (stub) | tests/integration/home/notifications-route.test.ts
- [ ] T053 [P] [US8] Write failing E2E — sign-in, click the bell, assert the toast appears with the localized "Coming soon" string | tests/e2e/home/notification-bell.spec.ts
- [ ] T054 [US8] Implement `notification-repository.ts` (v1 stub returns `0`) + `notification-service.ts` (`getUnreadCount(userId)`) | src/repositories/notification-repository.ts, src/services/notification-service.ts
- [ ] T055 [US8] Implement the route handler `GET /api/notifications/unread-count` — returns 401 if `auth()` is null, else returns `{ unreadCount: 0 }` via the service. Returns `Cache-Control: no-store` | app/api/notifications/unread-count/route.ts
- [ ] T056 [US8] Implement `NotificationBell` (`"use client"`) — receives `unreadCount` as a prop; renders bell + indicator + `aria-label`; click → `toast(t("home.notification.toast.coming_soon", locale))` | src/components/home/NotificationBell.tsx
- [ ] T057 [US8] Wire `<NotificationBell unreadCount={...} />` into the Header's `notification` slot in [app/page.tsx](app/page.tsx). Server-side fetch the unread count via the new route in a try/catch; on failure render with `unreadCount={0}` (FR-018 graceful degradation) | app/page.tsx

**Checkpoint**: User Story 8 complete.

---

## Phase 12: User Story 9 — Root Further essay (Priority: P3)

**Goal**: Three-paragraph theme essay + pull-quote, all from i18n. Static, non-interactive, responsive.

**Independent Test**: Scroll below the hero. Verify three paragraphs + the pull-quote render in the active locale. Switch locale → essay re-renders in EN.

- [ ] T058 [US9] Write failing unit tests for `RootFurtherEssay` — renders three paragraphs + pull-quote from i18n catalog; non-interactive (no click handlers, no cursor pointer style assertions) | tests/unit/components/home/RootFurtherEssay.test.tsx
- [ ] T059 [US9] Implement `RootFurtherEssay` (server component) — static block from i18n | src/components/home/RootFurtherEssay.tsx
- [ ] T060 [US9] Wire `<RootFurtherEssay />` into [app/page.tsx](app/page.tsx) below the event-info block | app/page.tsx

**Checkpoint**: User Story 9 complete.

---

## Phase 13: Polish, ProfileButton, CTAs, Cross-doc Sync, Verification

**Purpose**: Components that don't have a user-story phase of their own (CTAButtons, ProfileButton — both supplementary), final wiring of the full page composition, doc sync, and the standard verification gates.

### ProfileButton (PQ1 = b — user-only variant)

- [ ] T061 Write failing unit tests for `ProfileButton` — renders Profile + Sign out menu items for the user variant; click toggles open state; click outside closes. Admin variant is out-of-scope per PQ1 = b — covered in the schema follow-up | tests/unit/components/home/ProfileButton.test.tsx
- [ ] T062 Implement `ProfileButton` (`"use client"`) — receives `name` + `image` as props; renders avatar + placeholder menu (Profile + Sign out). Click outside closes the menu | src/components/home/ProfileButton.tsx
- [ ] T063 Wire `<ProfileButton name={...} image={...} />` into the Header's `profileMenu` slot in [app/page.tsx](app/page.tsx) using `auth()` session fields | app/page.tsx

### CTAButtons

- [ ] T064 [P] Write failing unit tests for `CTAButtons` — two anchors with hrefs `/awards` (ABOUT AWARDS) and `/sun-kudos` (ABOUT KUDOS); each respects `prefers-reduced-motion` for hover transitions (`motion-safe:` Tailwind variant present) | tests/unit/components/home/CTAButtons.test.tsx
- [ ] T065 [P] Implement `CTAButtons` (server component) — two `<Link>`s with the FR-010 destinations | src/components/home/CTAButtons.tsx
- [ ] T066 Wire `<CTAButtons />` into [app/page.tsx](app/page.tsx) below the event-info block (and above the Root Further essay) | app/page.tsx

### Cross-doc Sync

- [ ] T067 [P] Update SCREENFLOW.md — flip Homepage SAA "Detail File" cell to point at `specs/i87tDx10uM-homepage-saa/spec.md` (currently set), add a Discovery Log entry dated 2026-05-07 noting the implementation has shipped + reuses Header/LanguageSelector/Logo + introduces Toaster primitive | .momorph/SCREENFLOW.md

### Verification

- [ ] T068 [P] Run `npm run test` (full Vitest suite). All unit + integration tests MUST pass. Behavioral tests MUST pass without edits — a behavioral failure means a regression | (no file change — verification)
- [ ] T069 [P] Run `npm run test:e2e` (full Playwright suite). All Homepage E2E specs (auth-redirect, awards-deep-link, language-switch, notification-bell) MUST pass + Login E2E suite MUST stay green | (no file change — verification)
- [ ] T070 [P] Run `npm run lint` — MUST be clean | (no file change — verification)
- [ ] T071 [P] Run `npx tsc --noEmit` — MUST be clean | (no file change — verification)
- [ ] T072 Capture Playwright screenshots of `/` (signed-in) at desktop + tablet + mobile viewports; compare side-by-side to `get_frame_image(screenId=i87tDx10uM)`. Save to `.momorph/specs/i87tDx10uM-homepage-saa/assets/`. Iterate up to 3 times per `momorph.implement-ui` until the visual diff is acceptable | (no file change — verification + screenshot capture)
- [ ] T073 Run `npm run build` — MUST succeed | (no file change — verification)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies. Start immediately.
- **Phase 2 (Foundation)**: Depends on Phase 1 (T001's findings drive T004's token additions, which in turn unblock all UI phases). Within Phase 2, T005-T012 can interleave; T013-T016 (Toaster) is mostly independent and can run in parallel.
- **Phase 3 (US0 — Auth gate)**: Depends on Phase 2 (specifically T011/T012 — the i18n keys for sign-in chrome are loaded at server-render). The auth gate is shipped; this phase is pure E2E verification.
- **Phase 4 (US1 — Hero/Countdown)**: Depends on Phase 2 (T005-T008 event config + T011/T012 i18n keys).
- **Phase 5 (US2 — Header)**: Depends on Phase 2 (i18n keys). Independent of Phase 4 — the two phases can run in parallel by different developers.
- **Phase 6 (US3 — Awards)**: Depends on Phase 2 (T009/T010 awards config + T011/T012 i18n).
- **Phase 7 (US4 — Locale switch)**: Depends on Phase 5 (Header must mount LanguageSelector first).
- **Phase 8 (US5 — Kudos)**, **Phase 9 (US6 — Footer)**, **Phase 10 (US7 — FAB)**, **Phase 12 (US9 — Essay)**: Depend on Phase 2 only. Can run in parallel.
- **Phase 11 (US8 — Notification)**: Depends on Phase 2 (Toaster) AND Phase 5 (Header slot must exist for the bell to mount).
- **Phase 13 (Polish)**: Depends on all prior phases. T067 (doc sync) can run as soon as Phase 12 lands; T068-T073 (gates) wait for the full implementation.

### Within Each User Story

- Tests first (per Constitution V — TDD): T### test file lands red BEFORE the corresponding T### code file lands green. Within a story, all `[P]` tasks (different files) can run together; sequential tasks must run in order.
- Component imports flow: `awards.ts` → `AwardCard.tsx` → `AwardsGrid.tsx` → `app/page.tsx`. `Logo.tsx` → `Header.tsx` → `app/page.tsx`. `toast.ts` → `Toaster.tsx` → `NotificationBell.tsx`.

### Parallel Opportunities

- **Phase 1**: T002 + T003 + T004 in parallel (different concerns: Figma read vs asset download vs token registration).
- **Phase 2**: T006 + T007 + T009 + T011 + T012 + T013 in parallel (different files, independent concerns).
- **Phase 4**: T020 (EventInfo test) + T022 (EventInfo impl) is its own track parallel to T019/T021/T023 (Countdown + Hero track).
- **Phase 5**: T026 (NavLinks test) + T027 (Header test) in parallel.
- **Phase 6**: T034 (E2E) + T037 (AwardsSectionHeader) in parallel with T033/T035/T036 (card track).
- **Phase 11**: T051/T052/T053 (three test files) in parallel; then T054/T056 sequential through service+component, T055 in parallel with T056 once the service exists.
- **Phase 13 verification**: T068 + T069 + T070 + T071 in parallel; T072 (visual diff) needs the dev server up; T073 (build) is independent.
- **Different user stories** can be worked on in parallel by different team members once Phase 2 completes.

---

## Implementation Strategy

### MVP First (Recommended)

1. Complete Phase 1 + Phase 2.
2. Complete Phase 3 (US0 — auth gate verification).
3. Complete Phase 4 (US1 — Hero + Countdown).
4. Complete Phase 5 (US2 — Header) — including LanguageSelector mount.
5. Complete Phase 6 (US3 — Awards grid).
6. Complete Phase 7 (US4 — Locale switch verification).
7. Run Phase 13 verification gates restricted to the P1 surface (T068 unit, T070 lint, T071 tsc, T073 build).
8. **STOP and validate**: anonymous redirect, hero countdown, header navigation, awards deep-link, locale switch all work. **Ship MVP.**

### Incremental Delivery (after MVP)

9. Add Phase 8 (US5 Kudos) → Test → Ship.
10. Add Phase 9 (US6 Footer) → Test → Ship.
11. Add Phase 10 (US7 FAB) → Test → Ship.
12. Add Phase 11 (US8 Notification + API stub) → Test → Ship.
13. Add Phase 12 (US9 Essay) → Test → Ship.
14. Run Phase 13 fully (all gates including E2E + visual diff). **Ship final.**

### Follow-up (out of scope for this plan)

- **PQ1 = b follow-up**: small PR adding `User.role` schema column + session-callback augmentation + ProfileButton admin variant + admin variant test. Resolves spec FR-005's admin branch and SC-006.
- Notification panel (replaces the Q6 toast stub).
- Profile dropdown overlays (`z4sCl3_Qtk` user / `54rekaCHG1` admin) — replace the placeholder ProfileButton menu.
- Quick-action menu contents (replaces the WidgetButton placeholder).

---

## Notes

- Commit after each logical group: e.g. one commit for Phase 1 (asset prep), one for Phase 2 (foundation), one per user story phase.
- Mark tasks complete as you go: `[x]`.
- The TDD order in each user story is non-negotiable for new behavior (Constitution V). Test files committed BEFORE code files; failing red → implementation → green.
- If T072 (visual diff) reveals a structural mismatch (e.g., header alignment off), re-query the relevant Figma section via `query_section` rather than guessing values.
- The Toaster primitive is small in-house code (Q6 resolution). If the team later adopts `sonner` or similar, swap is one file (`src/components/ui/Toaster.tsx`) — call sites depend only on the `toast()` helper signature.
- The notification API is a v1 stub returning 0. The endpoint shape is stable so the future panel implementation can replace the repository internals without touching the route handler or the UI.
- The auth gate at [app/page.tsx](app/page.tsx) is already shipped; if you find yourself touching that `redirect("/login")` call during Phase 3, stop — the test is failing for a different reason.
- Each `app/page.tsx` wiring task (T024, T031, T038, T040, T044, T047, T050, T057, T060, T063, T066) edits the same file. They MUST run sequentially. Consider folding them into one final wiring task per story rather than committing partial-page renders mid-PR.
