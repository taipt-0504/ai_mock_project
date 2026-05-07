# Implementation Plan: Language Dropdown — Visual Refresh

**Frame**: `hUyaaugye2-dropdown-ngon-ngu`
**Date**: 2026-05-07
**Spec**: `.momorph/specs/hUyaaugye2-dropdown-ngon-ngu/spec.md` (Status: **Ready for Plan — UI refresh only**)
**Constitution**: `.momorph/constitution.md` (v1.1.1)
**SCREENFLOW**: `.momorph/SCREENFLOW.md` (component `C1`, drift-synced 2026-05-07)

---

## Summary

This plan executes a **UI refresh + display-label flip + small behavioral tightening** on the already-shipped language dropdown. Logic, persistence, API, the database column, accessibility, and broad test coverage were delivered with the Login feature (commit `8c0022f`). What this plan adds:

1. **Visual refresh** of the dropdown per Figma frame `hUyaaugye2` (Tailwind classes on the trigger and menu).
2. **FR-010 strict no-op** — small `commit` short-circuit so clicking the already-active row dispatches nothing (Q4 resolution, Phase 1 step 5).
3. **Display label flip** — `LOCALE_DISPLAY["en-US"].chip` from `"US"` → `"EN"`, flag asset from US → UK (Q5 resolution, Phase 1.5).
4. **Cross-doc sync** — Login spec, SCREENFLOW, dropdown spec updated to reflect the chip/flag flip (Phase 4).

There are NO new routes, NO new services, NO database schema changes, NO new dependencies. One asset is added (UK flag SVG) and one is deleted (`flag-us.svg`). Source-file deltas are limited to className strings, a 5-line `commit` short-circuit, and a single line in `LOCALE_DISPLAY`. If the planner finds themselves writing a new component, route handler, service, or repository method, they have left the agreed scope and should pause to re-read the spec's "Implementation Status" section.

---

## Technical Context

**Language/Framework**: TypeScript 5 (strict) / Next.js 16.2.4 (App Router) — unchanged.
**Primary Dependencies**: React 19, Tailwind CSS v4 — unchanged. No new packages.
**Database**: PostgreSQL via Prisma — no schema change.
**Testing**: Vitest 4 (unit) + Playwright 1.59 (E2E) — existing suites cover this component.
**State Management**: Local React state inside `LanguageSelector.tsx` — unchanged.
**API Style**: `POST /api/i18n/locale` — unchanged.
**Design source**: Figma file `9ypp4enmFmdK3YAFJLIu6C`, frame `hUyaaugye2` (last edited 2026-01-30). Visual properties fetched at implementation time via `query_section` per Node ID.

---

## Constitution Compliance Check

*GATE: Must pass before implementation. Each item maps to a principle in `.momorph/constitution.md` (v1.1.1).*

- [x] **Principle I — Clean Code & Readable Structure**: no new files; existing component follows kebab-case for modules, PascalCase for the component file (`LanguageSelector.tsx`); single responsibility preserved.
- [x] **Principle II — Stack Best Practices**: no business logic moves; existing route handler stays layered (`route.ts → locale-service.ts → user-repository.ts`); no `any`; Tailwind tokens only — the refresh MUST use existing tokens (`saa-page`, `saa-page-fg`, `saa-divider`, `saa-header-overlay`, etc. from [tailwind config](tailwind.config.ts) / globals) and define new tokens only if Figma introduces a color/spacing not yet in the system.
- [x] **Principle III — Platform-Appropriate UI Patterns**: existing component already responsive (≥ 360 px) and WCAG 2.1 AA-compliant for keyboard / focus / ARIA. The refresh MUST preserve every ARIA attribute (`role="menu"`, `role="menuitem"`, `aria-haspopup`, `aria-expanded`, `aria-controls`, `aria-current`, `aria-label`) and the `prefers-reduced-motion` story (the chevron rotates with `transition-transform` — verify that respects the media query, add `motion-safe:` modifier if missing).
- [x] **Principle IV — OWASP Secure Coding**: no change to trust boundaries. Cookie attributes (`SameSite=Lax`, `HttpOnly=false`, `Secure` in prod, `Path=/`, 1y `max-age`) are unchanged; allowlist enforcement via `isSupportedLocale` is unchanged; the API still returns 401 / 400 / 204 with no error-leak. Threat model is unchanged from the Login plan.
- [x] **Principle V — Test-Driven Development**: behavior FRs are already covered by existing tests (see Test Strategy below). Visual refresh adds no new FRs that need failing tests first; we instead **assert that no existing test regresses** and add a Playwright pixel/visual diff against Figma as the acceptance gate.

