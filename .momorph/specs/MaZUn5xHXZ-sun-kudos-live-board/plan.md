# Implementation Plan: Sun* Kudos — Live Board

**Frame**: `MaZUn5xHXZ-sun-kudos-live-board`
**Date**: 2026-05-11 (review 2026-05-11)
**Spec**: [.momorph/specs/MaZUn5xHXZ-sun-kudos-live-board/spec.md](spec.md) (Status: **Ready for plan — Q-LB1/2/4/5/6/7 resolved; Q-LB3 deferred; Q-LB8 parked**)
**Constitution**: [.momorph/constitution.md](../../constitution.md) (v1.1.1)
**SCREENFLOW**: [.momorph/SCREENFLOW.md](../../SCREENFLOW.md) (Live Board surveyed 2026-05-11)
**Predecessor specs (shipped)**: Login (`GzbNeVGJHz`), Dropdown — Language (`hUyaaugye2`), Homepage SAA (`i87tDx10uM`, Phases 1–15 shipped), Dropdown — Profile user (`z4sCl3_Qtk`), Hệ thống giải (`zFYDgyj_pD`, Phases 1–6 shipped).

**Plan-level decisions locked at review 2026-05-11** (resolves earlier Q-PLAN items below):
- **Q-PLAN1 (Rate limiting)** → **extend `proxy.ts` token-bucket** to cover `/api/kudos*` mutate endpoints. Per-IP buckets: create-Kudo 5/min, like 30/min, secret-box-open 10/min.
- **Q-PLAN2 (Admin role)** → **defer admin endpoint entirely**; SpecialDay rows inserted via `prisma/seed.ts` only. No `User.role` column for MVP.
- **Q-PLAN3 (Spotlight render)** → **custom canvas implementation** (no new runtime dep).
- **Q-PLAN5 (Counter drift)** → ship `scripts/recompute-kudos-counters.ts` as **manual escape hatch** (no cron). `npm run db:recompute-kudos-counters` recomputes 5 counters from ground truth.
- **Q-PLAN7 (User avatar)** → **reuse Auth.js `User.image`**; do NOT add a new `avatarUrl` column.
- **Q-PLAN8 (Leaderboard split)** → **two distinct components** (`RecentGiftsLeaderboard.tsx` + `RecentRankupsLeaderboard.tsx`), not one variant-prop component.
- **Q-PLAN9 (Optimistic-prepend handshake)** → **`router.refresh()` after Viết Kudo dialog submit** (no callback). Server Component re-fetches; new Kudo appears at top via `created_at DESC` sort. Revisit when dialog spec `ihQ26W78P2` lands.

---

## Summary

Thay thế stub hiện tại tại [app/sun-kudos/page.tsx](../../../app/sun-kudos/page.tsx) bằng màn **Sun\* Kudos — Live Board** thật. Đây là trang **hub tương tác** chính của program Kudos trong SAA 2025 với 5 khối chức năng: (1) ô nhập `A.1` mở dialog Viết Kudo, (2) carousel `B` top-5 Highlight Kudo + 2 dropdown filter (Hashtag, Phòng ban), (3) word cloud `B.7` Spotlight, (4) feed `C` All Kudos với infinite scroll, (5) sidebar `D` thống kê cá nhân + nút Mở quà + 2 leaderboard.

So với các màn đã ship trước đó (Login / Homepage / Awards), Live Board là feature **lớn nhất về cả frontend lẫn backend** — đây là lần đầu project có:

- 9 Prisma model mới (`Kudo`, `KudoImage`, `KudoLike`, `Hashtag`, `KudoHashtag` junction, `Department`, `SpecialDay`, `SecretBox`, `Gift`) + mở rộng `User` với `departmentId` + `title` + 5 denormalized counter (KHÔNG thêm `avatarUrl` — reuse Auth.js `User.image`).
- 14 endpoint REST mới (10 GET + 4 mutate: POST/DELETE on like, POST on kudos + secret-boxes/open). **Admin endpoint `/api/admin/special-days` đã defer khỏi MVP** (Q-PLAN2 lock); SpecialDay seed-only. Notification badge `/api/notifications/unread-count` reuse từ Homepage (không tính trong "mới").
- ~22 component mới trong `src/components/sun-kudos/` (xem § Project Structure để có danh sách đầy đủ) + 3 hook (`useFilterParams`, `useInfiniteScroll`, `useOptimisticHeart`).
- 2 route mới: `app/sun-kudos/[id]/page.tsx` (Kudos detail full-page) và parallel modal qua Next.js intercepting routes (`app/sun-kudos/@modal/(.)[id]/page.tsx`) — với layout `app/sun-kudos/layout.tsx` mới khai báo slot.

Plan **reuse tối đa** infrastructure đã ship: `Header` (slot-composition), `NavLinks` (đã có entry `/sun-kudos`), `Footer`, `WidgetButton`, `LanguageSelector`, `NotificationBell`, `ProfileButton`, `Logo`, `Toaster`, `auth()`, `i18n.t()`, Prisma singleton, locale cookie. **Không add runtime dep mới** (xem § Technical Context).

Sau Q-LB2 resolved (manual refresh only, no realtime cho MVP), plan **không cần** SSE/WebSocket infra. FR-021 thêm một nút Refresh client island invalidate cache màn. Q-LB4 resolved (full route + parallel modal) cần Next.js intercepting routes pattern lần đầu trong project — có rủi ro nhẹ về setup phức tạp (xem § Risk).

Mọi quyết định Q-LB1..Q-LB7 đã lock trong spec; còn 4 outgoing nav targets cần survey vào SCREENFLOW trước khi vào implement phase (soft dependency, parallel với plan — xem § Dependencies).

---

## Technical Context

**Language/Framework**: TypeScript 5 (strict) / Next.js 16.2.4 (App Router) — unchanged.
**Primary Dependencies**: React 19, Tailwind CSS v4, Auth.js v5, Prisma 6, Zod 4 (đã có), Vitest 4, Playwright 1.59 — **không add runtime/dev package mới cho phase này** (Spotlight word cloud sẽ implement bằng custom canvas — Q-PLAN3 lock).
**Database**: PostgreSQL via Prisma — **schema sẽ extend đáng kể** (7 model mới + thêm cột trên `User`). Migration plan ở Phase 1.
**Testing**: Vitest 4 (unit / integration với jsdom + RTL) + Playwright 1.59 (E2E, chromium) — same harness như Awards / Homepage.
**State Management**: Mostly **Server Components**. Client islands cho: filter dropdowns (URL sync), carousel, heart toggle, Spotlight word cloud, infinite scroll, Refresh button. KHÔNG có global store (Redux/Zustand) — local state + URL query là đủ.
**API Style**: REST. Layered flow **route → service → repository** theo Constitution Principle II.
**Path alias**: `@/*` → `./*` (đã setup).
**Design source**: Figma file `9ypp4enmFmdK3YAFJLIu6C`, frame `MaZUn5xHXZ` (revision `904fca587cc5bbddf4075c207e680277`). CSS values fetched at implementation time qua `query_section` per Node ID; assets (Spotlight node icons, gift icons, KV background) downloaded qua `get_media_files`.

---

## Constitution Compliance Check

*GATE: Phải pass trước khi vào implement. Mỗi item map vào principle trong `.momorph/constitution.md` (v1.1.1).*

- [x] **Principle I — Clean Code & Readable Structure**: Feature-folder `src/components/sun-kudos/` parallel với convention hiện có (`src/components/home/`, `src/components/awards/`). Một responsibility per file: `KudosBoardLayout` compose markup, `KudosFeed` quản lý infinite scroll + Refresh, `HighlightCarousel` quản lý slide state, `HeartButton` quản lý like toggle, `Spotlight` quản lý word cloud. Kebab-case cho non-component (`kudos-service.ts`, `format-kudo-url.ts`); PascalCase cho component. No dead code, lint-clean qua `npm run lint` + `tsc --noEmit`. Function ≤ 40 lines / ≤ 4 params (split nếu cần).
- [x] **Principle II — Stack Best Practices**:
  - **Server Components mặc định** — `app/sun-kudos/page.tsx`, `KudosBoardLayout`, `KudosSidebar`, `KudosStats`, `KudosFeed` (initial render), `HighlightCarousel` (initial render), `app/sun-kudos/[id]/page.tsx`. Client islands chỉ ở chỗ cần state/effect: `HashtagFilter`, `DepartmentFilter`, `HighlightCarousel.Slider`, `HeartButton`, `CopyLinkButton`, `KudosFeedClient` (infinite scroll layer), `Spotlight`, `RefreshButton`, `OpenGiftButton`, parallel-modal wrapper.
  - **Layered flow** route → service → repository. Route handler ≤ 30 LOC chỉ parse + validate + call service. Service chứa business logic (atomic like, special-day check, dedup hashtag); repository chứa Prisma access.
  - **No `any`** — schema validation qua **Zod 4** (đã có dep ở `package.json`).
  - **Tailwind tokens** — extend `app/globals.css` với token mới cần thiết (vd. `--saa-kudos-heart-active`, `--saa-kudos-card-bg`, `--saa-spotlight-node-fg`) sau khi `query_section` trên Figma. KHÔNG raw color/spacing literals.
  - **`next/image`** cho mọi avatar + KV BG + gift icon + gallery thumbnail. **Remote pattern**: `lh3.googleusercontent.com` ĐÃ có trong [next.config.ts](../../../next.config.ts) (`pathname: "/a/**"` — đủ cho Auth.js OAuth avatar URLs). Verify ở Phase 0 nếu Kudo card avatars dùng pathname khác (vd. profile-picture URLs có pattern `/a-/` hoặc `/photo/`) → mở rộng pathname pattern. Kudo gallery image upload: out-of-scope MVP, KudosBoard chỉ display URL từ DB; URL placeholder trong seed dùng `picsum.photos` hoặc local public asset (chốt ở Phase 1).
  - **Prisma singleton** ở `src/lib/prisma.ts` — không tạo `new PrismaClient()` ngoài đó.
  - **Repository pattern** — services KHÔNG import `PrismaClient` trực tiếp.
- [x] **Principle III — Platform-Appropriate UI Patterns**:
  - Responsive ≥ 360 px theo Constitution — Q-LB3 deferred cho mobile dedicated effort, nhưng vẫn áp Tailwind responsive utilities cơ bản (sidebar stack dưới feed ở mobile, carousel arrow hiển thị compact).
  - WCAG 2.1 AA:
    - Heart nút có `aria-pressed`, disabled state khi viewer = sender.
    - Pan/Zoom nút có `aria-pressed` theo mode.
    - Filter chips có `aria-pressed` khi active.
    - Carousel có `aria-roledescription="carousel"`, Prev/Next có `aria-label`.
    - Empty state có `role="status"`.
    - Toast `role="status" aria-live="polite"`.
    - Search bar `B.7.3` có `aria-label="Tìm kiếm Sunner"`.
    - Hover preview profile có focus-trigger fallback cho keyboard.
    - Touch targets ≥ 44×44 cho heart, copy link, mở quà, prev/next, filter chip, avatar/name click area, "Xem chi tiết".
  - **Evidence-based navigation** (Principle III): mọi `href` / `redirect` được source từ SCREENFLOW. 4 targets chưa documented (`w4WUvsJ9KI`, `6-1LRz3vqr`, `m0zV-VstXX`, Kudos detail) — phải survey trước Phase 4 (xem § Dependencies).
  - **`prefers-reduced-motion`** respected: carousel slide transition, heart toggle micro-interaction, Spotlight pan/zoom transitions.
