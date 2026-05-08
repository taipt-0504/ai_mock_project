# Tasks: Dropdown-profile (biến thể user) — follow-up Escape handler

**Frame**: `z4sCl3_Qtk-dropdown-profile`
**Prerequisites**: [plan.md](plan.md) (required), [spec.md](spec.md) (required)
**Date**: 2026-05-08

---

## Bối cảnh

Component [src/components/home/ProfileButton.tsx](../../../src/components/home/ProfileButton.tsx) đã ship cùng Homepage SAA Phase 13 (7 unit test xanh). US1 / US2 / US3 / US5 đã DONE; chỉ còn **US4 scenario 3** (Escape đóng menu + trả focus về trigger — FR-007 / Resolved Question Q2) là gap duy nhất.

**Vì task list này hẹp** (1 file source, ~10 dòng code, 2 unit test):
- Bỏ qua **Phase 1 (Setup)**: project đã init, component đã ship, không có dependency mới.
- Bỏ qua **Phase 2 (Foundation)**: không có blocking infrastructure cần làm trước.
- Phase 3 chỉ có **US4** (P2) — các US khác đã ship, không có việc cần làm.
- Phase 4 (Polish) gói gọn regression verify + spec hygiene sync.

---

## Task Format

```
- [ ] T### [P?] [Story?] Description | file/path.ts
```

- **[P]**: Có thể chạy song song (file khác nhau, không phụ thuộc task chưa xong)
- **[Story]**: User story task này thuộc về (US4 = User Story 4 trong [spec.md](spec.md))
- **|**: Đường dẫn file bị ảnh hưởng

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization và basic structure

- [ ] **SKIP** — Project Next.js 16 + Vitest 4 + Playwright 1.59 đã init; ProfileButton + 7 unit test đã ship; `@testing-library/user-event@14.6.1` đã có trong `package.json`. Không có việc setup nào cần làm.

---

## Phase 2: Foundation (Blocking Prerequisites)

**Purpose**: Core infrastructure required by ALL user stories

- [ ] **SKIP** — Không có foundational dependency. Click-outside listener (FR-006), ARIA wiring (FR-001/002), menu render (FR-003), Profile Link (FR-004), signout form (FR-005), i18n catalog (FR-009), props-only session (FR-010) đều đã shipped và xanh test.

**Checkpoint**: Sẵn sàng vào Phase 3 ngay.

---

## Phase 3: User Story 4 — Đóng dropdown bằng Escape (Priority: P2) 🎯 MVP

**Goal**: Hoàn tất behavior contract của FR-007 / US4 scenario 3 — khi menu đang mở và người dùng nhấn `Escape`, menu phải đóng và focus phải trả về trigger button.

**Independent Test**: Render `<ProfileButton locale="vi-VN" name="Alice" image={null} />`, click trigger để mở menu, nhấn `Escape`, khẳng định: (a) `role="menu"` biến mất khỏi DOM, (b) `document.activeElement` bằng trigger button.

### Tests (US4) — TDD Red phase

> Mục tiêu: viết test FAIL trước khi implement (Constitution Principle V).

- [x] T001 [US4] Thêm import `userEvent` vào đầu file test (sau dòng `import { fireEvent, render, screen } from "@testing-library/react";`): `import userEvent from "@testing-library/user-event";` | tests/unit/components/home/ProfileButton.test.tsx
- [x] T002 [US4] Thêm test happy path bên trong `describe` block hiện có: `it("pressing Escape while menu is open closes it and returns focus to trigger", async () => { ... })` — render component, `await user.click(trigger)`, assert `getByRole("menu")` hiện hữu, `await user.keyboard("{Escape}")`, assert `queryByRole("menu")` không còn, assert `document.activeElement === trigger` | tests/unit/components/home/ProfileButton.test.tsx
- [x] T003 [US4] Thêm test edge case bên trong `describe` block hiện có: `it("pressing Escape while menu is closed is a no-op (no error, menu stays absent)", async () => { ... })` — render component (không click trigger), assert `queryByRole("menu")` không có, `await user.keyboard("{Escape}")`, assert vẫn không có menu, không throw | tests/unit/components/home/ProfileButton.test.tsx
- [x] T004 [US4] Chạy `npm test -- ProfileButton` — xác nhận **T002 ĐỎ** (chưa có handler Escape nên menu không đóng) và T003 XANH ngay (no-op tự nhiên đúng vì chưa có listener nào). Snapshot kết quả vào terminal làm bằng chứng RED. | (no file change)

### Implementation (US4) — TDD Green phase

> Mục tiêu: thay đổi tối thiểu trong [src/components/home/ProfileButton.tsx](../../../src/components/home/ProfileButton.tsx) để T002 chuyển XANH; KHÔNG đụng logic toggle / click-outside / signout / menu items / fallback avatar.

