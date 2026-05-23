# Phase 04 — Learning Experience (Lesson Viewer + Quiz + Progress)

## Context links
- Parent: [plan.md](./plan.md)
- Prev: [Phase 03](./phase-03-public-pages.md)
- Refs: [reports/05-components-breakdown.md](./reports/05-components-breakdown.md), [reports/04-server-actions.md](./reports/04-server-actions.md)
- Dependencies: Phase 01-03 done. Có ít nhất 1 enrolled course với lessons.

## Overview
- **Date:** 2026-05-22
- **Days:** 7-9
- **Description:** Core học flow: `/learn/[courseSlug]/[lessonId]`. Sidebar list modules + lessons (với check icon nếu completed). Main pane: YouTube embed → markdown content → "Đánh dấu hoàn thành" button → quiz (nếu có). Quiz player: multiple choice, submit, auto-grade, save score vào LessonProgress.
- **Priority:** Critical (core demo)
- **Implementation status:** Not Started
- **Review status:** Not Reviewed

## Key Insights
- LessonProgress unique(userId, lessonId) → upsert pattern khi mark completed hoặc submit quiz.
- "completed" = user click button OR quiz pass threshold. Đơn giản: cả 2 đều set `completed: true`.
- Sidebar sticky on desktop, drawer on mobile (shadcn Sheet).
- YouTube embed: extract video ID từ URL (`v=` param hoặc `youtu.be/<id>`) → `<iframe src="https://www.youtube.com/embed/{id}">`.
- Quiz score: `correctCount / totalCount * 100` → round int. Pass threshold = 70% (chỉ để hiển thị, không block).
- Markdown render: `react-markdown` + `remark-gfm` cho table/checkbox support. KHÔNG enable `rehype-raw` (XSS).
- Progress % course = `completedLessons / totalLessons * 100`.

## Requirements
1. `/learn/[courseSlug]/[lessonId]` route, requires enrollment.
2. Sidebar: course title + collapsible modules + lesson links, current lesson highlighted, completed lesson check icon.
3. Main pane: video iframe (16:9 aspect) + lesson title + markdown content.
4. "Đánh dấu hoàn thành" button → updateLessonProgress action → toast → auto-advance to next lesson (optional UX).
5. Quiz section: if `lesson.quiz` exists, render QuizPlayer below content.
6. QuizPlayer: list questions, radio options, submit button → server grade → show result (X/Y correct + per-question feedback) → save score.
7. Re-take quiz allowed (overwrite previous score).
8. Mobile: sidebar collapses to drawer, opens via hamburger.

## Architecture
- **Route group:** `app/(student)/learn/[courseSlug]/[lessonId]/page.tsx`.
- **Layout:** `app/(student)/learn/[courseSlug]/layout.tsx` — fetch course + check enrollment + render sidebar.
- **Server Component** for page → fetch lesson + quiz. **Client Component** wraps quiz + completion button.

**Data flow (mark complete):**
```
Click "Đánh dấu hoàn thành"
  → Server Action markLessonComplete(lessonId)
  → requireAuth + check enrollment + upsert LessonProgress { completed: true, completedAt: now }
  → revalidatePath /learn/[slug]/* → return next lesson id or null
  → toast + if nextLesson router.push next else stay
```

**Data flow (submit quiz):**
```
Submit answers[] → Server Action submitQuiz(lessonId, answers)
  → requireAuth + check enrollment + fetch quiz.questions
  → grade server-side (correctIndex check) → calc score
  → upsert LessonProgress { completed: true, quizScore: score, completedAt: now }
  → return { score, totalQuestions, correctIndexes }
  → client render result + offer next lesson
```

## Related code files
**Create:**
- `app/(student)/learn/[courseSlug]/layout.tsx` — enrollment guard + sidebar
- `app/(student)/learn/[courseSlug]/[lessonId]/page.tsx` — lesson viewer
- `components/learn/LessonSidebar.tsx` — desktop + mobile drawer
- `components/learn/LessonContent.tsx` — markdown render
- `components/learn/VideoPlayer.tsx` — YouTube iframe
- `components/learn/CompletionButton.tsx` — client, calls action
- `components/learn/QuizPlayer.tsx` — client, form + submit + result
- `components/learn/LessonNav.tsx` — prev/next buttons
- `lib/actions/progress.actions.ts` — markLessonComplete, submitQuiz
- `lib/queries/learn.queries.ts` — `getCourseStructure(slug, userId)` (returns modules + lessons + progress map)
- `lib/utils/youtube.ts` — `extractYouTubeId(url): string | null`
- `lib/utils/progress.ts` — `calcCourseProgress(lessons, progressMap): number`

## Implementation Steps

1. **Add shadcn**: `pnpm dlx shadcn@latest add sheet progress accordion radio-group tooltip`.
2. **Build `lib/utils/youtube.ts`**: regex extract video ID from common YouTube URL forms.
3. **Build `lib/queries/learn.queries.ts`**:
   - `getCourseStructure(slug, userId)` → course + modules + lessons + per-lesson progress.
   - `getLessonWithQuiz(lessonId)`.
4. **Build learn layout** `app/(student)/learn/[courseSlug]/layout.tsx`:
   - `requireAuth()`.
   - Fetch course by slug, fetch enrollment (404 if not enrolled).
   - Fetch course structure with progress map.
   - Render grid: sidebar (desktop) + main children. Mobile: hamburger → Sheet drawer.
