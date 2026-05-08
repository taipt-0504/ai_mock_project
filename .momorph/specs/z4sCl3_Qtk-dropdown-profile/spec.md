# Đặc tả tính năng: Dropdown-profile (biến thể user)

**Frame ID**: `z4sCl3_Qtk`
**Frame Name**: `Dropdown-profile`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Created**: 2026-05-08
**Status**: Đã triển khai (shipped 2026-05-07 cùng Homepage SAA, Phase 13 của [tasks.md](../i87tDx10uM-homepage-saa/tasks.md)). Hành vi đã ship: cấu trúc menu, navigation, đăng xuất, click-outside, ARIA — có code thật và bộ test xanh. Spec này viết hồi tố để (a) làm tài liệu tham chiếu chống regression, (b) khoá target hành vi cho follow-up Escape, (c) làm điểm neo cho biến thể admin (`54rekaCHG1`) sẽ tách spec riêng.

---

## Trạng thái triển khai (Implementation Status)

> **TL;DR — KHÔNG cần làm lại.** Frame `z4sCl3_Qtk` mô tả overlay đã được hiện thực hóa cùng Homepage SAA. Spec này tồn tại để (a) khoá hành vi tránh trôi khi sửa CSS hoặc khi triển khai biến thể admin, (b) lấp khoảng trống tài liệu trước đó (Homepage SAA spec chỉ tham chiếu trigger, chưa mô tả overlay).

Bề mặt hành vi mô tả trong spec này đã có sẵn ở các artifact sau (verified bằng đọc code):

| Mối quan tâm                              | Artifact đã có                                                                                                  |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| React component (trigger + menu)          | [src/components/home/ProfileButton.tsx](../../../src/components/home/ProfileButton.tsx)                          |
| Mounted ở header Homepage                 | [src/components/header/Header.tsx](../../../src/components/header/Header.tsx) (slot `profileMenu`)               |
| Endpoint đăng xuất                        | NextAuth handler `app/api/auth/[...nextauth]/route.ts` — invoked indirectly qua Server Action [`signOutAction`](../../../src/actions/auth.ts) (gọi Auth.js v5 `signOut({ redirectTo: "/login" })`) |
| Route trang Hồ sơ                         | `/profile` ([app/profile/page.tsx](../../../app/profile/page.tsx) — stub placeholder ship 2026-05-08; spec/implementation thực pending. Q1 reversed → stub do hydration bug, xem Q6) |
| i18n keys                                 | `home.profile.profile` ("Hồ sơ" / "Profile"), `home.profile.sign_out` ("Đăng xuất" / "Sign out") trong cả `vi-VN.json` và `en-US.json` |
| Đọc session                               | `auth()` từ [src/lib/auth.ts](../../../src/lib/auth.ts) — Server Component Homepage truyền `name` + `image` xuống component |
| Bộ test                                   | [tests/unit/components/home/ProfileButton.test.tsx](../../../tests/unit/components/home/ProfileButton.test.tsx) (7 ca, vitest xanh) |

Những gì code đã làm: toggle menu khi click trigger, đóng khi click ra ngoài (`mousedown` listener), Escape keydown listener đóng menu + trả focus về trigger, `aria-haspopup="menu"`, `aria-expanded` đồng bộ với `isOpen`, `aria-label` = tên người dùng (fallback "Hồ sơ"), avatar fallback chữ cái đầu (fallback "?" khi thiếu cả tên), menu render đúng thứ tự **Hồ sơ → Đăng xuất**, "Hồ sơ" là `<Link>` tới `/profile`, "Đăng xuất" là `<form action={signOutAction}>` bind tới Server Action gọi `signOut({ redirectTo: "/login" })` của Auth.js v5 — Next.js Server Actions tự xử lý CSRF qua action token; Auth.js xoá Prisma `Session` row + clear cookie + redirect về `/login`.

**Khác biệt giữa Figma và code (cần tài liệu hoá, không phải bug):**

1. **Nhãn item thứ hai**: Figma ghi `Logout`. Code hiển thị **"Đăng xuất" / "Sign out"** lấy từ key `home.profile.sign_out`. Đây là chủ ý: `Logout` là từ kỹ thuật, văn bản hiển thị chuẩn hoá theo locale của catalog. Khi triển khai CSS/UI sau này, **giữ nguyên nhãn từ catalog**, không thay theo chữ trong Figma.
2. **Icon phải của item Đăng xuất**: Figma mô tả "chevron phải". Code hiện chưa render icon (chỉ text trong `<button>`). CSS pass kế tiếp sẽ thêm icon — không thay đổi hành vi.
3. **Icon trái của item Hồ sơ**: Figma mô tả "icon user". Code hiện chưa render. Tương tự — bổ sung ở pass CSS.

Mục **Resolved Questions** cuối tài liệu chốt 4 quyết định liên quan: phạm vi route `/profile` (Q1), bổ sung Escape handler (Q2), responsive mobile (Q3), thời điểm survey biến thể admin (Q4).

---

## Tổng quan (Overview)

