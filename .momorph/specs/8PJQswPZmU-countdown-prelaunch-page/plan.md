# Implementation Plan: Countdown — Prelaunch Page (Global Pre-Launch Gate)

**Frame**: `8PJQswPZmU-countdown-prelaunch-page`
**Date**: 2026-05-08
**Spec**: `.momorph/specs/8PJQswPZmU-countdown-prelaunch-page/spec.md`

---

## Summary

Ship a global pre-launch gate. Until `now() >= SAA_LAUNCH_AT`, **every** non-whitelisted request to the SAA app is redirected by `proxy.ts` to `/coming-soon`, where a thin Server Component renders the existing `Countdown` component (extended with a `subtitleAs="h1"` opt-in) anchored on the new env var `SAA_LAUNCH_AT`. Once the gate lifts, `/coming-soon` redirects to `/` and every other route resumes its shipped behavior. The gate is **auth-agnostic** — the proxy never reads the session.

**Proxy reality** (spec corrected 2026-05-08 to match codebase): [`proxy.ts`](../../../proxy.ts) **already exists** at the project root and ships the Login security-headers + `/api/auth/callback` rate-limit pipeline (per Login spec TR-007). This plan **extends** that file by inserting a gate-evaluation step **before** the existing pipeline. Redirect responses still flow through the existing `applySecurityHeaders` helper so CSP/HSTS/etc. attach to 307s (TR-002 A05) and `x-request-id` is stamped on every response. The existing rate-limit branch is reachable only when the gate is lifted (Auth.js paths are not whitelisted per Q-PG4) — no behavioral change to Login's post-gate operation.

---

## Technical Context

**Language/Framework**: TypeScript 5 (strict) / Next.js 16.2.4 (App Router)
**Primary Dependencies**: React 19, Tailwind CSS v4, Auth.js (NextAuth), Zod 4 (config)
**Database**: PostgreSQL via Prisma — **not used by this feature** (no entities, no queries)
**Testing**: Vitest 4 + jsdom + RTL (unit/integration), Playwright 1.59 (E2E)
**State Management**: None (Server Component reads env via `config`; client-side state lives inside `Countdown`)
**API Style**: N/A (no endpoints; proxy redirects only)
**Runtime**: Next.js 16 `proxy.ts` runs on the **Node.js runtime** (Edge is unsupported in Next.js 16 `proxy`; the comment block in the current [proxy.ts](../../../proxy.ts) still says "Edge-runtime" — that string is stale and will be corrected as part of this work).

---

## Constitution Compliance Check

*GATE: Must pass before implementation can begin. Each item maps to a principle in [.momorph/constitution.md](../../constitution.md) (v1.1.1).*

- [x] **Principle I — Clean Code & Readable Structure**: New files live under their canonical folders (`app/coming-soon/page.tsx`, `src/components/prelaunch/PrelaunchScreen.tsx`, `src/lib/event/event-config.ts` extension, `proxy.ts` modules). Naming follows kebab-case for non-component modules, PascalCase for the React component. Functions stay ≤ 40 lines (`isWhitelisted`, `evaluateGate`, `parseLaunchAt`). No comments unless they capture a non-obvious *why* (e.g., the always-fail-closed rationale on `parseLaunchAt === null`).
- [x] **Principle II — Stack Best Practices**: Prelaunch route is a **Server Component** (no `"use client"`), reads env through the typed `config` module (no direct `process.env`), no business logic in `app/coming-soon/page.tsx`. The `Countdown` component remains the single owner of countdown rendering — extended via additive props, not forked. Tailwind tokens only (no raw colors); reuses `text-saa-page-fg` etc. already defined for Homepage.
- [x] **Principle III — Platform-Appropriate UI Patterns**: Heading rendered as `<h1>` (US4 + a11y); `<main>` landmark; viewport ≥ 360 px (full-bleed image scales — verify in Phase 4); WCAG AA contrast already satisfied by the shipped `Countdown` styling on Homepage; no animations (per-minute value swap), so `prefers-reduced-motion` is vacuously met. Navigation is sourced from [.momorph/SCREENFLOW.md](../../SCREENFLOW.md) "Screen Details — Countdown - Prelaunch page".
- [x] **Principle IV — OWASP Secure Coding**: Threat model in next subsection. `SAA_LAUNCH_AT` is a non-secret display value; **MUST NOT** be `NEXT_PUBLIC_*`-prefixed. Always-fail-closed env handling (FR-009) closes A04. Whitelist is exact-match only — no regex with backreferences (A04). Existing proxy security headers (CSP / HSTS / `X-Content-Type-Options` / `Referrer-Policy` / `X-Frame-Options`) MUST continue to apply to redirect responses (A05). Logging at `debug` level only (A09) — every request hits the proxy.
- [x] **Principle V — Test-Driven Development**: Each FR has a corresponding failing test before implementation (see Integration Testing Strategy). Vitest covers `parseLaunchAt`, gate evaluation, and the prelaunch route component; Playwright covers gate-active and gate-disabled regression matrix. No `.only` / `.skip`; both new CI jobs added.

### Spec → Plan Coverage Trace

Every FR / TR / US in spec.md is mapped below. A developer reading only this plan + constitution can implement without reopening spec.md.

