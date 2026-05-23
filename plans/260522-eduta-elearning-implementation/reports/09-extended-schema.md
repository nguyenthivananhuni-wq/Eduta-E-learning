# Report 09 — Extended Prisma Schema (For Phase 07 Foundation Migration + Phase 08-11)

Full schema after marketplace expansion. ~18 tables total. Reference for **Phase 07 Foundation Migration** (single atomic migration `marketplace_foundation` containing User+Course refactor + 4 new tables) + Phase 08-11 incremental migrations.

**Phase mapping (post-restructure 2026-05-23):**
- Phase 07 (merged): Role, INSTRUCTOR + InstructorApplication + Wallet + Transaction + Notification + Course.instructorId + Course.status enum (replaces published) + User.suspended.
- Phase 08: Review + Course.avgRating + Course.reviewCount.
- Phase 09: RecommendationCache.
- Phase 10: Attachment.
- Phase 11: Report + ReportTargetType + ReportStatus enums.

## Final `prisma/schema.prisma`

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"] // Turso compat
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ============ ENUMS ============

enum Role {
  STUDENT
  INSTRUCTOR    // NEW Phase 07
  ADMIN
}

enum ApplicationStatus {  // NEW Phase 07
  PENDING
  APPROVED
  REJECTED
}

enum CourseStatus {       // NEW Phase 09 (replaces Course.published)
  DRAFT
  PENDING
  APPROVED
  REJECTED
}

enum TransactionType {    // NEW Phase 08
  TOPUP
  PURCHASE
  EARNING
  REFUND
}

enum TransactionStatus {  // NEW Phase 08
  PENDING
  COMPLETED
  FAILED
}

enum ReportTargetType {   // NEW Phase 13
  COURSE
  USER
  REVIEW
}

enum ReportStatus {       // NEW Phase 13
  PENDING
  RESOLVED
  DISMISSED
}

// ============ CORE MODELS ============

model User {
  id          String           @id @default(cuid())
  email       String           @unique
  name        String
  password    String
  role        Role             @default(STUDENT)
  suspended   Boolean          @default(false)   // NEW Phase 13
  createdAt   DateTime         @default(now())

  enrollments       Enrollment[]
  progress          LessonProgress[]
  applications      InstructorApplication[]    @relation("UserApplications")          // Phase 07
  reviewedApps      InstructorApplication[]    @relation("AppReviewer")               // Phase 07
  courses           Course[]                   @relation("InstructorCourses")         // Phase 07
  reviewedCourses   Course[]                   @relation("CourseReviewer")            // Phase 09
  wallet            Wallet?                                                            // Phase 08
  transactions      Transaction[]                                                      // Phase 08
  notifications     Notification[]                                                     // Phase 09
  reviews           Review[]                                                            // Phase 10
  recommendationCache RecommendationCache?                                              // Phase 11
  reports           Report[]                   @relation("Reporter")                   // Phase 13
  resolvedReports   Report[]                   @relation("Resolver")                   // Phase 13

  @@index([email])
  @@index([role])
  @@index([suspended])
}

model Course {
  id              String       @id @default(cuid())
  slug            String       @unique
  title           String
  description     String
  thumbnail       String
  price           Int
  status          CourseStatus @default(DRAFT)      // CHANGED Phase 09 (was published Boolean)
  rejectionReason String?                            // NEW Phase 09
  reviewedAt      DateTime?                          // NEW Phase 09
  reviewedBy      String?                            // NEW Phase 09
  category        String
  instructorId    String?                            // NEW Phase 07
  avgRating       Float?                             // NEW Phase 10 (denormalized)
  reviewCount     Int          @default(0)           // NEW Phase 10 (denormalized)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  modules         Module[]
  enrollments     Enrollment[]
  reviews         Review[]                                                              // Phase 10
  instructor      User?        @relation("InstructorCourses", fields: [instructorId], references: [id], onDelete: SetNull) // Phase 07
  reviewer        User?        @relation("CourseReviewer",    fields: [reviewedBy],   references: [id], onDelete: SetNull) // Phase 09

  @@index([slug])
  @@index([category])
  @@index([status])
  @@index([instructorId])
  @@index([avgRating])
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
  id          String           @id @default(cuid())
  moduleId    String
  title       String
  videoUrl    String
  content     String
  order       Int              @default(0)

  module      Module           @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  quiz        Quiz?
  progress    LessonProgress[]
  attachments Attachment[]                                                              // Phase 12

  @@index([moduleId, order])
}

