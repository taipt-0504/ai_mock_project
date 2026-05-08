# Screen Flow Overview

## Project Info
- **Project Name**: SAA 2025 (Sun Annual Awards 2025)
- **Figma File Key**: 9ypp4enmFmdK3YAFJLIu6C
- **Figma URL**: https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C
- **Created**: 2026-05-07
- **Last Updated**: 2026-05-08 (Countdown - Prelaunch page `8PJQswPZmU` open-question batch resolved — env var finalized as `SAA_LAUNCH_AT`, route finalized as `/coming-soon`, whitelist finalized to exclude all Auth.js routes; spec ready for `momorph.plan`)

> ### Global Pre-launch Gate — read this first
>
> While the prelaunch period is active (`now() < SAA_LAUNCH_AT`, a NEW env var
> separate from `SAA_EVENT_START_AT`), Next.js `proxy.ts` redirects **every**
> incoming request — including `/`, `/login`, `/awards`, `/sun-kudos`, `/general-rules`,
> `/profile`, and every API route except a small whitelist — to the Countdown - Prelaunch
> page (`/coming-soon`). Both anonymous AND authenticated users are routed to the
> prelaunch screen during this window; sessions are NOT invalidated, they persist for
> post-prelaunch use.
>
> **Implication for this document**: every "Incoming" / "Entry points" line in every
> screen's section below has an implicit precondition `…AND now() >= SAA_LAUNCH_AT`.
> Pre-prelaunch-end, none of those entry points fire — they all redirect to prelaunch.
> Individual screen sections are NOT rewritten with this clause; treat it as a global
> precondition stated here.
>
> When `now() >= SAA_LAUNCH_AT`:
> 1. Visiting the prelaunch route itself redirects to `/` (route becomes unreachable).
> 2. Homepage US0 takes over (anon → `/login`, authed → render Homepage SAA).
> 3. All other routes resume normal behavior described in their sections below.
>
> **Whitelist (finalized, Q-PG4 resolved)** — NOT redirected during prelaunch:
> Next.js internals (`/_next/*`), static assets (`/public/*`), favicon, the prelaunch
> route itself (`/coming-soon`), and diagnostic endpoints (`/api/health` if/when added).
> **NOT whitelisted (deliberately)**: every Auth.js route (`/api/auth/*` — including
> `callback`, `csrf`, `session`, `signin`, `signout`). Rationale: `/login` is
> unreachable during the gate, so OAuth init never happens; allowing the callback
> open would create a probe surface during the gate window.
>
> **Missing-env behavior (Q-PG2 resolved)**: if `SAA_LAUNCH_AT` is unset, empty, or
> unparseable, the proxy fails CLOSED in every `NODE_ENV` — the gate stays
> active. Every environment (production, development, test, CI) MUST set
> `SAA_LAUNCH_AT` explicitly; set it to a past ISO-8601 timestamp to disable the gate.

> Companion file: `.momorph/contexts/SCREENFLOW.md` — keeps the in-depth navigation
> graph + edge-confidence audit (per Constitution Principle III). This document is
> the high-level discovery / index view.

---

## Discovery Progress

| Metric | Count |
|--------|-------|
| Total Screens (known) | 8 |
| Reusable Components (overlays) | 3 |
| Surveyed in depth | 5 (Login, Dropdown — Language, Homepage SAA, Dropdown — Profile user, Countdown - Prelaunch page) |
| Remaining | 3 |
| Completion | ~63% |

---

## Screens

| # | Screen Name | Frame ID | Figma Link | Status | Detail File | Predicted APIs | Navigations To |
|---|-------------|----------|------------|--------|-------------|----------------|----------------|
| 1 | Login | `GzbNeVGJHz` | https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=GzbNeVGJHz | surveyed | `specs/GzbNeVGJHz-login/spec.md` | `POST /api/auth/signin/google`, `GET /api/auth/callback/google`, `POST /api/auth/signout`, `POST /api/i18n/locale` | Homepage SAA, Dropdown — Language |
| 2 | Homepage SAA (auth-only) | `i87tDx10uM` | https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=i87tDx10uM | surveyed (2026-05-07) | `specs/i87tDx10uM-homepage-saa/spec.md` | `GET /api/notifications/unread-count` (predicted — bell badge); reuses `auth()` session for user fields; `SAA_EVENT_START_AT` env for countdown target. Awards = static config in this iteration. | Login (anon redirect via FR-001a); Awards Information (`/awards#<slug>`); Sun* Kudos detail (`/sun-kudos`); General Rules (`/general-rules`); Dropdown — Language; Dropdown — Profile (user/admin); Notification panel |
| 3 | Error page — 403 | `T3e_iS9PCL` | https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=T3e_iS9PCL | pending | — | — | Login (inferred) |
| 4 | [iOS] Login | `8HGlvYGJWq` | https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=8HGlvYGJWq | pending | — | (same as Login) | (same as Login) |
| 5 | Countdown - Prelaunch page | `8PJQswPZmU` | https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=8PJQswPZmU | surveyed (2026-05-08, re-architected as **global pre-launch gate** same day; open questions Q-CP1..Q-CP5 + Q-PG1..Q-PG5 all resolved 2026-05-08 — route `/coming-soon`, env `SAA_LAUNCH_AT`) | — (no calls; countdown driven by NEW env var `SAA_LAUNCH_AT`, distinct from `SAA_EVENT_START_AT` which Homepage `B1` continues to use) | none in-screen — `now() >= SAA_LAUNCH_AT` lifts the proxy gate; all routes resume normal flow (anon → `/login` per Homepage US0, authed → Homepage SAA) |

### Reusable Components (Overlays — not routes)

| # | Component Name | Frame ID | Figma Link | Status | Used By | Navigations To |
|---|----------------|----------|------------|--------|---------|----------------|
| C1 | Dropdown — Language | `hUyaaugye2` | https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=hUyaaugye2 | surveyed (2026-05-07) | Login (`GzbNeVGJHz`), Homepage SAA (`i87tDx10uM`, confirmed via header item `A1.7`), other authenticated screens with the header | none — selection updates locale in place |
| C2 | Dropdown — Profile (user) | `z4sCl3_Qtk` | https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=z4sCl3_Qtk | surveyed (2026-05-08) | Homepage SAA (`A1.8`); future authenticated user routes reusing the header | Profile route (`/profile` — stub shipped 2026-05-08); Login (after Logout via Server Action `signOutAction`) |
| C3 | Dropdown — Profile (admin) | `54rekaCHG1` | https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=54rekaCHG1 | pending | admin routes | Login (Logout — inferred) |

---

## Component Details — `C1` Dropdown — Language (`hUyaaugye2`)

**Type**: Reusable overlay component (NOT a standalone screen — no URL of its own).

**Anchor**: Header language chip on every screen that exposes locale switching. Confirmed
on Login (`A.2 / I662:14391;186:1601`); inferred on Homepage SAA and any other route that
renders the same header.

**Structure** (from Figma):
- `Dropdown-List` (`525:11713`) — main container.
  - Selected display row: chip "VN" with Vietnam flag, dark grey background.
  - Item `tiếng Việt` (`I525:11713;362:6085`) — selects `vi-VN` (chip `VN`).
  - Item `tiếng Anh` (`I525:11713;362:6128`, 110×56, dark background) — selects `en-US` (chip `EN`).

**Behavior**:
- Click on header chip → opens this overlay.
- Click on a language item → updates the active locale in place; does NOT navigate.
- Click outside / `Esc` → closes the overlay.
- Persistence: `saa_locale` cookie for everyone; for authenticated users the choice is
  also mirrored to `User.locale` via `POST /api/i18n/locale` (optimistic, reverted on
  failure). See Login spec FR-007 / FR-008.

**Edges**: none outgoing. Incoming = "open" trigger from each host screen's header.

**Implementation status**: **Already shipped** with the Login feature (commit `8c0022f`).
The shared React component is [src/components/header/LanguageSelector.tsx](src/components/header/LanguageSelector.tsx)
(file is named `LanguageSelector`, not `LanguageDropdown`); it is mounted via
[src/components/header/Header.tsx](src/components/header/Header.tsx). Locale types and
display map live at [src/lib/i18n/types.ts](src/lib/i18n/types.ts); cookie helpers at
[src/lib/cookies/saa-locale.ts](src/lib/cookies/saa-locale.ts); API at
[app/api/i18n/locale/route.ts](app/api/i18n/locale/route.ts). Frame `hUyaaugye2` is a
visual refresh of this component, not a fresh build target.