| Spec item | Plan owner | Verification |
| --------- | ---------- | ------------ |
| **US1** Live countdown | Phase 4 (PrelaunchScreen + route) | Vitest `prelaunch-screen.test.tsx`; Playwright `gate-active.spec.ts` |
| **US2** Global redirect | Phase 2 (gate logic) + Phase 3 (proxy wire) | Vitest `prelaunch-gate.test.ts`; integration `proxy-gate.test.ts`; Playwright `gate-active.spec.ts` |
| **US3** Prelaunch unreachable post-gate | Phase 3 (proxy `/coming-soon`→`/`) + Phase 4 (defensive in-route `redirect("/")`) + Phase 5 (auto-exit on tab-open zero crossing) | Integration `proxy-gate.test.ts`; Playwright `gate-disabled.spec.ts` |
| **US4** No interactive surface | Phase 4 (PrelaunchScreen omits header/footer/nav/buttons/links) | Vitest `prelaunch-screen.test.tsx`; Playwright `gate-active-no-controls.spec.ts` |
| **FR-001** Render `/coming-soon` while gate active | Phase 4 — `app/coming-soon/page.tsx` + PrelaunchScreen | Vitest + Playwright |
| **FR-002** Auth-agnostic | Phase 4 — route does NOT import or call `auth()` | Vitest spy on `auth` mock asserts call count = 0 |
| **FR-003** No header/footer/nav/CTA | Phase 4 — PrelaunchScreen renders `<main>` only | Vitest + Playwright `gate-active-no-controls.spec.ts` |
| **FR-004** Tile arithmetic + zero-pad | Existing `Countdown.computeParts` + `pad2` (no change) | Existing Countdown test (unchanged) |
| **FR-005** Minute-tick + visibilitychange resync | Existing `Countdown` (no change) | Existing Countdown test (unchanged) |
| **FR-006** Global gate at proxy layer | Phase 2 + Phase 3 — `evaluateGate` consulted before existing proxy pipeline | Integration `proxy-gate.test.ts` covers full decision matrix |
| **FR-007** Whitelist | Phase 2 — `isWhitelisted(pathname)` + matcher audit | Integration tests one-per-whitelist-entry |
| **FR-008** Post-gate redirect of `/coming-soon` | Phase 3 (proxy authoritative) + Phase 4 (defensive in-route) | Integration + Playwright |
| **FR-009** Always fail closed | Phase 1 — `parseLaunchAt` returns `null` for missing/empty/malformed; Phase 2 — `null` flows into "gate active" branch | Vitest cases for each `null` source × each `NODE_ENV` |
| **FR-010** Heading from `prelaunch.heading` | Phase 1 (catalog) + Phase 4 (`subtitleKey` prop) | Catalog parity test + Vitest render test |
| **FR-011** Unit labels from existing keys | Existing Countdown (no change) | Existing test |
| **TR-001** Perf budget + Node runtime | Phase 3 — `parseLaunchAt` runs once at module load; gate is pure compare | Manual perf check in PR review (no DB/fetch); add a brief comment in `proxy.ts` explaining the budget |
| **TR-002** A01/A02/A04/A05/A09 | Threat model below + Phase 3 — redirects flow through `applySecurityHeaders` | Integration `proxy-gate-headers.test.ts` |
| **TR-003** Env contract | Phase 1 — Zod schema gains `SAA_LAUNCH_AT: z.string().optional()`; Phase 6 — `.env.example` documents both modes | Lint/build still passes without `.env.local` populated |
| **TR-004** Test coverage | Integration Testing Strategy section | All listed |
| **TR-005** Cross-spec compat | Phase 6 — CI matrix split + onboarding doc | Existing Homepage/Login Playwright suites pass with `SAA_LAUNCH_AT=<past>` |
| **SC-001** All FR/TR pass automated tests | Phase 7 verification gates | `npm run lint` + `tsc --noEmit` + Vitest + both Playwright modes |
| **SC-002** Visual fidelity | Implementation-time `momorph.implement-ui` screenshot loop | Manual at implementation; not in this plan's tests |
| **SC-003** Perf | Implementation-time spot-check via curl `time_starttransfer` and Lighthouse if needed; not gated by automated tests in this PR | Documented in PR description |
| **SC-004** Operational fail-closed across `NODE_ENV` | FR-009 coverage above | Vitest matrix |
| **SC-005** Existing suites green with gate disabled | Phase 6 CI matrix | Re-run of vitest 184 + Homepage 11 + Login 16 |

**Threat model summary** *(Principle IV — A04)*:

- **Trust boundaries**:
  - Operator-controlled env var `SAA_LAUNCH_AT` (single source of truth for the gate decision).
  - Server wall clock (`new Date()`).
  - Inbound HTTP request (untrusted; URL path is user-controlled).
- **Sensitive data handled**: None on the prelaunch surface. The gate intentionally does NOT read the session cookie — the proxy never touches Auth.js state.
- **Abuse cases to test**:
  1. **Path-traversal whitelist bypass**: requests like `/coming-soon/../awards` or `/_next/../awards` MUST resolve to a redirect, not a pass-through. Mitigation: compare against the *normalized* `URL.pathname` (Next.js already normalizes), use `pathname.startsWith("/_next/")` not loose substring matches.
  2. **Crafted Auth.js path during gate**: a request to `/api/auth/callback/google?code=…` during the gate MUST redirect, not complete OAuth (Q-PG4 resolution).
  3. **Stale session post-gate**: a session cookie issued before gate-disable MUST continue to work post-gate-lift without re-auth (proxy never invalidates sessions).
  4. **Missing / malformed env**: every `NODE_ENV` MUST fail closed (FR-009). Tested with `null`, `""`, `"not-a-date"`, `"2025"`, `"2025-13-99"`.
  5. **Race at the zero boundary**: server compares `Date.now()` once per request. Subsequent requests resolve consistently. No special-case logic.
  6. **Whitelist-driven leak**: any new whitelist entry is an explicit FR-007 amendment with security review.

**Violations (if any)**:

| Principle | Violation                                              | Justification                                                                                                                                                                                                          | Alternative Rejected                                                                                                                                                          |
| --------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| —         | None. Spec has no FR/TR that requires bending the constitution. | —                                                                                                                                                                                                                  | —                                                                                                                                                                            |

---

## Architecture Decisions

### Frontend Approach