model Quiz {
  id        String @id @default(cuid())
  lessonId  String @unique
  questions String

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
  quizScore   Int?
  completedAt DateTime?

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson      Lesson    @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])
  @@index([userId])
}

// ============ NEW MODELS — PHASE 07 ============

model InstructorApplication {
  id              String            @id @default(cuid())
  userId          String
  bio             String
  expertise       String
  status          ApplicationStatus @default(PENDING)
  rejectionReason String?
  createdAt       DateTime          @default(now())
  reviewedAt      DateTime?
  reviewedBy      String?

  user      User  @relation("UserApplications", fields: [userId],     references: [id], onDelete: Cascade)
  reviewer  User? @relation("AppReviewer",      fields: [reviewedBy], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([status])
}

// ============ NEW MODELS — PHASE 08 ============

model Wallet {
  id        String   @id @default(cuid())
  userId    String   @unique
  balance   Int      @default(0)  // VND
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Transaction {
  id          String            @id @default(cuid())
  userId      String
  type        TransactionType
  amount      Int               // VND, always positive; type determines credit/debit
  status      TransactionStatus @default(COMPLETED)
  courseId    String?
  description String
  metadata    String?           // JSON stringified, optional
  createdAt   DateTime          @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([type])
  @@index([createdAt])
}

// ============ NEW MODELS — PHASE 09 ============

model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String   // "COURSE_APPROVED" | "COURSE_REJECTED" | "APP_APPROVED" | "APP_REJECTED" | ...
  title     String
  message   String
  link      String?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, read])
  @@index([createdAt])
}

// ============ NEW MODELS — PHASE 10 ============

model Review {
  id        String   @id @default(cuid())
  userId    String
  courseId  String
  rating    Int      // 1-5, enforced via zod
  comment   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user   User   @relation(fields: [userId],   references: [id], onDelete: Cascade)
  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, courseId])
  @@index([courseId, createdAt])
}

// ============ NEW MODELS — PHASE 11 ============

