# Kế hoạch: Phát triển Báo cáo nội dung → Actionable Moderation (Hướng B)

**Ngày:** 2026-05-30 · **Loại:** Feature (không đổi schema) · **Trạng thái:** 🟡 Chờ duyệt
**Nguồn:** [brainstorm chốt](../260530-role-clarity-and-optimization/reports/brainstorm-actionable-moderation.md)

## Mục tiêu
Biến hàng đợi `/admin/reports` từ "to-do list" thành moderation thật: khi admin xử lý báo cáo,
hệ thống **thực thi hành động lên nội dung** (gỡ duyệt khóa / xóa review / khóa user), **thông báo lại
người báo cáo**, và admin **xem được lịch sử** đã xử lý.

## Nguyên tắc
- KHÔNG đổi `prisma/schema.prisma`, KHÔNG migrate Turso (dùng `Report.resolution` text ghi hành động).
- Tái dùng logic sẵn có (DRY): recompute rating khi xóa review, pattern suspendUser, course status, notification.
- Thay đổi tối thiểu, mỗi phase verify bằng `typecheck`/`build`.

## Quyết định mặc định (assumption — đổi được)
- COURSE: hành động mặc định **Gỡ duyệt** (status→DRAFT, reversible) thay vì xóa hẳn.
- Admin **chọn hành động** khi resolve; luôn có option **"Chỉ ghi chú (không hành động)"**.

## Các phase
| # | Phase | Trạng thái | Ảnh hưởng prod |
|---|-------|-----------|----------------|
| 01 | [Backend: resolve enforce + validation + notify](phase-01-resolve-enforcement-backend.md) | ✅ Xong (typecheck pass) | Có (hành vi resolve) |
| 02 | [Admin UI: bộ chọn hành động + lịch sử đã xử lý](phase-02-admin-ui-history.md) | ✅ Xong (build pass) | Có (UI admin) |
| 03 | [Seed mẫu (tùy chọn) + build + deploy](phase-03-seed-build-deploy.md) | ⬜ Chưa làm | Có (deploy) |

## Thứ tự thực thi
01 → 02 → 03. typecheck sau 01 & 02. Phase 03 build + deploy (push main → Vercel auto-deploy).

## Phạm vi NGOÀI plan (YAGNI — để sau)
- Danh mục lý do báo cáo (thay text tự do).
- Gom nhóm nhiều report cùng target.
- Audit log riêng, phân trang nâng cao.
- UI báo cáo USER (target USER hiện không có nút báo cáo ở client).

## Câu hỏi mở
1. Xác nhận 2 mặc định ở trên (COURSE=gỡ duyệt; có option chỉ-ghi-chú)?
2. Có seed báo cáo mẫu cho local demo không (không ảnh hưởng prod)? — quyết ở Phase 03.
