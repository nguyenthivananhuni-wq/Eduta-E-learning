# Phase 03 — Seed mẫu (tùy chọn) + build + deploy

**Context:** [plan.md](plan.md) · Phụ thuộc: 01 & 02 hoàn tất.

## Overview
- **Ngày:** 2026-05-30
- **Mô tả:** (Tùy chọn) seed vài báo cáo mẫu cho local demo; verify build; commit + push deploy.
- **Ưu tiên:** Cao (bước cuối).
- **Trạng thái:** ⬜ Chưa làm · **Review:** Chờ duyệt
- **Ảnh hưởng production:** CÓ — deploy.

## Key Insights
- KHÔNG đổi schema → KHÔNG migrate Turso.
- Seed chỉ chạy local (`db:seed`/reset) → **không** làm prod hết trống; trang prod chỉ có data khi user thật báo cáo. Vì vậy seed chỉ phục vụ demo local.
- Deploy = push `main` → Vercel auto-deploy (như các lần trước).

## Requirements
- (Tùy chọn) thêm vài `Report` mẫu vào seed: 1 COURSE pending, 1 REVIEW pending, 1 đã RESOLVED (có resolution) để demo cả 2 khu.
- `npm run typecheck` + `npm run build` sạch.
- Commit conventional + push `main`.

## Architecture
- Nếu seed: thêm block tạo Report trong `prisma/seed.ts` (dùng id user/course/review đã seed). Không bắt buộc; quyết theo câu trả lời user.

## Related code files
- **(Tùy chọn) Sửa:** `prisma/seed.ts` — thêm vài Report mẫu.
- Không sửa code khác ở phase này.

## Implementation Steps
1. (Nếu chọn seed) thêm Report mẫu vào `prisma/seed.ts`; chạy `npm run db:seed` để test local.
2. `npm run typecheck`.
3. `npm run build`.
4. `git add -A && git commit -m "feat(moderation): resolve báo cáo kèm hành động thực thi + lịch sử + notify reporter"`.
5. Push `main` → Vercel auto-deploy.
6. Smoke test.

## Todo list
- [ ] (tùy chọn) seed Report mẫu + test local
- [ ] typecheck pass
- [ ] build pass
- [ ] commit + push main
- [ ] smoke test live

## Success Criteria (smoke test)
- Tạo 1 báo cáo thật (báo cáo 1 khóa) → xuất hiện ở khu PENDING.
- Admin resolve với "Gỡ duyệt" → khóa biến mất khỏi `/courses`; report xuống khu "Đã xử lý"; reporter có thông báo.
- Build log Vercel sạch.

## Risk Assessment
- **Thấp.** Không đổi schema. Rollback: Vercel promote previous / `git revert`.

## Security Considerations
- Không commit secrets. Seed không chứa dữ liệu nhạy cảm thật.

## Next steps
- Sau deploy: cân nhắc các mục YAGNI đã hoãn (danh mục lý do, gom nhóm) nếu có volume thật.
