# Brainstorm Report — Eduta E-Learning 2.0

> Báo cáo tổng kết phiên brainstorm. Đây là **bản thỏa thuận cuối** giữa user và Solution Brainstormer.
> Mục đích: làm input cho phase `/plan` và `/cook` tiếp theo.

---

## 1. Problem Statement

Xây dựng web e-learning "giống Coursera" ở **quy mô đồ án cá nhân**, dùng làm bài tập lớn / project bảo vệ. Không cần production-grade, không cần user thật, không cần payment thật. Trọng tâm: **demo tốt** + **code sạch đủ trình bày**.

## 2. Ràng buộc đã xác nhận

| Yếu tố         | Giá trị                                          |
|----------------|--------------------------------------------------|
| Mục đích       | Đồ án / Bài tập lớn                              |
| Stack quen     | Next.js / React + Node                           |
| Timeline       | 1-2 tuần (sprint nhanh)                          |
| Database       | **SQLite** (file-based, đơn giản nhất)           |
| Payment        | **Mock payment** (không tích hợp thật)           |
| Certificate    | **BỎ** (giảm scope, save ~1 ngày)                |
| User roles     | STUDENT + ADMIN (hardcode admin)                 |
| Video          | YouTube embed (không tự host)                    |

## 3. Final Feature Scope

### MUST-HAVE (core demo)
- Auth: đăng ký / đăng nhập (email + password, có thể thêm Google OAuth nếu rảnh)
- Course catalog: trang chủ list khóa học, filter theo category
- Course detail: mô tả, danh sách module/lesson, preview
- Enrollment (mock payment): button "Đăng ký học" → modal giả lập thanh toán → tạo enrollment record
- Lesson viewer: YouTube embed + nội dung text/markdown
- Quiz: multiple choice, auto grading, lưu score
- Progress tracking: đã học bài nào, % hoàn thành khóa
- Admin dashboard: CRUD course/module/lesson/quiz

### NICE-TO-HAVE (làm nếu dư thời gian)
- Search course theo tên
- Course rating / review
- User profile page
- Dark mode
- Seed data đẹp (5-6 khóa giả + thumbnail từ Unsplash)

### EXPLICITLY OUT-OF-SCOPE
- ❌ Certificate generation
- ❌ Payment thật (Stripe/SePay)
- ❌ Video upload / hosting tự xây
- ❌ Discussion forum / comment
- ❌ Live session / streaming
- ❌ Multi-instructor marketplace
- ❌ Mobile app
- ❌ Email notifications
- ❌ i18n / đa ngôn ngữ
- ❌ Code grading sandbox
- ❌ Microservices, message queue, Redis

## 4. Approaches Evaluated

### Approach A: Monolith Next.js Full-stack ✅ **CHỌN**
**Pros:** 1 codebase, 1 deploy, Server Actions thay REST API, dev cực nhanh, đúng YAGNI/KISS.
**Cons:** Khó scale (không quan trọng với đồ án), khó tách team (cũng không quan trọng).

### Approach B: Next.js frontend + Express backend riêng
**Pros:** Tách concern rõ ràng, "đúng kiến trúc" theo giáo trình cũ.
**Cons:** Tốn 2x setup time, cần CORS, 2 deploy, không tận dụng Server Actions. **Over-engineered cho 2 tuần.**

### Approach C: NestJS + Next.js + tách DB
**Pros:** Enterprise pattern.
**Cons:** **Suicide cho deadline 2 tuần.** Loại.

→ **Kết luận:** Approach A. Không bàn cãi.