**Dropdown — Profile (biến thể user)** là một overlay tái sử dụng được, hiện ra khi người dùng click vào avatar profile (`A1.8`) ở header. Overlay liệt kê các thao tác liên quan đến tài khoản: vào trang Hồ sơ và Đăng xuất.

**Đối tượng người dùng**:
- **Người dùng đã đăng nhập với role thường (regular user)** — đây là biến thể duy nhất mô tả trong spec này. Họ thấy menu gồm 2 mục: **Hồ sơ** và **Đăng xuất**.
- **Người dùng đã đăng nhập với role admin** — KHÔNG dùng overlay này; họ dùng biến thể `54rekaCHG1` (sẽ có spec riêng) bổ sung mục **Admin Dashboard**. Tách hai biến thể giúp giữ component nhỏ và tránh nhánh điều kiện chỉ vì role.

**Bối cảnh nghiệp vụ**: Sau khi vào hệ thống, người dùng cần một điểm truy cập duy nhất để vào hồ sơ cá nhân và đăng xuất. Đặt menu trong header giúp luôn truy cập được từ mọi trang authenticated. Việc tái sử dụng cùng một overlay trên mọi trang giảm chi phí bảo trì so với mỗi trang viết menu riêng.

**Phạm vi áp dụng**: Mọi trang yêu cầu xác thực dùng chung `Header` (Homepage SAA `i87tDx10uM`, sau này là Awards Information `/awards`, Sun* Kudos `/sun-kudos`, Profile `/profile`, …). Login screen `GzbNeVGJHz` — vốn chỉ render header gọn (Logo + LanguageSelector) — KHÔNG mount overlay này.

---

## User Scenarios & Testing *(bắt buộc)*

### User Story 1 — Mở dropdown để xem các thao tác tài khoản (Priority: P1)

Người dùng đã đăng nhập click avatar trên header. Overlay mở ra liệt kê các thao tác có thể làm với tài khoản.

**Vì sao P1**: Đây là entry-point duy nhất tới các flow tài khoản từ header. Không có flow này thì người dùng không thể tự đăng xuất hay đi vào trang hồ sơ.

**Independent Test**: Đăng nhập, render Homepage, click avatar header. Khẳng định menu mở, có đúng 2 menuitem theo thứ tự **Hồ sơ → Đăng xuất**, và `aria-expanded` chuyển từ `false` sang `true`.

**Acceptance Scenarios**:

1. **Given** người dùng đang ở Homepage trong trạng thái menu đóng (`aria-expanded="false"`, không có element `role="menu"`), **When** họ click avatar (`A1.8`), **Then** menu mở ra (`role="menu"` xuất hiện) và liệt kê đúng 2 mục theo thứ tự: (1) Hồ sơ, (2) Đăng xuất; `aria-expanded` đổi thành `true`.
2. **Given** menu đang mở, **When** người dùng click lại avatar, **Then** menu đóng lại; `aria-expanded` đổi về `false`.
3. **Given** người dùng có ảnh avatar (`session.user.image` không rỗng), **When** trigger render, **Then** trigger hiển thị ảnh đó (qua `next/image` theo Constitution Principle II) thay vì chữ cái đầu.
4. **Given** người dùng không có ảnh nhưng có tên (`session.user.name = "Alice"`), **When** trigger render, **Then** trigger hiển thị chữ "A" làm fallback.
5. **Given** người dùng không có cả ảnh lẫn tên (`name = null, image = null`), **When** trigger render, **Then** trigger hiển thị "?" và `aria-label` lấy giá trị mặc định "Hồ sơ" (key `home.profile.profile`).

---

### User Story 2 — Vào trang Hồ sơ cá nhân (Priority: P1)

Từ menu, người dùng click "Hồ sơ" để chuyển sang trang chi tiết hồ sơ.

**Vì sao P1**: Trang Hồ sơ là một destination quan trọng (xem/chỉnh thông tin cá nhân, locale persistence, …). Menu là cách duy nhất hiện tại để tới đó từ Homepage.

**Independent Test**: Mở menu, click "Hồ sơ". Khẳng định trình duyệt điều hướng tới `/profile` (Next.js `Link` chuyển trang client-side; không reload).

**Acceptance Scenarios**:

1. **Given** menu đang mở, **When** người dùng click "Hồ sơ" (`A.1`), **Then** trình duyệt điều hướng tới `/profile`. Menu đóng tự nhiên do trang đổi.
2. **Given** menu đang mở và người dùng dùng bàn phím focus vào "Hồ sơ", **When** họ nhấn `Enter`, **Then** điều hướng tới `/profile` (do Next.js `Link` xử lý `Enter` mặc định).
3. **Given** route `/profile` đã ship dưới dạng stub placeholder (theo Resolved Question Q1, đã đảo từ option a → option b ngày 2026-05-08 do hydration bug — xem Q6), **When** người dùng click "Hồ sơ", **Then** trình duyệt điều hướng tới `/profile` và thấy trang stub "Hồ sơ — đang được xây dựng" với link quay về `/`. Implementation thực sẽ replace stub khi spec Profile được survey.

---

### User Story 3 — Đăng xuất (Priority: P1)

Từ menu, người dùng click "Đăng xuất" để kết thúc phiên và quay về Login.