- **Component Structure**: Reuse the shipped [`Countdown`](../../../src/components/home/Countdown.tsx) as the only foreground content. Wrap it in a tiny **PrelaunchScreen** Server Component placed under `src/components/prelaunch/PrelaunchScreen.tsx` so the route file stays a thin shell. Atomic-design slot: PrelaunchScreen = "page template", Countdown = "molecule", tile = "atom" (already shipped).
- **Styling Strategy**: Tailwind utilities + existing tokens (`bg-saa-page`, `text-saa-page-fg`). Background image via `next/image` with `fill priority sizes="100vw"` (same pattern as Homepage hero). No new tokens.
- **Data Fetching**: None — Server Component reads `config.SAA_LAUNCH_AT` and `getSaaLocale()` synchronously per request (the cookie read is async but a single `await`). Marked `export const dynamic = "force-dynamic"` so each request re-evaluates and post-gate redirects fire instantly (no stale ISR cache serving prelaunch markup after launch).

### Backend Approach

- **API Design**: N/A — the prelaunch route serves no API. The proxy itself returns 307 redirects but does not respond with structured data.
- **Data Access**: N/A — no Prisma access from the prelaunch route or from the gate. The gate is a **pure compare** of `config.SAA_LAUNCH_AT` (parsed once at module load) against `Date.now()`.
- **Validation**: Zod schema in [src/lib/config.ts](../../../src/lib/config.ts) gains `SAA_LAUNCH_AT: z.string().optional()` (mirrors `SAA_EVENT_START_AT`). Runtime fail-closed lives in `parseLaunchAt` — kept out of the Zod parse step so `next build` keeps working without a populated `.env.local` (TR-003).

### Integration Points

- **Existing Services**:
  - [`Countdown`](../../../src/components/home/Countdown.tsx) — **EXTENDED** with optional `subtitleAs?: "p" | "h1"` (default `"p"`) and optional `subtitleKey?: string` (default `"home.hero.subtitle"`) so the prelaunch route can opt into `<h1>` + `prelaunch.heading` without touching Homepage's render tree. Surgical change; one new Vitest case covers each branch. **Phase 8 visual redesign (2026-05-09)** further extends the component with `size?: "md" \| "lg"` (default `"md"`) + `align?: "start" \| "center"` (default `"start"`); the prelaunch call site passes `size="lg" align="center"` so each digit renders inside its own 77×123 glassmorphic LED tile (DSEG7-Classic font, golden border, white→white-10% gradient under `backdrop-filter: blur(24.96px)`). Functional contract is unchanged — see Phase 14 in [.momorph/specs/i87tDx10uM-homepage-saa/tasks.md](../i87tDx10uM-homepage-saa/tasks.md) for the shared component / font / token work.
  - [`getSaaLocale`](../../../src/lib/cookies/saa-locale.ts) — **REUSED** as-is.
  - [`t` / catalogs](../../../src/lib/i18n/index.ts) — **EXTENDED** with `prelaunch.heading` in BOTH `vi-VN` and `en-US`. The catalog parity test enforces lockstep.
  - [`config`](../../../src/lib/config.ts) — **EXTENDED** with `SAA_LAUNCH_AT`.
  - [`parseEventStart`](../../../src/lib/event/event-config.ts) module — **EXTENDED** with a sibling `parseLaunchAt(envValue)` (returns `Date | null` with the same semantics; co-located so both event-config helpers live in one file).
  - [`proxy.ts`](../../../proxy.ts) — **EXTENDED**: a new gate-evaluation step runs **before** the existing security-headers / rate-limit logic. The gate can short-circuit with a 307 redirect; otherwise the request flows through the existing pipeline unchanged.
- **Shared Components**: Background key art reuses Homepage's `key-visual` family. If the prelaunch frame uses a different asset variant, fetch via `get_media_files` at implementation time and place under `public/assets/prelaunch/images/`.
- **API Contracts**: None.

---

## Project Structure

### Documentation (this feature)

```text
.momorph/specs/8PJQswPZmU-countdown-prelaunch-page/
├── spec.md              # Feature specification (already written)
├── plan.md              # This file
├── research.md          # OPTIONAL — skipped; codebase context fits inline (see Integration Points)
└── tasks.md             # NEXT (momorph.tasks)
```

### Source Code (affected areas)

