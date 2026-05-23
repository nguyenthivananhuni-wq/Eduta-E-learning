# Phase 01 — Foundation Setup

## Context links
- Parent: [plan.md](./plan.md)
- Source: [BRAINSTORM_REPORT.md](../../BRAINSTORM_REPORT.md) §5, §6
- Refs: [reports/02-prisma-schema.md](./reports/02-prisma-schema.md), [reports/03-auth-setup.md](./reports/03-auth-setup.md), [reports/06-seed-data.md](./reports/06-seed-data.md), [reports/01-file-structure.md](./reports/01-file-structure.md)
- Dependencies: none (first phase)

## Overview
- **Date:** 2026-05-22
- **Days:** 1-2
- **Description:** Bootstrap Next.js project, cài deps, init Prisma + SQLite, setup Auth.js v5 Credentials, shadcn theme, base layout, seed 3 khóa giả. Kết thúc Phase 01: chạy được `pnpm dev`, register/login work, DB có data.
- **Priority:** Critical (blocker cho mọi phase sau)
- **Implementation status:** Not Started
- **Review status:** Not Reviewed

## Key Insights
- Auth.js v5 Credentials cần JWT session (database session phức tạp với Edge runtime của middleware).
- bcryptjs (not bcrypt) — pure JS, không cần native compile, tránh issue trên Windows.
- Prisma Client phải export 1 singleton để tránh hot-reload tạo connection leak.
- `next-auth@beta` v5 API: `authConfig` tách khỏi `auth()` để middleware Edge dùng được.
- shadcn dùng CLI `init` để config Tailwind + cssvars + utils sẵn.

## Requirements
1. Next.js 15 App Router + TypeScript strict + Tailwind sẵn sàng.
2. Prisma + SQLite kết nối được, schema migrate xong.
3. Auth.js v5 Credentials: register form + login form work, session lưu JWT.
4. shadcn/ui init xong, ít nhất Button + Input + Card available.
5. Middleware bảo vệ `/dashboard`, `/admin`, `/learn`.
6. Seed script tạo: 1 admin user + 1 student user + 3 courses + 6 modules + 12 lessons + 6 quizzes.
7. `.env.example` rõ ràng.

## Architecture
- **Single Next.js app** under repo root (no monorepo).
- DB file: `prisma/dev.db` (gitignored), schema in `prisma/schema.prisma`.
- Auth: `auth.ts` root + `auth.config.ts` (Edge-safe) + `middleware.ts` root + `app/api/auth/[...nextauth]/route.ts`.
- Prisma singleton: `lib/db.ts`.
- All env in `.env.local` (gitignored) + `.env.example` (committed).

**Data flow (auth):**
```
Browser form → react-hook-form + zod → POST credentials
  → signIn("credentials") → auth.ts authorize() → Prisma.user.findUnique
  → bcrypt.compare → JWT session → cookie set → redirect /dashboard
```

## Related code files
**Create:**
- `package.json`
- `tsconfig.json` (strict)
- `next.config.ts`
- `tailwind.config.ts`
- `postcss.config.mjs`
- `components.json` (shadcn)
- `.env.local` (local, gitignored)
- `.env.example`
- `.gitignore`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `lib/db.ts`
- `lib/auth.ts`
- `auth.ts` (root)
- `auth.config.ts` (root, Edge-safe)
- `middleware.ts` (root)
- `app/api/auth/[...nextauth]/route.ts`
- `app/layout.tsx`
- `app/page.tsx` (temp landing)
- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`
- `app/(auth)/layout.tsx`
- `lib/validations/auth.ts` (zod schemas)
- `lib/actions/auth.actions.ts` (register Server Action)
- `components/ui/button.tsx` (shadcn)
- `components/ui/input.tsx`
- `components/ui/card.tsx`
- `components/ui/form.tsx`
- `components/ui/label.tsx`
- `components/ui/toast.tsx` (shadcn sonner)
- `app/globals.css`

## Implementation Steps

1. **Init project**: `pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*"`.
2. **Confirm tsconfig.json** has `"strict": true`, `"noUncheckedIndexedAccess": true`.
3. **Install core deps**:
   ```
   pnpm add prisma @prisma/client next-auth@beta @auth/prisma-adapter
   pnpm add bcryptjs zod react-hook-form @hookform/resolvers
   pnpm add react-markdown lucide-react sonner
   pnpm add -D @types/bcryptjs tsx
   ```
4. **Init Prisma**: `pnpm prisma init --datasource-provider sqlite`. Paste schema từ `reports/02-prisma-schema.md`. Run `pnpm prisma migrate dev --name init`.
5. **Create Prisma singleton** `lib/db.ts`:
   ```ts
   import { PrismaClient } from "@prisma/client";
   const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
   export const db = globalForPrisma.prisma ?? new PrismaClient();
   if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
   ```
