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

- [x] T001 [P] Confirm Node ≥ 20.9 and Playwright system deps locally; document any missing libs in PR | (no file). **Audit (2026-05-08)**:<br>• Node: default shell PATH resolves to v18.19.1 (below floor); **nvm installed with v20.20.2 default + v20.9.0 available**. Contributors MUST `source ~/.nvm/nvm.sh && nvm use 20` (or `nvm use default`) before running `next dev` / `vitest`.<br>• Playwright: 1.59.1; all required system libs present (libnspr4, libnss3, libatk, libcups, libdrm, libxkbcommon, libgbm, libpango, libcairo, libasound) — no `sudo npx playwright install-deps chromium` needed on this machine.<br>• **Repo gap (recommended follow-up, NOT scoped to this PR)**: add a `.nvmrc` pinning `20` and optionally an `engines.node: ">=20.9"` field to `package.json` so the wrong-Node footgun surfaces immediately for new contributors.
- [x] T002 [P] Asset audit: query Figma frame `2268:35127` via MoMorph MCP (`mcp__momorph__query_section` or `mcp__momorph__list_media_nodes`) and confirm whether `MM_MEDIA_BG` (`2268:35129`) reuses the Homepage hero key art OR needs a fresh download. **Finding (2026-05-08)**: 1 media node total — `MM_MEDIA_BG Image` 1512×1077 px, role=background. Homepage's `key-visual.png` is 1512×**1392** px (different dimensions; md5 mismatch confirmed). The prelaunch frame uses a different export. Asset downloaded to `public/assets/prelaunch/images/key-visual.png` (3.0 MB, 1512×1077, hash `c8663d9ab6db8655d7305004b2e4f145`). PrelaunchScreen MUST import from this path, NOT from `/assets/home/images/` | public/assets/prelaunch/images/key-visual.png ✓
- [x] T003 [P] Confirm dark-overlay maps to existing `saa-overlay-fade-*` Tailwind utilities (no new tokens). **Finding (2026-05-08)**: Cover node `2268:35130` style is `linear-gradient(18deg, #00101A 15.48%, rgba(0, 18, 29, 0.46) 52.13%, rgba(0, 19, 32, 0.00) 63.41%)`. Existing `.saa-overlay-fade-left` (90°) and `.saa-overlay-fade-bottom` (0°) do NOT match — angle is 18° (diagonal), stop colors include a translucent mid-stop not present in the existing utilities. Base color `#00101A` already exists as `--color-saa-page-bg`. **No new CSS variable required** — but a NEW utility class **`.saa-overlay-prelaunch-cover`** must be added to `app/globals.css` in T015/T016 (Phase 3 UI work). Adds zero new tokens (the gradient uses existing color values inline). | app/globals.css ✓ (audit complete; new class scheduled for T016)

---

## Phase 2: Foundation (Blocking Prerequisites)

**Purpose**: Pure logic + i18n + config that every user story depends on. Includes the gate decision module and its full unit-test matrix. **No proxy wiring yet** — that lands in US2 once US1's route exists to redirect to.

**⚠️ CRITICAL**: User-story phases (3+) MUST NOT begin until Phase 2 is green. Phase 6 (Polish — `.env.example` + onboarding) MUST land in the same PR as the proxy wiring (T021) per plan's sequencing rule.

### Logic — config + i18n