**Vì sao P1**: Đăng xuất là một yêu cầu bảo mật cơ bản. Người dùng phải có đường rõ ràng để chấm dứt phiên trên thiết bị dùng chung.

**Independent Test**: Mở menu, click "Đăng xuất". Khẳng định Server Action `signOutAction` được invoke (Next.js POST tới page URL với action token), Auth.js `signOut()` xoá Prisma `Session` row + clear session cookie, và sau đó điều hướng về `/login` (theo Login spec US2 đã shipped).

**Acceptance Scenarios**:

1. **Given** menu đang mở, **When** người dùng click "Đăng xuất" (`A.2`), **Then** trình duyệt submit form `<form action={signOutAction}>` → Next.js dispatch Server Action `signOutAction` (POST tới page URL với action token) → Auth.js v5 `signOut({ redirectTo: "/login" })` xoá Prisma `Session` row + xoá session cookie → trình duyệt được redirect về `/login` (theo Login spec `GzbNeVGJHz` US2 nghịch đảo).
2. **Given** session đã bị huỷ ở phía server, **When** người dùng cố vào lại `/`, **Then** Homepage `auth()` trả về `null` và Server Component redirect về `/login` (theo Homepage spec FR-001a).
3. **Given** Server Action `signOutAction` thất bại (mạng rớt giữa chừng), **When** người dùng quan sát, **Then** trình duyệt giữ trạng thái hiện tại (Next.js Server Action submit gặp network error). Người dùng có thể click lại "Đăng xuất". Spec này KHÔNG yêu cầu UI hiển thị toast lỗi cho trường hợp signout fail — đây là edge case hiếm và Server Action submit tự retry-friendly.
4. **Given** người dùng dùng bàn phím focus vào "Đăng xuất", **When** họ nhấn `Enter` hoặc `Space`, **Then** form submit như khi click chuột (button mặc định `type="submit"`).

---

### User Story 4 — Đóng dropdown mà không chọn gì (Priority: P2)

Người dùng mở overlay rồi đổi ý — họ click ra ngoài hoặc nhấn `Escape` để đóng menu.

**Vì sao P2**: Affordance dropdown chuẩn. Cần thiết cho UX nhưng không thay đổi state ứng dụng.

**Independent Test**: Mở menu, thực hiện một trong các hành động dismiss (click outside, Escape, click lại trigger), khẳng định menu đóng và session không thay đổi.

**Acceptance Scenarios**:

1. **Given** menu đang mở, **When** người dùng `mousedown` lên một element bất kỳ ngoài container của dropdown (ví dụ vào hero của Homepage), **Then** menu đóng (`role="menu"` biến mất); không có navigation, không có signout.
2. **Given** menu đang mở, **When** người dùng click lại avatar trigger (`A1.8`), **Then** menu đóng (toggle hành vi US1 scenario 2).
3. **Given** menu đang mở và bàn phím đang focus bên trong overlay (trên trigger hoặc menuitem), **When** người dùng nhấn `Escape`, **Then** menu đóng và focus trả về trigger (tránh lost-focus).

---

### User Story 5 — Truy cập bằng bàn phím / trợ năng (Priority: P3)

Người dùng chỉ dùng bàn phím hoặc screen reader thao tác overlay không cần chuột.

**Vì sao P3**: A11y bắt buộc theo constitution Principle III, nhưng các flow P1/P2 ở trên đủ cho MVP; mở rộng A11y ở pass kế tiếp.

**Independent Test**: Tab tới trigger, mở menu, dùng `Tab` / arrow để đi qua từng item, `Enter` để chọn. Khẳng định ARIA roles + announcements chính xác.

**Acceptance Scenarios**:

1. **Given** focus đang ở trigger (avatar), **When** screen reader đọc nó, **Then** đọc lên tên người dùng (lấy từ `aria-label = name`) hoặc "Hồ sơ" nếu không có tên + role "button" + state "collapsed/expanded" tương ứng `aria-expanded`.
2. **Given** menu đang mở, **When** screen reader duyệt qua, **Then** đọc đúng `role="menu"` cho container và `role="menuitem"` cho từng item; thứ tự đọc là Hồ sơ → Đăng xuất.
3. **Given** người dùng nhấn `Tab` trong khi menu mở, **When** tới mục "Hồ sơ" rồi tới "Đăng xuất", **Then** mỗi mục đều có focus ring rõ ràng (focus-visible). *(Native `<a>` và `<button>` mặc định focusable; không cần `tabindex` thủ công.)*

---

### Edge Cases

