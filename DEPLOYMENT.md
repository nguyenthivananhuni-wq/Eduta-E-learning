# Deployment Guide — Eduta E-learning

Hướng dẫn deploy lên **Vercel + Turso** (free tier, 10 phút).

> **Tại sao Vercel + Turso?** Stack match Next.js 15 native (Vercel = công ty làm Next.js). Turso là libSQL HTTP, drop-in replacement SQLite — chỉ cần đổi `DATABASE_URL`.

---

## Step 1: Tạo Turso database (3 phút)

1. Truy cập **https://turso.tech** → đăng nhập bằng GitHub
2. Click **Create database**:
   - Name: `eduta-prod` (hoặc tên gì cũng được)
   - Region: chọn `Singapore (sin)` hoặc `Tokyo (nrt)` (gần Việt Nam)
3. Sau khi tạo, click vào DB → tab **Overview**, lấy:
   - **Database URL** — dạng `libsql://eduta-prod-yourname.turso.io`
4. Tab **Connect** → **Create Token** → đặt expiration `Never` → copy token

Bạn sẽ có 2 giá trị:
```
DATABASE_URL = libsql://eduta-prod-xxx.turso.io
TURSO_AUTH_TOKEN = eyJhbGc...long-jwt-token...
```

---

## Step 2: Push schema + seed data lên Turso (2 phút)

Trên máy local, chạy:

```bash
# 1) Set tạm thời ENV để chạy 2 lệnh sau (PowerShell)
$env:DATABASE_URL = "libsql://eduta-prod-xxx.turso.io"
$env:TURSO_AUTH_TOKEN = "eyJhbGc..."

# 2) Push schema lên Turso (tạo tables)
npx prisma db push --skip-generate

# 3) Seed data (users, courses, demo learners…)
node --import tsx prisma/seed.ts
```

Nếu trên Linux/Mac:
```bash
export DATABASE_URL="libsql://eduta-prod-xxx.turso.io"
export TURSO_AUTH_TOKEN="eyJhbGc..."
npx prisma db push --skip-generate
node --import tsx prisma/seed.ts
```

Kiểm tra: vào Turso dashboard → DB → tab **Tables** thấy `User`, `Course`, `Wallet`, … là OK.

---

## Step 3: Deploy lên Vercel (5 phút)

### 3.1. Import project

1. Truy cập **https://vercel.com** → đăng nhập bằng GitHub
2. Click **Add New** → **Project**
3. Chọn repo `nguyenthivananhuni-wq/Eduta-E-learning` → **Import**
4. Vercel tự detect Next.js. Giữ defaults:
   - Framework: **Next.js**
   - Build command: `next build`
   - Install command: `pnpm install` (Vercel auto)
   - Output: `.next`

### 3.2. Cấu hình Environment Variables

Trước khi click Deploy, mở section **Environment Variables**, thêm:

| Name | Value | Note |
|---|---|---|
| `DATABASE_URL` | `libsql://eduta-prod-xxx.turso.io` | Từ Step 1 |
| `TURSO_AUTH_TOKEN` | `eyJhbGc...` | Từ Step 1 |
| `NEXTAUTH_SECRET` | (random 32 ký tự) | Tạo bằng `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Vercel sẽ cho biết sau deploy lần đầu |
| `ADMIN_EMAIL` | `admin@eduta.local` | Email admin (theo seed) |
| `ANTHROPIC_API_KEY` | *(để trống)* | Optional, tự fallback rule-based |

> **Lưu ý `NEXTAUTH_URL`:** lần deploy đầu Vercel sẽ cho URL kiểu `eduta-e-learning-xyz.vercel.app`. Sau khi có URL, vào Settings → Environment Variables → cập nhật `NEXTAUTH_URL` cho khớp → trigger redeploy.

### 3.3. Click Deploy

Vercel build trong ~2-3 phút. Nếu thấy error xem mục **Troubleshooting** bên dưới.

Deploy xong → click **Visit** → trang chủ Eduta hiển thị.

---

## Step 4: Test sau deploy

Mở URL Vercel:
- [ ] `/` — landing page load ok
- [ ] `/courses` — catalog hiển thị 6 khóa (1 real + 5 dummy)
- [ ] `/login` — đăng nhập `admin@eduta.local` / `admin123` → vào `/admin`
- [ ] `/login` — đăng nhập `student@eduta.local` / `student123` → có ví 500k
- [ ] `/register` — đăng ký user mới → ví được tạo (balance = 0)
- [ ] `/wallet` — top-up 200k → balance update
- [ ] `/checkout/[id]` — mua khóa 100k → balance giảm còn 600k

---

## Troubleshooting

### Build fail: "PrismaClientInitializationError"
- ENV `DATABASE_URL` thiếu hoặc sai → check lại Step 3.2
- Token Turso hết hạn → tạo token mới

### Build fail: "Module not found: @libsql/client"
- Vercel chưa install deps mới → trigger redeploy thủ công

### Build fail: "EPERM rename query_engine"
- Lỗi này chỉ xảy ra trên Windows local. Vercel chạy Linux nên không gặp.

### Runtime error: "no such table: User"
- Quên Step 2 (push schema + seed). Chạy lại với DATABASE_URL trỏ Turso.

### Login fail: "Configuration error"
- `NEXTAUTH_SECRET` không set → check ENV vars
- `NEXTAUTH_URL` không khớp với URL Vercel → cập nhật + redeploy

### `/admin/analytics` chậm hoặc timeout
- Free tier Turso có rate limit. Nâng cấp nếu nhiều traffic.

---

## Reseed production data (nếu cần reset)

```bash
$env:DATABASE_URL = "libsql://eduta-prod-xxx.turso.io"
$env:TURSO_AUTH_TOKEN = "eyJhbGc..."

# WARNING: xóa hết data
npx prisma db push --force-reset --skip-generate
node --import tsx prisma/seed.ts
```

---

## Cost estimate (free tier)

| Service | Free limit | Eduta usage | Đủ không? |
|---|---|---|---|
| **Vercel Hobby** | 100GB bandwidth/mo, ∞ requests | <1GB cho demo | ✅ Dư |
| **Turso Starter** | 1GB storage, 1B row reads/mo | <50MB | ✅ Dư |
| **Anthropic API** | $5 free credit khi đăng ký | ~$0.01/call Haiku | ✅ Cho demo |

---

## Cập nhật code sau khi deploy

Chỉ cần `git push` lên GitHub → Vercel auto-deploy preview branch + production khi merge `main`.

```bash
git add .
git commit -m "feat: ..."
git push
```