**Threat model summary** *(Principle IV)*: unchanged from Login plan. The dropdown's only network call is `POST /api/i18n/locale` to a same-origin, session-gated endpoint. No new sensitive data, no new external integration.

**Violations**: none.

---

## Architecture Decisions

### Frontend Approach (no change, restated for clarity)

- **Component Structure**: single client component, [src/components/header/LanguageSelector.tsx](src/components/header/LanguageSelector.tsx). Mounted via [src/components/header/Header.tsx](src/components/header/Header.tsx). NOT split into atoms/molecules — it is a self-contained menu component, ~210 lines, well within Principle I's "small enough to read in one sitting" target.
- **Styling Strategy**: Tailwind CSS v4 utilities only. No CSS Modules, no inline `style={}`. The refresh MUST pull Figma values into existing Tailwind tokens; if a new color/spacing is genuinely required, register it in the project's Tailwind config / global CSS variables FIRST and reference it via the token, never as a raw literal.
- **Data Fetching**: direct `fetch` to `/api/i18n/locale` for authenticated persistence; client-side cookie write for immediate UX. Optimistic update with revert-on-failure already implemented and tested.

### Backend Approach (no change)

- **API Design**: `POST /api/i18n/locale` returning 401 / 400 / 204 — already in production.
- **Data Access**: route handler → `localeService.setLocale(userId, locale)` → `userRepository.updateLocale(userId, locale)` — already in production.
- **Validation**: zod schema in the route handler (`bodySchema` with `isSupportedLocale` refinement) — already in production.

### Integration Points

- **Existing module**: [src/lib/i18n/types.ts](src/lib/i18n/types.ts) (`LOCALE_DISPLAY`, `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`). Phase 1.5 flips `LOCALE_DISPLAY["en-US"].chip` from `"US"` → `"EN"` and updates `flagAsset` (Q5). The `vi-VN` row's chip stays `"VN"`. `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, and `isSupportedLocale` are NOT touched.
- **Existing module**: [src/lib/cookies/saa-locale.ts](src/lib/cookies/saa-locale.ts). Untouched.
- **Existing route**: [app/api/i18n/locale/route.ts](app/api/i18n/locale/route.ts). Untouched.
- **Existing component**: [src/components/header/Header.tsx](src/components/header/Header.tsx). May need a className tweak only if the new design changes how the dropdown sits in the header's layout.

---

## Project Structure

### Documentation (this feature)

```text
.momorph/specs/hUyaaugye2-dropdown-ngon-ngu/
├── spec.md          # Feature specification (UI-refresh framing)
├── plan.md          # This file
├── tasks.md         # Generated next by /momorph.tasks
└── research.md      # NOT created — see "Why no research.md" below
```

### Source Code (affected files)

| File                                                                                                        | Expected change                                                                                                              | Risk |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---- |
| [src/components/header/LanguageSelector.tsx](src/components/header/LanguageSelector.tsx)                    | Update `className` strings on the trigger and menu (Phase 1); add strict no-op short-circuit in `commit` (Phase 1, step 5)    | Low  |
| [src/lib/i18n/types.ts](src/lib/i18n/types.ts)                                                              | Flip `LOCALE_DISPLAY["en-US"]` chip from `"US"` → `"EN"` and `flagAsset` to the new UK flag path (Phase 1.5, Q5)              | Low  |
| `public/assets/header/icons/flag-en.svg` (new)                                                              | Download fresh from Figma in Phase 0                                                                                          | Low  |
| `public/assets/header/icons/flag-us.svg` (delete)                                                           | Remove after Phase 1.5 once nothing references it                                                                             | Low  |
| `public/assets/header/icons/flag-vn.svg`, `chevron-down.svg`                                                | Replace only if Figma ships new visuals (filenames stable)                                                                    | Low  |
| [src/components/header/Header.tsx](src/components/header/Header.tsx)                                        | Possibly minor wrapper-className tweak                                                                                        | Low  |
| [tests/unit/components/header/LanguageSelector.test.tsx](tests/unit/components/header/LanguageSelector.test.tsx) | Flip `"US"` / `/us/i` → `"EN"` / `/en/i` at lines 44, 58, 86, 98, 116, 119; add strict-no-op test (Phase 1 step 5)        | Low  |
| [tests/e2e/login/language-switch.spec.ts](tests/e2e/login/language-switch.spec.ts)                          | Flip `/US/i` → `/EN/i` at line 39                                                                                             | Low  |
| [.momorph/specs/GzbNeVGJHz-login/spec.md](.momorph/specs/GzbNeVGJHz-login/spec.md)                          | Update chip table + TR-001 + Q1 audit log per Phase 4                                                                         | Low  |
| [.momorph/SCREENFLOW.md](.momorph/SCREENFLOW.md)                                                            | Update chip references (lines 59, 175) + new Discovery Log row per Phase 4                                                    | Low  |
| [.momorph/specs/hUyaaugye2-dropdown-ngon-ngu/spec.md](.momorph/specs/hUyaaugye2-dropdown-ngon-ngu/spec.md)  | Flip Q3-resolution narrative + scenarios + FR-002 example per Phase 4                                                          | Low  |