```text
# Frontend
app/
├── coming-soon/
│   └── page.tsx                    # NEW — Server Component; FR-001/FR-002/FR-008
src/components/
├── home/Countdown.tsx              # MODIFIED — adds optional subtitleAs + subtitleKey props
└── prelaunch/
    └── PrelaunchScreen.tsx         # NEW — page-level template (background, overlay, Countdown)

# Lib / config
src/lib/
├── config.ts                       # MODIFIED — adds SAA_LAUNCH_AT to Zod schema + export
├── event/event-config.ts           # MODIFIED — adds parseLaunchAt(envValue)
├── i18n/catalogs/vi-VN.json        # MODIFIED — adds prelaunch.heading
└── i18n/catalogs/en-US.json        # MODIFIED — adds prelaunch.heading

# Proxy
proxy.ts                            # MODIFIED — adds gate evaluation BEFORE existing pipeline
src/lib/proxy/
├── prelaunch-gate.ts               # NEW — pure isGateActive(), isWhitelisted(), redirect helpers
└── prelaunch-gate.types.ts         # NEW — GateDecision type

# Tests (Vitest)
tests/unit/
├── lib/event/event-config.test.ts                     # MODIFIED — adds parseLaunchAt cases (extend existing file; co-locates with parseEventStart tests)
├── lib/proxy/prelaunch-gate.test.ts                   # NEW (whitelist + decision matrix)
├── lib/config.test.ts                                 # MODIFIED — add SAA_LAUNCH_AT to the Zod-schema parity assertion (existing file already covers SAA_EVENT_START_AT)
├── lib/i18n/parity.test.ts                            # NO CHANGE — automatically covers prelaunch.heading once both catalogs are updated
├── components/home/Countdown.test.tsx                 # MODIFIED — add subtitleAs="h1" + subtitleKey="prelaunch.heading" cases
├── components/prelaunch/PrelaunchScreen.test.tsx      # NEW — semantic, no-chrome, no-auth
├── components/prelaunch/PrelaunchAutoExit.test.tsx    # NEW — fake-timer asserts router.refresh() fires once at zero crossing
└── app/coming-soon/page.test.tsx                      # NEW — defensive in-route redirect, force-dynamic, auth() not called
tests/integration/
└── prelaunch/
    ├── proxy-gate.test.ts          # NEW — full proxy() decision matrix (small smoke set; rest exercised via evaluateGate unit test)
    └── proxy-gate-headers.test.ts  # NEW — security headers + x-request-id preserved on 307s

# Tests (Playwright)
tests/e2e/prelaunch/
├── gate-active.spec.ts             # NEW — every shipped route → /coming-soon
├── gate-disabled.spec.ts           # NEW — /coming-soon → / + downstream
└── gate-active-no-controls.spec.ts # NEW — Tab traversal lands on nothing

# Config / CI
.env.example                        # MODIFIED — document SAA_LAUNCH_AT (past = disabled, future = active)
playwright.config.ts                # NO CHANGE (env injected per script via package.json)
package.json                        # MODIFIED — adds test:e2e:gate-active / test:e2e:gate-disabled scripts; default test:e2e aliases to test:e2e:gate-disabled
.github/workflows/ci.yml            # MODIFIED — matrix job runs both gate states (single workflow file in repo today)
README.md                           # MODIFIED — onboarding flag for required SAA_LAUNCH_AT
```

---

## Implementation Strategy

### Phase Breakdown

> **Sequencing rule (load-bearing)**: Phase 1 (env + parser + i18n) and Phase 2 (pure gate logic) MUST land with green tests *before* Phase 3 wires `proxy.ts`. If Phase 3 commits without `SAA_LAUNCH_AT` documented in `.env.example` AND set in every developer's `.env.local`, local dev will fail closed and every page load will redirect to `/coming-soon`. Phase 6 (onboarding doc) MUST land in the same PR as Phase 3.

**Phase 0 — Asset Preparation**

- Inspect Figma frame `2268:35127` via `mcp__momorph__query_section` / `mcp__momorph__list_media_nodes`. The background appears to reuse Homepage hero key art (`MM_MEDIA_BG`); confirm hash equality.
  - If identical → import the existing `public/assets/home/images/key-visual.png` from the prelaunch screen (no duplicate asset).
  - If different → `get_media_files` and save under `public/assets/prelaunch/images/`.
- Confirm dark cover overlay maps to existing `saa-overlay-fade-*` utilities or needs a fresh CSS variable. Prefer reuse.

**Phase 1 — Foundation (env + parser + i18n)**

