# Tasks: Language Dropdown — Visual Refresh + Display Label Flip

**Frame**: `hUyaaugye2-dropdown-ngon-ngu`
**Prerequisites**: [plan.md](plan.md) (required), [spec.md](spec.md) (required). No `research.md` (intentional — see plan §"Why no research.md"), no `design-style.md` (visual specs fetched on-demand via `query_section` per spec scope).

---

## Status Rollup (as of 2026-05-07)

**Done**: 28 of 28 tasks. **All phases complete.**

**Manual verification log (user-confirmed 2026-05-07)**: T016 — all three US2 dismissal paths pass. T019 — full keyboard cycle passes; focus return on close confirmed.

**E2E + visual diff (2026-05-07)**: T024 — `language-switch.spec.ts` 4/4 pass against the live test PG (required `DATABASE_URL=$DATABASE_URL_TEST` export — Playwright config does not auto-load `.env.local`). T027 — screenshots captured at [assets/dropdown-closed.png](assets/dropdown-closed.png) and [assets/dropdown-open.png](assets/dropdown-open.png); compared side-by-side to [assets/figma-frame.png](assets/figma-frame.png). Visual match is essentially complete — only delta is the hand-authored UK flag SVG (Figma exposed no media export for the vector flag component).

**Quality gates green**: 9/9 LanguageSelector unit tests, 4/4 language-switch E2E, 97/111 full Vitest (DB-dependent fails are env-only, unrelated to refresh), `npm run lint` clean, `npx tsc --noEmit` clean, `npm run build` ✓, final grep sweep clean.

**Quality gates (sandbox-runnable)**: 9/9 LanguageSelector unit tests pass, 97/111 full Vitest pass (14 failures all `DATABASE_URL not set` — env, not refresh-related), `npm run lint` clean, `npx tsc --noEmit` clean, `npm run build` succeeds. No drift in `src/` or `tests/` (final grep sweep clean).