- [x] **Principle IV — OWASP Secure Coding** (highest risk feature trong project tới nay):
  - **A01 — Broken Access Control**: `/sun-kudos` MUST `auth()` gate (TR-003 + US7). Mọi mutate endpoint (`POST /api/kudos`, `POST/DELETE /api/kudos/{id}/like`, `POST /api/secret-boxes/open`) MUST validate session **và** kiểm tra ownership server-side. KHÔNG dựa client-supplied `user_id`. **Admin endpoint `/api/admin/special-days` đã defer khỏi MVP** (Q-PLAN2 lock); SpecialDay seeded via `prisma/seed.ts` only. Special-day flag tại like time vẫn đọc DB.
  - **A02 — Cryptographic Failures**: KHÔNG có credential mới. Session token đã handled bởi Auth.js. KHÔNG `NEXT_PUBLIC_*` cho data nhạy cảm.
  - **A03 — Injection**: User input ở 3 chỗ: Kudo content (dialog OOS), Spotlight search query (≤ 100 chars), filter dropdown selection. **Zod schema validate** mọi input trước khi vào service layer. Prisma parameterized queries (no `$queryRaw` trừ khi cần — và phải template literal). React default escaping cho mọi user-generated text (Kudo content, hashtag, sunner name). **KHÔNG `dangerouslySetInnerHTML`**.
  - **A04 — Insecure Design**: Atomic like transaction (FR-010) — sử dụng `prisma.$transaction` để insert/delete `KudoLike` row + update `Kudo.heart_count` + update `User.hearts_received_count` cùng commit. Special-day check dùng server-side `now()` ở timezone `Asia/Ho_Chi_Minh` (TR-004). Idempotent like (UNIQUE constraint trên `(kudos_id, user_id)`).
  - **A05 — Security Misconfiguration**: Tận dụng [proxy.ts](../../../proxy.ts) (repo root, Next.js 16 proxy runtime) — đã ship full CSP / HSTS / X-Content-Type-Options / Referrer-Policy / X-Frame-Options + `x-request-id` correlation. CORS default deny. Không cần thay đổi proxy cho phase này.
  - **A07 — AuthN failures**: Đã handled bởi Auth.js. Pre-launch gate `proxy.ts` đã whitelist `/sun-kudos` qua sau `SAA_LAUNCH_AT`.
  - **A09 — Logging**: Log auth events + 5xx với request ID (existing `x-request-id` correlation from `proxy.ts`). KHÔNG log Kudo content trong error path (privacy). Special-day admin CRUD log path N/A (Q-PLAN2 — endpoint deferred); seed mutations logged via standard Prisma client logs.
  - **Rate limiting** (Q-PLAN1 lock): extend [proxy.ts](../../../proxy.ts) token-bucket pattern (already protects `/api/auth/callback` at 10/60s) to cover Kudos mutate endpoints per-IP:
    - `POST /api/kudos` — 5 req/60s (anti-spam Kudo creation).
    - `POST/DELETE /api/kudos/:id/like` — 30 req/60s (allows fast browsing toggles).
    - `POST /api/secret-boxes/open` — 10 req/60s (defense against repeated open spamming).
    - Buckets keyed by `x-forwarded-for` IP (same fallback as existing limiter). 429 response with `Retry-After` header. In-process Map for MVP; document Redis swap in Phase 7-equivalent backlog item if multi-instance deploy lands.
    - Implemented in same `proxy.ts` file via path-prefix dispatch (reuse `isRateLimited`); covered by Vitest integration test (`tests/integration/proxy/kudos-rate-limit.test.ts`).
