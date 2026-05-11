# SAA 2025 — Screen Flow

**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Last updated**: 2026-05-11
**Status**: Partial — Login + Dropdown — Language + Homepage SAA + Dropdown — Profile (user)
+ Countdown - Prelaunch page + Hệ thống giải / Awards Information + **Sun\* Kudos — Live
Board** surveyed in depth. Other entries are inferred from cross-references and MUST be
re-confirmed when each owning screen is surveyed with `/momorph.screenflow`. The
authoritative screen-flow document is `.momorph/SCREENFLOW.md`; this file is the lightweight
index.

---

## Conventions

- **Routes vs overlays**: Routes have a URL and a screenId. Overlays (dropdowns, modals,
  toasts) are rendered on top of a route and do not own a URL.
- **Navigation Graph rule** (Constitution Principle III — Evidence-Based Navigation): every
  `href`, `router.push`, post-submit redirect, and error redirect in the codebase MUST be
  sourced from the **Navigation Graph** below. If a target appears in design but is missing
  from this graph, stop and update this file before writing code.
- **Edge confidence**:
  - `(confirmed)` — observed directly on the source screen during the screenflow survey.
  - `(inferred)` — derived from a sibling screen's design or from product convention; MUST be
    re-validated when the source screen is surveyed.

---

## Screen Index

| screenId | Name | Route (proposed) | Surveyed | Notes |
|----------|------|------------------|----------|-------|
| `GzbNeVGJHz` | Login | `/login` | ✅ 2026-05-06 | Project entry route. Google-OAuth-only auth. |
| `i87tDx10uM` | Homepage SAA | `/` (or `/home`) | ⚠ pending | Post-auth landing; referenced as destination by Login. |
| `hUyaaugye2` | Dropdown — Language | (overlay on Login + others) | ⚠ pending | Overlay component, no route. |
| `z4sCl3_Qtk` | Dropdown — Profile (user) | (overlay on authenticated routes) | ⚠ pending | Contains "Logout" → Login (inferred). |
| `54rekaCHG1` | Dropdown — Profile (admin) | (overlay on admin routes) | ⚠ pending | Contains "Logout" → Login (inferred). |
| `T3e_iS9PCL` | Error page — 403 | `/403` (proposed) | ⚠ pending | "Back" → Login (inferred on auth failure). |
| `8HGlvYGJWq` | [iOS] Login | (mobile variant) | ⚠ pending | Decide responsive single-route vs. separate route. |
| `8PJQswPZmU` | Countdown - Prelaunch page | `/` (pre-event variant) or `/coming-soon` — TBD | ✅ 2026-05-08 | Standalone full-bleed countdown (no header/footer/nav). Reuses shipped `Countdown` + SAA root-art BG. No outgoing edges; logical handoff to Homepage SAA when countdown elapses. See `.momorph/SCREENFLOW.md` "Screen Details — Countdown - Prelaunch page". Open: Q-CP1 routing, Q-CP2 auth gating, Q-CP3 granularity, Q-CP4 i18n. |
| `zFYDgyj_pD` | Hệ thống giải / Awards Information | `/awards` (locked 2026-05-09 per Q-HTG1) | ✅ 2026-05-09 | **Shipped 2026-05-10.** Read-only catalog of all six SAA 2025 awards. Two-column wide-viewport layout: scroll-tracking `AwardsNav` left + vertical `D.1`–`D.6` `AwardDetailCard`s right (scroll-only fallback on narrow viewports per Q-HTG4). Reuses Homepage `Header`, `Footer`, `KudosBlock`. Anchors `#<award-slug>` deep-links from Homepage award cards; unknown slugs fall back to `top-talent`. Phases 1–6 of [specs/zFYDgyj_pD-he-thong-giai/tasks.md](specs/zFYDgyj_pD-he-thong-giai/tasks.md) complete — Vitest 261/261 + Playwright awards spec 19/19 GREEN. |
| `MaZUn5xHXZ` | Sun\* Kudos — Live Board | **`/sun-kudos`** (locked 2026-05-11 per Q-LB1) | ✅ 2026-05-11 (surveyed + reviewed + decisions locked) | Trang hub Kudos: ô nhập `A.1` mở dialog viết Kudo, carousel Highlight top-5 theo tim, Spotlight word cloud, feed All Kudos (infinite scroll, filter hashtag + phòng ban — AND combine, phòng ban scope = sender OR receiver), sidebar thống kê + Mở quà + 2 leaderboard. **MVP không realtime** — feed update qua reload / đổi filter / nút Refresh (FR-021). Tim: 1 user / Kudo, sender không thả tim mình, mỗi like = +1 tim (special day: +2 tim) vào `hearts_received_count` của sender. Sao tier (0..3) tách biệt — tính từ `kudos_received_count` (10/20/50). Kudos detail = `/sun-kudos/{id}` + parallel modal. Spec **Ready for `momorph.plan`**: `specs/MaZUn5xHXZ-sun-kudos-live-board/spec.md`. Resolved: Q-LB1, Q-LB2, Q-LB4, Q-LB5, Q-LB6, Q-LB7. Deferred: Q-LB3 (mobile). Parked: Q-LB8 (Refresh button position). |