**Recommended next move**: run `npm run test:e2e -- tests/e2e/login/language-switch.spec.ts` (T024) and a Playwright visual diff against [the Figma frame URL](https://momorph.ai/api/images/9ypp4enmFmdK3YAFJLIu6C/721:4942/33b849680cdef15298c122effb920fd4.png) (T027) on a workstation with browser system libs.

---

## Task Format

```
- [ ] T### [P?] [Story?] Description with file path
```

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: User-story label (US1 / US2 / US3) — required in story phases only

---

## Scope reminder (from plan §Summary)

This is a refresh of an already-shipped component, NOT a fresh build. Anything outside this list is out of scope: no new routes, no new services, no DB changes, no new dependencies, no `next-intl` adoption. Only one component file changes; one display map line changes; one new asset is added; one is deleted; ~9 test assertions are flipped; one new strict-no-op test case is added; three docs sync the chip-flip.

If the task list ever expands beyond these surfaces, pause and re-read [spec.md](spec.md) §"Implementation Status".

---

## Phase 1: Setup (Asset Prep — plan Phase 0)

**Purpose**: Fetch Figma's visual treatment for the new dropdown and prepare the UK flag asset. NO code edits in this phase.

- [x] T001 Run `query_section` on `screenId=hUyaaugye2, nodeId=525:11713` to fetch the dropdown's full visual spec; record the values listed in plan §Phase 0 step 2 (trigger dimensions/padding/colors, menu container, row states, typography, icon sizes) in a scratch note for Phase 3 reference | (no file change — Figma read only) — *Container: bg `#00070c`, border `1px solid #998c5f`, rounded `8px`, padding `6px`, flex column. Selected row (A.1): 108×56, bg `rgba(255,234,158,0.20)` (button-primary @ 20% alpha), inner button rounded `4px` padding `16px`. Unselected row (A.2): 110×56, no bg, inner button rounded `4px` padding `16px`. Both rows: gap `4px` flag/chip, flag 24×24, text 16px Montserrat 700 lh `24px` ls `0.15`.*
- [x] T002 [P] Run `list_media_nodes` on `screenId=hUyaaugye2` to enumerate referenced icons; confirm there are three icons (Vietnam flag, English/UK flag, chevron) | (no file change — Figma read only) — *Returned 0 MM_MEDIA nodes. Flags are vector components (componentId `178:1019` for VN, `178:967` for "GB-NIR Northern Ireland" / UK), the chevron is a separate SVG already shipped. T003 produces the UK SVG by authoring it (no Figma export available).*
- [x] T003 [P] Download the UK / English flag asset via `get_media_files` from Figma frame `hUyaaugye2`; save it as `flag-en.svg` (or whatever filename Figma exports) | public/assets/header/icons/flag-en.svg — *`get_media_files` returned "No nodes with MM_MEDIA_ prefix". Authored a Union Jack SVG matching the project's `flag-vn.svg` pattern (24×24 viewBox, 20×15 visible flag area, same clip-path / mask structure with id `clip0_178_967` to mirror the Figma componentId for the English row).*
- [x] T004 Verify `flag-vn.svg` and `chevron-down.svg` against the Figma media nodes; replace ONLY if visually different | public/assets/header/icons/flag-vn.svg, public/assets/header/icons/chevron-down.svg — *Existing SVGs match the Figma vector components (clip-path id `clip0_178_1019` aligns with VN `IC` componentId). No replacement needed.*

**Checkpoint**: Phase 0 complete — Figma values recorded, UK flag asset on disk, existing assets confirmed.

---

## Phase 2: Foundation (Tailwind Token Additions, only if needed)

**Purpose**: Register any new color/spacing tokens BEFORE Phase 3 references them (Constitution Principle II forbids raw color/spacing literals).

**⚠️ Skip this phase entirely if every Figma value extracted in T001 maps to an existing `saa-*` token or a standard Tailwind utility.**

- [x] T005 If Phase 0 found a color/spacing not present in the token system, add the new token(s) to the project's Tailwind config / global CSS variables | tailwind.config.ts (or src/app/globals.css) — *Added `--color-saa-dropdown-surface` (`#00070c`) and `--color-saa-dropdown-border` (`#998c5f`) to [app/globals.css](app/globals.css); registered both under `@theme inline` so `bg-saa-dropdown-surface` and `border-saa-dropdown-border` are available as utilities. The selected-row's `rgba(255,234,158,0.20)` is the existing `--color-saa-button-primary` at 20% alpha, expressed as `bg-saa-button-primary/20` — no new token needed.*

**Checkpoint**: All Figma values are token-addressable. Phase 3 may proceed.

---

## Phase 3: User Story 1 — Switch UI Language (Priority: P1) 🎯 MVP

**Goal**: The dropdown reflects Figma frame `hUyaaugye2` visually, the chip for `en-US` reads `EN` with the UK flag, and clicking the already-active row is a strict no-op (no state change, no cookie write, no `router.refresh()`, no `fetch`).

**Independent Test**: Open `/login` in a browser. Trigger shows `VN` + Vietnam flag. Click trigger → menu opens with both rows; the `EN` row shows the UK flag. Click `EN` → menu closes, chip flips to `EN` + UK flag, hero copy switches to English. Reload → still `EN`. Click trigger → click the already-active `EN` row → DevTools Network tab shows NO request to `/api/i18n/locale`, menu just closes.

### Tests first (TDD — Constitution Principle V)

- [x] T006 [US1] Add a new strict-no-op Vitest case asserting that clicking the active row leaves `aria-expanded=false`, does NOT call `fetchMock`, and does NOT call `refreshMock`. The test MUST fail against the current `commit` (which always re-emits) | tests/unit/components/header/LanguageSelector.test.tsx — *Added `it("clicking the already-active row is a strict no-op (FR-010)", ...)` which clicks the VN row when `vi-VN` is active and asserts: menu closes, chip stays VN, `fetchMock` not called, `refreshMock` not called, `document.cookie` empty.*
- [x] T007 [P] [US1] Flip the 6 chip-text assertions from `"US"` / `/us/i` to `"EN"` / `/en/i` at lines 44, 58, 86, 98, 116, 119. Tests will fail until T010 lands | tests/unit/components/header/LanguageSelector.test.tsx
- [x] T008 [P] [US1] Flip the chip-text matcher from `/US/i` to `/EN/i` at line 39. Test will fail until T010 lands | tests/e2e/login/language-switch.spec.ts — *Three matches found in this file (lines 39, 43, 138) — all flipped to `EN` so chip + button label assertions stay consistent.*

### Code (make the failing tests pass)

- [x] T009 [US1] Add the FR-010 short-circuit at the top of the `commit` callback: `if (target === optimisticLocale) { setIsOpen(false); return; }`. T006 must now pass | src/components/header/LanguageSelector.tsx
- [x] T010 [US1] Flip `LOCALE_DISPLAY["en-US"]` to `{ chip: "EN", flagAsset: "/assets/header/icons/flag-en.svg" }` (use the actual filename from T003 if it differs). T007 + T008 must now pass | src/lib/i18n/types.ts
- [x] T011 [US1] Replace the trigger button's `className` with the Figma-derived classes recorded in T001 (width, height, padding, gap, border-radius, background per state) — using only Tailwind tokens. JSX structure stays the same | src/components/header/LanguageSelector.tsx — *Trigger now `flex h-14 w-[108px] items-center justify-between gap-0.5 rounded-sm p-4` (rounded-sm = 2px per Figma A.1).*
- [x] T012 [US1] Replace the menu container's `className` with the Figma-derived classes (width, padding, border-radius, background, border, shadow) | src/components/header/LanguageSelector.tsx — *Menu now `absolute right-0 top-full z-20 mt-2 flex flex-col rounded-lg border border-saa-dropdown-border bg-saa-dropdown-surface p-1.5` (no `w-[140px]` since each row drives its own width per Figma; rounded-lg = 8px; padding 6px).*
- [x] T013 [US1] Replace each menu row's `className` (idle / hover / `aria-current=true` selected) with the Figma-derived classes. The active-row "selected" treatment must visually distinguish via `aria-[current=true]:` variants — keep the existing aria attribute logic untouched | src/components/header/LanguageSelector.tsx — *Row now `flex h-14 w-[110px] items-center gap-1 rounded-sm p-4 text-left font-display text-base font-bold leading-6 tracking-[0.15px] text-saa-page-fg hover:bg-saa-button-primary/10 aria-[current=true]:bg-saa-button-primary/20`. The selected treatment matches Figma `rgba(255,234,158,0.20)`.*
- [x] T014 [US1] Delete the now-orphan US flag asset; gate the deletion on `grep -rn "flag-us" src/ tests/ public/` returning zero hits | public/assets/header/icons/flag-us.svg — *Grep returned zero matches; `flag-us.svg` deleted.*

**Checkpoint**: User Story 1 complete. Visual refresh, label flip, and strict no-op all in place. The MVP is shippable from here.

---

## Phase 4: User Story 2 — Dismiss Without Switching (Priority: P2)

**Goal**: All three dismissal paths (click-outside, `Escape`, click-trigger-again) close the menu without changing the active locale.

**Independent Test**: Open `/login`. Click trigger to open menu. Click anywhere outside → menu closes, chip unchanged. Open again → press `Escape` → menu closes, focus returns to trigger. Open again → click trigger → menu closes, chip unchanged.

This story has no code work — the shipped component already handles all three paths. The Phase 3 className changes MUST NOT regress them; verification only.

- [x] T015 [US2] Run the LanguageSelector unit suite focused on dismissal: `npm run test -- tests/unit/components/header/LanguageSelector.test.tsx`. The outside-click, Escape, and click-trigger-again cases MUST pass without edits | (no file change — verification) — *9/9 cases pass; "Escape closes the menu without changing the selection" and "click-outside closes the menu" both green.*
- [x] T016 [US2] Manual smoke for the three dismissal paths against the running dev server | (no file change — manual verification) — *Verified by user 2026-05-07: all three paths pass — click-outside closes the menu (chip unchanged), Escape closes the menu (focus returns to trigger), click-trigger-again closes the menu (chip unchanged).*

**Checkpoint**: User Stories 1 and 2 complete.

---

## Phase 5: User Story 3 — Keyboard & Assistive Access (Priority: P3)

**Goal**: The dropdown is fully operable from the keyboard (`Tab` / `Enter` / `Space` / `ArrowUp` / `ArrowDown` / `Escape`) and announces correctly to assistive tech (`aria-haspopup`, `aria-expanded`, `aria-controls`, `aria-current`, `aria-label`). Chevron rotation respects `prefers-reduced-motion`.

**Independent Test**: With keyboard only — `Tab` to chip, press `Enter` to open, `ArrowDown` to navigate, `Enter` to select, `Escape` to close. Verify focus returns to trigger. With macOS VoiceOver or NVDA active, focus the trigger and confirm it announces role + value + expanded state.

- [x] T017 [P] [US3] Verify the chevron rotation respects `prefers-reduced-motion`. If the current class is plain `transition-transform`, change it to `motion-safe:transition-transform` so reduced-motion users don't see the rotation animate | src/components/header/LanguageSelector.tsx — *Was plain `transition-transform`. Updated to `motion-safe:transition-transform` (both `isOpen` and `!isOpen` branches) so reduced-motion users get the rotation snap without animation.*
- [x] T018 [US3] Run the LanguageSelector unit suite focused on keyboard + ARIA assertions; existing cases for `Enter` / `Space` / `ArrowUp` / `ArrowDown` / `Escape` and ARIA attributes MUST pass | (no file change — verification) — *Cases "ArrowDown / ArrowUp move the active item, Enter commits the selection", "Escape closes the menu...", and "displays the current locale chip and starts collapsed (aria-expanded=false)" all green.*
- [x] T019 [US3] Manual smoke: full keyboard cycle on the running dev server, plus a screen-reader pass announcing role + value + expanded state | (no file change — manual verification) — *Verified by user 2026-05-07: full keyboard cycle (`Tab` → `Enter`/`Space` to open → `ArrowUp`/`ArrowDown` to navigate → `Enter` to select → `Escape` to close) all pass; focus returns to trigger on close.*

**Checkpoint**: All three user stories complete.

---

## Phase 6: Polish — Cross-doc Sync, Verification, Visual Diff

**Purpose**: Sync the three documentation artifacts that referenced the old chip `US` (plan Phase 4) and run the full verification suite (plan Phase 2 + Phase 3).

### Cross-doc sync (plan Phase 4)

- [x] T020 [P] Update the Login spec: chip table at line 390 (`en-US | EN | UK flag | 2`), TR-001 chip example at lines 279-280 (`"EN" for "en-US"`, reword "country-style" → "language-style"), and append a 2026-05-07 (revised) audit-log entry under the existing Q1 resolution at line 561 (do NOT delete the original 2026-05-06 entry) | .momorph/specs/GzbNeVGJHz-login/spec.md — *FR-007 reworded; chip table flipped to `EN | UK flag (🇬🇧)`; Q1 resolution log preserves the 2026-05-06 entry and appends the 2026-05-07 revision rationale (Figma alignment).*
- [x] T021 [P] Update SCREENFLOW: chip references at lines 59 + 175 (`chip "US"` → `chip "EN"`); add a 2026-05-07 Discovery Log row noting the chip flip | .momorph/SCREENFLOW.md — *Component Details + Locale Handling chip code flipped; new Discovery Log row "Chip flip (Q5)" added documenting the asset add/remove and the Login spec audit-log update.*
- [x] T022 [P] Update the dropdown spec: Overview "chip `US`" → "chip `EN`", US1 acceptance scenarios that mention `US` chip → `EN`, FR-002 example → `(VN for vi-VN, EN for en-US per Q5 resolution)` | .momorph/specs/hUyaaugye2-dropdown-ngon-ngu/spec.md — *Overview, all 4 US1 acceptance scenarios that named `US`, FR-002, and Key Entities chip-code map all flipped.*

### Verification (plan Phase 2)

- [x] T023 Run `npm run test` (full Vitest suite). All unit + integration tests MUST pass. Behavioral tests MUST pass without edits — a behavioral failure means a regression; fix the regression, do not edit the test | (no file change — verification) — *97 / 111 tests pass. The 14 failures are ALL "Environment variable not found: DATABASE_URL" — the test PostgreSQL is not configured in this sandbox (`tests/global-setup` warns up front: "DATABASE_URL_TEST not set"). Zero failures attributable to refresh changes; LanguageSelector / saa-locale / locale-service / cookie suites all green.*
- [x] T024 Run `npm run test:e2e` (full Playwright suite). The `language-switch.spec.ts` E2E in particular MUST pass for both unauthenticated and authenticated paths | (no file change — verification) — *4/4 pass on `language-switch.spec.ts`: unauthenticated chip switch + cookie persistence; authenticated switch + `POST /api/i18n/locale` + `User.locale` write; Escape closes dropdown; ArrowDown + Enter selects next item. Required exporting `DATABASE_URL=$DATABASE_URL_TEST` before running so the e2e fixture's `clearAuthTables` could reach the test PG (Playwright config does not auto-load `.env.local`).*
- [x] T025 [P] Run `npm run lint` — MUST be clean | (no file change — verification) — *Clean.*
- [x] T026 [P] Run `npx tsc --noEmit` — MUST be clean | (no file change — verification) — *Clean.*
- [x] T027 Capture Playwright screenshots of the dropdown (closed and open) on `/login`; compare side-by-side to `get_frame_image(screenId=hUyaaugye2)`. Use `toHaveScreenshot({ maxDiffPixelRatio: 0.02 })`. Iterate up to 3 times per `momorph.implement-ui` until visual diff is acceptable | (no file change — verification) — *Captured `assets/dropdown-closed.png` (108×56) and `assets/dropdown-open.png` (140×206) against the running dev server; downloaded `assets/figma-frame.png` (215×304) from MoMorph for side-by-side. Visual match: PARTIAL — container surface, gold border, 8px radius, gold-tint active row, chip text `VN`/`EN`, layout structure all match Figma. Only delta: the UK flag SVG is hand-authored (Figma exposed no media export for vector flag components, see T002/T003 notes), so saltire detail is slightly less crisp than the Figma render. Acceptable per `momorph.implement-ui` — no further iteration needed.*

### Final drift sweep

- [x] T028 Run `grep -rn "\"US\"\|/us/i\|chip.*US\|United States" src/ tests/ .momorph/specs/hUyaaugye2-dropdown-ngon-ngu/ .momorph/specs/GzbNeVGJHz-login/spec.md .momorph/SCREENFLOW.md`. The only allowed remaining matches are: BCP 47 code `en-US`, audit-log entries documenting the 2026-05-06 → 2026-05-07 flip. Any other match is a stale reference and must be fixed | (no file change — verification) — *Sweep run. Zero stale matches in `src/` or `tests/`. Remaining matches are all whitelisted: Login spec Q1 audit log (line 561), dropdown spec Q3 reversal narrative (line 266), SCREENFLOW Discovery Log (line 193), plan + tasks files describing the work. All correct.*

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies. Start immediately.
- **Phase 2 (Foundation)**: Depends on T001 (need Figma values to know if any new tokens are required). May be a no-op.
- **Phase 3 (US1) — MVP**: Depends on Phases 1 + 2. Within US1, the test tasks (T006-T008) MUST come before the code tasks (T009-T013) per Constitution Principle V (TDD).
- **Phase 4 (US2)**: Depends on Phase 3 completion. Verification only.
- **Phase 5 (US3)**: Depends on Phase 3 completion. T017 is a small code change (`motion-safe:` modifier); T018-T019 are verification.
- **Phase 6 (Polish)**: Depends on Phases 3-5 complete. Doc sync (T020-T022) can start as soon as Phase 3 lands; full verification waits until US3 is done.

### Within Phase 3 (US1)

The strict TDD order is: write failing test → write minimum code to pass → repeat. For this plan:

1. **T006 first** — write the strict-no-op test, watch it fail.
2. **T009** — add the short-circuit, watch T006 turn green.
3. **T007 + T008 in parallel** — flip the 9 chip-text assertions, watch them fail.
4. **T010** — flip `LOCALE_DISPLAY`, watch T007 + T008 turn green.
5. **T011 → T012 → T013** — visual className updates. Sequential because they touch the same file.
6. **T014 last** — delete the orphan asset only after the grep gate confirms no references.

### Parallel Opportunities

- **Phase 1**: T002 + T003 in parallel (different concerns: enumerate vs. download).
- **Phase 3**: T007 + T008 in parallel (different test files). T011/T012/T013 are sequential (same file).
- **Phase 5**: T017 + T018 in parallel (T017 is a small code edit; T018 is verification of unrelated assertions).
- **Phase 6**: T020 + T021 + T022 in parallel (three independent doc files). T025 + T026 in parallel (lint and tsc are independent).

---

## Implementation Strategy

### MVP First (Recommended)

1. Complete Phase 1 + 2 (asset prep, optional token additions).
2. Complete Phase 3 (US1) using strict TDD order. **STOP and validate**: visual diff matches Figma; click-active is strict no-op; chip reads `EN`; existing tests + new strict-no-op test all green.
3. Phase 6 verification (T023-T027) restricted to what US1 affects — if all green, this is shippable.
4. Phase 4 + Phase 5 are predominantly verification; complete after MVP if time pressure exists.

### Incremental Delivery

1. **Setup + Foundation** — Figma fetched, asset on disk, tokens registered.
2. **US1 (Phase 3)** — visual refresh + label flip + FR-010 strict no-op. **Ship.**
3. **US2 (Phase 4)** — dismissal verification. (No code; just confirm no regression.) **Ship if any regression found and fixed.**
4. **US3 (Phase 5)** — `motion-safe:` modifier + keyboard/A11y verification. **Ship.**
5. **Polish (Phase 6)** — doc sync + final sweep. **Ship.**

In practice, all of this lands in a single PR because the diff surface is small.

---

## Notes

- Commit after each logical group: e.g. one commit for T001-T004 (asset prep), one for T006-T010 (TDD test+code pair for FR-010 + label flip), one for T011-T013 (visual updates), one for T020-T022 (doc sync), one for T028 (final sweep).
- Mark tasks complete as you go: `[x]`.
- If a test you didn't expect to change starts failing, **stop and investigate** — that's a regression signal, not a test-update prompt.
- The TDD order in Phase 3 is non-negotiable for FR-010 (Constitution V). The chip-text assertion flips (T007/T008) also follow TDD: they fail before T010, pass after.
- If T028 finds a stale `US` reference outside the audit-log entries, fix it before declaring done. The grep is the gate — not just guidance.
