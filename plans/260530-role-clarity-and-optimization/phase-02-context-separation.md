# Phase 02 — Tách bạch ngữ cảnh UX

**Context:** [plan.md](plan.md) · Phụ thuộc: Phase 01 (`homePathFor`, `areaLabel`).

## Overview
- **Ngày:** 2026-05-30
- **Mô tả:** Người dùng luôn biết mình đang ở "khu vực" nào; đăng nhập vào đúng nhà theo vai trò; ví tách rõ tiền tiêu (học) vs tiền kiếm (dạy).
- **Ưu tiên:** Cao (tác động lớn nhất tới cảm giác "rối").
- **Trạng thái:** ⬜ Chưa làm · **Review:** Chờ duyệt
- **Ảnh hưởng production:** CÓ — đổi đích redirect sau login; đổi bố cục trang ví.

## Key Insights
- `auth.config.ts` hiện đẩy MỌI role về `/dashboard` khi đã login mà vào `/login|/register` ([auth.config.ts:28-30]).
- `UserMenu` đã có link tới /instructor & /admin nhưng không hiện "đang ở chế độ nào".
- Ví: `getTransactions` trả mọi giao dịch trộn lẫn; loại có sẵn: TOPUP/PURCHASE/EARNING/REFUND.

## Requirements
- Sau login: ADMIN→`/admin`, INSTRUCTOR→`/instructor`, còn lại→`/dashboard`.
- UserMenu hiển thị nhãn khu vực hiện tại + nhóm link "Chuyển khu vực" gọn (chỉ hiện link mà role có quyền).
- Trang `/wallet`: 2 nhóm rõ ràng — "Chi tiêu học tập" (TOPUP, PURCHASE, REFUND) và "Doanh thu giảng dạy" (EARNING). Nhóm doanh thu chỉ hiện khi `can(role,'teach')` hoặc có giao dịch EARNING.

## Architecture
- Redirect: chỉ sửa nhánh `isOnAuth && isLoggedIn` trong `authorized()` dùng `homePathFor(role)`. (Lưu ý: callback nhận role qua `auth.user.role` — đã có.)
- Ví: tách phía server (page) — chia mảng `transactions` theo `type` rồi render 2 `TransactionList`. Không cần query mới (đơn giản, ít rủi ro). Tùy chọn: thêm `getTransactions` filter param nếu danh sách dài (>50) — để sau.

## Related code files
- **Sửa:** `auth.config.ts` (redirect theo role).
- **Sửa:** `components/layout/UserMenu.tsx` (nhãn khu vực + nhóm chuyển khu vực; dùng `areaLabel`, `can`).
- **Sửa:** `app/(student)/wallet/page.tsx` (chia 2 nhóm; truyền `session.user.role`).
- **Sửa (nhỏ):** `components/wallet/TransactionList.tsx` (nhận prop `title`/`emptyText` nếu cần) — hoặc bọc ở page.
- **Tùy chọn:** `components/instructor/InstructorNavLinks.tsx` (đổi label "Ví & doanh thu" → trỏ `/wallet` vẫn ok vì ví đã tách rõ).

## Implementation Steps
1. `auth.config.ts`: `return Response.redirect(new URL(homePathFor(role), nextUrl))` ở nhánh isOnAuth.
2. `UserMenu.tsx`: thêm dòng "Đang ở: {areaLabel(role)}" trong DropdownMenuLabel; nhóm các link khu vực dùng `can(role,'teach')` / `can(role,'moderate')` thay so sánh literal.
3. `wallet/page.tsx`: lấy `role` từ session; `const spend = txns.filter(t => t.type!=="EARNING"); const earn = txns.filter(t=>t.type==="EARNING")`; render section "Chi tiêu học tập" luôn, section "Doanh thu giảng dạy" khi `can(role,'teach') || earn.length>0`.
4. `npm run typecheck`.

## Todo list
- [ ] Redirect theo role trong auth.config.ts
- [ ] Nhãn khu vực + chuyển khu vực trong UserMenu
- [ ] Tách 2 nhóm giao dịch ở wallet page
- [ ] (tùy chọn) chỉnh label InstructorNavLinks
- [ ] typecheck pass

## Success Criteria
- Admin login → vào `/admin` (không phải /dashboard).
- UserMenu cho biết rõ khu vực hiện tại; chỉ hiện link role được phép.
- Trang ví: tiền tiêu và doanh thu nằm 2 khu riêng, có tiêu đề rõ.

## Risk Assessment
- **Thấp–trung bình.** `Response.redirect` trong authorized callback đã dùng sẵn → an toàn. Cần test middleware không lặp redirect.
- Ví tách nhóm thuần client-render, không đổi dữ liệu.

## Security Considerations
- Redirect chỉ tới path nội bộ cố định từ `homePathFor` (không nhận input ngoài) → không có open-redirect.

## Next steps
→ Phase 03 (chính sách admin).
