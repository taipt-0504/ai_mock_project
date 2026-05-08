# Implementation Plan: Dropdown-profile (biến thể user)

**Frame**: `z4sCl3_Qtk-dropdown-profile`
**Date**: 2026-05-08
**Spec**: [spec.md](spec.md)

---

## Summary

`Dropdown — Profile (biến thể user)` đã ship cùng Homepage SAA Phase 13 (file [src/components/home/ProfileButton.tsx](../../../src/components/home/ProfileButton.tsx), 7 unit test xanh). Plan này gói gọn **một follow-up duy nhất** để khoá hoàn toàn behavior contract của spec: bổ sung Escape keydown listener (FR-007 / US4 #3 / Resolved Question Q2) — đóng menu và trả focus về trigger khi nhấn `Escape`.

**Phạm vi giới hạn**:

- KHÔNG re-implement gì khác. Mọi behavior đã có (click-outside, ARIA, fallback avatar, signout form, navigation) giữ nguyên.
- KHÔNG đụng đến CSS/visual treatment — pass đó (nếu có) thuộc lần `momorph.implement-ui` riêng dùng `query_section`.
- KHÔNG triển khai biến thể admin (`54rekaCHG1`) — chờ `User.role` migration ship (Resolved Question Q4).
- KHÔNG xử lý mobile responsive — đẩy sang phase polish (Resolved Question Q3).
- KHÔNG tạo trang `/profile` — chấp nhận 404 ngắn hạn (Resolved Question Q1).

**Tiếp cận kỹ thuật**: Lấy *idea* (not exact code) từ Escape branch của [src/components/header/LanguageSelector.tsx](../../../src/components/header/LanguageSelector.tsx) (`onMenuKeyDown` lines 126-131: `setIsOpen(false); triggerRef.current?.focus()`). **Chú ý drift**: spec FR-007 viết "pattern y hệt LanguageSelector" — nhưng LanguageSelector dùng `onKeyDown` JSX prop trên menu div, vốn chỉ bắt event khi focus đang trong menu. Cách đó đủ cho LanguageSelector vì menu auto-focus menuitem khi mở (lines 74-81). ProfileButton thì KHÔNG auto-focus menuitem — nên dùng JSX-prop sẽ miss case "user mở menu, Escape ngay khi focus còn ở trigger". Plan chọn **document-level `keydown` listener trong `useEffect`** để bắt được mọi vị trí focus (chi tiết & lý do ở Architecture Decisions). TDD: viết failing test trước, implement sau.

---

## Technical Context

**Language/Framework**: TypeScript 5 strict mode + Next.js 16 (App Router) + React 19
**Primary Dependencies**: Tailwind CSS v4 (tokens trong `app/globals.css`), `next/image`, `next/link`
**Database**: N/A — overlay không truy cập DB; signout đi qua NextAuth handler đã ship
**Testing**: Vitest 4 (unit) + React Testing Library + jsdom; Playwright 1.59 (e2e regression cho Homepage)
**State Management**: Local `useState` / `useRef` (không có store global) — đúng pattern Constitution Principle II ("lift state to lowest common ancestor")
**API Style**: REST — chỉ phụ thuộc 1 endpoint `POST /api/auth/signout` (NextAuth, đã ship)

---

## Constitution Compliance Check

*GATE: Phải pass trước khi implement. Mỗi mục map vào nguyên tắc trong [.momorph/constitution.md](../../constitution.md).*

- [x] **Principle I — Clean Code & Readable Structure**: thay đổi tập trung trong 1 file (`ProfileButton.tsx`); thêm 1 ref + 1 useEffect; không tăng độ lồng nhau, không thêm helper module mới. Naming nhất quán (`triggerRef` — y hệt LanguageSelector).
- [x] **Principle II — Stack Best Practices**: vẫn là Client Component (cần `useState`/`useEffect`/`useRef`); không thêm dependency mới (TR-004 của spec); Tailwind tokens không bị đụng (chỉ thêm logic JS); không có `any`.
- [x] **Principle III — Platform-Appropriate UI Patterns**: pass-through WCAG 2.1 AA — Escape là hành vi keyboard a11y bắt buộc cho disclosure pattern; trả focus về trigger tránh lost-focus state cho screen reader user. Không đụng responsive / motion behavior.
- [x] **Principle IV — OWASP Secure Coding**: thay đổi này không mở trust boundary mới; không có input validation mới (Escape là local DOM event); không log/persist gì mới. Threat model bên dưới.
- [x] **Principle V — Test-Driven Development**: viết 2 ca test trước Phase 2 — (i) happy path "press Escape closes menu and focuses trigger" (đỏ ngay vì chưa có handler), (ii) edge case "press Escape while menu is closed is a no-op" (xanh ngay; là regression-guard). Implement → cả 2 ca xanh → commit.

**Threat model summary** *(Principle IV)*:

- **Trust boundaries**: browser ↔ Next.js server (signout đi qua NextAuth POST), DOM event (Escape) — không vượt boundary nào mới so với code đã ship.
- **Sensitive data handled**: chỉ `session.user.name` + `session.user.image` (đã đọc qua `auth()` ở Server Component parent, truyền props xuống). Không có new sensitive data.
- **Abuse cases to test**: (1) Escape khi menu đóng → KHÔNG được throw / KHÔNG được tạo focus shift bất thường; (2) Escape khi `triggerRef.current === null` (race condition unmount) → fallback an toàn `?.focus()` optional chain. Không có abuse case mức cao (signout đã có CSRF protection của NextAuth).

**Violations (nếu có)**: Không.

| Principle | Violation | Justification | Alternative Rejected |
|-----------|-----------|---------------|---------------------|
| —         | —         | —             | —                   |

---

## Architecture Decisions

### Frontend Approach

- **Component Structure**: giữ nguyên — 1 file `ProfileButton.tsx`, leaf reusable component, không tách module mới.
- **Styling Strategy**: KHÔNG đụng. Chỉ thay đổi JS logic.
- **Data Fetching**: KHÔNG đụng. Component vẫn nhận `name`/`image`/`locale` qua props (FR-010).
- **Keyboard event handling pattern**: dùng **document-level `keydown` listener** trong `useEffect` (active khi `isOpen === true`, gỡ khi đóng) — y hệt pattern click-outside đã có. Lý do chọn document-level thay vì menu-level (`onKeyDown` trên div):

  | Cách | Bắt được Escape khi… | Phù hợp ProfileButton? |
  |---|---|---|
  | `onKeyDown` trên menu div (như LanguageSelector) | focus đang trong menu | KHÔNG đủ — ProfileButton không auto-focus menuitem khi mở (US1 chỉ cần menu hiện), nên focus có thể đang ở trigger |
  | document `keydown` listener (đề xuất) | bất kỳ đâu trên trang | ✅ — bắt cả khi focus ở trigger lẫn khi đã tab vào menuitem |

  Lựa chọn document-level cũng đối xứng với click-outside (`mousedown` trên document) — ít branch logic hơn cho một disclosure đơn giản. Khi mở rộng sang biến thể admin (`54rekaCHG1` future spec), pattern này tái dùng được nguyên vẹn.

### Backend Approach

- N/A. Không có API mới, không sửa schema, không sửa repository/service.

### Integration Points

- **Existing Services**: Auth.js `auth()` (đã đọc ở Server Component parent — KHÔNG ĐỤNG).
- **Shared Components**: KHÔNG có. Component này độc lập.
- **API Contracts**: KHÔNG đụng `/api/auth/signout` (NextAuth handler shipped).

---

## Project Structure

### Documentation (feature này)

```text
.momorph/specs/z4sCl3_Qtk-dropdown-profile/
├── spec.md              # Spec đã review (3 vòng)
├── plan.md              # File này
└── tasks.md             # Sẽ tạo bởi /momorph.tasks
```

KHÔNG cần `research.md` (component đã ship, codebase context đã rõ trong spec) hoặc `contract.md` (không có API mới).

### Source Code (vùng ảnh hưởng)

```text
# Frontend — DUY NHẤT 1 file source thay đổi
src/components/home/
└── ProfileButton.tsx    # Thêm triggerRef + Escape useEffect

# Tests — DUY NHẤT 1 file test sửa
tests/unit/components/home/
└── ProfileButton.test.tsx   # Thêm đúng 2 ca: happy path (mở + Escape) + edge case (Escape khi đóng)
```

KHÔNG có file mới trong `app/`, `src/lib/`, `src/services/`, `src/repositories/`, `prisma/`, hay `tests/e2e/`. Existing Playwright Homepage E2E (11/11 xanh) không cần test mới — Escape là unit-level a11y, vitest đủ.

**Chi tiết thay đổi trong [src/components/home/ProfileButton.tsx](../../../src/components/home/ProfileButton.tsx)** (line numbers theo file hiện tại):

| Vị trí | Thao tác | Code (rút gọn) |
|---|---|---|
| Sau line 5 (`useEffect, useRef, useState`) | Thêm import `KeyboardEvent` nếu cần (thực tế DOM event đủ — không cần) | (no import change) |
| Line 19 (sau `const [isOpen, ...]`) | Thêm `const triggerRef = useRef<HTMLButtonElement>(null);` | `const triggerRef = useRef<HTMLButtonElement>(null);` |
| Line 41 (`<button type="button" onClick={...}>`) | Gắn `ref={triggerRef}` | `<button ref={triggerRef} type="button" ...>` |
| Sau khối `useEffect` ở lines 22-34 (click-outside) | Thêm `useEffect` thứ hai cho Escape — active khi `isOpen === true`, gỡ khi đóng | xem snippet bên dưới |

```ts
useEffect(() => {
  if (!isOpen) return;
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };
  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, [isOpen]);
```

**Chi tiết test bổ sung trong [tests/unit/components/home/ProfileButton.test.tsx](../../../tests/unit/components/home/ProfileButton.test.tsx)**:

```ts
import userEvent from "@testing-library/user-event";

it("pressing Escape while menu is open closes it and returns focus to trigger", async () => {
  const user = userEvent.setup();
  render(<ProfileButton locale="vi-VN" name="Alice" image={null} />);
  const trigger = screen.getByRole("button", { name: "Alice" });
  await user.click(trigger);
  expect(screen.getByRole("menu")).toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  expect(document.activeElement).toBe(trigger);
});

it("pressing Escape while menu is closed is a no-op (no error, menu stays absent)", async () => {
  const user = userEvent.setup();
  render(<ProfileButton locale="vi-VN" name="Alice" image={null} />);
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
});
```

`@testing-library/user-event@14.6.1` đã có sẵn trong `package.json` — không cần install thêm.

### Dependencies

- KHÔNG có package mới cần install. TR-004 cấm Radix/Headless/Floating UI; React 19 native là đủ.

---

## Implementation Strategy

### Phase Breakdown

1. **Phase 0 — Asset Preparation**: SKIP. Không có asset mới. Icon user / chevron mô tả trong Figma vẫn pending CSS pass riêng (không thuộc plan này).
2. **Phase 1 — TDD Red**: thêm 2 ca test (đã viết sẵn trong "Project Structure" ở trên) vào [tests/unit/components/home/ProfileButton.test.tsx](../../../tests/unit/components/home/ProfileButton.test.tsx). Chạy `npm test -- ProfileButton` → ca đầu (happy path) đỏ; ca thứ hai (Escape closed = no-op) thực tế xanh ngay vì hiện chưa có handler Escape (Escape đóng = không thay đổi gì = đúng), nhưng giữ trong suite để chống regression khi Phase 2 thêm logic.
3. **Phase 2 — Implement**: áp đúng 4 thay đổi liệt kê trong "Chi tiết thay đổi trong ProfileButton.tsx" ở trên. Cleanup `removeEventListener` đã có trong snippet (TR-003 spec). Chạy `npm test -- ProfileButton` → cả 9 ca xanh (7 cũ + 2 mới).
4. **Phase 3 — Regression Verify**:
   - `npm test` → tất cả vitest xanh (baseline 184/184 + 2 mới = **186/186**)
   - `npm run test:e2e -- home` → Playwright filter sang `tests/e2e/home/`, kỳ vọng 11/11 (Escape không đụng FAB/notification/profile/awards/header flow)
   - `npm run lint` clean
   - `npx tsc --noEmit` clean
5. **Phase 4 — Spec hygiene sync** (sau khi Phase 3 xanh; line numbers gần đúng — confirm bằng grep nếu spec đã có edit khác):
   - Trong [spec.md](spec.md):
     - **US4 scenario 3** (~line 118): bỏ caveat italic `*(Behavior contract hard; code hiện tại chưa có keydown listener — follow-up task ghi ở mục Dependencies, chi tiết ở Resolved Question Q2.)*` — Escape đã có code, không còn caveat.
     - **Status line** (~line 7): bỏ cụm `với 1 follow-up đã chốt: bổ sung Escape keydown listener (Resolved Question Q2)` — follow-up đã DONE.
     - **Implementation Status "Những gì code đã làm"** (~line 27): bổ sung clause cuối cùng: "Escape keydown listener (document-level, active khi menu mở) đóng menu + trả focus về trigger".
     - **Dependencies checkbox** (~line 282): chuyển `[ ] Bổ sung Escape keydown listener cho ProfileButton` → `[x] Escape keydown listener (đã ship 2026-05-XX commit ...)`.
     - **Resolved Question Q2**: thêm gạch chân ở đầu: `**Implemented 2026-05-XX cùng commit ...**` để phân biệt resolved-decision (decision time) với implemented (code time).
   - Spec FR-007 (~line 192) hiện viết "y hệt LanguageSelector" — đây là chỗ phát sinh drift (xem Architecture Decisions). Cập nhật thành: "Pattern document-level keydown listener trong useEffect (không phải JSX onKeyDown — vì ProfileButton không auto-focus menuitem khi mở; bắt được Escape kể cả khi focus còn ở trigger)". Đồng bộ với plan.
   - Trong [.momorph/SCREENFLOW.md](../../SCREENFLOW.md): không cần đụng (SCREENFLOW không track keyboard internals).
   - Homepage spec: KHÔNG đụng (không reference Escape).

### Vertical-slice vs horizontal-layer

Vertical slice một-shot: test → code → verify cho cùng 1 acceptance scenario (US4 scenario 3). Không có user story cần chia nhỏ thêm.

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Escape listener bắt event khi đang gõ trong input ở nơi khác trên trang → đóng menu nhầm khi user gõ Escape | Low | Low | Listener chỉ active khi `isOpen === true` và menu đang mở; trang Homepage không có input trong overlay này. Acceptable. |
| `triggerRef.current === null` khi gọi `.focus()` (race với unmount) | Low | Low | Dùng optional chain `triggerRef.current?.focus()` — null-safe. |
| Cleanup useEffect leak khi component unmount giữa lúc menu mở | Low | Med | Cleanup function gỡ `removeEventListener` — pattern y hệt click-outside đã có; không khác biệt. |
| Test phụ thuộc jsdom focus simulation → flaky | Low | Med | RTL `userEvent.keyboard("{Escape}")` đáng tin hơn `fireEvent.keyDown`; assert `triggerRef`'s element có `document.activeElement === trigger`. Nếu jsdom limit, dùng spy trên `triggerRef.current.focus`. |
| Đụng test đã có làm hỏng 7/7 ca cũ | Low | Med | Code thay đổi chỉ ADD logic (1 ref + 1 useEffect), không sửa logic toggle / menu items / signout / click-outside. Test cũ không phụ thuộc Escape. |

### Estimated Complexity

- **Frontend**: Low (1 file, ~12 dòng code thêm — 1 dòng `useRef`, 1 attribute `ref={triggerRef}`, 11 dòng `useEffect`; pattern đã có chứng thực ở LanguageSelector)
- **Backend**: N/A
- **Testing**: Low (2 ca unit, không cần e2e mới)

---

## Integration Testing Strategy

### Test Scope

- [x] **Component/Module interactions**: ProfileButton ↔ document keyboard event ↔ DOM focus state. Tất cả ở phía client.
- [ ] **External dependencies**: KHÔNG có (`/api/auth/signout` không gọi cho Escape flow).
- [ ] **Data layer**: KHÔNG có.
- [x] **User workflows**: keyboard a11y user mở menu → Escape → focus trả về trigger (US4 scenario 3 + US5 cross-reference).

### Test Categories

| Category | Applicable? | Key Scenarios |
|----------|-------------|---------------|
| UI ↔ Logic | Yes | Escape khi menu mở → đóng + focus trigger; Escape khi menu đóng → no-op |
| Service ↔ Service | No | — |
| App ↔ External API | No | — |
| App ↔ Data Layer | No | — |
| Cross-platform | No | Escape thuần keyboard, identical trên mọi browser |

### Test Environment

- **Environment type**: Local Vitest + jsdom (script `npm test`); CI dùng image với Node 20+
- **Test data strategy**: in-component props (`name="Alice"`, `image=null`, `locale="vi-VN"`) — không cần fixture
- **Isolation approach**: mỗi `it()` render mới qua RTL `render()`; vitest tự cleanup giữa các test

### Mocking Strategy

| Dependency Type | Strategy | Rationale |
|-----------------|----------|-----------|
| `next/navigation` | KHÔNG cần mock | ProfileButton không dùng router (Sign out là form submit; Profile là `<Link>`) |
| `next/image` | Mock nhẹ trong vitest setup (đã có ở `vitest.setup.ts`) | Avoid real image loading trong jsdom |
| Document keyboard event | Real (RTL `userEvent.keyboard`) | jsdom hỗ trợ đầy đủ keydown event simulation |

### Test Scenarios Outline

Đúng 2 ca (chốt — không thêm optional):

1. **Happy Path**
   - [ ] `pressing Escape while menu is open closes it and returns focus to trigger` — mở menu, focus trigger, gõ Escape, assert menu đóng + `document.activeElement === trigger`
2. **Edge Case**
   - [ ] `pressing Escape while menu is closed is a no-op` — không mở menu, gõ Escape, assert không có `role="menu"` trong DOM, không throw
3. **Error Handling**: không có (keydown handler thuần local; `triggerRef.current?.focus()` dùng optional chain — null-safe ngay tại site)

> Cleanup useEffect không leak (rapid open/close/open) được verified ngầm bởi 2 ca trên — vitest mỗi `it()` mount mới + cleanup. Nếu sau này thấy flakiness, mới thêm ca optional thứ 3; chưa cần.

### Tooling & Framework

- **Test framework**: Vitest 4 + React Testing Library + `@testing-library/user-event` (cho `keyboard()`)
- **Supporting tools**: jsdom (đi kèm vitest.setup.ts đã có)
- **CI integration**: PR CI chạy `npm test` (đã có script trong `package.json`); fail nếu coverage tụt

### Coverage Goals

| Area | Target | Priority |
|------|--------|----------|
| Escape keydown handler | 100% (cả 2 branch: `isOpen=true` + key match → đóng + focus; `isOpen=false` → no-op effect không attach listener) | High |
| Existing ProfileButton tests | giữ 100% pass (7/7 → 7/7) | High |
| Vitest tổng | 184/184 → 186/186 sau Phase 3 | High |

---

## Dependencies & Prerequisites

### Required Before Start

- [x] [.momorph/constitution.md](../../constitution.md) đã review (v1.1.1)
- [x] [spec.md](spec.md) đã review 3 vòng — sẵn sàng cho plan
- [ ] research.md — KHÔNG cần (codebase context rõ trong spec)
- [ ] API contracts — KHÔNG cần (không có API mới)
- [ ] Database migrations — KHÔNG cần
- [x] Pattern reference đã verified ở [src/components/header/LanguageSelector.tsx](../../../src/components/header/LanguageSelector.tsx) line 126-131 (Escape branch của `onMenuKeyDown`)

### External Dependencies

- KHÔNG có. Mọi thứ in-house.

---

## Next Steps

Sau khi plan này được duyệt:

1. **Run** `/momorph.tasks` để break thành task list (sẽ rất ngắn — ~3-4 tasks: viết test → fail → implement → verify regression).
2. **Begin** implementation theo task order. TDD strict.
3. **Commit**: 1 commit duy nhất với message `feat(profile-dropdown): add Escape keydown handler to close menu and restore focus` — link tới Resolved Question Q2 của spec.

---

## Notes

- **Tại sao plan này nhỏ vậy?** Vì spec là tài liệu hồi tố cho component đã ship. 90% behavior đã có code thật + test xanh. Q2 (Escape) là khoảng trống duy nhất giữa spec target và code reality. Không phình scope — đúng tinh thần Constitution Principle V (TDD) + minimal-change ethic.
- **Không có Phase 0 (Asset Preparation)** vì không tải asset mới. Icon user/chevron mô tả trong Figma `A.1`/`A.2` thuộc CSS pass tương lai (nếu cần) — không trong scope plan này.
- **Pattern reuse**: code Escape handler sẽ rất giống LanguageSelector lines 126-131, chỉ khác (a) đặt trong document-level `useEffect` thay vì `onKeyDown` JSX prop (xem Architecture Decisions), (b) không có ArrowDown/ArrowUp/Enter — ProfileButton không có active-index navigation.
- **Cross-spec sync**: chi tiết các edit đã chuyển vào Phase 4 (Spec hygiene sync). Quy tắc tóm: chỉ update [spec.md](spec.md) chính nó (US4 #3, Status line, Implementation Status, Dependencies checkbox, Resolved Question Q2). KHÔNG đụng Homepage SAA spec, KHÔNG đụng SCREENFLOW.md keyboard internals.
- **Cross-component note**: `NotificationBell.tsx` và `WidgetButton.tsx` hiện đã tồn tại trong `src/components/home/` nhưng CHƯA mở overlay (NotificationBell hiện chỉ show toast "Coming soon" theo Homepage spec Q6; WidgetButton menu nội dung deferred). Khi 2 component này được mở rộng để có dropdown content, mới có 4 disclosure-with-Escape sites — lúc đó nên extract `useDisclosureKeyboard` hook. **Plan này KHÔNG extract sớm** — Constitution Principle I khuyên "extract khi reuse 3+ lần"; hiện chỉ 2 site thật sự sử dụng (LanguageSelector + ProfileButton sau follow-up). Đợi NotificationBell hoặc WidgetButton thực sự cần overlay rồi refactor — tránh premature abstraction.
- **Out of scope nhắc lại** (đã ghi ở Summary, không tính lại risk): biến thể admin `54rekaCHG1`, route `/profile`, mobile responsive overlay, CSS visual treatment.
