# Phase 02 — Admin CRUD (Course / Module / Lesson / Quiz)

## Context links
- Parent: [plan.md](./plan.md)
- Prev: [Phase 01](./phase-01-foundation-setup.md)
- Refs: [reports/04-server-actions.md](./reports/04-server-actions.md), [reports/05-components-breakdown.md](./reports/05-components-breakdown.md), [reports/02-prisma-schema.md](./reports/02-prisma-schema.md)
- Dependencies: Phase 01 done (Prisma + Auth + shadcn ready)

## Overview
- **Date:** 2026-05-22
- **Days:** 3-4
- **Description:** Build admin area `/admin` for full CRUD. Admin tạo course → add modules → add lessons (YouTube URL + markdown content) → add quiz cho lesson. Sử dụng Server Actions cho mọi mutation. Auth gate: chỉ role ADMIN.
- **Priority:** High (cần có data trước khi build public pages, nhưng có seed nên không block hoàn toàn)
- **Implementation status:** Not Started
- **Review status:** Not Reviewed

## Key Insights
- Admin editor monolithic page `/admin/courses/[id]/edit` chứa nested editor cho modules + lessons + quiz (1 page làm tất cả → simpler hơn nhiều page con).
- Quiz `questions` Json field: dùng react-hook-form `useFieldArray` để add/remove questions dynamic.
- `revalidatePath` sau mỗi mutation để Server Component re-render fresh data.
- Order field cho Module/Lesson: dùng integer increment, không cần drag-drop UI (YAGNI).
- Slug auto-generate từ title client-side với simple kebab-case, admin có thể override.

## Requirements
1. Route group `app/(admin)/` với layout check `session.user.role === "ADMIN"`.
2. `/admin` — overview với count: courses, students, enrollments.
3. `/admin/courses` — table list + button "Tạo khóa mới" + edit/delete actions.
4. `/admin/courses/new` — form tạo course (title, slug, description, category, price, thumbnail URL, published).
5. `/admin/courses/[id]/edit` — full editor:
   - Course fields editable.
   - Modules list with inline add/edit/delete.
   - Lessons list per module với inline add/edit/delete (title, videoUrl, markdown content).
   - Quiz editor per lesson (modal hoặc collapse panel): add question, options, mark correctIndex.
6. Tất cả mutations dùng Server Actions, validated bằng zod.
7. Confirm dialog trước khi delete (shadcn AlertDialog).

## Architecture
- **Route group:** `app/(admin)/` với `layout.tsx` redirect non-admin về `/`.
- **Page composition:** Server Component fetch data → pass props → Client Component render editor + form.
- **Mutation pattern:** Client form `onSubmit` → call Server Action → `revalidatePath("/admin/courses")` + `revalidatePath("/admin/courses/[id]/edit")` → toast.

**Data flow (create course):**
```
Admin form → react-hook-form + zod (client) → Server Action createCourse(input)
  → re-validate zod (server) → check admin role → Prisma.course.create
  → revalidatePath → return { ok: true, id } → client redirect /admin/courses/[id]/edit
```

## Related code files
**Create:**
- `app/(admin)/layout.tsx` — admin guard
- `app/(admin)/admin/page.tsx` — overview
- `app/(admin)/admin/courses/page.tsx` — list
- `app/(admin)/admin/courses/new/page.tsx` — create form
- `app/(admin)/admin/courses/[id]/edit/page.tsx` — full editor
- `components/admin/CourseForm.tsx` — course fields
- `components/admin/ModuleEditor.tsx` — module list + CRUD
- `components/admin/LessonEditor.tsx` — lesson form (title, video, markdown)
- `components/admin/QuizEditor.tsx` — questions builder
- `components/admin/DeleteConfirm.tsx` — reusable AlertDialog
- `lib/validations/course.ts` — courseSchema, moduleSchema, lessonSchema, quizSchema
- `lib/actions/course.actions.ts` — createCourse, updateCourse, deleteCourse, togglePublish
- `lib/actions/module.actions.ts` — createModule, updateModule, deleteModule
- `lib/actions/lesson.actions.ts` — createLesson, updateLesson, deleteLesson
- `lib/actions/quiz.actions.ts` — upsertQuiz, deleteQuiz
- `lib/auth-helpers.ts` — `requireAdmin()` throw if not admin
- `components/ui/dialog.tsx`, `alert-dialog.tsx`, `textarea.tsx`, `select.tsx`, `switch.tsx` (shadcn add)

## Implementation Steps

1. **Add shadcn components**: `pnpm dlx shadcn@latest add dialog alert-dialog textarea select switch table badge separator`.
2. **Create auth helper** `lib/auth-helpers.ts`:
   - `requireAuth()` — return session or redirect `/login`.
   - `requireAdmin()` — return session or redirect `/`.
