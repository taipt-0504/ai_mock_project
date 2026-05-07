# Screen Flow Overview

## Project Info
- **Project Name**: SAA 2025 (Sun Annual Awards 2025)
- **Figma File Key**: 9ypp4enmFmdK3YAFJLIu6C
- **Figma URL**: https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C
- **Created**: 2026-05-07
- **Last Updated**: 2026-05-07 (Homepage SAA surveyed; access control flipped to authenticated-only — anon users redirected to `/login`)

> Companion file: `.momorph/contexts/SCREENFLOW.md` — keeps the in-depth navigation
> graph + edge-confidence audit (per Constitution Principle III). This document is
> the high-level discovery / index view.

---

## Discovery Progress

| Metric | Count |
|--------|-------|
| Total Screens (known) | 7 |
| Reusable Components (overlays) | 3 |
| Surveyed in depth | 3 (Login, Dropdown — Language, Homepage SAA) |
| Remaining | 4 |
| Completion | ~43% |

---

## Screens

| # | Screen Name | Frame ID | Figma Link | Status | Detail File | Predicted APIs | Navigations To |
|---|-------------|----------|------------|--------|-------------|----------------|----------------|
| 1 | Login | `GzbNeVGJHz` | https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=GzbNeVGJHz | surveyed | `specs/GzbNeVGJHz-login/spec.md` | `POST /api/auth/signin/google`, `GET /api/auth/callback/google`, `POST /api/auth/signout`, `POST /api/i18n/locale` | Homepage SAA, Dropdown — Language |
| 2 | Homepage SAA (auth-only) | `i87tDx10uM` | https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=i87tDx10uM | surveyed (2026-05-07) | `specs/i87tDx10uM-homepage-saa/spec.md` | `GET /api/notifications/unread-count` (predicted — bell badge); reuses `auth()` session for user fields; `SAA_EVENT_START_AT` env for countdown target. Awards = static config in this iteration. | Login (anon redirect via FR-001a); Awards Information (`/awards#<slug>`); Sun* Kudos detail (`/sun-kudos`); General Rules (`/general-rules`); Dropdown — Language; Dropdown — Profile (user/admin); Notification panel |
| 3 | Error page — 403 | `T3e_iS9PCL` | https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=T3e_iS9PCL | pending | — | — | Login (inferred) |
| 4 | [iOS] Login | `8HGlvYGJWq` | https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=8HGlvYGJWq | pending | — | (same as Login) | (same as Login) |

### Reusable Components (Overlays — not routes)

| # | Component Name | Frame ID | Figma Link | Status | Used By | Navigations To |
|---|----------------|----------|------------|--------|---------|----------------|
| C1 | Dropdown — Language | `hUyaaugye2` | https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=hUyaaugye2 | surveyed (2026-05-07) | Login (`GzbNeVGJHz`), Homepage SAA (`i87tDx10uM`, confirmed via header item `A1.7`), other authenticated screens with the header | none — selection updates locale in place |
| C2 | Dropdown — Profile (user) | `z4sCl3_Qtk` | https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=z4sCl3_Qtk | pending | authenticated user routes | Login (Logout — inferred) |
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
    subgraph Auth["Authentication Flow"]
        Login["Login (/login)<br/>GzbNeVGJHz"]
        LoginIOS["[iOS] Login<br/>8HGlvYGJWq"]
    end

    subgraph Main["Main Application"]
        Home["Homepage SAA<br/>i87tDx10uM"]
        Awards["Awards Information<br/>(TBD)"]
        Kudos["Sun* Kudos<br/>(TBD)"]
        Standards["Tiêu chuẩn chung<br/>(TBD)"]
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
    Home  -->|anon visitor (FR-001a)| Login
```

> Dotted edges = overlay open/close (no navigation).
> Solid edges between routes = real navigation.

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
| Homepage SAA (`i87tDx10uM`) | Post-auth landing — hero / countdown / award catalog / Sun* Kudos promo / footer | Login success, direct visit while authenticated, Logo / `About SAA 2025` link from any other page |
| Awards Information (TBD) | Per-award detail content; deep-links to `#<award-slug>` | Header `Awards Information`, footer link, `ABOUT AWARDS` CTA, any award card on Homepage |
| Sun* Kudos (TBD) | Sun* Kudos campaign detail | Header `Sun* Kudos`, footer link, `ABOUT KUDOS` CTA, Sun* Kudos block `Chi tiết` |
| Tiêu chuẩn chung (TBD) | Shared standards / criteria page | Footer `7.5` |

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
- Session check via `auth()` helper in Server Components / middleware; authenticated visitors
  to `/login` are redirected before any markup is sent.