model RecommendationCache {
  id          String   @id @default(cuid())
  userId      String   @unique
  courseIds   String   // JSON array stringified
  reasoning   String
  generatedAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ============ NEW MODELS — PHASE 12 ============

model Attachment {
  id        String   @id @default(cuid())
  lessonId  String
  name      String
  url       String
  order     Int      @default(0)
  createdAt DateTime @default(now())

  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@index([lessonId, order])
}

// ============ NEW MODELS — PHASE 13 ============

model Report {
  id          String           @id @default(cuid())
  reporterId  String
  targetType  ReportTargetType
  targetId    String           // polymorphic, no FK enforcement
  reason      String
  status      ReportStatus     @default(PENDING)
  createdAt   DateTime         @default(now())
  resolvedAt  DateTime?
  resolvedBy  String?

  reporter User  @relation("Reporter", fields: [reporterId], references: [id], onDelete: Cascade)
  resolver User? @relation("Resolver", fields: [resolvedBy], references: [id], onDelete: SetNull)

  @@index([status, createdAt])
  @@index([targetType, targetId])
}
```

## Migration Order Matrix

| Phase | Migration name             | Tables/Fields introduced                                                                  |
|-------|----------------------------|-------------------------------------------------------------------------------------------|
| 01    | `init`                     | User, Course, Module, Lesson, Quiz, Enrollment, LessonProgress                            |
| 07    | `multi_instructor`         | + Role.INSTRUCTOR, ApplicationStatus, InstructorApplication, Course.instructorId           |
| 08    | `wallet_system`            | + TransactionType, TransactionStatus, Wallet, Transaction                                  |
| 09    | `course_approval`          | + CourseStatus, Notification, Course.{status, rejectionReason, reviewedAt, reviewedBy}; − Course.published |
| 10    | `reviews`                  | + Review, Course.avgRating, Course.reviewCount                                             |
| 11    | `recommendation_cache`     | + RecommendationCache                                                                     |
| 12    | `attachments`              | + Attachment                                                                              |
| 13    | `admin_enhancements`       | + User.suspended, ReportTargetType, ReportStatus, Report                                   |

## Backfill Scripts (Pseudo-code)

### Phase 07 — Assign existing courses to admin (`scripts/backfill-instructor.ts`)
```ts
const admin = await db.user.findUnique({ where: { email: process.env.ADMIN_EMAIL! }});
if (!admin) throw new Error("Admin user not found — run seed first");

const updated = await db.course.updateMany({
  where: { instructorId: null },
  data: { instructorId: admin.id },
});
console.log(`Backfilled ${updated.count} courses → admin`);
```

### Phase 08 — Create wallets for existing users (`scripts/backfill-wallets.ts`)
```ts
const users = await db.user.findMany({ where: { wallet: null }, select: { id: true }});
for (const u of users) {
  await db.wallet.create({ data: { userId: u.id, balance: 0 }});
}
console.log(`Created ${users.length} wallets`);
```

### Phase 09 — Migrate `published` boolean → `status` enum (inline migration SQL)
```sql
-- In generated migration.sql, insert between ADD COLUMN and DROP COLUMN:
ALTER TABLE "Course" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'DRAFT';
UPDATE "Course" SET "status" = CASE WHEN "published" = 1 THEN 'APPROVED' ELSE 'DRAFT' END;
ALTER TABLE "Course" DROP COLUMN "published";
ALTER TABLE "Course" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "Course" ADD COLUMN "reviewedAt" DATETIME;
ALTER TABLE "Course" ADD COLUMN "reviewedBy" TEXT;
```

> SQLite ALTER limited: may need temp table + copy if DROP COLUMN not supported in target SQLite version. Prisma handles via auto-generated migration; verify before applying.

## ER Diagram (ASCII)

```
                    +---------+         +-----------------------+
                    |  User   |---1:1---|        Wallet         |
                    +---------+         +-----------------------+
                      | | | | | | |
        +-------------+ | | | | | +------------------+
        |               | | | | |                    |
   1:N  |          1:N  | | | | |  1:N          1:N  |
        v               v | | | v                    v
 +-------------+ +-------------+ | | +---------------+ +----------+
 | Enrollment  | |  Review    |  | | | Transaction   | | Report   |
 +-------------+ +------------+  | | +---------------+ +----------+
        |               |        | |        |
        |               |        | +-1:N-> Notification
        |               |        |
        v               v        +-1:N-> InstructorApplication
 +-------------+ +------------+
 |   Course    |<-1:N-+      |
 |  (status)   |      |      |
 +-------------+      |      |
        |             |      |
   1:N  |        FK   |      | FK
        v             |      |
 +-------------+      |      |
 |   Module    |      |      |
 +-------------+   InstructorId  ReviewedBy
        |
   1:N  |
        v
 +-------------+
 |   Lesson    |---1:1---+ Quiz
 +-------------+         |
   |       |             |
   |  1:N  | 1:N         |
   v       v             |
 Attach LessonProgress   |
                         |
                  (no model RecommendationCache shown — 1:1 with User)
```

## Index strategy summary

| Table                  | Indexes                                                          |
|------------------------|------------------------------------------------------------------|
| User                   | email (unique), role, suspended                                  |
| Course                 | slug (unique), category, status, instructorId, avgRating         |
| Module                 | (courseId, order)                                                |
| Lesson                 | (moduleId, order)                                                |
| Enrollment             | (userId, courseId) unique, userId, courseId                      |
| Review                 | (userId, courseId) unique, (courseId, createdAt)                 |
| Transaction            | userId, type, createdAt                                          |
| Notification           | (userId, read), createdAt                                        |
| InstructorApplication  | userId, status                                                   |
| Attachment             | (lessonId, order)                                                |
| Report                 | (status, createdAt), (targetType, targetId)                      |
| RecommendationCache    | userId (unique)                                                  |

## Final count

- **Models:** 14 (User, Course, Module, Lesson, Quiz, Enrollment, LessonProgress, InstructorApplication, Wallet, Transaction, Notification, Review, RecommendationCache, Attachment, Report) — 15 actually.
- **Enums:** 7 (Role, ApplicationStatus, CourseStatus, TransactionType, TransactionStatus, ReportTargetType, ReportStatus).
- **Migrations:** 8 (init + 7 expansions).