- [x] T005 [US4] Sau dòng `const [isOpen, setIsOpen] = useState(false);` (line 19) thêm: `const triggerRef = useRef<HTMLButtonElement>(null);` — không cần thêm import vì `useRef` đã được import ở line 5 | src/components/home/ProfileButton.tsx
- [x] T006 [US4] Trên thẻ `<button>` của trigger (line 40-47, hiện có `type="button" onClick={...} aria-haspopup ...`), thêm prop `ref={triggerRef}` — đặt thành prop đầu tiên hoặc ngay sau `type` để giữ readability | src/components/home/ProfileButton.tsx
- [x] T007 [US4] Sau khối `useEffect` click-outside hiện có (line 22-34), thêm khối `useEffect` thứ hai để xử lý Escape — active khi `isOpen === true`, gắn `document.addEventListener("keydown", handler)`, gỡ trong cleanup. Handler: nếu `event.key === "Escape"` thì gọi `setIsOpen(false)` và `triggerRef.current?.focus()`. Dependency array: `[isOpen]` | src/components/home/ProfileButton.tsx

```ts
// Snippet tham khảo (đã có trong plan.md):
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

- [x] T008 [US4] Chạy `npm test -- ProfileButton` — xác nhận **9/9 ca xanh** (7 ca cũ + T002 + T003). Nếu T002 vẫn đỏ, kiểm tra: ref đã gắn đúng vào button chưa? Listener có active khi `isOpen=true` không? `event.key` viết đúng `"Escape"` (case-sensitive)? | (no file change)

**Checkpoint US4**: FR-007 đã có code thật + test xanh; US4 scenario 3 không còn caveat. MVP của plan này hoàn tất.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Regression verify toàn project + đồng bộ tài liệu

### Regression verify

> Tất cả 4 task này dùng commands khác nhau, không sửa file nào, có thể chạy song song trên các terminal khác nhau.

- [x] T009 [P] Chạy `npm test` — xác nhận tổng vitest **186/186 xanh** (baseline 184 + 2 ca mới). Nếu có ca không liên quan ProfileButton bị đỏ → STOP và điều tra (không phải lỗi của plan này nhưng phải report).
- [x] T010 [P] Chạy `npm run test:e2e -- home` — kỳ vọng **11/11 xanh** ở `tests/e2e/home/`. Escape không đụng FAB / notification / profile click flow / awards / header navigation → kỳ vọng zero regression. _Thực tế: Playwright filter `home` match cả `home/` + `homepage` + `login/` (substring) → chạy 28 ca, all pass._
- [x] T011 [P] Chạy `npm run lint` — clean. Lint của eslint-config-next sẽ flag nếu `useRef` import dư hoặc dependency array của useEffect sai (`react-hooks/exhaustive-deps`).
- [x] T012 [P] Chạy `npx tsc --noEmit` — clean. TypeScript strict mode sẽ flag nếu `triggerRef` type không khớp `HTMLButtonElement` hoặc `KeyboardEvent` được dùng sai.

### Spec hygiene sync (cập nhật [spec.md](spec.md))

> 5 sửa đổi trong CÙNG file `spec.md` → KHÔNG thể parallel. Gộp vào 1 task duy nhất, làm sau khi Phase 4 regression verify đã xanh để chắc chắn behavior đã ship.

- [x] T013 [US4] Cập nhật [spec.md](spec.md) — 5 chỗ:
  1. **Status line (line 7)**: bỏ cụm `với 1 follow-up đã chốt: bổ sung Escape keydown listener (Resolved Question Q2)` — follow-up đã DONE.
  2. **Implementation Status (line 27)**: thêm `Escape keydown listener đóng menu + trả focus về trigger` vào câu liệt kê "Những gì code đã làm".
  3. **US4 scenario 3 (~line 118)**: bỏ caveat italic `*(Behavior contract hard; code hiện tại chưa có keydown listener — follow-up task ghi ở mục Dependencies, chi tiết ở Resolved Question Q2.)*`.
  4. **Dependencies (~line 282)**: chuyển `[ ] Bổ sung Escape keydown listener cho ProfileButton — task riêng, theo Q2 (resolved)` → `[x] Bổ sung Escape keydown listener cho ProfileButton — đã ship 2026-05-08, theo Q2 (resolved)`.
  5. **Resolved Question Q2 (~line 291)**: thêm dòng cuối: `**Implemented 2026-05-08** trong commit `feat(profile-dropdown): add Escape keydown handler...` — khẳng định FR-007 đã chốt code.

  **KHÔNG đụng**: SCREENFLOW.md, Homepage SAA spec, plan.md (plan giữ nguyên làm artifact lịch sử).
  | .momorph/specs/z4sCl3_Qtk-dropdown-profile/spec.md

### Commit

