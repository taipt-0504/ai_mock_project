# Feature Specification: Sun* Kudos — Live Board

**Frame ID**: `2940:13431` (screen ID `MaZUn5xHXZ`)
**Frame Name**: `Sun* Kudos - Live board`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Figma URL**: https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=MaZUn5xHXZ
**Created**: 2026-05-11
**Status**: **Ready for `momorph.plan`** sau khi resolve Q-LB1..Q-LB7 ngày 2026-05-11:

- ✅ Q-LB1 — Route: **`/sun-kudos`** (đồng nhất với reference đã có ở Homepage + Awards + prelaunch gate whitelist).
- ✅ Q-LB2 — Auto-update: **Manual refresh only** (no realtime / polling). Feed update khi user reload, đổi filter, hoặc bấm nút Refresh trong page (xem FR-002).
- 🅿 Q-LB3 — Mobile: **deferred / not in MVP scope**. Mobile concerns sẽ revisit sau khi survey iOS variant `8HGlvYGJWq`.
- ✅ Q-LB4 — Kudos detail: **full route `/sun-kudos/{id}` + parallel modal** (Next.js intercepting routes — modal khi vào từ feed, full page khi deep-link / share).
- ✅ Q-LB5 — Filter Phòng ban scope: **cả sender lẫn receiver** (`sender_dept = X OR receiver_dept = X`).
- ✅ Q-LB6 — Multi-filter combine: **AND** (Hashtag AND Phòng ban).
- ✅ Q-LB7 — Hearts vs Stars: phân tách hoàn toàn — mỗi like = `+1/+2 hearts` cho sender; stars = tier badge từ `kudos_received_count` (10/20/50).

---

## Overview

Màn **Sun\* Kudos — Live Board** là bảng tổng "live" của hệ thống ghi nhận lời cảm ơn (Kudos)
trong khuôn khổ **Sun\* Annual Awards 2025**. Đây là trang hub mọi Sunner đã đăng nhập sẽ ghé
vào để:

1. Viết một Kudo mới qua **Ô nhập / Ghi nhận** (`A.1`) ở đầu trang — mở dialog gửi lời cảm ơn.
2. Xem **Highlight Kudos** (`B`) — top 5 Kudo được nhiều tim nhất, hiển thị dưới dạng carousel
   có Prev / Next.
3. Xem **Spotlight board** (`B.7`) — word cloud tên những Sunner đang được vinh danh, có
   pan / zoom và tìm kiếm.
4. Cuộn **All Kudos** (`C`) — feed toàn bộ Kudo của event với infinite scroll, hashtag filter,
   thả tim (heart), copy link và xem chi tiết.
5. Theo dõi **sidebar thống kê** (`D`) — số Kudo nhận / gửi, số tim, số Secret Box, nút
   **Mở quà**, và hai leaderboard "10 Sunner thăng hạng" + "10 Sunner nhận quà mới nhất".

Behaviorally, đây là một trang **tương tác** (không read-only): user có thể tạo Kudo, thả /
rút tim, mở quà, lọc theo hashtag / phòng ban, tìm Sunner. Feed update theo cơ chế **manual
refresh** (không realtime cho MVP — xem Q-LB2 + FR-002): user reload trang, đổi filter, hoặc
bấm nút Refresh để fetch lại Kudo mới nhất.

**Target users**: toàn bộ nhân sự Sun\* đã đăng nhập SAA 2025; có thêm phân nhánh quyền
"admin" để cấu hình **special day** (mỗi tim thả vào ngày special cộng `+2 hearts` cho sender
thay vì `+1` — xem US3).

**Business context**: Kudos là sản phẩm "công cụ ghi nhận lẫn nhau" gắn với chương trình
recognition hằng năm. Live Board chính là mặt tiền của Kudos — nơi nội dung mới được show
ngay, nơi top Kudo được vinh danh. Trang này càng "sống động" và càng dễ tham gia thì tỉ lệ
gửi Kudo càng cao, đó là metric chính của program (xem SC-001..SC-003).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Viết một Kudo mới (Priority: P1)

Một Sunner đã đăng nhập, vào màn Live Board, click vào **Ô nhập / Ghi nhận** (`A.1`,
node `2940:13449`) ở đầu trang. Dialog gửi Kudo (màn ngoài, screenId
`ihQ26W78P2`) mở ra. Sunner nhập nội dung, chọn người nhận, chọn hashtag và gửi. Khi
submit thành công, Kudo mới xuất hiện ngay đầu feed `C_All kudos` của **chính user gửi**
(optimistic prepend); các Sunner khác cần refresh để thấy (FR-002 — không realtime cho MVP,
Q-LB2 resolved).

**Why this priority**: đây là **action chính** của toàn bộ hệ thống Kudos. Không có hành động
này thì cả program bị tê liệt — không có Kudo nào được tạo ra. Mọi tính năng khác (Highlight,
Spotlight, thả tim, leaderboard) đều phụ thuộc vào dữ liệu được sinh ra ở đây.

**Independent Test**: đăng nhập, click `A.1`, gửi 1 Kudo qua dialog. Verify (1) dialog mở; (2)
sau khi gửi, Kudo mới xuất hiện ở đầu `C.2_Danh sách lời cảm ơn`; (3) Kudo lưu vào DB (kiểm
qua API hoặc bằng cách reload trang — Kudo vẫn còn).

**Acceptance Scenarios**:

1. **Given** tôi đã đăng nhập và đang ở `/sun-kudos`, **When** tôi click vào ô nhập `A.1` (có
   placeholder `Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?`), **Then** dialog gửi
   Kudo (screen `ihQ26W78P2`) mở ra trên màn hình.
2. **Given** dialog gửi Kudo đang mở và tôi để trống ô nội dung, **When** tôi cố submit,
   **Then** nút submit bị disabled và form không gửi được (validation `required=true`).
3. **Given** dialog gửi Kudo đang mở và tôi đã nhập nội dung hợp lệ + chọn người nhận, **When**
   tôi submit, **Then** server lưu Kudo vào DB, dialog đóng lại, Kudo mới hiện ở đầu
   `C_All kudos`. (Việc tạo Kudo KHÔNG trực tiếp cộng tim/sao cho người gửi — chỉ cập nhật
   `kudos_sent_count`; sao tier của người gửi không đổi, sao tier của người nhận có thể
   tăng nếu chạm ngưỡng 10/20/50 — xem FR-008.)
4. **Given** một Sunner khác vừa gửi Kudo, **When** tôi reload trang `/sun-kudos` hoặc bấm
   nút Refresh, **Then** Kudo mới của họ xuất hiện ở đầu `C_All kudos` của tôi. (MVP không
   có realtime push — xem FR-002 + Q-LB2.)
5. **Given** tôi chưa đăng nhập, **When** tôi cố click `A.1`, **Then** hệ thống redirect tôi
   sang `/login` (yêu cầu authentication — xem TC `71b3ef43`).

---

### User Story 2 — Xem và duyệt Highlight Kudos (Priority: P1)

Sunner mở Live Board và muốn xem những Kudo "đỉnh" nhất của event. Khối `B_Highlight`
(`2940:13451`) hiển thị **top 5 Kudo có nhiều tim nhất** dưới dạng carousel. Điều hướng
carousel có 2 cụm nút (đều cùng hành vi prev/next, cùng đồng bộ slide index):

- **B.2.1 / B.2.2** (`2940:13470` / `2940:13468`) — Prev / Next gắn trực tiếp trên carousel
  content (TC `81446f61`).
- **B.5.1 / B.5.2 / B.5.3** (`2940:13472` / `2940:13473` / `2940:13474`) — pager bar bên dưới:
  Prev arrow + page indicator (`n/5`) + Next arrow.

Hai dropdown filter `Hashtag` (`B.1.1`, `2940:13459`) và `Phòng ban` (`B.1.2`, `2940:13460`)
áp dụng đồng thời cho cả Highlight và All Kudos (xem FR-005).

**Why this priority**: Highlight là cơ chế "social proof" — show Kudo được công nhận nhiều
nhất, kéo Sunner khác đọc và bắt chước hành vi gửi Kudo. P1 vì nếu Highlight không hoạt động
thì trang Live Board mất một trong hai cột nội dung chính (cùng với All Kudos).

