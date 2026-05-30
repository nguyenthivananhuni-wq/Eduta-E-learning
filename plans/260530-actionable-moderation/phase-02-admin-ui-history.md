# Phase 02 — Admin UI: bộ chọn hành động + lịch sử đã xử lý

**Context:** [plan.md](plan.md) · Phụ thuộc: Phase 01 (action enum + resolveReport mới).

## Overview
- **Ngày:** 2026-05-30
- **Mô tả:** ReportCard cho admin chọn hành động khi resolve; trang reports thêm khu "Đã xử lý".
- **Ưu tiên:** Cao (mặt tiền tính năng).
- **Trạng thái:** ⬜ Chưa làm · **Review:** Chờ duyệt
- **Ảnh hưởng production:** CÓ — UI khu admin.

## Key Insights
- `ReportCard` hiện chỉ có nút "Đã giải quyết" (gọi `resolveReport(id, {})`) + "Bỏ qua".
- Trang reports chỉ hiện PENDING; resolved chỉ đếm số → cần khu lịch sử.
- Action khả dụng phụ thuộc targetType (COURSE/REVIEW/USER) — đã có guard ở backend, UI chỉ hiện đúng lựa chọn.

## Requirements
- ReportCard: thay nút resolve đơn bằng **bộ chọn hành động** + ô ghi chú (tùy chọn), rồi xác nhận.
  - COURSE: "Gỡ duyệt khóa" (mặc định) · "Xóa khóa học" · "Chỉ ghi chú".
  - REVIEW: "Xóa đánh giá" · "Chỉ ghi chú".
  - USER: "Khóa tài khoản" · "Chỉ ghi chú".
  - Nếu `target.exists === false` → chỉ cho "Chỉ ghi chú" + Bỏ qua.
  - Hành động mạnh (xóa khóa/khóa user) nên có bước xác nhận (AlertDialog).
- Trang reports: thêm khu/tab **"Đã xử lý"** liệt kê RESOLVED + DISMISSED (take ~50): loại, nhãn target, hành động (`resolution`), người xử lý, thời gian.

## Architecture
- UI dùng component sẵn có: `DropdownMenu`/`Select` + `AlertDialog` (đã có trong components/ui). Tránh thêm dependency.
- Khu lịch sử: query thêm trong page (RESOLVED+DISMISSED) + resolve target labels (tái dùng `resolveTarget` đã có trong page) → tách `resolveTarget` ra dùng chung cho cả 2 danh sách nếu cần.
- Hiển thị resolver: include `resolver: { name }` (quan hệ `Report.resolver`).

## Related code files
- **Sửa:** `components/admin/ReportCard.tsx` — bộ chọn hành động theo targetType + note + confirm; gọi `resolveReport(id, { action, resolution })`.
- **Sửa:** `app/(admin)/admin/reports/page.tsx` — query + render khu "Đã xử lý"; bỏ chỉ-đếm-số sang danh sách.
- **(Tùy chọn) Tạo:** `components/admin/ResolvedReportCard.tsx` — thẻ gọn cho mục đã xử lý (nếu ReportCard không tái dùng tốt).

## Implementation Steps
1. `ReportCard.tsx`: thêm state action (default theo targetType) + note; map targetType→options; nút mạnh bọc AlertDialog; submit gọi resolveReport mới.
2. `reports/page.tsx`: thêm `db.report.findMany({ where:{ status:{ in:["RESOLVED","DISMISSED"] }}, include:{ reporter, resolver }, orderBy:{ resolvedAt:"desc" }, take:50 })`; resolve target labels; render khu "Đã xử lý" dưới khu PENDING.
3. `npm run typecheck`.

## Todo list
- [ ] ReportCard: bộ chọn hành động theo target + note + confirm
- [ ] Vô hiệu hành động khi target đã xóa
- [ ] Trang reports: khu "Đã xử lý" (resolver, hành động, thời gian)
- [ ] typecheck pass

## Success Criteria
- Admin mở 1 report COURSE → thấy mặc định "Gỡ duyệt khóa", đổi được sang Xóa/Chỉ ghi chú.
- Xóa khóa/khóa user yêu cầu xác nhận.
- Sau xử lý, report chuyển xuống khu "Đã xử lý" với đúng hành động + người xử lý.

## Risk Assessment
- **Thấp–trung bình.** UI thuần; rủi ro chính là khớp đúng action↔targetType (backend đã guard nên an toàn kép).

## Security Considerations
- UI chỉ là tiện ích; mọi kiểm tra quyền/hành động nằm ở server (Phase 01).

## Next steps
→ Phase 03 (seed tùy chọn + build + deploy).