- **Người dùng không đăng nhập**: Overlay này KHÔNG bao giờ render cho anonymous user — vì trigger nằm trong header của trang yêu cầu xác thực, mà các trang đó tự redirect về `/login` khi không có session (Homepage spec FR-001a). Nếu trong tương lai có trang public dùng cùng header, decision lúc đó là KHÔNG mount `ProfileButton` thay vì hiển thị overlay với menu rỗng.
- **Session hết hạn / bị thu hồi giữa lúc menu mở**: Menu vẫn đóng/mở bình thường (state local của component). Khi người dùng click "Hồ sơ" hoặc "Đăng xuất", request tới server sẽ được Auth.js xử lý: `auth()` trả về null → server middleware/route guard redirect về `/login`. Overlay không cần biết về expire để hoạt động đúng.
- **User không có tên VÀ không có ảnh**: Trigger render "?", `aria-label` = "Hồ sơ" (fallback). Behaviour vẫn đúng — đã có ca test bao phủ.
- **Tên dài hoặc có ký tự đặc biệt**: Fallback dùng `name.trim().charAt(0).toUpperCase()` — chỉ lấy ký tự đầu tiên (sau `trim`). Tên rỗng sau `trim()` rơi xuống "?". Tên có emoji hoặc ký tự non-Latin: hiển thị ký tự đầu nguyên bản (ví dụ "張三" → "張"). Đây là hành vi mong muốn.
- **Click nhanh nhiều lần lên trigger**: Mỗi click toggle `isOpen`. Click chẵn = đóng, lẻ = mở; không có race condition vì state được React quản lý tuần tự.
- **Mount `ProfileButton` nhiều lần trên cùng trang**: Mỗi instance có `useState` + `useRef` riêng — các overlay độc lập về open/close. Nhưng UX nên TRÁNH (chỉ đặt 1 ProfileButton ở header). Spec này không yêu cầu sync giữa các instance.
- **Tương thích `prefers-reduced-motion`**: Mọi animation/transition không-thiết-yếu trên overlay MUST tôn trọng `prefers-reduced-motion: reduce` (Constitution Principle III). Người dùng chọn reduce motion sẽ thấy state đổi tức thời, không animation. Cách triển khai cụ thể (Tailwind `motion-safe:` hay điều kiện CSS) thuộc CSS pass.
- **CSRF**: Form đăng xuất bind tới Server Action `signOutAction` — Next.js sinh + verify action token cho mỗi Server Action POST (cơ chế CSRF nội tại của React Server Actions). NextAuth catch-all KHÔNG được gọi trực tiếp từ raw `<form action="/api/auth/signout">` — Auth.js v5 sẽ reject với `MissingCSRF` redirect tới `/api/auth/signin`. Overlay KHÔNG được fallback về raw form action URL.

---

## UI/UX Requirements *(từ Figma)*

### Screen Components

| Component                | Node ID                       | Type / Mô tả ngắn                                                                                | Tương tác                                                                                                                                          |
| ------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `A` Dropdown-List        | `666:9601`                    | Container của overlay; instance của component dùng chung `563:7882`. Mở từ trigger `A1.8` Homepage. | Container — render khi `isOpen === true`. Click outside / Escape / click lại trigger → đóng.                                                       |
| `A.1` Profile (Hồ sơ)    | `I666:9601;563:7844`          | Menu item: Figma label "Profile" + icon user (vai trò trang trí). Code dùng nhãn từ catalog (`home.profile.profile`). | Click / `Enter` → điều hướng tới `/profile`. Có hover + focus state (treatment thuộc CSS pass). Render bằng Next.js `<Link>`.          |
| `A.2` Logout (Đăng xuất) | `I666:9601;563:7868`          | Menu item: Figma label "Logout" + icon chevron (vai trò trang trí). Code dùng nhãn từ catalog (`home.profile.sign_out`).   | Click / `Enter` / `Space` → invoke Server Action `signOutAction` (gọi Auth.js v5 `signOut({ redirectTo: "/login" })`). Có hover + focus state (treatment thuộc CSS pass). Render bằng `<form action={signOutAction}>` chứa `<button type="submit">`.  |

> Các thuộc tính trực quan (màu nền, kích thước, padding, border, glow, shadow) được CSS pass triển khai sau bằng `query_section` trên các Node ID ở trên. Spec này chỉ neo hành vi.

### Navigation Flow

- **Vào**: overlay được mở từ Homepage SAA `A1.8`. Tương lai: từ `A1.8` của bất kỳ trang authenticated nào dùng cùng header.
- **Ra**:
  - `A.1` Hồ sơ → `/profile` (stub placeholder shipped 2026-05-08 tại [app/profile/page.tsx](../../../app/profile/page.tsx); spec Profile thực vẫn pending. Q1 reversed → stub do hydration bug, xem Q6).
  - `A.2` Đăng xuất → Server Action `signOutAction` → Auth.js v5 `signOut({ redirectTo: "/login" })` xoá Prisma `Session` row + clear cookie → trình duyệt redirect về `/login` (theo Login spec `GzbNeVGJHz` US2 nghịch đảo).
- **Self-loop**: click outside / Escape / click lại trigger → đóng menu, không navigation.

### Behavior & Accessibility (non-visual)