1. Extend [src/lib/config.ts](../../../src/lib/config.ts) Zod schema with `SAA_LAUNCH_AT: z.string().optional()` and expose via `config.SAA_LAUNCH_AT`. *Failing tests first*: parity test for `prelaunch.heading`, unit test for `parseLaunchAt`.
2. Add `parseLaunchAt(envValue): Date | null` to [src/lib/event/event-config.ts](../../../src/lib/event/event-config.ts) (mirror `parseEventStart`'s contract). Unit-test future / past / null / `""` / malformed.
3. Add `prelaunch.heading` to BOTH `vi-VN.json` and `en-US.json` catalogs. The parity test in [tests/unit/lib/i18n/parity.test.ts](../../../tests/unit/lib/i18n/parity.test.ts) enforces lockstep — verify it fails when added to one catalog only, then green when added to both.

**Phase 2 — Gate logic (pure, isolable)** *(US2 + US3 backbone, P1)*

1. Create `src/lib/proxy/prelaunch-gate.ts` exporting:
   - `evaluateGate(request: NextRequest, launchAt: Date | null): GateDecision` returning a tagged union (`{ type: "passthrough" } | { type: "redirect", target: "/coming-soon" | "/" }`).
   - `isWhitelisted(pathname): boolean` for the FR-007 set.
2. Whitelist contents (exact-match where possible):
   - `/coming-soon` (and any `/coming-soon/...` subpaths if added later — currently only the root).
   - `/_next/*` (prefix match).
   - `/favicon.ico` and other root-level static files (`/robots.txt`, `/sitemap.xml` if added).
   - `/assets/*` (Next.js may rewrite `/public/*` to `/assets/*`; the existing matcher already excludes `assets`).
   - `/api/health` is *reserved* (FR-007) but **not yet a route** — handler doesn't exist; whitelist entry stays defined so adding a handler later does not require a proxy diff.
   - Auth.js paths (`/api/auth/*`) **NOT whitelisted** (Q-PG4 resolved).
3. Vitest coverage for `evaluateGate`: every cell of the FR-006 decision matrix (gate-active × {prelaunch, whitelist, other} ; gate-lifted × {prelaunch, whitelist, other} ; null env × {…}).

**Phase 3 — Wire gate into `proxy.ts`** *(US2 + US3 surface, P1)*

1. In [proxy.ts](../../../proxy.ts), parse `config.SAA_LAUNCH_AT` once at module load via `parseLaunchAt` (perf budget — TR-001). Store the result in a module-level `const LAUNCH_AT: Date | null`.
2. Inside `proxy(request)`, evaluate the gate **first**. If `evaluateGate` returns `{ type: "redirect", target }`, build `NextResponse.redirect(new URL(target, request.url), 307)`, set `x-request-id` (`crypto.randomUUID()`), then funnel through the existing `applySecurityHeaders` helper so CSP / HSTS / `X-Content-Type-Options` / `Referrer-Policy` / `X-Frame-Options` attach to the redirect (A05). Return.
3. If the gate is pass-through (route is whitelisted OR gate is lifted), fall through to the existing logic (rate-limit branch on `/api/auth/callback`, then `NextResponse.next()` with security headers). The existing pipeline stays byte-identical.
4. Audit the proxy `config.matcher`. Today: `"/((?!_next/static|_next/image|favicon.ico|assets).*)"` — a negative lookahead that excludes paths starting with those prefixes. Implications:
   - `/_next/static/*`, `/_next/image/*`, `/favicon.ico`, `/assets/*` **never reach `proxy()`** — naturally satisfies their FR-007 whitelist entry without any code branch.
   - `/_next/data/*` and other `_next` traffic DO reach `proxy()` — `evaluateGate` MUST treat any `pathname.startsWith("/_next/")` as whitelisted (FR-007 broader than the matcher).
   - All `/api/*` paths reach `proxy()` — confirms the gate covers Auth.js (`/api/auth/*`) and notifications (`/api/notifications/*`) as required.
   - **No matcher change required** by this work. If a future spec adds `/api/health`, no proxy diff is needed because the whitelist entry is already defined.
5. Fix the stale `"Edge-runtime"` docstring at the top of `proxy.ts`; in Next.js 16 `proxy.ts` runs on the Node.js runtime (Edge unsupported). Add a one-line `// why:` comment on the new module-level `LAUNCH_AT` const explaining it's parsed once for the TR-001 budget.
   - **A09 logging**: emit one `logger.debug` line per gate decision via the existing [`logger`](../../../src/lib/logger.ts) helper — fields `{ kind: "prelaunch-gate", path: url.pathname, decision: "redirect"|"passthrough", target?: "/coming-soon"|"/" }`. **Never** include cookies or session tokens (A09). The current proxy already notes that AsyncLocalStorage `requestContext` cannot be populated from the proxy until a route-level bridge ships (existing follow-up); the gate's debug logs inherit that limitation — `request_id` shows as `(unset)` in logger output but the response header carries the correlation key.
6. Vitest integration tests under `tests/integration/prelaunch/`:
   - `proxy-gate.test.ts` — feed `proxy()` a `NextRequest` for each cell of the FR-006 decision matrix; assert response `status === 307`, `Location` header, and pass-through cases return `200`/`next()` semantics. Use `vi.resetModules()` between cases that need a different `LAUNCH_AT` parse (since it's module-level), or — preferred — test `evaluateGate` directly with explicit `launchAt` arg and only run a small number of full-`proxy()` cases that exercise the wiring.
   - `proxy-gate-headers.test.ts` — every redirect response carries the OWASP header set + `x-request-id`. Reuses the assertion helpers from the existing `tests/integration/login/proxy-headers.test.ts`.

**Phase 4 — Prelaunch route + screen** *(US1, P1; US4, P2)*

1. Extend [`Countdown`](../../../src/components/home/Countdown.tsx) with two optional props:
   - `subtitleAs?: "p" | "h1"` (default `"p"`).
   - `subtitleKey?: string` (default `"home.hero.subtitle"`).
   - Render the subtitle as `React.createElement(subtitleAs, props, t(subtitleKey, locale))` so the existing Homepage call site in [src/components/home/Hero.tsx](../../../src/components/home/Hero.tsx) (`<Countdown eventStart={…} locale={…} />` — no extra props) stays byte-identical at runtime.
   - **Existing Countdown tests** at [tests/unit/components/home/Countdown.test.tsx](../../../tests/unit/components/home/Countdown.test.tsx) already cover the default-subtitle path (they import `viCatalog["home.hero.subtitle"]`); modifying the component MUST keep all current scenarios green. Add two new cases to that file: (a) `subtitleAs="h1"` produces an `<h1>` with `prelaunch.heading`, (b) explicit `subtitleKey="prelaunch.heading"` with the default `subtitleAs="p"` produces a `<p>` with the prelaunch text.
   - **Note**: there is no `Hero.test.tsx` today — Hero is exercised only via the home page integration tests. No Hero-level test changes needed.
2. Create `src/components/prelaunch/PrelaunchScreen.tsx`:
   - Pure Server Component (no `"use client"`).
   - Renders `<main>` (semantic landmark per Principle III), the background `<Image>`, the dark overlay div, and `<Countdown eventStart={launchAt} locale={locale} subtitleAs="h1" subtitleKey="prelaunch.heading" />`.
   - **No** `<header>` / `<footer>` / `<nav>` / `<button>` / `<a>` (US4 invariant).
3. Create `app/coming-soon/page.tsx`:
   - Server Component. `export const dynamic = "force-dynamic"`.
   - Reads `parseLaunchAt(config.SAA_LAUNCH_AT)`. **MUST NOT call `auth()`** (FR-002) — the route is auth-agnostic.
   - If `launchAt !== null && launchAt <= now()`, `redirect("/")` (FR-008). This is a backstop — proxy already redirects pre-route, but a defensive in-route redirect protects against proxy regressions.
   - Otherwise reads `getSaaLocale()` and renders `<PrelaunchScreen launchAt={launchAt} locale={locale} />`.
4. Vitest:
   - `tests/unit/components/prelaunch/PrelaunchScreen.test.tsx` asserts:
     - Exactly one `<main>` landmark.
     - Heading is `<h1>` with the `prelaunch.heading` translated string (assert via `screen.getByRole("heading", { level: 1, name: <translated> })`).
     - Three tiles labelled `DAYS`, `HOURS`, `MINUTES` (delegated to `Countdown`'s existing test — sanity-check via the same `viCatalog`-import pattern Countdown.test.tsx uses).
     - Zero `<button>` and zero `<a>` elements (`expect(container.querySelectorAll("button, a")).toHaveLength(0)` — US4 invariant).
   - `tests/unit/app/coming-soon/page.test.tsx` asserts the route handler:
     - With `auth()` mocked via `vi.mock("@/src/lib/auth")`, calling the page MUST result in `auth.mock.calls.length === 0` (FR-002).
     - With `parseLaunchAt` mocked to return a future `Date`, the page renders `<PrelaunchScreen>`.
     - With `parseLaunchAt` mocked to return a past `Date`, the page calls `redirect("/")` (assert via mocking `next/navigation`'s `redirect`).
     - With `parseLaunchAt` mocked to return `null`, the page renders `<PrelaunchScreen>` (FR-009 — fail-closed renders the placeholder UI).

**Phase 5 — In-tab handoff at the zero boundary** *(US3 scenario 3, P1)*

The existing `Countdown` component already exposes its `isInPast: true` branch via `computeParts`. Two acceptable mechanisms (spec defers the choice to plan-phase). Selected approach:

- **A. On-tick `router.refresh()` from `Countdown`** (rejected — couples `Countdown` to Next.js routing and breaks Homepage's reuse).
- **B. Local `useEffect` in `PrelaunchScreen` that schedules a `router.refresh()` whenever the wall clock crosses `launchAt`** (selected). PrelaunchScreen wraps the (now-)client subhook in a tiny `"use client"` companion `PrelaunchAutoExit.tsx` that takes `launchAt` and calls `router.refresh()` once, post-cross, then renders `null`. Server-side, the next request hits the proxy → 307 to `/`.

This keeps `Countdown` 100% reusable and isolates the handoff in a 12-line component. Vitest + jsdom can fake-timer the boundary; Playwright's `gate-disabled.spec.ts` covers the visitor-observable outcome (no frozen `00 00 00`).

**Phase 6 — CI matrix + onboarding** *(SC-005, TR-005)*

1. Add npm scripts:
   - `test:e2e:gate-active` → runs `tests/e2e/prelaunch/gate-active.spec.ts` with `SAA_LAUNCH_AT=<future ISO>`.
   - `test:e2e:gate-disabled` → runs the rest of the suite with `SAA_LAUNCH_AT=<past ISO>`.
   - The default `test:e2e` aliases to `test:e2e:gate-disabled` so existing local workflows are unaffected.
2. Update GitHub Actions workflow(s) under `.github/workflows/` so the test matrix injects the env per-job.
3. Update `.env.example`:
   ```env
   # ----- SAA Pre-launch gate ------------------------------------------------
   # ISO-8601 datetime with timezone. Must be set explicitly — leaving this
   # unset / empty / malformed makes the proxy fail CLOSED (gate active) per
   # spec FR-009. Set to a PAST timestamp to disable the gate (normal dev), or
   # a FUTURE timestamp to test the prelaunch surface.
   SAA_LAUNCH_AT="2025-01-01T00:00:00+07:00"
   ```
4. Add a brief "Pre-launch gate" subsection to `README.md` linking to this plan.

**Phase 7 — Polish + verification gates**

- `npm run lint` clean.
- `tsc --noEmit` clean.
- Full Vitest run green (`npm run test`); existing 184 + new ~25 tests.
- Both Playwright modes green; existing Homepage 11/11 + Login 16/16 pass with the gate disabled.
- Manual smoke at 360 px width — no horizontal scroll, countdown legible.

### Risk Assessment

| Risk                                                                                                          | Probability | Impact | Mitigation                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------- | ----------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing `proxy.ts` matcher excludes a path the gate must cover                                              | Medium      | High   | Audit the matcher in Phase 3.4. Today's matcher excludes `_next/static`, `_next/image`, `favicon.ico`, `assets` — those align with FR-007. API routes ARE in scope (matcher does NOT exclude them). Add an integration test that hits `/api/auth/session` and `/api/notifications/unread-count` during gate-active to catch regressions. |
| Existing proxy stamps `x-request-id` and security headers — redirect responses must keep both                  | Medium      | Medium | Phase 3.2 explicitly funnels the redirect through `applySecurityHeaders` and sets `x-request-id` (the existing helper). Integration test `proxy-gate-headers.test.ts` asserts every required header is present on a 307.                                                                                                                                                                                                                                                                                  |
| Homepage's existing Playwright suite assumes anonymous `/` → `/login` (gate-disabled assumption)              | High        | Medium | TR-005 already calls this out. Solution: every Playwright job sets `SAA_LAUNCH_AT` explicitly (past for default, future for gate-active). README + onboarding doc updated. Failing suite without the env is the desired fail-closed signal.                                                                                                                                                                                              |
| Stale `dynamic = "force-dynamic"` cache somewhere serves prelaunch HTML post-launch                             | Low         | High   | The route IS marked `force-dynamic`. Additionally, `app/coming-soon/page.tsx` calls `redirect("/")` if `launchAt <= now()` as a defensive in-route check. Playwright `gate-disabled.spec.ts` verifies "/coming-soon" returns a redirect.                                                                                                                                                                                                                                                                                                       |
| Whitelist regex bypass via path traversal                                                                      | Low         | High   | Use exact-match-or-prefix-match against the normalized `URL.pathname`. No regex backreferences. Abuse-case test 1 above.                                                                                                                                                                                                                                                                                                                  |
| `parseLaunchAt` parses values like `"2025"` to `2025-01-01T00:00:00Z` (silent under-spec)                       | Medium      | Medium | Mirror `parseEventStart`'s policy: accept what `Date(value)` accepts and treat NaN as `null`. Document explicitly in the function's `// why:` comment. Operators are warned in `.env.example`.                                                                                                                                                                                                                                                                                                                                |
| Auto-exit on zero-boundary fires multiple times (refresh loop)                                                 | Low         | Medium | `PrelaunchAutoExit` uses a `useRef` flag so `router.refresh()` runs at most once per mount. Idempotent via the proxy redirect — even if it fires twice, the visitor lands on `/`.                                                                                                                                                                                                                                                                                                                                |

### Estimated Complexity

- **Frontend**: Low. New route is ~30 lines; new Server Component ~30 lines; `Countdown` extension ~6 lines.
- **Backend**: Low–Medium. Proxy extension is the only non-trivial piece — 4 small helpers plus a decision branch. Pure logic, no I/O.
- **Testing**: Medium. The gate decision matrix has many cells; Playwright must run twice (gate-active vs gate-disabled), which expands CI time.

---

## Integration Testing Strategy

### Test Scope

- [x] **Component/Module interactions**: `proxy.ts` ↔ `prelaunch-gate.ts` ↔ `parseLaunchAt`; `app/coming-soon/page.tsx` ↔ `PrelaunchScreen` ↔ `Countdown`.
- [x] **External dependencies**: None at test time (no DB, no fetch). Auth.js is intentionally **not** consulted by gate logic.
- [x] **Data layer**: N/A — no DB.
- [x] **User workflows**: Gate-active: every shipped route → `/coming-soon`. Gate-disabled: `/coming-soon` → `/` → onward (anon → `/login`, authed → Homepage). Tab-open zero-boundary handoff.

### Test Categories

| Category            | Applicable? | Key Scenarios                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI ↔ Logic          | Yes         | PrelaunchScreen renders a single `<main>`, an `<h1>` for the heading, three Countdown tiles, and zero buttons/links (US4). Auto-exit client triggers `router.refresh()` once at the zero boundary.                                                                                                                                                                                                                                                                |
| Service ↔ Service   | Yes         | `proxy()` consults `prelaunch-gate.evaluateGate()` BEFORE rate limit / security headers; existing rate limit on `/api/auth/callback` is **unreachable during gate-active** because Auth.js paths are not whitelisted — verify by Vitest assertion that `__resetRateLimitForTests` need not run when only gate-active inputs are exercised.                                                                                                                          |
| App ↔ External API  | No          | No external API. Auth.js is bypassed by design during the gate.                                                                                                                                                                                                                                                                                                                                                                                                |
| App ↔ Data Layer    | No          | No DB calls.                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Cross-platform      | Yes         | 360 px responsive smoke (Playwright with viewport override) on `gate-active.spec.ts`.                                                                                                                                                                                                                                                                                                                                                                            |

### Test Environment

- **Environment type**: Vitest (jsdom) for unit/integration; Playwright (chromium) against `npm run dev` with per-job env injection for E2E.
- **Test data strategy**: No fixtures needed — env var is the only input. Use ISO timestamps relative to `Date.now()` in tests (e.g., `+5d 3h 17m`).
- **Isolation approach**: `__resetRateLimitForTests()` between proxy specs (already implemented). Tests of `parseLaunchAt` are pure functions, no isolation needed.

### Mocking Strategy

| Dependency Type           | Strategy | Rationale                                                                                                                                                                                                                |
| ------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth()` (Auth.js)        | Mock     | Tests must assert that the prelaunch route does NOT call `auth()`. Vitest `vi.mock` with a spy. Playwright tests inject session cookies directly via `tests/e2e/fixtures` (existing pattern) for the gate-disabled run. |
| `config.SAA_LAUNCH_AT`    | Stub     | For Vitest: `vi.spyOn` or use `vi.mock("@/src/lib/config")`. For Playwright: env injection at process start.                                                                                                              |
| `getSaaLocale()`          | Real     | Reads cookies through Next's cookie API; jsdom test env supplies its own — simpler to leave it real and provide a cookie value.                                                                                          |
| `Date.now()` / fake timer | Mock     | Vitest's `vi.useFakeTimers()` for the auto-exit handoff and minute-tick verification (already used by Countdown's existing tests).                                                                                       |
| Module-level `LAUNCH_AT` in `proxy.ts` | `vi.resetModules()` | The proxy parses env at module load. Integration tests that need to switch between gate-active / gate-disabled / null states either (a) call `vi.resetModules()` + `vi.stubEnv("SAA_LAUNCH_AT", value)` then re-import, or (b) prefer testing `evaluateGate` directly with explicit `launchAt`. Use (b) for the decision matrix; reserve (a) for two end-to-end smoke cases per state. |

### Test Scenarios Outline

1. **Happy Path**
   - [ ] Gate-active + anon GET `/` → 307 to `/coming-soon`. (FR-006)
   - [ ] Gate-active + GET `/coming-soon` → 200, renders prelaunch screen. (FR-001)
   - [ ] Gate-active + GET `/_next/static/abc.js` → pass-through. (FR-007)
   - [ ] Gate-disabled + GET `/coming-soon` → 307 to `/`. (FR-008)
   - [ ] Gate-disabled + GET `/` → reaches Homepage handler unchanged. (FR-008 inverse)

2. **Auth-agnostic invariants** (FR-002)
   - [ ] Gate-active + valid session cookie + GET `/awards` → 307 to `/coming-soon` (no session branching).
   - [ ] Gate-active + GET `/api/auth/callback/google?code=…` → 307 to `/coming-soon` (Q-PG4).

3. **Error / fail-closed Handling** (FR-009 / SC-004)
   - [ ] `SAA_LAUNCH_AT` unset + anon GET `/` → 307 to `/coming-soon` (parametrized over `NODE_ENV ∈ {production, development, test}`).
   - [ ] `SAA_LAUNCH_AT="garbage"` + GET `/` → 307 to `/coming-soon`.
   - [ ] `SAA_LAUNCH_AT=""` + GET `/coming-soon` → 200 with `--/--/--` placeholders (the existing `Countdown` already renders `--` when `eventStart === null`).
   - [ ] `SAA_LAUNCH_AT="2025-13-99"` + GET `/` → 307 to `/coming-soon` (NaN parse).

4. **Edge Cases**
   - [ ] Path-traversal attempt `/coming-soon/../awards` → 307 to `/coming-soon` (URL.pathname normalization).
   - [ ] Race at zero boundary: `launchAt = Date.now() - 1ms` + GET `/coming-soon` → 307 to `/`; `launchAt = Date.now() + 1ms` + GET `/coming-soon` → 200.
   - [ ] Tab open across boundary (Vitest fake timer): `PrelaunchAutoExit` fires `router.refresh()` exactly once.

5. **Security headers regression** (TR-002 A05)
   - [ ] All redirect responses carry CSP / HSTS / X-Content-Type-Options / Referrer-Policy / X-Frame-Options.
   - [ ] All redirect responses carry `x-request-id`.

6. **No interactive surface** (US4 / FR-003)
   - [ ] Playwright `gate-active-no-controls.spec.ts`: from a fresh load, `await page.keyboard.press('Tab')` then assert `await page.evaluate(() => document.activeElement.tagName)` is `BODY` or equivalent neutral focus target. DOM contains zero `<button>` and zero non-metadata `<a>`.

### Tooling & Framework

- **Test framework**: Vitest 4 (unit + integration), Playwright 1.59 (E2E).
- **Supporting tools**: `@testing-library/react` for component assertions; `NextRequest` constructor for proxy unit tests; jsdom's `URL` for path-normalization.
- **CI integration**: New matrix job `prelaunch-gate-active` runs after the existing CI completes; both must pass for merge.

### Coverage Goals

| Area                                | Target | Priority |
| ----------------------------------- | ------ | -------- |
| `parseLaunchAt`                     | 100%   | High     |
| `prelaunch-gate.evaluateGate`       | 100%   | High     |
| `proxy.ts` gate branch              | 95%+   | High     |
| `app/coming-soon/page.tsx`          | 90%+   | High     |
| `PrelaunchScreen` + `Countdown` ext | 90%+   | High     |
| Cross-route Playwright matrix       | All key routes covered | High |

---

## Dependencies & Prerequisites

### Required Before Start

- [x] [.momorph/constitution.md](../../constitution.md) v1.1.1 reviewed.
- [x] [spec.md](./spec.md) approved (Status: "Ready for `momorph.plan`", 2026-05-08).
- [x] No `[NEEDS CLARIFICATION]` markers (all eight Q-CP / Q-PG questions resolved 2026-05-08).
- [ ] research.md — **NOT NEEDED**. Codebase context is small enough to inline in this plan (Integration Points section). Skip per momorph.plan Phase 3 (optional).
- [x] API contracts — N/A (no endpoints).
- [x] DB migrations — N/A (no entities).
- [x] **No `.momorph/specs/8PJQswPZmU-countdown-prelaunch-page/design-style.md` was generated**. Design tokens / spacing / pixel detail will be sourced at implementation time via `momorph.implement-ui` (`query_section`, `get_node`, `list_media_nodes`) — this is consistent with how Homepage SAA was implemented (its `design-style.md` is also absent; the screenshot-vs-Figma loop covers visual fidelity per SC-002).

### External Dependencies

- None new. Existing dependencies (`next`, `react`, `zod`, `next-auth`, etc.) are sufficient.

---

## Next Steps

After plan approval:

1. **Run** `/momorph.tasks` to generate the task breakdown for this plan.
2. **Review** `tasks.md` for parallelization opportunities (Phase 1 i18n + Zod can run alongside Phase 2 gate logic).
3. **Begin** implementation following task order. **Phase 1 + Phase 2 BEFORE Phase 3** — the proxy must not be wired up until the gate logic and parser both exist and pass tests, otherwise the dev environment goes dark on every page load.
4. **CI gating**: ensure both `test:e2e:gate-active` and `test:e2e:gate-disabled` run before merge.

---

## Notes

- The spec was corrected on 2026-05-08 to remove the "greenfield proxy" claim. [proxy.ts](../../../proxy.ts) ships today with the security-headers + rate-limit pipeline used by Login. This plan **extends** that file, it does not replace it. The work order is: gate first, then existing pipeline. Existing rate-limit on `/api/auth/callback` becomes effectively dead during gate-active (those paths redirect before reaching the rate-limit branch) — acceptable because the rate limit is for post-launch operation.
- Existing Login proxy tests (`tests/integration/login/proxy-headers.test.ts`, `tests/integration/login/proxy-rate-limit.test.ts`) MUST continue to pass with the gate **disabled** (`SAA_LAUNCH_AT=<past>`) — they exercise paths that currently expect `next()` semantics. With the gate active, those tests would correctly observe redirects instead, which is why they live in the gate-disabled CI job (TR-005).
- The proxy comment block currently calls itself "Edge-runtime"; in Next.js 16 `proxy.ts` runs on the Node.js runtime (Edge is unsupported). Update that comment as part of Phase 3.
- The 4 Figma "Access control" test cases for the prelaunch screen ("Login as a valid user", "Ensure user not logged in", etc.) are **superseded** by the auth-agnostic gate model. Tasks should explicitly mark them "covered by gate behavior, not per-route auth" rather than translating them 1:1.
- Order of operations matters: do NOT commit Phase 3 (proxy wiring) without Phase 1+2 + tests green, otherwise local dev breaks until `SAA_LAUNCH_AT` is set in `.env.local`. Onboarding doc updates land in the same PR as Phase 3.
- `app/coming-soon/page.tsx` deliberately has a defensive in-route `redirect("/")` for the gate-disabled state. The proxy handles FR-008 authoritatively; the in-route redirect protects against proxy regressions and stale ISR. Both paths are tested.
- `PrelaunchAutoExit` is the only client-side new code. Keeping the route a Server Component is non-negotiable (Principle II default).
- After merge, `SAA_LAUNCH_AT` MUST be set in production / staging / dev environments. Operators get a one-line entry in `.env.example` plus the README pointer; CI pipelines get the matrix split.
