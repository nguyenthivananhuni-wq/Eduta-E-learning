# Phase 01 — Nền tảng helper vai trò phân cấp

**Context:** [plan.md](plan.md) · Không phụ thuộc phase khác (làm đầu tiên).

## Overview
- **Ngày:** 2026-05-30
- **Mô tả:** Tạo 1 nguồn chân lý cho logic vai trò phân cấp; gom mọi so sánh `role === ...` rải rác về helper chung.
- **Ưu tiên:** Cao (nền cho phase 02–04)
- **Trạng thái:** ⬜ Chưa làm · **Review:** Chờ duyệt
- **Ảnh hưởng production:** Không (refactor đồng hành vi).

## Key Insights
- Hiện có ~12 chỗ check `role === "ADMIN" / "INSTRUCTOR"` rải rác (auth-helpers, auth.config, course.actions, course-approval.actions, instructor.actions, review-insight.actions, UserMenu, become-instructor, instructor analytics/edit pages).
- Bậc thang ngầm đã tồn tại (`requireInstructor` cho ADMIN qua). Chỉ cần chuẩn hóa.
- File helper PHẢI edge-safe: `auth.config.ts` + `middleware.ts` chạy edge runtime → KHÔNG import `@/lib/db` hay `server-only`.

## Requirements
- `can(role, capability)`: `learn` (mọi role), `teach` (INSTRUCTOR, ADMIN), `moderate` (ADMIN).
- `homePathFor(role)`: `/admin` | `/instructor` | `/dashboard`.
- `areaLabel(role)`: nhãn tiếng Việt khu vực ("Học viên"/"Giảng viên"/"Quản trị") cho context switcher (phase 02).
- Refactor không đổi hành vi quan sát được.

## Architecture
```
lib/auth/roles.ts        ← MỚI, pure functions, edge-safe
  type Role, Capability
  can(role, cap): boolean
  homePathFor(role): string
  areaLabel(role): string
```
`auth-helpers.ts` (server) re-dùng `can`; `auth.config.ts` (edge) re-dùng `can`/`homePathFor`.

## Related code files
- **Tạo:** `lib/auth/roles.ts`
- **Sửa:** `lib/auth-helpers.ts` (requireAdmin→`can(role,'moderate')`, requireInstructor→`can(role,'teach')`, assertCourseEditAccess), `auth.config.ts` (isAdmin/isInstructor), `lib/actions/course.actions.ts` (assertCourseOwnership), `lib/actions/course-approval.actions.ts`, `lib/actions/review-insight.actions.ts`, `components/layout/UserMenu.tsx`, `app/(public)/become-instructor/page.tsx`.
- Type `Role` đã khai báo ở `next-auth.d.ts`/`auth.config.ts` — roles.ts export lại để tái dùng.

## Implementation Steps
1. Tạo `lib/auth/roles.ts` với `Role`, `Capability`, `can`, `homePathFor`, `areaLabel`. Pure, không import.
2. `auth-helpers.ts`: thay `role !== "ADMIN"` → `!can(role,'moderate')`; `role !== "INSTRUCTOR" && !== "ADMIN"` → `!can(role,'teach')`; trong `assertCourseEditAccess` dùng `can(role,'moderate')` cho admin-bypass, `can(role,'teach')` cho instructor.
3. `auth.config.ts`: `isAdmin = can(role,'moderate')`, `isInstructor = can(role,'teach')`.
4. Các actions/pages còn lại: thay so sánh trực tiếp bằng `can(...)` (giữ nguyên ý nghĩa).
5. `npm run typecheck`.

## Todo list
- [ ] Tạo roles.ts
- [ ] Refactor auth-helpers.ts
- [ ] Refactor auth.config.ts
- [ ] Refactor actions (course/course-approval/review-insight)
- [ ] Refactor UserMenu + become-instructor
- [ ] typecheck pass

## Success Criteria
- `npm run typecheck` sạch.
- Không còn `role === "ADMIN"`/`"INSTRUCTOR"` rải rác (trừ nơi cần literal union như session callback).
- Hành vi phân quyền không đổi (admin vẫn vào /instructor, v.v.).

## Risk Assessment
- **Thấp.** Rủi ro chính: import db gián tiếp vào roles.ts làm vỡ edge runtime → giữ file pure, chỉ literal.

## Security Considerations
- Helper chỉ tập trung hóa logic; không nới lỏng quyền. Kiểm tra kỹ `moderate` chỉ ADMIN.

## Next steps
→ Phase 02 dùng `homePathFor` + `areaLabel`.
