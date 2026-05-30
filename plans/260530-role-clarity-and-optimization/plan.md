# Kế hoạch: Gỡ rối vai trò & tối ưu Eduta + Redeploy

**Ngày:** 2026-05-30 · **Loại:** Refactor UX/logic (không đổi schema) · **Trạng thái:** 🟡 Chờ duyệt

## Bối cảnh
Web e-learning Eduta (Next.js 15 App Router + Prisma + Turso/libSQL + NextAuth v5 JWT).
Vấn đề gốc: `role` là 1 enum loại trừ (STUDENT|INSTRUCTOR|ADMIN) nhưng hành vi cộng dồn
(ai cũng học; INSTRUCTOR=học+dạy; ADMIN=học+dạy+quản trị) → UX rối, admin lẫn vai người bán.

**Phương án (đã chốt):** vai trò PHÂN CẤP — giữ nguyên schema, KHÔNG migrate DB; tách bạch ngữ cảnh
UX; admin không bán khóa; vá nhất quán.

## Nguyên tắc
- KHÔNG sửa `prisma/schema.prisma`, KHÔNG migrate Turso.
- Thay đổi tối thiểu, mỗi phase độc lập, verify được bằng `typecheck` + `build`.
- `lib/auth/roles.ts` phải edge-safe (dùng được trong middleware/auth.config) — không import db/server-only.

## Các phase

| # | Phase | Trạng thái | Ảnh hưởng production |
|---|-------|-----------|----------------------|
| 01 | [Nền tảng helper vai trò phân cấp](phase-01-role-helper-foundation.md) | ✅ Xong (typecheck pass) | Không (refactor nội bộ) |
| 02 | [Tách bạch ngữ cảnh UX](phase-02-context-separation.md) | ✅ Xong (typecheck pass) | Có (redirect login, ví) |
| 03 | [Chính sách admin không bán khóa](phase-03-admin-policy.md) | ✅ Xong (typecheck pass) | Có (bỏ tạo khóa của admin) |
| 04 | [Vá nhất quán enroll](phase-04-consistency-patches.md) | ✅ Xong (typecheck pass) | Có (chặn tự ghi danh) |
| 05 | [Vá bảo mật session (suspended/role)](phase-05-session-security.md) | ✅ Xong (typecheck pass) | Có (khóa user hiệu lực ngay) |
| 06 | [Build, kiểm tra & redeploy](phase-06-build-deploy.md) | ⬜ Chưa làm | Có (deploy) |

## Thứ tự thực thi
01 → 02 → 03 → 04 → 05 → 06. Sau mỗi phase 01–05: chạy `npm run typecheck`. Phase 06 build + deploy.

## Quyết định đã chốt (user xác nhận 2026-05-30)
- **Admin KHÔNG bán khóa** → giữ Phase 03.
- **Gộp vá session suspended** vào đợt này → thêm Phase 05.

## Phạm vi NGOÀI plan này (tùy chọn, để riêng)
- Phân trang catalog `getPublishedCourses` (hiện load toàn bộ).
- Tìm kiếm case-insensitive (SQLite `contains` phân biệt hoa/thường).
- Reset status APPROVED→PENDING khi instructor sửa khóa đã duyệt.
- Cấp `WELCOME_BONUS` khi đăng ký thật (hiện ví mới = 0đ).

## Câu hỏi mở
- (Không còn — 2 câu hỏi chính đã được user chốt ở trên.)
