# Tasks: Sun* Kudos — Live Board

**Frame**: `MaZUn5xHXZ-sun-kudos-live-board`
**Spec**: [spec.md](spec.md) (Status: **Ready for plan** — Q-LB1/2/4/5/6/7 resolved; Q-LB3 deferred; Q-LB8 parked)
**Plan**: [plan.md](plan.md) (reviewed 4× — 2026-05-11)
**Created**: 2026-05-11

---

## Task Format

```
- [ ] T### [P?] [Story?] [Type] Description | file/path.ts
```

- **[P]** — task có thể chạy song song với các `[P]` khác trong cùng phase (different files, không phụ thuộc task chưa xong trong phase này).
- **[Story]** — `[US1]`..`[US7]` map vào user story của spec. Setup / Foundation / Polish phases KHÔNG có story label.
- **[Type]** — `[Logic]` (data, helpers, types, services, repositories), `[UI]` (components, page, styles, assets), `[Test]` (Vitest unit/integration + Playwright E2E).
- **|** separator trước file path mà task động đến.

**Locked decisions** (from `plan.md` Q-PLAN sweep — 2026-05-11):

- Spotlight = custom canvas, không add runtime dep (Q-PLAN3)
- Admin Special Day endpoint deferred → `prisma/seed.ts` only (Q-PLAN2)
- User avatar = reuse Auth.js `User.image` (Q-PLAN7)
- 2 leaderboard component distinct: `RecentGiftsLeaderboard` + `RecentRankupsLeaderboard` (Q-PLAN8)
- Rate limit = extend `proxy.ts` token-bucket cho `/api/kudos*` (Q-PLAN1)
- Counter drift = `scripts/recompute-kudos-counters.ts` manual escape hatch (Q-PLAN5)
- Optimistic prepend = `router.refresh()` sau dialog submit (Q-PLAN9)
- Kudos detail page = MVP minimal layout (Q-PLAN6)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Survey Figma frame, download assets, extract design tokens, đóng SCREENFLOW gaps, verify config. Maps to plan **Phase 0**.

- [x] T001 [UI] Mở Figma frame `MaZUn5xHXZ` via `get_frame_image`; save `frame.png` để visual reference + final compare | .momorph/specs/MaZUn5xHXZ-sun-kudos-live-board/assets/frame.png — **Shipped 2026-05-11** (commit `bdbe2e1`). 1440×5862 PNG saved.
- [x] T002 [P] [UI] Chạy `query_section` cho các node chính: `A.1` (ô nhập), `B.1.1` + linked `1002:13013` (hashtag dropdown), `B.1.2` + linked `721:5684` (dept dropdown), `B.3` (highlight card), `B.4.4` (action bar Highlight), `B.7` (Spotlight), `C.3` (feed card), `C.4.1` (heart), `D.1` (stats sidebar), `D.3` (leaderboard), `721:5827` (Profile preview popup), Footer. Document CSS tokens cần extend | .momorph/specs/MaZUn5xHXZ-sun-kudos-live-board/assets/css-tokens.md — **Shipped 2026-05-11** (commit `bdbe2e1`). Linked frames `1002:13013`/`721:5684`/`721:5827` only metadata-noted; full survey deferred to consuming phase (Phase 5/7).
- [x] T003 [P] [UI] Liệt kê + tải assets via `list_media_nodes` + `get_media_files`: KV background, pencil icon (A.1), heart active/inactive, copy link icon, pan/zoom icon, gift icon (D.1.8), 3 star tier icons, Spotlight node decorations. Save kebab-case vào subfolders | public/assets/sun-kudos/{icons,images,illustrations}/ — **Shipped 2026-05-11** (commit `bdbe2e1`). 19 unique assets downloaded: 9 SVG icons + 6 illustrations (KV bg + kudos logo + 4 tier badges) + 4 sample PNG (3 avatars + gallery). Heart active/inactive variants + pan/zoom icon + Spotlight node decorations not present in current Figma frame export — defer to Phase 6 (heart) / Phase 9 (Spotlight) if needed.
- [x] T004 [UI] Update `app/globals.css` với 8 Tailwind tokens mới: `--saa-kudos-heart-active/inactive`, `--saa-kudos-card-bg/border`, `--saa-kudos-section-header-fg/section-subtitle-fg`, `--saa-kudos-filter-active-bg/inactive-bg`, `--saa-spotlight-node-fg/bg`, `--saa-kudos-stat-value-fg`, `--saa-kudos-leaderboard-divider`. Confirm KHÔNG duplicate với Awards / Homepage tokens | app/globals.css — **Shipped 2026-05-11** (commit `f30b014`, test `e4b2b81`). Added 5 NEW tokens (card-bg, filter-bg/-bg-active, hashtag-fg, time-fg); 3 plan-prescribed slots collapse onto existing `--color-saa-button-primary` / `--color-saa-page-fg` / `--color-saa-divider` (same hex — no duplicates). Heart + Spotlight tokens deferred to Phase 6/9. TDD: `tests/unit/app/globals-css.test.ts` 9 assertions RED→GREEN.
- [x] T005 [P] [UI] Survey 4 outgoing nav targets thiếu trong SCREENFLOW (Constitution III — Evidence-Based Nav): `w4WUvsJ9KI` Profile (Sunner khác), `6-1LRz3vqr` Tất cả thông báo, `m0zV-VstXX` / `J3-4YFIpMM` Secret Box dialog, Kudos detail screen TBD. Chạy `/momorph.screenflow` cho mỗi target | .momorph/SCREENFLOW.md, .momorph/contexts/SCREENFLOW.md — **Shipped 2026-05-11** (commit `7f2b6e1`). Metadata-only survey via MoMorph `get_frame`; canonical screenIds: `w4WUvsJ9KI` Profile, `6-1LRz3vqr` Notifications, `J3-4YFIpMM` Secret Box (`m0zV-VstXX` is no-rev duplicate), **`onDIohs2bS` View Kudo** = the Kudos detail target. Full per-screen `/momorph.screenflow` runs deferred to each target's own spec session.
- [x] T006 [P] [Logic] Verify `next.config.ts` `images.remotePatterns` — `lh3.googleusercontent.com` với `pathname: "/a/**"` ĐÃ có. Nếu Phase 5 phát hiện avatar URL khác pattern → extend. Thêm `picsum.photos` cho seed gallery placeholder | next.config.ts — **Shipped 2026-05-11** (commit `e4b2b81`). Existing host verified; new guard test `tests/unit/app/next-config.test.ts` (2 assertions) locks in. `picsum.photos` deferred to Phase 2 (seed.ts).

**Exit criteria**: `frame.png` saved; CSS tokens documented; assets land in `public/assets/sun-kudos/`; `globals.css` extended; 4 SCREENFLOW targets surveyed; `next.config.ts` verified.

**✅ Phase 1 COMPLETE (2026-05-11)** — all 6 tasks shipped across 4 commits (`bdbe2e1` assets, `f30b014` tokens, `e4b2b81` tests, `7f2b6e1` screenflow). Test suite **334/334 GREEN** with Postgres (Prisma reset confirmed clean). Lint + typecheck clean. Ready for Phase 2.

---

## Phase 2: Foundation (Blocking Prerequisites)

**Purpose**: DB schema + migration + seed + shared lib + types + zod schemas + layout/page skeleton. Maps to plan **Phase 1 + Phase 2 (skeleton)**.

**⚠️ CRITICAL**: KHÔNG bắt đầu user-story phase nào trước khi Phase 2 xong.

### DB schema + migration + seed

