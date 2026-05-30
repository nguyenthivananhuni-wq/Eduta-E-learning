# Phase 04 — Vá nhất quán enroll

**Context:** [plan.md](plan.md) · Độc lập (có thể làm bất kỳ lúc nào sau 01).

## Overview
- **Ngày:** 2026-05-30
- **Mô tả:** Chặn giảng viên/admin tự ghi danh/mua khóa của chính mình — đồng bộ với cơ chế đã chặn ở review.
- **Ưu tiên:** Trung bình–thấp (sửa nhỏ, tăng nhất quán).
- **Trạng thái:** ⬜ Chưa làm · **Review:** Chờ duyệt
- **Ảnh hưởng production:** CÓ (nhỏ) — thêm 1 ràng buộc enroll.

## Key Insights
- `review.actions.ts:38` đã chặn `course.instructorId === userId`. Nhưng `enrollCourse` ([enrollment.actions.ts]) KHÔNG chặn → instructor có thể "mua" khóa mình (lỗ tiền, dữ liệu vô nghĩa).
- `enrollCourse` đã `select instructorId` sẵn → chỉ cần thêm điều kiện.

## Requirements
- Nếu `course.instructorId === userId` → trả `{ ok:false, error:"Bạn không thể ghi danh khóa học của chính mình" }`, áp dụng cho cả khóa free & paid.
- Đặt check SAU khi lấy course, TRƯỚC nhánh free/paid.

## Architecture
- 1 guard duy nhất trong `enrollCourse`, sau block kiểm tra `status !== APPROVED`.

## Related code files
- **Sửa:** `lib/actions/enrollment.actions.ts` (thêm guard sau dòng kiểm `course.status`).

## Implementation Steps
1. Thêm: `if (course.instructorId && course.instructorId === userId) return { ok:false, error:"Bạn không thể ghi danh khóa học của chính mình" };` ngay sau check status.
2. (Tùy chọn) Ẩn/disable nút "Ghi danh" ở `components/courses/EnrollButton.tsx` / trang `courses/[slug]` khi viewer là chủ khóa — để UX rõ. Nếu làm: truyền cờ `isOwner` từ server page xuống.
3. `npm run typecheck`.

## Todo list
- [ ] Guard self-enroll trong enrollCourse
- [ ] (tùy chọn) ẩn nút Enroll cho chủ khóa
- [ ] typecheck pass

## Success Criteria
- Instructor mở khóa của chính mình → không ghi danh được (báo lỗi rõ).
- Học viên khác ghi danh bình thường.

## Risk Assessment
- **Thấp.** Logic cô lập, có guard tương tự đã chạy ổn ở review.

## Security Considerations
- Không liên quan quyền truy cập dữ liệu; chỉ ràng buộc nghiệp vụ.

## Next steps
→ Phase 05 (build & deploy).
