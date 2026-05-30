# Phase 03 — Chính sách admin không bán khóa ⚠️ ASSUMPTION

**Context:** [plan.md](plan.md) · Phụ thuộc: Phase 01.

> ⚠️ **GIẢ ĐỊNH:** User chưa xác nhận dứt khoát "admin có được bán khóa không". Plan này giả định **KHÔNG**. Thiết kế để **dễ đảo ngược** (revert = khôi phục nút + page + bỏ guard). Nếu user trả lời CÓ → BỎ phase này.

## Overview
- **Ngày:** 2026-05-30
- **Mô tả:** Tách bạch vai trò vận hành (admin kiểm duyệt) khỏi vai trò người bán (instructor sở hữu khóa). Admin không tạo/sở hữu khóa → tránh xung đột lợi ích & doanh thu lẫn vào ví admin.
- **Ưu tiên:** Trung bình (làm sau khi đã có UX tách bạch).
- **Trạng thái:** ⬜ Chưa làm · **Review:** Chờ duyệt
- **Ảnh hưởng production:** CÓ — bỏ luồng admin tạo khóa.

## Key Insights
- `createCourse` ([course.actions.ts:35-38]) set `instructorId = session.user.id` → admin tạo khóa thì admin là chủ sở hữu, nhận 70% doanh thu (`enrollment.actions.ts` cộng vào ví instructorId).
- Admin vào khóa qua `/admin/courses/new` (page) + nút "Tạo khóa mới" ([admin/courses/page.tsx:39-44]).
- Admin VẪN cần kiểm duyệt: xem danh sách, duyệt/từ chối (course-approval.actions), xóa. → giữ nguyên các quyền này.

## Requirements
- Admin KHÔNG tạo khóa thuộc sở hữu mình.
- Giữ trang quản lý khóa admin (list/duyệt/xóa); chỉ bỏ "tạo mới".
- `createCourse` từ chối khi caller là ADMIN (chỉ INSTRUCTOR tạo & sở hữu).
- Mọi thay đổi gói gọn, dễ revert.

## Architecture
- `createCourse`: thêm guard sớm `if (session.user.role === "ADMIN") return { ok:false, error:"Admin chỉ kiểm duyệt, không tạo khóa học." }`. (Instructor tạo như cũ.)
- Bỏ entrypoint UI ở khu admin (nút + route). Khu instructor `/instructor/courses/new` giữ nguyên.

## Related code files
- **Sửa:** `lib/actions/course.actions.ts` — guard ADMIN trong `createCourse`.
- **Sửa:** `app/(admin)/admin/courses/page.tsx` — bỏ nút "Tạo khóa mới".
- **Xóa/redirect:** `app/(admin)/admin/courses/new/page.tsx` — xóa file (hoặc redirect `/admin/courses`). Đề xuất: xóa.
- **Không đụng:** `components/admin/CourseForm.tsx` (vẫn dùng cho `/admin/courses/[id]/edit` khi admin sửa nội dung khóa của instructor trong vai kiểm duyệt — giữ).

## Implementation Steps
1. `course.actions.ts`: thêm guard từ chối ADMIN trong `createCourse` (trước `db.course.create`).
2. `admin/courses/page.tsx`: gỡ block `<Button asChild><Link href="/admin/courses/new">…`.
3. Xóa `app/(admin)/admin/courses/new/page.tsx`.
4. `npm run typecheck` + grep đảm bảo không còn link tới `/admin/courses/new`.

## Todo list
- [ ] Guard ADMIN trong createCourse
- [ ] Bỏ nút tạo khóa ở admin
- [ ] Xóa route admin/courses/new
- [ ] Kiểm tra không còn dead link
- [ ] typecheck pass

## Success Criteria
- Admin không thấy lối tạo khóa; gọi `createCourse` bằng tài khoản admin → bị từ chối.
- Instructor tạo khóa bình thường; admin vẫn duyệt/từ chối/xóa được.

## Risk Assessment
- **Trung bình (hành vi).** Nếu dữ liệu hiện có đã tồn tại khóa do admin sở hữu, plan KHÔNG đụng tới chúng (không migrate). Cần xác nhận với user.
- Dễ revert.

## Security Considerations
- Thắt chặt quyền (ít hơn). Không mở rộng bề mặt tấn công.

## Next steps
→ Phase 04 (vá enroll). Nếu user trả lời "admin được bán" → bỏ phase này, sang thẳng 04.