---

## Navigation Graph

### Login Screen (`GzbNeVGJHz`, route `/login`)

**Outgoing edges** (sourced from this screen's design + test cases):

```
Login (/login)
  ├─> "LOGIN With Google" button (B.3 / 662:14425)
  │     ├─> External: Google OAuth consent (provider redirect)
  │     └─> On success: Homepage SAA (i87tDx10uM)        (confirmed)
  │
  └─> Language selector "VN ▼" (A.2 / I662:14391;186:1601)
        └─> Opens overlay: Dropdown — Language (hUyaaugye2)   (confirmed)
              (selecting a language updates locale in place; does NOT navigate)
```

**Incoming edges** (Login is the project's entry route):

```
  App entry (unauthenticated, any protected route hit)  →  Login        (confirmed)
  Sign-out from authenticated pages                     →  Login        (confirmed by FR-014)
  Dropdown — Profile user (z4sCl3_Qtk) → "Logout"       →  Login        (inferred)
  Dropdown — Profile admin (54rekaCHG1) → "Logout"      →  Login        (inferred)
  Error page — 403 (T3e_iS9PCL) → "Back"                →  Login        (inferred)
```

**Logic-triggered navigation** (FR-002 / US2):

```
  Authenticated visitor lands on Login (/login)         →  Homepage SAA (i87tDx10uM)
        [server-side redirect; do NOT render Login markup first]
```

---

### Sun\* Kudos — Live Board (`MaZUn5xHXZ`, route `/sun-kudos` — locked 2026-05-11)

**Outgoing edges** (sourced from this screen's design + test cases — 2026-05-11):

```
Sun* Kudos — Live Board (/sun-kudos)
  ├─> A.1 Ô nhập / Ghi nhận (2940:13449)
  │     └─> Viết Kudo dialog (ihQ26W78P2)                      (confirmed by interaction)
  │
  ├─> B.1.1 ButtonHashtag (2940:13459) → overlay
  │     └─> Hashtag dropdown (1002:13013)                       (in-page filter, no navigate)
  ├─> B.1.2 Button Phòng ban (2940:13460) → overlay
  │     └─> Department dropdown (721:5684)                      (in-page filter, no navigate)
  │
  ├─> B.3 Highlight card / B.4.2 Content / C.3.5 Content / "Xem chi tiết" / B.7 Spotlight node
  │     └─> Kudos detail /sun-kudos/{id} + parallel modal       (confirmed by TC 8c0d1781; Q-LB4 resolved)
  │           - From feed/Highlight: intercepting route → modal (keep scroll)
  │           - From deep-link / Copy Link share: full page
  │
  ├─> Avatar / tên người gửi or người nhận (B.3.1/B.3.2/B.3.5/B.3.6/C.3.1/C.3.3, D.3.x)
  │     └─> Profile của Sunner đó (w4WUvsJ9KI)                  (confirmed by TC 2cd77a0c, 630f42a3, 6b1e2359)
  │
  ├─> Hashtag chip (B.4.3 / C.3.7 / D.4)
  │     └─> Apply Hashtag filter in-page (AND combine với Phòng ban filter)   (confirmed by TC d01729d4 — no navigate)
  │
  ├─> C.4.2 Copy Link button
  │     └─> Copies URL `https://.../sun-kudos/{id}` + toast (no navigate)  (confirmed by TC 0adfd7ce)
  │
  ├─> D.1.8 Button mở quà (2940:13497)
  │     └─> Open Secret Box dialog (1466:7676 / m0zV-VstXX / J3-4YFIpMM)  (confirmed by TC 43b54c29; disabled when secret_boxes_pending_count===0)
  │
  └─> Header (shared instance 2940:13433)
        ├─> Language → overlay Dropdown — Language (hUyaaugye2)         (inferred — reused)
        ├─> Notification → Tất cả thông báo (6-1LRz3vqr)                (inferred)
        └─> Avatar → overlay Dropdown — Profile user (z4sCl3_Qtk)       (inferred)
```

**Incoming edges**:

```
  Homepage SAA → "Sun* Kudos" block                                     (confirmed via Homepage outgoing)
  Awards page → D2.1 "Chi tiết" button                                  (confirmed via Awards spec)
  Any authenticated page with shared header → nav "Kudos"               (inferred)
  Deep link /sun-kudos after sign-in redirect                           (confirmed Q-LB1)
```

**Refresh / data-update behavior** (Q-LB2 resolved — manual refresh only, no realtime):

```
  Reload trang  /  đổi filter Hashtag|Phòng ban  /  click Refresh button (FR-021)
        →  refetch /api/kudos/highlight + /api/kudos (page 1) + /api/users/me/stats
           + leaderboards + /api/kudos/spotlight
        →  filter query string giữ nguyên trên URL

  User tự gửi Kudo (US1)
        →  optimistic prepend Kudo mới vào feed của CHÍNH user đó (rollback nếu API fail)
        →  Kudo của user khác chỉ thấy sau khi refresh
```

---

## Open Items

- ⚠ Survey **Homepage SAA** (`i87tDx10uM`) to populate its outgoing edges (admin/user role
  branches, profile dropdown, etc.).
- ⚠ Survey **Dropdown — Language** (`hUyaaugye2`) to enumerate the available languages and
  confirm the persistence mechanism (cookie vs. user attribute).
- ⚠ Survey both **Profile dropdowns** (`z4sCl3_Qtk`, `54rekaCHG1`) to confirm "Logout" → Login
  edges and any other actions (Account settings, Switch role, etc.).
- ⚠ Survey **Error 403** (`T3e_iS9PCL`) to confirm the "Back" target.
- ⚠ Decide whether the mobile variant `[iOS] Login` (`8HGlvYGJWq`) is a separate route or a
  responsive breakpoint of `/login`. Default: responsive single route — escalate only if the
  iOS variant introduces interactions absent from the web frame.
- ⚠ Resolve **Q-CP1..Q-CP4** for **Countdown - Prelaunch page** (`8PJQswPZmU`) before queuing
  it for `/momorph.specify`: routing strategy (inline `/` variant vs. dedicated `/coming-soon`
  path), anonymous-vs-authenticated gating, minute-vs-second granularity, and i18n behavior of
  the `DAYS` / `HOURS` / `MINUTES` Latin labels.
- ✅ **Q-HTG1..Q-HTG5 resolved (2026-05-09)** for **Hệ thống giải** (`zFYDgyj_pD`): route =
  `/awards`, active-section = `IntersectionObserver`, data source = static catalog,
  mobile = scroll-only fallback at MVP, scroll-margin-top resolved at implementation
  time. Spec is now **Ready for `momorph.plan`**. See spec.md § Resolved Decisions.
- ✅ **Q-LB1..Q-LB7 resolved (2026-05-11)** for **Sun\* Kudos — Live Board** (`MaZUn5xHXZ`):
  - Q-LB1: route = **`/sun-kudos`** (already referenced by Homepage + Awards + prelaunch
    whitelist).
  - Q-LB2: **No realtime / polling for MVP** — manual refresh only via reload, filter change,
    or explicit Refresh button (FR-021). Re-open if SC-005 stale-interval metric breaches.
  - Q-LB3: **Deferred** — mobile concerns not in MVP scope; iOS frame `8HGlvYGJWq` not
    surveyed yet.
  - Q-LB4: Kudos detail = **`/sun-kudos/{id}` + parallel modal** (Next.js intercepting
    routes: modal from feed, full page from deep-link).
  - Q-LB5: Phòng ban filter scope = **cả sender lẫn receiver** (`sender_dept_id = X OR
    receiver_dept_id = X`).
  - Q-LB6: Hashtag + Phòng ban combine = **AND** (intersection).
  - Q-LB7: **hearts ≠ stars** — each like = +1/+2 hearts for sender; stars = tier from
    `kudos_received_count` (10/20/50). Inventory's "+1 star per like" was a transcription
    error; B.3.2 tooltip + TC `31936b72` "+2 hearts" are authoritative.
  - Q-LB8 (open, implementation-level): exact position of Refresh button — parked to phase
    implement; spec recommends near `C.1_Header Giải thưởng`.

- ⚠ **Kudos Live Board outgoing nav — metadata survey (2026-05-11, task T005)**.
  Four outgoing targets from `MaZUn5xHXZ` Live Board had no SCREENFLOW entry. Metadata
  surveyed via MoMorph MCP `get_frame` to confirm existence + canonical screenId.
  Full UX surveys are NOT done here — each target gets its own `/momorph.screenflow` run
  when its dedicated spec is queued. Recording metadata so Constitution III evidence-based
  navigation can cite a surveyed source:

  | screenId | Figma name | Proposed route | Triggered from | Survey status |
  |---|---|---|---|---|
  | `w4WUvsJ9KI` | "Profile người khác" | `/profile/[userId]` | Avatar/name click on Kudo card; leaderboard avatar; Spotlight node | Metadata-only 2026-05-11. Full survey TBD before Phase 5 (Feed) implements avatar click. |
  | `6-1LRz3vqr` | "Tất cả thông báo" | `/notifications` (proposed) — full route vs panel TBD | Header notification bell | Metadata-only 2026-05-11. Already mentioned in Homepage SAA outgoing. Full survey TBD when notification page is queued. |
  | `J3-4YFIpMM` | "Open secret box- chưa mở " (revision `c1504a9e`, **has `Spec Created` tag**) | (dialog, no route — overlay) | `D.1.8_Button mở quà` click when `secret_boxes_pending_count > 0` | Metadata-only 2026-05-11. **J3-4YFIpMM is canonical** (has spec tag); `m0zV-VstXX` is a no-revision duplicate. Full survey TBD before Phase 3 implements `OpenGiftButton` mutation flow. |
  | `onDIohs2bS` | "View Kudo" | `/sun-kudos/[id]` (locked Q-LB4) + parallel modal | C.3 / B.3 card content click; "Xem chi tiết" Highlight action; Spotlight node click | Metadata-only 2026-05-11. **Plan Q-PLAN6 lock**: MVP fallback uses minimal layout (sender/receiver + content + gallery + hashtag + ActionBar — no comments) — full Figma survey deferred unless additional element discovered. Re-open Q-PLAN6 if survey reveals comments / replies. |

  Implementer of Phase 4/5/9 MUST use the matching screenId from this table for
  Constitution III evidence-based navigation citations.