- [ ] T014 Tạo 1 commit duy nhất với message theo conventional-commit:
  ```
  feat(profile-dropdown): add Escape keydown handler to close menu and restore focus

  - Add document-level keydown listener (active while isOpen) in ProfileButton
  - Return focus to trigger button after Escape closes the menu
  - Cover happy path + closed-menu no-op with 2 new vitest cases
  - Sync spec.md hygiene: drop FR-007 caveat, mark Q2 implemented

  Resolves Q2 of .momorph/specs/z4sCl3_Qtk-dropdown-profile/spec.md
  ```
  Stage cụ thể `src/components/home/ProfileButton.tsx`, `tests/unit/components/home/ProfileButton.test.tsx`, `.momorph/specs/z4sCl3_Qtk-dropdown-profile/spec.md`, `.momorph/specs/z4sCl3_Qtk-dropdown-profile/tasks.md` (khi đã đánh dấu xong) — KHÔNG dùng `git add -A` để tránh stage file lạ. | (git operation)

**Checkpoint cuối**: Phase 4 xanh + commit pushed → plan hoàn tất, spec đồng bộ với code reality.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: SKIPPED.
- **Foundation (Phase 2)**: SKIPPED.
- **US4 (Phase 3)**: T001 → T002 / T003 (cùng file, không P) → T004 → T005 / T006 / T007 (cùng file, không P) → T008.
- **Polish (Phase 4)**: T009 / T010 / T011 / T012 song song được; T013 sequential sau khi T009-T012 xanh; T014 cuối cùng sau T013.

### Within US4

- **TDD strict**: T002 phải ĐỎ trước khi T005-T007. Nếu T002 đã xanh ngay từ đầu nghĩa là test sai — STOP và xem lại assertion.
- T005 (`triggerRef`) → T006 (gắn ref) → T007 (useEffect) — không reorder; useEffect dùng `triggerRef.current` nên ref phải tồn tại trước.

### Parallel Opportunities

- T009, T010, T011, T012 — 4 lệnh kiểm tra độc lập (vitest, playwright, eslint, tsc), chạy được song song trong các terminal/jobs khác nhau.
- KHÔNG có cơ hội parallel khác trong plan này vì US4 chỉ đụng 1 file source + 1 file test.

---

## Implementation Strategy

### MVP-only (recommended cho plan này)

Plan chỉ có 1 user story (US4) và đó là follow-up gap-fill, KHÔNG có incremental delivery option. Đề xuất chạy nguyên flow trong 1 session ngắn:

1. **T001-T004** (TDD Red) — ~5 phút.
2. **T005-T008** (Implement + Green) — ~5 phút.
3. **T009-T012** (Regression verify, parallel) — ~3-5 phút (Playwright là khâu chậm nhất).
4. **T013** (Spec hygiene) — ~2 phút.
5. **T014** (Commit) — ~1 phút.

**Tổng ước tính**: ~15-20 phút end-to-end nếu không gặp issue.

### STOP & VALIDATE checkpoints

- Sau T004: xác nhận T002 ĐỎ. Nếu xanh → test viết sai, sửa trước khi implement.
- Sau T008: xác nhận tất cả ca ProfileButton xanh trước khi chạy regression rộng.
- Sau T012: nếu có regression ngoài ProfileButton (ví dụ Playwright Homepage đỏ) → STOP, không commit, điều tra root cause (Escape không nên đụng các flow đó — nếu đụng là bug thiết kế cần re-plan).

---

## Coverage Summary

| Concern | Tasks | Files |
|---------|-------|-------|
| US4 scenario 3 (FR-007 — Escape) | T001-T008 | `ProfileButton.tsx`, `ProfileButton.test.tsx` |
| Regression verify | T009-T012 | (no file change — chỉ chạy commands) |
| Spec hygiene sync | T013 | `spec.md` |
| Commit | T014 | (git operation) |

**Total**: 14 tasks (8 implementation + tests, 4 verify, 1 doc sync, 1 commit).
**MVP scope**: Phase 3 (US4) — toàn bộ. Plan không có US khác cần làm.
**Parallel opportunities**: T009-T012 (4 verify tasks).

---

## Notes

- **Tại sao có ít task vậy?** Vì component đã ship; spec hồi tố. Plan này chỉ filling 1 gap (Escape) đã được Q2 chốt. Nguyên tắc Constitution Principle I (clean & minimal) khuyên KHÔNG inflate task list khi work thật chỉ ~10 dòng code.
- **Commit single hay multiple?** Single. Plan đề xuất 1 commit duy nhất vì work thuộc 1 vertical slice (test + code + doc đều cho US4 scenario 3). Tách 2-3 commit chỉ làm git history khó đọc hơn.
- **Rollback plan**: Nếu T009-T012 phát hiện regression không lường trước, revert thay đổi trong `ProfileButton.tsx` (chỉ ~10 dòng, dễ revert) và rollback test bằng `git checkout tests/unit/components/home/ProfileButton.test.tsx` rồi điều tra. Không có DB migration / config change → rollback an toàn.
- **Out of scope nhắc lại** (không tạo task): biến thể admin (`54rekaCHG1`), route `/profile`, mobile responsive, CSS visual treatment. Các work đó có spec/plan riêng trong tương lai.
- **Mark complete inline**: khi xong từng task, đánh dấu `[ ]` → `[x]` trực tiếp trong file này; commit T014 sẽ stage cùng.
