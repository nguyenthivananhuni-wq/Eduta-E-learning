# Report 04 — Server Actions Catalog

Tất cả mutations đi qua Server Actions. KHÔNG REST/API routes (ngoại trừ Auth.js callback).

Pattern chung mỗi action:
1. `"use server"` directive đầu file
2. Auth check (`requireAuth` / `requireAdmin`)
3. Zod validate input
4. Prisma mutation
5. `revalidatePath` các route bị ảnh hưởng
6. Return `{ ok: true, ...data }` hoặc `{ ok: false, error: string }`

---

## 1. `lib/actions/auth.actions.ts`

### `registerUser`
```ts
async function registerUser(input: unknown): Promise<{ ok: true } | { ok: false; error: string }>
```
- **Input zod:** `registerSchema` = `{ email: z.string().email(), name: z.string().min(2).max(50), password: z.string().min(8).max(72) }`
- **Side effects:** hash password, create User, role = ADMIN nếu email = `ADMIN_EMAIL` env, else STUDENT
- **Auth required:** NO (public action)
- **Revalidate:** none

---

## 2. `lib/actions/course.actions.ts`

### `createCourse`
```ts
async function createCourse(input: unknown): Promise<{ ok: true; id: string } | { ok: false; error: string }>
```
- **Input zod:** `courseSchema` = `{ title: string(min 3), slug: string(regex kebab), description: string(min 10), thumbnail: string.url(), price: int.min(0), category: enum(CATEGORIES), published: boolean }`
- **Auth:** requireAdmin
- **Revalidate:** `/admin/courses`, `/courses`

### `updateCourse`
```ts
async function updateCourse(id: string, input: unknown): Promise<{ ok: true } | { ok: false; error: string }>
```
- **Input:** id + partial courseSchema
- **Auth:** requireAdmin
- **Revalidate:** `/admin/courses`, `/admin/courses/[id]/edit`, `/courses`, `/courses/[slug]`

### `deleteCourse`
```ts
async function deleteCourse(id: string): Promise<{ ok: true } | { ok: false; error: string }>
```
- **Auth:** requireAdmin
- **Side effects:** cascade delete modules + lessons + quizzes + enrollments + progress
- **Revalidate:** `/admin/courses`, `/courses`

### `togglePublish`
```ts
async function togglePublish(id: string): Promise<{ ok: true; published: boolean } | { ok: false }>
```
- **Auth:** requireAdmin
- **Revalidate:** `/admin/courses`, `/courses`

---

## 3. `lib/actions/module.actions.ts`

### `createModule`
```ts
async function createModule(input: { courseId: string; title: string }): Promise<{ ok: true; id: string } | { ok: false; error: string }>
```
- **Input zod:** `{ courseId: cuid, title: string(min 2) }`
- **Auth:** requireAdmin
- **Side effects:** auto-compute `order = max(existing) + 1`
- **Revalidate:** `/admin/courses/[courseId]/edit`

### `updateModule`
```ts
async function updateModule(id: string, input: { title?: string; order?: number }): Promise<{ ok: true } | { ok: false; error: string }>
```
- **Auth:** requireAdmin
- **Revalidate:** parent course edit page

### `deleteModule`
```ts
async function deleteModule(id: string): Promise<{ ok: true } | { ok: false; error: string }>
```
- **Auth:** requireAdmin
- **Revalidate:** parent course edit page

---

## 4. `lib/actions/lesson.actions.ts`

### `createLesson`
```ts
async function createLesson(input: { moduleId: string; title: string; videoUrl: string; content: string }): Promise<{ ok: true; id: string } | { ok: false; error: string }>
```
- **Input zod:** `lessonSchema` = `{ moduleId: cuid, title: string(min 2), videoUrl: string.regex(youtubeUrl), content: string }`
- **Auth:** requireAdmin
- **Side effects:** auto-compute order
- **Revalidate:** parent course edit page

### `updateLesson`
```ts
async function updateLesson(id: string, input: Partial<LessonInput>): Promise<{ ok: true } | { ok: false; error: string }>
```
- **Auth:** requireAdmin
- **Revalidate:** parent course edit page, `/learn/[slug]/[id]`

### `deleteLesson`
```ts
async function deleteLesson(id: string): Promise<{ ok: true } | { ok: false; error: string }>
```
- **Auth:** requireAdmin
- **Revalidate:** parent course edit page

