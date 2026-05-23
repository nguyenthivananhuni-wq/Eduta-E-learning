# Brainstorm Decisions — Phase 07-13 Reconciliation (2026-05-23)

> Decisions chốt sau brainstorm session về việc tích hợp Phase 07-13 với code Phase 01-05 đã có.

## ✅ Decisions

### 1. Approach: **Foundation Migration (A)**
Tạo Phase 6.5 ("Foundation Migration") làm 1 migration tổng hợp cho toàn bộ schema changes BEFORE bắt đầu marketplace features. Sau đó Phase 10-13 chỉ thêm features, không touch schema cũ.

### 2. Plan structure
- **Gộp Phase 07 + 08 + 09 → "Phase 07: Marketplace Foundation"** vì 3 phase này liên kết chặt (role + instructorId + wallet + course status đều phải migrate cùng nhau)
- **Thêm "Pre-requisites & Refactor" section** vào mỗi phase mới — liệt kê file existing nào phải sửa
- Phase 10-13 giữ độc lập như cũ

### 3. Deploy timing: **SKIP Phase 06 ngay**
Tập trung marketplace trước. Deploy 1 lần cuối khi mọi feature done.

## 🆕 New phase structure

| # | Theme | Notes |
|---|-------|-------|
| 06 | Deploy + Demo | **SKIP for now** — defer to last |
| 07 | **Marketplace Foundation** (NEW MERGED) | Role INSTRUCTOR + Course.instructorId + Wallet + Course.status enum + Notification — all schema migrations + refactor existing |
| 08 | Reviews & Ratings | (was Phase 10) |
| 09 | AI Recommendation | (was Phase 11) |
| 10 | File Attachments | (was Phase 12) |
| 11 | Admin Enhancements | (was Phase 13) |
| 12 | Deploy + Demo | (was Phase 06, moved to last) |

## 🔧 Pre-requisites template per phase

Mỗi phase mới phải có section:

```markdown
## Pre-requisites & Existing Code Refactor

### Schema changes
- [ ] Migration name
- [ ] Backfill needed: ...

### Files to modify (existing code)
- [ ] `path/to/file.tsx` — what changes
- [ ] ...

### New files
- [ ] `path/to/new-file.tsx` — purpose
```

## 📋 Confirmed conflicts (must address in Phase 07)

| # | Conflict | Resolution |
|---|----------|------------|
| 1 | `Course.published: Boolean` → `status: Enum` | Migration: published=true → APPROVED, false → DRAFT |
| 2 | Course thiếu instructorId | Backfill: assign all to admin user |
| 3 | Mock checkout (`MockPaymentScreen.tsx`) → wallet purchase | Rewrite component + `enrollCourse` action |
| 4 | Role union `STUDENT \| ADMIN` → add `INSTRUCTOR` | Update `types/next-auth.d.ts` + middleware |
| 5 | Seed data | Rewrite to include wallets + status + instructorId |
| 6 | `EnrollButton` thiếu "insufficient balance" state | Add new state |
| 7 | `SiteHeader` không có notification bell | Add NotificationBell component |
| 8 | `/admin` overview cần revamp | Defer to Phase 11 (Admin Enhancements) |

## 📝 Next actions

1. **Update plan.md** với phase numbering mới + status table
2. **Rewrite Phase 07** thành "Marketplace Foundation" merged
3. **Renumber Phase 10-13 → Phase 08-11**
4. **Move Phase 06 deploy to Phase 12**
5. **Add "Pre-requisites & Refactor"** section to all merged + new phases

## 🚀 Implementation order (sau khi update plan)

```
Phase 07 (Foundation) → Phase 08 (Reviews) → Phase 09 (AI) → Phase 10 (Files) → Phase 11 (Admin) → Phase 12 (Deploy)
```

Phase 07 = blocker for everything else (cung cấp wallet, instructor role, course status).