### Untouched files (regression guards)

| File                                                                                                                  | Why untouched                                              |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [app/api/i18n/locale/route.ts](app/api/i18n/locale/route.ts)                                                          | API contract is stable; chip change is purely display      |
| [src/lib/cookies/saa-locale.ts](src/lib/cookies/saa-locale.ts)                                                        | Cookie attributes + allowlist enforcement unchanged        |
| [src/services/locale-service.ts](src/services/locale-service.ts)                                                      | Service contract is stable                                 |
| [prisma/schema.prisma](prisma/schema.prisma)                                                                          | `User.locale` already exists; locale code `en-US` unchanged |
| [src/lib/i18n/index.ts](src/lib/i18n/index.ts) and `src/lib/i18n/catalogs/*`                                          | Translation helper not in scope                            |
| `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, `isSupportedLocale` in [src/lib/i18n/types.ts](src/lib/i18n/types.ts)            | Only `LOCALE_DISPLAY` is touched (Phase 1.5); the allowlist + types stay |

### Dependencies

None. No `npm install`. If the planner believes a dependency is needed, that is a signal the work has slipped out of "UI refresh" scope — pause and reconcile with the spec.

---

## Implementation Strategy

### Phase 0 — Asset Preparation

1. Run `query_section` against `hUyaaugye2 / 525:11713` (whole dropdown) to fetch the new visual treatment in one call. Drill into `I525:11713;362:6085` and `I525:11713;362:6128` only if the parent query is thin.
2. From the Figma response, extract these specific values (do NOT extract anything else; raw color literals must be re-expressed as Tailwind tokens before they enter code):
   - **Trigger button** (`525:11713` → child wrapping flag + chip + chevron): width, height, padding, gap between leading icon group and trailing chevron, gap between flag and chip text, border-radius, background color (closed state), background color (open state, if different).
   - **Menu container**: width, padding, border-radius, background color, border color (if any), shadow.
   - **Menu rows** (`I525:11713;362:6085` and `I525:11713;362:6128`): row height, padding, gap between flag and chip text, background color (idle / hover / active-selected), text color (idle / hover / active-selected). Hover and active-selected may use the same treatment if the design overlaps them.
   - **Typography** for trigger chip and menu row chip: font family (likely the existing `font-display` token), font size, font weight, letter-spacing.
   - **Flag and chevron**: icon size (height + width), color (if monochrome) or asset path (if multi-color).
3. Run `list_media_nodes` on `hUyaaugye2` to enumerate referenced assets. Expect three icons: `flag-vn` (Vietnam, unchanged), `flag-en` or similar (UK / English flag — **NEW per Q5**), and the chevron.
   - **`flag-vn.svg`** and `chevron-down.svg` already exist at `public/assets/header/icons/`; replace only if the visual differs.
   - **English flag** must be downloaded fresh via `get_media_files` since the codebase currently ships `flag-us.svg` (which is now stale per Q5). Use the filename Figma exports (likely `flag-en.svg` or similar based on the `cờ Anh` annotation) and place it at `public/assets/header/icons/`.
   - **`flag-us.svg`** SHOULD be deleted in Phase 1.5 once nothing references it. Confirm zero references with `grep -r "flag-us" src/ tests/ public/` before deleting.
4. Map every extracted value to an existing Tailwind token before writing it. The relevant token namespaces in this project are `saa-page`, `saa-page-fg`, `saa-divider`, `saa-header-overlay`, plus standard Tailwind sizing utilities. If a Figma value does not match any existing token, register the new token in the Tailwind config / CSS variables BEFORE referencing it (Constitution Principle II forbids raw color/spacing literals).

### Phase 1 — Visual update + FR-010 strict no-op (sole substantive phase)

1. Open [src/components/header/LanguageSelector.tsx](src/components/header/LanguageSelector.tsx). Locate the two `className` strings (trigger button at the line with `flex h-14 w-[108px] items-center justify-between gap-0.5 rounded p-4` and menu container at `absolute right-0 top-full z-20 mt-2 flex w-[140px] flex-col rounded-md border border-saa-divider bg-saa-page py-1 shadow-lg`).
2. Update each `className` to match Figma values, expressed in Tailwind tokens. The "selected on top, alternative below" stacked treatment from the new design is already the structural arrangement in the existing JSX — no JSX changes are needed unless Figma adds a divider element, a label, or similar. Resist the temptation to refactor.
3. If a new color/spacing token is genuinely needed (e.g., the darker panel uses a shade not in `saa-*`), add it to the Tailwind config / globals first, then reference it. Document the addition in the PR description.
4. Replace `flag-vn.svg` and `chevron-down.svg` only if Phase 0 step 3 identified visual replacements. (`LOCALE_DISPLAY` chip flip happens in Phase 1.5, NOT here — keep concerns separated for review clarity.)
5. **FR-010 strict no-op (Q4 resolution):** In the `commit` callback (currently lines 87-111), add a short-circuit at the top so clicking the already-active row does no work beyond closing the menu:

   ```ts
   const commit = useCallback(
     async (target: SupportedLocale) => {
       if (target === optimisticLocale) {
         setIsOpen(false);
         return;
       }
       const previous = optimisticLocale;
       setOptimisticLocale(target);
       setIsOpen(false);
       writeClientCookie(target);
       router.refresh();
       // ...rest unchanged
     },
     [optimisticLocale, isAuthenticated, router, writeClientCookie],
   );
   ```

   The short-circuit MUST run before `setOptimisticLocale`, `writeClientCookie`, `router.refresh()`, and the `fetch` to `/api/i18n/locale` — i.e., it must produce a strict no-op as FR-010 requires (no state change, no cookie write, no SSR refresh, no network call). Update or add a Vitest case in [tests/unit/components/header/LanguageSelector.test.tsx](tests/unit/components/header/LanguageSelector.test.tsx) that asserts: (a) clicking the active row leaves `aria-expanded` `false`, (b) the `fetchMock` was NOT called, (c) `refreshMock` was NOT called.

### Phase 1.5 — Display Label Flip (Q5 resolution)

The locale code `en-US` does NOT change — only the human-facing chip and flag.

1. Edit [src/lib/i18n/types.ts](src/lib/i18n/types.ts) line 30:

   ```ts
   "en-US": { chip: "EN", flagAsset: "/assets/header/icons/flag-en.svg" },
   ```

   (Use the actual filename produced by Phase 0 step 3 if it differs from `flag-en.svg`.) Do NOT change the key `"en-US"` or the `vi-VN` row.

2. Update test assertions that reference the old `US` chip. Confirmed locations from a `grep` sweep:
   - [tests/unit/components/header/LanguageSelector.test.tsx](tests/unit/components/header/LanguageSelector.test.tsx) lines 44, 58, 86, 98, 116, 119 — change `"US"` and `/us/i` → `"EN"` and `/en/i`.
   - [tests/e2e/login/language-switch.spec.ts](tests/e2e/login/language-switch.spec.ts) line 39 — same change.

   Run `grep -rn "\"US\"\|/us/i\|/US/" src/ tests/` before AND after the edit to confirm zero remaining references in code/tests (matches in spec/`.momorph/` are doc and handled in Phase 4).

3. Delete `public/assets/header/icons/flag-us.svg` after confirming zero references with the same grep.

### Phase 2 — Verification

1. Run `npm run test` (Vitest). Inspect failures:
   - Behavioral tests MUST pass without edits — a failure here means behavior regressed; fix the regression, do not edit the test. The relevant suites and what they cover:
     - [tests/unit/components/header/LanguageSelector.test.tsx](tests/unit/components/header/LanguageSelector.test.tsx) — disclosure pattern (open/close/aria-expanded), keyboard nav, optimistic update + revert on `fetch` failure, chip rendering.
     - [tests/unit/lib/cookies/saa-locale.test.ts](tests/unit/lib/cookies/saa-locale.test.ts) — cookie read/write, allowlist enforcement, tampered-value clearing.
     - [tests/unit/services/locale-service.test.ts](tests/unit/services/locale-service.test.ts) — `setLocale` happy path + null userId no-op.
     - [tests/integration/login/i18n-locale-route.test.ts](tests/integration/login/i18n-locale-route.test.ts) — `POST /api/i18n/locale` 401 / 400 / 204 paths.
   - The project does NOT use Vitest snapshot files (`__snapshots__/` directories do not exist). Tests assert with explicit `expect(...)` calls only. If you add a snapshot, you are introducing a new test pattern — don't.
   - If any test asserts a specific Tailwind class (e.g. `expect(button).toHaveClass("h-14")`), the assertion may need updating to the new class name. Update the assertion to reflect the new design value, but only after confirming the class change is intentional.
2. Run `npm run test:e2e -- tests/e2e/login/language-switch.spec.ts`. MUST pass. The spec covers both unauthenticated (cookie only) and authenticated (cookie + `User.locale` row via `POST /api/i18n/locale`) paths. If it asserts pixel-exact CSS, update only the asserted values.
3. Capture a Playwright screenshot of the rendered dropdown (open and closed states) on the Login route. Compare side-by-side to `get_frame_image(hUyaaugye2)`. Iterate up to 3 times per `momorph.implement-ui` guidance until the visual diff is acceptable. Use `toHaveScreenshot({ maxDiffPixelRatio: 0.02 })` rather than pixel-exact compare to absorb font-hinting / antialiasing differences.
4. Run `npm run lint` and `npx tsc --noEmit` — MUST be clean.

### Phase 3 — Manual smoke

1. `npm run dev`, open `/login` in a browser:
   - VN→EN: click the chip, click `EN` row, verify chip + UK flag render, hero copy switches to English.
   - EN→VN: reverse.
   - Click already-active row: menu closes, no flicker, no network request (verify in DevTools Network tab — the `POST /api/i18n/locale` MUST NOT fire).
   - Outside-click and `Escape` close the menu.
   - Keyboard: `Tab` to chip, `Enter` to open, arrow keys, `Enter` to select, `Escape` to close — focus trap works.
2. Open DevTools → Application → Cookies, verify `saa_locale` updates to `vi-VN` / `en-US` (locale code unchanged; only the chip text changed).
3. Sign in with a test Google account, change locale, reload — verify cookie persists. Sign out, sign back in, verify the locale still reflects `User.locale` (still stored as `en-US`, displayed as `EN`).

### Phase 4 — Cross-doc Sync

The Q5 resolution reverses an earlier 2026-05-06 decision in the Login spec, so three documents need their canonical "chip code" rows updated. These are documentation edits only; no further code or test changes.

1. **Login spec** ([.momorph/specs/GzbNeVGJHz-login/spec.md](.momorph/specs/GzbNeVGJHz-login/spec.md)) — update these lines (use `grep -nE "\\bUS\\b|🇺🇸|United States" .momorph/specs/GzbNeVGJHz-login/spec.md` to confirm; current matches: lines 279-280, 390, 561):
   - **Line 390** (Key Entities → Language preference table): change `| en-US | US | United States flag (🇺🇸) | 2 |` → `| en-US | EN | UK flag | 2 |`.
   - **Lines 279-280** (TR-001 description of the chip): change `"US" for "en-US"` → `"EN" for "en-US"` and reword "country-style label" → "language-style label" since `EN` is no longer a country code.
   - **Line 561** (Q1 resolution log): append a `Resolved 2026-05-07 (revised)` entry noting that the chip + flag reverted to `EN` + UK flag per dropdown frame `hUyaaugye2`. Do NOT delete the original 2026-05-06 entry — keep the audit trail.
2. **SCREENFLOW** ([.momorph/SCREENFLOW.md](.momorph/SCREENFLOW.md)) — update lines 59 and 175 to read `chip "EN"` instead of `chip "US"`. Add a Discovery Log row dated 2026-05-07 noting the chip flip.
3. **Dropdown spec** ([.momorph/specs/hUyaaugye2-dropdown-ngon-ngu/spec.md](.momorph/specs/hUyaaugye2-dropdown-ngon-ngu/spec.md)):
   - Update Overview: `chip "US"` → `chip "EN"`.
   - Update Key Entities → Chip code: flip the resolution narrative — Figma is now authoritative; Login spec was reversed on 2026-05-07 to match. Reference Q5 resolution above.
   - Update US1 acceptance scenarios that reference `US` chip text → `EN`.
   - Update FR-002 example: `(VN for vi-VN, US for en-US per Login spec; pending Q3)` → `(VN for vi-VN, EN for en-US per Q5 resolution)`.
4. Verify with a final sweep: `grep -rn "\\bUS\\b" .momorph/specs/hUyaaugye2-dropdown-ngon-ngu/ .momorph/specs/GzbNeVGJHz-login/spec.md .momorph/SCREENFLOW.md src/lib/i18n/types.ts tests/unit/components/header/LanguageSelector.test.tsx tests/e2e/login/language-switch.spec.ts`. Only matches that should remain are the BCP 47 code `en-US`, audit-log entries documenting the flip, and the asset path comment if any.

### Risk Assessment

| Risk                                                                            | Probability | Impact | Mitigation                                                                                                                  |
| ------------------------------------------------------------------------------- | ----------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| Implementer treats this as a fresh build and writes a new component file       | Medium      | High   | Spec's "Implementation Status" + this plan's repeated "no new files" note. Tasks file (next step) MUST gate on this.       |
| Implementer flips `LOCALE_DISPLAY.chip` to `"EN"` but misses one of the 8 test references | Medium | Low | Phase 1.5 step 2 mandates the pre-and-post grep sweep; CI lint + Vitest will fail loudly if a `/us/i` matcher survives. |
| Login spec / SCREENFLOW chip references not updated, leaving doc/code drift | High | Low | Phase 4 makes the doc updates explicit and lists exact line numbers; final grep sweep catches stragglers. |
| Implementer adds `next-intl` because they "expect" an i18n library             | Low         | Med    | Spec TR-005 + Resolved Q2 say custom `t()` was deliberate. Reject any PR that adds a translation library to this scope.    |
| Vitest assertion that pins a specific Tailwind class breaks                     | Medium      | Low    | Project has no Vitest snapshots. If a `toHaveClass` assertion fails, update only the asserted class string, not the test logic. |
| Edge case "Multiple instances on one page" not covered by current implementation | Low         | Med    | The shipped component uses local React state; multiple instances each track their own optimistic value. After `router.refresh()` they re-read the cookie via SSR and re-sync. If a near-instant cross-instance sync is required (e.g. header + footer), that is OUT OF SCOPE for the visual refresh — open a follow-up spec. |
| New design requires a color/spacing not in the token system                    | Low         | Low    | Add the token to Tailwind config first, then reference it. Document in PR.                                                  |
| Playwright visual diff fails on font hinting / antialiasing differences        | Med         | Low    | Use Playwright's `toHaveScreenshot({ maxDiffPixelRatio })` or a manual side-by-side review rather than pixel-exact compare. |

### Estimated Complexity

- **Frontend**: Low — className updates in one file, a 5-line `commit` short-circuit, a single-line edit in `LOCALE_DISPLAY`, and one asset swap.
- **Backend**: None.
- **Testing**: Low — existing behavioral suite carries the load; flip 8 chip-text assertions in `LanguageSelector.test.tsx` + `language-switch.spec.ts`; add one new strict-no-op test case. The project does NOT use Vitest snapshots, so no snapshot churn.
- **Documentation**: Low — Phase 4 updates 3 docs at known line numbers.

---

## Integration Testing Strategy

The existing test suite already covers all integration scenarios for this feature. Re-stating to confirm coverage rather than to plan new tests:

### Test Scope (verifying continued pass after refresh)

- [x] **Component / module interactions**: `LanguageSelector` ↔ `LOCALE_DISPLAY` ↔ `saa_locale` cookie API ↔ `useRouter().refresh()` — covered by [tests/unit/components/header/LanguageSelector.test.tsx](tests/unit/components/header/LanguageSelector.test.tsx).
- [x] **External dependencies**: none. The component talks to a same-origin route only.
- [x] **Data layer**: `User.locale` write path — covered by [tests/unit/services/locale-service.test.ts](tests/unit/services/locale-service.test.ts) and [tests/unit/repositories/user-repository.test.ts](tests/unit/repositories/user-repository.test.ts).
- [x] **User workflow**: open → select → cookie persisted → reload preserves — covered by [tests/e2e/login/language-switch.spec.ts](tests/e2e/login/language-switch.spec.ts).

### Test Categories

| Category               | Applicable? | Coverage                                                                              |
| ---------------------- | ----------- | ------------------------------------------------------------------------------------- |
| UI ↔ Logic             | Yes         | LanguageSelector unit test (open / close / keyboard / select / revert-on-fail)        |
| Service ↔ Service      | Yes         | locale-service unit test + i18n-locale-route integration test                          |
| App ↔ External API     | No          | No external API for this component                                                     |
| App ↔ Data Layer       | Yes         | user-repository unit test (`updateLocale`)                                              |
| Cross-platform         | Partial     | Responsive web only; no native variant                                                  |

### Mocking Strategy (existing)

| Dependency                  | Strategy | Rationale                                                                  |
| --------------------------- | -------- | -------------------------------------------------------------------------- |
| `next/navigation` `useRouter` | Mocked  | Component test doesn't need real navigation; only asserts `router.refresh` called |
| `fetch` (`/api/i18n/locale`) | Mocked  | Component test simulates 200 / 500 to assert optimistic + revert paths     |
| Prisma client               | In-memory mock | Repository / service tests use a Prisma mock to keep tests hermetic   |
| Auth.js `auth()`            | Mocked  | Route handler test stubs the session                                       |

### Coverage Goals (already met by shipped tests)

| Area                              | Target | Current | Action                                            |
| --------------------------------- | ------ | ------- | ------------------------------------------------- |
| `LanguageSelector` behavior       | 90%+   | met     | No new tests; ensure no regression                |
| Cookie helpers                    | 100%   | met     | No new tests                                      |
| API route happy path + error      | 100%   | met     | No new tests                                      |
| E2E language-switch flow          | full   | met     | Re-run after refresh                              |

### Spec → Verification Coverage Matrix

Each spec requirement is traced to either a shipped test or a manual smoke step. This is the gate the implementer/reviewer uses to confirm the refresh did not silently regress the spec.

| Spec item | Verification artifact |
| --------- | --------------------- |
| **US1 / FR-001** locale allowlist `vi-VN` + `en-US` | [tests/unit/lib/cookies/saa-locale.test.ts](tests/unit/lib/cookies/saa-locale.test.ts) — tampered value clearing |
| **US1 / FR-002** trigger renders chip + flag for active locale | LanguageSelector unit test "displays the current locale chip" — assertions updated for `EN` chip + UK flag in Phase 1.5 |
| **US1 / FR-003** click trigger toggles menu | LanguageSelector unit test (`aria-expanded` toggle) |
| **US1 / FR-004** menu lists all supported locales, active styled | LanguageSelector unit test (renders both rows with `aria-current` on active) + visual diff against Figma |
| **US1 / FR-005** click switches active locale | LanguageSelector unit test + `language-switch.spec.ts` E2E |
| **US1 / FR-006** menu closes after selection | LanguageSelector unit test |
| **US2 / FR-007** menu closes on outside-click and `Escape` | LanguageSelector unit test (both paths) + Phase 3 manual smoke |
| **US1 / FR-008** persistence across reload | `language-switch.spec.ts` E2E (cookie + `User.locale` round-trip) |
| **US1 / FR-009** live re-render | LanguageSelector unit test (`router.refresh` called) + E2E hero-copy assertion |
| **US1 / FR-010** click-active strict no-op | New Vitest case in `LanguageSelector.test.tsx` (added in Phase 1.5): clicking the active row leaves `aria-expanded` `false`, `fetchMock` not called, `refreshMock` not called. Test fails before the Phase 1 short-circuit lands and passes after — TDD per Constitution Principle V. |
| **US3 / FR-011** keyboard nav | LanguageSelector unit test (`Enter` / `Space` / `ArrowDown` / `ArrowUp` / `Escape`) + Phase 3 manual smoke |
| **US3 / FR-012** ARIA semantics | LanguageSelector unit test (asserts `aria-haspopup`, `aria-expanded`, `aria-controls`, `aria-current`, `aria-label`) |
| **TR-001** 100ms perceived | Manual smoke; no automated timing assertion |
| **TR-002** cookie attributes | [tests/unit/lib/cookies/saa-locale.test.ts](tests/unit/lib/cookies/saa-locale.test.ts) |
| **TR-003** authenticated mirror to `User.locale` | [tests/integration/login/i18n-locale-route.test.ts](tests/integration/login/i18n-locale-route.test.ts) (204 path) + E2E (DB row check via `getUserLocale`) |
| **TR-004** single reusable component | Static fact; verified by the file existing at the spec'd path |
| **TR-005** custom `t()` helper | `tests/unit/lib/i18n/parity.test.ts` (key parity at build time) |
| **TR-006** ≤200ms transition | Verified by Tailwind class — `transition-transform` defaults to 150ms; check that `motion-safe:` modifier wraps the rotation so `prefers-reduced-motion` is respected |
| **TR-007** server-side allowlist enforcement | i18n-locale-route 400-on-invalid + saa-locale tampered-value clearing |
| **Edge: persistence failure (auth)** | LanguageSelector unit test mocks `fetch` to reject and asserts revert |
| **Edge: out-of-allowlist value** | saa-locale unit test |
| **Edge: SSR first paint** | Login E2E hero-content assertion (initial render shows correct copy from cookie) |
| **Edge: multiple instances** | Not covered; documented as out-of-scope in Risk Assessment above |
| **Edge: rapid double-click** | LanguageSelector unit test (FR-010 path covers this) |
| **Edge: cross-tab sync** | Marked OPTIONAL in spec; no test required |

---

## Why no `research.md`?

The plan template offers an optional research file. For this plan it would duplicate the work already captured in the spec's "Implementation Status" table and the SCREENFLOW Locale Handling section. Re-creating it would be churn. If a future change widens scope (adding a third locale, refactoring the i18n helper, etc.) that future plan SHOULD include a `research.md` because the architectural surface would actually be in play.

---

## Dependencies & Prerequisites

### Required before start

- [x] `constitution.md` reviewed (v1.1.1).
- [x] `spec.md` reviewed (post-`momorph.reviewspecify` rounds).
- [x] `SCREENFLOW.md` drift-synced (2026-05-07; Phase 4 of this plan will sync it again for the chip flip).
- [x] Existing implementation read end-to-end (paths listed in spec's Implementation Status).
- [x] Q4 decided (option (a) — strict no-op short-circuit).
- [x] Q5 decided (follow Figma — chip `EN`, UK flag).
- [ ] Figma frame `hUyaaugye2` accessible — verify by running `query_section` once before Phase 1.
- [ ] Confirm the exact filename Figma exports for the UK flag asset (likely `flag-en.svg`); update Phase 0 step 3 + Phase 1.5 step 1 if it differs.

### External dependencies

None. No third-party API, no new SaaS, no new vendor library.

---

## Next Steps

After plan approval:

1. **Run `/momorph.tasks`** to generate the task breakdown. The tasks file MUST reflect the "no new routes / services / DB changes / dependencies" constraint and structure work in this order:
   - **Phase 0** — Asset prep (Figma `query_section` + `list_media_nodes` + UK flag download).
   - **Phase 1** — Visual update + FR-010 strict no-op (className edits + `commit` short-circuit + new strict-no-op test case).
   - **Phase 1.5** — Display label flip (`LOCALE_DISPLAY` edit + 8 test-assertion updates + delete `flag-us.svg`).
   - **Phase 2** — Verification (Vitest, Playwright, lint, tsc).
   - **Phase 3** — Manual smoke.
   - **Phase 4** — Cross-doc sync (Login spec, SCREENFLOW, dropdown spec).
   The TDD order matters for FR-010: the failing strict-no-op test goes in BEFORE the `commit` short-circuit (Constitution Principle V).
2. **Run `/momorph.reviewplan`** if there is any doubt about whether this plan correctly scopes the work.
3. **Begin** implementation only after Phase 0 has confirmed Figma access and asset deltas.

---

## Resolved Questions

- **Q4 — Strict FR-010 enforcement.** **Resolved 2026-05-07: option (a)** — tighten the code so clicking the already-active row is a strict no-op (no state change, no cookie write, no `router.refresh()`, no `fetch`). Implementation step is now Phase 1 / step 5; verification is the new dedicated Vitest case (Spec → Verification matrix row for FR-010).

- **Q5 — Figma vs. codebase chip + flag for `en-US`.** **Resolved 2026-05-07: follow Figma.** The display chip becomes `EN` (was `US`) and the leading-side icon becomes the UK flag — `cờ Anh` per Figma frame `hUyaaugye2` (was the US flag). This reverses the Login spec's 2026-05-06 Q1 resolution. The locale code (`en-US`) is unchanged; only the human-facing display label and flag image change. Concrete impact is enumerated in **Phase 1.5 (Display Label Flip)** and **Phase 4 (Cross-doc Sync)** below.

---

## Notes

- The single biggest implementation risk is **scope creep**: an over-eager implementer rebuilding what already exists. The plan, the spec's Implementation Status section, and the tasks file all need to repeat this guardrail. If the eventual PR diff touches `route.ts`, `locale-service.ts`, `saa-locale.ts`, or the Prisma schema, that is a red flag — the reviewer should ask why.
- **Q5 reversed the earlier Q3 resolution.** The codebase's `US` + 🇺🇸 was correct as of 2026-05-06 but Figma frame `hUyaaugye2` is now the authoritative source for the chip + flag — the implementer MUST flip the code to `EN` + UK flag (Phase 1.5) and update the Login spec / SCREENFLOW / dropdown spec (Phase 4). The locale code `en-US` (BCP 47) is unaffected.
- The `prefers-reduced-motion` media-query check on the chevron rotation is a small accessibility improvement that may or may not already be in place — verify during Phase 1 and add the `motion-safe:` variant if absent.
- Constitution v1.1.1's TODO note about installing testing toolchain is RESOLVED; both Vitest 4 and Playwright 1.59 are available — no setup work needed.