6. **Init shadcn/ui**: `pnpm dlx shadcn@latest init` → choose: slate base color, CSS vars yes. Add components: `pnpm dlx shadcn@latest add button input card form label sonner`.
7. **Setup Auth.js v5** theo `reports/03-auth-setup.md`:
   - `auth.config.ts` (Edge-safe, no Prisma).
   - `auth.ts` (Node, uses Prisma + bcrypt).
   - `middleware.ts` (uses authConfig only).
   - `app/api/auth/[...nextauth]/route.ts`.
8. **Create zod schemas** `lib/validations/auth.ts`: `registerSchema`, `loginSchema`.
9. **Create Server Action** `lib/actions/auth.actions.ts`: `registerUser(input)` → validate zod → check email unique → bcrypt hash → create User → return result.
10. **Build login + register pages** under `app/(auth)/`: shadcn Form + react-hook-form + zod resolver. Login uses `signIn("credentials")`. Register calls Server Action then `signIn`.
11. **Build root layout** `app/layout.tsx`: HTML lang="vi", Toaster from sonner, fonts (Inter/Geist).
12. **Build temp landing** `app/page.tsx`: hero "Eduta — Học mọi lúc mọi nơi" + link to /courses + login/register.
13. **Write seed script** `prisma/seed.ts` theo `reports/06-seed-data.md`. Add to `package.json` scripts: `"db:seed": "tsx prisma/seed.ts"`. Add prisma config: `"prisma": { "seed": "tsx prisma/seed.ts" }`.
14. **Run seed**: `pnpm db:seed`. Verify with `pnpm prisma studio`.
15. **Test**: `pnpm dev`. Manually register → login → logout flow. Confirm session cookie set.

## Todo list
- [ ] Step 1: scaffold Next.js app
- [ ] Step 2: confirm strict tsconfig
- [ ] Step 3: install all deps
- [ ] Step 4: init Prisma + migrate
- [ ] Step 5: create `lib/db.ts` singleton
- [ ] Step 6: shadcn init + add base components
- [ ] Step 7: Auth.js v5 wiring (auth.ts + auth.config.ts + middleware.ts + route handler)
- [ ] Step 8: zod schemas
- [ ] Step 9: registerUser Server Action
- [ ] Step 10: login + register pages
- [ ] Step 11: root layout + Toaster
- [ ] Step 12: temp landing page
- [ ] Step 13: seed script
- [ ] Step 14: run seed + verify in Studio
- [ ] Step 15: smoke test register/login/logout

## Success Criteria
- `pnpm dev` boots không lỗi, no console error.
- Truy cập `/register` → submit → user xuất hiện trong `prisma studio`, password đã hash.
- Login với email/password vừa tạo → redirect về `/`, cookie `authjs.session-token` được set.
- Logout → cookie xóa, không access được `/dashboard`.
- Middleware redirect `/dashboard` → `/login` khi chưa login.
- Seed chạy idempotent (run nhiều lần không lỗi unique constraint).
- `prisma studio` hiển thị: ≥ 2 users, ≥ 3 courses, ≥ 6 modules, ≥ 12 lessons, ≥ 6 quizzes.

## Risk Assessment
| Risk                                       | Likelihood | Impact | Mitigation                                                                  |
|--------------------------------------------|------------|--------|-----------------------------------------------------------------------------|
| Auth.js v5 beta API breaking change        | Med        | High   | Pin version, follow official v5 migration guide, không update giữa sprint    |
| bcrypt native compile fail Windows         | Med        | Med    | Dùng `bcryptjs` (pure JS), không phải `bcrypt`                              |
| Prisma client hot-reload memory leak       | Low        | Low    | Singleton pattern bắt buộc                                                  |
| Middleware Edge runtime import Prisma fail | High       | High   | Tách `auth.config.ts` (Edge-safe) khỏi `auth.ts` (Node)                     |
| Seed script chạy 2 lần ra duplicate        | Med        | Low    | Dùng `upsert` thay `create`, key by email/slug                              |

## Security Considerations
- Password: bcryptjs với salt rounds = 10 minimum.
- Email field: unique constraint Prisma + zod email validation.
- Register form: rate limit chưa cần (đồ án), nhưng zod check password ≥ 8 ký tự.
- NEVER trả password hash về client. Prisma select chỉ field cần.
- `.env.local` MUST gitignored. `NEXTAUTH_SECRET` random ≥ 32 ký tự.
- JWT session strategy: `session: { strategy: "jwt" }` — tránh DB session vì Edge middleware không query Prisma được.
- CSRF: Auth.js v5 mặc định built-in, không cần config thêm.

## Next steps
→ [Phase 02 — Admin CRUD](./phase-02-admin-crud.md)