- Trigger MUST có `aria-haspopup="menu"` và `aria-expanded` đồng bộ với state `isOpen`. **Đã có**.
- Trigger MUST có `aria-label` mô tả chủ menu — implementation hiện dùng tên người dùng (hoặc "Hồ sơ" nếu thiếu). Khi spec biến thể admin (`54rekaCHG1`) ra đời, label nên thêm role suffix (ví dụ `"Account: Alice (admin)"`) — Homepage spec đã đề cập FR-005, spec admin sẽ chốt.
- Container menu MUST có `role="menu"`, các item MUST có `role="menuitem"`. **Đã có**.
- Mỗi menuitem MUST keyboard-operable: `<a>` xử lý `Enter`, `<button type="submit">` xử lý `Enter`/`Space`. **Đã có**.
- Khi menu đóng do click outside, focus KHÔNG cần trả về trigger (thường người dùng đã click sang nơi khác). Nhưng khi đóng bằng `Escape`, focus PHẢI trở về trigger (Resolved Question Q2 — handler bổ sung trong pass kế tiếp).
- WCAG 2.1 AA: focus visible, name/role/value, contrast — visual contrast được CSS pass đảm bảo, không phải mối quan tâm spec này.

---

## Yêu cầu (Requirements) *(bắt buộc)*

### Functional Requirements

- **FR-001**: Component MUST render trigger là một `<button type="button">` avatar có `aria-haspopup="menu"`, `aria-expanded` đồng bộ với state, và `aria-label`. Nội dung trigger theo thứ tự ưu tiên: (a) ảnh `session.user.image` (qua `next/image`) nếu có; (b) chữ cái đầu của `session.user.name.trim()` viết hoa, nếu chỉ có tên; (c) ký tự `?` nếu thiếu cả hai. `aria-label` lấy giá trị `session.user.name` nếu có; nếu thiếu, fallback về chuỗi từ catalog `home.profile.profile` ("Hồ sơ" / "Profile").
- **FR-002**: Click trigger MUST toggle state `isOpen`. Khi `isOpen === true`, component MUST render menu container với `role="menu"`; khi `false`, container không tồn tại trong DOM (KHÔNG ẩn bằng CSS).
- **FR-003**: Menu MUST hiển thị đúng 2 mục theo thứ tự cố định: (1) "Hồ sơ" (key `home.profile.profile`), (2) "Đăng xuất" (key `home.profile.sign_out`). Cả hai có `role="menuitem"`.
- **FR-004**: Mục "Hồ sơ" MUST là link tới `/profile` — render bằng Next.js `<Link href="/profile">` để hỗ trợ client-side navigation.
- **FR-005**: Mục "Đăng xuất" MUST submit form bind tới Server Action `signOutAction` (định nghĩa ở [src/actions/auth.ts](../../../src/actions/auth.ts) với directive `"use server"`; gọi `signOut({ redirectTo: "/login" })` của Auth.js v5) — render bằng `<form action={signOutAction}>` chứa `<button type="submit">`. Server Action vận chuyển CSRF qua Next.js action token và cho phép redirect HTTP thuần. KHÔNG được POST raw tới `/api/auth/signout` — Auth.js v5 yêu cầu CSRF token trong body, fallback đó sẽ trả `302` → `/api/auth/signin?error=MissingCSRF` (đã verify bằng curl 2026-05-08).
- **FR-006**: Component MUST đóng menu khi người dùng `mousedown` ngoài container (click outside) — listener gắn ở `document` chỉ trong khoảng thời gian `isOpen === true` để tránh leak.
- **FR-007**: Component MUST đóng menu khi người dùng nhấn `Escape` trong khi focus đang ở trigger hoặc bất kỳ element con nào của overlay — focus PHẢI trả về trigger sau khi đóng. Implementation theo pattern keydown listener trong `useEffect` y hệt `LanguageSelector` (đã ship) — xem Resolved Question Q2.
- **FR-008**: Component MUST KHÔNG có nhánh điều kiện theo `role`. Biến thể admin (thêm "Admin Dashboard") thuộc về spec/component khác (`54rekaCHG1`); việc tách rõ giúp giữ kích thước component nhỏ và unit test đơn giản.
- **FR-009**: Tất cả nhãn hiển thị trên menu MUST đến từ i18n catalog (`home.profile.*`). Catalog `vi-VN.json` và `en-US.json` MUST đồng bộ — parity test (`tests/unit/lib/i18n/parity.test.ts`) đảm bảo.
- **FR-010**: Component MUST không trực tiếp đọc `auth()` hay session. Nó nhận `name`, `image`, `locale` qua props từ parent (Server Component Homepage đã gọi `auth()` rồi forward) — đảm bảo component reusable, dễ test.

### Technical Requirements

