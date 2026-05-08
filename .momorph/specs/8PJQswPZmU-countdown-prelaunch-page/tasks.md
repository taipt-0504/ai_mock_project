# Tasks: Countdown — Prelaunch Page (Global Pre-Launch Gate)

**Frame**: `8PJQswPZmU-countdown-prelaunch-page`
**Prerequisites**: [plan.md](./plan.md) ✓, [spec.md](./spec.md) ✓
**Note**: `design-style.md` deliberately absent — plan § "Required Before Start" resolves it; visual specs come from Figma at implementation time (frame `2268:35127` via `query_section` / `get_node`).

---

## Task Format

```text
- [ ] T### [P?] [Story?] Description | path
```

- **[P]**: Parallelizable (different files, no dependency on incomplete tasks)
- **[Story]**: User-story label (US1 / US2 / US3 / US4)
- Setup, Foundation, and Polish phases have NO story label

**Logic vs UI**: Each user-story phase below is split into `### Logic (US#)` and `### UI (US#)` subsections per request. Tests live under `### Tests (US#)`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify the environment + scope new asset needs before any code lands.

- [ ] T001 [P] Confirm Node ≥ 20.9 and Playwright system deps locally; document any missing libs in PR | (no file)
- [ ] T002 [P] Asset audit: query Figma frame `2268:35127` via MoMorph MCP (`mcp__momorph__query_section` or `mcp__momorph__list_media_nodes`) and confirm whether `MM_MEDIA_BG` (`2268:35129`) reuses the Homepage hero key art OR needs a fresh download. If reused → import `public/assets/home/images/key-visual.png` directly from PrelaunchScreen. If different → `mcp__momorph__get_media_files` and save under `public/assets/prelaunch/images/` | public/assets/prelaunch/images/ (only if needed)
- [ ] T003 [P] Confirm dark-overlay maps to existing `saa-overlay-fade-*` Tailwind utilities (no new tokens). If a fresh CSS variable is required, document it for `app/globals.css` and stop until reviewed | app/globals.css (read-only audit)

---

## Phase 2: Foundation (Blocking Prerequisites)

**Purpose**: Pure logic + i18n + config that every user story depends on. Includes the gate decision module and its full unit-test matrix. **No proxy wiring yet** — that lands in US2 once US1's route exists to redirect to.

**⚠️ CRITICAL**: User-story phases (3+) MUST NOT begin until Phase 2 is green. Phase 6 (Polish — `.env.example` + onboarding) MUST land in the same PR as the proxy wiring (T021) per plan's sequencing rule.

### Logic — config + i18n

