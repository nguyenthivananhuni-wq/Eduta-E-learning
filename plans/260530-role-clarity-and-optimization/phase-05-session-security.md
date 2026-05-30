# Phase 05 — Vá bảo mật session (suspended / role re-check)

**Context:** [plan.md](plan.md) · Phụ thuộc: Phase 01 (`can`, helpers). User chốt: GỘP vào đợt này.

## Overview
- **Ngày:** 2026-05-30
- **Mô tả:** Hiện JWT chỉ đọc `suspended`/`role` lúc login → user bị khóa vẫn dùng được tới khi token hết hạn; đổi role không hiệu lực tới khi login lại. Phase này re-check DB ở server giúp khóa tài khoản hiệu lực ngay và role luôn tươi.
- **Ưu tiên:** Cao (bảo mật).
- **Trạng thái:** ⬜ Chưa làm · **Review:** Chờ duyệt
- **Ảnh hưởng production:** CÓ — user bị suspend bị đẩy ra ngay ở các trang được bảo vệ.

## Key Insights
- `auth.config.ts` callbacks (`jwt`/`session`) chạy cả EDGE (middleware) → KHÔNG được import `@/lib/db` ở đó.
- Mọi vùng được bảo vệ đều đi qua một helper server-side: `requireAuth` / `requireAdmin` / `requireInstructor` (layouts: (student), (admin), (instructor); actions cũng gọi). Các helper này chạy NODE runtime → Prisma libSQL dùng được.
- → Giải pháp an toàn nhất, ít rủi ro edge: **re-check DB trong các helper server-side**, KHÔNG đụng callbacks edge.
- Trade-off: +1 truy vấn nhẹ `user.findUnique({select:{suspended,role}})` mỗi lần vào vùng bảo vệ — chấp nhận được ở quy mô này.

## Requirements
- Trong `requireAuth`: nếu user `suspended` → `redirect("/login?suspended=1")` (đẩy ra ngay).
- Dùng `role` TƯƠI từ DB cho `requireAdmin`/`requireInstructor` (vá luôn role-change): kiểm tra quyền theo role DB, không chỉ token.
- Nếu user đã bị xóa (không còn trong DB) → `redirect("/login")`.
- Trang login đọc `?suspended=1` → hiện thông báo "Tài khoản đã bị tạm khóa".
- Tối thiểu hóa số truy vấn: 1 hàm dùng chung `getFreshUser(session)` trả `{ id, role, suspended }`.

## Architecture
```
lib/auth-helpers.ts (Node runtime)
  getFreshUser(session)  ← MỚI: db.user.findUnique select {role,suspended}
  requireAuth()      → auth() + getFreshUser; suspended→redirect; trả session role=DB role
  requireAdmin()     → requireAuth + can(freshRole,'moderate')
  requireInstructor()→ requireAuth + can(freshRole,'teach')
```
- Không đổi `auth.config.ts`/`middleware.ts` (edge giữ nguyên — chỉ chặn coarse theo token; helper là lớp chốt fine-grained ở render).

## Related code files
- **Sửa:** `lib/auth-helpers.ts` — thêm `getFreshUser`, gắn re-check vào `requireAuth/requireAdmin/requireInstructor`; gán `session.user.role = freshRole` để downstream dùng role tươi.
- **Sửa:** `app/(auth)/login/page.tsx` + `components/auth/LoginForm.tsx` (hoặc page) — đọc `searchParams.suspended`, hiện cảnh báo.
- **Không đụng:** `auth.ts` authorize() đã chặn suspended lúc login (giữ).

## Implementation Steps
1. `auth-helpers.ts`: viết `getFreshUser(userId)`; trong `requireAuth` gọi sau `auth()`, nếu `!user || user.suspended` → redirect. Trả về session đã ghi đè `role` = DB role.
2. `requireAdmin`/`requireInstructor`: build trên `requireAuth`, kiểm `can(freshRole, 'moderate'|'teach')`.
3. `login/page.tsx`: nhận `searchParams`, nếu `suspended` → render banner cảnh báo (toast/alert).
4. `npm run typecheck`.

## Todo list
- [ ] getFreshUser + re-check trong requireAuth
- [ ] role tươi cho requireAdmin/requireInstructor
- [ ] Banner suspended ở trang login
- [ ] typecheck pass

## Success Criteria
- Admin suspend user A → A đang đăng nhập, lần điều hướng kế tiếp vào vùng bảo vệ bị đẩy ra `/login?suspended=1` + thấy cảnh báo.
- Promote user B → INSTRUCTOR → B vào `/instructor` được NGAY (không cần login lại).
- User bình thường không bị ảnh hưởng (chỉ +1 query nhẹ).

## Risk Assessment
- **Trung bình.** Rủi ro: thêm query vào hot path layout → đảm bảo `select` tối thiểu, không N+1. Redirect loop nếu `/login` vô tình gọi requireAuth → `/login` thuộc nhóm (auth), KHÔNG gọi requireAuth → an toàn.
- Edge middleware vẫn để token qua; chốt thật ở helper render — chấp nhận (suspended chỉ chặn ở trang, không ở asset).

## Security Considerations
- Đây là vá lỗ hổng: khóa tài khoản hiệu lực gần như tức thì.
- Không lộ thông tin: redirect chung `/login`, không tiết lộ lý do chi tiết ngoài "tạm khóa".

## Next steps
→ Phase 06 (build & deploy).