- [x] **Principle V — Test-Driven Development**:
  - Failing tests trước implementation cho mỗi FR-001..FR-021 + TR-003/TR-004/TR-006/TR-007/TR-008.
  - **Vitest unit**:
    - `kudos-repository`: like atomic transaction, special-day flag, unique constraint, unlike rollback đúng số tim.
    - `kudos-service`: business logic (sender can't like own Kudo, special-day check, filter combine AND).
    - `hashtag-service`, `department-service`: search + sort.
    - `format-kudo-url` helper.
    - `useFilterParams` hook: URL ↔ state bidirectional.
    - Components: `HeartButton` (toggle + disabled + optimistic), `HighlightCarousel` (prev/next disabled at extremes), `KudosCard` (truncate 5 dòng), `Spotlight` (empty/loading/interactive), `KudosStats` (5 counters), `RefreshButton`.
  - **Vitest integration** (API routes với in-memory DB / test container):
    - `POST /api/kudos` → DB has new row + sender stats updated.
    - `POST /api/kudos/{id}/like` (normal day vs special day) → DB + counters atomic.
    - `DELETE /api/kudos/{id}/like` → rollback đúng.
    - `GET /api/kudos?hashtag=X&dept=Y` → filter AND + scope sender|receiver.
  - **Playwright E2E**:
    - Anon visit `/sun-kudos` → redirect `/login` (US7 #1).
    - Auth user opens `A.1` → dialog opens (US1 #1).
    - Auth user thả tim → count tăng + sender heart counter (US3 #1).
    - Sender thả tim own Kudo → disabled (US3 #3).
    - Filter Hashtag → Highlight + feed filter (US2 #5).
    - Click hashtag chip → filter URL sync (FR-012, TR-008).
    - Copy Link → clipboard + toast (US4 #6).
    - Refresh button → re-fetch + giữ filter (FR-021).
    - Click card content → mở Kudos detail modal (Q-LB4).
    - Click deep-link `/sun-kudos/{id}` → mở full page detail.
  - **Coverage**: unit ≥ 80%, integration ≥ 75% mutate paths, E2E covers tất cả P1 + 2 P2.

**Threat model summary** *(Principle IV)*:

- **Trust boundaries**:
  - Browser ↔ Next.js server (mọi action xuyên qua route handler, validated).
  - Server ↔ Postgres (Prisma parameterized, không raw SQL trừ khi unavoidable).
  - Server ↔ Gmail avatar host (read-only, dùng `next/image` allowlist).
- **Sensitive data**:
  - Session token (Auth.js cookie, `HttpOnly` + `Secure`).
  - Kudo content (low-medium sensitivity — đôi khi chứa tên / cá nhân info).
  - User stars / hearts counter (low — public-display data).
  - Secret Box ownership (medium — không expose Box của user khác).
- **Abuse cases to test**:
  - Anon request `/sun-kudos` + mọi API → 401/302 (covered TR-003).
  - User A spoof `user_id=B` khi gọi `POST /api/kudos/{id}/like` → server reject (must use session, not body).
  - User A thả tim Kudo của chính mình → server reject (sender ≠ liker check, FR-006).
  - Like spam ≥ 1 req/100ms → debounce + rate-limit + UNIQUE constraint.
  - Race condition: 2 user thả tim cùng Kudo trong cùng 10ms → `$transaction` atomic, count final đúng.
  - URL hash injection `/sun-kudos#<script>` → React default escape, no XSS.
  - Filter query injection `?hashtag='OR 1=1` → Prisma parameterized, no SQL injection.
  - Spotlight search 101 chars → server validate reject (FR-004, TC `9e689933`).
  - User mở Secret Box của user khác (IDOR) → server check `box.user_id === session.user.id`.
  - User flood `POST /api/kudos` → covered by `proxy.ts` token-bucket (5 req/60s/IP per Q-PLAN1) + content-length cap.
  - Admin route hit by non-admin → N/A (admin endpoint deferred MVP — Q-PLAN2 lock).

**Violations**: chưa có. Tất cả 5 principles pass; OWASP A01..A09 đều có mitigation ở phase tương ứng.

---

## Architecture Decisions

### Frontend Approach

- **Component Structure**: Feature folder `src/components/sun-kudos/` cho component đặc thù màn này. Reuse `src/components/header/*`, `src/components/home/Footer.tsx`, `src/components/home/NavLinks.tsx`, `src/components/home/WidgetButton.tsx`, `src/components/home/NotificationBell.tsx`, `src/components/home/ProfileButton.tsx`, `src/components/ui/Toaster.tsx` + `toast.ts`. KHÔNG atomic-design split.

- **Header reuse pattern** (đã verify với codebase 2026-05-11): `<Header>` accept slot props `nav`, `notification`, `profileMenu`, `logoHref`; **không** có prop `currentPath`. Active-state cho nav nằm trong [src/components/home/NavLinks.tsx](../../../src/components/home/NavLinks.tsx) — pass `<NavLinks currentPath="/sun-kudos" locale={locale} />` vào slot `nav` của `<Header>`. `NavLinks` đã có entry `/sun-kudos` trong `NAV_ITEMS`.

- **Server / Client boundary**:
  - **Server Components**: `app/sun-kudos/page.tsx` (auth gate + read filter query string + initial data fetch), `KudosBoardLayout`, `KudosSidebar`, `KudosStats`, initial render của `HighlightCarousel` (server fetches data, hydrate client island sau), initial render của `KudosFeed`.
  - **Client islands (`"use client"`)**:
    - `HashtagFilter` + `DepartmentFilter`: open dropdown, select, sync URL.
    - `HighlightCarousel`: slide state, prev/next disabled logic.
    - `HeartButton`: toggle + optimistic + rollback.
    - `CopyLinkButton`: clipboard + toast trigger.
    - `KudosFeedClient`: infinite scroll loader; cũng host nút Refresh trigger refetch toàn page state qua `router.refresh()`.
    - `Spotlight`: word cloud render + pan/zoom + search.
    - `OpenGiftButton`: disabled state + Secret Box dialog trigger.
    - `RefreshButton`: trigger `router.refresh()` + disabled-while-loading.
    - `KudosDetailModal` (parallel route wrapper).

- **Styling Strategy**: Tailwind v4 utilities only. Extend `app/globals.css` với tokens cần thiết sau Phase 0 (`query_section` per Node). Danh sách token dự kiến:
  - `--saa-kudos-heart-active` / `--saa-kudos-heart-inactive`
  - `--saa-kudos-card-bg` / `--saa-kudos-card-border`
  - `--saa-kudos-section-header-fg` / `--saa-kudos-section-subtitle-fg`
  - `--saa-kudos-filter-active-bg` / `--saa-kudos-filter-inactive-bg`
  - `--saa-spotlight-node-fg` / `--saa-spotlight-node-bg`
  - `--saa-kudos-stat-value-fg`
  - `--saa-kudos-leaderboard-divider`
  
  Token names finalize trong Phase 0 sau khi `query_section` trên các nodes tương ứng.

- **Data Fetching**:
  - Initial paint (RSC fetch): `app/sun-kudos/page.tsx` Server Component đọc query string → gọi parallel `Promise.all([kudosService.listHighlight(...), kudosService.listFeed(...), userService.getStats(...), sunnerService.topReceivers(...), sunnerService.recentRankups(...), kudosService.spotlightSummary(...)])`. Tránh 6 spinner độc lập (TR-002).
  - Client refetch sau action: Server Action / Route Handler call → `router.refresh()` để re-render Server Components.
  - Infinite scroll: client island `KudosFeedClient` call `/api/kudos?cursor=X&hashtag=Y&dept=Z` qua `fetch`.
  - **Không có realtime / SWR / React Query** (đơn giản hóa MVP, FR-002 + Q-LB2).

- **State Management**:
  - Filter state (`selectedHashtag`, `selectedDepartment`): nguồn truth = URL query string. `useSearchParams` đọc, `router.replace(...)` ghi (qua hook `useFilterParams`).
  - Carousel state (`currentSlideIndex`): local `useState` trong `HighlightCarousel`.
  - Heart state per Kudo: local `useState` trong `HeartButton`, optimistic toggle.
  - Spotlight state (`mode`, `searchQuery`): local `useState`.
  - Toast queue: reuse `src/components/ui/Toaster.tsx` (đã ship).
  - **No global store**. Session từ server (Auth.js).

### Backend Approach

- **API Design**: REST flat under `/api/...`. Mỗi resource có endpoint riêng. Layered:
  - **Route handler** (`app/api/.../route.ts`): parse + Zod validate + call service + return JSON. ≤ 30 LOC mỗi handler.
  - **Service** (`src/services/<resource>-service.ts`): business logic (filter combine AND, special-day check, atomic like).
  - **Repository** (`src/repositories/<resource>-repository.ts`): Prisma queries only.

- **Endpoint inventory** (15 endpoints for MVP, locked theo spec § API Dependencies; admin endpoint #16 deferred per Q-PLAN2):

  | # | Path | Method | Service method | Notes |
  |---|------|--------|----------------|-------|
  | 1 | `/api/kudos/highlight` | GET | `kudosService.listHighlight(filter)` | Top 5 theo `heart_count DESC` |
  | 2 | `/api/kudos` | GET | `kudosService.listFeed(filter, cursor)` | Cursor pagination |
  | 3 | `/api/kudos` | POST | `kudosService.create(input, session)` | Auth required |
  | 4 | `/api/kudos/[id]` | GET | `kudosService.getById(id)` | |
  | 5 | `/api/kudos/[id]/like` | POST | `kudosService.like(id, session)` | Atomic transaction |
  | 6 | `/api/kudos/[id]/like` | DELETE | `kudosService.unlike(id, session)` | Atomic + rollback đúng |
  | 7 | `/api/kudos/spotlight` | GET | `kudosService.spotlightSummary()` | Total count + recipient list |
  | 8 | `/api/sunners/search` | GET | `sunnerService.search(query)` | `q` ≤ 100 chars |
  | 9 | `/api/users/me/stats` | GET | `userService.getStats(session)` | 5 counters |
  | 10 | `/api/sunners/top-receivers` | GET | `sunnerService.topReceivers(limit)` | Default limit=10 |
  | 11 | `/api/sunners/recent-rankups` | GET | `sunnerService.recentRankups(limit)` | Default limit=10 |
  | 12 | `/api/hashtags` | GET | `hashtagService.list()` | |
  | 13 | `/api/departments` | GET | `departmentService.list()` | |
  | 14 | `/api/secret-boxes/open` | POST | `secretBoxService.openOne(session)` | Ownership check |
  | 15 | `/api/notifications/unread-count` | GET | (đã ship) | Reuse Homepage |
  | ~~16~~ | ~~`/api/admin/special-days`~~ | — | — | **Deferred (Q-PLAN2)** — SpecialDay rows seeded via `prisma/seed.ts` for MVP |

- **Data Access**:
  - Tất cả service truy cập qua `src/repositories/<resource>-repository.ts`.
  - Atomic transactions cho like/unlike + secret box open.
  - Denormalized counter trên `User` updated trong cùng transaction với like/unlike và create-Kudo.
  - Cursor pagination cho feed (cursor = `kudos.id` + `created_at`).

- **Validation**:
  - Mọi request body / query param validated qua Zod schemas in `src/lib/validation/kudos.ts`.
  - Content length, hashtag count (≤ 5), image count (≤ 5) checked server-side (defense in depth dù dialog đã check).
  - Spotlight search query: max 100 chars; nếu vượt → 400 + error code.

### Integration Points

- **Existing modules reused (DO NOT rebuild)**:
  - [src/lib/auth.ts](../../../src/lib/auth.ts) — `auth()` cho session.
  - [src/lib/prisma.ts](../../../src/lib/prisma.ts) — Prisma singleton.
  - [src/lib/cookies/saa-locale.ts](../../../src/lib/cookies/saa-locale.ts) — locale cookie parser.
  - [src/lib/i18n/index.ts](../../../src/lib/i18n/index.ts) — `t(key, locale)` translator.
  - [src/lib/event/event-config.ts](../../../src/lib/event/event-config.ts) — event datetime (cho potential gating, không cần ở MVP này).
  - [src/services/notification-service.ts](../../../src/services/notification-service.ts) — reuse cho header bell badge.
  - [src/repositories/user-repository.ts](../../../src/repositories/user-repository.ts) — extend với getStats + counter updates.
- **Existing components reused (DO NOT rebuild)**:
  - [src/components/header/Header.tsx](../../../src/components/header/Header.tsx) — slot composition.
  - [src/components/home/NavLinks.tsx](../../../src/components/home/NavLinks.tsx) — pass `currentPath="/sun-kudos"`.
  - [src/components/header/LanguageSelector.tsx](../../../src/components/header/LanguageSelector.tsx), [Logo.tsx](../../../src/components/header/Logo.tsx).
  - [src/components/home/Footer.tsx](../../../src/components/home/Footer.tsx), [WidgetButton.tsx](../../../src/components/home/WidgetButton.tsx), [NotificationBell.tsx](../../../src/components/home/NotificationBell.tsx), [ProfileButton.tsx](../../../src/components/home/ProfileButton.tsx).
  - [src/components/ui/Toaster.tsx](../../../src/components/ui/Toaster.tsx) + [toast.ts](../../../src/components/ui/toast.ts).
- **New shared utilities (tạo mới ở Phase 1)**:
  - `src/lib/kudos/format-kudo-url.ts` — `formatKudoUrl(id) → string` (vd. `https://.../sun-kudos/{id}`).
  - `src/lib/kudos/special-day.ts` — `isSpecialDay(date, specialDays)` boundary check ở timezone `Asia/Ho_Chi_Minh`.
  - `src/lib/kudos/types.ts` — shared TS types (`Kudo`, `KudoLike`, `Hashtag`, …).
  - `src/lib/validation/kudos.ts` — Zod schemas.
  - `src/hooks/useFilterParams.ts` — URL ↔ filter state bidirectional sync (Hashtag + Phòng ban).

---

## Project Structure

### Documentation (this feature)

```text
.momorph/specs/MaZUn5xHXZ-sun-kudos-live-board/
├── spec.md              # Feature specification (Ready for plan)
├── plan.md              # This file
├── tasks.md             # Task breakdown (next step — momorph.tasks)
└── assets/              # (Phase 0 sẽ tạo: frame.png, implementation.png cho visual compare)
```

### Source Code (new + modified)

```text
# Frontend — Routes
app/
├── sun-kudos/
│   ├── layout.tsx                               # NEW — declares `modal` parallel slot (children + modal props)
│   ├── page.tsx                                 # NEW — replace stub
│   ├── [id]/page.tsx                            # NEW — Kudos detail full page
│   └── @modal/
│       ├── default.tsx                          # NEW — empty slot default (returns null)
│       └── (.)[id]/page.tsx                     # NEW — parallel modal (intercepting route)

# Frontend — Components
src/components/sun-kudos/
├── KudosBoardLayout.tsx                         # NEW — Server Component
├── KudosCreateInput.tsx                         # NEW — A.1
├── HighlightSection.tsx                         # NEW — B (Server)
├── HighlightCarousel.tsx                        # NEW — Client island
├── HighlightCard.tsx                            # NEW — B.3 (Server-rendered, but B.4.4 actions are Client)
├── HashtagFilter.tsx                            # NEW — B.1.1 Client island
├── DepartmentFilter.tsx                         # NEW — B.1.2 Client island
├── Spotlight.tsx                                # NEW — B.7 Client island (custom-canvas word cloud — Q-PLAN3 lock)
├── SpotlightSearchBar.tsx                       # NEW — B.7.3
├── KudosFeed.tsx                                # NEW — C.2 (Server-rendered initial + Client island for scroll)
├── KudosFeedClient.tsx                          # NEW — Client island wrapper
├── KudosCard.tsx                                # NEW — C.3
├── KudosActionBar.tsx                           # NEW — Heart + Copy Link; takes optional `viewDetailHref` prop. C.4 omits prop (no "Xem chi tiết"); B.4.4 passes it to render the button.
├── HeartButton.tsx                              # NEW — C.4.1
├── CopyLinkButton.tsx                           # NEW — C.4.2
├── KudoImageLightbox.tsx                        # NEW — Client island, gallery thumbnail click → fullsize
├── ProfilePreviewPopup.tsx                      # NEW — Client island, hover ≥ 300ms / keyboard focus (FR-018, linked frame `721:5827`)
├── KudosSidebar.tsx                             # NEW — D
├── KudosStats.tsx                               # NEW — D.1 (5 counters)
├── OpenGiftButton.tsx                           # NEW — D.1.8
├── RecentGiftsLeaderboard.tsx                   # NEW — D.3 "10 SUNNER nhận quà" (avatar + name + gift label)
├── RecentRankupsLeaderboard.tsx                 # NEW — "10 SUNNER thăng hạng mới nhất" (avatar + name + tier badge) — Q-PLAN8 lock: split, không reuse
├── RefreshButton.tsx                            # NEW — FR-021
├── KudosDetailContent.tsx                       # NEW — body của full page + modal
└── KudosDetailModal.tsx                         # NEW — modal wrapper cho parallel route

# Frontend — Hooks
src/hooks/
├── useFilterParams.ts                           # NEW — URL filter sync (TR-008)
├── useInfiniteScroll.ts                         # NEW — IntersectionObserver-based loader
└── useOptimisticHeart.ts                        # NEW — heart toggle + rollback

# Frontend — Lib helpers + types
src/lib/kudos/
├── types.ts                                     # NEW — shared types
├── format-kudo-url.ts                           # NEW
├── special-day.ts                               # NEW
└── slugify.ts                                   # NEW — nếu cần slug cho hashtag

src/lib/validation/
└── kudos.ts                                     # NEW — Zod schemas

# Backend — API route handlers
app/api/
├── kudos/
│   ├── route.ts                                 # NEW — GET feed + POST create
│   ├── highlight/route.ts                       # NEW — GET top 5
│   ├── spotlight/route.ts                       # NEW — GET total + recipients
│   └── [id]/
│       ├── route.ts                             # NEW — GET detail
│       └── like/route.ts                        # NEW — POST + DELETE
├── sunners/
│   ├── search/route.ts                          # NEW — GET search
│   ├── top-receivers/route.ts                   # NEW
│   └── recent-rankups/route.ts                  # NEW
├── users/me/stats/route.ts                      # NEW
├── hashtags/route.ts                            # NEW
├── departments/route.ts                         # NEW
└── secret-boxes/open/route.ts                   # NEW
# admin/special-days/route.ts                    # DEFERRED (Q-PLAN2) — not shipped in MVP

# Backend — Services + Repositories
src/services/
├── kudos-service.ts                             # NEW
├── hashtag-service.ts                           # NEW
├── department-service.ts                        # NEW
├── sunner-service.ts                            # NEW
├── secret-box-service.ts                        # NEW
└── special-day-service.ts                       # NEW

src/repositories/
├── kudos-repository.ts                          # NEW
├── kudo-like-repository.ts                      # NEW (hoặc gộp vào kudos-repository.ts)
├── hashtag-repository.ts                        # NEW
├── department-repository.ts                     # NEW
├── secret-box-repository.ts                     # NEW
├── special-day-repository.ts                    # NEW
├── sunner-repository.ts                         # NEW (high-level queries — top receivers, recent rankups, search)
└── user-repository.ts                           # MODIFY — thêm getStats + counter updaters

# Backend — DB schema
prisma/
├── schema.prisma                                # MODIFY — thêm 7 model + sửa User
├── migrations/                                  # NEW migration: add-kudos-domain
└── seed.ts                                      # MODIFY — seed Hashtags + Departments + 2 SpecialDay rows (today + fixed historical) + 5 Gifts + ~50 Kudo + ~150 KudoLike

# i18n (JSON catalogs, NOT TS — đã verify codebase 2026-05-11)
src/lib/i18n/catalogs/
├── vi-VN.json                                   # MODIFY — thêm `kudos.*` namespace
└── en-US.json                                   # MODIFY — đồng bộ (parity test enforced)

# Configuration
app/globals.css                                  # MODIFY — thêm Tailwind tokens cho kudos screen
next.config.ts                                   # MODIFY (chỉ nếu cần) — `lh3.googleusercontent.com` đã có (`pathname: "/a/**"`); chỉ extend pathname pattern nếu Kudo avatar URL dùng path khác
proxy.ts                                         # MODIFY — extend token-bucket cho /api/kudos* mutate (Q-PLAN1 lock)
tsconfig.json                                    # KHÔNG đổi
package.json                                     # MODIFY — add `db:recompute-kudos-counters` script (Q-PLAN5 lock); no new runtime/dev dep

# Maintenance scripts
scripts/
└── recompute-kudos-counters.ts                  # NEW — tsx; manual escape hatch for counter drift (Q-PLAN5 lock)

# Tests
tests/
├── unit/
│   ├── lib/kudos/
│   │   ├── format-kudo-url.test.ts
│   │   └── special-day.test.ts
│   ├── lib/validation/kudos.test.ts
│   ├── hooks/
│   │   ├── useFilterParams.test.ts
│   │   ├── useInfiniteScroll.test.ts
│   │   └── useOptimisticHeart.test.ts
│   ├── services/
│   │   ├── kudos-service.test.ts
│   │   ├── sunner-service.test.ts
│   │   ├── secret-box-service.test.ts
│   │   ├── special-day-service.test.ts
│   │   ├── hashtag-service.test.ts
│   │   └── department-service.test.ts
│   ├── repositories/
│   │   ├── kudos-repository.test.ts
│   │   ├── kudo-like-repository.test.ts          # atomic transaction tests
│   │   └── user-repository.test.ts               # counter updates
│   └── components/sun-kudos/
│       ├── HeartButton.test.tsx
│       ├── HighlightCarousel.test.tsx
│       ├── KudosCard.test.tsx
│       ├── KudosStats.test.tsx
│       ├── RefreshButton.test.tsx
│       ├── Spotlight.test.tsx
│       ├── CopyLinkButton.test.tsx
│       ├── HashtagFilter.test.tsx
│       ├── DepartmentFilter.test.tsx
│       ├── KudoImageLightbox.test.tsx           # Esc/backdrop dismiss + focus trap
│       ├── ProfilePreviewPopup.test.tsx         # hover delay + keyboard focus alt
│       ├── RecentGiftsLeaderboard.test.tsx
│       └── RecentRankupsLeaderboard.test.tsx
├── integration/
│   ├── api/kudos.test.ts                        # GET / POST + filter combine
│   ├── api/kudos-like.test.ts                   # atomic transaction, special day
│   ├── api/secret-boxes.test.ts                 # ownership check (IDOR)
│   ├── api/sunners.test.ts                      # search, top-receivers, recent-rankups
│   ├── proxy/kudos-rate-limit.test.ts           # Q-PLAN1 — per-bucket 429 verification
│   └── scripts/recompute-kudos-counters.test.ts # Q-PLAN5 — drift detection + correction
│   # api/admin-special-days.test.ts             # DEFERRED with admin endpoint (Q-PLAN2)
├── fixtures/
│   └── kudos-seed.ts                            # NEW — deterministic test fixtures (fixed UUIDs/timestamps/special-day date); shared by integration + E2E
└── e2e/
    ├── kudos-board-auth.spec.ts                 # US7
    ├── kudos-board-create.spec.ts               # US1
    ├── kudos-board-like.spec.ts                 # US3
    ├── kudos-board-highlight.spec.ts            # US2
    ├── kudos-board-feed.spec.ts                 # US4
    ├── kudos-board-spotlight.spec.ts            # US5
    ├── kudos-board-sidebar.spec.ts              # US6
    ├── kudos-board-refresh.spec.ts              # FR-021
    └── kudos-detail.spec.ts                     # Q-LB4 (route + modal)
```

---

## Implementation Strategy

### Phase Breakdown

Triển khai theo **vertical slices** ưu tiên P1 user stories. Mỗi phase commit độc lập, tests green trước khi sang phase kế tiếp.

#### Phase 0 — Survey + Design Tokens + Assets (foundation, không gen code business)

- T0.1: Mở Figma frame `MaZUn5xHXZ` qua `get_frame_image` để có visual reference. Save `frame.png` vào `.momorph/specs/MaZUn5xHXZ-sun-kudos-live-board/assets/`.
- T0.2: Chạy `query_section` cho các node chính (`A.1`, `B.1.1` hashtag dropdown trigger + linked frame `1002:13013`, `B.1.2` dept dropdown trigger + linked frame `721:5684`, `B.3` highlight card, `B.4.4` action bar, `B.7` Spotlight, `C.3` feed card, `C.4.1` heart, `D.1` stats sidebar, `D.3` leaderboard, Footer) → extract CSS tokens. Also fetch `721:5827` (Profile preview popup, FR-018) since `ProfilePreviewPopup.tsx` lands in Phase 5.
- T0.3: List + download assets qua `list_media_nodes` + `get_media_files`:
  - KV background.
  - Pencil icon (`A.1`).
  - Heart icon active + inactive states.
  - Copy link icon.
  - Pan/zoom icon.
  - Gift icon (`D.1.8`).
  - Star tier icons (3 mức).
  - Spotlight node decorations.
  - Save vào `public/assets/sun-kudos/{icons|images|illustrations}/` (kebab-case per Constitution).
- T0.4: Update `app/globals.css` với Tailwind tokens mới (theo list ở § Architecture). Confirm tokens với Awards / Homepage để tránh duplicate.
- T0.5: Survey + document 4 outgoing nav targets thiếu trong SCREENFLOW (cần chạy `/momorph.screenflow` cho `w4WUvsJ9KI`, `6-1LRz3vqr`, `m0zV-VstXX`, Kudos detail screen TBD). Có thể parallel với Phase 1.
- T0.6: Verify [next.config.ts](../../../next.config.ts) `images.remotePatterns` — `lh3.googleusercontent.com` with `pathname: "/a/**"` **đã có sẵn** (verified codebase 2026-05-11). Nếu Phase 5 phát hiện Kudo card avatar URLs dùng pathname khác (vd. `/photo/` hoặc `/a-/`) → extend pattern. Kudo gallery placeholder host (seed dùng `picsum.photos`) — add separate `remotePatterns` entry trong cùng Phase nếu cần.

Output: visual reference + assets + globals.css extended + SCREENFLOW gaps closed.

#### Phase 1 — DB Schema + Migration + Seed (foundation backend)

TDD: viết Vitest unit cho `kudos-repository` atomic transaction trước; chạy đỏ; rồi gen schema.

- T1.1: Extend [prisma/schema.prisma](../../../prisma/schema.prisma):

  ```prisma
  model User {
    // ... existing Auth.js fields incl. `image` (Gmail avatar URL) ...
    // Q-PLAN7 lock: KHÔNG add avatarUrl — Kudos UI reuse Auth.js `User.image`.
    departmentId            String?
    department              Department? @relation(fields: [departmentId], references: [id])
    title                   String?     // vd. "Top Talent"
    kudosReceivedCount      Int         @default(0)
    kudosSentCount          Int         @default(0)
    heartsReceivedCount     Int         @default(0)
    secretBoxesOpenedCount  Int         @default(0)
    secretBoxesPendingCount Int         @default(0)

    sentKudos        Kudo[]       @relation("KudoSender")
    receivedKudos    Kudo[]       @relation("KudoReceiver")
    likes            KudoLike[]
    secretBoxes      SecretBox[]
  }

  model Department {
    id    String @id @default(cuid())
    name  String @unique
    users User[]
  }

  model Kudo {
    id              String       @id @default(cuid())
    senderUserId    String
    sender          User         @relation("KudoSender", fields: [senderUserId], references: [id])
    receiverUserId  String
    receiver        User         @relation("KudoReceiver", fields: [receiverUserId], references: [id])
    content         String       @db.Text
    heartCount      Int          @default(0)
    images          KudoImage[]
    hashtags        KudoHashtag[]
    likes           KudoLike[]
    createdAt       DateTime     @default(now())
    @@index([createdAt(sort: Desc)])
    @@index([heartCount(sort: Desc)])
  }

  model KudoImage {
    id      String @id @default(cuid())
    kudoId  String
    kudo    Kudo   @relation(fields: [kudoId], references: [id], onDelete: Cascade)
    url     String
    order   Int    // 0..4 (max 5 per Kudo)
    @@unique([kudoId, order])
  }

  model Hashtag {
    id    String        @id @default(cuid())
    name  String        @unique
    kudos KudoHashtag[]
  }

  model KudoHashtag {
    kudoId    String
    hashtagId String
    kudo      Kudo    @relation(fields: [kudoId], references: [id], onDelete: Cascade)
    hashtag   Hashtag @relation(fields: [hashtagId], references: [id])
    @@id([kudoId, hashtagId])
  }

  model KudoLike {
    id                String   @id @default(cuid())
    kudoId            String
    userId            String
    isSpecialDayLike  Boolean  @default(false)
    createdAt         DateTime @default(now())
    kudo              Kudo     @relation(fields: [kudoId], references: [id], onDelete: Cascade)
    user              User     @relation(fields: [userId], references: [id])
    @@unique([kudoId, userId])
    @@index([kudoId])
  }

  model SpecialDay {
    id          String   @id @default(cuid())
    date        DateTime @db.Date
    description String?
    createdAt   DateTime @default(now())
    @@unique([date])
  }

  model SecretBox {
    id         String   @id @default(cuid())
    userId     String
    user       User     @relation(fields: [userId], references: [id])
    state      String   // "pending" | "opened"
    awardedAt  DateTime @default(now())
    openedAt   DateTime?
    giftId     String?
    gift       Gift?    @relation(fields: [giftId], references: [id])
    @@index([userId, state])
  }

  model Gift {
    id          String      @id @default(cuid())
    name        String
    value       Int
    description String?
    secretBoxes SecretBox[]
  }
  ```

- T1.2: `source ~/.nvm/nvm.sh && nvm use 20.20.2 && npm run db:migrate -- --name add-kudos-domain` (project's npm script alias for `prisma migrate dev` — verified in `package.json` 2026-05-11; nvm prefix per memory rule).
- T1.3: Extend [prisma/seed.ts](../../../prisma/seed.ts) (idempotent per Constitution II):
  - Seed 5 Department (Marketing, Engineering, Design, HR, Operations).
  - Seed ~15 Hashtag (Dedicated, Inspiring, IDOL GIỚI TRẺ, Teamwork, Innovation, …).
  - Seed 2 SpecialDay rows: (1) `today` (so manual QA can verify +2 hearts), (2) a fixed historical date (so integration tests can pin behaviour). **This is the MVP substitute for the deferred admin endpoint** (Q-PLAN2 lock).
  - Seed 5 Gift sample.
  - Update 3-5 existing User với `departmentId`, các counter deterministic (no random — for stable tests).
  - Seed ~50 Kudo mẫu (đa dạng sender/receiver/hashtag) + ~150 KudoLike để có data cho Highlight + feed + Spotlight; gallery URLs dùng `picsum.photos` placeholder.
- T1.4: Run seed, verify DB qua Prisma Studio.
- T1.5: Viết Vitest test cho `kudos-repository.like(kudoId, userId, isSpecialDay)`:
  - Test: tăng `heartCount` + `heartsReceivedCount` đúng số.
  - Test: UNIQUE violation khi like 2 lần.
  - Test: `$transaction` rollback khi 1 phần fail.

#### Phase 2 — Foundation Components + Auth Gate (US7)

TDD: viết E2E `kudos-board-auth.spec.ts` first.

- T2.1: Replace stub [app/sun-kudos/page.tsx](../../../app/sun-kudos/page.tsx) (currently renders `<StubPage>`) với Server Component:
  - `auth()` gate → redirect `/login` nếu null.
  - Đọc filter từ `searchParams`.
  - Parallel fetch services (placeholder data ban đầu, sẽ wire dần ở phases sau).
  - Render `KudosBoardLayout`.
- T2.2: Create [src/components/sun-kudos/KudosBoardLayout.tsx](../../../src/components/sun-kudos/KudosBoardLayout.tsx) — Server Component skeleton: Header slot, KV banner, A.1 input, Highlight section placeholder, Feed + Sidebar 2-column, Footer.
- T2.3: Mount `<Header locale={locale} isAuthenticated nav={<NavLinks currentPath="/sun-kudos" locale={locale} />} notification={…} profileMenu={…} />` (Header có slot props, không có `currentPath` — verified codebase 2026-05-11). `NavLinks` đã có entry `/sun-kudos` trong `NAV_ITEMS`.
- T2.4: Create [app/sun-kudos/layout.tsx](../../../app/sun-kudos/layout.tsx) accept `children` + `modal` slot (Next.js parallel routes). Cần ngay từ Phase 2 để Phase 9 intercepting route render đúng; render `{children}{modal}`.
- T2.5: Create [app/sun-kudos/@modal/default.tsx](../../../app/sun-kudos/@modal/default.tsx) returning `null` (default state for the parallel slot).
- T2.6: Run Playwright `kudos-board-auth.spec.ts` → GREEN cho US7.

#### Phase 3 — Sidebar Stats + Mở quà Button (US6)

- T3.1: TDD `user-repository.getStats(userId)` → return 5 counter.
- T3.2: TDD `userService.getStats(session)` route handler.
- T3.3: Create `app/api/users/me/stats/route.ts` (GET).
- T3.4: Create [KudosStats.tsx](../../../src/components/sun-kudos/KudosStats.tsx) — Server Component đọc data từ service.
- T3.5: Create [OpenGiftButton.tsx](../../../src/components/sun-kudos/OpenGiftButton.tsx) — Client island; disabled khi `pending === 0`.
- T3.6: Create `secret-box-repository` + `secret-box-service.openOne(session)` với ownership check.
- T3.7: Create `app/api/secret-boxes/open/route.ts` (POST).
- T3.8: Create [RecentGiftsLeaderboard.tsx](../../../src/components/sun-kudos/RecentGiftsLeaderboard.tsx) — D.3 (avatar + name + gift label + click → profile).
- T3.9: Create [RecentRankupsLeaderboard.tsx](../../../src/components/sun-kudos/RecentRankupsLeaderboard.tsx) — "10 SUNNER thăng hạng" (avatar + name + tier badge from `kudos_received_count` 10/20/50 thresholds).
- T3.10: Create `sunner-repository.topReceivers(limit)` + `recentRankups(limit)` + `sunner-service` + 2 route handlers.
- T3.11: Mount KudosStats + RecentGiftsLeaderboard + RecentRankupsLeaderboard + OpenGiftButton trong KudosSidebar.
- T3.12: Empty state `Chưa có dữ liệu` cho leaderboard rỗng (cả 2 components — `role="status"` per a11y rules).
- T3.13: **TR-007 — Independent sidebar scroll**: apply `sticky top-X self-start max-h-[calc(100vh-X)] overflow-y-auto` to `<KudosSidebar>` so it scrolls independently when content exceeds viewport (feed scroll-area separate). Tailwind utilities only; no custom CSS. Verify via Playwright in T3.14: long sidebar overflow → can scroll without affecting feed.
- T3.14: Playwright `kudos-board-sidebar.spec.ts` GREEN — covers stats counters, leaderboard empty state, mở quà disabled state, **independent scroll behaviour (TR-007)**.

#### Phase 4 — A.1 Trigger + Kudo Create (US1)

- T4.1: Create [KudosCreateInput.tsx](../../../src/components/sun-kudos/KudosCreateInput.tsx) — Client island; click → navigate đến Viết Kudo dialog screen (`ihQ26W78P2`). **Lưu ý**: dialog itself là OOS — chỉ trigger được spec ở đây.
- T4.2: Stub Viết Kudo dialog route nếu chưa có (defer dependency tới khi `ihQ26W78P2` được survey). **Post-submit handshake (Q-PLAN9 lock)**: dialog calls `router.refresh()` on success — Server Component re-fetches feed page 1; Kudo mới sẽ xuất hiện ở top qua sort `created_at DESC`. KHÔNG cần `onCreated(kudo)` callback ở MVP. Revisit nếu UX optimistic là requirement cứng khi `ihQ26W78P2` được survey.
- T4.3: `kudos-repository.create({ senderId, receiverId, content, hashtagIds, imageUrls })` — atomic: insert Kudo + many-to-many Hashtag + update sender's `kudosSentCount` + receiver's `kudosReceivedCount` (recompute tier).
- T4.4: `kudos-service.create(input, session)` validate via Zod + delegate.
- T4.5: `app/api/kudos/route.ts` POST.
- T4.6: Playwright `kudos-board-create.spec.ts` (US1 #1, #2, #3, #5).
- T4.7: Anon click `A.1` → redirect login (US1 #5).

#### Phase 5 — Feed All Kudos + Infinite Scroll (US4)

- T5.1: `kudos-repository.listFeed({ filter, cursor, limit })` với filter:
  - Hashtag: WHERE EXISTS subquery on KudoHashtag.
  - Phòng ban: WHERE sender.departmentId = X OR receiver.departmentId = X (Q-LB5).
  - Combine: AND giữa filter (Q-LB6).
  - Sort: `createdAt DESC`.
  - Cursor pagination: WHERE `(createdAt, id)` < cursor.
- T5.2: `kudosService.listFeed(filter, cursor)`.
- T5.3: `app/api/kudos/route.ts` GET với Zod validate query params.
- T5.4: Create [KudosCard.tsx](../../../src/components/sun-kudos/KudosCard.tsx) — Server Component (sender/receiver info, time, content truncate 5 dòng, gallery max 5 thumbnails, hashtag chips).
- T5.5: Create [KudosFeed.tsx](../../../src/components/sun-kudos/KudosFeed.tsx) (Server initial render trang 1) + [KudosFeedClient.tsx](../../../src/components/sun-kudos/KudosFeedClient.tsx) (client island cho infinite scroll).
- T5.6: Create [useInfiniteScroll.ts](../../../src/hooks/useInfiniteScroll.ts) — IntersectionObserver-based, fetch khi sentinel hiển thị.
- T5.7: Empty state `Hiện tại chưa có Kudos nào.` (FR-020).
- T5.8: Create [useFilterParams.ts](../../../src/hooks/useFilterParams.ts) **HERE** (not Phase 7 as previously planned) — bidirectional URL ↔ filter sync via `useSearchParams` + `router.replace`. Phase 5's hashtag chip click handler depends on this hook (`setHashtag(tag)`), so the hook MUST land alongside or before chip wiring. Phase 7 will reuse the same hook for the dropdown filters. TDD: `tests/unit/hooks/useFilterParams.test.ts` failing first.
- T5.9: Click avatar/tên → navigate `/profile/{userId}` (cần SCREENFLOW gap đóng trước).
- T5.10: Hover preview (FR-018) — focus alternative cho keyboard.
- T5.11: Create [KudoImageLightbox.tsx](../../../src/components/sun-kudos/KudoImageLightbox.tsx) — Client island; click thumbnail → modal overlay with `next/image` fullsize, Esc + backdrop dismiss, focus-trap.
- T5.12: Create [ProfilePreviewPopup.tsx](../../../src/components/sun-kudos/ProfilePreviewPopup.tsx) — Client island; hover ≥ 300ms (`onMouseEnter`/`onFocus`) → render preview popup (linked Figma frame `721:5827`). Keyboard focus must also trigger (Constitution III a11y rule).
- T5.13: Playwright `kudos-board-feed.spec.ts`.

#### Phase 6 — Heart Toggle + Copy Link (US3 + một phần US4)

TDD: viết unit cho `useOptimisticHeart` + integration cho `kudos-service.like` first.

- T6.1: `kudos-service.like(kudoId, session)`:
  - Check sender ≠ liker → reject 400.
  - Check user chưa like → if existing, return 409 hoặc no-op (idempotent design choice).
  - Check `isSpecialDay` qua `special-day-service.todayIsSpecial()`.
  - `prisma.$transaction([create KudoLike, increment Kudo.heartCount, increment sender.heartsReceivedCount by (1 or 2)])`.
- T6.2: `kudos-service.unlike(kudoId, session)`:
  - Find existing KudoLike by `(kudoId, userId)`.
  - Read `isSpecialDayLike` flag → compute rollback amount (1 or 2).
  - `$transaction([delete KudoLike, decrement Kudo.heartCount by 1, decrement sender.heartsReceivedCount by (1 or 2)])`.
- T6.3: `app/api/kudos/[id]/like/route.ts` — POST + DELETE.
- T6.4: Create [HeartButton.tsx](../../../src/components/sun-kudos/HeartButton.tsx) — Client island:
  - `aria-pressed`.
  - Disabled khi `kudo.senderId === session.userId`.
  - Optimistic toggle via `useOptimisticHeart`.
  - Rollback + toast error nếu API fail.
- T6.5: Create [CopyLinkButton.tsx](../../../src/components/sun-kudos/CopyLinkButton.tsx):
  - `navigator.clipboard.writeText(formatKudoUrl(id))` + `toast.success("Link copied — ready to share!")`.
  - Fallback `document.execCommand('copy')` nếu clipboard API fail.
- T6.6: Mount HeartButton + CopyLinkButton trong `KudosActionBar`. Action bar accepts optional `viewDetailHref?: string` prop — when provided (Highlight `B.4.4`), renders extra "Xem chi tiết" `<Link>` button; when omitted (feed `C.4`), only heart + copy link.
- T6.7: Playwright `kudos-board-like.spec.ts` (US3 toàn bộ + edge case sender disabled + special day).

#### Phase 7 — Highlight Carousel + Filters (US2)

- T7.1: `kudos-repository.listHighlight({ filter, limit=5 })` — top 5 theo `heartCount DESC`.
- T7.2: `kudos-service.listHighlight(filter)`.
- T7.3: `app/api/kudos/highlight/route.ts` GET.
- T7.4: `hashtag-service.list()` + `app/api/hashtags/route.ts`.
- T7.5: `department-service.list()` + `app/api/departments/route.ts`.
- T7.6: ~~Create `useFilterParams.ts`~~ **Already shipped in Phase 5 T5.8**. Phase 7 reuses the hook for `HashtagFilter` + `DepartmentFilter` dropdown wiring (`setHashtag` / `setDepartment` / `clear`).
- T7.7: Create [HashtagFilter.tsx](../../../src/components/sun-kudos/HashtagFilter.tsx) + [DepartmentFilter.tsx](../../../src/components/sun-kudos/DepartmentFilter.tsx) — Client islands; dropdown UI; `aria-pressed`.
- T7.8: Create [HighlightCard.tsx](../../../src/components/sun-kudos/HighlightCard.tsx) — Server-rendered card body + Client `KudosActionBar` cho heart/copy/"Xem chi tiết".
- T7.9: Create [HighlightCarousel.tsx](../../../src/components/sun-kudos/HighlightCarousel.tsx) — Client island; B.2.1/B.2.2 + B.5.1/B.5.2/B.5.3 đồng bộ slide index.
- T7.10: Mount HighlightSection (Server) trong KudosBoardLayout với initial data từ page-level fetch.
- T7.11: Filter change re-fetches qua `router.refresh()` (Server Component re-render). Verify pagination reset về 1.
- T7.12: Empty state `Hiện tại chưa có Kudos nào.` cho Highlight (FR-020).
- T7.13: Playwright `kudos-board-highlight.spec.ts` (US2 all 9 scenarios).

#### Phase 8 — Spotlight Word Cloud (US5)

- T8.1: `kudos-repository.spotlightSummary()` — return `{ total: number, recipients: { userId, name, latestKudoAt }[] }`.
- T8.2: `kudos-service.spotlightSummary()` + `app/api/kudos/spotlight/route.ts` GET.
- T8.3: `sunner-repository.search(query, limit=10)` + `sunner-service.search(query)` + `app/api/sunners/search/route.ts` (validate ≤ 100 chars).
- T8.4: Word cloud rendering — **decision locked: custom canvas implementation** (Q-PLAN3 lock, no new runtime/dev dep). Implementation:
  - HTML `<canvas>` rendered inside `Spotlight.tsx` Client island.
  - Distribute nodes deterministic theo font-size weighted by per-recipient Kudo count.
  - Limit visible nodes ≤ 100 initial; "show more" if recipient count higher (mitigation cho 388+ node risk).
  - Spiral-out placement algorithm with bounding-box collision check.
  - Render to overlay DOM nodes for tooltip + click handlers (canvas alone không capture click reliably).
  - Pan = drag canvas translate; Zoom = canvas scale transform.
- T8.5: Create [Spotlight.tsx](../../../src/components/sun-kudos/Spotlight.tsx) — Client island. **Initial data SSR'd** via parallel `Promise.all` from `app/sun-kudos/page.tsx` (no flash); states: empty (when `total === 0`), interactive (with word cloud), loading (only shown when user-triggered re-fetch is in flight — e.g., after Refresh button, FR-016). On first mount the Client island hydrates with the SSR'd data — no client-side fetch on initial paint.
- T8.6: Create [SpotlightSearchBar.tsx](../../../src/components/sun-kudos/SpotlightSearchBar.tsx) — Client; debounced highlight + Enter/icon click submit; validate ≤ 100 chars + required-on-submit (FR-004).
- T8.7: Hover node → tooltip; click → navigate Kudos detail.
- T8.8: Playwright `kudos-board-spotlight.spec.ts` (US5 all 8 scenarios).

#### Phase 9 — Kudos Detail Route + Parallel Modal (Q-LB4)

- T9.1: `kudos-repository.getById(id)` + `kudos-service.getById(id)` + `app/api/kudos/[id]/route.ts`.
- T9.2: Create [app/sun-kudos/[id]/page.tsx](../../../app/sun-kudos/[id]/page.tsx) — Server Component full page detail (auth gate, fetch, render KudosDetailContent + Header/Footer).
- T9.3: Create [KudosDetailContent.tsx](../../../src/components/sun-kudos/KudosDetailContent.tsx) — shared body (sender/receiver, time, full content, gallery, hashtag, action bar, comments section nếu spec có — defer nếu không).
- T9.4: Add `app/sun-kudos/@modal/(.)[id]/page.tsx` (intercepting route) — render KudosDetailModal. (`@modal/default.tsx` + `layout.tsx` đã ship ở Phase 2.)
- T9.5: Create [KudosDetailModal.tsx](../../../src/components/sun-kudos/KudosDetailModal.tsx) — overlay với close button, dismissible on backdrop click, `Esc` keyboard, focus-trap.
- T9.6: Verify Copy Link URL format `https://.../sun-kudos/{id}` mở full page khi paste vào tab mới (FR-011 + Q-LB4).
- T9.7: Playwright `kudos-detail.spec.ts`:
  - Click card → modal mở, scroll giữ.
  - Direct visit `/sun-kudos/{id}` → full page.
  - Copy Link → mở tab mới → full page.
- T9.8: Q-PLAN6 resolution: Kudos detail page content design chưa được survey từ Figma. **MVP fallback**: render minimal layout = sender/receiver header + time + full content + gallery (`KudoImageLightbox`) + hashtag chips + action bar (heart + copy link). KHÔNG có comments / reply section cho MVP. Revisit nếu screen TBD được survey với element bổ sung.

#### Phase 10 — Refresh Button + URL Filter Sync Polish (FR-021 + TR-008)

- T10.1: Create [RefreshButton.tsx](../../../src/components/sun-kudos/RefreshButton.tsx) — Client island; `router.refresh()` + disabled-while-loading.
- T10.2: Decide Q-LB8 position: gần `C.1_Header Giải thưởng` (recommend).
- T10.3: Verify deep-link với filter query string áp filter ngay từ Server Component (FR-005 + TR-008 bidirectional).
- T10.4: Playwright `kudos-board-refresh.spec.ts`.

#### Phase 11 — Special Day read-only flow (admin endpoint deferred — Q-PLAN2 lock)

- T11.1: `special-day-repository.findActive(date)` — read-only query for the like flow (server-side `now()` ở `Asia/Ho_Chi_Minh` per TR-004).
- T11.2: `special-day-service.todayIsSpecial()` — injected into `kudos-service.like` (Phase 6 uses this).
- T11.3: ~~`app/api/admin/special-days/route.ts`~~ **DEFERRED** to a dedicated admin spec post-MVP. SpecialDay rows seeded via `prisma/seed.ts` (Phase 1 T1.3). Track follow-up: open new spec when `User.role` is introduced or an allowlist gate is agreed (Q-PLAN2 fallback options preserved in § Open Questions).
- T11.4: Vitest unit: boundary test for `todayIsSpecial()` — 23:59 vs 00:01 at `Asia/Ho_Chi_Minh` ↔ +2 vs +1 hearts.

#### Phase 11b — Rate Limit + Counter Recompute (cross-cutting hardening — Q-PLAN1 + Q-PLAN5 locks)

TDD: viết integration test trước, fail, rồi extend proxy + ship script.

- T11b.1: Vitest integration `tests/integration/proxy/kudos-rate-limit.test.ts` — 6 req trong 60s tới `POST /api/kudos` from same IP → request #6 returns 429 with `Retry-After`. Repeat with 31 req cho like endpoint + 11 req cho secret-boxes/open.
- T11b.2: Extend [proxy.ts](../../../proxy.ts):
  - Add `KUDOS_RATE_LIMITS` constant: `[{ pathPrefix: "/api/kudos", method: "POST", max: 5, window: 60_000 }, { pathPrefix: "/api/kudos/", suffix: "/like", max: 30, window: 60_000 }, { pathPrefix: "/api/secret-boxes/open", method: "POST", max: 10, window: 60_000 }]`.
  - Reuse existing `isRateLimited(key, now)` helper — key format `${ip}:${pathBucket}` so per-bucket counters don't collide.
  - Apply BEFORE prelaunch-gate check is unnecessary (kudos endpoints are not whitelisted at gate-active); but the rate-limit block runs in passthrough branch (post-gate-lift), same as existing `/api/auth/callback` limit.
- T11b.3: Add `__resetRateLimitForTests` call sites in beforeEach of new integration tests (export already exists).
- T11b.4: Ship [scripts/recompute-kudos-counters.ts](../../../scripts/recompute-kudos-counters.ts) — tsx script:
  - For every User: `SELECT count(*) ... FROM kudos WHERE receiverUserId = ?` → `kudosReceivedCount`; mirror for sent / hearts (sum of `KudoLike` rows on Kudos sent by user, weighted +1 or +2 by `isSpecialDayLike`) / secret boxes (count by state).
  - Single $transaction per User row OR one big transaction (decide at impl time based on row count).
  - `--dry-run` flag prints diff without writing.
  - Log per-User drift count + total via `src/lib/logger.ts`.
- T11b.5: Add `npm run db:recompute-kudos-counters` script to [package.json](../../../package.json) `scripts`: `"db:recompute-kudos-counters": "tsx scripts/recompute-kudos-counters.ts"`.
- T11b.6: Vitest integration `tests/integration/scripts/recompute-kudos-counters.test.ts` — seed DB with intentional drift (manually mutate counter to wrong value), run script, assert counter corrected.

#### Phase 12 — Polish + Cross-cutting (a11y, error states, performance)

- T12.0: i18n parity — extend [src/lib/i18n/catalogs/vi-VN.json](../../../src/lib/i18n/catalogs/vi-VN.json) + [src/lib/i18n/catalogs/en-US.json](../../../src/lib/i18n/catalogs/en-US.json) với `kudos.*` namespace (board title, filter labels, empty states, toast strings, sidebar labels). Both files MUST stay in lockstep — parity test at `tests/unit/lib/i18n/parity.test.ts` already enforces this; run after edit.
- T12.1: A11y full sweep: tab order, focus ring, aria attributes (heart `aria-pressed`, carousel `aria-roledescription`, etc.).
- T12.2: Error states cho mọi API call: toast generic, không leak stack.
- T12.3: Loading states: skeleton cho feed initial load, spinner cho Spotlight.
- T12.4: `prefers-reduced-motion` respect: carousel slide transition tắt, heart toggle micro-interaction tắt, Spotlight pan/zoom transition tắt.
- T12.5: Performance check: First Contentful Paint ≤ 2.5s (TR-002) trên Lighthouse 3G fast.
- T12.6: Cross-browser: verify trên chromium (Playwright primary).
- T12.7: Run full test suite: `npm run lint`, `tsc --noEmit`, `npm run test`, `npm run test:e2e`.
- T12.8: Manual visual compare: `frame.png` (Phase 0) vs `implementation.png` (screenshot live trang). Lưu cả 2 vào `.momorph/specs/MaZUn5xHXZ-sun-kudos-live-board/assets/` (theo memory rule "Visual-compare assets next to spec").

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Atomic like race condition** | Medium | High | `$transaction` + UNIQUE constraint + integration test verify với concurrent client. Stress test với 10 concurrent like trên cùng Kudo. |
| **Parallel modal (Next.js intercepting routes) setup khó** | Medium | Medium | Đã có Next.js 16 docs reference; small POC ở Phase 9 trước khi wire full. Fallback option = full route only (Q-LB4 option B), revisit Q-LB4 nếu blocker. |
| **Spotlight word cloud render performance với 388+ nodes** | Medium | Medium | Custom canvas-based render với debounced re-layout. Limit visible nodes ≤ 100 ban đầu, pagination nếu vượt. Lighthouse check. |
| **Migration deploy production rollback** | Low | High | Migration backwards-compatible: new columns nullable / default, no DROP. Test migration trên staging trước. Auth.js adapter tables (`User`/`Account`/`Session`/`VerificationToken`) MUST follow adapter contract — new `User` columns are nullable with sane defaults per Constitution II. |
| **Counter denormalization drift** | Low-Medium | Medium | (Q-PLAN5 lock) Ship `scripts/recompute-kudos-counters.ts` as manual escape hatch + `npm run db:recompute-kudos-counters`. No automated cron — invoke manually if drift detected via spot-check or 5xx anomaly. Recomputes 5 counters per User from `Kudo`/`KudoLike`/`SecretBox` ground truth in a single $transaction. |
| **Special-day timezone bug** | Low | Medium | Tất cả check ở server side với `Asia/Ho_Chi_Minh` Intl format. Integration test verify boundary 23:59 → 00:01. |
| **Like spam / Kudo flood** | Medium | Medium | (Q-PLAN1 lock) Extend `proxy.ts` token-bucket per-IP for `/api/kudos` (5/60s), `/api/kudos/:id/like` (30/60s), `/api/secret-boxes/open` (10/60s). L2 mitigation still in place: UNIQUE constraint on `(kudoId, userId)` for likes, content-length cap, auth gate. |
| **Gmail avatar URL whitelist miss** | Low | Low | `lh3.googleusercontent.com` (`pathname: "/a/**"`) đã có trong [next.config.ts](../../../next.config.ts); T0.6 verifies + extends pathname pattern if Kudo card avatars use a different path. Memory rule `feedback_nextjs_image_whitelist.md` enforces this. |
| **i18n parity giữa vi-VN và en-US** | Low | Low | Lockstep update + parity test (đã ship ở Homepage). |
| **Test data seed flake** | Medium | Low | Seed determinist (no random faker, dùng fixed seeds). Reset DB giữa test runs. |
| **Tasks phase too big — không fit 1 PR** | High | Medium | Split commit theo phase. Mỗi phase 1 PR. Plan ~12 PR. |

### Estimated Complexity

- **Frontend**: **High** — ~22 component mới, 3 hook, 1 layout + parallel modal route. Carousel + Spotlight (custom canvas) + infinite scroll + parallel modal đều là pattern chưa có trong project.
- **Backend**: **High** — 9 Prisma model mới, 14 endpoint mới, atomic $transaction across like/unlike/create flows, denormalized counters + manual recompute script, `proxy.ts` rate-limit extension.
- **Testing**: **High** — ~16 component tests + ~10 service/repo unit tests + ~6 integration tests + ~9 E2E spec mới. TDD discipline cần strict; atomic transaction coverage MUST hit 100%.
- **Total**: ~13 PR (12 phase + 11b). ~3-4 sprint (2 tuần/sprint) cho 1 dev full-time, hoặc 1.5-2 sprint với 2 dev parallel (frontend + backend track).

---

## Integration Testing Strategy

### Test Scope

- [x] **Component/Module interactions**: KudosBoardLayout ↔ Header/Footer/sidebar/feed; HighlightCarousel ↔ HighlightCard ↔ HeartButton; KudosFeedClient ↔ useInfiniteScroll; HashtagFilter ↔ useFilterParams ↔ URL.
- [x] **External dependencies**: Prisma (real Postgres via Docker test container hoặc Vitest in-memory adapter); Auth.js session helper.
- [x] **Data layer**: All Prisma queries với atomic transaction verified.
- [x] **User workflows**: 9 E2E flows (xem Phase breakdown).

### Test Categories

| Category | Applicable? | Key Scenarios |
|----------|-------------|---------------|
| UI ↔ Logic | Yes | Filter dropdown → URL update; Heart click → optimistic + rollback; Carousel prev/next disabled logic |
| Service ↔ Service | Yes | kudosService → kudosRepository → Prisma; specialDayService injected into kudosService.like |
| App ↔ External API | Limited | Avatar URL fetch (Gmail) tested via mock; clipboard API tested via Playwright |
| App ↔ Data Layer | Yes | Atomic like, atomic unlike, counter denormalization integrity, cursor pagination correctness |
| Cross-platform | Limited | Q-LB3 deferred; chromium-only E2E |

### Test Environment

- **Environment type**: Local (Docker Postgres test container) + Vercel Preview (staging E2E).
- **Test data strategy**: Deterministic seed script in `tests/fixtures/kudos-seed.ts` — fixed UUIDs, fixed timestamps, fixed special-day date.
- **Isolation approach**: Truncate Kudo* tables giữa mỗi integration test; Playwright dùng fresh authenticated session fixture.

### Mocking Strategy

| Dependency Type | Strategy | Rationale |
|-----------------|----------|-----------|
| Prisma | Real (test DB) cho integration; mock cho unit | Real DB catch atomic transaction bug; mock cho unit fast |
| Auth.js `auth()` | Mock cho unit; real cho E2E (qua seeded session) | Same pattern as Homepage / Awards |
| `navigator.clipboard` | Playwright real | Real browser API verify |
| Toast | Real `<Toaster>` mount trong test | UI integration |
| IntersectionObserver | jsdom polyfill (đã có ở Awards Phase 5) | Reuse |
| `next/router` | `useRouter` mock cho component test; real router cho E2E | Standard |

### Test Scenarios Outline

1. **Happy Path**
   - [ ] Auth user vào `/sun-kudos` → thấy 5 Highlight + 20 feed + sidebar stats.
   - [ ] Gửi Kudo → seller's stats `kudosSentCount` +1.
   - [ ] Thả tim Kudo → `heartCount` +1, sender's `heartsReceivedCount` +1.
   - [ ] Thả tim Kudo special day → +2 hearts.
   - [ ] Filter hashtag + dept đồng thời → AND intersection.
   - [ ] Refresh button → re-fetch + giữ filter.
   - [ ] Copy Link → clipboard có URL.
   - [ ] Click feed card → modal mở; deep-link → full page.

2. **Error Handling**
   - [ ] Anon visit `/sun-kudos` → redirect `/login`.
   - [ ] Anon click `A.1` → redirect.
   - [ ] Session expired mid-action → 401 → redirect.
   - [ ] Sender thả tim own Kudo → button disabled, API reject 400.
   - [ ] Like twice cùng Kudo → UNIQUE error → toggle về unlike.
   - [ ] Spotlight search 101 ký tự → 400 error.
   - [ ] Spotlight search rỗng + Enter → required message.
   - [ ] Mở quà khi `pending === 0` → button disabled.
   - [ ] Mở quà của user khác (IDOR thử) → 403.

3. **Edge Cases**
   - [ ] Empty feed → `Hiện tại chưa có Kudos nào.`.
   - [ ] Empty leaderboard → `Chưa có dữ liệu`.
   - [ ] Special day boundary 23:59 vs 00:01 → +2 vs +1.
   - [ ] Kudo content > 5 dòng → truncate `...` → click → detail.
   - [ ] Gallery > 5 ảnh → chỉ hiện 5.
   - [ ] Carousel slide 1 → Prev disabled; slide 5 → Next disabled.
   - [ ] Filter combine AND empty result → empty state, không crash.
   - [ ] Reload page với filter URL → áp filter ngay.

### Tooling & Framework

- **Test framework**: Vitest 4 (unit + integration) + Playwright 1.59 (E2E chromium).
- **Supporting tools**: jsdom + RTL; Prisma test client; Playwright clipboard handler.
- **CI integration**: `npm run lint && tsc --noEmit && npm run test && npm run test:e2e` (same as Awards CI).

### Coverage Goals

| Area | Target | Priority |
|------|--------|----------|
| Core P1 user flows (US1, US2, US3, US4, US7) | ≥ 95% | High |
| API route handlers + services + repositories | ≥ 85% | High |
| Atomic transaction code paths | 100% | Critical |
| Error scenarios (validation, auth, rate) | ≥ 80% | High |
| P2 user flows (US5, US6) | ≥ 70% | Medium |
| Edge cases (empty, boundary) | ≥ 75% | Medium |

---

## Dependencies & Prerequisites

### Required Before Start

- [x] `constitution.md` reviewed (v1.1.1).
- [x] `spec.md` approved (Q-LB1..Q-LB7 lock locked 2026-05-11).
- [x] Existing infrastructure (Header, Footer, Auth.js, Prisma, Toaster, i18n) đã ship.
- [ ] **4 outgoing nav targets surveyed vào SCREENFLOW** (block trước Phase 4):
  - `w4WUvsJ9KI` Profile (Sunner khác).
  - `6-1LRz3vqr` Tất cả thông báo (full route vs panel).
  - `m0zV-VstXX` / `J3-4YFIpMM` Secret Box dialog.
  - Kudos detail screen TBD (route gắn Q-LB4 = `/sun-kudos/{id}`, content design chưa survey).
- 🅿 Q-PLAN4 parked — Kudo image upload solution (Cloudinary / UploadThing / S3) phụ thuộc Viết Kudo dialog screen (`ihQ26W78P2`). **KHÔNG block KudosBoard** vì chỉ display URL từ DB; seed dùng `picsum.photos` placeholder. Re-open khi `ihQ26W78P2` được survey.

### External Dependencies

- PostgreSQL 15+ running (đã có).
- `lh3.googleusercontent.com` (Gmail avatar host) trong `next.config.ts` `images.remotePatterns` — **đã có** (`pathname: "/a/**"`). Plan extends pathname pattern nếu cần (T0.6).
- `picsum.photos` (gallery placeholder for seed only) — add to `remotePatterns` if Phase 5 confirms gallery uses this host (T5.x decision).
- Rate limit: in-process Map via `proxy.ts` token-bucket (Q-PLAN1 lock — Phase 11b). Future swap to Redis/Upstash only if multi-instance deploy lands.

---

## Open Questions

Câu hỏi mới phát sinh từ plan (KHÔNG cùng tập với Q-LB của spec). Status tracked at review 2026-05-11. **Tất cả Q-PLAN actionable đã resolve; còn lại 1 parked (depend external spec).**

- ✅ **Q-PLAN1 (resolved 2026-05-11) — Rate limiting**: **Extend `proxy.ts` token-bucket** per-IP cho mutate endpoints. Buckets: `POST /api/kudos` 5/60s, `POST/DELETE /api/kudos/:id/like` 30/60s, `POST /api/secret-boxes/open` 10/60s. Reuse existing `isRateLimited()` helper. L2 mitigation (UNIQUE constraint + content-length cap + auth gate) vẫn giữ. Implementation: Phase 11b. Test: `tests/integration/proxy/kudos-rate-limit.test.ts`. Future-proof note: in-process Map; swap to Redis when multi-instance deploy required.
- ✅ **Q-PLAN2 (resolved 2026-05-11) — Admin role gating**: User chưa có cột `role`. **Decision: defer toàn bộ admin endpoint khỏi MVP** (option a). SpecialDay rows seeded via `prisma/seed.ts` (Phase 1 T1.3 seeds 2 rows: today + a fixed historical date). Fallback options preserved for post-MVP: (b) env allowlist `SAA_ADMIN_EMAILS`, (c) add `User.role`.
- ✅ **Q-PLAN3 (resolved 2026-05-11) — Word cloud library vs custom canvas**: **Custom canvas** (option B). No new runtime/dev dep. Implementation details locked at Phase 8 T8.4.
- 🅿 **Q-PLAN4 (parked — depend external spec) — Kudo image upload solution**: phụ thuộc Viết Kudo dialog (`ihQ26W78P2`) spec. Trên KudosBoard **không block**: KudosBoard chỉ display URL từ DB, seed dùng `picsum.photos` placeholder (Phase 1 T1.3). Add `picsum.photos` vào `next.config.ts` `images.remotePatterns` ở Phase 5 nếu test data dùng host này. Re-open Q-PLAN4 khi `ihQ26W78P2` được survey to lock upload pipeline (Cloudinary / UploadThing / S3).
- ✅ **Q-PLAN5 (resolved 2026-05-11) — Counter drift recovery**: **Manual escape hatch via `scripts/recompute-kudos-counters.ts`** (no cron). `npm run db:recompute-kudos-counters` recomputes 5 counters per User from ground truth (`Kudo`, `KudoLike`, `SecretBox`). `--dry-run` flag prints diff without writing. Implementation: Phase 11b. Test: `tests/integration/scripts/recompute-kudos-counters.test.ts` seeds drift, runs script, verifies correction. Rationale: transaction atomicity (FR-010) is L1; escape hatch is safety net if a partial-failure pathway is discovered.
- ✅ **Q-PLAN6 (resolved 2026-05-11) — Kudos detail page content design**: **MVP minimal layout** (sender/receiver header + time + full content + gallery via `KudoImageLightbox` + hashtag chips + action bar). Comments / reply section OFF cho MVP. Re-open nếu Figma detail screen được survey và có thêm element.
- ✅ **Q-PLAN7 (resolved 2026-05-11) — User avatar field**: **Reuse Auth.js `User.image`** (Gmail OAuth provider). KHÔNG add `avatarUrl` column. Spec mention "thêm avatar_url" was a transcription artifact — `User.image` đã có sẵn và đủ.
- ✅ **Q-PLAN8 (resolved 2026-05-11) — Leaderboard split**: **Two distinct components** (`RecentGiftsLeaderboard.tsx` + `RecentRankupsLeaderboard.tsx`), not a single variant-prop component. Different item shapes (gift label vs tier badge) keep each component small.
- ✅ **Q-PLAN9 (resolved 2026-05-11) — Optimistic-prepend handshake (FR-002 / US1 #3)**: **`router.refresh()` stub** (option b). Dialog `ihQ26W78P2` (OOS) calls `router.refresh()` on success → Server Component re-fetches feed page 1 → new Kudo xuất hiện ở top qua `created_at DESC` sort. KHÔNG có callback `onCreated(kudo)` contract trong MVP. Trade-off: MVP không realtime nên loss-of-optimism là chấp nhận được. Re-open nếu dialog spec requires true optimistic UX.

---

## Next Steps

Sau khi plan này được approve:

1. **Run** `/momorph.tasks` để generate task breakdown chi tiết với task ID + dependency graph.
2. **Review** tasks.md tìm parallelization opportunity (Phase 1 DB / Phase 0 assets có thể parallel; Phase 3-7 backend services có thể parallel với frontend Phase 5+).
3. **Survey 4 nav targets** thiếu trong SCREENFLOW (xem § Dependencies) — parallel với Phase 0/1.
4. **Begin implementation** theo phase order; mỗi phase 1 PR, tests green trước khi merge.

---

## Notes

- Live Board là feature **lớn nhất** mà project đã spec đến nay. Đề xuất chia 12 phase ~ 12 PR; mỗi PR ≤ 600 LOC để dễ review.
- Reuse Homepage / Awards infrastructure tối đa: Header, Footer, NavLinks (đã có entry `/sun-kudos`), Toaster, auth gate pattern, locale cookie, i18n parity test.
- **Constitution Principle V (TDD)** strict: mỗi FR-* có failing test trước implementation, mỗi atomic transaction có integration test với real Postgres.
- Tham khảo plan Awards (`zFYDgyj_pD-he-thong-giai/plan.md`) cho codebase pattern + Header reuse + Phase breakdown discipline.
- **Memory note**: prefix mọi command `npm` với `source ~/.nvm/nvm.sh && nvm use 20.20.2` để tránh Node 18 vỡ vitest/rolldown.
- **Memory note**: Visual compare assets (`frame.png`, `implementation.png`) đặt vào `.momorph/specs/MaZUn5xHXZ-sun-kudos-live-board/assets/`, KHÔNG `.playwright-mcp/`.
- **Memory note**: Khi chạy `prisma migrate reset` (nếu cần) — ask consent tersely, đừng re-explain rationale.

### Review log

- **2026-05-11 (momorph.reviewplan pass 1)** — Plan reviewed cho technical feasibility + actionability + constitution compliance. Fixes applied:
  - Factual corrections: `db:migrate` script (was `prisma:migrate`); i18n catalogs path (`catalogs/*.json`, not `locales/*.ts`); `lh3.googleusercontent.com` already in `next.config.ts`; Header API (slot props, not `currentPath`); Zod 4 already in deps.
  - Project structure: added `app/sun-kudos/layout.tsx`, `KudoImageLightbox.tsx`, `ProfilePreviewPopup.tsx`; split `Leaderboard` → `RecentGiftsLeaderboard` + `RecentRankupsLeaderboard`; removed admin route (deferred).
  - Phase reshuffles: layout + `@modal/default.tsx` moved up to Phase 2 (was Phase 9); i18n task added as T12.0; Phase 11 reduced to read-only flow.
  - DB schema: dropped `User.avatarUrl` (reuse Auth.js `User.image`); seed includes 2 SpecialDay rows as admin-substitute.
  - Open Questions resolved (pass 1): Q-PLAN2, Q-PLAN3, Q-PLAN6, Q-PLAN7, Q-PLAN8.

- **2026-05-11 (momorph.reviewplan pass 2 — Q-PLAN open-question sweep)** — Remaining Q-PLAN items resolved with user input:
  - **Q-PLAN1** → extend `proxy.ts` token-bucket for `/api/kudos*` mutate (5/30/10 per 60s buckets). New Phase 11b added with TDD tests; `proxy.ts` MODIFY entry added.
  - **Q-PLAN5** → ship `scripts/recompute-kudos-counters.ts` manual escape hatch + `npm run db:recompute-kudos-counters`. New Phase 11b includes script + integration test. Project structure adds `scripts/` folder.
  - **Q-PLAN9** → dialog calls `router.refresh()` post-submit (no `onCreated` callback). Documented at T4.2.
  - **Q-PLAN4** → confirmed parked (no change): KudosBoard only displays, seed uses `picsum.photos` placeholder; revisit when `ihQ26W78P2` lands.
  - Risk table updated: rate-limit row reframed as "Like spam / Kudo flood" with proxy.ts mitigation; counter-drift row reframed with manual recompute hatch.

- **2026-05-11 (momorph.reviewplan pass 3 — consistency sweep)** — Pass-2 Q-PLAN resolutions weren't fully propagated to Summary / Threat-model / Risk / Complexity sections. Also caught one spec→plan gap:
  - **Counts corrected**: 7 → 9 Prisma models; 13 → 14 new endpoints (10 GET + 4 mutate); ~16-18 → ~22 components.
  - **Stale defer-language**: threat-model "User flood POST /api/kudos" + "Violations" line + External-Dependencies note + Required-Before-Start now reflect Q-PLAN1 mitigation (proxy.ts token-bucket) instead of "defer rate-limit infra".
  - **A09 logging**: removed "admin actions (special-day CRUD)" since admin endpoint is deferred.
  - **Test files**: added `hashtag-service.test.ts` + `department-service.test.ts` (already named in compliance line 99 but missing from tree); added `tests/fixtures/kudos-seed.ts` (referenced in test-data-strategy but missing from tree).
  - **Seed comment**: `prisma/seed.ts` MODIFY line updated to match Phase 1 T1.3 reality (2 SpecialDay rows, 5 Gifts, ~150 KudoLike).
  - **Estimated Complexity**: removed stale "admin role gating" line; updated test counts to match expanded tree.
  - **TR-007 (sidebar independent scroll) was uncovered** — added T3.13 + extended T3.14 Playwright spec to verify behaviour. Updated TDD line to include TR-007.
  - **Risk row "Gmail avatar"** made concrete (mentions actual `pathname: "/a/**"` + memory rule file).
  - **Result**: plan now fully self-contained. Review checklist 4×4 = 16 items all pass. Ready for `/momorph.tasks`.

- **2026-05-11 (momorph.reviewplan pass 4 — final polish)** — Light sweep before sign-off:
  - **`KudosActionBar` variant clarified**: takes optional `viewDetailHref` prop. C.4 (feed) omits it; B.4.4 (Highlight) passes it to render "Xem chi tiết" button. Removes ambiguity from earlier "shared component" wording.
  - **Spotlight SSR vs Client loading state contradiction resolved**: initial data SSR'd via `Promise.all` in `app/sun-kudos/page.tsx` (no flash). "Loading" state on the Client island only appears on user-triggered re-fetch (Refresh button). T8.5 updated.
  - **Phase 0 `query_section` list expanded**: added `B.1.1`/`B.1.2` dropdown linked frames (`1002:13013`, `721:5684`), `B.4.4` action bar, `D.3` leaderboard, Footer, and `721:5827` Profile preview popup (needed at Phase 5 for `ProfilePreviewPopup`).
  - **`useFilterParams` ordering fixed**: hook moved from Phase 7 → Phase 5 T5.8 (hashtag chip click depends on `setHashtag`). Phase 7 T7.6 now marks "already shipped, reuse".
  - **No new Q-PLAN items**; Q-PLAN4 remains parked (depends on `ihQ26W78P2` dialog spec). Plan is final.