- [~] T007 [Test] **TDD red** — Viết Vitest unit test cho `kudo-like-repository.like(kudoId, userId, isSpecialDay)`: tăng `heartCount` + `heartsReceivedCount` đúng 1 hoặc 2; UNIQUE violation khi like 2 lần; `$transaction` rollback khi 1 phần fail. Chạy RED trước khi implement | tests/unit/repositories/kudo-like-repository.test.ts — **Deferred to Phase 6 (co-ship with T063)** — 2026-05-11. Constitution Principle V mandates a RED test before implementation, but ALSO forbids `.skip` annotations on new tests, while T025 requires `npm run test` clean before user-story phases. Shipping T007 in Phase 2 against a missing `kudo-like-repository` module fails import-time and blocks T025. Resolution: T007 will be authored alongside T063 in Phase 6 so the RED→GREEN window stays within a single phase. The behavioral contract is preserved in this task description.
- [x] T008 [Logic] Extend `prisma/schema.prisma`: 9 model mới (`Kudo`, `KudoImage`, `KudoLike`, `Hashtag`, `KudoHashtag` junction, `Department`, `SpecialDay`, `SecretBox`, `Gift`); extend `User` với `departmentId`/`title` + 5 denormalized counter (`kudosReceivedCount`, `kudosSentCount`, `heartsReceivedCount`, `secretBoxesOpenedCount`, `secretBoxesPendingCount`). **KHÔNG add `avatarUrl`** (Q-PLAN7) | prisma/schema.prisma — **Shipped 2026-05-11**. 9 models + `SecretBoxState` enum + 5 indexes on `Kudo` (createdAt/heartCount sort, sender/receiver lookups). All counter cols default 0; relations use `onDelete: Cascade` to keep junctions consistent.
- [x] T009 [Logic] Chạy migration: `source ~/.nvm/nvm.sh && nvm use 20.20.2 && npm run db:migrate -- --name add-kudos-domain`. Verify migration file generated | prisma/migrations/add-kudos-domain/ — **Shipped 2026-05-11**. `20260511091332_add_kudos_domain/migration.sql` (181 SQL lines) generated + applied; Prisma Client regenerated.
- [x] T010 [Logic] Extend `prisma/seed.ts` idempotent: 5 Department (Marketing, Engineering, Design, HR, Operations); ~15 Hashtag (Dedicated, Inspiring, IDOL GIỚI TRẺ, Teamwork, Innovation, ...); **2 SpecialDay** (today + 1 historical for tests — Q-PLAN2 substitute for admin endpoint); 5 Gift sample; update 3-5 existing User với `departmentId` + counter deterministic; ~50 Kudo + ~150 KudoLike (đa dạng sender/receiver/hashtag); gallery URL `picsum.photos` placeholder | prisma/seed.ts — **Shipped 2026-05-11**. Idempotent upserts by unique key (name/slug/email/date) + deterministic IDs cho Kudo/KudoLike/SecretBox; counters recomputed from ground truth after seed (Q-PLAN5 invariant). Also: `next.config.ts` extended với `picsum.photos /**` host (T006 deferral) + `tests/unit/app/next-config.test.ts` updated với assertion mới.
- [x] T011 [Logic] Chạy seed: `npm run db:seed`; verify qua Prisma Studio (`npx prisma studio`) — 9 model có data | (no file) — **Shipped 2026-05-11**. Row counts verified: 5 dept / 15 hashtags / 5 gifts / 2 special days / 5 seed users + 1 pre-existing / 50 kudos / 140 likes (10 capped by 4-non-sender pool when likeCount=5; plan said ~150) / 20 secret boxes. Sample `seed-user-1` counters consistent: 10 sent / 10 received / 40 hearts / 3 pending boxes / 1 opened box.

### Shared lib + types + zod validation

- [x] T012 [P] [Logic] Tạo shared TS types: `Kudo`, `KudoLike`, `Hashtag`, `KudoFilter`, `KudoCursor`, etc. | src/lib/kudos/types.ts — **Shipped 2026-05-11**. Façade types decoupled from `@prisma/client`: `KudoId/UserId/HashtagId/DepartmentId`, `Hashtag`, `Department`, `KudoImage`, `KudoAuthor`, `KudoLike`, `Kudo`, `KudoFilter`, `KudoCursor`, `KudoFeedPage`.
- [x] T013 [P] [Test] **TDD red** — unit test cho `formatKudoUrl(id)` helper (base URL + path format) | tests/unit/lib/kudos/format-kudo-url.test.ts — **Shipped 2026-05-11**. 4 assertions RED→GREEN: absolute when `NEXT_PUBLIC_BASE_URL` set, trailing-slash trim, root-relative fallback, empty-id throws.
- [x] T014 [P] [Logic] Implement `formatKudoUrl(id) → string` helper (use `process.env.NEXT_PUBLIC_BASE_URL` hoặc Next.js config) | src/lib/kudos/format-kudo-url.ts — **Shipped 2026-05-11**.
- [x] T015 [P] [Test] **TDD red** — unit test cho `isSpecialDay(date, specialDays)`: boundary 23:59:59 ICT → today flag, 00:00:00 ICT next day → flag = false (TR-004 timezone check) | tests/unit/lib/kudos/special-day.test.ts — **Shipped 2026-05-11**. 5 assertions: 23:59:59 ICT same day, 00:00:00 next day, 00:00:00 same day, empty list, multi-day match.
- [x] T016 [P] [Logic] Implement `special-day.ts` boundary check tại `Asia/Ho_Chi_Minh` via `Intl.DateTimeFormat` | src/lib/kudos/special-day.ts — **Shipped 2026-05-11**. Uses `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" })` to project both `instant` and SpecialDay row into the same calendar string before comparison.
- [x] T017 [P] [Test] **TDD red** — unit test cho Zod schemas (request body, query params, content/hashtag/image limits) | tests/unit/lib/validation/kudos.test.ts — **Shipped 2026-05-11**. 13 assertions covering `createKudoSchema` (5), `kudoFilterQuerySchema` (3), `kudoLikeParamsSchema` (1), `spotlightSearchSchema` (3), `cursorSchema` (2).
- [x] T018 [P] [Logic] Implement Zod schemas: `createKudoSchema`, `kudoFilterQuerySchema`, `kudoLikeParamsSchema`, `spotlightSearchSchema` (≤100 chars), `cursorSchema` | src/lib/validation/kudos.ts — **Shipped 2026-05-11**. Limits constants exposed via `KUDOS_VALIDATION_LIMITS`. Content max 2000, hashtags ≤5, images ≤5, spotlight query ≤100, feed `limit` 1–50 default 20, cursor decoded into `{ createdAt, id }`.
- [x] T019 [P] [Logic] Tạo `slugify.ts` cho hashtag slug nếu cần (kebab-case helper) | src/lib/kudos/slugify.ts — **Shipped 2026-05-11**. NFD-normalized diacritics strip + `đ→d` + non-alphanumeric collapse to `-` + trim. 5 unit assertions GREEN (Vietnamese, repeated punctuation, leading/trailing hyphens, empty-after-strip edge case).

### App layout + page skeleton + parallel slot defaults

- [x] T020 [UI] Tạo `app/sun-kudos/layout.tsx` accept `children` + `modal` slot per Next.js parallel routes; render `<>{children}{modal}</>` | app/sun-kudos/layout.tsx — **Shipped 2026-05-11**. 12-line wrapper rendering both slots. TDD: `tests/unit/app/sun-kudos/layout.test.tsx` asserts both slots mount.
- [x] T021 [UI] Tạo `app/sun-kudos/@modal/default.tsx` return `null` (default slot state khi không match intercepting route) | app/sun-kudos/@modal/default.tsx — **Shipped 2026-05-11**. Returns `null`. TDD: `tests/unit/app/sun-kudos/modal-default.test.tsx` asserts null return.
- [x] T022 [UI] Replace stub `app/sun-kudos/page.tsx` (hiện `<StubPage>`) với Server Component skeleton: `auth().catch(() => null)` gate → `redirect("/login")`; đọc filter từ `searchParams`; parallel `Promise.all([...])` fetch placeholder; render `<KudosBoardLayout>` | app/sun-kudos/page.tsx — **Shipped 2026-05-11**. Auth gate via try/catch + redirect; `Promise.all([getSaaLocale, getUnreadCount])` parallel; `searchParams` consumed for future filter use. TDD: `tests/unit/app/sun-kudos/page.test.tsx` 3 assertions (anon redirect, auth-throw redirect, authenticated renders board).
- [x] T023 [UI] Tạo `KudosBoardLayout.tsx` Server Component skeleton: Header slot (NavLinks + NotificationBell + ProfileButton + LanguageSelector + Logo), KV banner placeholder, A.1 input placeholder, Highlight section placeholder, Feed + Sidebar 2-column grid, Footer | src/components/sun-kudos/KudosBoardLayout.tsx — **Shipped 2026-05-11**. 6 named slot regions (`kudos-write-input-slot`, `kudos-filter-slot`, `kudos-highlight-slot`, `kudos-spotlight-slot`, `kudos-feed-slot`, `kudos-sidebar-slot`); KV background image (1440×512); landmark roles (`main`, `banner`, `contentinfo`); sr-only headings per region. TDD: `tests/unit/components/sun-kudos/KudosBoardLayout.test.tsx` 4 assertions (Header active link, single `<main>`, 4 named slots, Footer landmark).
- [x] T024 [UI] Mount `<Header locale={locale} isAuthenticated nav={<NavLinks currentPath="/sun-kudos" locale={locale} />} notification={<NotificationBell />} profileMenu={<ProfileButton />} />` (Header dùng slot props, không có `currentPath` prop trực tiếp) | src/components/sun-kudos/KudosBoardLayout.tsx — **Shipped 2026-05-11** (folded into T023). Header mounted với 4 slot props (`logoHref="/"`, `nav`, `notification`, `profileMenu`) + `isAuthenticated=true`; matches Awards page pattern.
- [x] T025 [Test] Run `npm run lint && tsc --noEmit && npm run test` — phải clean trước khi vào user-story phase | (no file) — **Shipped 2026-05-11** (final). Full Vitest suite **372/372 GREEN** (+9 Phase 2 UI tests, +22 Phase 2 Logic tests across formatKudoUrl/special-day/slugify/zod-kudos + next-config picsum assertion); `npm run lint` clean; `tsc --noEmit` clean. Visual compare with `frame.png` deferred — skeleton chỉ chứa empty placeholders, comparison sẽ meaningful sau khi Phase 5/7/8/9 đổ component vào slots.