---

## 5. `lib/actions/quiz.actions.ts`

### `upsertQuiz`
```ts
async function upsertQuiz(input: { lessonId: string; questions: Question[] }): Promise<{ ok: true } | { ok: false; error: string }>

type Question = {
  question: string;
  options: string[];   // length 2-6
  correctIndex: number;
};
```
- **Input zod:**
  ```ts
  quizSchema = z.object({
    lessonId: z.string().cuid(),
    questions: z.array(
      z.object({
        question: z.string().min(3),
        options: z.array(z.string().min(1)).min(2).max(6),
        correctIndex: z.number().int().min(0),
      }).refine(q => q.correctIndex < q.options.length, "correctIndex out of range")
    ).min(1).max(20),
  });
  ```
- **Side effects:** `JSON.stringify(questions)` before save
- **Auth:** requireAdmin
- **Revalidate:** parent course edit page, `/learn/[slug]/[lessonId]`

### `deleteQuiz`
```ts
async function deleteQuiz(lessonId: string): Promise<{ ok: true } | { ok: false; error: string }>
```
- **Auth:** requireAdmin
- **Revalidate:** edit page + learn page

---

## 6. `lib/actions/enrollment.actions.ts`

### `enrollCourse`
```ts
async function enrollCourse(courseId: string): Promise<{ ok: true; slug: string; firstLessonId: string } | { ok: false; error: string }>
```
- **Input zod:** `z.string().cuid()`
- **Auth:** requireAuth (student level OK)
- **Validation:**
  - Course exists + `published: true`
  - User KHÔNG đã enrolled (unique constraint backup)
  - Course có ≥ 1 lesson (else error "Khóa học chưa có bài học")
- **Side effects:** create Enrollment
- **Returns:** slug + first lessonId để client redirect
- **Revalidate:** `/dashboard`, `/courses/[slug]`

---

## 7. `lib/actions/progress.actions.ts`

### `markLessonComplete`
```ts
async function markLessonComplete(lessonId: string): Promise<{ ok: true; nextLessonId: string | null } | { ok: false; error: string }>
```
- **Input zod:** `z.string().cuid()`
- **Auth:** requireAuth
- **Validation:** verify user enrolled in lesson's parent course
- **Side effects:** upsert LessonProgress { userId, lessonId, completed: true, completedAt: now }
- **Returns:** next lesson id in course order (or null nếu là last)
- **Revalidate:** `/learn/[slug]`, `/dashboard`

### `submitQuiz`
```ts
async function submitQuiz(input: { lessonId: string; answers: number[] }): Promise<
  | { ok: true; score: number; total: number; correctIndexes: number[] }
  | { ok: false; error: string }
>
```
- **Input zod:**
  ```ts
  z.object({
    lessonId: z.string().cuid(),
    answers: z.array(z.number().int().min(0)).min(1),
  })
  ```
- **Auth:** requireAuth
- **Validation:** user enrolled + lesson has quiz + answers.length === questions.length
- **Side effects:**
  - Server fetch quiz.questions (parse JSON)
  - Grade: count matches `answer === question.correctIndex`
  - Compute score = `round(correct / total * 100)`
  - Upsert LessonProgress { completed: true, quizScore: score, completedAt: now }
- **Returns:** score + per-question correct indexes (cho client highlight)
- **Revalidate:** `/learn/[slug]`, `/dashboard`

---

## Summary table

| File                       | Actions count | Auth level    |
|----------------------------|---------------|---------------|
| auth.actions.ts            | 1             | Public        |
| course.actions.ts          | 4             | Admin         |
| module.actions.ts          | 3             | Admin         |
| lesson.actions.ts          | 3             | Admin         |
| quiz.actions.ts            | 2             | Admin         |
| enrollment.actions.ts      | 1             | Student       |
| progress.actions.ts        | 2             | Student       |
| **TOTAL**                  | **16**        |               |

## Conventions

- File extension `.actions.ts` để search dễ.
- 1 file = 1 entity domain.
- Export named functions (no default).
- Return shape consistent: `{ ok: boolean, ... }`.
- Error message Vietnamese (UX-facing).
- Internal validation thrown errors → caught, return `{ ok: false, error }`.
- Never `throw` to client (Server Actions wrap errors awkwardly).
- Use `revalidatePath` not `revalidateTag` (đơn giản, đủ dùng).