### Locale Handling (Dropdown — Language)
- Default locale: `vi-VN` (chip `VN`); alternative `en-US` (chip `EN`).
- Allowlisted locales: `vi-VN`, `en-US`. Single source of truth for the allowlist + chip + flag map: [src/lib/i18n/types.ts](src/lib/i18n/types.ts) (`SUPPORTED_LOCALES`, `LOCALE_DISPLAY`). Server-side enforcement per Login spec TR-006 lives in [src/lib/cookies/saa-locale.ts](src/lib/cookies/saa-locale.ts) (`getSaaLocale` clears tampered values).
- Unauthenticated users: `saa_locale` cookie only (1y, `SameSite=Lax`, `Path=/`, `HttpOnly=false`).
- Authenticated users: cookie + `User.locale` row, updated via `POST /api/i18n/locale` (optimistic UI, reverted in `LanguageSelector.tsx` if the call fails).
- Translation helper: custom `t(key, locale)` at [src/lib/i18n/index.ts](src/lib/i18n/index.ts) over per-locale JSON catalogs (`src/lib/i18n/catalogs/{vi-VN,en-US}.json`). The project deliberately did NOT adopt `next-intl` — do not reintroduce it without an explicit cross-cutting decision.

### Routing
- Next.js App Router. Protected routes require an authenticated session.

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
| 2026-05-07 | UI implementation | Homepage SAA (`i87tDx10uM`) | Phases 1–13 of [tasks.md](specs/i87tDx10uM-homepage-saa/tasks.md) shipped. Reused existing `Header` (extended with `nav` / `notification` / `profileMenu` / `logoHref` slots — slim variant unchanged for Login regression), `LanguageSelector`, `Logo` (now accepts optional `href`), `auth()`, `getSaaLocale()`. New components under [src/components/home/](src/components/home/): `Hero`, `Countdown`, `EventInfo`, `CTAButtons`, `RootFurtherEssay`, `AwardsSectionHeader`, `AwardCard`, `AwardsGrid`, `KudosBlock`, `NavLinks`, `Footer`, `WidgetButton`, `NotificationBell`, `ProfileButton`. New primitives under [src/components/ui/](src/components/ui/): `toast.ts` + `Toaster.tsx` (in-house, mounted in [app/layout.tsx](app/layout.tsx)). New backend: `app/api/notifications/unread-count/route.ts` → `notification-service` → `notification-repository` (v1 stub `0`). Static config at [src/lib/awards/awards.ts](src/lib/awards/awards.ts) (six entries with stable slugs), env parser at [src/lib/event/event-config.ts](src/lib/event/event-config.ts). Tailwind tokens added: `saa-card-surface/border`, `saa-essay-quote-fg`, `saa-fab-bg/fg`, `saa-footer-bg/fg`, `saa-notification-dot`. ~36 i18n keys added to both vi-VN / en-US in lockstep — parity test green. PQ1 = b: `User.role` deferred; ProfileButton ships with the user-only menu (Profile + Sign out via `<form action="/api/auth/signout" method="post">`). `i18n/index.ts` no longer imports the server-only logger so client islands (`NotificationBell`, `WidgetButton`, `ProfileButton`, `Toaster`) can call `t()` without bundler errors. Build / typecheck / lint all clean. |

---

## Next Steps

- [x] Survey Homepage SAA (`i87tDx10uM`) — header reuse (`Header` + `LanguageSelector`) confirmed; outgoing edges to Awards Information / Sun* Kudos / Tiêu chuẩn chung / Profile dropdowns / Notification panel / Quick-actions FAB recorded.
- [ ] Run `momorph.specify` for Homepage SAA to resolve open questions Q-H1..Q-H4 (event datetime source, awards data source, notification panel scope, profile-menu role routing).
- [ ] Survey Profile dropdowns (`z4sCl3_Qtk`, `54rekaCHG1`) — confirm Logout → Login edge and reconcile with Figma legacy `Dropdown-profile` (`721:5223`) referenced from Homepage `A1.8`.
- [ ] Survey Awards Information and Sun* Kudos detail pages once their frame IDs are added to the file index (deep-link target `#<award-slug>` is required for `C2.*` cards).
- [ ] Survey Notification panel and Quick-actions Widget overlays (anchored from Homepage `A1.6` and `#6`).
- [ ] Survey 403 page (`T3e_iS9PCL`) — confirm "Back" target.
- [ ] Decide responsive vs. separate route for `[iOS] Login` (`8HGlvYGJWq`).
- [ ] Reconcile this overview with `.momorph/contexts/SCREENFLOW.md` after each new screen survey.
