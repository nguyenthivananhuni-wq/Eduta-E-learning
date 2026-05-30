# Phase 01 — Backend: resolve enforce + validation + notify

**Context:** [plan.md](plan.md) · [brainstorm](../260530-role-clarity-and-optimization/reports/brainstorm-actionable-moderation.md) · Làm đầu tiên.

## Overview
- **Ngày:** 2026-05-30
- **Mô tả:** `resolveReport` nhận thêm `action` và thực thi hành động lên nội dung bị tố cáo; thông báo lại người báo cáo; `dismissReport` cũng thông báo.
- **Ưu tiên:** Cao (lõi giá trị Hướng B).
- **Trạng thái:** ⬜ Chưa làm · **Review:** Chờ duyệt
- **Ảnh hưởng production:** CÓ — đổi hành vi khi admin xử lý báo cáo.

## Key Insights
- `Report` đã có đủ field: `status`, `resolution?`, `resolvedBy?`, `resolvedAt?` → KHÔNG cần migrate; ghi hành động vào `resolution`.
- Tái dùng:
  - Xóa review: pattern [deleteReview] = `tx.review.delete` + `recomputeCourseRating(courseId, tx)` + `invalidateCourseInsight` (ngoài tx).
  - Khóa user: pattern [suspendUser] = update `suspended=true` + notification; chặn admin/self.
  - Gỡ duyệt khóa: `course.update status=DRAFT` + `rejectionReason` + notify instructor + `revalidateTag("courses")`.
- `resolveReport` chạy `requireAdmin` (Phase 05 trước đã làm role tươi).

## Requirements
- `resolveReport(reportId, { action, resolution? })`:
  - Action hợp lệ theo targetType (guard): COURSE→`UNPUBLISH_COURSE`|`DELETE_COURSE`|`NONE`; REVIEW→`DELETE_REVIEW`|`NONE`; USER→`SUSPEND_USER`|`NONE`.
  - Thực thi trong transaction cùng việc đóng report.
  - Target đã bị xóa trước đó → chỉ cho `NONE` (đóng report, ghi chú "nội dung đã bị gỡ").
  - Ghi `resolution` = "[nhãn hành động] + note"; set RESOLVED, resolvedBy, resolvedAt.
  - Notify reporter ("Báo cáo của bạn đã được xử lý").
  - SUSPEND_USER: chặn nếu target là ADMIN hoặc chính admin đang xử lý.
- `dismissReport`: thêm notify reporter ("Báo cáo của bạn đã được xem xét").
- Idempotency: report phải đang PENDING.

## Architecture
- Action enum tập trung trong validation; map `targetType → allowed actions` để guard.
- Enforcement tách hàm nhỏ trong action file: `enforceOnCourse/Review/User(tx, targetId, action, note)` để gọn (DRY, dễ test).
- `invalidateCourseInsight` + `revalidateTag/Path` gọi SAU transaction.

## Related code files
- **Sửa:** `lib/validations/report.ts` — thêm `reportActions` enum + mở rộng `resolveSchema` (`action`, `resolution?`).
- **Sửa:** `lib/actions/report.actions.ts` — viết lại `resolveReport` (enforce + notify); thêm notify trong `dismissReport`.
- **Tái dùng (đọc, không sửa):** `lib/queries/review.queries.ts` (`recomputeCourseRating`), `lib/ai/review-insights.ts` (`invalidateCourseInsight`).

## Implementation Steps
1. `report.ts`: `export const reportActions = ["NONE","UNPUBLISH_COURSE","DELETE_COURSE","DELETE_REVIEW","SUSPEND_USER"] as const;` + `resolveSchema = { action: z.enum(reportActions).default("NONE"), resolution: z.string().max(500).optional() }`.
2. `report.actions.ts`:
   - Helper `allowedActionsFor(targetType)` để guard.
   - `resolveReport`: load report (PENDING); validate action ∈ allowed; load target (kiểm tồn tại). Transaction thực thi theo action; update report; tạo notification reporter. Ngoài tx: `invalidateCourseInsight` (nếu xóa review), `revalidateTag("courses")` + `revalidatePath` liên quan (nếu COURSE), `revalidatePath("/admin/users")` (nếu SUSPEND).
   - `dismissReport`: thêm `tx.notification.create` cho reporter.
3. `npm run typecheck`.

## Todo list
- [ ] Mở rộng resolveSchema + action enum
- [ ] Guard allowedActionsFor
- [ ] resolveReport enforce 4 hành động + NONE
- [ ] Notify reporter (resolve + dismiss)
- [ ] Chặn suspend admin/self; xử lý target đã xóa
- [ ] revalidate/invalidate ngoài tx
- [ ] typecheck pass

## Success Criteria
- resolve COURSE/UNPUBLISH → khóa về DRAFT, biến mất khỏi `/courses`, instructor nhận notify.
- resolve REVIEW/DELETE → review bị xóa, avgRating/reviewCount cập nhật.
- resolve USER/SUSPEND → user `suspended=true` (kết hợp Phase 05: hiệu lực ngay).
- Reporter luôn nhận thông báo khi resolve/dismiss.
- Action sai targetType bị từ chối.

## Risk Assessment
- **Trung bình.** Xóa review phải recompute trong cùng tx (đúng pattern deleteReview). Suspend phải chặn admin/self. Target đã xóa → fallback NONE.
- KHÔNG đổi schema → an toàn dữ liệu.

## Security Considerations
- `requireAdmin` cho mọi nhánh. Không cho phép suspend ADMIN qua report.
- Không lộ dữ liệu nhạy cảm trong notification gửi reporter (chỉ trạng thái xử lý).

## Next steps
→ Phase 02 (UI chọn hành động + lịch sử) dùng action enum này.
