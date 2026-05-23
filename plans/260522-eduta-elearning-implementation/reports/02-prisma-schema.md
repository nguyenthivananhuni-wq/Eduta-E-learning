# Report 02 — Prisma Schema

Complete schema sẵn paste vào `prisma/schema.prisma`. Hoạt động cho cả SQLite (local) và Turso (libSQL prod).

## `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

enum Role {
  STUDENT
  ADMIN
}

model User {
  id          String           @id @default(cuid())
  email       String           @unique
  name        String
  password    String           // bcryptjs hash
  role        Role             @default(STUDENT)
  createdAt   DateTime         @default(now())

  enrollments Enrollment[]
  progress    LessonProgress[]

  @@index([email])
}

model Course {
  id          String       @id @default(cuid())
  slug        String       @unique
  title       String
  description String
  thumbnail   String       // URL (Unsplash)
  price       Int          // VND (Int, không dùng float)
  published   Boolean      @default(false)
  category    String       // "Lập trình" | "Thiết kế" | "Kinh doanh" | "Ngoại ngữ"
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  modules     Module[]
  enrollments Enrollment[]

  @@index([slug])
  @@index([category])
  @@index([published])
}

model Module {
  id        String   @id @default(cuid())
  courseId  String
  title     String
  order     Int      @default(0)

  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons   Lesson[]

  @@index([courseId, order])
}

model Lesson {
  id        String           @id @default(cuid())
  moduleId  String
  title     String
  videoUrl  String           // YouTube URL
  content   String           // Markdown text
  order     Int              @default(0)

  module    Module           @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  quiz      Quiz?
  progress  LessonProgress[]

  @@index([moduleId, order])
}

model Quiz {
  id        String @id @default(cuid())
  lessonId  String @unique
  questions String // JSON.stringify([{ question, options: string[], correctIndex: number }])
                   // KHÔNG dùng Json type vì SQLite không native support — stringify manually

  lesson    Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
}

model Enrollment {
  id         String   @id @default(cuid())
  userId     String
  courseId   String
  enrolledAt DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  course     Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, courseId])
  @@index([userId])
  @@index([courseId])
}

model LessonProgress {
  id          String    @id @default(cuid())
  userId      String
  lessonId    String
  completed   Boolean   @default(false)
  quizScore   Int?      // 0-100, null nếu chưa làm quiz
  completedAt DateTime?

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson      Lesson    @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])
  @@index([userId])
}
```

## Decision notes

| Decision                                | Reason                                                                    |
|-----------------------------------------|---------------------------------------------------------------------------|
| `cuid()` thay UUID                      | Shorter, sortable, no extension                                           |
| `price Int` thay Float/Decimal          | VND không decimal, Int đủ. Avoid floating-point error                     |
| `Quiz.questions String` thay `Json`     | SQLite không native JSON. Stringify trong action, parse khi đọc           |
| `onDelete: Cascade` toàn bộ FK          | Đồ án, đơn giản. Xóa course → cleanup tự động                            |
| `category String` thay enum             | Flexibility tăng category sau, KHÔNG cần migrate enum                     |
| `@@index` trên FK cột                   | Speed up join queries (catalog, dashboard)                                |
| `updatedAt` chỉ trên Course             | YAGNI cho các model khác (đồ án không track audit)                       |

## Migration command

```bash
# First time
pnpm prisma migrate dev --name init

# After schema change
pnpm prisma migrate dev --name <descriptive_name>

# Production (Turso)
pnpm prisma migrate deploy
```

## Turso compatibility note

Khi switch prod sang Turso (libSQL):
- `provider` vẫn là `"sqlite"` (libSQL wire-compatible).
- `DATABASE_URL` đổi thành `libsql://<db>.turso.io?authToken=<token>`.
- Có 2 options:
  - **Option A (simple):** Dùng `@libsql/client` + `@prisma/adapter-libsql` driver adapter (requires `previewFeatures = ["driverAdapters"]` trong generator block, và instantiate `PrismaClient({ adapter })` trong `lib/db.ts`).
  - **Option B (Turso embedded replica):** Dùng `turso db shell` để apply migrations. Phức tạp hơn, KHÔNG đề xuất.

→ Plan dùng **Option A** ở Phase 06. Xem [reports/08-deploy-checklist.md](./08-deploy-checklist.md).

## Verification queries (test sau migrate)

```bash
pnpm prisma studio   # Mở GUI, verify tables
```

Hoặc SQL trực tiếp:
```sql
SELECT name FROM sqlite_master WHERE type='table';
-- expect: User, Course, Module, Lesson, Quiz, Enrollment, LessonProgress + prisma migrations table
```