**Independent Test**: Vào `/sun-kudos` khi có ≥ 5 Kudo trong DB. Verify carousel show đúng 5 Kudo
sắp theo thứ tự `heart_count DESC`. Click Next → slide chuyển; Prev → quay lại; chọn Hashtag
filter → carousel + feed dưới đều filter theo tag đó. Click `Xem chi tiết` trên một card →
mở Kudos detail.

**Acceptance Scenarios**:

1. **Given** đã có ≥ 5 Kudo trong DB, **When** tôi load Live Board, **Then** carousel
   `B.2_HIGHLIGHT KUDOS` hiển thị 5 card Kudo có `heart_count` cao nhất; card đang active
   nổi bật, các card khác ở trạng thái inactive (non-interactive).
2. **Given** tôi đang ở slide 1, **When** tôi click `B.2.2_Button tiến` (hoặc
   `B.5.3_Button tiến` ở pager bar), **Then** carousel chuyển sang slide 2 và
   `B.5.2_số trang` cập nhật thành `2/5`.
3. **Given** tôi đang ở slide 5 (slide cuối), **When** tôi nhìn các nút điều hướng, **Then**
   cả `B.2.2_Button tiến` và `B.5.3_Button tiến` đều ở trạng thái disabled.
4. **Given** tôi đang ở slide 1, **When** tôi nhìn các nút điều hướng, **Then**
   cả `B.2.1_Button lùi` và `B.5.1_Button lùi` đều ở trạng thái disabled.
5. **Given** tôi click filter `B.1.1_ButtonHashtag` và chọn `#Dedicated`, **When** filter áp
   dụng, **Then** **cả** carousel Highlight **và** feed `C_All kudos` chỉ còn Kudo có tag
   `#Dedicated`; clear filter → quay về toàn bộ.
6. **Given** tôi click filter `B.1.2_Button Phong ban` và chọn `Marketing`, **When** filter
   áp dụng, **Then** cả Highlight và All Kudos chỉ còn Kudo mà người gửi **hoặc** người nhận
   thuộc phòng `Marketing` (Q-LB5 resolved); clear filter → quay về toàn bộ.
7. **Given** chưa có Kudo nào trong DB, **When** tôi load Live Board, **Then** carousel
   Highlight hiển thị empty state `Hiện tại chưa có Kudos nào.` (cùng message với All Kudos
   — TC `9dfda316`).
8. **Given** một card Highlight `B.3` đang active trong carousel, **When** tôi click nút
   `Xem chi tiết` trong action bar `B.4.4` của card đó, **Then** điều hướng tới Kudos detail
   page (route chốt ở Q-LB4 — TC `8c0d1781`).
9. **Given** một card Highlight đang active, **When** tôi click trực tiếp vào nội dung Kudo
   (vùng `B.4.2`, max 3 dòng + `...`), **Then** điều hướng tới Kudos detail page tương tự.

---

### User Story 3 — Thả tim và tích lũy hearts (Priority: P1)

Trên mỗi card Kudo (cả ở Highlight `B.3` và ở feed `C.3_KUDO Post`), Sunner có thể click nút
**Heart** (`C.4.1`, `I3127:21871;256:5175`) để thả tim. Mỗi tim hợp lệ cộng cho **người gửi
Kudo** vào tổng `hearts_received_count` (sidebar `D.1.4` show con số này):

- **+1 tim** (ngày thường).
- **+2 tim** nếu thả vào **special day** đã được admin cấu hình (TC `31936b72`).

Đồng thời `heart_count` của Kudo tăng 1 (counter trên Kudo, không phải +2 dù là special day —
counter này phản ánh "bao nhiêu user đã like Kudo này"; bonus special-day chỉ áp lên total
hearts của sender, không nhân đôi count trên Kudo). **Lưu ý quan trọng**: hearts ≠ stars.
Stars (sao) là tier badge tính từ `kudos_received_count` theo ngưỡng 10/20/50 — xem FR-008,
hoàn toàn tách biệt với cơ chế tim ở đây.

Quy tắc business:

- Mỗi user **chỉ thả 1 tim** cho mỗi Kudo (TC `91e102ba`).
- **Người gửi Kudo không thả tim được Kudo của chính mình** — nút Heart bị disabled (TC
  `63645b03`).
- Rút tim (unlike) hoàn trả đúng số tim đã cộng (1 hoặc 2 tùy đã thả vào ngày thường hay
  special day — DB lưu cờ `is_special_day_like`, xem FR-009).

**Why this priority**: cơ chế tim là cách Sunner thể hiện "tôi đồng tình" với Kudo này — vừa
là tín hiệu rank cho Highlight top-5 (US2), vừa là engagement chính sau khi đọc, vừa là input
cho sidebar `D.1.4_Số tim bạn nhận được`. Đây là vòng phản hồi cốt lõi của program.

**Independent Test**: tạo 2 user A và B; A gửi 1 Kudo. Verify (1) A click tim Kudo của mình →
nút disabled, không tăng count; (2) B click tim → `heart_count` của Kudo +1, A nhận +1 tim
vào `hearts_received_count`; (3) B click lần nữa → unlike, `heart_count` -1, A mất 1 tim;
(4) admin cấu hình hôm nay là special day → B thả tim → A nhận +2 tim, Kudo `heart_count`
vẫn chỉ +1; (5) B unlike → A mất 2 tim, `heart_count` -1.

**Acceptance Scenarios**:

1. **Given** một Kudo do user khác gửi mà tôi chưa thả tim, **When** tôi click nút Heart
   `C.4.1`, **Then** icon Heart chuyển sang trạng thái `liked` (active), `heart_count` của
   Kudo tăng 1, và `hearts_received_count` của sender tăng 1 (hoặc 2 nếu special day).
2. **Given** một Kudo tôi đã thả tim, **When** tôi click Heart lần nữa, **Then** icon Heart
   chuyển về trạng thái `unliked` (inactive), `heart_count` của Kudo giảm 1, và
   `hearts_received_count` của sender giảm đúng số đã cộng (1 hoặc 2).
3. **Given** một Kudo do chính tôi gửi, **When** tôi nhìn nút Heart `C.4.1`, **Then** nút
   Heart bị disabled — click không có tác dụng (TC `63645b03`).
4. **Given** một Kudo và tôi đã thả tim, **When** tôi cố click Heart lần nữa để thả thêm
   tim (tức là tăng thành 2 tim cho cùng 1 Kudo), **Then** hệ thống chặn — mỗi user 1 tim /
   Kudo (TC `91e102ba`).
5. **Given** admin đã cấu hình **2026-05-11** là special day, **When** tôi (user B) thả tim
   vào Kudo của user A vào ngày đó, **Then** A nhận **+2 tim** vào `hearts_received_count`
   thay vì +1 (TC `31936b72`); riêng `heart_count` của Kudo chỉ +1.
6. **Given** tôi đã thả tim vào ngày special-day, **When** tôi rút tim (sau khi special-day
   kết thúc), **Then** A **mất đúng 2 tim**, không phải 1 — DB lưu cờ `is_special_day_like`
   để hoàn trả chính xác (FR-009).
7. **Given** user A nhận đủ 10 Kudo (qua việc người khác gửi Kudo TỚI A), **When**
   `kudos_received_count` của A đạt 10, **Then** sao tier của A nâng lên 1 sao (xem FR-008);
   cơ chế thả tim ở US3 KHÔNG ảnh hưởng tới sao tier.

---

### User Story 4 — Cuộn feed All Kudos và xem chi tiết (Priority: P1)

Khối `C_All kudos` (`2940:13475`) là feed dọc tất cả Kudo của event, sắp theo thời gian giảm
dần. Card `C.3_KUDO Post` (`3127:21871`) hiển thị: avatar + tên người gửi (`C.3.1`), avatar +
tên người nhận (`C.3.3`), thời gian (`C.3.4`, format `HH:mm - MM/DD/YYYY`), nội dung
(`C.3.5`, max 5 dòng + `...`), gallery ảnh tối đa 5 ảnh (`C.3.6`), hashtag (`C.3.7`, tối đa
5 tag + `...`), action bar (`C.4`) gồm Heart + Copy Link.

