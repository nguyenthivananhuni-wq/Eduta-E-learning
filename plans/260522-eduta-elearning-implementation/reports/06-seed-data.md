# Report 06 — Seed Data (UPDATED)

> **Scope change 2026-05-22:** Chỉ **1 khóa "thật"** với content đầy đủ (Tiếng Anh 10 Global Success, Unit 1-3). 5 khóa "giả" hiển thị **"Coming Soon"** badge để catalog trông đầy đặn.

## Strategy

- **1 REAL course** (Tiếng Anh 10) → có đủ modules + lessons + videoUrl thật từ YouTube + markdown content + quiz multiple choice. **Đây là khóa duy nhất chạy được full flow demo.**
- **5 DUMMY courses** → chỉ có title + thumbnail + description đẹp. **Không có module/lesson nào**. Catalog page detect `lessonCount === 0` → render "Coming Soon" badge + disable enroll button.
- **Không cần schema change** — dùng `_count` của Prisma để check.

## Categories (lock)
```ts
const CATEGORIES = ["Lập trình", "Thiết kế", "Kinh doanh", "Ngoại ngữ"] as const;
```

## Users (2)

| Role    | Email                | Name           | Password (plain → bcrypt hash) |
|---------|----------------------|----------------|-------------------------------|
| ADMIN   | `admin@eduta.local`  | Quản trị viên  | `admin123`                    |
| STUDENT | `student@eduta.local`| Học viên Demo  | `student123`                  |

→ `process.env.ADMIN_EMAIL` lookup → assign ADMIN role to matching email.

---

## 🎯 REAL Course — Tiếng Anh 10 Global Success (Unit 1-3)

```yaml
slug: tieng-anh-10-global-success-unit-1-3
title: "Tiếng Anh 10 — Global Success (Unit 1-3)"
description: "Khóa học bám sát SGK Tiếng Anh 10 bộ Global Success. Bao gồm 3 Unit đầu: Family Life, Humans and the Environment, Music. Có video bài giảng, tổng hợp từ vựng, ngữ pháp và quiz luyện tập sau mỗi unit."
thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800"
price: 0
category: "Ngoại ngữ"
published: true
```

### Module 1 — Unit 1: Family Life (order 1)

| # | Lesson Title                                  | videoUrl (YouTube search keyword)         | Có quiz |
|---|------------------------------------------------|-------------------------------------------|---------|
| 1 | Getting Started — Family Life                  | "tiếng anh 10 unit 1 getting started"     | No      |
| 2 | Vocabulary — Household chores & responsibility | "tiếng anh 10 unit 1 vocabulary"          | **Yes** |
| 3 | Grammar — Present simple vs Present continuous | "present simple vs continuous tiếng việt" | **Yes** |
| 4 | Reading — Family bonds and routines            | "tiếng anh 10 unit 1 reading"             | No      |
| 5 | Listening + Speaking practice                  | "tiếng anh 10 unit 1 listening"           | **Yes** |

### Module 2 — Unit 2: Humans and the Environment (order 2)

| # | Lesson Title                                  | videoUrl (YouTube search keyword)              | Có quiz |
|---|------------------------------------------------|------------------------------------------------|---------|
| 1 | Getting Started — Environment problems         | "tiếng anh 10 unit 2 getting started"          | No      |
| 2 | Vocabulary — Environmental issues              | "tiếng anh 10 unit 2 vocabulary"               | **Yes** |
| 3 | Grammar — Comparative & superlative adjectives | "so sánh hơn nhất tiếng anh lớp 10"           | **Yes** |
| 4 | Reading — Plastic pollution                    | "tiếng anh 10 unit 2 reading"                  | No      |
| 5 | Listening + Project ideas                      | "tiếng anh 10 unit 2 listening"                | **Yes** |

### Module 3 — Unit 3: Music (order 3)

| # | Lesson Title                                  | videoUrl (YouTube search keyword)         | Có quiz |
|---|------------------------------------------------|-------------------------------------------|---------|
| 1 | Getting Started — Talking about music          | "tiếng anh 10 unit 3 getting started"     | No      |
| 2 | Vocabulary — Music genres & instruments        | "tiếng anh 10 unit 3 vocabulary"          | **Yes** |
| 3 | Grammar — To-infinitive & gerunds              | "to infinitive gerund tiếng anh 10"       | **Yes** |
| 4 | Reading — A music festival                     | "tiếng anh 10 unit 3 reading"             | No      |
| 5 | Listening + Music project                      | "tiếng anh 10 unit 3 listening"           | **Yes** |