**Checkpoint**: 9 Prisma model trong DB + seed data + shared lib + types + zod compile clean; `/sun-kudos` route render skeleton với auth gate + Header + Footer. User-story phases có thể chạy parallel.

**✅ Phase 2 COMPLETE (2026-05-11)** — 18 tasks shipped (T007 deferred to Phase 6 alongside T063 — see task entry). Migration `add-kudos-domain` (181 SQL lines) applied; seed populates 5 dept / 15 hashtags / 5 gifts / 2 special days / 50 kudos / 140 likes / 20 secret boxes idempotently. Shared lib (`src/lib/kudos/`, `src/lib/validation/`) covers types, URL formatting, ICT special-day boundary, slugify, full Zod validation surface. Suite 372/372 GREEN; lint + tsc clean. Ready for Phase 3+.

---

## Phase 3: User Story 7 — Truy cập có authentication (Priority: P1, security)

**Goal**: `/sun-kudos` chỉ accessible với session hợp lệ; mọi mutate API authorize server-side; admin route reject non-admin với 403 (admin endpoint OOS — Q-PLAN2 lock).

**Independent Test**: Anon visit `/sun-kudos` → redirect `/login`. Session expired mid-action → 401 → redirect.

- [x] T026 [P] [US7] [Test] Playwright `kudos-board-auth.spec.ts`: (a) anon visit `/sun-kudos` → redirect `/login` (US7 #1); (b) auth user visit → render full board (US7 #1 inverse); (c) session expired mid-action → API trả 401 → client redirect (US7 #3) | tests/e2e/kudos-board-auth.spec.ts — **Shipped 2026-05-13**. 4 specs (raw redirect response + browser nav + auth render w/ all 6 board slots & `aria-current` link + stale-cookie expiry re-redirect). Case (c) implemented at page level: session row deleted → next server request 30x to `/login`. Mutate-API 401 path lands in Phase 4 (T030 d).
- [x] T027 [US7] [Logic] Verify `app/sun-kudos/page.tsx` từ T022 — `auth().catch(() => null)` pattern handles cả Auth.js exception + null session; redirect `/login` đúng | app/sun-kudos/page.tsx — **Verified 2026-05-13**. Try/catch around `await auth()` with `logger.warn("auth.lookup-failed", …)` (A09) + `if (!session?.user) redirect("/login")` (A01). Unit suite `tests/unit/app/sun-kudos/page.test.tsx` already asserts anon-null redirect, auth-throw redirect, and authenticated render. No code change required.
- [x] T028 [US7] [Logic] Establish auth-gate pattern cho route handlers (template được consume by Phase 4/6/8): mỗi mutate handler call `auth()` đầu tiên, return 401 nếu null. Document pattern trong `.momorph/specs/MaZUn5xHXZ-sun-kudos-live-board/assets/auth-pattern.md` cho các phase sau tham khảo | .momorph/specs/MaZUn5xHXZ-sun-kudos-live-board/assets/auth-pattern.md — **Shipped 2026-05-13**. Canonical template (try/catch `auth()`, 401 generic body, log denial, session-derived id, 403 for wrong role, rate-limit after gate) + client-side 401 handling (rollback optimistic UI, generic toast, redirect with `next` param) + anti-patterns list.
- [x] T029 [US7] [Test] Verify T026 GREEN; lint + typecheck clean | (no file) — **Shipped 2026-05-13**. `npm run lint` clean; `tsc --noEmit` clean (`.next/dev` cache cleared first); Vitest **372/372 GREEN**; Playwright `kudos-board-auth.spec.ts` **4/4 GREEN** (14.2s).

**Checkpoint**: US7 GREEN; auth gate verified ở page + pattern established cho mutate API.

**✅ Phase 3 COMPLETE (2026-05-13)** — 4 tasks shipped. Auth gate now enforced at the `/sun-kudos` page layer with E2E + unit coverage; mutate-API auth-gate template documented for Phase 4/6/8 consumption.

---

## Phase 4: User Story 1 — Viết một Kudo mới (Priority: P1)

**Goal**: Click A.1 → mở dialog Viết Kudo (OOS); submit success → DB row + sender stats updated + new Kudo xuất hiện top feed via `router.refresh()` (Q-PLAN9).

**Independent Test**: Auth user click A.1 → dialog mở; gửi Kudo valid → DB persists + top of feed sau reload.

- [ ] T030 [P] [US1] [Test] Playwright `kudos-board-create.spec.ts`: (a) click A.1 → dialog mở (US1 #1); (b) submit trống → blocked (US1 #2); (c) submit valid → DB row + top feed sau `router.refresh()` (US1 #3); (d) anon click A.1 → redirect login (US1 #5) | tests/e2e/kudos-board-create.spec.ts
- [ ] T031 [P] [US1] [Test] **TDD red** — integration test cho `kudos-service.create(input, session)`: DB row + sender `kudosSentCount` +1 + receiver `kudosReceivedCount` +1 (recompute tier); Zod validate content length, hashtag ≤ 5, image ≤ 5 | tests/integration/api/kudos.test.ts
- [ ] T032 [US1] [Logic] Implement `kudos-repository.create({ senderUserId, receiverUserId, content, hashtagIds, imageUrls })` atomic via `prisma.$transaction`: insert Kudo + many-to-many KudoHashtag + KudoImage rows + increment sender `kudosSentCount` + increment receiver `kudosReceivedCount` | src/repositories/kudos-repository.ts
- [ ] T033 [US1] [Logic] Implement `kudos-service.create(input, session)`: Zod validate via `createKudoSchema`, dedup hashtags, delegate to repository | src/services/kudos-service.ts
- [ ] T034 [US1] [Logic] Implement `app/api/kudos/route.ts` POST handler (≤ 30 LOC): auth() → parse body → Zod validate → call `kudosService.create(input, session)` → return 201 + Kudo | app/api/kudos/route.ts
- [ ] T035 [US1] [UI] Tạo `KudosCreateInput.tsx` Client island: pencil icon left + single-line input với placeholder `Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?`; click → navigate `/sun-kudos/write` (stub route — Viết Kudo dialog `ihQ26W78P2` OOS); document Q-PLAN9: dialog success calls `router.refresh()` (no `onCreated` callback) | src/components/sun-kudos/KudosCreateInput.tsx
- [ ] T036 [US1] [UI] Mount `<KudosCreateInput>` trong `KudosBoardLayout` ở position A.1 | src/components/sun-kudos/KudosBoardLayout.tsx
- [ ] T037 [US1] [Test] Verify T030 + T031 GREEN | (no file)

**Checkpoint**: US1 GREEN; Kudo creation flow ships end-to-end với atomic transaction + counter updates.

---

## Phase 5: User Story 4 — Cuộn feed All Kudos và xem chi tiết (Priority: P1)

**Goal**: Feed All Kudos vertical, sort `createdAt DESC`, infinite scroll, hashtag chip click → filter URL sync, ảnh thumbnail → lightbox, hover avatar → profile preview.

**Independent Test**: 50 Kudo trong DB → trang đầu 20 Kudo; scroll cuối → load page kế; copy link → clipboard + toast; click hashtag → URL update + re-fetch.

- [ ] T038 [P] [US4] [Test] Playwright `kudos-board-feed.spec.ts`: (a) 20 Kudo trang đầu sort `createdAt DESC` (US4 #1); (b) scroll cuối → load page tiếp (US4 #2); (c) content > 5 dòng truncate + click → detail (US4 #3); (d) > 5 hashtag → 5 + `...` (US4 #4); (e) thumbnail click → lightbox (US4 #5); (f) empty feed message (US4 #7); (g) hashtag chip click → URL sync `?hashtag=X` (FR-012); (h) hover avatar ≥ 300ms → preview popup (FR-018) | tests/e2e/kudos-board-feed.spec.ts
- [ ] T039 [P] [US4] [Test] **TDD red** — integration `api/kudos.test.ts` GET: cursor pagination correctness (`(createdAt, id) < cursor`), filter combine AND, dept OR sender/receiver (Q-LB5) | tests/integration/api/kudos.test.ts
- [ ] T040 [US4] [Logic] Implement `kudos-repository.listFeed({ filter, cursor, limit })`: WHERE EXISTS subquery cho Hashtag; WHERE sender.departmentId = X OR receiver.departmentId = X (Q-LB5); AND giữa Hashtag + Phòng ban (Q-LB6); sort `createdAt DESC`; cursor `(createdAt, id)` pagination | src/repositories/kudos-repository.ts
- [ ] T041 [US4] [Logic] Implement `kudos-service.listFeed(filter, cursor)`: Zod validate filter, delegate to repo, encode/decode cursor | src/services/kudos-service.ts
- [ ] T042 [US4] [Logic] Implement `app/api/kudos/route.ts` GET handler: Zod validate query (`hashtag?`, `dept?`, `cursor?`, `limit=20`), call `kudosService.listFeed`, return `{ items, nextCursor }` | app/api/kudos/route.ts
- [ ] T043 [P] [US4] [Test] **TDD red** — unit test `KudosCard`: content > 5 dòng truncate, hashtag > 5 → 5 + `...`, time format `HH:mm - MM/DD/YYYY` | tests/unit/components/sun-kudos/KudosCard.test.tsx
- [ ] T044 [US4] [UI] Tạo `KudosCard.tsx` Server Component: sender/receiver info (`User.image` per Q-PLAN7), time, content (5-line clamp + `...`), gallery 5 thumbnail, hashtag chips (5 + `...`); KHÔNG mount ActionBar yet (Phase 6) | src/components/sun-kudos/KudosCard.tsx
- [ ] T045 [P] [US4] [Test] **TDD red** — unit test `useInfiniteScroll` hook (IntersectionObserver-based, fetch khi sentinel hiện) | tests/unit/hooks/useInfiniteScroll.test.ts
- [ ] T046 [US4] [UI] Implement `useInfiniteScroll.ts` hook | src/hooks/useInfiniteScroll.ts
- [ ] T047 [P] [US4] [Test] **TDD red** — unit test `useFilterParams` hook: bidirectional URL ↔ state, `setHashtag` / `setDepartment` / `clear` | tests/unit/hooks/useFilterParams.test.ts
- [ ] T048 [US4] [UI] Implement `useFilterParams.ts` hook (Phase 5 ownership per Q-PLAN9 review — Phase 7 reuses): on mount parse URL → state via `useSearchParams`; on set call `router.replace(...)` | src/hooks/useFilterParams.ts
- [ ] T049 [US4] [UI] Tạo `KudosFeed.tsx` Server Component initial render trang 1 + empty state `Hiện tại chưa có Kudos nào.` `role="status"` (FR-020) | src/components/sun-kudos/KudosFeed.tsx
- [ ] T050 [US4] [UI] Tạo `KudosFeedClient.tsx` Client island wrapper cho infinite scroll: consume `useInfiniteScroll`, fetch `/api/kudos?cursor=X&...`, append items | src/components/sun-kudos/KudosFeedClient.tsx
- [ ] T051 [P] [US4] [Test] **TDD red** — unit test `KudoImageLightbox`: Esc dismiss, backdrop click dismiss, focus-trap | tests/unit/components/sun-kudos/KudoImageLightbox.test.tsx
- [ ] T052 [US4] [UI] Tạo `KudoImageLightbox.tsx` Client island: modal overlay với `next/image` fullsize, Esc + backdrop dismiss, focus-trap | src/components/sun-kudos/KudoImageLightbox.tsx
- [ ] T053 [P] [US4] [Test] **TDD red** — unit test `ProfilePreviewPopup`: hover ≥ 300ms trigger, keyboard focus alt trigger, escape dismiss | tests/unit/components/sun-kudos/ProfilePreviewPopup.test.tsx
- [ ] T054 [US4] [UI] Tạo `ProfilePreviewPopup.tsx` Client island: `onMouseEnter` + `setTimeout(300)` / `onFocus`/`onBlur` keyboard alternative; render preview popup (linked Figma `721:5827`) | src/components/sun-kudos/ProfilePreviewPopup.tsx
- [ ] T055 [US4] [UI] Wire interactions trong `KudosCard`: hashtag chip click → `useFilterParams.setHashtag(tag)`; avatar/tên click → navigate `/profile/{userId}` (SCREENFLOW node `w4WUvsJ9KI` — surveyed in T005); thumbnail click → open `KudoImageLightbox`; hover avatar/tên → `ProfilePreviewPopup` | src/components/sun-kudos/KudosCard.tsx
- [ ] T056 [US4] [UI] Mount `<KudosFeed>` + `<KudosFeedClient>` trong `KudosBoardLayout` với initial server data | src/components/sun-kudos/KudosBoardLayout.tsx
- [ ] T057 [US4] [Test] Verify T038 + T039 + T043 + T045 + T047 + T051 + T053 GREEN | (no file)

**Checkpoint**: US4 GREEN; feed shows + infinite scroll + lightbox + profile preview + hashtag URL sync.

---

## Phase 6: User Story 3 — Thả tim và tích lũy hearts (Priority: P1)

**Goal**: Toggle tim per Kudo (idempotent, UNIQUE constraint); +1 normal day / +2 special day; sender disabled own Kudo; unlike rollback đúng số (`isSpecialDayLike` flag); Copy Link clipboard + toast.

**Independent Test**: 2 user A/B; A gửi Kudo; B click tim → counter +1 + A nhận +1; B unlike → counter -1 + A mất 1. Special day → +2 / -2.

- [ ] T058 [P] [US3] [Test] **TDD red** — unit `useOptimisticHeart` hook: toggle + optimistic count + rollback nếu API fail | tests/unit/hooks/useOptimisticHeart.test.ts
- [ ] T059 [P] [US3] [Test] **TDD red** — integration `api/kudos-like.test.ts`: POST normal day +1 hearts atomic; POST special day +2; DELETE rollback chính xác theo `isSpecialDayLike` flag; UNIQUE violation when like 2 lần; sender ≠ liker check 400 | tests/integration/api/kudos-like.test.ts
- [ ] T060 [P] [US3] [Test] Playwright `kudos-board-like.spec.ts`: (a) thả tim → counter + sender hearts (US3 #1); (b) toggle unlike (US3 #2); (c) sender disabled own Kudo (US3 #3); (d) like 2 lần block (US3 #4); (e) special day +2 (US3 #5); (f) unlike special day -2 (US3 #6); (g) Copy Link → clipboard + toast `Link copied — ready to share!` (US4 #6) | tests/e2e/kudos-board-like.spec.ts
- [ ] T061 [US3] [Logic] Implement `special-day-service.todayIsSpecial()`: query `special-day-repository.findActive(today)` với `Asia/Ho_Chi_Minh` timezone server-side `now()` (TR-004) | src/services/special-day-service.ts
- [ ] T062 [US3] [Logic] Implement `special-day-repository.findActive(date)`: WHERE `date = $1` (date-only column) | src/repositories/special-day-repository.ts
- [ ] T063 [US3] [Logic] Implement `kudo-like-repository.like(kudoId, userId, isSpecialDay)` atomic via `prisma.$transaction`: insert KudoLike (UNIQUE `(kudoId, userId)`) với `isSpecialDayLike` flag + increment Kudo.heartCount by 1 + increment sender.heartsReceivedCount by 1 or 2 | src/repositories/kudo-like-repository.ts
- [ ] T064 [US3] [Logic] Implement `kudo-like-repository.unlike(kudoId, userId)`: find KudoLike row, read `isSpecialDayLike`, compute rollback amount; `$transaction`: delete row + decrement Kudo.heartCount by 1 + decrement sender.heartsReceivedCount by 1 or 2 | src/repositories/kudo-like-repository.ts
- [ ] T065 [US3] [Logic] Implement `kudos-service.like(kudoId, session)`: sender ≠ liker check → 400; query `todayIsSpecial()`; delegate `kudo-like-repository.like(...)`; handle UNIQUE error → return 409 idempotent | src/services/kudos-service.ts
- [ ] T066 [US3] [Logic] Implement `kudos-service.unlike(kudoId, session)`: delegate `kudo-like-repository.unlike(...)` | src/services/kudos-service.ts
- [ ] T067 [US3] [Logic] Implement `app/api/kudos/[id]/like/route.ts` — POST handler (≤ 30 LOC: auth → Zod params → service.like) + DELETE handler (auth → service.unlike) | app/api/kudos/[id]/like/route.ts
- [ ] T068 [US3] [UI] Implement `useOptimisticHeart.ts` hook: optimistic toggle + count, rollback nếu fetch reject, toast error generic (TR-006 — no leak stack) | src/hooks/useOptimisticHeart.ts
- [ ] T069 [P] [US3] [Test] **TDD red** — unit `HeartButton`: `aria-pressed` reflects state, disabled khi sender = viewer, optimistic toggle, rollback on error | tests/unit/components/sun-kudos/HeartButton.test.tsx
- [ ] T070 [US3] [UI] Tạo `HeartButton.tsx` Client island: `aria-pressed`, disabled khi `kudo.senderUserId === session.userId` (FR-006), optimistic toggle via `useOptimisticHeart`, debounce click ≤ 500ms (mitigate spam) | src/components/sun-kudos/HeartButton.tsx
- [ ] T071 [P] [US3] [Test] **TDD red** — unit `CopyLinkButton`: clipboard write, toast success, fallback `document.execCommand` nếu clipboard API fail | tests/unit/components/sun-kudos/CopyLinkButton.test.tsx
- [ ] T072 [US3] [UI] Tạo `CopyLinkButton.tsx`: `navigator.clipboard.writeText(formatKudoUrl(id))` + `toast.success("Link copied — ready to share!")`; fallback `document.execCommand('copy')` | src/components/sun-kudos/CopyLinkButton.tsx
- [ ] T073 [US3] [UI] Tạo `KudosActionBar.tsx`: render `<HeartButton>` + `<CopyLinkButton>`; optional `viewDetailHref?: string` prop — khi provided render `<Link>Xem chi tiết</Link>` (cho B.4.4 Highlight); khi omitted không render (cho C.4 feed) | src/components/sun-kudos/KudosActionBar.tsx
- [ ] T074 [US3] [UI] Mount `<KudosActionBar />` (no `viewDetailHref`) trong `KudosCard` ở position C.4 | src/components/sun-kudos/KudosCard.tsx
- [ ] T075 [US3] [Test] Verify T058 + T059 + T060 + T069 + T071 GREEN | (no file)

**Checkpoint**: US3 GREEN; like/unlike atomic + special-day bonus + sender disabled + copy link working.

---

## Phase 7: User Story 2 — Xem và duyệt Highlight Kudos (Priority: P1)

**Goal**: Top 5 Kudo theo `heartCount DESC` dưới carousel; Prev/Next sync slide index (B.2.1/B.2.2 + B.5.1/B.5.2/B.5.3); 2 filter dropdown Hashtag + Phòng ban áp đồng thời lên Highlight + feed; click `Xem chi tiết` hoặc content → detail.

**Independent Test**: ≥5 Kudo → 5 card; Next/Prev navigate, extremes disabled; filter Hashtag → Highlight + feed filter, URL sync.

- [ ] T076 [P] [US2] [Test] Playwright `kudos-board-highlight.spec.ts`: (a) 5 card top theo heart (US2 #1); (b) Next click sync slide + pager `n/5` (US2 #2); (c) slide 5 → Next disabled (US2 #3); (d) slide 1 → Prev disabled (US2 #4); (e) hashtag filter applies cả Highlight + feed (US2 #5); (f) dept filter sender OR receiver (US2 #6); (g) empty state (US2 #7); (h) `Xem chi tiết` click → detail (US2 #8); (i) content click → detail (US2 #9) | tests/e2e/kudos-board-highlight.spec.ts
- [ ] T077 [P] [US2] [Logic] Implement `kudos-repository.listHighlight({ filter, limit=5 })`: ORDER BY `heartCount DESC` LIMIT 5; apply same filter combine logic (T040) | src/repositories/kudos-repository.ts
- [ ] T078 [P] [US2] [Logic] Implement `kudos-service.listHighlight(filter)` | src/services/kudos-service.ts
- [ ] T079 [P] [US2] [Logic] Implement `app/api/kudos/highlight/route.ts` GET (≤ 30 LOC) | app/api/kudos/highlight/route.ts
- [ ] T080 [P] [US2] [Test] **TDD red** — unit test cho `hashtag-service.list()` + `department-service.list()` (sort by name asc, deterministic) | tests/unit/services/hashtag-service.test.ts, tests/unit/services/department-service.test.ts
- [ ] T081 [P] [US2] [Logic] Implement `hashtag-repository.list()` + `hashtag-service.list()` + `app/api/hashtags/route.ts` GET | src/repositories/hashtag-repository.ts, src/services/hashtag-service.ts, app/api/hashtags/route.ts
- [ ] T082 [P] [US2] [Logic] Implement `department-repository.list()` + `department-service.list()` + `app/api/departments/route.ts` GET | src/repositories/department-repository.ts, src/services/department-service.ts, app/api/departments/route.ts
- [ ] T083 [P] [US2] [Test] **TDD red** — unit `HashtagFilter` + `DepartmentFilter`: dropdown open/close, select → calls `setHashtag`/`setDepartment`, `aria-pressed` khi active | tests/unit/components/sun-kudos/HashtagFilter.test.tsx, tests/unit/components/sun-kudos/DepartmentFilter.test.tsx
- [ ] T084 [P] [US2] [UI] Tạo `HashtagFilter.tsx` Client island: dropdown UI dùng linked Figma `1002:13013`, fetch `/api/hashtags`, select calls `useFilterParams.setHashtag(tag)`, `aria-pressed` reflects active | src/components/sun-kudos/HashtagFilter.tsx
- [ ] T085 [P] [US2] [UI] Tạo `DepartmentFilter.tsx` Client island: dropdown UI dùng linked Figma `721:5684`, fetch `/api/departments`, select calls `useFilterParams.setDepartment(dept)` | src/components/sun-kudos/DepartmentFilter.tsx
- [ ] T086 [US2] [UI] Tạo `HighlightCard.tsx` Server Component: card body (sender/receiver, time, content max 3 dòng + `...`, hashtag); embed `<KudosActionBar viewDetailHref={...}>` để render "Xem chi tiết" (B.4.4); click content → navigate Kudos detail | src/components/sun-kudos/HighlightCard.tsx
- [ ] T087 [P] [US2] [Test] **TDD red** — unit `HighlightCarousel`: slide state, prev/next disabled extremes, pager update | tests/unit/components/sun-kudos/HighlightCarousel.test.tsx
- [ ] T088 [US2] [UI] Tạo `HighlightCarousel.tsx` Client island: slide state với `useState`, prev/next disabled at slide 1 / slide 5, sync `B.2.1`/`B.2.2` arrows + `B.5.1`/`B.5.2`/`B.5.3` pager bar (cùng slide index); `aria-roledescription="carousel"`, `aria-label` cho prev/next | src/components/sun-kudos/HighlightCarousel.tsx
- [ ] T089 [US2] [UI] Tạo `HighlightSection.tsx` Server Component wrapper: fetch initial top 5 từ `kudosService.listHighlight`, render `<HighlightCarousel data={...} />` với hashtag + dept filter UI; empty state `Hiện tại chưa có Kudos nào.` (FR-020) | src/components/sun-kudos/HighlightSection.tsx
- [ ] T090 [US2] [UI] Mount `<HashtagFilter>` + `<DepartmentFilter>` + `<HighlightSection>` trong `KudosBoardLayout` ở position B; verify filter change re-runs Server fetch via `router.refresh()` + pagination reset về 1 | src/components/sun-kudos/KudosBoardLayout.tsx
- [ ] T091 [US2] [Test] Verify T076 + T080 + T083 + T087 GREEN | (no file)

**Checkpoint**: US2 GREEN; Highlight carousel + 2 filter dropdown + URL sync working; filter applies cả Highlight + feed.

---

## Phase 8: User Story 6 — Sidebar thống kê và Mở quà (Priority: P2)

**Goal**: Sidebar D hiển thị 5 stat cá nhân + nút Mở quà (disabled khi pending=0) + 2 leaderboard; independent scroll (TR-007).

**Independent Test**: 5 stat đúng từ DB; click Mở quà (pending>0) → dialog; pending=0 → disabled; leaderboard avatar click → profile; sidebar scroll độc lập feed.

- [ ] T092 [P] [US6] [Test] **TDD red** — unit `user-repository.getStats(userId)`: return `{ kudosReceivedCount, kudosSentCount, heartsReceivedCount, secretBoxesOpenedCount, secretBoxesPendingCount }` | tests/unit/repositories/user-repository.test.ts
- [ ] T093 [P] [US6] [Test] **TDD red** — integration `api/secret-boxes.test.ts`: ownership check 403 nếu `box.userId ≠ session.userId` (IDOR abuse case); pending=0 → 400 / 409 | tests/integration/api/secret-boxes.test.ts
- [ ] T094 [P] [US6] [Test] **TDD red** — integration `api/sunners.test.ts`: top-receivers ORDER BY `kudosReceivedCount DESC LIMIT 10`; recent-rankups orders by latest tier-up timestamp | tests/integration/api/sunners.test.ts
- [ ] T095 [P] [US6] [Test] Playwright `kudos-board-sidebar.spec.ts`: (a) 5 stat đúng (US6 #1); (b) pending>0 → click Mở quà → dialog (US6 #2); (c) pending=0 → disabled (US6 #2a); (d) empty leaderboard `Chưa có dữ liệu` (US6 #3); (e) avatar click → profile (US6 #5); (f) **TR-007 sidebar độc lập scroll feed**: long sidebar overflow → can scroll without affecting feed | tests/e2e/kudos-board-sidebar.spec.ts
- [ ] T096 [US6] [Logic] Extend `user-repository.ts` với `getStats(userId)` + counter updaters (`incrementSent`, `incrementReceived`, etc.) | src/repositories/user-repository.ts
- [ ] T097 [P] [US6] [Logic] Implement `user-service.getStats(session)` + `app/api/users/me/stats/route.ts` GET (auth → repo) | src/services/user-service.ts, app/api/users/me/stats/route.ts
- [ ] T098 [P] [US6] [Logic] Implement `secret-box-repository.findPendingByUser(userId)` + `openOne(boxId)` atomic transaction: update state `opened` + assign `giftId` + decrement `secretBoxesPendingCount` + increment `secretBoxesOpenedCount` | src/repositories/secret-box-repository.ts
- [ ] T099 [US6] [Logic] Implement `secret-box-service.openOne(session)`: find pending box for user → if none 409; otherwise call repo.openOne; ownership inherent (lookup by userId) | src/services/secret-box-service.ts
- [ ] T100 [US6] [Logic] Implement `app/api/secret-boxes/open/route.ts` POST handler | app/api/secret-boxes/open/route.ts
- [ ] T101 [P] [US6] [Logic] Implement `sunner-repository.topReceivers(limit=10)` + `recentRankups(limit=10)`: SQL queries on `User` ORDER BY counters with derived tier logic | src/repositories/sunner-repository.ts
- [ ] T102 [P] [US6] [Logic] Implement `sunner-service.topReceivers(limit)` + `recentRankups(limit)` + 2 route handlers | src/services/sunner-service.ts, app/api/sunners/top-receivers/route.ts, app/api/sunners/recent-rankups/route.ts
- [ ] T103 [P] [US6] [Test] **TDD red** — unit `KudosStats`: render 5 counters đúng | tests/unit/components/sun-kudos/KudosStats.test.tsx
- [ ] T104 [US6] [UI] Tạo `KudosStats.tsx` Server Component: 5 stat rows từ `userService.getStats(session)` (i18n keys `kudos.stats.received` etc.); `D.1.5` divider | src/components/sun-kudos/KudosStats.tsx
- [ ] T105 [P] [US6] [UI] Tạo `OpenGiftButton.tsx` Client island: disabled khi `pending === 0`; click → trigger Secret Box dialog open (linked Figma `1466:7676` / `m0zV-VstXX`); on success: optimistic decrement pending + increment opened | src/components/sun-kudos/OpenGiftButton.tsx
- [ ] T106 [P] [US6] [Test] **TDD red** — unit `RecentGiftsLeaderboard` + `RecentRankupsLeaderboard`: empty state, item render, click → profile | tests/unit/components/sun-kudos/RecentGiftsLeaderboard.test.tsx, tests/unit/components/sun-kudos/RecentRankupsLeaderboard.test.tsx
- [ ] T107 [P] [US6] [UI] Tạo `RecentGiftsLeaderboard.tsx` Server Component (Q-PLAN8 split): avatar + name + gift label (từ SecretBox.gift); click → navigate profile; empty `Chưa có dữ liệu` `role="status"` | src/components/sun-kudos/RecentGiftsLeaderboard.tsx
- [ ] T108 [P] [US6] [UI] Tạo `RecentRankupsLeaderboard.tsx` Server Component (Q-PLAN8 split): avatar + name + tier badge từ `kudosReceivedCount` thresholds 10/20/50 (FR-008); empty state same | src/components/sun-kudos/RecentRankupsLeaderboard.tsx
- [ ] T109 [US6] [UI] Tạo `KudosSidebar.tsx` Server Component: `sticky top-X self-start max-h-[calc(100vh-X)] overflow-y-auto` Tailwind utilities cho **TR-007 independent scroll**; compose `<KudosStats>` + `<OpenGiftButton>` + `<RecentGiftsLeaderboard>` + `<RecentRankupsLeaderboard>` | src/components/sun-kudos/KudosSidebar.tsx
- [ ] T110 [US6] [UI] Mount `<KudosSidebar>` trong `KudosBoardLayout` ở right column | src/components/sun-kudos/KudosBoardLayout.tsx
- [ ] T111 [US6] [Test] Verify T092 + T093 + T094 + T095 + T103 + T106 GREEN | (no file)

**Checkpoint**: US6 GREEN; sidebar 5 stats + 2 leaderboard + Mở quà + TR-007 independent scroll working.

---

## Phase 9: User Story 5 — Tìm Sunner trên Spotlight (Priority: P2)

**Goal**: B.7 word cloud tên Sunner đã nhận Kudo; tổng số Kudo live; hover → tooltip; click node → detail; pan/zoom toggle; search ≤ 100 chars highlight match.

**Independent Test**: ≥50 Kudo → word cloud; hover node → tooltip; click → Kudos detail; search 101 chars → 400; search rỗng + Enter → required block.

- [ ] T112 [P] [US5] [Test] Playwright `kudos-board-spotlight.spec.ts` (US5 #1..#8): word cloud render, `<total> KUDOS` header, loading/empty states, pan/zoom toggle, hover tooltip, click → detail, search 100 chars OK, 101 chars reject, empty + Enter required | tests/e2e/kudos-board-spotlight.spec.ts
- [ ] T113 [US5] [Logic] Implement `kudos-repository.spotlightSummary()`: return `{ total: count, recipients: [{ userId, name, latestKudoAt }] }` | src/repositories/kudos-repository.ts
- [ ] T114 [P] [US5] [Logic] Implement `kudos-service.spotlightSummary()` + `app/api/kudos/spotlight/route.ts` GET | src/services/kudos-service.ts, app/api/kudos/spotlight/route.ts
- [ ] T115 [P] [US5] [Logic] Implement `sunner-repository.search(query, limit=10)`: ILIKE prefix match on `User.name` | src/repositories/sunner-repository.ts
- [ ] T116 [P] [US5] [Logic] Implement `sunner-service.search(query)`: Zod validate ≤ 100 chars + non-empty; delegate to repo | src/services/sunner-service.ts
- [ ] T117 [P] [US5] [Logic] Implement `app/api/sunners/search/route.ts` GET với Zod query validate (`spotlightSearchSchema`) | app/api/sunners/search/route.ts
- [ ] T118 [P] [US5] [Test] **TDD red** — unit `Spotlight`: empty state khi `total===0`, interactive state với word cloud, loading state khi user-triggered re-fetch, pan/zoom toggle `aria-pressed` | tests/unit/components/sun-kudos/Spotlight.test.tsx
- [ ] T119 [US5] [UI] Tạo `Spotlight.tsx` Client island custom-canvas word cloud (Q-PLAN3 lock):
  - HTML `<canvas>` element + overlay DOM nodes cho tooltip + click handlers
  - Spiral-out placement algorithm with bounding-box collision check
  - Font-size weighted by per-recipient Kudo count (deterministic)
  - Limit visible nodes ≤ 100 initial; "show more" if recipient count > 100 (mitigation cho 388+ node risk)
  - Pan = drag canvas translate; Zoom = canvas scale transform
  - **Initial data SSR'd** via parallel `Promise.all` từ `page.tsx`; "loading" state chỉ khi user-triggered re-fetch
  - States: empty (`total===0`, FR-016), interactive (default), loading (re-fetch only)
  - Pan/Zoom button `aria-pressed` theo mode active (FR-017, default Pan)
  - `prefers-reduced-motion` → tắt transitions
  | src/components/sun-kudos/Spotlight.tsx
- [ ] T120 [US5] [UI] Tạo `SpotlightSearchBar.tsx` Client island: max 100 chars input + `aria-label="Tìm kiếm Sunner"`; debounce highlight matching nodes; Enter hoặc icon click submit; reject empty submit với required message; reject > 100 chars (FR-004) | src/components/sun-kudos/SpotlightSearchBar.tsx
- [ ] T121 [US5] [UI] Wire Spotlight node interactions: hover ≥ 300ms → tooltip `{name} • {latestKudoAt}`; click → navigate `/sun-kudos/{recipientLatestKudoId}` | src/components/sun-kudos/Spotlight.tsx
- [ ] T122 [US5] [UI] Mount `<Spotlight>` + `<SpotlightSearchBar>` trong `KudosBoardLayout` ở position B.7 với SSR'd initial data | src/components/sun-kudos/KudosBoardLayout.tsx
- [ ] T123 [US5] [Test] Verify T112 + T118 GREEN | (no file)

**Checkpoint**: US5 GREEN; Spotlight custom-canvas word cloud + search + pan/zoom working không add dep.

---

## Phase 10: Kudos Detail Route + Parallel Modal (cross-cutting — depends on US2/US3/US4)

**Goal**: Click feed/Highlight card → modal mở (giữ scroll position); deep-link `/sun-kudos/{id}` → full page; Copy Link share URL mở full page tab mới.

**Independent Test**: Click card → modal; reload `/sun-kudos/{id}` → full page; copy link → new tab → full page.

- [ ] T124 [Test] Playwright `kudos-detail.spec.ts`: (a) click feed card → modal mở + scroll giữ; (b) direct visit `/sun-kudos/{id}` → full page với Header/Footer; (c) Copy Link → mở tab mới → full page (FR-011) | tests/e2e/kudos-detail.spec.ts
- [ ] T125 [Logic] Implement `kudos-repository.getById(id)` (eager-load sender/receiver/hashtags/images) + `kudos-service.getById(id)` | src/repositories/kudos-repository.ts, src/services/kudos-service.ts
- [ ] T126 [Logic] Implement `app/api/kudos/[id]/route.ts` GET handler | app/api/kudos/[id]/route.ts
- [ ] T127 [UI] Tạo `KudosDetailContent.tsx` MVP minimal (Q-PLAN6 lock): sender/receiver header + time + full content (no truncate) + gallery via `<KudoImageLightbox>` + hashtag chips + `<KudosActionBar>` (heart + copy link, no `viewDetailHref`); **KHÔNG** có comments/reply section | src/components/sun-kudos/KudosDetailContent.tsx
- [ ] T128 [UI] Tạo `app/sun-kudos/[id]/page.tsx` Server Component full page: auth gate → fetch via `kudosService.getById` → render `<KudosBoardLayout>` slot replacement với `<KudosDetailContent>` | app/sun-kudos/[id]/page.tsx
- [ ] T129 [UI] Tạo `app/sun-kudos/@modal/(.)[id]/page.tsx` intercepting route: render `<KudosDetailModal>` wrapping `<KudosDetailContent>` (slot defaults + layout đã ship Phase 2) | app/sun-kudos/@modal/(.)[id]/page.tsx
- [ ] T130 [UI] Tạo `KudosDetailModal.tsx` Client island: overlay với close button, backdrop click dismiss, Esc keyboard, focus-trap | src/components/sun-kudos/KudosDetailModal.tsx
- [ ] T131 [Test] Verify T124 GREEN; test Copy Link URL paste vào new tab opens full page | (no file)

**Checkpoint**: Kudos detail + parallel modal working; Copy Link share opens full page.

---

## Phase 11: Polish & Cross-Cutting Concerns

Maps to plan **Phase 10/11/11b/12** combined.

### FR-021 Refresh button + TR-008 URL filter deep-link

- [ ] T132 [P] [Test] **TDD red** — unit `RefreshButton`: disabled-while-loading | tests/unit/components/sun-kudos/RefreshButton.test.tsx
- [ ] T133 [UI] Tạo `RefreshButton.tsx` Client island: `router.refresh()` + disabled-while-loading; vị trí gần `C.1_Header Giải thưởng` (Q-LB8 recommend) | src/components/sun-kudos/RefreshButton.tsx
- [ ] T134 [UI] Mount `<RefreshButton>` trong `KudosBoardLayout` ở C.1 area; verify giữ filter query string sau refresh | src/components/sun-kudos/KudosBoardLayout.tsx
- [ ] T135 [Test] Playwright `kudos-board-refresh.spec.ts`: (a) refresh re-fetch Highlight + feed + sidebar + Spotlight + giữ filter (FR-021); (b) deep-link `/sun-kudos?hashtag=Dedicated&dept=Marketing` → áp filter ngay từ Server Component (FR-005 + TR-008) | tests/e2e/kudos-board-refresh.spec.ts

### Q-PLAN1 Rate Limit (proxy.ts token-bucket)

- [ ] T136 [Test] **TDD red** — integration `tests/integration/proxy/kudos-rate-limit.test.ts`: 6 req trong 60s POST /api/kudos same IP → req #6 returns 429 + `Retry-After`; 31 req like → 429; 11 req secret-boxes/open → 429 | tests/integration/proxy/kudos-rate-limit.test.ts
- [ ] T137 [Logic] Extend `proxy.ts` với `KUDOS_RATE_LIMITS` constant: `[{ pathPrefix: "/api/kudos", method: "POST", max: 5, window: 60_000 }, { pathPrefix: "/api/kudos/", suffix: "/like", max: 30, window: 60_000 }, { pathPrefix: "/api/secret-boxes/open", method: "POST", max: 10, window: 60_000 }]`; reuse `isRateLimited(key, now)` helper; key format `${ip}:${pathBucket}` | proxy.ts
- [ ] T138 [Test] Add `__resetRateLimitForTests()` calls trong test `beforeEach` (export đã có) | tests/integration/proxy/kudos-rate-limit.test.ts

### Q-PLAN5 Counter Recompute Script

- [ ] T139 [Test] **TDD red** — integration `tests/integration/scripts/recompute-kudos-counters.test.ts`: seed DB với intentional drift (mutate counter to wrong value), run script, assert all 5 counters corrected per User | tests/integration/scripts/recompute-kudos-counters.test.ts
- [ ] T140 [Logic] Ship `scripts/recompute-kudos-counters.ts`: recompute 5 counters per User từ ground truth (`Kudo` for sent/received, sum `KudoLike` weighted by `isSpecialDayLike` for hearts, `SecretBox` count by state); `--dry-run` flag prints diff without writing; log per-User drift count + total via `src/lib/logger.ts` | scripts/recompute-kudos-counters.ts
- [ ] T141 [Logic] Add `db:recompute-kudos-counters` script to `package.json`: `"db:recompute-kudos-counters": "tsx scripts/recompute-kudos-counters.ts"` | package.json

### i18n parity

- [ ] T142 [P] [Logic] Extend `src/lib/i18n/catalogs/vi-VN.json` với `kudos.*` namespace: board title, A.1 placeholder, filter labels, empty states (`Hiện tại chưa có Kudos nào.`, `Chưa có dữ liệu`), toast strings (`Link copied — ready to share!`), sidebar stat labels, leaderboard headers, button labels (Mở quà, Refresh, Xem chi tiết), search placeholder, pan/zoom labels | src/lib/i18n/catalogs/vi-VN.json
- [ ] T143 [P] [Logic] Extend `src/lib/i18n/catalogs/en-US.json` đồng bộ vi-VN — same keys (English copy reviewed with PO before commit) | src/lib/i18n/catalogs/en-US.json
- [ ] T144 [Test] Run `tests/unit/lib/i18n/parity.test.ts` — must stay GREEN after both catalogs updated | tests/unit/lib/i18n/parity.test.ts (read-only verify)

### A11y full sweep

- [ ] T145 [UI] A11y sweep: heart `aria-pressed`, carousel `aria-roledescription="carousel"` + Prev/Next `aria-label`, filter chips `aria-pressed`, empty states `role="status"`, toast `role="status" aria-live="polite"`, search `aria-label="Tìm kiếm Sunner"`, hover preview focus-trigger alternative, touch targets ≥ 44×44 cho heart/copy link/Mở quà/Prev/Next/filter chip/avatar/Xem chi tiết | all sun-kudos components

### Error states + loading + motion

- [ ] T146 [UI] Error states cho mọi API call: generic toast, **KHÔNG leak stack trace** (TR-006 + Principle IV A09); request ID correlation via proxy.ts x-request-id | all sun-kudos services + components
- [ ] T147 [UI] Loading states: skeleton cho feed initial load (fallback nếu SSR fail), spinner cho Spotlight re-fetch (FR-016 loading state) | src/components/sun-kudos/KudosFeed.tsx, src/components/sun-kudos/Spotlight.tsx
- [ ] T148 [UI] `prefers-reduced-motion` respect: tắt carousel slide transition, heart toggle micro-interaction, Spotlight pan/zoom transition | src/components/sun-kudos/HighlightCarousel.tsx, HeartButton.tsx, Spotlight.tsx

### Performance + final verification

- [ ] T149 [Test] Performance check: Lighthouse FCP ≤ 2.5s trên 3G fast (TR-002); verify SSR parallel `Promise.all` fetches initial paint together (no 6 spinner độc lập) | (manual + scripts/lighthouse-login.mjs pattern)
- [ ] T150 [Test] Cross-browser smoke: chromium primary; full `npm run test:e2e` clean | (CI)
- [ ] T151 [Test] Final suite: `source ~/.nvm/nvm.sh && nvm use 20.20.2 && npm run lint && tsc --noEmit && npm run test && npm run test:e2e` — all clean | (CI)
- [ ] T152 [UI] Manual visual compare: screenshot live `/sun-kudos` → `implementation.png`; compare side-by-side với `frame.png` (T001) trong assets folder per memory rule | .momorph/specs/MaZUn5xHXZ-sun-kudos-live-board/assets/implementation.png

**Checkpoint**: All FR-001..FR-021 + TR-001..TR-008 GREEN; Q-PLAN1/5 hardening shipped; i18n parity; a11y compliant; performance budget met.

---

## Dependency Graph

```
Phase 1 (Setup) ──────────────────┐
                                  ↓
Phase 2 (Foundation) ─────────────┤
                                  ↓
Phase 3 (US7 Auth Gate) ──────────┤
                                  ↓
       ┌──────────┬───────────────┴──────┬──────────┐
       ↓          ↓                      ↓          ↓
   Phase 4    Phase 5                Phase 8    Phase 9
   (US1)      (US4 Feed)             (US6)      (US5)
                ↓
            Phase 6 (US3 Heart)
              ↑ needs Phase 5 (KudosCard exists)
                ↓
            Phase 7 (US2 Highlight)
              ↑ needs Phase 6 (KudosActionBar exists)
                ↓
            Phase 10 (Detail + Parallel Modal)
              ↑ needs Phase 5/6/7 (cards + actions)
                ↓
            Phase 11 (Polish + Cross-cutting)
```

**Inter-phase parallelism after Phase 3**:

- Phase 4 (US1) + Phase 8 (US6) + Phase 9 (US5) — KHÔNG share files, có thể chạy song song.
- Phase 5 (US4) blocks Phase 6 (US3 — heart sits on card) → Phase 7 (US2 — uses ActionBar).
- Phase 10 + Phase 11 follow Phase 7 completion.

---

## Parallel Execution Examples

**Phase 2 (Foundation)** — sau khi T008+T009+T010 xong (DB ready):
```
Parallel: T012, T013, T014, T015, T016, T017, T018, T019  (different files in src/lib/kudos/ + src/lib/validation/)
Parallel: T020, T021                                         (route files different)
```

**Phase 5 (US4)** — sau khi T040+T041+T042 xong (API exists):
```
Parallel: T043+T044, T045+T046, T047+T048, T051+T052, T053+T054
  (KudosCard, useInfiniteScroll, useFilterParams, KudoImageLightbox, ProfilePreviewPopup — different files)
```

**Phase 7 (US2)** — sau khi T077+T078+T079 xong:
```
Parallel: T080-T082 (services + endpoints), T083-T085 (filter UI), T087+T088 (carousel)
```

**Phase 8 (US6)** — sau khi T096 xong (user-repository extended):
```
Parallel: T097, T098-T100, T101-T102            (services + endpoints)
Parallel: T103-T108                              (UI components)
```

**Phase 11 (Polish)**:
```
Parallel: T142 + T143                            (i18n vi-VN + en-US different files)
Parallel: T132, T136, T139                       (test stubs in different files)
```

---

## Independent Test Criteria

| Story | Criteria |
|---|---|
| **US7** | Anon → /sun-kudos → redirect /login. Session expired mid-action → 401 → redirect. |
| **US1** | Auth user click A.1 → dialog mở. Submit Kudo valid → DB row + top feed after refresh. |
| **US4** | 50 Kudo trong DB → trang đầu 20 + infinite scroll. Hashtag chip click → URL sync. Thumbnail → lightbox. Hover avatar → preview popup. |
| **US3** | User B thả tim Kudo của A → counter +1 + A nhận +1 tim. Toggle unlike → -1/-1. Sender disabled own. Special day → +2/-2. Copy link → clipboard + toast. |
| **US2** | ≥5 Kudo → 5 card top by heart. Next/Prev sync slide + disabled extremes. Filter Hashtag applies cả Highlight + feed. Filter combine AND. |
| **US6** | 5 stat đúng từ DB. Pending>0 → Mở quà dialog. Pending=0 → disabled. Empty leaderboard message. **Sidebar scroll độc lập feed (TR-007)**. |
| **US5** | ≥50 Kudo → word cloud. Hover → tooltip. Click node → detail. Pan/Zoom toggle. Search 101 chars → reject. |

---

## Suggested MVP Scope

**MVP = Phase 1 + 2 + 3 + 4 (US7 + US1)** — minimum viable demo:
- Auth gate working
- Skeleton page render
- User có thể gửi Kudo qua dialog (Viết Kudo dialog là OOS — KudosBoard chỉ trigger + receive new Kudo)
- Refresh page → thấy Kudo mới

**Tier 2 (P1 complete)**: + Phase 5 (US4 feed) + Phase 6 (US3 heart) + Phase 7 (US2 highlight) + Phase 10 (detail route) → fully functional Live Board.

**Tier 3 (P2)**: + Phase 8 (US6 sidebar) + Phase 9 (US5 Spotlight) → complete spec coverage.

**Tier 4 (Polish)**: + Phase 11 → production-ready (rate limit, recompute hatch, i18n parity, a11y, performance).

---

## Implementation Strategy

1. **Sequential phases 1-3** (Setup → Foundation → US7) — no parallelism, foundation must be solid.
2. **Phase 3 checkpoint** — auth gate verified, page renders skeleton, can start delivering value.
3. **MVP cut at Phase 4** — ship US1 (write Kudo) standalone for first user feedback.
4. **P1 push (Phases 5/6/7/10)** — must complete together; cards + hearts + highlights + detail interlock.
5. **P2 push (Phases 8/9)** — parallel after P1 stable; sidebar + Spotlight independent of each other.
6. **Polish phase 11** — last, includes rate limit + recompute escape hatch + i18n + a11y; required before merge to main.

**Branch strategy**: each phase = 1 PR. Phase 11 may split into 2 PRs (Polish + Hardening) nếu cần keep diff ≤ 600 LOC per plan note.

**Test discipline (Constitution V)**:
- Failing tests trước implementation cho FR-001..FR-021 + TR-003/TR-004/TR-006/TR-007/TR-008.
- Atomic transaction code paths phải hit **100% coverage** (likes, unlikes, create-Kudo, secret-box-open).
- E2E covers all P1 stories + 2 P2 stories minimum.

---

## Notes

- **Memory rules** (per `.claude/projects/.../memory/`):
  - Prefix `npm` commands với `source ~/.nvm/nvm.sh && nvm use 20.20.2` (Node 20 required cho Vitest/Next 16).
  - Visual compare assets (`frame.png`, `implementation.png`) → `.momorph/specs/MaZUn5xHXZ-sun-kudos-live-board/assets/`, KHÔNG `.playwright-mcp/`.
  - `prisma migrate reset` → ask consent tersely, đừng re-explain rationale.
  - Add new external image hosts → `next.config.ts` `images.remotePatterns` trước khi `next/image` consume URL.
- **Reference**: shipped Awards tasks (`zFYDgyj_pD-he-thong-giai/tasks.md`) cho pattern; Homepage Phase 13 cho proxy.ts security header reuse.
- **Q-PLAN4 parked**: Kudo image upload solution (Cloudinary/UploadThing/S3) phụ thuộc dialog `ihQ26W78P2` survey — KudosBoard chỉ display, no block.
