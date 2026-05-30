# Brainstorm chốt — Phát triển phần Báo cáo nội dung (Hướng B: Actionable Moderation)

**Ngày:** 2026-05-30 · **Trạng thái:** ✅ Đã đồng thuận hướng đi · **Nguồn:** /brainstorm

## Vấn đề
Trang `/admin/reports` ("Báo cáo nội dung") hiện trống vì chưa có report — nhưng vấn đề thật KHÔNG phải emptiness.
Lỗ hổng cốt lõi: **khi admin "Đã giải quyết", hệ thống không làm gì với nội dung bị tố cáo** ([resolveReport] chỉ đổi status report + ghi chú). Khóa vi phạm vẫn hiển thị, review bậy vẫn còn, user xấu vẫn hoạt động → chỉ là to-do list, không phải moderation.

## Hiện trạng (đã rà)
- User báo cáo được: COURSE (trang chi tiết khóa) + REVIEW (từng đánh giá). USER có trong enum nhưng không có UI báo cáo.
- `Report`: reporterId, targetType (COURSE/USER/REVIEW), reason (text tự do), status (PENDING/RESOLVED/DISMISSED), resolution?, resolvedBy?, resolvedAt?.
- `reportContent`: throttle 10/ngày, chống trùng pending, chặn self-target. ✅ Tốt.
- `resolveReport`/`dismissReport`: chỉ đổi status + note. ❌ Không enforce.
- Admin page: chỉ hiện PENDING; resolved chỉ đếm số, không xem được.

## Các hướng đã cân nhắc
| Hướng | Mô tả | Đánh giá |
|------|-------|----------|
| A — Demo polish | Seed report mẫu + tab lịch sử | Nhanh nhưng không tăng giá trị thật. Bỏ. |
| **B — Resolve ra đòn (CHỌN)** | Resolve kèm hành động thực thi nội dung + notify + lịch sử | Cân bằng giá trị/độ phức tạp. ✅ |
| C — Full suite | Danh mục, gom nhóm, audit log, phân trang, báo cáo user | Over-engineer giai đoạn này (YAGNI). Bỏ. |

## Giải pháp chốt (Hướng B)
**Nguyên tắc:** tái dùng logic sẵn có (DRY), không đổi schema Prisma (không migrate Turso — `resolution` text đã đủ ghi hành động).

### 1. Resolve enforce action
`resolveReport(reportId, { action, note })`. Hành động theo targetType, chạy trong 1 transaction cùng việc đóng report:
- **COURSE:** `UNPUBLISH` (status→DRAFT + lý do, biến mất khỏi public, revalidateTag courses) [mặc định] · `DELETE` (xóa hẳn, mạnh tay) · `NONE`
- **REVIEW:** `DELETE` (tái dùng logic deleteReview + recompute rating) · `NONE`
- **USER:** `SUSPEND` (tái dùng pattern suspendUser; chặn suspend admin/self) · `NONE`
- Luôn: report→RESOLVED, ghi `resolution` = mô tả hành động + note, `resolvedBy`/`resolvedAt`.
- Idempotency/permission: requireAdmin; target có thể đã bị xóa → xử lý gọn; report phải đang PENDING.

### 2. Thông báo lại người báo cáo
Khi resolve/dismiss → tạo Notification cho reporter ("Báo cáo của bạn đã được xử lý"). (Tùy chọn rẻ: báo cho chủ nội dung bị xử lý.)

### 3. Lịch sử đã xử lý
Trang `/admin/reports`: thêm khu/tab "Đã xử lý" liệt kê RESOLVED + DISMISSED (hành động đã làm, ai xử lý, khi nào). Phân trang nhẹ (take ~50).

## Quyết định mặc định (có thể override)
- COURSE: **Gỡ duyệt** (reversible, bảo vệ dữ liệu người mua) thay vì xóa hẳn.
- Admin **chọn hành động** khi resolve, có option "Không hành động (chỉ ghi chú)".

## File sẽ đụng (khi implement)
- `lib/validations/report.ts` — thêm `action` enum vào resolveSchema.
- `lib/actions/report.actions.ts` — enforce action + notify reporter; dismiss cũng notify.
- `components/admin/ReportCard.tsx` — đổi nút "Đã giải quyết" → bộ chọn hành động (dialog/dropdown) + note.
- `app/(admin)/admin/reports/page.tsx` — thêm khu "Đã xử lý".
- (tùy chọn) seed vài report mẫu để demo không trống.

## Rủi ro
- Xóa review phải recompute avgRating/reviewCount (tái dùng transaction của deleteReview).
- Suspend qua report: chặn nhằm vào admin/chính mình; report nhằm admin → từ chối hành động.
- Idempotency khi target đã bị xóa trước đó.
- KHÔNG đổi schema → KHÔNG migrate.

## Metric thành công
- Admin resolve 1 report COURSE → khóa lập tức biến mất khỏi `/courses`.
- Resolve REVIEW → review bị xóa, rating khóa cập nhật.
- Resolve USER (SUSPEND) → user bị khóa ngay (kết hợp Phase 05 đã làm).
- Reporter nhận thông báo; admin xem được lịch sử.

## Bước tiếp theo
Chờ user xác nhận 2 mặc định → triển khai (hoặc lập plan chi tiết trước).