- [ ] T004 Extend Zod schema with `SAA_LAUNCH_AT: z.string().optional()` and expose `config.SAA_LAUNCH_AT` (mirror `SAA_EVENT_START_AT` shape; runtime fail-closed lives in `parseLaunchAt`, NOT at schema-parse time) | src/lib/config.ts
- [ ] T005 [P] Extend `tests/unit/lib/config.test.ts` so the schema-parity assertion includes `SAA_LAUNCH_AT` | tests/unit/lib/config.test.ts
- [ ] T006 [P] Add `parseLaunchAt(envValue: string \| undefined): Date \| null` (mirror `parseEventStart`'s contract: returns `null` for missing / empty / non-string / NaN; accepts whatever `new Date(value)` accepts). One-line `// why:` comment captures the always-fail-closed reason for `null` | src/lib/event/event-config.ts
- [ ] T007 [P] Extend `tests/unit/lib/event/event-config.test.ts` with `parseLaunchAt` cases: `undefined`, `""`, `"not-a-date"`, `"2025"`, `"2025-13-99"`, future ISO, past ISO. Each `null` source asserts `=== null` | tests/unit/lib/event/event-config.test.ts
- [ ] T008 [P] Add `"prelaunch.heading"` key to `vi-VN` catalog (e.g. `"Sự kiện sẽ bắt đầu sau"`) | src/lib/i18n/catalogs/vi-VN.json
- [ ] T009 [P] Add `"prelaunch.heading"` key to `en-US` catalog (e.g. `"Coming soon"`). MUST land in the same commit as T008 — `tests/unit/lib/i18n/parity.test.ts` will fail otherwise | src/lib/i18n/catalogs/en-US.json

### Logic — gate decision module (pure, isolable)

- [ ] T010 Create `GateDecision` tagged-union type (`{ type: "passthrough" } \| { type: "redirect", target: "/coming-soon" \| "/" }`) | src/lib/proxy/prelaunch-gate.types.ts
- [ ] T011 Implement `isWhitelisted(pathname: string): boolean` covering `/coming-soon`, `pathname.startsWith("/_next/")`, root-level static (`/favicon.ico`, `/robots.txt`, `/sitemap.xml`), `pathname.startsWith("/assets/")`, exact `/api/health`. NOT whitelisted: any `/api/auth/*` (Q-PG4) | src/lib/proxy/prelaunch-gate.ts
- [ ] T012 Implement `evaluateGate(pathname: string, launchAt: Date \| null, now: Date): GateDecision`. Decision matrix:<br>• `pathname === "/coming-soon"` → if `launchAt && launchAt <= now` → `redirect "/"`; else `passthrough`.<br>• `isWhitelisted(pathname)` → `passthrough` always.<br>• otherwise → if `launchAt === null \|\| launchAt > now` → `redirect "/coming-soon"`; else `passthrough`. <br>Take `now` as a parameter so tests can pin the clock | src/lib/proxy/prelaunch-gate.ts
- [ ] T013 [P] Vitest for `evaluateGate`: every cell of the decision matrix (gate-active × {prelaunch, each whitelist entry, /, /login, /awards, /api/auth/callback}; gate-lifted × same set; null env × same set; race at zero boundary `launchAt = now ± 1ms`) | tests/unit/lib/proxy/prelaunch-gate.test.ts
- [ ] T014 [P] Vitest abuse-case: path-traversal — `/coming-soon/../awards` and `/_next/../awards` both resolve to a redirect (NOT passthrough) because `URL.pathname` normalizes before reaching `isWhitelisted` | tests/unit/lib/proxy/prelaunch-gate.test.ts (same file as T013)

**Checkpoint**: All Phase 2 tests green. `npm run test` includes new cases; `tsc --noEmit` clean. No proxy or route changes have shipped — local dev still works as before.

---

## Phase 3: User Story 1 — Live countdown (Priority: P1) 🎯 MVP

**Goal**: A visitor reaching `/coming-soon` sees the localized heading (`prelaunch.heading`) above three tiles (DAYS / HOURS / MINUTES) anchored on `SAA_LAUNCH_AT`. Auth-agnostic; no chrome.

**Independent Test**: With `SAA_LAUNCH_AT=now+5d3h17m`, GET `/coming-soon` → 200, render `<h1>` with prelaunch heading and tiles `05` / `03` / `17`. Tab-switch ≥ 1 min and return → tiles re-sync. Same outcome with and without a session cookie.

> **Why before US2**: US2's proxy redirect MUST have a destination route to redirect to. Implement the route + screen first, then wire the gate in US2.

### UI (US1)

- [ ] T015 [P] [US1] Extend `Countdown` with two optional props: `subtitleAs?: "p" \| "h1"` (default `"p"`) and `subtitleKey?: string` (default `"home.hero.subtitle"`). Render via `React.createElement(subtitleAs, …, t(subtitleKey, locale))`. Existing Hero call site (`<Countdown eventStart={…} locale={…} />`) MUST stay byte-identical at runtime | src/components/home/Countdown.tsx
- [ ] T016 [US1] Create `PrelaunchScreen` Server Component (NO `"use client"`): renders `<main>` landmark, full-bleed `<Image fill priority sizes="100vw">` BG, dark-overlay `<div>` (Tailwind tokens only), and `<Countdown subtitleAs="h1" subtitleKey="prelaunch.heading" eventStart={launchAt} locale={locale} />`. **MUST NOT** render `<header>` / `<footer>` / `<nav>` / `<button>` / `<a>` (FR-003, US4 invariant) | src/components/prelaunch/PrelaunchScreen.tsx
- [ ] T017 [US1] Create `app/coming-soon/page.tsx` Server Component. `export const dynamic = "force-dynamic"`. **MUST NOT import or call `auth()`** (FR-002). Reads `parseLaunchAt(config.SAA_LAUNCH_AT)`. If `launchAt !== null && launchAt <= new Date()`, `redirect("/")` (FR-008 defensive in-route backstop). Else reads `getSaaLocale()` and renders `<PrelaunchScreen launchAt={launchAt} locale={locale} />` | app/coming-soon/page.tsx

### Tests (US1)

- [ ] T018 [P] [US1] Add two Countdown test cases: (a) `subtitleAs="h1"` + `subtitleKey="prelaunch.heading"` produces `<h1>` with translated prelaunch text; (b) defaults preserve `<p>` + `home.hero.subtitle`. Existing Countdown scenarios MUST stay green | tests/unit/components/home/Countdown.test.tsx
- [ ] T019 [P] [US1] PrelaunchScreen render tests: exactly one `<main>`; `screen.getByRole("heading", { level: 1 })` returns the prelaunch text; `container.querySelectorAll("button, a")` length === 0 (US4 / FR-003 invariant) | tests/unit/components/prelaunch/PrelaunchScreen.test.tsx
- [ ] T020 [P] [US1] `app/coming-soon/page.tsx` route tests: mock `auth()` via `vi.mock("@/src/lib/auth")` and `redirect()` via `vi.mock("next/navigation")`. Cases:<br>• future `launchAt` → renders PrelaunchScreen; `auth.mock.calls.length === 0` (FR-002).<br>• past `launchAt` → calls `redirect("/")` exactly once (FR-008 defensive).<br>• null `launchAt` → renders PrelaunchScreen with `--/--/--` placeholders (FR-009) | tests/unit/app/coming-soon/page.test.tsx

**Checkpoint**: Visiting `/coming-soon` directly (`npm run dev`) renders the prelaunch surface end-to-end. The route works in isolation; the gate is not yet wired.

---

## Phase 4: User Story 2 — Global redirect during gate window (Priority: P1)

**Goal**: While `parseLaunchAt(...) > now()` (or env is null/malformed), every non-whitelisted request is intercepted at `proxy.ts` and redirected to `/coming-soon` BEFORE any route handler runs. Auth-agnostic. Existing security-headers + rate-limit pipeline preserved on the redirect responses.

**Independent Test**: Set `SAA_LAUNCH_AT` to a future ISO. From a fresh session, request `/`, `/login`, `/awards`, `/sun-kudos`, `/profile`, `/general-rules`, `/api/auth/session`, `/api/auth/callback/google?code=…`, `/api/notifications/unread-count` → each responds 307 with `Location: /coming-soon`. Whitelist entries (`/_next/data/abc.json`, `/api/health` if present) pass through. Repeat with a valid Auth.js session cookie → identical outcome.

### Logic (US2)

- [ ] T021 [US2] Extend `proxy.ts`: add module-level `const LAUNCH_AT: Date \| null = parseLaunchAt(config.SAA_LAUNCH_AT)` (parsed once at module load — TR-001 perf budget). Add a one-line `// why:` comment | proxy.ts
- [ ] T022 [US2] In `proxy(request)`, evaluate the gate FIRST via `evaluateGate(url.pathname, LAUNCH_AT, new Date())`. On `redirect`, build `NextResponse.redirect(new URL(target, request.url), 307)`, set `x-request-id` (`crypto.randomUUID()`), funnel through the existing `applySecurityHeaders` helper, return. On `passthrough`, fall through to the existing rate-limit + `next()` pipeline (no behavioral change to Login flow) | proxy.ts
- [ ] T023 [US2] Replace stale `"Edge-runtime proxy for the Login surface"` docstring with a Next.js 16 Node-runtime note. Document the gate sequencing (gate first, then existing pipeline) and the `LAUNCH_AT` module-load rationale | proxy.ts
- [ ] T024 [US2] Add one `logger.debug` per gate decision: `logger.debug("prelaunch-gate", { path: url.pathname, decision, target? })`. NEVER include cookies/tokens (TR-002 A09). Use the existing `src/lib/logger.ts` import | proxy.ts

### Tests (US2)

- [ ] T025 [P] [US2] Vitest integration smoke at `proxy()` boundary: stub env via `vi.stubEnv("SAA_LAUNCH_AT", value)` + `vi.resetModules()` + dynamic re-import. Cover: gate-active anon `/` → 307 `/coming-soon`; gate-active `/_next/data/foo.json` → passthrough; gate-active `/api/auth/callback/google?code=x` → 307 `/coming-soon` (Q-PG4); gate-disabled `/coming-soon` → 307 `/`; gate-disabled `/` → passthrough | tests/integration/prelaunch/proxy-gate.test.ts
- [ ] T026 [P] [US2] Vitest integration: every redirect response carries the OWASP header set (CSP / HSTS / `X-Content-Type-Options` / `Referrer-Policy` / `X-Frame-Options`) AND `x-request-id` matching `/[0-9a-f-]{36}/i`. Reuse `REQUIRED_HEADERS` array from existing `tests/integration/login/proxy-headers.test.ts` | tests/integration/prelaunch/proxy-gate-headers.test.ts
- [ ] T027 [P] [US2] Vitest fail-closed matrix: with `NODE_ENV` parametrized over `{production, development, test}`, env unset / `""` / `"garbage"` / `"2025-13-99"` each results in 307 to `/coming-soon` for any non-whitelisted path (FR-009 / SC-004) | tests/integration/prelaunch/proxy-gate.test.ts (same file as T025)
- [ ] T028 [US2] Playwright `gate-active.spec.ts`: launch with `SAA_LAUNCH_AT=<future ISO>`. Iterate over [`/`, `/login`, `/awards`, `/sun-kudos`, `/profile`, `/general-rules`, `/api/auth/session`, `/api/notifications/unread-count`] using `page.request.get(path, { maxRedirects: 0 })` → assert status `307`, `Location` header equals `/coming-soon`, response body does NOT contain Homepage hero text or Login copy. Repeat the entire suite with a seeded Auth.js session cookie via `tests/e2e/fixtures/db.ts` patterns → identical outcome | tests/e2e/prelaunch/gate-active.spec.ts

**Checkpoint**: With `SAA_LAUNCH_AT=<future>`, the entire app is gated. With `SAA_LAUNCH_AT=<past>`, every shipped route still works exactly as before — Homepage/Login Playwright suites pass unchanged.

---

## Phase 5: User Story 3 — Prelaunch unreachable post-gate (Priority: P1)

**Goal**: Once `now() >= SAA_LAUNCH_AT`, `/coming-soon` is no longer a destination. Direct visits redirect to `/`. A visitor with the prelaunch tab open across the zero boundary auto-hands-off within ≤ 1 minute.

**Independent Test**: With `SAA_LAUNCH_AT=<past>`, GET `/coming-soon` → 307 to `/`; anonymous follow lands on `/login` (Homepage US0); authenticated follow lands on Homepage. Other routes resume normal flow. Open `/coming-soon` then advance the wall clock past `launchAt` (Vitest fake timers) → `router.refresh()` fires exactly once.

### Logic (US3)

- [ ] T029 [P] [US3] Implement `PrelaunchAutoExit` `"use client"` companion: takes `launchAt: Date \| null`, runs `useEffect(() => { … }, [launchAt])` that schedules a one-minute interval; uses `useRef<boolean>` to guarantee `router.refresh()` fires AT MOST once across the lifetime of the mount. Returns `null`. No-op when `launchAt` is null or already past at mount time | src/components/prelaunch/PrelaunchAutoExit.tsx

### UI (US3)

- [ ] T030 [US3] Mount `<PrelaunchAutoExit launchAt={launchAt} />` inside `PrelaunchScreen` (after the Countdown). Idempotent — render is unchanged when launchAt is null/already-past | src/components/prelaunch/PrelaunchScreen.tsx (modify; created in T016)

### Tests (US3)

- [ ] T031 [P] [US3] Vitest with `vi.useFakeTimers()`: mock `useRouter()`, mount `<PrelaunchAutoExit launchAt={now + 30s} />`, advance timers > 30s + one tick, assert `router.refresh` called exactly once. Advance further → still called only once (the `useRef` guard) | tests/unit/components/prelaunch/PrelaunchAutoExit.test.tsx
- [ ] T032 [US3] Playwright `gate-disabled.spec.ts`: launch with `SAA_LAUNCH_AT=<past ISO>`. (a) GET `/coming-soon` (no redirects) → 307, `Location: /`. (b) Anonymous full-redirect chain `/coming-soon` → `/` → `/login`. (c) With seeded session cookie → `/coming-soon` → `/` → Homepage 200. (d) GET `/login`, `/awards` → normal handlers respond, no proxy redirect | tests/e2e/prelaunch/gate-disabled.spec.ts

**Checkpoint**: Both gate states behave correctly end-to-end. The handoff at the zero boundary is verifiable in Vitest; the visitor-observable outcome is verified in Playwright.

---

## Phase 6: User Story 4 — No interactive surface (Priority: P2)

**Goal**: The prelaunch screen has zero interactive controls. Pressing Tab from a fresh load lands on no in-page focusable element.

**Independent Test**: Navigate to `/coming-soon` (gate-active). Inspect DOM for `<button>` and non-metadata `<a>` → both zero. `await page.keyboard.press('Tab')`; `document.activeElement.tagName === "BODY"` (or another non-page-control sentinel).

### Tests (US4) — verification only; no production code

- [ ] T033 [P] [US4] Playwright at `gate-active-no-controls.spec.ts`: launch with `SAA_LAUNCH_AT=<future ISO>`, `page.goto('/coming-soon')`, `page.keyboard.press('Tab')`, assert `await page.evaluate(() => document.activeElement?.tagName)` is `"BODY"` (or an `<html>`/`<body>`-equivalent neutral target). Then assert `await page.locator('button').count() === 0` AND `await page.locator('a:not([rel~="canonical"])').count() === 0` | tests/e2e/prelaunch/gate-active-no-controls.spec.ts

**Checkpoint**: All four user stories complete and independently testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: CI matrix, onboarding, perf spot-check, and final verification gates. **T034 / T035 / T036 / T037 MUST ship in the same PR as T021–T024** (proxy wiring) — otherwise local dev breaks until every developer manually sets `SAA_LAUNCH_AT`.

- [ ] T034 [P] Add npm scripts: `"test:e2e:gate-active"` (runs only `tests/e2e/prelaunch/gate-active*.spec.ts` with `SAA_LAUNCH_AT=<future ISO>`); `"test:e2e:gate-disabled"` (runs the rest of the suite with `SAA_LAUNCH_AT=<past ISO>`); alias `"test:e2e"` → `"test:e2e:gate-disabled"` so existing local workflows still work | package.json
- [ ] T035 [P] Append `SAA_LAUNCH_AT` block to `.env.example` with the past/future split documented and an FR-009 fail-closed warning (set to a past timestamp to disable the gate; leaving unset keeps the gate active in every environment) | .env.example
- [ ] T036 [P] Update `ci.yml` E2E job to a 2-cell matrix: `gate-state ∈ {active, disabled}`, each cell injecting `SAA_LAUNCH_AT` accordingly via `env:`. Both must pass for merge. Existing unit-test job stays as one cell (Vitest covers both states via `vi.stubEnv`) | .github/workflows/ci.yml
- [ ] T037 [P] Add a "Pre-launch gate" subsection to `README.md` — flag `SAA_LAUNCH_AT` is required-or-fail-closed in every environment (production, dev, CI), link to plan.md, and call out the two test scripts | README.md
- [ ] T038 360 px viewport smoke (Playwright `gate-active.spec.ts` with `viewport: { width: 360, height: 640 }` block): navigate to `/coming-soon`, assert no horizontal scrollbar (`document.documentElement.scrollWidth <= window.innerWidth`), tiles still legible. Add a screenshot for manual review | tests/e2e/prelaunch/gate-active.spec.ts (extend T028 file)
- [ ] T039 Manual perf spot-check: with the production build (`npm run build && npm start`), run `curl -w '%{time_starttransfer}\n' -o /dev/null -s` against `/`, `/coming-soon`, and a whitelisted path with `SAA_LAUNCH_AT` set to past vs future (4 cells). Document numbers in PR description; target ≤ 5 ms p50 / ≤ 15 ms p99 added overhead vs gate-disabled baseline (TR-001 / SC-003). NOT gated by automated tests | (PR description)
- [ ] T040 Final verification matrix: `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npm run test:e2e:gate-disabled`, `npm run test:e2e:gate-active`. Confirm: existing vitest 184 + new ~20–25 tests green; Homepage Playwright 11/11 + Login regression 16/16 still green under gate-disabled (SC-005); new Playwright gate-active and gate-disabled specs green | (no file)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately.
- **Phase 2 (Foundation)**: Depends on Phase 1. **BLOCKS** all user-story phases. Pure logic + i18n; no proxy/route changes ship yet.
- **Phase 3 (US1 — countdown UI)**: Depends on Phase 2. Implements the destination route; can ship to dev for direct `/coming-soon` visit even before the gate is wired.
- **Phase 4 (US2 — proxy wiring)**: Depends on Phase 2 + Phase 3 (`/coming-soon` route MUST exist before proxy can redirect to it). Lands together with Phase 7 onboarding tasks (T034/T035/T036/T037) in a single PR — sequencing rule from plan.md.
- **Phase 5 (US3 — post-gate unreachable)**: Depends on Phase 3 + Phase 4 (route + proxy both wired).
- **Phase 6 (US4 — no controls)**: Depends on Phase 3 only (UI invariant; pure verification — no production code).
- **Phase 7 (Polish)**: T034–T037 ship with Phase 4. T038–T040 run last after all stories complete.

### Within Each User Story

- Logic before UI within the same story (gate decision before proxy wiring; AutoExit hook before mounting in PrelaunchScreen).
- Tests parallel with their target file (different test file = `[P]`).
- Story-level checkpoints gate the next phase.

### Parallel Opportunities

| Phase | Parallelizable tasks                                            |
| ----- | --------------------------------------------------------------- |
| 1     | T001 + T002 + T003 (different concerns)                          |
| 2     | T005 + T006 + T007 + T008 + T009 (independent files)             |
| 2     | T013 + T014 (same test file, but independent test cases — sequential commits OK) |
| 3 — US1 | T015 + T016 (different files); T018 + T019 + T020 (test files)  |
| 4 — US2 | T025 + T026 + T027 (test concerns split across files)            |
| 5 — US3 | T029 (logic) and T030 (UI) sequential; T031 + T032 parallel after |
| 6 — US4 | T033 single task; standalone                                     |
| 7     | T034 + T035 + T036 + T037 (different files, all parallel)       |

---

## Implementation Strategy

### MVP First (Recommended)

1. Phase 1 + Phase 2 (Setup + Foundation).
2. Phase 3 (US1) — visit `/coming-soon` directly works.
3. **STOP and VALIDATE**: navigate to `/coming-soon` in dev, see countdown render.
4. Phase 4 (US2) + Phase 7 onboarding (T034–T037) bundled — gate goes live.
5. **STOP and VALIDATE**: anon GET `/` redirects to `/coming-soon`; existing Homepage suite passes with `SAA_LAUNCH_AT=<past>`.
6. Phase 5 (US3) → Phase 6 (US4) → Phase 7 final verification (T038–T040).
7. Deploy.

### Incremental Delivery

PR 1 — Phases 1 + 2 (logic-only foundation; safe to merge alone).
PR 2 — Phases 3 + 4 + Phase 7 onboarding (route + proxy + env docs in one PR per the sequencing rule).
PR 3 — Phases 5 + 6 (post-gate handoff + no-controls regression).
PR 4 — Phase 7 final (perf check, viewport smoke, full verification).

---

## Notes

- Commit after each task or logical group; keep PRs scoped per the Incremental Delivery split.
- TDD rhythm (Constitution Principle V): write the failing test in the same commit that implements it, never the other way round. Vitest `vi.stubEnv` + `vi.resetModules()` is the recommended pattern for proxy integration tests that need different `LAUNCH_AT` states.
- The 4 Figma "Access control" test cases for this screen ("Login as a valid user", "Ensure user not logged in", etc.) are **superseded** by the auth-agnostic gate — covered by T028 (auth-agnostic invariant), not by per-route auth tests.
- `proxy.ts` continues to host the Login security-headers + `/api/auth/callback` rate-limit pipeline. Existing `tests/integration/login/proxy-headers.test.ts` and `proxy-rate-limit.test.ts` MUST remain green under `SAA_LAUNCH_AT=<past>` (gate-disabled CI cell).
- Mark tasks complete as you go: `- [x]`. Do NOT remove the file path or labels.