User có thể:

- Click vào nội dung card → mở **Kudos detail page** (TC `8c0d1781` — route chính thức gắn
  với Q-LB4).
- Click avatar / tên người gửi hoặc người nhận → mở profile của Sunner đó.
- Click ảnh thumbnail trong gallery → mở ảnh full-size (TC `f9b68ffa`).
- Click hashtag → áp filter hashtag cho cả Highlight và All Kudos (TC `d01729d4`).
- Click **Copy Link** (`C.4.2`) → copy URL của Kudo vào clipboard, hiển thị toast
  `Link copied — ready to share!` (TC `0adfd7ce`).
- Scroll xuống cuối → infinite scroll load thêm Kudo cũ hơn (TC `9dfda316`).

**Why this priority**: feed là cột nội dung lớn nhất của trang. Highlight chỉ là 5 Kudo top;
phần còn lại của Kudos tồn tại ở đây. Nếu feed không hoạt động (không load được, không scroll
được, không click vào được) thì Live Board trở thành màn show 5 Kudo + sidebar — không phản
ánh được quy mô program.

**Independent Test**: tạo 50 Kudo trong DB. Vào `/sun-kudos`, verify (1) feed render Kudo mới
nhất trước; (2) scroll xuống → load thêm Kudo cũ; (3) click hashtag trên 1 Kudo → feed filter
đúng tag; (4) click Copy Link → clipboard có URL + toast hiện; (5) click avatar → mở profile.

**Acceptance Scenarios**:

1. **Given** có ≥ 20 Kudo trong DB, **When** tôi vào `/sun-kudos`, **Then** feed `C.2` hiển thị
   trang đầu (20 Kudo gần nhất), sắp theo `created_at DESC`.
2. **Given** tôi đang ở feed, **When** tôi scroll đến cuối trang, **Then** trang tự load thêm
   page kế tiếp (infinite scroll); khi không còn data → ngừng load, không lỗi.
3. **Given** một Kudo có nội dung > 5 dòng, **When** card được render, **Then** nội dung bị
   cắt còn 5 dòng + `...`; click vào nội dung → mở Kudos detail page với full nội dung.
4. **Given** một Kudo có > 5 hashtag, **When** card được render, **Then** hiển thị 5 tag đầu
   + `...`.
5. **Given** một Kudo có gallery ảnh, **When** tôi click vào thumbnail bất kỳ, **Then** ảnh
   full-size mở ra (TC `f9b68ffa`).
6. **Given** tôi đang xem một card, **When** tôi click nút Copy Link `C.4.2`, **Then** URL
   Kudo được copy vào clipboard (qua `navigator.clipboard.writeText`) và toast
   `Link copied — ready to share!` xuất hiện.
7. **Given** chưa có Kudo nào trong DB, **When** tôi load Live Board, **Then** feed hiển thị
   message `Hiện tại chưa có Kudos nào.` (TC `926d92a5`).
8. **Given** tôi click avatar hoặc tên trên card, **When** action được trigger, **Then** mở
   trang profile của Sunner đó. Hover lên avatar / tên trong > 300 ms (nếu nền tảng có hover)
   → hiện preview profile popup (linked frame `721:5827` — TC `2cd77a0c`, `630f42a3`).

---

### User Story 5 — Tìm Sunner trên Spotlight board (Priority: P2)

Khối `B.7_Spotlight` (`2940:14174`) là một **word cloud** tên các Sunner đã nhận Kudo trong
event. Header hiển thị tổng số Kudo `B.7.1` (`388 KUDOS` — query live từ DB), nút toggle
**Pan / Zoom** `B.7.2`, và search bar `B.7.3` (placeholder `Tìm kiếm`, max 100 ký tự).

User có thể:

- Hover lên một node → tooltip hiện tên + thời gian nhận Kudo gần nhất (TC `33ca8f8a`).
- Click một node → mở Kudos detail page tương ứng (TC `33ca8f8a`).
- Click `B.7.2` → toggle giữa mode **Pan** và **Zoom** (TC `cac4b7a3`).
- Gõ keyword vào `B.7.3` → highlight các node tên match (validate: ≤ 100 ký tự).

**Why this priority**: Spotlight là phần "đẹp / show off" của trang — nó kéo attention nhưng
không phải đường core dẫn đến hành động gửi Kudo. Vì vậy P2: nice-to-have nhưng không block
P1 (gửi Kudo + feed + Highlight + tim).

**Independent Test**: vào `/sun-kudos` khi có ≥ 50 Kudo. Verify (1) Spotlight render word cloud
với tên các Sunner đã nhận Kudo; (2) header hiển thị số Kudo tổng đúng (so với DB); (3)
hover node → tooltip; (4) click node → mở Kudos detail; (5) nhập 100 ký tự → search ok; nhập
101 ký tự → reject + error (TC `9e689933`).

**Acceptance Scenarios**:

1. **Given** có Kudo trong DB, **When** Spotlight load xong, **Then** hiển thị word cloud
   tên người nhận, label `<total> KUDOS` (con số live từ DB).
2. **Given** Spotlight đang load, **When** chưa nhận data, **Then** hiển thị loading state
   indicator (TC `d035e3b8`).
3. **Given** chưa có Kudo nào, **When** Spotlight load xong, **Then** hiển thị empty state
   message (cùng convention với feed).
4. **Given** Spotlight đã render xong, **When** tôi click `B.7.2_Pan zoom`, **Then** mode
   toggle giữa Pan và Zoom.
5. **Given** tôi hover lên một node trong > 300 ms, **When** tooltip trigger, **Then**
   hiển thị tên Sunner + thời gian nhận Kudo (TC `33ca8f8a`).
6. **Given** tôi click một node, **When** action được xử lý, **Then** mở Kudos detail page
   của Kudo gần nhất Sunner đó nhận được.
7. **Given** tôi nhập đúng 100 ký tự vào `B.7.3`, **When** tôi search, **Then** search chạy
   bình thường; nhập 101 ký tự → reject + error (TC `9e689933`).
8. **Given** tôi để trống `B.7.3` và Enter, **When** tôi cố search, **Then** search bị block
   và hiện required message (TC `9e689933`).

---

### User Story 6 — Sidebar thống kê và Mở quà (Priority: P2)

Sidebar `D_Thống menu phải` (`2940:13488`) bám ở cột phải Live Board, gồm:

- `D.1_Thống kê tổng quat` (`2940:13489`): **5 dòng thống kê** cá nhân của user đang đăng
  nhập (`D.1.5` là divider, không phải data):
  - `D.1.2_Số kudos nhận được` (`2940:13491`) — value = `kudos_received_count`.
  - `D.1.3_Số kudos đã gửi` (`2940:13492`) — value = `kudos_sent_count`.
  - `D.1.4_Số tim` (`3241:14882`) — value = `hearts_received_count` (xem US3).
  - `D.1.6_Số secret box đã mở` (`2940:13495`) — value = `secret_boxes_opened_count`.
  - `D.1.7_Số secret box chưa mở` (`2940:13496`) — value = `secret_boxes_pending_count`.
- `D.1.8_Button mở quà` (`2940:13497`): click → mở dialog Secret Box (`m0zV-VstXX` /
  `J3-4YFIpMM` — linked frame `1466:7676`, TC `43b54c29`).
- `D.3_10 SUNNER nhận quà` (`2940:13510`): leaderboard 10 Sunner nhận quà mới nhất; mỗi item
  có avatar + tên + mô tả phần thưởng; click → profile (TC `6b1e2359`).
- (Theo screen header) Leaderboard `10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT` — danh sách Sunner
  vừa tăng tier sao (1 sao = 10 Kudo nhận, 2 sao = 20, 3 sao = 50).

**Why this priority**: sidebar là phần "personal" + meta của trang — quan trọng để user thấy
"hôm nay mình đã đóng góp gì" nhưng không phải đường chính để tạo nội dung. P2.

**Independent Test**: đăng nhập với 1 user có dữ liệu Kudo đa dạng, vào `/sun-kudos`. Verify (1)
5 số thống kê đúng so với DB; (2) leaderboard có dữ liệu hoặc empty state; (3) click
"Mở quà" → mở Secret Box dialog; (4) click avatar trên leaderboard → mở profile của Sunner.