**Total:** 3 modules × 5 lessons = **15 lessons**, **9 quizzes**.

> **Lưu ý:** videoUrl thực tế sẽ paste link YouTube cụ thể khi seed. Trong plan này chỉ ghi keyword để search. Admin có thể chỉnh sửa sau qua UI admin.

### Quiz mẫu (Module 1 — Lesson 2: Vocabulary)

```json
{
  "questions": [
    {
      "question": "Which word means 'làm việc nhà'?",
      "options": ["Housework", "Homework", "Housekeeper", "Housing"],
      "correctIndex": 0
    },
    {
      "question": "'To do the laundry' nghĩa là gì?",
      "options": ["Lau nhà", "Giặt giũ", "Nấu ăn", "Đi chợ"],
      "correctIndex": 1
    },
    {
      "question": "Choose the correct word: 'My mother often ____ the dishes after dinner.'",
      "options": ["wash", "washes", "washing", "washed"],
      "correctIndex": 1
    },
    {
      "question": "Which is NOT a household chore?",
      "options": ["Sweeping the floor", "Watering plants", "Playing games", "Taking out the trash"],
      "correctIndex": 2
    },
    {
      "question": "'Responsibility' có nghĩa là gì?",
      "options": ["Trách nhiệm", "Sự tự do", "Sự nghỉ ngơi", "Sự giải trí"],
      "correctIndex": 0
    }
  ]
}
```

### Quiz mẫu (Module 1 — Lesson 3: Grammar)

```json
{
  "questions": [
    {
      "question": "Choose the correct tense: 'She ____ to school every day.'",
      "options": ["go", "goes", "is going", "went"],
      "correctIndex": 1
    },
    {
      "question": "'Look! The baby ____' — which is correct?",
      "options": ["cry", "cries", "is crying", "cried"],
      "correctIndex": 2
    },
    {
      "question": "Present simple dùng để diễn tả điều gì?",
      "options": [
        "Hành động đang xảy ra lúc nói",
        "Thói quen, sự thật hiển nhiên",
        "Hành động đã hoàn thành",
        "Dự định tương lai"
      ],
      "correctIndex": 1
    }
  ]
}
```

### Markdown content mẫu (Module 1 — Lesson 2: Vocabulary)

```md
# Unit 1 — Vocabulary: Household Chores

## 📚 Từ vựng chính

| English             | Phonetic        | Vietnamese            |
|---------------------|-----------------|------------------------|
| housework           | /ˈhaʊswɜːrk/    | việc nhà               |
| chore               | /tʃɔːr/         | việc vặt               |
| responsibility      | /rɪˌspɒnsəˈbɪləti/ | trách nhiệm         |
| do the laundry      | -               | giặt giũ               |
| sweep the floor     | -               | quét nhà               |
| take out the trash  | -               | đổ rác                 |
| water the plants    | -               | tưới cây               |

## 💡 Cụm động từ thường dùng

- **do the dishes** — rửa bát
- **make the bed** — dọn giường
- **cook meals** — nấu ăn
- **iron clothes** — là quần áo

## ✍️ Ví dụ trong câu

> *"In my family, everyone has their own **responsibility**. I usually **do the dishes** after dinner, while my brother **takes out the trash**."*

## 🎯 Mục tiêu sau bài học

- Biết ít nhất 15 từ vựng về việc nhà
- Dùng được các cụm từ trong câu hoàn chỉnh
- Hoàn thành quiz cuối bài đạt ≥ 70%
```

---

## 🚧 DUMMY Courses (5 — Coming Soon)

> Mục đích: làm catalog page trông đầy đặn. **Không có module/lesson** → catalog detect 0 lessons → render "Coming Soon" badge + disable button.

| # | Slug                          | Title                                  | Category   | Price    | Thumbnail (Unsplash)                                    |
|---|-------------------------------|-----------------------------------------|------------|----------|---------------------------------------------------------|
| 1 | `nhap-mon-python-hoc-sinh`    | Nhập môn Python cho học sinh THPT       | Lập trình  | 0        | `photo-1526379095098-d400fd0bf935?w=800`                |
| 2 | `thiet-ke-canva-co-ban`       | Thiết kế đồ họa với Canva cho người mới | Thiết kế   | 199000   | `photo-1561070791-2526d30994b8?w=800`                   |
| 3 | `khoi-nghiep-tuoi-18`         | Khởi nghiệp khi còn là học sinh         | Kinh doanh | 299000   | `photo-1664575602276-acd073f104c1?w=800`                |
| 4 | `lap-trinh-scratch-tre-em`    | Lập trình Scratch cho trẻ em            | Lập trình  | 0        | `photo-1610484826917-0f101a7a87c8?w=800`                |
| 5 | `photoshop-can-ban`           | Photoshop căn bản cho người mới         | Thiết kế   | 399000   | `photo-1611162616475-46b635cb6868?w=800`                |

