# Phase 06 — Build, kiểm tra & redeploy

**Context:** [plan.md](plan.md) · Phụ thuộc: 01–05 hoàn tất.

## Overview
- **Ngày:** 2026-05-30
- **Mô tả:** Verify toàn bộ (typecheck + build), commit, redeploy Vercel + Turso. KHÔNG migrate DB (không đổi schema).
- **Ưu tiên:** Cao (bước cuối).
- **Trạng thái:** ⬜ Chưa làm · **Review:** Chờ duyệt
- **Ảnh hưởng production:** CÓ — đẩy bản mới lên live.

## Key Insights
- KHÔNG sửa `schema.prisma` → KHÔNG cần `prisma migrate`/đẩy schema lên Turso. DB live giữ nguyên.
- `lib/db.ts` tự chọn libSQL adapter khi `DATABASE_URL` bắt đầu `libsql:`/`https:` → cấu hình runtime, không cần đổi.
- Git đang có 2 file chưa track: `prisma/turso-schema.sql`, `scripts/push-schema-to-turso.mjs` (script tiện ích deploy) → quyết định commit hay gitignore.
- Branch hiện tại: `main`. Commit gần nhất đã "production-ready for Vercel + Turso".
- Phase 05 thêm query DB trong helper Node runtime — KHÔNG ảnh hưởng edge build, nhưng kiểm tra build kỹ.

## Requirements
- `npm run typecheck` sạch.
- `npm run build` (next build) thành công.
- Commit conventional, push lên `main`.
- Deploy: Vercel auto-deploy khi push (nếu Git tích hợp) HOẶC `vercel --prod`.
- Xác nhận env vars production đầy đủ.

## Architecture / Env vars cần có trên Vercel
| Var | Bắt buộc | Ghi chú |
|-----|----------|---------|
| `DATABASE_URL` | ✅ | `libsql://...` (Turso) |
| `TURSO_AUTH_TOKEN` | ✅ | token Turso |
| `NEXTAUTH_SECRET` (hoặc `AUTH_SECRET`) | ✅ | ký JWT |
| `NEXTAUTH_URL` | ✅ | URL production |
| `ADMIN_EMAIL` | ✅ | email được auto-gán ADMIN khi đăng ký |
| `ANTHROPIC_API_KEY` | ⬜ tùy chọn | recommendations/insights (có fallback) |

## Related code files
- Không sửa code ở phase này (chỉ build/deploy). Có thể đụng `.gitignore` nếu chọn bỏ qua 2 file tiện ích.

## Implementation Steps
1. `npm run typecheck` → fix nếu lỗi.
2. `npm run build` → fix nếu lỗi (chú ý edge runtime: roles.ts không kéo db vào middleware; auth-helpers chỉ chạy Node).
3. Quyết định 2 file untracked: commit (nếu là script deploy hữu ích) hoặc thêm `.gitignore`. Đề xuất: commit `scripts/push-schema-to-turso.mjs` + `prisma/turso-schema.sql` nếu phục vụ vận hành.
4. `git add -A && git commit -m "refactor(roles): phân cấp vai trò, tách ngữ cảnh UX, admin không bán khóa, chặn self-enroll, vá session suspended"`.
5. Push `main`. Nếu Vercel Git-connected → auto build. Nếu không → `vercel --prod`.
6. Smoke test production (mục Success Criteria).

## Todo list
- [ ] typecheck pass
- [ ] build pass
- [ ] Xử lý 2 file untracked
- [ ] commit + push
- [ ] deploy (auto hoặc vercel --prod)
- [ ] smoke test live

## Success Criteria (smoke test live)
- Đăng nhập 3 vai trò → vào đúng nhà (admin/instructor/dashboard).
- UserMenu hiện đúng khu vực; link chuyển khu vực đúng quyền.
- Trang ví tách 2 nhóm.
- Admin không có lối tạo khóa; instructor tạo khóa OK; admin duyệt OK.
- Instructor không tự ghi danh khóa mình; học viên ghi danh + học bình thường.
- Suspend user đang đăng nhập → bị đẩy ra ngay; promote → instructor vào /instructor ngay.
- Không lỗi 500; build log Vercel sạch.

## Risk Assessment
- **Trung bình.** Rủi ro lớn nhất: build fail do edge runtime import. Giảm thiểu: roles.ts pure (Phase 01), db chỉ trong helper Node (Phase 05).
- Rollback: Vercel "Promote previous deployment" hoặc `git revert` rồi push.

## Security Considerations
- Không log secrets. Xác nhận `NEXTAUTH_SECRET` production khác dev.
- KHÔNG commit `.env`/token.

## Next steps
- Sau deploy: cân nhắc nhóm "Ngoài plan" (phân trang catalog, tìm kiếm case-insensitive, reset status khi sửa khóa, WELCOME_BONUS).