**Acceptance Scenarios**:

1. **Given** tôi đã đăng nhập, **When** Live Board load xong, **Then** sidebar `D.1` hiển thị
   5 số thống kê của tôi, query đúng từ DB (Kudos nhận, Kudos gửi, tim nhận, Secret Box đã
   mở, Secret Box chưa mở).
2. **Given** tôi đang xem sidebar và có ít nhất 1 Secret Box chưa mở
   (`secret_boxes_pending_count > 0`), **When** tôi click `D.1.8_Button mở quà`, **Then**
   dialog Secret Box mở ra (TC `43b54c29`).
2a. **Given** `secret_boxes_pending_count === 0`, **When** tôi nhìn nút `D.1.8`, **Then** nút
    ở trạng thái disabled — click không có tác dụng.
3. **Given** chưa có Sunner nào trong leaderboard, **When** sidebar render, **Then** khối
   tương ứng hiển thị message `Chưa có dữ liệu` (TC `d662780b`).
4. **Given** một Sunner mới thăng hạng vừa xảy ra, **When** dữ liệu cập nhật, **Then** tên
   Sunner đó xuất hiện đầu leaderboard `10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT`.
5. **Given** tôi click avatar hoặc tên trên leaderboard, **When** action được trigger,
   **Then** mở profile của Sunner đó. Hover → preview profile (TC `6b1e2359`).

---

### User Story 7 — Truy cập có authentication (Priority: P1, security)

Live Board là màn nội bộ — chỉ Sunner đã đăng nhập mới được vào. Mọi action (xem feed, thả
tim, mở quà, gửi Kudo) đều cần session hợp lệ.

**Why this priority**: P1 vì là rào chắn bảo mật cốt lõi — Principle IV (OWASP A01). Bỏ qua
thì bất kỳ ai cũng đọc / sửa Kudo nội bộ.

**Independent Test**: mở trình duyệt ẩn danh, truy cập `/sun-kudos` → bị redirect về `/login`.
Đăng nhập lại → quay về `/sun-kudos`.

**Acceptance Scenarios**:

1. **Given** tôi không đăng nhập, **When** tôi truy cập `/sun-kudos` hoặc bất kỳ action nào trên
   trang, **Then** server redirect tôi sang `/login` (TC `71b3ef43`).
2. **Given** tôi đã đăng nhập với role thường, **When** tôi cố gọi API admin (vd. cấu hình
   special day), **Then** server từ chối với 403 (Principle IV — A01 authorization server-side).
3. **Given** session của tôi expired, **When** tôi click bất kỳ action mutate (thả tim, mở
   quà, gửi Kudo), **Then** server trả 401, client redirect về `/login`.

---

### Edge Cases

- **Feed trống**: `Hiện tại chưa có Kudos nào.` (TC `926d92a5`, `9dfda316`) cho cả Highlight
  và All Kudos.
- **Leaderboard trống**: `Chưa có dữ liệu` (TC `d662780b`).
- **Spotlight đang load**: hiển thị loading indicator; data về → render word cloud (TC
  `d035e3b8`).
- **Tim race condition**: 2 user thả tim cùng lúc cho cùng Kudo → count cuối phải đúng (FR-010
  — atomic increment server-side).
- **Sender thả tim Kudo của chính mình**: nút disabled (TC `63645b03`).
- **User thả tim 2 lần liên tiếp**: lần 2 toggle về unlike (TC `7a7ec63e` + `91e102ba`).
- **Special day boundary**: tim thả lúc 23:59 ngày special day → +2 tim cho sender; thả lúc
  00:01 hôm sau → +1 tim (boundary by server-side `now()` ở timezone Asia/Ho_Chi_Minh, không
  phải client clock — chống tampering).
- **Search Spotlight > 100 ký tự**: reject + error (TC `9e689933`).
- **Search Spotlight rỗng + Enter**: required message, không gọi API (TC `9e689933`).
- **Filter hashtag + phòng ban đồng thời**: AND giữa 2 filter (Q-LB6 resolved). Phòng ban
  match cả sender hoặc receiver (Q-LB5 resolved).
- **Kudo content > 5 dòng**: truncate + `...`; click → detail page hiện đầy đủ.
- **Gallery > 5 ảnh**: chỉ hiện 5 thumbnail; ảnh thứ 6 trở đi truy cập qua detail page.
- **Feed stale do không realtime**: vì MVP không push realtime, Kudo / like từ user khác
  KHÔNG hiện ngay. User cần reload, đổi filter, hoặc bấm Refresh (FR-021) để thấy nội dung
  mới. Spec accept đây là trade-off của decision Q-LB2.
- **Network failure khi mutate (like, send Kudo, mở quà)**: optimistic UI đã apply → request
  fail → rollback state, hiện toast error generic (KHÔNG leak stack trace; Principle IV — A09).
- **Like spam click**: user click Heart liên tục trong < 500 ms → debounce client + idempotent
  server (UNIQUE constraint trên `kudos_likes` đảm bảo state cuối đúng).
- **Refresh click khi đang fetch**: nút Refresh disabled trong khi request đang chạy → tránh
  spam (FR-021).
- **Deep-link với filter query string**: vào `/sun-kudos?hashtag=Dedicated&dept=Marketing` →
  initial fetch áp filter ngay từ Server Component, không flash content unfiltered rồi mới
  filter (FR-005 + TR-008).
- **Secret Box hết quà**: `secret_boxes_pending_count === 0` → nút `D.1.8` disabled, click
  không trigger gì.

---

## UI/UX Requirements *(from Figma)*

### Screen Components

Bảng tóm tắt các component tương tác. Mọi node ID dùng cho implementer để fetch CSS / asset
on-demand qua `query_section`, `get_node`, `get_media_files`.