5. **Build LessonSidebar**: Accordion modules → list lessons. Each lesson item: title + check icon if completed. Active lesson highlighted. Click → router.push.
6. **Build `/learn/[courseSlug]/[lessonId]/page.tsx`**:
   - Fetch lesson + quiz (server).
   - Validate lessonId belongs to courseSlug (security).
   - Render: VideoPlayer + LessonContent + CompletionButton + (if quiz) QuizPlayer + LessonNav.
7. **Build VideoPlayer**: extract ID + render iframe with proper attrs (allowFullScreen, etc.). Aspect-ratio 16:9.
8. **Build LessonContent**: `<ReactMarkdown remarkPlugins={[remarkGfm]} components={{...}}>...`. KHÔNG enable raw HTML.
9. **Install remark-gfm**: `pnpm add remark-gfm`.
10. **Build progress Server Actions** `lib/actions/progress.actions.ts`:
    - `markLessonComplete(lessonId)` — upsert progress.
    - `submitQuiz(lessonId, answers: number[])` — grade + upsert.
    - Both: requireAuth + check enrollment via lesson → module → course → enrollment.
11. **Build CompletionButton (client)**: shows "Đánh dấu hoàn thành" or "✓ Đã hoàn thành" based on current progress. onClick → action → toast → router.refresh + push next lesson if any.
12. **Build QuizPlayer (client)**:
    - react-hook-form with radio per question.
    - Submit → call `submitQuiz` action → display result panel: "Bạn đúng X/Y câu — điểm Z/100" + per-question correct/wrong + "Làm lại" button (reset form).
    - Pass threshold 70% → show "🎉 Bạn đã pass!" else "Cần ôn lại".
13. **Build LessonNav**: prev/next lesson buttons. Compute from structure data.
14. **Wire progress to sidebar**: after action `revalidatePath`, sidebar re-renders with new check icons.
15. **Manual test**: enroll khóa → vào lesson 1 → xem video → mark complete → next → quiz → submit sai → submit lại đúng → score lưu.

## Todo list
- [ ] Step 1: add shadcn components
- [ ] Step 2: YouTube ID extractor util
- [ ] Step 3: learn queries
- [ ] Step 4: learn layout + enrollment guard
- [ ] Step 5: LessonSidebar component
- [ ] Step 6: lesson page composition
- [ ] Step 7: VideoPlayer
- [ ] Step 8: LessonContent markdown
- [ ] Step 9: install remark-gfm
- [ ] Step 10: progress Server Actions
- [ ] Step 11: CompletionButton
- [ ] Step 12: QuizPlayer with grading display
- [ ] Step 13: LessonNav prev/next
- [ ] Step 14: revalidatePath wiring
- [ ] Step 15: e2e manual test full learning flow

## Success Criteria
- Enrolled user click "Vào học" → land on first lesson, sidebar visible.
- Click sidebar lesson → URL change, content swap.
- YouTube iframe load video, play work.
- Markdown render headings/lists/code blocks correctly.
- Click "Đánh dấu hoàn thành" → toast + sidebar check icon appears.
- Quiz submit wrong answers → score < 100 + red highlight wrong.
- Quiz submit correct → score = 100 + green highlight + "🎉 pass".
- Re-take quiz overwrite score.
- Non-enrolled user truy cập `/learn/[slug]/[id]` → redirect `/courses/[slug]`.
- Wrong lessonId (not in course) → 404.
- Mobile: hamburger opens drawer, lessons clickable.

## Risk Assessment
| Risk                                                | Likelihood | Impact | Mitigation                                                                  |
|-----------------------------------------------------|------------|--------|-----------------------------------------------------------------------------|
| QuizPlayer state management phức tạp                | High       | Med    | Dùng react-hook-form, không tự manage state. 1 question = 1 radio group.   |
| YouTube embed bị block (region/cookie)              | Low        | High   | Test multiple browsers, có fallback "Video không tải được" message          |
| Markdown XSS                                        | Low        | High   | KHÔNG enable `rehype-raw`. Chỉ trust admin input (đã ADMIN guard ở Phase 02) |
| Quiz answer mismatch index (off-by-one)             | Med        | Med    | Unit test grading logic riêng + zod validate `answers.length === questions.length` |
| Sidebar không re-render sau markComplete            | Med        | Low    | `revalidatePath("/learn/[courseSlug]", "layout")` để invalidate layout cache |
| Lesson page slow load (fetch nhiều quan hệ)         | Low        | Low    | Prisma select chỉ field cần, không over-fetch                              |

## Security Considerations
- Enrollment check at layout level + lại ở Server Actions (defense in depth).
- LessonId validate: query lesson → join module → join course → match enrollment. Reject nếu không match → 403/404.
- Quiz grading SERVER-SIDE only. Client KHÔNG biết correctIndex (chỉ fetch questions + options, KHÔNG fetch correctIndex). Sửa query: `select: { question: true, options: true }` (omit correctIndex when sending to client).
- Submit quiz answers: zod validate array of numbers in valid range `[0, options.length-1]`.
- Markdown: disable HTML, disable raw (default behavior). Allowed: standard md + gfm tables.
- iframe sandbox attrs cho YouTube: `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"`.

## Next steps
→ [Phase 05 — Student Dashboard + Polish](./phase-05-student-dashboard-polish.md)