## 5. Final Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│  Framework      : Next.js 15 (App Router) — full-stack       │
│  Language       : TypeScript (strict)                        │
│  Database       : SQLite (file: ./prisma/dev.db)             │
│  ORM            : Prisma                                     │
│  Auth           : Auth.js v5 (NextAuth) — Credentials        │
│  UI             : shadcn/ui + Tailwind CSS                   │
│  Forms          : react-hook-form + zod                      │
│  Video          : YouTube iframe embed                       │
│  Payment        : Mock (UI giả lập, tạo Enrollment record)   │
│  File upload    : UploadThing free (thumbnail)               │
│                   HOẶC bỏ luôn, paste URL Unsplash           │
│  Markdown       : react-markdown (cho lesson content)        │
│  State mgmt     : KHÔNG có. Server Components + Server Actions│
│  Icons          : lucide-react                               │
│  Hosting        : Vercel free tier                           │
│  DB on prod     : SQLite trong volume / hoặc switch sang     │
│                   Turso (libSQL) free nếu Vercel ko persist  │
└─────────────────────────────────────────────────────────────┘
```

**⚠️ Lưu ý SQLite trên Vercel:** Vercel serverless không persist file system → nếu deploy lên Vercel cần switch sang **Turso** (libSQL, SQLite-compatible, free tier 500 DBs). Local dev vẫn dùng file `.db` thường. Prisma hỗ trợ cả 2.

## 6. Data Model (6 tables, ~30 fields total)

```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  password    String   // bcrypt hash
  role        Role     @default(STUDENT)
  createdAt   DateTime @default(now())
  enrollments Enrollment[]
  progress    LessonProgress[]
}

model Course {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  description String
  thumbnail   String   // URL
  price       Int      // VND
  published   Boolean  @default(false)
  category    String
  modules     Module[]
  enrollments Enrollment[]
  createdAt   DateTime @default(now())
}

model Module {
  id        String   @id @default(cuid())
  courseId  String
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  title     String
  order     Int
  lessons   Lesson[]
}

model Lesson {
  id        String   @id @default(cuid())
  moduleId  String
  module    Module   @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  title     String
  videoUrl  String   // YouTube URL
  content   String   // Markdown
  order     Int
  quiz      Quiz?
  progress  LessonProgress[]
}

model Quiz {
  id        String   @id @default(cuid())
  lessonId  String   @unique
  lesson    Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  questions Json     // [{ question, options: [], correctIndex }]
}

model Enrollment {
  id         String   @id @default(cuid())
  userId     String
  courseId   String
  user       User     @relation(fields: [userId], references: [id])
  course     Course   @relation(fields: [courseId], references: [id])
  enrolledAt DateTime @default(now())
  @@unique([userId, courseId])
}

model LessonProgress {
  id         String   @id @default(cuid())
  userId     String
  lessonId   String
  user       User     @relation(fields: [userId], references: [id])
  lesson     Lesson   @relation(fields: [lessonId], references: [id])
  completed  Boolean  @default(false)
  quizScore  Int?
  completedAt DateTime?
  @@unique([userId, lessonId])
}