| Component | Node ID | Description | Interactions |
|-----------|---------|-------------|--------------|
| **A_KV Kudos** | `2940:13437` | Banner KV hero, logo `SAA 2025 KUDOS` + title `Hệ thống ghi nhận lời cảm ơn` | Readonly (TC `40d4ba26`) |
| **A.1_Button ghi nhận** (Ô nhập/Ghi nhận) | `2940:13449` | Single-line text input có pencil icon bên trái, placeholder `Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?` | Click → mở dialog Viết Kudo (`ihQ26W78P2`). Bản thân `A.1` chỉ là trigger (không validation tại chỗ); required check + dataType `string` áp dụng cho ô nội dung trong dialog. (TC `0578e8ef`, `b35d40c1`, `f183a3e4`, `ca8f60b3`) |
| **Header** (`Header` instance) | `2940:13433` | Header chung — logo, Language, Notification, avatar profile | Language → overlay `hUyaaugye2`; Notification → trang Tất cả thông báo (`6-1LRz3vqr`); Avatar → Dropdown — Profile overlay (`z4sCl3_Qtk`) |
| **B.1.1_ButtonHashtag** | `2940:13459` | Dropdown filter hashtag | Click → dropdown `1002:13013`; chọn tag → filter Highlight + All Kudos (TC `0929bc39`, `0e56cacb`) |
| **B.1.2_Button Phong ban** | `2940:13460` | Dropdown filter phòng ban | Click → dropdown `721:5684`; chọn phòng → filter Highlight + All Kudos (TC `7b029a3b`, `159fed13`) |
| **B.2_HIGHLIGHT KUDOS** | `2940:13461` | Carousel 5 card top Kudo theo tim | Slide qua Prev/Next; active card nổi bật, các card khác mờ (TC `86092c3a`) |
| **B.3_KUDO - Highlight** | `2940:13465` | Card Kudo nổi bật (sender/receiver info, time, content, hashtags, action) | Click content → detail; click avatar/name → profile; heart toggle; copy link; xem chi tiết (TC `67c21a05`, `f92dc686`) |
| **B.3.1 / B.3.5 Avatar** | `I2940:13465;335:9443;256:4734` / `I2940:13465;335:9446;256:4734` | Avatar người gửi / nhận | Click → profile; hover → preview popup (`721:5827`) (TC `2cd77a0c`, `630f42a3`) |
| **B.3.2 / B.3.6 Tên + sao** | `I2940:13465;335:9443;256:4737` / `I2940:13465;335:9446;256:4737` | Tên, phòng ban, số sao (3 mức) | Click name → profile; hover sao → tooltip giải thích tier (10/20/50 Kudo nhận = 1/2/3 sao) |
| **B.4.1_Thời gian đăng** | `I2940:13465;335:9449` | Time label trên Highlight card, format `HH:mm - MM/DD/YYYY` | Readonly |
| **B.4.2_Nội dung** | `I2940:13465;335:9450` | Card text trên Highlight card, **max 3 dòng + `...`** | Click → mở Kudos detail page |
| **B.4.3_Hashtag** | `I2940:13465;335:9458` | Tag chip trên card Highlight, max 5 tag + `...` | Click → apply Hashtag filter (TC `d01729d4`) |
| **B.4.4_Action** | `I2940:13465;335:9461` | Action bar Highlight: Heart + Copy Link + Xem chi tiết | Heart toggle; Copy Link → toast; `Xem chi tiết` → Kudos detail (TC `8c0d1781`) |
| **B.2.1 / B.2.2 Prev/Next** | `2940:13470` / `2940:13468` | Arrows trực tiếp trên carousel content | Click → slide; disabled ở slide đầu/cuối (TC `81446f61`) |
| **B.5.1 / B.5.3 Prev/Next** | `2940:13472` / `2940:13474` | Pager bar arrows dưới carousel (đồng bộ slide index với B.2.1/B.2.2) | Click → slide; disabled ở slide đầu/cuối |
| **B.5.2_số trang** | `2940:13473` | Label `n/5` | Cập nhật khi slide |
| **B.7_Spotlight** | `2940:14174` | Word cloud tên Sunner nhận Kudo | Hover node → tooltip; click → Kudos detail; pan/zoom (TC `ddf67e52`, `33ca8f8a`, `d035e3b8`) |
| **B.7.1_388 KUDOS** | `3007:17482` | Tổng số Kudo của event (live từ DB) | Readonly |
| **B.7.2_Pan zoom** | `3007:17479` | Toggle Pan/Zoom mode | Click → switch mode (TC `cac4b7a3`) |
| **B.7.3_Tìm kiếm sunner** | `2940:14833` | Search bar word cloud, max 100 ký tự | Type → highlight match (debounced); Enter **hoặc** click magnifier icon → submit search; validate: ≤ 100 ký tự, không required nhưng submit rỗng bị block (TC `1ce82447`, `d3877e54`, `9e689933`) |
| **C.2_Danh sách lời cảm ơn** | `2940:13482` | Feed dọc tất cả Kudo, sắp `created_at DESC` | Infinite scroll; empty state `Hiện tại chưa có Kudos nào.` (TC `9dfda316`, `926d92a5`) |
| **C.3_KUDO Post** | `3127:21871` | Card Kudo trong feed (sender, receiver, time, content, gallery, hashtags, action) | Click content → detail; click avatar/name → profile; gallery → ảnh full-size; hashtag → filter |
| **C.3.4_Time** | `I3127:21871;256:5229` | Thời gian đăng, format `HH:mm - MM/DD/YYYY` | Readonly |
| **C.3.5_Content** | `I3127:21871;256:5155` | Nội dung, max 5 dòng + `...` | Click → detail (TC `8c0d1781`) |
| **C.3.6_Image đính kèm** | `I3127:21871;256:5176` | Gallery ≤ 5 ảnh | Click ảnh → full-size (TC `f9b68ffa`) |
| **C.3.7_Hash tag** | `I3127:21871;256:5158` | Hashtag chip trên card feed | Click → filter (TC `d01729d4`) |
| **C.4.1_Hearts** | `I3127:21871;256:5175` | Nút Heart + đếm | Toggle like; mỗi like +1 tim (hoặc +2 tim nếu special day) vào `hearts_received_count` của sender, đồng thời `heart_count` của Kudo +1; disable nếu sender = viewer (TC `7a7ec63e`, `63645b03`, `91e102ba`, `31936b72`) |
| **C.4.2_Copy link button** | `I3127:21871;256:5216` | Copy URL Kudo | Click → clipboard + toast `Link copied — ready to share!` (TC `0adfd7ce`) |
| **D.1_Thống kê tổng quat** | `2940:13489` | 5 stat rows cá nhân (`D.1.5` là divider) | Readonly (đọc từ `/api/users/me/stats`) |
| **D.1.8_Button mở quà** | `2940:13497` | Mở Secret Box dialog | Click → dialog `1466:7676` (TC `43b54c29`). Disabled khi `secret_boxes_pending_count === 0` (không có quà chưa mở). |
| **D.3_10 SUNNER nhận quà** | `2940:13510` | Leaderboard 10 Sunner nhận quà mới nhất | Click avatar/name → profile; hover → preview (TC `6b1e2359`) |
| **Header cuối** (Footer) | `2940:13522` | Footer chung `Bản quyền thuộc về Sun* © 2025` | Readonly |

### Navigation Flow

**Incoming**:

- Từ Homepage SAA (`i87tDx10uM`) — block `Sun* Kudos` ở Homepage → `/sun-kudos` (route đề xuất —
  Q-LB1).
- Từ Header chung của các trang khác — nav `Kudos` → `/sun-kudos`.
- App entry sau đăng nhập, nếu có deep link `/sun-kudos` thì redirect tới sau khi xác thực.

**Outgoing**:

- `A.1` → **Viết Kudo dialog** (`ihQ26W78P2`).
- Search Sunner trong header / spotlight → **Profile của Sunner khác** (`w4WUvsJ9KI`).
- Avatar / tên trên Kudo card → **Profile của Sunner đó** (`w4WUvsJ9KI`).
- Hashtag click → apply filter in-page (KHÔNG navigate).
- `C.3.5` content click / `B.3` card click / `B.7` node click / `Xem chi tiết` button (trên
  Highlight action bar `B.4.4`) → **Kudos detail** route `/sun-kudos/{id}`. Khi entry là
  từ feed/Highlight trên Live Board, hiển thị qua **parallel modal** (Next.js intercepting
  routes) để giữ scroll position; deep-link / Copy Link / share → mở full page.
- `D.1.8 Mở quà` → **Open Secret Box dialog** (`m0zV-VstXX` / `J3-4YFIpMM`).
- Header Language → overlay `Dropdown — Language` (`hUyaaugye2`).
- Header avatar → overlay `Dropdown — Profile` (`z4sCl3_Qtk`).
- Header notification → **Tất cả thông báo** (`6-1LRz3vqr`).
- Click ảnh trong gallery → **Image lightbox** (in-page, không phải route mới).

### Behavioral / A11y Requirements

Responsive layout, touch-target sizing, color contrast, và animation timing đều theo
**Constitution III — Platform-Appropriate UI Patterns** (mobile-first viewport floor,
WCAG 2.1 AA contrast, motion respects `prefers-reduced-motion`). Spec không lặp lại các giá
trị cụ thể; implementer áp dụng theo Constitution.

Yêu cầu hành vi đặc thù cho màn này (KHÔNG phải styling):

- **Keyboard reachability**: `A.1`, Heart, Copy Link, Mở quà, Prev/Next (cả B.2 và B.5),
  Pan/Zoom, search `B.7.3`, hashtag chip, avatar/name, "Xem chi tiết" — đều phải tab tới
  được với thứ tự logic.
- **State announcements**:
  - Heart nút: `aria-pressed=true/false` theo trạng thái liked/unliked.
  - Pan/Zoom nút: `aria-pressed=true/false` theo mode active.
  - Hashtag / Phòng ban filter chips: `aria-pressed` khi đang active.
- **ARIA roles**:
  - Carousel `B.2`: `aria-roledescription="carousel"`, Prev/Next có `aria-label` chuẩn.
  - Empty state `Hiện tại chưa có Kudos nào.` / `Chưa có dữ liệu`: `role="status"` để screen
    reader đọc khi data rỗng.
  - Toast `Link copied — ready to share!`: `role="status"` + `aria-live="polite"`.
- **Search bar `B.7.3`**: `aria-label="Tìm kiếm Sunner"` (placeholder không thay thế label).
- **Hover preview profile**: vì hover-only không khả dụng cho keyboard / touch, MUST có
  phương án trigger trên focus (focus → show preview); click vẫn dẫn về profile.