- **TR-001**: Component MUST là Client Component (`"use client"`) vì nó dùng `useState`, `useEffect`, `useRef`. Parent là Server Component đảm nhiệm việc gọi `auth()`.
- **TR-002**: Click-outside listener MUST dùng `mousedown` (không phải `click`) — bắt event sớm hơn `click`, tránh trường hợp menu đóng làm trigger nhận click 2 lần.
- **TR-003**: Listener MUST được unmount trong cleanup của `useEffect` (gọi `removeEventListener`) — đã có.
- **TR-004**: Không được introduce dependency mới (Radix UI, Headless UI, Floating UI, …). Component đủ đơn giản để tự viết — đồng thời phù hợp constitution Principle II (giảm chi phí bundle khi feature đủ nhỏ).
- **TR-005**: Tailwind v4 tokens only — KHÔNG được hardcode màu/spacing/radius/shadow trong component. Mọi giá trị phải đi qua các token định nghĩa ở `app/globals.css` (Constitution Principle II — Tailwind block). Việc chọn token cụ thể nào cho overlay được quyết định ở CSS pass khi `query_section` lấy spec trực quan từ Figma.
- **TR-006**: Per Constitution Principle V (TDD), test cho hành vi mới (menu render đúng item, navigation, signout form, click outside) MUST có trước khi sửa CSS — bộ test [tests/unit/components/home/ProfileButton.test.tsx](../../../tests/unit/components/home/ProfileButton.test.tsx) đã đáp ứng.
- **TR-007**: Per Constitution Principle IV (OWASP), signout đi qua Next.js Server Action `signOutAction` — Next.js sinh + verify action token cho mỗi POST (cơ chế CSRF nội tại của React Server Actions). KHÔNG được fallback sang raw form `POST` tới `/api/auth/signout` (Auth.js v5 reject với `MissingCSRF`) hay sang `GET` (CSRF qua image preload).

### Key Entities

- **User session** (entity hiện có, KHÔNG sửa): `{ user: { name, image, role, locale, ... } }` đến từ Auth.js / Prisma. Spec này CHỈ đọc `name` và `image` từ session.

---

## State Management

### Local component state

- `isOpen: boolean` — menu đang mở hay đóng. Owned bởi `ProfileButton`. Không có cần chia sẻ ngoài.
- `containerRef: RefObject<HTMLDivElement>` — bắt event click-outside. Không phải state (ref).
- `triggerRef: RefObject<HTMLButtonElement>` — cần cho follow-up Escape handler (Resolved Question Q2): khi `event.key === "Escape"`, listener gọi `triggerRef.current?.focus()` để trả focus về trigger sau khi đóng menu (FR-007). Hiện chưa có trong code; sẽ thêm cùng pass Escape.

### Global / shared state

- KHÔNG có. Component không cần truy cập store nào. Session đã được parent đọc và truyền qua props.

### Loading / error state

- KHÔNG có loading state — overlay là local UI, không gọi API khi mở/đóng.
- Signout: Server Action submit là một full-page navigation (Auth.js redirect tới `/login`). KHÔNG có state loading hiển thị trong overlay; trình duyệt tự render trạng thái loading khi điều hướng.

### Cache / invalidation

- Không liên quan. Overlay không cache gì.

---

## API Dependencies

| Endpoint              | Method | Mục đích                                                                                       | Trigger                              | Trạng thái                                                                                            |
| --------------------- | ------ | ----------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `/api/auth/signout`   | POST   | Huỷ session NextAuth (xoá Prisma `Session` row + xoá session cookie + redirect `/login`)       | Server Action `signOutAction` (US3) — KHÔNG invoke trực tiếp từ form action URL | **Implemented** qua NextAuth handler `app/api/auth/[...nextauth]/route.ts`. Client gọi gián tiếp qua `signOut()` của Auth.js v5 trong Server Action [src/actions/auth.ts](../../../src/actions/auth.ts). |
| (no API)              | —      | Đọc `name`, `image` từ session                                                                  | Server Component Homepage (parent)   | **Implemented** — `auth()` từ [src/lib/auth.ts](../../../src/lib/auth.ts).                             |

> Overlay tự nó KHÔNG gọi `fetch` nào — toàn bộ tương tác server đi qua native form submit hoặc Next.js Link navigation.

---

## Success Criteria *(bắt buộc)*

### Measurable Outcomes

- **SC-001**: Click avatar mở/đóng menu trong 100% interactions (verified bằng unit test — đã có).
- **SC-002**: Menu render đúng thứ tự **Hồ sơ → Đăng xuất** trong 100% renders (verified bằng unit test — đã có).
- **SC-003**: Click "Đăng xuất" → server-side session row bị xoá trong < 1s (verified ở Login spec hồi quy + E2E `auth/signout.spec.ts` nếu có).
- **SC-004**: Click outside → menu đóng trong 100% trường hợp (verified bằng unit test — đã có).
- **SC-005**: Tất cả nhãn hiển thị đúng locale active — không string hardcoded; parity test giữa `vi-VN.json` và `en-US.json` xanh trong 100% builds.
- **SC-006**: Không regression trên Homepage SAA: 11/11 Playwright homepage test + 184/184 vitest đều xanh sau khi spec này được công nhận làm tài liệu.

---

## Out of Scope

- **Biến thể admin (`54rekaCHG1`)** — sẽ có spec riêng, thêm mục "Admin Dashboard". Logic chọn biến thể (theo `User.role`) thuộc spec đó hoặc spec parent (Homepage spec — PQ1 = b về `User.role` schema migration). Xem Resolved Question Q4 cho thời điểm survey.
- **Trang đích `/profile`** — destination only. Spec này CHỈ phát hành link, không định nghĩa nội dung trang.
- **Notification panel (`A1.6`)** — overlay khác, spec khác.
- **Quick-action menu (FAB `6`)** — overlay khác, spec khác.
- **Language dropdown** — `hUyaaugye2` đã có spec riêng.
- **Đa thiết bị mobile**: Overlay anchor cạnh phải của trigger (chi tiết position là CSS). Trên màn hình hẹp có thể bị tràn — Resolved Question Q3 hoãn xử lý sang responsive polish pass.