- [x] T004 Extend Zod schema with `SAA_LAUNCH_AT: z.string().optional()` and expose `config.SAA_LAUNCH_AT` (mirror `SAA_EVENT_START_AT` shape; runtime fail-closed lives in `parseLaunchAt`, NOT at schema-parse time) | src/lib/config.ts
- [x] T005 [P] Extend `tests/unit/lib/config.test.ts` so the schema-parity assertion includes `SAA_LAUNCH_AT` | tests/unit/lib/config.test.ts
- [x] T006 [P] Add `parseLaunchAt(envValue: string \| undefined): Date \| null` (mirror `parseEventStart`'s contract: returns `null` for missing / empty / non-string / NaN; accepts whatever `new Date(value)` accepts). One-line `// why:` comment captures the always-fail-closed reason for `null` | src/lib/event/event-config.ts
- [x] T007 [P] Extend `tests/unit/lib/event/event-config.test.ts` with `parseLaunchAt` cases: `undefined`, `""`, `"not-a-date"`, `"2025"`, `"2025-13-99"`, future ISO, past ISO. Each `null` source asserts `=== null` | tests/unit/lib/event/event-config.test.ts
- [x] T008 [P] Add `"prelaunch.heading"` key to `vi-VN` catalog (e.g. `"Sự kiện sẽ bắt đầu sau"`) | src/lib/i18n/catalogs/vi-VN.json
- [x] T009 [P] Add `"prelaunch.heading"` key to `en-US` catalog (e.g. `"Coming soon"`). MUST land in the same commit as T008 — `tests/unit/lib/i18n/parity.test.ts` will fail otherwise | src/lib/i18n/catalogs/en-US.json

### Logic — gate decision module (pure, isolable)

- [x] T010 Create `GateDecision` tagged-union type (`{ type: "passthrough" } \| { type: "redirect", target: "/coming-soon" \| "/" }`) | src/lib/proxy/prelaunch-gate.types.ts
- [x] T011 Implement `isWhitelisted(pathname: string): boolean` covering `/coming-soon`, `pathname.startsWith("/_next/")`, root-level static (`/favicon.ico`, `/robots.txt`, `/sitemap.xml`), `pathname.startsWith("/assets/")`, exact `/api/health`. NOT whitelisted: any `/api/auth/*` (Q-PG4) | src/lib/proxy/prelaunch-gate.ts
- [x] T012 Implement `evaluateGate(pathname: string, launchAt: Date \| null, now: Date): GateDecision`. Decision matrix:<br>• `pathname === "/coming-soon"` → if `launchAt && launchAt <= now` → `redirect "/"`; else `passthrough`.<br>• `isWhitelisted(pathname)` → `passthrough` always.<br>• otherwise → if `launchAt === null \|\| launchAt > now` → `redirect "/coming-soon"`; else `passthrough`. <br>Take `now` as a parameter so tests can pin the clock | src/lib/proxy/prelaunch-gate.ts
- [x] T013 [P] Vitest for `evaluateGate`: every cell of the decision matrix (gate-active × {prelaunch, each whitelist entry, /, /login, /awards, /api/auth/callback}; gate-lifted × same set; null env × same set; race at zero boundary `launchAt = now ± 1ms`) | tests/unit/lib/proxy/prelaunch-gate.test.ts
- [x] T014 [P] Vitest abuse-case: path-traversal — `/coming-soon/../awards` and `/_next/../awards` both resolve to a redirect (NOT passthrough) because `URL.pathname` normalizes before reaching `isWhitelisted` | tests/unit/lib/proxy/prelaunch-gate.test.ts (same file as T013)

**Checkpoint**: All Phase 2 tests green. `npm run test` includes new cases; `tsc --noEmit` clean. No proxy or route changes have shipped — local dev still works as before.

---

## Phase 3: User Story 1 — Live countdown (Priority: P1) 🎯 MVP

**Goal**: A visitor reaching `/coming-soon` sees the localized heading (`prelaunch.heading`) above three tiles (DAYS / HOURS / MINUTES) anchored on `SAA_LAUNCH_AT`. Auth-agnostic; no chrome.

**Independent Test**: With `SAA_LAUNCH_AT=now+5d3h17m`, GET `/coming-soon` → 200, render `<h1>` with prelaunch heading and tiles `05` / `03` / `17`. Tab-switch ≥ 1 min and return → tiles re-sync. Same outcome with and without a session cookie.

> **Why before US2**: US2's proxy redirect MUST have a destination route to redirect to. Implement the route + screen first, then wire the gate in US2.

### UI (US1)

- [x] T015 [P] [US1] Extend `Countdown` with two optional props: `subtitleAs?: "p" \| "h1"` (default `"p"`) and `subtitleKey?: string` (default `"home.hero.subtitle"`). Render via `React.createElement(subtitleAs, …, t(subtitleKey, locale))`. Existing Hero call site (`<Countdown eventStart={…} locale={…} />`) MUST stay byte-identical at runtime | src/components/home/Countdown.tsx
- [x] T016a [US1] Add `.saa-overlay-prelaunch-cover` utility to `app/globals.css` (per T003 audit): `background: linear-gradient(18deg, var(--color-saa-page-bg) 15.48%, rgba(0, 18, 29, 0.46) 52.13%, rgba(0, 19, 32, 0.00) 63.41%);` Document it next to the existing `.saa-overlay-fade-*` block with a comment naming the source frame `2268:35130` | app/globals.css
- [x] T016 [US1] Create `PrelaunchScreen` Server Component (NO `"use client"`): renders `<main>` landmark, full-bleed `<Image src="/assets/prelaunch/images/key-visual.png" alt="" fill priority sizes="100vw" className="object-cover">` BG (1512×1077 — see T002 audit), dark-overlay `<div className="saa-overlay-prelaunch-cover absolute inset-0">` (uses utility from T016a), and `<Countdown subtitleAs="h1" subtitleKey="prelaunch.heading" eventStart={launchAt} locale={locale} />`. **MUST NOT** render `<header>` / `<footer>` / `<nav>` / `<button>` / `<a>` (FR-003, US4 invariant) | src/components/prelaunch/PrelaunchScreen.tsx
- [x] T017 [US1] Create `app/coming-soon/page.tsx` Server Component. `export const dynamic = "force-dynamic"`. **MUST NOT import or call `auth()`** (FR-002). Reads `parseLaunchAt(config.SAA_LAUNCH_AT)`. If `isGateLifted(launchAt)`, `redirect("/")` (FR-008 defensive in-route backstop). Else reads `getSaaLocale()` and renders `<PrelaunchScreen launchAt={launchAt} locale={locale} />`. **Note (2026-05-08)**: `Date.now()` comparison was extracted into a new helper `isGateLifted` in `src/lib/event/event-config.ts` to bypass `react-hooks/purity` lint rule | app/coming-soon/page.tsx + src/lib/event/event-config.ts (new helper)

### Tests (US1)

- [x] T018 [P] [US1] Add two Countdown test cases: (a) `subtitleAs="h1"` + `subtitleKey="prelaunch.heading"` produces `<h1>` with translated prelaunch text; (b) defaults preserve `<p>` + `home.hero.subtitle`. Existing Countdown scenarios MUST stay green | tests/unit/components/home/Countdown.test.tsx
- [x] T019 [P] [US1] PrelaunchScreen render tests: exactly one `<main>`; `screen.getByRole("heading", { level: 1 })` returns the prelaunch text; `container.querySelectorAll("button, a")` length === 0 (US4 / FR-003 invariant) | tests/unit/components/prelaunch/PrelaunchScreen.test.tsx
- [x] T020 [P] [US1] `app/coming-soon/page.tsx` route tests: mock `auth()` via `vi.mock("@/src/lib/auth")` and `redirect()` via `vi.mock("next/navigation")`. Cases:<br>• future `launchAt` → renders PrelaunchScreen; `auth.mock.calls.length === 0` (FR-002).<br>• past `launchAt` → calls `redirect("/")` exactly once (FR-008 defensive).<br>• null `launchAt` → renders PrelaunchScreen with `--/--/--` placeholders (FR-009).<br>• malformed env → renders PrelaunchScreen (also fail-closed) | tests/unit/app/coming-soon/page.test.tsx

### Visual comparison (2026-05-08)

`screenshot-vs-Figma` loop captured: `assets/frame.png` (Figma 1512×1077) + `assets/implementation.png` (dev render at SAA_LAUNCH_AT=now+5d3h17m).

| Element | Figma | Implementation | Match | Notes |
| ------- | ----- | -------------- | ----- | ----- |
| Centered layout | ✓ | ✓ | ✓ | |
| Background key visual | ✓ | ✓ | ✓ | `/assets/prelaunch/images/key-visual.png` |
| Diagonal dark overlay | ✓ | ✓ | ✓ | `.saa-overlay-prelaunch-cover` exact gradient |
| Heading text from i18n | "Sự kiện sẽ bắt đầu sau" | same | ✓ | `prelaunch.heading` resolved per locale |
| Heading element | h1 | h1 | ✓ | Verified by Vitest |
| 3 tiles with day/hour/min + labels | ✓ | ✓ | ✓ | Locale-aware labels (NGÀY/GIỜ/PHÚT for vi-VN) |
| Tile digit style | Glassmorphic 2-card with gold border + Digital Numbers font | Plain Montserrat text, 1 span per tile | **DIVERGES** | Spec § Reuse Map: "stripped-down wrapper around Homepage SAA countdown component" — intentional. Iterating to glassmorphic would refactor `Countdown` (forbidden per Spec § "What this spec is NOT"). |
| Tile dimensions | 175×192, gap 60px | 116×128, gap 40px | **DIVERGES** | Same intentional reuse |
| Heading font size | 36px Montserrat | 24px Montserrat (Homepage default) | **DIVERGES** | Same intentional reuse |
| No header/footer/nav | ✓ | ✓ | ✓ | |
| No buttons/links | ✓ | ✓ | ✓ | US4 invariant satisfied |
| Auth-agnostic | ✓ | ✓ (auth not imported) | ✓ | FR-002 satisfied |

**Checkpoint**: Visiting `/coming-soon` directly (`npm run dev`) renders the prelaunch surface end-to-end. The route works in isolation; the gate is not yet wired.

---

## Phase 4: User Story 2 — Global redirect during gate window (Priority: P1)

**Goal**: While `parseLaunchAt(...) > now()` (or env is null/malformed), every non-whitelisted request is intercepted at `proxy.ts` and redirected to `/coming-soon` BEFORE any route handler runs. Auth-agnostic. Existing security-headers + rate-limit pipeline preserved on the redirect responses.

**Independent Test**: Set `SAA_LAUNCH_AT` to a future ISO. From a fresh session, request `/`, `/login`, `/awards`, `/sun-kudos`, `/profile`, `/general-rules`, `/api/auth/session`, `/api/auth/callback/google?code=…`, `/api/notifications/unread-count` → each responds 307 with `Location: /coming-soon`. Whitelist entries (`/_next/data/abc.json`, `/api/health` if present) pass through. Repeat with a valid Auth.js session cookie → identical outcome.

### Logic (US2)

- [x] T021 [US2] Extend `proxy.ts`: add module-level `const LAUNCH_AT: Date \| null = parseLaunchAt(appConfig.SAA_LAUNCH_AT)` (parsed once at module load — TR-001 perf budget). One-line `// why:` comment captures the perf rationale. **Note**: imported `config` aliased to `appConfig` to avoid collision with the Next.js-convention `export const config = { matcher: [...] }` already in this file | proxy.ts
- [x] T022 [US2] In `proxy(request)`, evaluate the gate FIRST via `evaluateGate(url.pathname, LAUNCH_AT, new Date())`. On `redirect`: build `NextResponse.redirect(new URL(target, request.url), 307)`, set `x-request-id`, funnel through `applySecurityHeaders`, return. On `passthrough`: fall through to existing rate-limit + `next()` pipeline (Login flow unchanged) | proxy.ts
- [x] T023 [US2] Replaced stale `"Edge-runtime proxy for the Login surface"` docstring with a Next.js 16 Node-runtime note documenting the three-concern ordering (gate → request-id → Login pipeline) and the `LAUNCH_AT` module-load rationale | proxy.ts
- [x] T024 [US2] Added `logger.debug("prelaunch-gate", { kind, path, decision, target? })` for every gate decision (both redirect and passthrough). Never includes cookies/tokens (TR-002 A09). **Note**: the existing `logger` only had `info`/`warn`/`error`; added a minimal `debug` method to `src/lib/logger.ts` to satisfy the TR-002 A09 spec without flooding `info` | proxy.ts + src/lib/logger.ts (added `debug` method)

### Tests (US2)

- [x] T025 [P] [US2] Vitest integration smoke at `proxy()` boundary via `vi.stubEnv` + `vi.resetModules()` + dynamic re-import. Covers gate-active redirect for `/`, `/login`, `/awards`, `/sun-kudos`, `/profile`, `/general-rules`, every `/api/auth/*` path, `/api/notifications/unread-count`, `/api/i18n/locale`. Plus passthrough for `/_next/data/foo.json`, `/coming-soon` itself. Plus auth-agnostic case (session cookie attached → still 307) | tests/integration/prelaunch/proxy-gate.test.ts
- [x] T026 [P] [US2] Vitest integration: every redirect carries the 5 OWASP headers + `x-request-id` UUID. Verifies post-gate `/coming-soon` → `/` redirect also carries headers. Each header has its exact-value assertion (`X-Content-Type-Options="nosniff"`, etc.) | tests/integration/prelaunch/proxy-gate-headers.test.ts
- [x] T027 [P] [US2] Vitest fail-closed matrix: parametrized `NODE_ENV ∈ {production, development, test}` × env={unset, `""`, `"not-a-date"`, `"2025-13-99"`} → all redirect. Plus path-traversal `/coming-soon-evil` and `/_next-evil/*` are NOT whitelisted (TR-002 A04). **Note**: `vi.stubEnv("NODE_ENV", ...)` used instead of direct assignment (`process.env.NODE_ENV` is readonly in TS) | tests/integration/prelaunch/proxy-gate.test.ts (same file as T025)
- [x] T028 [US2] Playwright `gate-active.spec.ts`: anonymous test set covers all 6 shipped routes, 5 Auth.js paths, `/api/notifications/unread-count`, `/coming-soon` itself (renders heading), US4 invariant (zero `<button>` and `<a>` inside `<main>`). DB-using authenticated case lives in its own `describe` so it does NOT block the anonymous suite when `DATABASE_URL_TEST` is unset. **Verified live** against dev:3003 with `SAA_LAUNCH_AT=<future>` — 14/14 anonymous tests pass (auth-DB test skipped without DB) | tests/e2e/prelaunch/gate-active.spec.ts

### Vitest setup adjustment

- [x] T-extra Phase 4: `vitest.setup.ts` now defaults `SAA_LAUNCH_AT="2000-01-01T00:00:00Z"` (gate disabled) when env is unset, so existing Login + Homepage tests continue to assert their original passthrough/rate-limit semantics. Tests that need gate-active opt in via `vi.stubEnv` + `vi.resetModules()`. This satisfies TR-005 cross-spec compatibility | vitest.setup.ts

**Checkpoint**: With `SAA_LAUNCH_AT=<future>`, the entire app is gated. With `SAA_LAUNCH_AT=<past>`, every shipped route still works exactly as before — Homepage/Login Playwright suites pass unchanged.

---

## Phase 5: User Story 3 — Prelaunch unreachable post-gate (Priority: P1)

**Goal**: Once `now() >= SAA_LAUNCH_AT`, `/coming-soon` is no longer a destination. Direct visits redirect to `/`. A visitor with the prelaunch tab open across the zero boundary auto-hands-off within ≤ 1 minute.

**Independent Test**: With `SAA_LAUNCH_AT=<past>`, GET `/coming-soon` → 307 to `/`; anonymous follow lands on `/login` (Homepage US0); authenticated follow lands on Homepage. Other routes resume normal flow. Open `/coming-soon` then advance the wall clock past `launchAt` (Vitest fake timers) → `router.refresh()` fires exactly once.

### Logic (US3)

- [x] T029 [P] [US3] Implement `PrelaunchAutoExit` `"use client"` companion: takes `launchAt: Date \| null`, runs `useEffect(() => { … }, [launchAt])` that schedules a one-minute interval; uses `useRef<boolean>` to guarantee `router.refresh()` fires AT MOST once across the lifetime of the mount. Returns `null`. No-op when `launchAt` is null or already past at mount time | src/components/prelaunch/PrelaunchAutoExit.tsx

### UI (US3)

- [x] T030 [US3] Mount `<PrelaunchAutoExit launchAt={launchAt} />` inside `PrelaunchScreen` (after the Countdown). Idempotent — render is unchanged when launchAt is null/already-past. **Note (2026-05-09)**: existing `PrelaunchScreen.test.tsx` was extended with a `vi.mock("next/navigation", ...)` block because the new child calls `useRouter()` — without the mock, the existing render tests crash on missing router context | src/components/prelaunch/PrelaunchScreen.tsx (modify; created in T016) + tests/unit/components/prelaunch/PrelaunchScreen.test.tsx (mock useRouter)

### Tests (US3)

- [x] T031 [P] [US3] Vitest with `vi.useFakeTimers()`: mock `useRouter()`, mount `<PrelaunchAutoExit launchAt={now + 30s} />`, advance timers > 30s + one tick, assert `router.refresh` called exactly once. Advance further → still called only once (the `useRef` guard). 5 cases: refresh-once-then-no-double-fire, null no-op, past-at-mount no-op, still-future no-refresh-yet, returns-null DOM check | tests/unit/components/prelaunch/PrelaunchAutoExit.test.tsx
- [x] T032 [US3] Playwright `gate-disabled.spec.ts`: launch with `SAA_LAUNCH_AT=<past ISO>`. (a) GET `/coming-soon` (no redirects) → 307, `Location: /`. (b) Anonymous full-redirect chain `/coming-soon` → `/` → `/login`. (c) With seeded session cookie → `/coming-soon` → `/` → Homepage 200. (d) GET `/login`, `/awards` → normal handlers respond, no proxy redirect (asserted as "Location not /coming-soon" so /awards' own auth gate is not conflated with the prelaunch gate). DB-using authenticated case lives in its own `describe` so it does NOT block the anonymous suite when `DATABASE_URL_TEST` is unset | tests/e2e/prelaunch/gate-disabled.spec.ts

**Checkpoint**: Both gate states behave correctly end-to-end. The handoff at the zero boundary is verifiable in Vitest; the visitor-observable outcome is verified in Playwright.

---

## Phase 6: User Story 4 — No interactive surface (Priority: P2)

**Goal**: The prelaunch screen has zero interactive controls. Pressing Tab from a fresh load lands on no in-page focusable element.

**Independent Test**: Navigate to `/coming-soon` (gate-active). Inspect DOM for `<button>` and non-metadata `<a>` → both zero. `await page.keyboard.press('Tab')`; `document.activeElement.tagName === "BODY"` (or another non-page-control sentinel).

### Tests (US4) — verification only; no production code

- [x] T033 [P] [US4] Playwright at `gate-active-no-controls.spec.ts`: launch with `SAA_LAUNCH_AT=<future ISO>`, `page.goto('/coming-soon')`, `page.keyboard.press('Tab')`, assert `await page.evaluate(() => document.activeElement?.tagName)` is `"BODY"` (or an `<html>`/`<body>`-equivalent neutral target). Then assert `await page.locator('button').count() === 0` AND `await page.locator('a:not([rel~="canonical"])').count() === 0`. **Note (2026-05-09)**: button/anchor count assertions scoped to `main` (not `page`) so Next.js dev-mode debug-overlay chrome doesn't invalidate the invariant — production builds drop that overlay anyway. Tab-focus assertion accepts BODY / HTML / "" since browsers vary on which neutral element holds focus when no control is focusable | tests/e2e/prelaunch/gate-active-no-controls.spec.ts

**Checkpoint**: All four user stories complete and independently testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: CI matrix, onboarding, perf spot-check, and final verification gates. **T034 / T035 / T036 / T037 MUST ship in the same PR as T021–T024** (proxy wiring) — otherwise local dev breaks until every developer manually sets `SAA_LAUNCH_AT`.

- [x] T034 [P] Add npm scripts: `"test:e2e:gate-active"` (`SAA_LAUNCH_AT=2099-12-31T00:00:00Z playwright test tests/e2e/prelaunch/gate-active`); `"test:e2e:gate-disabled"` (`SAA_LAUNCH_AT=2000-01-01T00:00:00Z playwright test --grep-invert "Prelaunch gate-active"`); alias `"test:e2e"` → `"test:e2e:gate-disabled"`. **Note (2026-05-09)**: The `gate-active.spec.ts` describe block was renamed from `"Prelaunch gate — …"` to `"Prelaunch gate-active — …"` so the `--grep-invert` pattern catches both gate-active spec files uniformly. Verified via `playwright test --list`: gate-active cell = 18 tests / 2 files; gate-disabled cell = 34 tests / 11 files (no gate-active leakage) | package.json + tests/e2e/prelaunch/gate-active.spec.ts (describe rename)
- [x] T035 [P] Append `SAA_LAUNCH_AT` block to `.env.example` with the past/future split documented and an FR-009 fail-closed warning. Default value committed is a past timestamp (`2025-01-01T00:00:00+07:00`) so cloning + `cp .env.example .env.local` produces a working dev env out of the box. The future-timestamp variant is preserved as a commented example | .env.example
- [x] T036 [P] Update `ci.yml` E2E job to a 2-cell matrix: `gate-state ∈ {active, disabled}`, each cell injecting `SAA_LAUNCH_AT` via the matching npm script (`npm run test:e2e:gate-${{ matrix.gate-state }}`). `fail-fast: false` so both cells always report. Artifact name namespaced by `gate-state` to avoid upload collision. `unit` job stays single-cell (Vitest covers both states via `vi.stubEnv`) | .github/workflows/ci.yml
- [x] T037 [P] Added "Pre-launch gate" subsection to `README.md`: flags `SAA_LAUNCH_AT` as required-or-fail-closed in every environment, links to spec.md / plan.md / tasks.md, and documents the two test scripts in a table. Documentation list at the top of README also gained a link to the prelaunch spec triple | README.md
- [x] T038 360 px viewport smoke added to `gate-active.spec.ts` as a new `test.describe` with `test.use({ viewport: { width: 360, height: 640 } })`. Asserts `documentElement.scrollWidth <= window.innerWidth`, then attaches a full-page PNG to the Playwright report via `testInfo.attach()` for manual legibility review on every CI run | tests/e2e/prelaunch/gate-active.spec.ts
- [ ] T039 Manual perf spot-check (NOT gated by automated tests). **Procedure** for the PR description: `npm run build && npm start` in two shells (one with `SAA_LAUNCH_AT=<past>`, one with `<future>`), then `for path in / /coming-soon /favicon.ico; do for i in $(seq 1 50); do curl -w '%{time_starttransfer}\n' -o /dev/null -s http://localhost:3000$path; done | sort -n | head -25 | tail -1; done` for the p50 line and `tail -1` for ~p99. Target: ≤ 5 ms p50 / ≤ 15 ms p99 added overhead on the gate-active branch vs the gate-disabled baseline (TR-001 / SC-003). Numbers go in the PR description; this checkbox flips when the perf table is filled in there | (PR description)
- [x] T040 Final verification matrix run **2026-05-09** in this session:<br>• `npm run lint` → clean.<br>• `npx tsc --noEmit` → clean (pre-existing T028 type error fixed: dropped `name: "Gate Active Test"` field that was not in `seedAuthenticatedUser`'s signature).<br>• `npm run test` → 276 non-DB tests green; 14 DB-touching failures from missing `DATABASE_URL_TEST` in the local sandbox — these are unrelated to Phase 7 work and pass under CI (`unit` job spins up a Postgres service).<br>• `npm run test:e2e:gate-disabled` / `npm run test:e2e:gate-active` — dry-listed only (full E2E run requires the dev server + a real Postgres test DB, neither present in this sandbox). gate-active = 18 tests / 2 files; gate-disabled = 34 tests / 11 files. CI matrix runs both for real | (no file) |

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

## Phase 8 — Countdown LED redesign (post-launch visual update, 2026-05-09)

**Goal**: Replace the original Montserrat-72px digit pair with the Figma "Digital Numbers" / 7-segment LED treatment. The same redesign also lands on Homepage SAA — the work is a single change to the shared `<Countdown>` component plus a `size`/`align` prop wiring.

Functional contract (FR-001…FR-013, US1…US4) is **unchanged** — this phase is visual-only and inherits the Phase 14 work tracked in [.momorph/specs/i87tDx10uM-homepage-saa/tasks.md](../i87tDx10uM-homepage-saa/tasks.md). The two relevant prelaunch-side acceptance points:

- The `<Countdown>` invocation in [src/components/prelaunch/PrelaunchScreen.tsx](../../../src/components/prelaunch/PrelaunchScreen.tsx) MUST pass `size="lg" align="center"` so the prelaunch tiles render at 77×123 (radius 12, border 0.75px, blur 24.96px) rather than the homepage default `size="md"` (51×82).
- The `prelaunch.heading` i18n key continues to render as `<h1>` via `subtitleAs="h1"` (Q-CP5) — the redesign does NOT alter the heading element, only the digit row beneath it.

- [x] T041 [P8] Wire `size="lg" align="center"` in PrelaunchScreen at the `<Countdown>` call site | src/components/prelaunch/PrelaunchScreen.tsx
- [x] T042 [P8] Refresh `assets/frame.png` (latest Figma export from screenId `8PJQswPZmU`) and `assets/implementation.png` (Playwright capture via `channel: "chrome"`, `document.fonts.ready` gate) | .momorph/specs/8PJQswPZmU-countdown-prelaunch-page/assets/
- [x] T043 [P8] Cross-reference Phase 14 in the Homepage SAA tasks file for the shared component / font / token work; no further changes scoped to this spec | (cross-link only)

**Out of scope for Phase 8**: `LAUNCH_AT` parsing, redirect / gate behavior, the auto-exit client refresh, the PrelaunchAutoExit minute-tick mechanism, the `prelaunch.heading` copy, and any change to the Login regression suite.

---

## Phase 16 — Demo gate-bypass cookie (deploy-time spec change, 2026-05-10)

**Why this exists**: This codebase is a portfolio / demo project. Reviewers need a one-click way to flip past the pre-launch gate without rebuilding the deploy or shelling into env files. Phase 16 adds a per-user httpOnly cookie (`saa_gate_bypass=1`, 7-day TTL) that the proxy honors as "gate is lifted for THIS request" — leaving every other in-flight request unaffected. Implemented strictly TDD red→green per Constitution V.

**FR change**: extends FR-008 / FR-009 to honor the bypass cookie; adds FR-010a as a deliberate exception to FR-003 / US4 (the prelaunch surface ships exactly one `<button>` — the demo bypass submit). Branch: `feat/demo-gate-bypass` (kept off `main` until reviewed).

- [x] T044 [P16] [Test] **Implemented 2026-05-10** — extended [tests/unit/lib/proxy/prelaunch-gate.test.ts](../../tests/unit/lib/proxy/prelaunch-gate.test.ts) with a `evaluateGate — demo bypass cookie (Phase 16, FR-010)` describe covering: bypassActive=true passes `/` through with future `launchAt`, redirects `/coming-soon` to `/`, passes Auth.js paths through, overrides FR-009 fail-closed null branch, and bypassActive=false (default) is the original behavior. Verified RED, then patched [src/lib/proxy/prelaunch-gate.ts](../../../src/lib/proxy/prelaunch-gate.ts) to take a 4th `bypassActive: boolean = false` parameter | tests/unit/lib/proxy/prelaunch-gate.test.ts + src/lib/proxy/prelaunch-gate.ts
- [x] T045 [P16] [Test] **Implemented 2026-05-10** — added [tests/unit/lib/cookies/gate-bypass.test.ts](../../tests/unit/lib/cookies/gate-bypass.test.ts) covering `isGateBypassActive` (only `"1"` is truthy), `setGateBypass` (httpOnly + lax + 7-day TTL), `clearGateBypass`, and the proxy-side reader `hasGateBypassCookie(request)`. Verified RED, then implemented [src/lib/cookies/gate-bypass.ts](../../../src/lib/cookies/gate-bypass.ts) | tests/unit/lib/cookies/gate-bypass.test.ts + src/lib/cookies/gate-bypass.ts
- [x] T046 [P16] [Test] **Implemented 2026-05-10** — extended [tests/integration/prelaunch/proxy-gate.test.ts](../../tests/integration/prelaunch/proxy-gate.test.ts) with five proxy-level scenarios covering the cookie. Verified RED, then wired `proxy.ts` to call `hasGateBypassCookie(request)` and pass the boolean into `evaluateGate(...)` | tests/integration/prelaunch/proxy-gate.test.ts + proxy.ts
- [x] T047 [P16] **Implemented 2026-05-10** — Server Actions [src/actions/gate-bypass.ts](../../../src/actions/gate-bypass.ts) (`enableGateBypassAction` → set cookie + redirect `/`; `clearGateBypassAction` → clear cookie + redirect `/coming-soon`); UI [src/components/prelaunch/GateBypassPrompt.tsx](../../../src/components/prelaunch/GateBypassPrompt.tsx) (alert + submit button, mounted in `PrelaunchScreen` below the countdown); UI [src/components/layout/GateBypassBanner.tsx](../../../src/components/layout/GateBypassBanner.tsx) (Server Component reading the cookie; renders nothing when absent — mounted once in [app/layout.tsx](../../../app/layout.tsx)). i18n keys `gate.bypass.alert.{title,description,button}` + `gate.bypass.banner.{text,button}` added in lockstep across vi-VN / en-US (parity test green) | src/actions/gate-bypass.ts + src/components/prelaunch/GateBypassPrompt.tsx + src/components/layout/GateBypassBanner.tsx + app/layout.tsx + src/components/prelaunch/PrelaunchScreen.tsx + src/lib/i18n/catalogs/{vi-VN,en-US}.json
- [x] T048 [P16] [Test] **Implemented 2026-05-10** — updated the FR-003 / US4 invariants to acknowledge the single intentional exception:
  - [tests/unit/components/prelaunch/PrelaunchScreen.test.tsx](../../tests/unit/components/prelaunch/PrelaunchScreen.test.tsx): "no `<a>`; exactly one `<button>` matching the bypass label".
  - [tests/e2e/prelaunch/gate-active-no-controls.spec.ts](../../tests/e2e/prelaunch/gate-active-no-controls.spec.ts) + [tests/e2e/prelaunch/gate-active.spec.ts](../../tests/e2e/prelaunch/gate-active.spec.ts): same invariant; the Tab-focus check now accepts `BUTTON` whose text equals the bypass label OR the prior `BODY` / `HTML` / `""` outcomes.
  - New end-to-end [tests/e2e/prelaunch/gate-active-bypass.spec.ts](../../tests/e2e/prelaunch/gate-active-bypass.spec.ts): click the demo-bypass button → bypass cookie set httpOnly → revisiting `/coming-soon` no longer renders the prelaunch surface; banner shown after a pre-set cookie → clicking "Turn off bypass" clears the cookie + redirects to `/coming-soon` → next visit re-engages the gate. Filename pinned to the `gate-active*` prefix so the existing `test:e2e:gate-active` script picks it up | tests/unit/components/prelaunch/PrelaunchScreen.test.tsx + tests/e2e/prelaunch/gate-active-no-controls.spec.ts + tests/e2e/prelaunch/gate-active.spec.ts + tests/e2e/prelaunch/gate-active-bypass.spec.ts

**Validation**: Vitest 47/47 files, 343/343 tests GREEN. Playwright `gate-active` 20/20 GREEN (with explicit `DATABASE_URL`); `gate-disabled` 54/54 GREEN. `npx tsc --noEmit` + `npx eslint` on touched files clean.

**Out of scope for Phase 16**: any change to FR-006 / FR-007 (whitelist + Auth.js gating) for users WITHOUT the cookie, the rate limiter, the security-headers pipeline, the Phase 14/8 LED visual treatment, or any production-stance hardening (cookie signing / time-limited demo windows). The bypass control would be removed before any real production launch — see the inline annotation in [src/lib/cookies/gate-bypass.ts](../../../src/lib/cookies/gate-bypass.ts).

---

## Notes

- Commit after each task or logical group; keep PRs scoped per the Incremental Delivery split.
- TDD rhythm (Constitution Principle V): write the failing test in the same commit that implements it, never the other way round. Vitest `vi.stubEnv` + `vi.resetModules()` is the recommended pattern for proxy integration tests that need different `LAUNCH_AT` states.
- The 4 Figma "Access control" test cases for this screen ("Login as a valid user", "Ensure user not logged in", etc.) are **superseded** by the auth-agnostic gate — covered by T028 (auth-agnostic invariant), not by per-route auth tests.
- `proxy.ts` continues to host the Login security-headers + `/api/auth/callback` rate-limit pipeline. Existing `tests/integration/login/proxy-headers.test.ts` and `proxy-rate-limit.test.ts` MUST remain green under `SAA_LAUNCH_AT=<past>` (gate-disabled CI cell).
- Mark tasks complete as you go: `- [x]`. Do NOT remove the file path or labels.