- **Motion**: carousel auto-rotate (nếu có ở implementation) MUST tắt khi
  `prefers-reduced-motion: reduce`; heart toggle, pan/zoom transitions tương tự.

Giá trị màu / font / spacing / pixel cụ thể NẰM NGOÀI scope spec — implementer fetch qua
`query_section`, `get_node` ở Phase Implement.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST hiển thị Top 5 Kudo có `heart_count` cao nhất trong khối Highlight
  carousel `B.2_HIGHLIGHT KUDOS`, sắp giảm dần.
- **FR-002 (Manual refresh)**: MVP KHÔNG có realtime push. Feed `C_All kudos` + Highlight
  `B` chỉ refetch trong 3 trường hợp: (a) reload trang, (b) đổi filter Hashtag / Phòng ban,
  (c) user bấm nút **Refresh** rõ ràng trên page (xem FR-021). Sau khi user tự tạo Kudo từ
  US1, optimistic prepend Kudo mới vào đầu feed của chính user đó; Kudo của user khác chỉ
  hiện sau khi refresh.
- **FR-003**: Users MUST được mở dialog gửi Kudo khi click `A.1`. Form submit trống bị block
  (nút disabled). Submit hợp lệ lưu Kudo vào DB; client của chính user đó optimistic prepend
  Kudo mới vào feed. Sunner khác chỉ thấy sau khi họ refresh (FR-002).
- **FR-004**: System MUST validate input của Spotlight search `B.7.3` ở mức ≤ 100 ký tự;
  101 ký tự → reject + error; rỗng + Enter → required message, không gọi API.
- **FR-005**: Filter Hashtag (`B.1.1`) và Phòng ban (`B.1.2`) MUST áp dụng đồng thời cho **cả
  Highlight và All Kudos**. Pagination của feed reset về 1 khi filter đổi. **Scope** (Q-LB5
  resolved): filter Phòng ban match `sender_dept_id = X OR receiver_dept_id = X` — phản ánh
  "Kudo liên quan tới phòng X". **Combine** (Q-LB6 resolved): khi cả 2 filter active, dùng
  **AND** giữa Hashtag và Phòng ban (intersection — chỉ Kudo thỏa cả 2). OR giữa các giá trị
  trong cùng 1 filter (nếu sau này hỗ trợ multi-select).
- **FR-006**: User MUST chỉ thả được **1 tim** cho mỗi Kudo. Click lần 2 = unlike. Sender
  KHÔNG được thả tim Kudo của chính mình (`disabled`).
- **FR-007**: Mỗi tim hợp lệ MUST cộng cho sender **+1 tim** vào `hearts_received_count`
  trong ngày thường; **+2 tim** nếu thả vào special day (admin-configured). Đồng thời
  `heart_count` của Kudo +1 (không nhân đôi dù special day — counter này phản ánh số lượt
  like). Unlike MUST hoàn trả đúng số tim đã cộng (1 hoặc 2 — DB lưu cờ `is_special_day_like`,
  xem FR-009).
- **FR-008**: System MUST compute **sao tier** từ `kudos_received_count` theo công thức:
  1 sao = 10 Kudo nhận, 2 sao = 20, 3 sao = 50 (TC `67c21a05`). Hover trên cụm sao của Sunner
  hiện tooltip giải thích. Sao tier KHÔNG bị ảnh hưởng bởi cơ chế thả tim ở FR-007 — chỉ
  thay đổi khi Sunner nhận thêm Kudo.
- **FR-009**: DB MUST persist với mỗi like 1 dòng `kudos_likes`: `kudos_id`, `user_id`,
  `created_at`, `is_special_day_like` (boolean). UNIQUE (`kudos_id`, `user_id`). Khi unlike,
  delete dòng và hoàn trả đúng `1` hoặc `2` tim cho sender theo cờ.
- **FR-010**: Like / unlike MUST atomic ở server-side (transaction kết hợp `kudos_likes`
  insert/delete + `kudos.heart_count` update + `user.hearts_received_count` update) để không
  race khi 2 user cùng click; `heart_count` luôn nhất quán với số dòng trong bảng
  `kudos_likes`.
- **FR-011**: Click Copy Link trên card MUST copy URL Kudo (vd.
  `https://.../sun-kudos/{id}`) vào clipboard và hiển thị toast `Link copied — ready to
  share!`. URL share được phải mở full page Kudos detail (Q-LB4 resolved).
- **FR-012**: Click hashtag chip (`B.4.3` hoặc `C.3.7`) MUST áp filter Hashtag tương ứng cho
  Highlight + All Kudos (không navigate).
- **FR-013**: Click `D.1.8_Button mở quà` MUST mở dialog Secret Box (`m0zV-VstXX` hoặc
  `J3-4YFIpMM`).
- **FR-014**: Sidebar `D.1` MUST hiển thị 5 con số thống kê đúng từ `/api/users/me/stats`:
  `kudos_received_count`, `kudos_sent_count`, `hearts_received_count`,
  `secret_boxes_opened_count`, `secret_boxes_pending_count`.
- **FR-015**: Leaderboard `D.3` và "10 SUNNER thăng hạng mới nhất" MUST hiển thị empty state
  `Chưa có dữ liệu` khi rỗng.
- **FR-016**: Spotlight `B.7` MUST hiển thị 3 trạng thái: loading (indicator), empty (message),
  interactive (word cloud).
- **FR-017**: Pan/Zoom button MUST toggle giữa 2 mode; mặc định Pan.
- **FR-018**: Hover ≥ 300 ms lên avatar / tên trên Kudo card hoặc leaderboard MUST hiển thị
  preview profile popup (linked frame `721:5827`). Trên mobile / no-hover → bỏ qua, click
  vẫn dẫn về profile.
- **FR-019**: Feed `C.2` MUST hỗ trợ infinite scroll: load page kế tiếp khi user scroll gần
  cuối; ngừng khi hết data; không lỗi.
- **FR-020**: Empty state cho cả feed và Highlight MUST là cùng message `Hiện tại chưa có
  Kudos nào.`.
- **FR-021 (Refresh button)**: Live Board MUST có nút **Refresh** trên cùng feed (vd. gần
  header `C.1_Header Giải thưởng`). Click → refetch `/api/kudos/highlight` + `/api/kudos`
  (page 1) + `/api/users/me/stats` + 2 leaderboard + Spotlight count. Trong khi đang fetch,
  nút disabled + show loading indicator nhỏ. Refresh KHÔNG mất filter hiện tại — query
  string giữ nguyên. **Open** (Q-LB8): vị trí chính xác của nút (header trang vs trên feed
  vs sticky) — implementer chốt khi vào phase implement, ưu tiên reuse pattern từ Homepage
  / Awards nếu có.

### Technical Requirements

- **TR-001 (No realtime in MVP — Q-LB2 resolved)**: Hệ thống KHÔNG implement realtime push
  (SSE / WebSocket / 3rd party) cho MVP. Mọi đồng bộ feed-state đi qua manual refresh
  (FR-002 + FR-021). Có thể revisit ở milestone sau nếu metric SC-002 / SC-003 thấp hơn
  target và root cause là "stale feed". Khi đó re-open Q-LB2 với option SSE (recommend).
- **TR-002 (Performance)**: First Contentful Paint ≤ 2.5s ở 3G fast. Carousel Highlight,
  20 Kudo đầu của feed, và sidebar stat phải render được trong cùng một request initial
  (Server Component fetch) — KHÔNG để 3 spinner độc lập.
- **TR-003 (Auth)**: `/sun-kudos` MUST chỉ truy cập được khi có session hợp lệ qua Auth.js
  (Constitution Tech Stack). API mutate (like, send Kudo, mở quà) MUST authorize server-side,
  KHÔNG dựa client-supplied user ID (Principle IV — A01).
- **TR-004 (DB)**: Like / unlike phải atomic; `heart_count` MUST đồng nhất với số dòng
  `kudos_likes`. Special-day flag được set theo server-side `now()` ở timezone
  `Asia/Ho_Chi_Minh`, không phải client clock (chống tampering).