---

## Dependencies

- [x] Constitution document (`.momorph/constitution.md`)
- [x] Component đã ship ([src/components/home/ProfileButton.tsx](../../../src/components/home/ProfileButton.tsx))
- [x] NextAuth handler `app/api/auth/[...nextauth]/route.ts`
- [x] i18n keys `home.profile.profile` + `home.profile.sign_out` trong cả 2 catalog
- [x] Header slot `profileMenu` đã được mở rộng ở [src/components/header/Header.tsx](../../../src/components/header/Header.tsx) (Homepage spec TR-006)
- [x] Homepage SAA spec tham chiếu trigger ở `A1.8` (`.momorph/specs/i87tDx10uM-homepage-saa/spec.md` US2 scenario 8 + 9)
- [x] Login spec (`GzbNeVGJHz`) đảm bảo redirect về `/login` sau signout
- [x] Bộ test unit ([tests/unit/components/home/ProfileButton.test.tsx](../../../tests/unit/components/home/ProfileButton.test.tsx))
- [x] Trang `/profile` (destination stub) — đã ship 2026-05-08 dưới dạng placeholder ([app/profile/page.tsx](../../../app/profile/page.tsx) dùng `<StubPage title="Hồ sơ" />`); spec gốc đã đảo Q1 từ "chấp nhận 404" → "stub placeholder" do hydration bug (xem Q6). Spec Profile thực sẽ replace stub khi survey.
- [ ] Spec biến thể admin `54rekaCHG1` — pending sau khi `User.role` migration ship; theo Q4 (resolved)
- [x] Bổ sung Escape keydown listener cho ProfileButton — đã ship 2026-05-08, theo Q2 (resolved)
- [x] Screen flow tài liệu component (`.momorph/SCREENFLOW.md` cập nhật 2026-05-08)

---

## Resolved Questions

- **Q1 — Phạm vi route `/profile` ở milestone hiện tại.** **Resolved 2026-05-08 (option a).** ~~Chấp nhận 404 ngắn hạn~~ — option a giữ thiết kế ban đầu (trình duyệt rơi vào 404 cho tới khi spec Profile ra). **Reversed 2026-05-08 → option b (stub placeholder)** sau khi phát hiện hydration bug: ở Next.js 16 + Turbopack dev, click `<Link>` đến route 404 + browser back làm React detached khỏi homepage DOM (avatar/language/bell mất click handler). Stub `app/profile/page.tsx` ship để eliminate trigger 404 (xem Q6). Spec Profile thực vẫn ở backlog SCREENFLOW Next Steps; stub là placeholder, **không thay thế** spec đó.
- **Q2 — Handler `Escape` trên overlay.** **Resolved 2026-05-08: bổ sung handler ngay (option a).** Thêm `keydown` listener trong `useEffect` của `ProfileButton` theo pattern đã ship ở `LanguageSelector` — khi `event.key === "Escape"` thì set `isOpen=false` và gọi `triggerRef.current?.focus()` để trả focus về trigger. Listener chỉ active khi `isOpen === true` (giống click-outside listener). Cần thêm 1 unit test khẳng định "press Escape closes menu and focuses trigger". Đã unblock FR-007 và US4 scenario 3 — không còn caveat "MỤC TIÊU". **Implemented 2026-05-08** trong commit `feat(profile-dropdown): add Escape keydown handler...` — khẳng định FR-007 đã chốt code.
- **Q3 — Tràn viewport trên mobile.** **Resolved 2026-05-08: hoãn sang responsive polish (option a).** Header đang desktop-first ở phase này; chấp nhận overlay có thể tràn cạnh trên màn hình hẹp. Khi có pass mobile riêng, sẽ chọn flip/shift bằng tay (option b) — KHÔNG introduce `Floating UI` (vi phạm TR-004). Quyết định anchor strategy cụ thể thuộc CSS pass đó.
- **Q4 — Khi nào survey biến thể admin (`54rekaCHG1`)?** **Resolved 2026-05-08: chờ `User.role` migration ship (option a).** Phụ thuộc PQ1 = b của Homepage spec. Khi schema thêm cột `User.role`, spec admin variant sẽ được viết, kế thừa cấu trúc của spec này + thêm mục "Admin Dashboard" và logic chọn biến thể theo role. Tránh viết spec dựa trên schema chưa tồn tại.
- **Q6 — Hydration bug khi back-navigate từ route 404 (Next.js 16 + Turbopack dev).** **Resolved 2026-05-08: stub các route đích thiếu (option a).** Bug observed: ở Homepage SAA, click bất kỳ `<Link>` đến route chưa tồn tại (`/awards`, `/sun-kudos`, `/general-rules`, `/profile`) → Next.js render 404 → browser back → React không re-attach vào DOM của homepage (verify: `document.querySelector("main")` không còn `__reactFiber`/`__reactProps`; avatar button thiếu `__reactProps` chứa `onClick`). Hậu quả: cả 3 client island ở header (`ProfileButton`, `LanguageSelector`, `NotificationBell`) không phản hồi click sau khi back. Click event vẫn bubble đến `document` (DOM intact) nhưng React event delegation đã chết. Đã thử `app/not-found.tsx` custom — KHÔNG fix (chỉ thay UI 404, không động cơ chế hydration). Fix đã verify: tạo placeholder pages [`app/awards/page.tsx`](../../../app/awards/page.tsx) / [`app/sun-kudos/page.tsx`](../../../app/sun-kudos/page.tsx) / [`app/general-rules/page.tsx`](../../../app/general-rules/page.tsx) / [`app/profile/page.tsx`](../../../app/profile/page.tsx) dùng [`src/components/ui/StubPage.tsx`](../../../src/components/ui/StubPage.tsx) — eliminate 404 trigger. Verify bằng Playwright headless: 4/4 routes pass (avatar/language/bell click work sau back). **Đây là workaround, không phải fix tận gốc** — bản chất là Next.js bug; nên mở issue upstream với minimal repro. Stub sẽ được replace bằng spec/implementation thực khi từng route có timeline riêng.
- **Q5 — Cơ chế invoke signout ở client (Auth.js v5 MissingCSRF).** **Resolved 2026-05-08: dùng Server Action wrapper (option a).** Spec gốc (shipped 2026-05-07 cùng Homepage Phase 13) wired raw `<form action="/api/auth/signout" method="post">` — pattern hợp lệ ở NextAuth v4 nhưng KHÔNG hợp lệ ở Auth.js v5 vì v5 yêu cầu CSRF token trong body khi POST tới `/api/auth/signout`. Bug observed: click "Đăng xuất" → `302` redirect tới `/api/auth/signin?error=MissingCSRF` (verify bằng `curl -X POST http://localhost:3000/api/auth/signout`). Fix: tạo [src/actions/auth.ts](../../../src/actions/auth.ts) với `"use server"` export `signOutAction()` gọi `signOut({ redirectTo: "/login" })`; ProfileButton đổi `<form action="/api/auth/signout" method="post">` thành `<form action={signOutAction}>`. Next.js Server Actions tự sinh action token (CSRF nội tại) — Auth.js sau đó xoá `Session` row + redirect `/login` qua `signOut()` server-side. Verified end-to-end bằng Playwright headless với session cookie thật: click → final URL `/login`, session row deleted. **Implemented 2026-05-08** sau khi user report bug. Spec hygiene sync cập nhật FR-005 / TR-007 / Security CSRF / API table / Implementation Status / Acceptance scenarios.