**Tất cả dummy courses:**
- `published: true` (để hiển thị trong catalog)
- `description`: 1-2 câu mô tả ngắn hấp dẫn
- **0 modules, 0 lessons, 0 quizzes**

### "Coming Soon" UI logic (frontend)

```tsx
// Trong CourseCard component
const isComingSoon = course._count.modules === 0;

{isComingSoon ? (
  <Badge variant="secondary">Sắp ra mắt</Badge>
  <Button disabled>Sắp có</Button>
) : (
  <Button>Xem khóa học</Button>
)}
```

→ Bonus: trang `/courses/[slug]` của khóa "Coming Soon" có thể render placeholder "Khóa học đang được biên soạn..." nếu user vẫn vào.

---

## Summary

| Type        | Count | Modules | Lessons | Quizzes |
|-------------|-------|---------|---------|---------|
| REAL course | 1     | 3       | 15      | 9       |
| DUMMY       | 5     | 0       | 0       | 0       |
| **TOTAL**   | **6** | **3**   | **15**  | **9**   |

---

## Seed script pattern `prisma/seed.ts`

```ts
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@eduta.local";

async function main() {
  // 1. Users
  const admin = await db.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      name: "Quản trị viên",
      password: await bcrypt.hash("admin123", 10),
      role: Role.ADMIN,
    },
  });

  const student = await db.user.upsert({
    where: { email: "student@eduta.local" },
    update: {},
    create: {
      email: "student@eduta.local",
      name: "Học viên Demo",
      password: await bcrypt.hash("student123", 10),
      role: Role.STUDENT,
    },
  });

  // 2. REAL course — Tiếng Anh 10
  const englishCourse = await db.course.upsert({
    where: { slug: "tieng-anh-10-global-success-unit-1-3" },
    update: {},
    create: {
      slug: "tieng-anh-10-global-success-unit-1-3",
      title: "Tiếng Anh 10 — Global Success (Unit 1-3)",
      description: "Khóa học bám sát SGK Tiếng Anh 10 bộ Global Success...",
      thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
      price: 0,
      category: "Ngoại ngữ",
      published: true,
    },
  });

  // 3 modules × 5 lessons — iterate
  const units = [
    { title: "Unit 1: Family Life", lessons: [...] },
    { title: "Unit 2: Humans and the Environment", lessons: [...] },
    { title: "Unit 3: Music", lessons: [...] },
  ];

  for (const [moduleOrder, unit] of units.entries()) {
    const mod = await db.module.create({
      data: { courseId: englishCourse.id, title: unit.title, order: moduleOrder + 1 },
    });
    for (const [lessonOrder, lesson] of unit.lessons.entries()) {
      const created = await db.lesson.create({
        data: {
          moduleId: mod.id,
          title: lesson.title,
          videoUrl: lesson.videoUrl,
          content: lesson.content,
          order: lessonOrder + 1,
        },
      });
      if (lesson.quiz) {
        await db.quiz.create({
          data: { lessonId: created.id, questions: lesson.quiz },
        });
      }
    }
  }

  // 3. DUMMY courses — just metadata
  const dummies = [
    { slug: "nhap-mon-python-hoc-sinh", title: "Nhập môn Python cho học sinh THPT", category: "Lập trình", price: 0, thumbnail: "..." },
    // ... 4 more
  ];
  for (const d of dummies) {
    await db.course.upsert({
      where: { slug: d.slug },
      update: {},
      create: { ...d, description: "...", published: true },
    });
  }

  // 4. Demo enrollment cho student (optional, đẹp dashboard)
  await db.enrollment.upsert({
    where: { userId_courseId: { userId: student.id, courseId: englishCourse.id } },
    update: {},
    create: { userId: student.id, courseId: englishCourse.id },
  });

  console.log("✅ Seed done");
}

main().catch(console.error).finally(() => db.$disconnect());
```

## YouTube video URL handling

- Trong seed script: dùng `videoUrl` placeholder hoặc link YouTube tìm được
- Admin có thể edit lại từng lesson sau qua UI admin
- Format chấp nhận: `https://youtu.be/XXX`, `https://www.youtube.com/watch?v=XXX`, embed URL
- Component `<VideoPlayer />` parse YouTube ID và render iframe