enum Role { STUDENT ADMIN }
```

## 7. Page Map

| Route                              | Purpose                            | Auth          |
|------------------------------------|------------------------------------|---------------|
| `/`                                | Landing + featured courses         | Public        |
| `/courses`                         | Course catalog + search            | Public        |
| `/courses/[slug]`                  | Course detail + enroll button      | Public        |
| `/login` `/register`               | Auth                               | Public        |
| `/dashboard`                       | My enrolled courses + progress     | Student       |
| `/learn/[courseSlug]/[lessonId]`   | Lesson viewer + quiz               | Enrolled only |
| `/checkout/[courseId]`             | Mock payment modal                 | Student       |
| `/admin`                           | Admin home                         | Admin         |
| `/admin/courses`                   | List + CRUD courses                | Admin         |
| `/admin/courses/[id]/edit`         | Edit course + modules + lessons    | Admin         |

→ Tổng: **10 routes**. Đủ để demo "đầy đặn", không quá ít cũng không quá nhiều.

## 8. Roadmap 14 ngày (đã update sau khi bỏ certificate + mock payment)

| Ngày  | Việc                                                          | Định nghĩa "xong"                    |
|-------|----------------------------------------------------------------|--------------------------------------|
| 1     | Init: Next.js + Prisma + SQLite + Auth.js + shadcn + Tailwind  | `pnpm dev` chạy, login/register work |
| 2     | Schema Prisma + seed data (3 khóa giả, ~10 lessons)            | DB có data đẹp                       |
| 3-4   | Admin CRUD: Course + Module + Lesson + Quiz                    | Admin tạo được full khóa từ UI       |
| 5     | Landing page + course catalog + course detail page             | Học viên browse được khóa            |
| 6     | Enrollment + mock payment modal + access gate                  | Mua khóa → vào học được              |
| 7-8   | Lesson viewer (YouTube embed + markdown + sidebar navigation)  | Xem video + đọc nội dung work        |
| 9     | Quiz UI + submit + scoring + lưu `LessonProgress`              | Làm quiz có điểm                     |
| 10    | Dashboard học viên + progress tracking + % hoàn thành          | Thấy được tiến độ                    |
| 11    | UI polish: responsive, loading states, empty states            | Trông pro                            |
| 12    | Bug bash + edge cases (chưa login, chưa enroll, quiz fail...)  | Demo flow mượt                       |
| 13    | Deploy Vercel + Turso + README + screenshots                   | Public URL chạy                      |
| 14    | Buffer: viết slide / record demo video / chuẩn bị bảo vệ       | Sẵn sàng nộp                         |

## 9. Risks & Mitigation

| Risk                                          | Likelihood | Impact | Mitigation                                                  |
|-----------------------------------------------|------------|--------|-------------------------------------------------------------|
| SQLite không chạy được trên Vercel            | Cao        | Cao    | Switch sang Turso (libSQL) — chỉ đổi connection string      |
| Bị "stuck" lúc làm quiz UI                    | Trung      | Trung  | Dùng template từ shadcn examples + react-hook-form          |
| YouTube embed bị thầy hỏi "sao không tự host" | Trung      | Thấp   | Argument: tách concern, dùng infrastructure chuyên dụng     |
| Scope creep (muốn thêm feature giữa chừng)    | **Rất cao**| Cao    | **KHÔNG thêm gì ngoài MUST-HAVE cho đến ngày 12**           |
| UI xấu lúc demo                               | Trung      | Cao    | Dành nguyên ngày 11 polish + dùng shadcn template làm gốc   |
| Auth.js v5 docs còn shaky                     | Thấp       | Trung  | Có thể fallback Lucia hoặc roll-your-own JWT đơn giản       |

## 10. Success Metrics

Demo được coi là **thành công** khi tất cả flow sau chạy không lỗi trước giám khảo:

1. ✅ Đăng ký tài khoản mới → đăng nhập
2. ✅ Browse catalog → click vào 1 khóa → xem detail
3. ✅ Click "Đăng ký học" → mock payment → enrolled
4. ✅ Vào lesson đầu tiên → xem video YouTube → đánh dấu hoàn thành
5. ✅ Làm quiz → submit → thấy điểm
6. ✅ Vào dashboard → thấy % progress của khóa
7. ✅ Login admin → tạo khóa học mới + add module + lesson + quiz
8. ✅ Tất cả responsive (mobile + desktop)

## 11. Next Steps

1. **User confirm** báo cáo này (đọc lại, có chỉnh sửa gì không)
2. Chạy `/plan` hoặc `/cook` skill → để Claude tạo plan implementation chi tiết từ báo cáo này
3. Init project: `pnpm create next-app@latest eduta --typescript --tailwind --app`
4. Setup Prisma + Auth.js theo schema ở section 6
5. Bắt đầu coding theo roadmap section 8

## 12. Open Questions (cần user quyết định khi bắt đầu code)

- [ ] Tên thật của app? (thay "Eduta" hay giữ?)
- [ ] Tiếng Việt hay English UI? → đề xuất: **Tiếng Việt** (đồ án VN)
- [ ] Admin email mặc định? → đề xuất: hardcode trong `.env` (`ADMIN_EMAIL=...`)
- [ ] Categories cố định nào? → đề xuất: `["Lập trình", "Thiết kế", "Kinh doanh", "Ngoại ngữ"]`
- [ ] Có dùng UploadThing không hay paste URL Unsplash? → đề xuất: **paste URL** cho gọn

---

**Ký xác nhận:**
- Brainstormer: Solution Brainstormer (Claude)
- User: batovananh108@gmail.com
- Ngày: 2026-05-22
- Status: ✅ Sẵn sàng cho phase planning/implementation