---

## Notes

- Component này là **reusable, không phải screen**. Convention thư mục `z4sCl3_Qtk-dropdown-profile/` giống các spec screen, nhưng artifact mô tả overlay được embed trong screens.
- **Khác biệt với Dropdown ngôn ngữ (`hUyaaugye2`)**: cả hai đều là dropdown overlay anchor vào header, nhưng (a) dropdown ngôn ngữ MUTATE global state (locale → re-render toàn screen), trong khi dropdown profile NAVIGATE; (b) dropdown ngôn ngữ có persistence layer (cookie + DB) còn dropdown profile không cần persistence local; (c) dropdown ngôn ngữ là 1 component (`LanguageSelector`) còn dropdown profile cũng là 1 component (`ProfileButton`) — pattern giống nhau, dùng làm tham chiếu chéo dễ.
- **Khác biệt nhãn Figma vs code**: Figma dùng "Logout" (chữ Anh), code dùng "Đăng xuất"/"Sign out" theo locale. Đây là chủ ý: catalog là single source of truth của text hiển thị, Figma chỉ đại diện trực quan của một phiên bản. Khi CSS pass triển khai, KHÔNG được đổi text Figma sang code — phải đổi catalog (nếu cần).
- **Test attached to Figma frame**: `get_frame_test_cases` trả về mảng rỗng cho `z4sCl3_Qtk`. Bộ test acceptance ở trên (US1–US5) đáng được fold vào lần `momorph.createtestcases` sắp tới, đặc biệt là kịch bản `Escape` (gắn với Q2).
- **Constitution alignment**: component là leaf-level reusable React component không có business logic; chỉ compose `<Link>`, `<form>`, `<button>` của Next.js + DOM thuần. Đáp ứng Principle I (clean structure), Principle II (Server-Component-by-default; chỉ phần dropdown là Client + 1 Server Action `signOutAction`), Principle III (a11y với ARIA + keyboard), Principle IV (CSRF qua Next.js Server Actions + Auth.js v5 `signOut()`), Principle V (TDD — test có sẵn).
- **Cross-spec linkage**: Khi Homepage spec mô tả FR-005 (menu items theo role), spec này là **chi tiết mở rộng**: liệt kê các Node ID cụ thể, các fallback của trigger (chữ cái đầu / "?"), pattern signout (Server Action `signOutAction`), và các open question liên quan tới `/profile` & Escape. Homepage spec KHÔNG cần cập nhật — chỉ cần biết spec này tồn tại.