- **TR-005 (Image)**: Mọi avatar, ảnh gallery, KV background phải dùng `next/image`
  (Constitution Principle II). Domain hosting ảnh ngoài phải add vào `images.remotePatterns`
  trước khi ship (xem note ở memory).
- **TR-006 (Security)**: Toast `Link copied — ready to share!` xuất hiện nhanh dù
  `navigator.clipboard.writeText` fail (fallback dùng `document.execCommand('copy')`).
  Không log token, session, hoặc nội dung Kudo riêng tư khi error.
- **TR-007 (Scrollable sidebar)**: Sidebar `D` cuộn độc lập với feed `C` (cuộn dọc riêng khi
  vượt chiều cao viewport).
- **TR-008 (Filter URL — bidirectional)**: Khi user chọn Hashtag / Phòng ban filter, URL
  MUST cập nhật query string (vd. `?hashtag=Dedicated&dept=Marketing`) để có thể share /
  bookmark / reload giữ filter. **Ngược lại**: khi mount `/sun-kudos` với query string có sẵn,
  Server Component MUST đọc query → áp filter ngay trong initial fetch (Highlight + feed
  trang 1), không render unfiltered rồi mới hot-replace.

### Key Entities

- **Kudo** (`kudos`): `id`, `sender_user_id`, `receiver_user_id`, `content` (≤ X chars —
  chốt ở implementation), `created_at`, `heart_count` (denormalized counter), `hashtags`
  (relation), `images` (≤ 5, relation hoặc JSON array).
- **KudoLike** (`kudos_likes`): `id`, `kudos_id` FK, `user_id` FK, `created_at`,
  `is_special_day_like` (boolean). UNIQUE (`kudos_id`, `user_id`).
- **Hashtag** (`hashtags`): `id`, `name` (vd. `Dedicated`, `Inspiring`, `IDOL GIỚI TRẺ`).
- **KudosHashtag**: many-to-many giữa `kudos` và `hashtags`.
- **Department** (`departments`): `id`, `name` (vd. `Marketing`); liên kết với `users`.
- **User**: tái dùng Auth.js User; thêm `department_id`, `title` (vd. `Top Talent`),
  `avatar_url`, và 5 denormalized counter để serve sidebar `D.1` + sao tier:
  `kudos_received_count`, `kudos_sent_count`, `hearts_received_count`,
  `secret_boxes_opened_count`, `secret_boxes_pending_count`. Sao tier (0..3) là **virtual /
  computed** từ `kudos_received_count` (10/20/50 thresholds — FR-008), không lưu cột riêng.
- **SpecialDay** (`special_days`): `id`, `date` (DATE), `description`. Admin CRUD; query để
  set `is_special_day_like` khi like.
- **SecretBox** (`secret_boxes`): `id`, `user_id`, `state` (`pending` / `opened`),
  `awarded_at`, `gift_id`.
- **Gift** (`gifts`): `id`, `name`, `value`, `description` — phần thưởng hiển thị ở
  leaderboard `D.3`.

Bảng cụ thể chốt ở `momorph.database`. Spec chỉ phác để API + UI có context.

---

## API Dependencies

| Endpoint | Method | Purpose | Status | Triggered by |
|----------|--------|---------|--------|--------------|
| `/api/kudos/highlight` | GET | Lấy top 5 Kudo theo `heart_count` (kèm filter hashtag, dept) | New | Mount US2 |
| `/api/kudos` | GET | Feed `C_All kudos` (cursor pagination, filter hashtag, dept) | New | Mount US4 + infinite scroll |
| `/api/kudos` | POST | Tạo Kudo mới (gọi từ dialog Viết Kudo) | New | Submit US1 |
| `/api/kudos/{id}` | GET | Lấy detail 1 Kudo | New | Click content / `Xem chi tiết` |
| `/api/kudos/{id}/like` | POST | Thả tim (atomic, áp dụng special-day logic) | New | Heart click US3 |
| `/api/kudos/{id}/like` | DELETE | Rút tim (hoàn trả `+1` hoặc `+2` tim cho sender theo cờ `is_special_day_like`) | New | Heart click US3 |
| `/api/kudos/spotlight` | GET | Tổng số Kudo + danh sách Sunner nhận Kudo (word cloud) | New | Mount US5 |
| `/api/sunners/search?q=` | GET | Search Sunner cho `B.7.3` (≤ 100 ký tự) | New | US5 search |
| `/api/users/me/stats` | GET | 5 counter cho sidebar `D.1` (`kudos_received_count`, `kudos_sent_count`, `hearts_received_count`, `secret_boxes_opened_count`, `secret_boxes_pending_count`) | New | Mount US6 |
| `/api/sunners/top-receivers?limit=10` | GET | Leaderboard `D.3_10 SUNNER nhận quà` | New | Mount US6 |
| `/api/sunners/recent-rankups?limit=10` | GET | Leaderboard 10 Sunner thăng hạng mới nhất | New | Mount US6 |
| `/api/hashtags` | GET | Danh sách hashtag cho dropdown `B.1.1` | New | Open filter |
| `/api/departments` | GET | Danh sách phòng ban cho dropdown `B.1.2` | New | Open filter |
| `/api/secret-boxes/open` | POST | Mở Secret Box | New | Click `D.1.8` |
| `/api/notifications/unread-count` | GET | Badge số thông báo trên Header | New | Mount header |
| `/api/admin/special-days` | POST/PATCH | Admin cấu hình special day | New (admin only) | Admin route |

Tất cả endpoint MUST authorize server-side (Principle IV — A01). Mutate endpoint MUST validate
input schema trước khi commit (Principle IV — A03).

---

## State Management

### Local component state

- Carousel state: `currentSlideIndex`, `totalSlides` (1..5).
- Filter state: `selectedHashtag`, `selectedDepartment` — sync với URL query (TR-008).
- Spotlight state: `mode` (`pan` | `zoom`), `searchQuery`, `loading`.
- Toast state: `Link copied` (auto-dismiss sau ~3s).

### Server-fetched (Server Components)

- Initial Highlight 5 Kudo.
- Initial feed page 1 (20 Kudo).
- Sidebar stats + 2 leaderboards.
- Spotlight tổng số Kudo + danh sách Sunner.
- Hashtag list, Department list.

### Client cache + invalidation

- **Khi tạo Kudo mới (US1) thành công**: optimistic prepend vào feed của user tạo Kudo; rollback
  nếu API fail.
- **Khi like / unlike**: optimistic toggle (icon + count) trên card; rollback nếu API fail.
  Counter ở sidebar `D.1.4` cũng update ngay nếu là Kudo của chính user (sender).
- **Filter đổi (Hashtag / Phòng ban)**: invalidate cache feed + highlight, fetch lại trang 1;
  URL query string update đồng thời (TR-008).
- **Refresh button click (FR-021)**: invalidate toàn bộ cache màn (highlight + feed +
  sidebar stats + 2 leaderboard + spotlight count), fetch lại; giữ filter.
- **Không có realtime / polling** → tất cả các update từ user khác chỉ thấy sau refresh.

### Global state needs

- Session (Auth.js — `auth()`).
- Locale (i18n — gắn với header Language dropdown).
- Toast notifications (toast queue dùng chung).

---

## Success Criteria

### Measurable Outcomes

- **SC-001 (Activation)**: ≥ 60 % nhân sự active mỗi tuần mở `/sun-kudos` ít nhất 1 lần
  trong event.
- **SC-002 (Engagement)**: trung bình ≥ 3 tim được thả / Sunner / ngày của event.
- **SC-003 (Creation)**: ≥ 200 Kudo mới tạo / ngày trong tuần đầu event.
- **SC-004 (Stability)**: tỉ lệ lỗi 5xx của `/api/kudos*` ≤ 0.5 %.
- **SC-005 (Stale tolerance)**: vì không realtime, theo dõi metric "interval giữa lúc Kudo
  được tạo và lúc người khác thấy nó (qua refresh)" — target median ≤ 5 phút. Nếu vượt, đây
  là tín hiệu cần re-open Q-LB2 để bật polling/SSE.

---

## Out of Scope

- **Cấu hình special day**: là feature admin riêng (CRUD `special_days`), không nằm trong
  Live Board UI. Chỉ tiêu thụ giá trị ở chỗ thả tim.