---

## Component Details — `C2` Dropdown — Profile (user) (`z4sCl3_Qtk`)

**Type**: Reusable overlay component (NOT a standalone screen — no URL of its own).

**Anchor**: Profile avatar `A1.8` of the shared `Header`. Confirmed on Homepage SAA
(`i87tDx10uM`); will mount on every authenticated user-role screen reusing the same header.
Figma's `linkedFrameId: 721:5223` on `A1.8` references the legacy `Dropdown-profile` parent —
`z4sCl3_Qtk` is its surveyed user variant. Admin variant `54rekaCHG1` (adds "Admin Dashboard")
remains pending until `User.role` schema migration ships (Homepage spec PQ1 = b).

**Structure** (from Figma frame `721:5223`):
- `A_Dropdown-List` (`666:9601`, instance of component `563:7882`) — overlay container.
  - `A.1_Profile` (`I666:9601;563:7844`) — icon_text button, user icon. Figma label "Profile";
    runtime label from i18n key `home.profile.profile` ("Hồ sơ" / "Profile").
  - `A.2_Logout` (`I666:9601;563:7868`) — icon_text button, chevron-right icon. Figma label
    "Logout"; runtime label from i18n key `home.profile.sign_out` ("Đăng xuất" / "Sign out").

**Behavior**:
- Click avatar `A1.8` → opens overlay; click again or click outside / `Esc` → closes.
- Click `A.1` Profile → Next.js `<Link href="/profile">` navigation. `/profile` shipped as
  stub placeholder 2026-05-08 ([app/profile/page.tsx](app/profile/page.tsx)) — Q-DPU1 closed
  (option (a) reversed → option (b) stub due to 404→back hydration bug; see
  `z4sCl3_Qtk-dropdown-profile/spec.md` Q1 + Q6).
- Click `A.2` Logout → `<form action={signOutAction}>` submit (Server Action defined at
  `src/actions/auth.ts`) → Auth.js v5 `signOut({ redirectTo: "/login" })` invalidates session
  and redirects to `/login` (mirror of Login spec US1; closes the authenticated state machine).
  Raw `<form action="/api/auth/signout" method="post">` is **forbidden** — Auth.js v5 rejects
  it with `MissingCSRF` (see `z4sCl3_Qtk-dropdown-profile/spec.md` Q5).
- Trigger fallback chain: `session.user.image` → `name` initial → `?`. `aria-label` =
  `name` (or "Hồ sơ" if missing).
- No role branching in this component; admin variant lives in `54rekaCHG1`.

**Edges**:
- Outgoing: `/profile` (stub placeholder shipped 2026-05-08), `/login` (after logout).
- Incoming: avatar `A1.8` of every authenticated user route reusing the header.