3. **Build admin layout** `app/(admin)/layout.tsx`: call `requireAdmin()`, render sidebar nav (Dashboard / Courses).
4. **Build `/admin` page**: Server Component fetch counts từ Prisma (`db.course.count`, `db.user.count`, `db.enrollment.count`), render stat cards.
5. **Build zod schemas** `lib/validations/course.ts` cho course + module + lesson + quiz.
6. **Build `course.actions.ts`** Server Actions per `reports/04-server-actions.md`:
   - `createCourse`, `updateCourse`, `deleteCourse`, `togglePublish`.
   - Mỗi action: `"use server"` + `requireAdmin()` + zod parse + Prisma + revalidatePath.
7. **Build `/admin/courses` list**: Server Component fetch all courses (no published filter — admin sees all). Table với cols: title, category, published, enrollments count, actions (Edit / Delete).
8. **Build `CourseForm` component**: react-hook-form, fields: title, slug (auto from title with override), description (textarea), category (Select), price (Input number), thumbnail (Input url), published (Switch). Submit → `createCourse` or `updateCourse`.
9. **Build `/admin/courses/new`**: render CourseForm → on success redirect `/admin/courses/[id]/edit`.
10. **Build `/admin/courses/[id]/edit`**: Server Component fetch course with `include: { modules: { include: { lessons: { include: { quiz: true } }, orderBy: order } }, orderBy: order }`. Pass to Client Component editor.
11. **Build `module.actions.ts`** + `ModuleEditor` component: list modules with order, add button (create with `order = max+1`), edit title inline, delete with confirm.
12. **Build `lesson.actions.ts`** + `LessonEditor`: under each module, list lessons. Add lesson modal: title, videoUrl (validate YouTube URL pattern), content (textarea markdown). Delete with confirm.
13. **Build `quiz.actions.ts`** + `QuizEditor`: per lesson, "Add Quiz" button opens modal. Form: array of questions, each: question text + options[] (default 4) + correctIndex (Radio). Use `useFieldArray`. Upsert quiz on submit.
14. **Wire all revalidatePath**: ensure `/admin/courses` + edit page refresh after any mutation.
15. **Manual test full flow**: Tạo course → add 2 modules → add 3 lessons → add quiz → toggle published → delete lesson → delete module → delete course (cascade work).

## Todo list
- [ ] Step 1: add shadcn components
- [ ] Step 2: `requireAuth` + `requireAdmin` helpers
- [ ] Step 3: admin layout guard
- [ ] Step 4: `/admin` overview page
- [ ] Step 5: zod schemas
- [ ] Step 6: course Server Actions
- [ ] Step 7: `/admin/courses` list page
- [ ] Step 8: `CourseForm` component
- [ ] Step 9: `/admin/courses/new` page
- [ ] Step 10: `/admin/courses/[id]/edit` page skeleton
- [ ] Step 11: module Server Actions + ModuleEditor
- [ ] Step 12: lesson Server Actions + LessonEditor
- [ ] Step 13: quiz Server Actions + QuizEditor
- [ ] Step 14: revalidatePath wiring
- [ ] Step 15: e2e manual test full CRUD

## Success Criteria
- Login admin → access `/admin` → see overview stats.
- Tạo 1 course mới từ UI → xuất hiện ở `/admin/courses` list.
- Thêm module + 2 lessons + 1 quiz → tất cả lưu DB (verify Prisma Studio).
- Edit lesson markdown → save → reload → content vẫn đó.
- Delete course → cascade xóa modules + lessons + quizzes.
- Non-admin user truy cập `/admin/*` → redirect `/`.
- Toggle "published" → reflect in DB.
- All forms hiển thị zod validation errors inline.

## Risk Assessment
| Risk                                           | Likelihood | Impact | Mitigation                                                                |
|------------------------------------------------|------------|--------|---------------------------------------------------------------------------|
| QuizEditor `useFieldArray` UX phức tạp        | High       | Med    | Giới hạn 4 options/question cố định, không cho dynamic add option         |
| Markdown textarea không preview live          | Med        | Low    | Bỏ live preview, chỉ render khi student view (YAGNI)                     |
| Slug duplicate khi tạo course                  | Med        | Low    | Prisma unique constraint catch, hiển thị error "slug đã tồn tại"          |
| Cascade delete làm mất data ngoài ý muốn       | Low        | High   | AlertDialog confirm với text "Bạn có chắc?" + button đỏ                   |
| Server Action không revalidate → UI stale     | High       | Med    | Checklist `revalidatePath` ở EVERY action, test reload sau mỗi mutation   |

## Security Considerations
- Mọi Server Action MUST call `requireAdmin()` first.
- Zod validation cả client (UX) và server (security) — không tin client.
- Markdown content: sẽ render với react-markdown ở Phase 04. Disable raw HTML (`rehype-raw` KHÔNG dùng) → prevent XSS.
- YouTube URL: zod regex validate pattern `youtube.com/watch?v=` hoặc `youtu.be/`. Reject arbitrary URLs.
- SQL injection: Prisma parameterized queries → safe by default.
- File upload: KHÔNG có (paste URL Unsplash thay vì upload), tránh được mọi risk file storage.
- Quiz `questions` Json: validate strict zod schema trước khi `JSON.stringify` lưu DB.

## Next steps
→ [Phase 03 — Public Pages](./phase-03-public-pages.md)