- **Tạo / sửa hashtag, phòng ban**: do admin quản; Live Board chỉ đọc.
- **Kudos detail page** đầy đủ: ngoài scope màn này — gắn với screen `(TBD)` Kudos detail.
- **Viết Kudo dialog**: gắn với màn `ihQ26W78P2`; Live Board chỉ trigger mở dialog.
- **Open Secret Box dialog** chi tiết: gắn với màn `m0zV-VstXX` / `J3-4YFIpMM`.
- **Mobile native (iOS / Android)**: chỉ web-first; iOS variant (`8HGlvYGJWq` nếu có) chốt
  riêng ở Q-LB3.
- **Notification list page**: gắn với màn `6-1LRz3vqr`.
- **Admin dashboard**.

---

## Dependencies

- [x] Constitution document tồn tại (`.momorph/constitution.md`)
- [x] Screen flow documented — đã thêm `MaZUn5xHXZ` vào cả `.momorph/SCREENFLOW.md` +
      `.momorph/contexts/SCREENFLOW.md` (Navigation Graph cho Live Board) trong session
      2026-05-11.
- [ ] **Outgoing nav targets cần document trong SCREENFLOW trước khi plan phase**
      (Constitution III — Evidence-Based Navigation):
  - `w4WUvsJ9KI` — Profile (Sunner khác).
  - `6-1LRz3vqr` — Tất cả thông báo (full route vs panel chưa rõ).
  - `m0zV-VstXX` / `J3-4YFIpMM` — Secret Box dialog (đang reference `1466:7676` linked frame).
  - Kudos detail screen — chưa được survey; route phụ thuộc Q-LB4.
- [ ] API specifications available (`.momorph/API.yml`) — **cần update với endpoint mới ở
      phần API Dependencies**.
- [ ] Database design completed (`.momorph/database.sql`) — **cần thêm `kudos`,
      `kudos_likes`, `hashtags`, `kudos_hashtags`, `special_days`, `secret_boxes`, `gifts`,
      `departments`, các cột bổ sung trên `User`** (xem § Key Entities).
- ~~Realtime infrastructure~~ — Q-LB2 resolved: KHÔNG cần realtime cho MVP.

---

## Open Items

Trạng thái tất cả Q-LB sau session 2026-05-11. **Q-LB1, Q-LB2, Q-LB4, Q-LB5, Q-LB6, Q-LB7
resolved**; **Q-LB3 deferred**; chỉ Q-LB8 còn open (implementation detail).

- ✅ **Q-LB1 (resolved) — Route**: **`/sun-kudos`**. Lý do: route này đã được reference trong
  Homepage spec, Awards spec (D2.1), và prelaunch-gate whitelist; đồng nhất với brand "Sun*
  Kudos".
- ✅ **Q-LB2 (resolved) — Auto-update**: **Manual refresh only** cho MVP. KHÔNG realtime /
  polling / SSE / WebSocket. Feed update qua reload, đổi filter, hoặc nút Refresh (FR-002 +
  FR-021). Re-open câu này (recommend SSE) nếu SC-005 cho thấy median stale interval > 5 phút.
- 🅿 **Q-LB3 (deferred) — Mobile strategy**: chưa care đến mobile cho MVP. Mặc định để code
  responsive nhẹ theo Constitution III khi implement, nhưng KHÔNG dedicate effort cho iOS
  variant `8HGlvYGJWq`. Revisit sau khi survey iOS frame.
- ✅ **Q-LB4 (resolved) — Kudos detail**: **Full route `/sun-kudos/{id}` + parallel modal**.
  Pattern: dùng Next.js intercepting routes — vào từ Live Board (feed/Highlight) → render
  modal (giữ scroll); deep-link / Copy Link / share → render full page tại `/sun-kudos/{id}`.
- ✅ **Q-LB5 (resolved) — Filter Phòng ban scope**: match **cả sender lẫn receiver**
  (`sender_dept_id = X OR receiver_dept_id = X`). Semantic: "Kudo liên quan phòng X".
- ✅ **Q-LB6 (resolved) — Multi-filter combine**: **AND** giữa Hashtag và Phòng ban
  (intersection). OR giữa các giá trị trong cùng filter (nếu sau hỗ trợ multi-select).
- ✅ **Q-LB7 (resolved) — Star tier nguồn**: phân biệt 2 khái niệm "hearts" (tim) và "stars"
  (sao):
  - **Hearts (tim)**: counter `hearts_received_count` của User, +1 / +2 mỗi lần Kudo của user
    được like; show ở `D.1.4`. Cơ chế ở FR-007 / US3.
  - **Stars (sao)**: tier badge 0..3, tính từ `kudos_received_count` theo ngưỡng 10/20/50
    (FR-008). Show qua tooltip ở `B.3.2` / `B.3.6` / `C.3.1` / `C.3.3`. Hoàn toàn KHÔNG bị
    ảnh hưởng bởi cơ chế thả tim.
  - Lý do: tooltip B.3.2 (TC `67c21a05`) định nghĩa stars = Kudo received count. Mô tả
    "+1 / +2 star per heart" trong design item inventory là transcription error — TC
    `31936b72` (mô tả tự nhiên hơn) ghi "+2 hearts per like" trên special day, phù hợp với
    semantic "tim cộng cho người được nhận Kudo".
- ⚠ **Q-LB8 (open — implementation-level) — Refresh button position**: nên đặt nút Refresh
  ở đâu? Options: (a) header trang `C.1`; (b) sticky trên feed; (c) trong sidebar `D.1`;
  (d) floating action button. Khuyến nghị: gần header `C.1_Header Giải thưởng` (a) để cùng
  visual context với filter. Chốt ở phase implement, không block plan.

---

## Notes

- Frame revision: `904fca587cc5bbddf4075c207e680277` (snapshot 2026-01-30). Mọi node ID
  trong spec gắn với revision này.
- Linked frames overlay / popup được dùng: `1002:13013` (Hashtag dropdown), `721:5684`
  (Department dropdown), `721:5827` (Profile preview popup hover), `1466:7676` (Secret Box
  dialog), Header instances (`Language` overlay → `hUyaaugye2`; `Profile` overlay →
  `z4sCl3_Qtk`).
- Spec **không** chứa giá trị CSS / màu / font / spacing / pixel (đã verified qua grep
  trong spec review 2026-05-11) — implementer sẽ fetch qua `query_section`, `get_node`,
  `list_media_nodes`, `get_media_files` ở Phase Implement.
- Cross-reference SCREENFLOW: `MaZUn5xHXZ` + navigation graph đã được thêm vào cả
  `.momorph/SCREENFLOW.md` (Screen Index) và `.momorph/contexts/SCREENFLOW.md` (Navigation
  Graph chi tiết) trong session 2026-05-11. Khi Q-LB1 (route) và Q-LB4 (Kudos detail route)
  được chốt, cần cập nhật lại 2 file SCREENFLOW kèm `Route (proposed)` → `Route (locked)`.
  Các target navigation chưa được document (`w4WUvsJ9KI`, `6-1LRz3vqr`, secret box dialogs,
  Kudos detail) đã được liệt kê ở § Dependencies — phải hoàn thành trước plan phase
  (Constitution III).
- Spec review pass 2 (2026-05-11): cleanup stale references còn lại sau pass 1 (`6 stat`,
  `View Details`, `Rút tim hoàn trả sao`), thêm `A.1` clarification (Required apply ở dialog,
  không ở chính trigger), `D.1.8` disabled state, `B.7.3` search icon trigger, edge cases
  network-failure / spam click / deep-link với filter, và TR-008 bidirectional URL sync.
- Decision lock session 2026-05-11 (Q-LB1..Q-LB7): route `/sun-kudos`, **no realtime cho MVP**
  (manual refresh + FR-021 Refresh button), Kudos detail `/sun-kudos/{id}` + parallel modal,
  Phòng ban filter cả sender lẫn receiver, multi-filter AND, hearts ≠ stars. Q-LB3 mobile
  deferred; Q-LB8 (Refresh button position) parked tới phase implement. Sau lock này, đã
  strip toàn bộ FR/TR/edge-cases/state-mgmt/SC liên quan realtime; thêm FR-021 + SC-005.