**Implementation status**: **Already shipped** with Homepage SAA Phase 13 (commit
[893d8db](../../). Component file: [src/components/home/ProfileButton.tsx](src/components/home/ProfileButton.tsx).
Mounted via `Header`'s `profileMenu` slot. Unit tests: [tests/unit/components/home/ProfileButton.test.tsx](tests/unit/components/home/ProfileButton.test.tsx)
(7 ca, vitest xanh). Spec hồi tố: [specs/z4sCl3_Qtk-dropdown-profile/spec.md](specs/z4sCl3_Qtk-dropdown-profile/spec.md).
Frame `z4sCl3_Qtk` is a tài liệu tham chiếu chống regression cho biến thể user, không phải build target mới.

**Open questions** (chốt trong spec):
- **Q-DPU1**: ~~`/profile` route — milestone hiện tại có làm trang đích, hay chấp nhận 404 ngắn hạn?~~ **Closed 2026-05-08**: stub placeholder ship ([app/profile/page.tsx](app/profile/page.tsx)). Lý do đảo từ "chấp nhận 404" → "stub": hydration bug ở Next.js 16 + Turbopack dev khi back-navigate từ route 404 (xem `z4sCl3_Qtk-dropdown-profile/spec.md` Q6).
- **Q-DPU2**: Bổ sung `keydown` listener cho `Escape` để đóng overlay + trả focus về trigger (đồng bộ pattern với LanguageSelector). (Khuyến nghị: thêm.)
- **Q-DPU3**: Logic chọn biến thể (user vs. admin) phụ thuộc vào `User.role` schema — khi nào unblock biến thể admin?

---

## Screen Details — Countdown - Prelaunch page (`8PJQswPZmU`)

**Type**: **Global pre-launch gate** — a dedicated full-bleed route (no header, no footer,
no nav) that is rendered in place of every other route while the prelaunch window is active.
Implementation vehicle is Next.js `proxy.ts`: it intercepts incoming requests and
rewrites/redirects them to the prelaunch route as long as `now() < SAA_LAUNCH_AT`.
This is no longer a `/` inline variant nor an optional surface — it is the universal entry
point during the prelaunch window, regardless of session state.

**Purpose**: Build anticipation for SAA 2025 with a minimal, immersive countdown while the
program is still pre-launch. The screen reuses the SAA tree-roots key art (`MM_MEDIA_BG
Image` + dark `Cover` overlay) from the same brand system as Homepage SAA, but strips away
every navigation surface so the only thing in view is the remaining time until the prelaunch
period ends.

**Architecture role (revised 2026-05-08; all open questions resolved 2026-05-08)**:
- Anchored on a NEW env var **`SAA_LAUNCH_AT`** (Q-PG1 resolved — terser and
  marketing-friendly; chosen by user over earlier-discussed verbose alternatives such
  as `SAA_PRELAUNCH_UNTIL` / `SAA_GATE_END_AT`), distinct from `SAA_EVENT_START_AT`.
  The two can be set
  independently. Logically `SAA_LAUNCH_AT <= SAA_EVENT_START_AT`, but this is NOT
  enforced in code.
- The prelaunch countdown counts down to `SAA_LAUNCH_AT`. Homepage SAA's existing
  `B1` countdown continues to count down to `SAA_EVENT_START_AT` (unchanged) — the two
  countdowns are independent.
- **Auth-agnostic during the gate**: anonymous AND authenticated users see the prelaunch
  screen. Sessions are NOT invalidated; they persist so authenticated users land directly
  on Homepage SAA once the gate lifts.
- **Proxy redirect target**: every non-whitelisted incoming request is redirected to
  the prelaunch route `/coming-soon` (Q-PG3 resolved). This includes `/`, `/login`,
  `/awards`, `/sun-kudos`, `/general-rules`, `/profile`, and every API route — including
  every Auth.js path `/api/auth/*`.
- **Whitelist** (NOT redirected, Q-PG4 resolved): `/_next/*` (Next.js internals),
  `/public/*` (static assets), favicon, the prelaunch route itself (`/coming-soon`),
  and diagnostic endpoints (`/api/health` if/when added).
- **NOT whitelisted (deliberately, Q-PG4 resolved)**: every Auth.js route under
  `/api/auth/*` — including `callback`, `csrf`, `session`, `signin`, `signout`. All
  of these redirect to `/coming-soon` like any other application route. Rationale:
  `/login` is unreachable during the gate so OAuth init never happens; allowing the
  callback open would create a probe surface during the gate window.
- **Missing-env behavior (Q-PG2 resolved)**: if `SAA_LAUNCH_AT` is null, empty, or
  unparseable, the proxy fails CLOSED in every `NODE_ENV` — the gate stays active
  and serves `/coming-soon` with `--/--/--` placeholders. Every environment MUST set
  `SAA_LAUNCH_AT` explicitly; set it to a past ISO-8601 timestamp to disable the gate.
- **Post-prelaunch handoff** (when `now() >= SAA_LAUNCH_AT`, Q-PG5 resolved):
  1. Direct visits to `/coming-soon` always redirect to `/` (single redirect target;
     route unreachable post-gate). Homepage US0 owns the anon-vs-authed branching, so
     this layer does not duplicate it.
  2. Homepage US0 takes over (`/` for anon → `/login`; `/` for authed → render Homepage).
  3. All other routes resume normal behavior described in their sections.

**Top-level structure** (from Figma frame `2268:35127`, 1512×900):

| Section | Frame ID | Notes |
|---------|----------|-------|
| `MM_MEDIA_BG Image` | `2268:35129` | Full-bleed root-system illustration (same asset family as Homepage SAA hero `3.5`). |
| `Cover` | `2268:35130` | Dark gradient overlay on top of the BG image to keep the countdown legible. |
| `Bìa` (Cover container) | `2268:35131` | Centered flex column, `gap:120px`, `padding:96px 144px`. Holds the entire visible content stack. |
| `Frame 487` → `Frame 523` → `Countdown time` | `2268:35132` / `2268:35135` / `2268:35136` | Nested centered column wrapping the heading + time tiles. |
| Heading text | `2268:35137` | "Sự kiện sẽ bắt đầu sau" — Montserrat 700, 36px, white. Vietnamese only in this frame. |
| `Time` row | `2268:35138` | Horizontal flex row with three units: `1_Days` (`2268:35139`), `2_Hours` (`2268:35144`), `3_Minutes` (`2268:35149`). `gap:60px`. |
| Per-unit tile pair | `2268:35140` (Days), parallel for Hours/Minutes | Each unit is two side-by-side digit tiles (`Group 5`/`Group 4`, instances of component `186:2619`) — 77×123, glass-blur background (`backdrop-filter: blur(24.96px)`, semi-white linear gradient, 0.75px `#FFEA9E` border, 12px radius), digit rendered in `Digital Numbers` font at 73.7px. |
| Per-unit label | e.g. `DAYS` (`2268:35143`) | Montserrat 700, 36px, uppercase Latin label below the two digit tiles. Same treatment for `HOURS` and `MINUTES`. |

**Behavior**:
- Auto-tick at minute granularity (visually consistent with Homepage SAA `B1` — but data
  source differs: prelaunch reads `SAA_LAUNCH_AT`, Homepage `B1` reads
  `SAA_EVENT_START_AT`). No seconds tile in this frame. Granularity is **minute-only
  forever** (Q-CP3 resolved — matches Figma + Homepage `B1`; lower jitter / battery /
  test surface; no second-level final-hour surge).
- When `now() >= SAA_LAUNCH_AT`: proxy stops redirecting, and the prelaunch
  route itself becomes unreachable (any direct visit is redirected to `/`). Mechanism:
  proxy short-circuit on the time check; no client-side polling for handoff is
  required because the gate is enforced server-side on every request.
- No interactive controls. No header (no language chip, no profile, no notification bell).
  No footer. No navigation. No call-to-action button.
- Auth-agnostic: anonymous and authenticated visitors see the same screen; the rendering
  pipeline does not call `auth()` and does not branch on session state. Session cookies are
  preserved untouched.

**Outgoing navigation edges**: **none** in-screen. The only "edge" is logical/temporal —
the proxy lifts the gate once `now() >= SAA_LAUNCH_AT`, after which the next
request to `/` follows Homepage US0 (anon → `/login`; authed → Homepage SAA).

**Incoming edges** (during prelaunch window):
- Direct visit to `/coming-soon` — naturally allowed.
- **Redirected from every other route** via Next.js `proxy.ts`: `/`, `/login`,
  `/awards`, `/sun-kudos`, `/general-rules`, `/profile`, and every API route except the
  finalized whitelist (Next.js internals `/_next/*`, static assets `/public/*`, favicon,
  the prelaunch route itself `/coming-soon`, and `/api/health` if/when added). All
  Auth.js paths (`/api/auth/*` — `callback`, `csrf`, `session`, `signin`, `signout`)
  are deliberately NOT whitelisted (Q-PG4 resolved) and redirect to `/coming-soon`.
- Both anonymous AND authenticated users hit this route during the prelaunch window.

**Incoming edges** (post-prelaunch, i.e. `now() >= SAA_LAUNCH_AT`):
- None — visiting the prelaunch route redirects to `/` and the gate is no longer applied
  to any other route.

**Predicted APIs**:
- **None.** Countdown reads the env-derived `SAA_LAUNCH_AT` value, parsed by an
  event-config module sibling of [src/lib/event/event-config.ts](src/lib/event/event-config.ts)
  (or extended to expose both datetimes). No `GET /api/event/config` call anticipated; the
  proxy reads the env var on each request (or once at module load — implementation
  detail for the spec/plan phase).

**Reused / shared components** (do NOT rebuild):
- `Countdown` ([src/components/home/Countdown.tsx](src/components/home/Countdown.tsx)) — already shipped for Homepage SAA Phase 13. The Days/Hours/Minutes tile shape, digital-numerals font, glass-blur surface, and `#FFEA9E` border are visually identical between the two frames; the prelaunch page is a stripped-down wrapper that omits the surrounding `B1` "Coming soon" copy and event-info block. Plan should parameterize / reuse the existing component, not fork. **Q-CP5 resolved** → extend the component with an optional prop `subtitleAs?: "p" | "h1"` (default `"p"`); the prelaunch route mounts `<Countdown subtitleAs="h1" subtitleKey="prelaunch.heading" />` while Homepage continues to render its existing `<p>` variant unchanged. Unit labels (DAYS/HOURS/MINUTES) inherit the existing `home.hero.countdown.{days,hours,minutes}` keys — no change.
- `MM_MEDIA_BG Image` + dark cover overlay — reuses the same key-art asset family as Homepage SAA hero (`3.5` keyvisual). Treat as a shared media token.
- Locale: heading text is rendered via a **NEW dedicated i18n key `prelaunch.heading`** (Q-CP4 resolved — NOT reusing Homepage's `home.hero.subtitle`; conflating the gate-lift moment with the ceremony-start moment was rejected). Both `vi-VN` and `en-US` catalogs MUST be updated in lockstep — the parity test (`tests/unit/lib/i18n/parity.test.ts`) enforces this. Translation helper (`src/lib/i18n/index.ts`) is reused unchanged.

**New components to build** (Q-PG3 resolved — finalized targets, plan-phase ready):
- `PrelaunchPage` (route component) at **`app/coming-soon/page.tsx`** — full-bleed
  background + centered `Countdown` reuse. Thin Server Component that renders existing
  primitives; mounts `<Countdown subtitleAs="h1" subtitleKey="prelaunch.heading" />`.
  Reads `SAA_LAUNCH_AT` via the typed `config` module. Auth-agnostic — does NOT call
  `auth()`.
- `proxy.ts` (project root) — Next.js 16 `proxy` (renamed from `middleware` in Next.js 16; runs on the Node.js runtime — Edge is NOT supported in `proxy`) implementing the global gate.
  On every request: (a) short-circuit if path is in whitelist (`/_next/*`, `/public/*`,
  favicon, `/coming-soon`, `/api/health` if added); (b) compare `now()` to
  `SAA_LAUNCH_AT`; (c) if before (or env null/malformed — fail closed per Q-PG2),
  redirect non-whitelisted requests to `/coming-soon`; (d) if at `/coming-soon`
  post-gate, redirect to `/`.
- Env-config helper — add `SAA_LAUNCH_AT` to the Zod schema in
  [src/lib/config.ts](src/lib/config.ts) (sibling of the existing `SAA_EVENT_START_AT`)
  and expose it via `config.SAA_LAUNCH_AT`. No direct `process.env` reads outside this
  module.

**Open questions for spec/plan phase** — **all RESOLVED 2026-05-08** (see spec
[`specs/8PJQswPZmU-countdown-prelaunch-page/spec.md`](specs/8PJQswPZmU-countdown-prelaunch-page/spec.md)
§ Resolved Decisions for full traceability and FR/TR anchors):

*Resolved by 2026-05-08 architectural revision:*
- **Q-CP1** (routing — inline `/` variant vs. dedicated path): **RESOLVED** — dedicated
  prelaunch route under a global proxy-driven gate. Path finalized to `/coming-soon`
  (see Q-PG3).
- **Q-CP2** (auth gating — pre-auth or behind Auth.js): **RESOLVED** — auth-agnostic
  during the gate. Both anonymous and authenticated users see the prelaunch screen;
  sessions persist; no `auth()` call in the prelaunch render path.

*Resolved 2026-05-08 alongside the gate-architecture batch:*
- **Q-CP3** Granularity: **RESOLVED** → **minute-only forever**. No seconds tile.
  Matches Figma + Homepage `B1`. No second-level final-hour surge; lower jitter /
  battery / test surface.
- **Q-CP4** i18n: **RESOLVED** → **dedicated i18n key `prelaunch.heading`** (NOT
  reusing Homepage's `home.hero.subtitle`). Both `vi-VN` and `en-US` catalogs MUST be
  updated in lockstep — the parity test enforces it. Unit labels (DAYS / HOURS /
  MINUTES) inherit the existing `Countdown` component's
  `home.hero.countdown.{days,hours,minutes}` keys — no new label keys. Locale source
  remains the `saa_locale` cookie (defaults to `vi-VN` if absent); no locale chip on
  the prelaunch screen.
- **Q-CP5** Heading element: **RESOLVED** → **extend the existing `Countdown`
  component with an optional prop `subtitleAs?: "p" | "h1"` (default `"p"`)**. The
  prelaunch route mounts `<Countdown subtitleAs="h1" subtitleKey="prelaunch.heading" />`;
  Homepage continues to render `<p>` (no behavior change). Adds one Vitest case for
  the new prop.

*Gate-architecture questions (Q-PG = Pre-launch Gate) — all RESOLVED 2026-05-08:*
- **Q-PG1** Env var name: **RESOLVED** → **`SAA_LAUNCH_AT`** (chosen by user —
  terser and marketing-friendly — over earlier-discussed verbose alternatives such
  as `SAA_PRELAUNCH_UNTIL` / `SAA_GATE_END_AT`).
  Added to the Zod schema in [`src/lib/config.ts`](src/lib/config.ts) and exposed via
  `config.SAA_LAUNCH_AT`.
- **Q-PG2** Missing-env behavior: **RESOLVED** → **always fail closed**, regardless
  of `NODE_ENV`. Null / empty / malformed env keeps the gate active and serves
  `/coming-soon` with `--/--/--` placeholders. Trade-off: every environment
  (production, development, test, CI) MUST set `SAA_LAUNCH_AT` explicitly — set to a
  past ISO-8601 timestamp to disable the gate, future to activate it. `.env.example`,
  the dev onboarding doc, and CI workflow files MUST be updated.
- **Q-PG3** Route path: **RESOLVED** → **`/coming-soon`**. New file at
  `app/coming-soon/page.tsx`.
- **Q-PG4** Whitelist details: **RESOLVED** → **Whitelisted**: `/coming-soon` itself,
  `/_next/*`, `/public/*`, favicon, `/api/health` (if/when added). **NOT
  whitelisted**: every Auth.js route under `/api/auth/*` — including `callback`,
  `csrf`, `session`, `signin`, `signout`. All redirect to `/coming-soon` like any
  other application route. Rationale — `/login` is unreachable during the gate so
  OAuth init never happens; allowing the callback open would create a probe surface
  during the gate window.
- **Q-PG5** Post-gate redirect target: **RESOLVED** → **always redirect
  `/coming-soon` → `/`**. Homepage US0 then handles anon → `/login` and authed →
  render Homepage. Single redirect target, no duplicated branching logic in the
  prelaunch layer; the one-extra-hop cost for anon is accepted.

---

## Screen Details — Homepage SAA (`i87tDx10uM`)

**Type**: Authenticated-only route (post-login landing page). Anonymous requests to `/` are redirected to `/login` per spec FR-001a (US0). The chain is symmetrical with Login spec US2 (authed → `/`).

**Purpose**: Internal program landing page for SAA 2025 — introduces the "Root Further"
theme, displays a live countdown to the event, surfaces the six award categories, and promotes
the Sun* Kudos campaign. Acts as the primary navigation hub once the user is authenticated. There is no anonymous variant.

**Top-level structure** (from Figma frame `2167:9026`):

| Section | Frame ID | Notes |
|---------|----------|-------|
| `A1` Header | `2167:9091` (instance of `186:1602`) | Logo + nav links (`About SAA 2025` selected, `Awards Information`, `Sun* Kudos`) + Notification bell + Language chip + Profile avatar. |
| `3.5` Keyvisual / Hero | `2167:9027` | "ROOT FURTHER" key art with cover overlay. |
| `B1` Countdown Time | `2167:9035` | "Coming soon" subtitle + 3 tiles `B1.3.1` Days / `B1.3.2` Hours / `B1.3.3` Minutes. Auto-tick (per-minute granularity). Hides "Coming soon" and freezes at `00` once the configured event datetime passes. |
| `B2` Thông tin sự kiện | `2167:9053` | Static event metadata: `Thời gian: 18h30`, `Địa điểm: Nhà hát nghệ thuật quân đội`, with a "Tường thuật trực tiếp tại Group Facebook Sun* Family" note. |
| `B3` Call-To-Action | `2167:9062` | `B3.1` ABOUT AWARDS (yellow / hover state in design) → Awards Information; `B3.2` ABOUT KUDOS (outline / normal state) → Sun* Kudos. |
| `B4` Root Further content | `5001:14827` | Three-paragraph theme essay (Vietnamese) + the "A tree with deep roots fears no storm" pull-quote. Static, responsive. |
| `C1` Header Giải thưởng | `2167:9069` | Section title block: caption "Sun* annual awards 2025", H1 "Hệ thống giải thưởng", supporting copy. |
| `C2` Award list | `5005:14974` | Responsive grid of 6 award cards (mobile/tablet 2-col, desktop 3-col). Each card has thumbnail + title + 1–2 line description + `Chi tiết` button. Click navigates to `Awards Information` with `#<award-slug>` so the browser scrolls to the matching award. Items: `C2.1` Top Talent, `C2.2` Top Project, `C2.3` Top Project Leader, `C2.4` Best Manager, `C2.5` Signature 2025 — Creator, `C2.6` MVP. |
| `D1` / `D2` Sun* Kudos block | `3390:10349` | Promo block: label "Phong trào ghi nhận", title "Sun* Kudos", description, illustration, `D2.1` `Chi tiết` button → Sun* Kudos detail. |
| `6` Widget Button | `5022:15169` | Floating quick-action pill (105×64px, yellow) anchored bottom-right; opens a quick-action menu (write Kudos / SAA rules entry points). |
| `7` Footer | `5001:14800` | Logo (`7.1`) + nav links (`7.2` About SAA 2025, `7.3` Awards Information, `7.4` Sun* Kudos, `7.5` Tiêu chuẩn chung) + copyright "Bản quyền thuộc về Sun* © 2025". Same link semantics as header. |

**Header controls** (`A1`):
- `A1.1` Logo (64×60) — click → scroll to top of `About SAA 2025`.
- `A1.2` `About SAA 2025` (Selected state) — current page; if already selected, click scrolls to top.
- `A1.3` `Awards Information` (Hover state in design) — navigates to Awards Information.
- `A1.5` `Sun* Kudos` (Normal state) — navigates to Sun* Kudos.
- `A1.6` Notification (40×40) — opens the notification panel; bell shows a red badge (`Badge/Dot`) when unread items exist.
- `A1.7` Language chip — currently `VN`; click opens **Dropdown — Language** (`hUyaaugye2`). Reuses the already-shipped `LanguageSelector` component.
- `A1.8` Profile avatar (40×40) — click opens **Dropdown — Profile** (`z4sCl3_Qtk` for users, `54rekaCHG1` for admins). Figma navigation prop on `A1.8` references `linkedFrameId: 721:5223` (legacy `Dropdown-profile` frame); the surveyed reusable equivalents are `z4sCl3_Qtk` / `54rekaCHG1`.

**Outgoing navigation edges**:
- `A1.1` Logo → in-page scroll to top (no route change).
- `A1.2` / `A1.3` / `A1.5` / footer `7.2`–`7.5` → respective routes (Awards Information, Sun* Kudos, About, Tiêu chuẩn chung).
- `A1.6` Notification → opens Notification panel (overlay; not yet surveyed as a separate frame).
- `A1.7` → opens overlay `hUyaaugye2` (Dropdown — Language).
- `A1.8` → opens overlay `z4sCl3_Qtk` (user) or `54rekaCHG1` (admin) based on role.
- `B3.1` ABOUT AWARDS → Awards Information.
- `B3.2` ABOUT KUDOS → Sun* Kudos.
- `C2.1`–`C2.6` award cards (image / title / `Chi tiết`) → Awards Information `#<award-slug>` (e.g. `#top-talent`).
- `D1` / `D2.1` `Chi tiết` → Sun* Kudos detail.
- `6` Widget Button → opens floating quick-action menu (overlay).

**Predicted APIs**:
- `GET /api/users/me` — load current user (avatar, role, locale) for the header on first paint.
- `GET /api/event/config` — fetch event start datetime (ISO-8601, env-configurable per spec) for countdown computation. Could equivalently come from a build-time env var; doc both options in plan phase.
- `GET /api/awards` — list of 6 award categories (id, slug, title, short description, thumbnail). Could be static catalog at MVP.
- `GET /api/notifications` (or `GET /api/notifications/unread-count`) — feeds the bell badge.
- `GET /api/kudos/summary` — copy + image for the `D1` Sun* Kudos block (optional; may be CMS-driven static content at MVP).
- `POST /api/i18n/locale` — already shipped; reused by `A1.7` via `LanguageSelector`.
- `POST /api/auth/signout` — already shipped; invoked from `A1.8` Profile dropdown.

**Reused / shared components** (do NOT rebuild):
- `LanguageSelector` ([src/components/header/LanguageSelector.tsx](src/components/header/LanguageSelector.tsx)) — anchors `A1.7`. Already shipped via Login (commit `8c0022f`).
- `Header` ([src/components/header/Header.tsx](src/components/header/Header.tsx)) — already mounts the language selector. Homepage SAA's header (`A1`) extends it with the nav-link group (`A1.2`/`A1.3`/`A1.5`), Notification bell (`A1.6`), and Profile avatar (`A1.8`). Plan should add these slots to the existing component rather than fork a new header.
- `Logo` — design item `A1.1` (64×60) and footer `7.1` (69×64) reuse the same brand asset (`MM_MEDIA_Logo`, component `178:1032`); should be a single `<Logo>` component with an optional size prop.
- Locale types & cookie helpers ([src/lib/i18n/types.ts](src/lib/i18n/types.ts), [src/lib/cookies/saa-locale.ts](src/lib/cookies/saa-locale.ts)) — reused unchanged.
- Translation helper [src/lib/i18n/index.ts](src/lib/i18n/index.ts) — extend per-locale catalogs (`vi-VN`, `en-US`) with Homepage strings; do NOT introduce `next-intl`.

**New components to build** (anticipated, subject to plan phase):
- `Countdown` — derives Days/Hours/Minutes from configured event datetime; per-minute tick; gracefully renders `00` and hides "Coming soon" once elapsed.
- `AwardCard` (× rendered six times) — thumbnail + title + clamped 2-line description + `Chi tiết` link. Hover lifts/glows.
- `AwardGrid` — responsive container around six `AwardCard`s.
- `NotificationBell` — icon + unread badge; opens a panel (panel itself is a future overlay component).
- `ProfileMenu` — avatar trigger that mounts the Dropdown — Profile overlay (user vs admin variant resolved by role).
- `CTAButton` — shared style for `B3.1` / `B3.2` (yellow filled vs outline).
- `Footer` — based on `7` instance; reuses `Logo` and the same nav-link button component as the header.
- `WidgetButton` — floating quick-action FAB (`6`).

**Open questions for spec/plan phase**:
- Q-H1: Is the event start datetime configured via env var only (per `B1` description) or is there a server-driven `GET /api/event/config` endpoint? Default to env var at MVP unless admin tooling needs to change it without redeploy.
- Q-H2: Are award categories static (hard-coded JSON) or admin-editable via API? Six fixed awards in 2025 design — static at MVP is acceptable.
- Q-H3: Notification panel — separate frame to survey, or out of scope for this milestone?
- Q-H4: Profile dropdown role-routing — does the client receive `user.role` from `GET /api/users/me`, or does the server pre-select the variant via Server Component?

---

## Navigation Graph

```mermaid
flowchart TD
    subgraph Gate["Prelaunch period (now() < SAA_LAUNCH_AT) — proxy.ts redirects ALL non-whitelisted requests to /coming-soon"]
        AnyReq{"Any incoming request<br/>(/, /login, /awards, /sun-kudos,<br/>/general-rules, /profile, /api/*)"}
        Whitelist[/"Whitelist (Q-PG4 resolved):<br/>/_next/*, /public/*,<br/>/coming-soon, favicon,<br/>/api/health (if added)"/]
        Prelaunch["Countdown - Prelaunch<br/>8PJQswPZmU<br/>(/coming-soon, global gate)"]
        AnyReq -->|in whitelist| Whitelist
        AnyReq -->|NOT whitelisted, gate active<br/>anon AND authed<br/>(includes /api/auth/* — see note)| Prelaunch
    end

    subgraph Auth["Authentication Flow (post-gate)"]
        Login["Login (/login)<br/>GzbNeVGJHz"]
        LoginIOS["[iOS] Login<br/>8HGlvYGJWq"]
    end

    subgraph Main["Main Application (post-gate)"]
        Home["Homepage SAA<br/>i87tDx10uM"]
        Awards["Awards Information<br/>(stub 2026-05-08)"]
        Kudos["Sun* Kudos<br/>(stub 2026-05-08)"]
        Standards["Tiêu chuẩn chung<br/>(stub 2026-05-08)"]
    end

    subgraph Errors["Error / Edge"]
        E403["403 Forbidden<br/>T3e_iS9PCL"]
    end

    subgraph Components["Reusable Overlays (no route)"]
        DDLang["Dropdown — Language<br/>hUyaaugye2"]
        DDUser["Dropdown — Profile (user)<br/>z4sCl3_Qtk"]
        DDAdmin["Dropdown — Profile (admin)<br/>54rekaCHG1"]
        NotifPanel["Notification Panel<br/>(TBD)"]
        QuickActions["Quick-Actions Widget<br/>(TBD)"]
    end

    Google[(Google OAuth)]

    %% --- Post-gate flows: only fire when now() >= SAA_LAUNCH_AT ---
    Login -->|LOGIN With Google| Google
    Google -->|callback success| Home
    Google -->|deny / error| Login

    Login -.->|opens overlay| DDLang
    Home  -.->|opens overlay (A1.7)| DDLang
    Home  -.->|opens overlay (A1.8 user)| DDUser
    Home  -.->|opens overlay (A1.8 admin)| DDAdmin
    Home  -.->|opens panel (A1.6)| NotifPanel
    Home  -.->|opens menu (#6 FAB)| QuickActions

    Home  -->|ABOUT AWARDS / nav A1.3 / footer 7.3 / award card #slug| Awards
    Home  -->|ABOUT KUDOS / nav A1.5 / footer 7.4 / Sun* Kudos block| Kudos
    Home  -->|footer 7.5| Standards

    DDUser  -->|Logout| Login
    DDAdmin -->|Logout| Login
    E403    -->|Back| Login

    Login -->|already authenticated| Home
    Home  -->|anon visitor (FR-001a / US0)| Login

    %% --- Gate lift: post-prelaunch handoff ---
    Prelaunch -->|"now() >= SAA_LAUNCH_AT<br/>visit prelaunch → redirect to /"| Home
    Prelaunch -.->|"gate lifts → next request to /<br/>follows Homepage US0 (anon → /login)"| Login
```

> Dotted edges = overlay open/close OR conditional redirect (no in-screen interaction).
> Solid edges between routes = real navigation / proxy redirect.
> **Global precondition for every Auth/Main/Errors edge above**: `now() >= SAA_LAUNCH_AT`.
> Pre-prelaunch-end, all of those edges are short-circuited by the proxy and rerouted
> to Prelaunch (see the `Gate` cluster).
>
> **Footnote on the Gate whitelist (Q-PG4 resolved)**: every Auth.js route under
> `/api/auth/*` — including `callback`, `csrf`, `session`, `signin`, `signout` — is
> deliberately **NOT** whitelisted. They redirect to `/coming-soon` like any other
> application route. Rationale: `/login` is unreachable during the gate, so OAuth init
> never happens; whitelisting the callback would create a probe surface during the gate
> window.

---

## Screen Groups

### Group: Authentication
| Screen | Purpose | Entry Points |
|--------|---------|--------------|
| Login (`GzbNeVGJHz`) | Google-OAuth-only sign-in | App entry, Logout from any auth page, 403 → Back |
| [iOS] Login (`8HGlvYGJWq`) | Mobile variant of Login | Same as Login (likely a responsive single route) |

### Group: Main Application
| Screen | Purpose | Entry Points |
|--------|---------|--------------|
| Countdown - Prelaunch page (`8PJQswPZmU`, route **`/coming-soon`** — Q-PG3 resolved) | **Global pre-launch gate.** Standalone full-bleed prelaunch screen (BG art + Days/Hours/Minutes countdown counting down to `SAA_LAUNCH_AT`). While the gate is active, every non-whitelisted route in the app redirects to `/coming-soon` via Next.js `proxy.ts`. Auth-agnostic: anon and authed users both land here, sessions persist. Missing-env behavior: always fail closed (Q-PG2). | (1) Direct visit to `/coming-soon`. (2) **Proxy redirect from every other route** during the prelaunch window — `/`, `/login`, `/awards`, `/sun-kudos`, `/general-rules`, `/profile`, and every API route except the finalized whitelist (`/_next/*`, `/public/*`, favicon, `/coming-soon`, `/api/health` if/when added). All Auth.js paths `/api/auth/*` are deliberately NOT whitelisted (Q-PG4 resolved) and redirect to `/coming-soon`. |
| Homepage SAA (`i87tDx10uM`) | Post-auth landing — hero / countdown / award catalog / Sun* Kudos promo / footer | Login success, direct visit while authenticated, Logo / `About SAA 2025` link from any other page |
| Awards Information (stub 2026-05-08) | Per-award detail content; deep-links to `#<award-slug>`. Stub at [app/awards/page.tsx](app/awards/page.tsx) — placeholder pending real implementation. | Header `Awards Information`, footer link, `ABOUT AWARDS` CTA, any award card on Homepage |
| Sun* Kudos (stub 2026-05-08) | Sun* Kudos campaign detail. Stub at [app/sun-kudos/page.tsx](app/sun-kudos/page.tsx) — placeholder pending real implementation. | Header `Sun* Kudos`, footer link, `ABOUT KUDOS` CTA, Sun* Kudos block `Chi tiết` |
| Tiêu chuẩn chung (stub 2026-05-08) | Shared standards / criteria page. Stub at [app/general-rules/page.tsx](app/general-rules/page.tsx) — placeholder pending real implementation. | Footer `7.5` |
| Profile (stub 2026-05-08) | User profile destination. Stub at [app/profile/page.tsx](app/profile/page.tsx) — placeholder pending Profile spec survey. | Profile dropdown `A.1` Hồ sơ |

### Group: Errors
| Screen | Purpose | Entry Points |
|--------|---------|--------------|
| 403 (`T3e_iS9PCL`) | Access denied | Authorization failures |

### Group: Reusable Overlays (no route)
| Component | Purpose | Hosted by |
|-----------|---------|-----------|
| Dropdown — Language (`hUyaaugye2`) | Switch UI locale (VN ↔ EN) | Login, Homepage SAA, any header-bearing screen |
| Dropdown — Profile user (`z4sCl3_Qtk`) | User account actions, Logout | Authenticated user routes |
| Dropdown — Profile admin (`54rekaCHG1`) | Admin account actions, Logout | Admin routes |

---

## API Endpoints Summary

| Endpoint | Method | Screens Using | Purpose |
|----------|--------|---------------|---------|
| `/api/auth/signin/google` | POST | Login | Initiate Google OAuth |
| `/api/auth/callback/google` | GET | Login (callback) | OAuth callback |
| `/api/auth/signout` | POST | Profile dropdowns | Sign out, clear session |
| `/api/i18n/locale` | POST | Dropdown — Language (host: any auth screen) | Persist locale for authenticated user (writes `User.locale` + mirrors `saa_locale` cookie). Returns 401 unauthenticated, 400 on invalid body, 204 on success. |
| `/api/users/me` | GET | Homepage SAA (predicted) | Load profile (avatar, role, locale) for header on first paint |
| `/api/event/config` | GET | Homepage SAA — Countdown `B1` (predicted) | Event start datetime (ISO-8601) for countdown computation. May be replaced by env var. |
| `/api/awards` | GET | Homepage SAA — Award list `C2` (predicted) | List of 6 award categories (slug, title, short description, thumbnail). May be a static catalog at MVP. |
| `/api/notifications` | GET | Homepage SAA — Notification bell `A1.6` (predicted) | Unread count for the bell badge; opens panel on click. |
| `/api/kudos/summary` | GET | Homepage SAA — Sun* Kudos block `D1` (predicted) | Promo block copy + image. Optional; may be CMS-driven static content at MVP. |

---

## Technical Notes

### Authentication Flow
- Auth.js (NextAuth) — Google provider only.
- Session check via `auth()` helper in Server Components / proxy; authenticated visitors
  to `/login` are redirected before any markup is sent.

### Locale Handling (Dropdown — Language)
- Default locale: `vi-VN` (chip `VN`); alternative `en-US` (chip `EN`).
- Allowlisted locales: `vi-VN`, `en-US`. Single source of truth for the allowlist + chip + flag map: [src/lib/i18n/types.ts](src/lib/i18n/types.ts) (`SUPPORTED_LOCALES`, `LOCALE_DISPLAY`). Server-side enforcement per Login spec TR-006 lives in [src/lib/cookies/saa-locale.ts](src/lib/cookies/saa-locale.ts) (`getSaaLocale` clears tampered values).
- Unauthenticated users: `saa_locale` cookie only (1y, `SameSite=Lax`, `Path=/`, `HttpOnly=false`).
- Authenticated users: cookie + `User.locale` row, updated via `POST /api/i18n/locale` (optimistic UI, reverted in `LanguageSelector.tsx` if the call fails).
- Translation helper: custom `t(key, locale)` at [src/lib/i18n/index.ts](src/lib/i18n/index.ts) over per-locale JSON catalogs (`src/lib/i18n/catalogs/{vi-VN,en-US}.json`). The project deliberately did NOT adopt `next-intl` — do not reintroduce it without an explicit cross-cutting decision.

### Routing
- Next.js App Router. Protected routes require an authenticated session.
- **Pre-launch gate** (added 2026-05-08): Next.js `proxy.ts` enforces a global
  redirect-to-prelaunch policy while `now() < SAA_LAUNCH_AT`. The gate is
  auth-agnostic and applies to every route except the whitelist (Next.js internals,
  static assets, the prelaunch route itself, diagnostic endpoints). Once `now() >=
  SAA_LAUNCH_AT`, the proxy short-circuits and all routes resume normal
  behavior; visiting the prelaunch route post-gate redirects to `/`. The gate's anchor
  env var `SAA_LAUNCH_AT` is independent of `SAA_EVENT_START_AT` — they can be set
  separately. See "Screen Details — Countdown - Prelaunch page" for full architecture and
  open questions Q-PG1..Q-PG5.

---

## Discovery Log

| Date | Action | Screens / Components | Notes |
|------|--------|----------------------|-------|
| 2026-05-06 | Initial survey | Login (`GzbNeVGJHz`) | Spec + plan + tasks completed; outgoing edges to Homepage and Dropdown — Language confirmed. |
| 2026-05-07 | Component survey | Dropdown — Language (`hUyaaugye2`) | Reusable overlay; VN + EN items mapped; no navigation edges. |
| 2026-05-07 | Drift sync | Dropdown — Language (`hUyaaugye2`) | Aligned doc with shipped code: API path `POST /api/i18n/locale` (was `PATCH /api/users/me/locale`); component file `LanguageSelector.tsx` (was `LanguageDropdown.tsx`); expanded Locale Handling section with concrete file paths; noted that frame `hUyaaugye2` is a visual refresh, not a new build. |
| 2026-05-07 | Chip flip (Q5) | Dropdown — Language (`hUyaaugye2`) | English chip flipped from `US` (🇺🇸) → `EN` (🇬🇧) to match Figma frame `hUyaaugye2`. `LOCALE_DISPLAY` updated; `flag-en.svg` added; `flag-us.svg` removed; tests + Login spec Q1 audit log + this doc all synced. Locale code `en-US` unchanged. |
| 2026-05-07 | Screen survey | Homepage SAA (`i87tDx10uM`) | Mapped Figma frame `2167:9026`: header `A1` reuses shipped `Header` + `LanguageSelector` (locale chip `A1.7`); confirmed outgoing routes to Awards Information (`A1.3`, `B3.1` ABOUT AWARDS, footer `7.3`, six award cards `C2.1`–`C2.6` with `#<award-slug>` deep-links), Sun* Kudos (`A1.5`, `B3.2` ABOUT KUDOS, footer `7.4`, `D1`/`D2.1` Sun* Kudos block), Tiêu chuẩn chung (footer `7.5`). Overlays: `A1.7` → Dropdown — Language, `A1.8` → Dropdown — Profile (user `z4sCl3_Qtk` / admin `54rekaCHG1`; Figma legacy linkedFrameId `721:5223` noted), `A1.6` → Notification panel (TBD), `#6` FAB → quick-actions menu (TBD). Predicted APIs added: `GET /api/users/me`, `GET /api/event/config`, `GET /api/awards`, `GET /api/notifications`, `GET /api/kudos/summary`. New components anticipated: `Countdown`, `AwardCard`/`AwardGrid`, `CTAButton`, `NotificationBell`, `ProfileMenu`, `Footer`, `Logo`, `WidgetButton`. Mermaid graph extended with Awards / Sun* Kudos / Tiêu chuẩn chung route nodes and Notification / Quick-actions overlays. |
| 2026-05-07 | Access-control flip | Homepage SAA (`i87tDx10uM`) | Homepage flipped from "open with conditional auth UI" → **authenticated-only**. Anonymous visitors are redirected to `/login` per spec FR-001a / US0; chain is symmetrical with Login spec US2. Spec Q3 (FAB visibility for anon) and Q5 (sign-in CTA on anon header) collapsed to "not applicable". FR-004 / FR-015 simplified to "always render" (no conditional anon variant). Mermaid graph adds `Home → Login` edge labeled "anon visitor (FR-001a)". Awards data confirmed static (Q2). Footer "Tiêu chuẩn chung" route locked to `/general-rules` (Q1). Header reuse confirmed: extend existing `Header` with optional slots, no fork (Q4). |
| 2026-05-08 | Component survey + retroactive spec | Dropdown — Profile user (`z4sCl3_Qtk`) | Mapped Figma frame `721:5223`: `A_Dropdown-List` (`666:9601`) chứa `A.1_Profile` (icon_text + user icon) và `A.2_Logout` (icon_text + chevron-right). Logout edge → `/login` confirmed (đã wired qua `<form action="/api/auth/signout" method="post">`, ship cùng Homepage Phase 13). Profile edge → `/profile` (TBD route — Q-DPU1). Spec viết hồi tố ở [specs/z4sCl3_Qtk-dropdown-profile/spec.md](specs/z4sCl3_Qtk-dropdown-profile/spec.md) để khoá hành vi (US1 mở/đóng, US2 navigate Profile, US3 signout, US4 dismiss, US5 keyboard/a11y), neo Node IDs, và làm điểm tham chiếu cho biến thể admin `54rekaCHG1` sẽ có spec riêng khi `User.role` migration unblock. Homepage spec không cần cập nhật — `A1.8` đã reference đúng overlay. Component file [src/components/home/ProfileButton.tsx](src/components/home/ProfileButton.tsx); 7 ca unit test xanh. Open questions: Q-DPU1 `/profile` 404 / stub / scope; Q-DPU2 thêm Escape handler; Q-DPU3 unblock admin variant. |
| 2026-05-08 | Bug fix + stub routes | Homepage SAA (`i87tDx10uM`) + Dropdown — Profile (`z4sCl3_Qtk`) | **Hydration bug on back-from-404 fixed via stub pages.** User reported: clicking any nav/footer link from homepage navigates correctly, but on browser back the avatar / language / notification-bell click handlers no longer respond. Root cause: in Next.js 16 + Turbopack dev, when user clicks `<Link>` to a non-existent route, Next.js renders 404; clicking back fails to re-attach React to the homepage DOM (verified: `<main>` loses `__reactFiber`/`__reactProps`, avatar button loses `__reactProps.onClick`; click events still bubble to `document` but React event delegation is dead). Custom `app/not-found.tsx` was tried first and verified NOT to fix it (only changes the 404 UI, doesn't restore hydration). Fix: stub pages for the 4 missing destinations referenced from homepage — [app/awards/page.tsx](app/awards/page.tsx), [app/sun-kudos/page.tsx](app/sun-kudos/page.tsx), [app/general-rules/page.tsx](app/general-rules/page.tsx), [app/profile/page.tsx](app/profile/page.tsx) — each authed-gated and rendering shared [src/components/ui/StubPage.tsx](src/components/ui/StubPage.tsx) (title + "Trang đang được xây dựng" + Link back to `/`). Eliminates the 404 trigger so back navigation no longer corrupts hydration. Verified via Playwright headless across all 4 routes: avatar/language/bell click all work after back. **This is a workaround**, not a Next.js fix — the underlying bug should be reported upstream with minimal repro. Spec sync: dropdown-profile/spec.md Q1 reversed (404 → stub) and Q6 added documenting full diagnosis; SCREENFLOW Main Application screens table + Mermaid graph + Q-DPU1 + Next Steps backlog all flipped from `(TBD)` → `(stub 2026-05-08)`. Lint + tsc clean. |
| 2026-05-08 | Bug fix + spec sync | Dropdown — Profile user (`z4sCl3_Qtk`) | **Signout pattern migrated to Server Action.** User reported click "Đăng xuất" → 302 redirect tới `/api/auth/signin?error=MissingCSRF` instead of `/login`. Root cause: shipped raw `<form action="/api/auth/signout" method="post">` (NextAuth v4 pattern) but project uses Auth.js v5, which requires CSRF token in body for the catch-all `/api/auth/signout` POST. Fix: created [src/actions/auth.ts](src/actions/auth.ts) with `"use server"` exporting `signOutAction()` that calls `signOut({ redirectTo: "/login" })`; ProfileButton now uses `<form action={signOutAction}>`. Next.js Server Action token handles CSRF; Auth.js deletes Session row + clears cookie + redirects. Verified end-to-end via Playwright headless with real session cookie: final URL `/login`, session row deleted. Unit test updated (mock the action to keep jsdom env from loading NextAuth). spec.md hygiene: FR-005 / TR-007 / Security CSRF / API table / Implementation Status / acceptance scenarios all synced; Q5 added to Resolved Questions. SCREENFLOW behavior bullet (line 103) updated; raw `/api/auth/signout` form action now flagged forbidden. |
| 2026-05-08 | Screen survey (flow only) | Countdown - Prelaunch page (`8PJQswPZmU`) | Mapped Figma frame `2268:35127` (1512×900). Structure: full-bleed `MM_MEDIA_BG Image` (`2268:35129`) + dark `Cover` overlay (`2268:35130`) + centered `Bìa` container (`2268:35131`) holding heading "Sự kiện sẽ bắt đầu sau" (`2268:35137`, Montserrat 700/36px) and a `Time` row (`2268:35138`) of three units: `1_Days` / `2_Hours` / `3_Minutes` (each = two glass-blur digit tiles, instances of component `186:2619`, with `Digital Numbers` 73.7px digits and a `DAYS` / `HOURS` / `MINUTES` Latin label below). No header, footer, nav, or interactive controls; no outgoing edges; the only edge is the logical "countdown elapsed → Homepage SAA" handoff. Predicted APIs: **none** — same env-driven datetime as Homepage `B1` (`SAA_EVENT_START_AT` via [src/lib/event/event-config.ts](src/lib/event/event-config.ts)). Reuses shipped `Countdown` component ([src/components/home/Countdown.tsx](src/components/home/Countdown.tsx)) and the SAA root-art BG asset family. Open questions Q-CP1..Q-CP4 logged (routing — inline `/` variant vs. dedicated path; auth gating; minute vs. seconds granularity; i18n of labels). No spec/plan written per skill instruction "do not create a feature spec — only update SCREENFLOW.md". |
| 2026-05-08 | **Prelaunch spec — open questions resolved** | Countdown - Prelaunch page (`8PJQswPZmU`) | All eight pending open questions on the prelaunch spec resolved in one pass — Q-CP1..Q-CP5 (countdown / page) and Q-PG1..Q-PG5 (gate). Headline choices: env var = **`SAA_LAUNCH_AT`** (Q-PG1, terser/marketing-friendly than verbose earlier-discussed alternatives); missing-env behavior = **always fail closed** in every `NODE_ENV` (Q-PG2 — every environment MUST set the env explicitly, past timestamp = gate disabled, future = active); route path = **`/coming-soon`** (Q-PG3, new file `app/coming-soon/page.tsx`); whitelist (Q-PG4) = `/_next/*`, `/public/*`, favicon, `/coming-soon`, `/api/health` if/when added — **all Auth.js routes `/api/auth/*` (`callback`, `csrf`, `session`, `signin`, `signout`) are deliberately NOT whitelisted**, they redirect to `/coming-soon` like any other route; post-gate redirect = always `/coming-soon` → `/` (Q-PG5, Homepage US0 owns anon-vs-authed branching); granularity = minute-only forever (Q-CP3, no seconds tile); i18n = NEW dedicated key `prelaunch.heading` updated in lockstep across `vi-VN` and `en-US` catalogs, parity test enforces (Q-CP4 — NOT reusing `home.hero.subtitle`); heading element = extend existing `Countdown` component with optional `subtitleAs?: "p" \| "h1"` prop (default `"p"`), prelaunch route mounts `<Countdown subtitleAs="h1" subtitleKey="prelaunch.heading" />` (Q-CP5). Spec status: **Ready for `momorph.plan`** ([specs/8PJQswPZmU-countdown-prelaunch-page/spec.md](specs/8PJQswPZmU-countdown-prelaunch-page/spec.md) § Resolved Decisions has the full FR/TR anchor matrix). No code shipped this entry; SCREENFLOW.md synced — no other screen sections touched. |
| 2026-05-08 | **Architecture revision — global pre-launch gate** | Countdown - Prelaunch page (`8PJQswPZmU`) + cross-screen | Prelaunch's role fundamentally revised: no longer a `/` inline variant or optional surface — it is now a **global pre-launch gate** enforced by Next.js `proxy.ts`. While `now() < SAA_LAUNCH_AT` (NEW env var, distinct from `SAA_EVENT_START_AT`), every non-whitelisted route (`/`, `/login`, `/awards`, `/sun-kudos`, `/general-rules`, `/profile`, every API route) redirects to the prelaunch screen. Whitelist: `/_next/*`, `/public/*`, prelaunch route itself, diagnostic endpoints (e.g. `/api/health` if present); OAuth callback path handling pending Q-PG4. Auth-agnostic during gate: anon AND authed users land on prelaunch; sessions are NOT invalidated. Post-prelaunch handoff: visiting prelaunch route redirects to `/`; Homepage US0 takes over (anon → `/login`, authed → render Homepage); other routes resume normal behavior. Two countdowns now exist independently: Homepage `B1` continues to count down to `SAA_EVENT_START_AT`; prelaunch counts down to `SAA_LAUNCH_AT`. Logically `SAA_LAUNCH_AT <= SAA_EVENT_START_AT` but not enforced in code. **Q-CP1 RESOLVED** (dedicated path under global gate); **Q-CP2 RESOLVED** (auth-agnostic). Q-CP3 (granularity) and Q-CP4 (i18n) remain open. **NEW open questions** for the gate architecture: Q-PG1 final env var name, Q-PG2 missing-env behavior (gate-disabled vs. fail-closed; recommend env-aware), Q-PG3 final route path (`/prelaunch` vs `/coming-soon` vs other), Q-PG4 OAuth callback + health endpoint whitelist details, Q-PG5 post-prelaunch redirect target (always `/` vs. honor auth → `/login` directly). Mermaid graph rewritten to add a `Gate` cluster visualizing the universal-entry-point semantics. Cross-screen note added at the top of this document and at the Mermaid graph: every other screen's "Incoming"/"Entry points" line carries an implicit precondition `…AND now() >= SAA_LAUNCH_AT`. Individual screen sections (Login, Homepage SAA, Awards, Sun* Kudos, Profile, dropdowns) are NOT individually rewritten — the global note covers them. Spec rewrite for prelaunch (`specs/8PJQswPZmU-countdown-prelaunch-page/spec.md`) is the next workflow step and was deliberately deferred from this revision. |
| 2026-05-07 | UI implementation | Homepage SAA (`i87tDx10uM`) | Phases 1–13 of [tasks.md](specs/i87tDx10uM-homepage-saa/tasks.md) shipped. Reused existing `Header` (extended with `nav` / `notification` / `profileMenu` / `logoHref` slots — slim variant unchanged for Login regression), `LanguageSelector`, `Logo` (now accepts optional `href`), `auth()`, `getSaaLocale()`. New components under [src/components/home/](src/components/home/): `Hero`, `Countdown`, `EventInfo`, `CTAButtons`, `RootFurtherEssay`, `AwardsSectionHeader`, `AwardCard`, `AwardsGrid`, `KudosBlock`, `NavLinks`, `Footer`, `WidgetButton`, `NotificationBell`, `ProfileButton`. New primitives under [src/components/ui/](src/components/ui/): `toast.ts` + `Toaster.tsx` (in-house, mounted in [app/layout.tsx](app/layout.tsx)). New backend: `app/api/notifications/unread-count/route.ts` → `notification-service` → `notification-repository` (v1 stub `0`). Static config at [src/lib/awards/awards.ts](src/lib/awards/awards.ts) (six entries with stable slugs), env parser at [src/lib/event/event-config.ts](src/lib/event/event-config.ts). Tailwind tokens added: `saa-card-surface/border`, `saa-essay-quote-fg`, `saa-fab-bg/fg`, `saa-footer-bg/fg`, `saa-notification-dot`. ~36 i18n keys added to both vi-VN / en-US in lockstep — parity test green. PQ1 = b: `User.role` deferred; ProfileButton ships with the user-only menu (Profile + Sign out via `<form action="/api/auth/signout" method="post">`). `i18n/index.ts` no longer imports the server-only logger so client islands (`NotificationBell`, `WidgetButton`, `ProfileButton`, `Toaster`) can call `t()` without bundler errors. Build / typecheck / lint all clean. |

---

## Next Steps

- [x] Survey Homepage SAA (`i87tDx10uM`) — header reuse (`Header` + `LanguageSelector`) confirmed; outgoing edges to Awards Information / Sun* Kudos / Tiêu chuẩn chung / Profile dropdowns / Notification panel / Quick-actions FAB recorded.
- [ ] Run `momorph.specify` for Homepage SAA to resolve open questions Q-H1..Q-H4 (event datetime source, awards data source, notification panel scope, profile-menu role routing).
- [x] Survey Profile dropdown user variant (`z4sCl3_Qtk`) — Logout → `/login` edge confirmed (`POST /api/auth/signout`); spec hồi tố ([specs/z4sCl3_Qtk-dropdown-profile/spec.md](specs/z4sCl3_Qtk-dropdown-profile/spec.md)).
- [x] Survey Countdown - Prelaunch page (`8PJQswPZmU`) — flow-only survey; no spec written (per skill instruction). Open questions Q-CP1..Q-CP4 logged. Resolve before adding to `momorph.specify` queue.
- [x] **Re-architect Countdown - Prelaunch as global pre-launch gate (2026-05-08)**: Q-CP1 RESOLVED (dedicated path under proxy-driven gate); Q-CP2 RESOLVED (auth-agnostic). Q-CP3 / Q-CP4 still open. NEW open questions Q-PG1..Q-PG5 logged for the gate architecture (env var name, missing-env behavior, route path, OAuth/health whitelist, post-prelaunch redirect target).
- [x] **Resolve Countdown - Prelaunch open questions (2026-05-08)** — all 8 questions (Q-CP1..Q-CP5 + Q-PG1..Q-PG5) closed: env = `SAA_LAUNCH_AT`, missing env = always fail closed, route = `/coming-soon`, OAuth NOT whitelisted, post-gate redirect = always `/`, granularity = minute-only, i18n = dedicated `prelaunch.heading` key, heading element via `Countdown.subtitleAs` prop. Spec ready for plan.
- [ ] **Run `momorph.plan` for Countdown - Prelaunch page (`8PJQswPZmU`)** — spec is now resolved ([specs/8PJQswPZmU-countdown-prelaunch-page/spec.md](specs/8PJQswPZmU-countdown-prelaunch-page/spec.md) § Resolved Decisions, status "Ready for `momorph.plan`"). Plan should produce the proxy contract, env-config helper extension to `src/lib/config.ts`, the `/coming-soon` route at `app/coming-soon/page.tsx`, the new `prelaunch.heading` i18n key in both catalogs, the `Countdown.subtitleAs` prop extension, and the CI-matrix updates (gate-active and gate-disabled jobs) per TR-005.
- [ ] Survey Profile dropdown admin variant (`54rekaCHG1`) — pending `User.role` schema migration (Homepage spec PQ1 = b). Sẽ kế thừa Profile + Sign out, thêm "Admin Dashboard".
- [ ] Survey trang `/profile` (destination cho item `A.1` của dropdown profile user) — stub placeholder ship 2026-05-08 ([app/profile/page.tsx](app/profile/page.tsx)) làm tạm; spec/implementation thực vẫn pending. Q-DPU1 đảo từ "chấp nhận 404" → "stub" do hydration bug.
- [ ] Survey Awards Information and Sun* Kudos detail pages once their frame IDs are added to the file index (deep-link target `#<award-slug>` is required for `C2.*` cards).
- [ ] Survey Notification panel and Quick-actions Widget overlays (anchored from Homepage `A1.6` and `#6`).
- [ ] Survey 403 page (`T3e_iS9PCL`) — confirm "Back" target.
- [ ] Decide responsive vs. separate route for `[iOS] Login` (`8HGlvYGJWq`).
- [ ] Reconcile this overview with `.momorph/contexts/SCREENFLOW.md` after each new screen survey.
