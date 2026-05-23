# Report 05 — Components Breakdown

Reusable + scoped components. Mỗi component có props signature + usage + Server/Client classification.

## Naming conventions
- PascalCase file = PascalCase export.
- Default export = page. Named export = component.
- `"use client"` chỉ khi cần interactivity/hooks/event handlers.

---

## Layout

### `SiteHeader` — `components/layout/SiteHeader.tsx`
**Type:** Server Component
**Props:** none (reads session)
**Purpose:** Top nav với logo, links (/courses, /dashboard if logged in), UserMenu / Login button.
**Used in:** `app/(public)/layout.tsx`, `app/(student)/layout.tsx` (different children OK)

### `SiteFooter` — `components/layout/SiteFooter.tsx`
**Type:** Server Component
**Props:** none
**Purpose:** Footer simple: copyright + "Đồ án 2026"

### `UserMenu` — `components/layout/UserMenu.tsx`
**Type:** Client (`"use client"`)
**Props:** `{ user: { name: string; email: string; role: Role } }`
**Purpose:** shadcn DropdownMenu với Avatar + items: Dashboard, Admin (nếu role ADMIN), Logout.
**Action:** Logout calls `signOut({ callbackUrl: "/" })`.

### `AdminSidebar` — `components/layout/AdminSidebar.tsx`
**Type:** Server Component
**Props:** none
**Purpose:** Admin nav: Dashboard, Courses. Active state via `usePathname` (wrap in client subcomp if cần).

---

## Course Discovery

### `CourseCard` — `components/CourseCard.tsx`
**Type:** Server Component
**Props:**
```ts
{
  course: {
    slug: string;
    title: string;
    thumbnail: string;
    category: string;
    price: number;
  }
}
```
**Used in:** CourseGrid, Hero featured section, EnrolledCourseCard (composition).

### `CourseGrid` — `components/CourseGrid.tsx`
**Type:** Server Component
**Props:** `{ courses: Course[] }`
**Purpose:** Grid layout `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`. Renders CourseCard.

### `CatalogFilters` — `components/CatalogFilters.tsx`
**Type:** Client
**Props:** `{ defaultQuery?: string; defaultCategory?: string; categories: string[] }`
**Purpose:** Search input (debounce 300ms) + category Select. Sync to URL via `router.replace`.

### `Hero` — `components/Hero.tsx`
**Type:** Server Component
**Props:** none
**Purpose:** Landing hero — title, subtitle, 2 CTA buttons.

### `EnrollButton` — `components/EnrollButton.tsx`
**Type:** Client
**Props:**
```ts
{
  courseId: string;
  slug: string;
  firstLessonId: string | null;
  isEnrolled: boolean;
  isLoggedIn: boolean;
}
```
**Logic:**
- `!isLoggedIn` → button "Đăng nhập để học" → link `/login?callbackUrl=/checkout/[id]`
- `isEnrolled` → button "Vào học" → link `/learn/[slug]/[firstLessonId]`
- else → button "Đăng ký học" → link `/checkout/[id]`
- if `firstLessonId === null` → disable + tooltip "Chưa có bài học"

---

## Payment

### `MockPaymentScreen` — `components/MockPaymentScreen.tsx`
**Type:** Client
**Props:** `{ course: { id: string; title: string; price: number } }`
**Purpose:**
- Render course summary card.
- Render VietQR placeholder image (`/qr-placeholder.png`).
- Show countdown "Đang xử lý thanh toán... 2s".
- `useEffect` setTimeout 2000ms → call `enrollCourse` → on success: toast + `router.push("/learn/[slug]/[firstLessonId]")`.

---

## Learning Experience

### `LessonSidebar` — `components/learn/LessonSidebar.tsx`
**Type:** Server Component (with Client subcomp cho drawer)
**Props:**
```ts
{
  courseSlug: string;
  courseTitle: string;
  modules: Array<{
    id: string;
    title: string;
    lessons: Array<{
      id: string;
      title: string;
      completed: boolean;
    }>;
  }>;
  currentLessonId: string;
}
```
**Purpose:** Desktop sidebar + mobile Sheet drawer with hamburger. Use shadcn Accordion. Check icon (lucide CheckCircle2) on completed lessons.

### `VideoPlayer` — `components/learn/VideoPlayer.tsx`
**Type:** Server Component
**Props:** `{ videoUrl: string }`
**Purpose:**
- Call `extractYouTubeId(url)` from utils.
- Render `<iframe>` with 16:9 aspect ratio.
- Fallback message nếu URL không valid.

### `LessonContent` — `components/learn/LessonContent.tsx`
**Type:** Server Component
**Props:** `{ content: string }`
**Purpose:** ReactMarkdown render with remark-gfm. Tailwind `prose prose-slate max-w-none` wrapper.

### `CompletionButton` — `components/learn/CompletionButton.tsx`
**Type:** Client
**Props:** `{ lessonId: string; completed: boolean }`
**Purpose:**
- If `completed` → disabled button "✓ Đã hoàn thành".
- Else → button "Đánh dấu hoàn thành" → call `markLessonComplete(lessonId)` → toast + router.push next.

### `QuizPlayer` — `components/learn/QuizPlayer.tsx`
**Type:** Client
**Props:**
```ts
{
  lessonId: string;
  questions: Array<{
    question: string;
    options: string[];
    // NO correctIndex sent to client
  }>;
  previousScore: number | null;
}
```
**State:**
- react-hook-form with `answers: number[]`.
- After submit: `result: { score, total, correctIndexes } | null`.
**Purpose:**
- Render questions with RadioGroup.
- Submit → `submitQuiz` action → set result.
- Result panel: score banner + per-question highlight (green if user answer matches correctIndex, red if not).
- "Làm lại" button → reset form + result.

### `LessonNav` — `components/learn/LessonNav.tsx`
**Type:** Server Component
**Props:** `{ prevLessonId: string | null; nextLessonId: string | null; courseSlug: string }`
**Purpose:** Two link buttons. Disable if null.

---

## Admin

### `CourseForm` — `components/admin/CourseForm.tsx`
**Type:** Client
**Props:** `{ defaultValues?: Partial<CourseInput>; courseId?: string; categories: string[] }`
**Purpose:** Form for create/update. react-hook-form + zodResolver(courseSchema). Submit → `createCourse` or `updateCourse`. On create success → redirect to edit page.

### `ModuleEditor` — `components/admin/ModuleEditor.tsx`
**Type:** Client
**Props:** `{ courseId: string; modules: ModuleWithLessons[] }`
**Purpose:**
- List modules (Accordion).
- "+ Thêm module" button → inline input → submit → `createModule`.
- Per module: edit title (inline) + delete (confirm) + LessonEditor inside.

### `LessonEditor` — `components/admin/LessonEditor.tsx`
**Type:** Client
**Props:** `{ moduleId: string; lessons: LessonWithQuiz[] }`
**Purpose:**
- List lessons in module.
- "+ Thêm bài học" → modal with form (title, videoUrl, content textarea).
- Per lesson: edit (open modal pre-filled), delete (confirm), QuizEditor toggle.

### `QuizEditor` — `components/admin/QuizEditor.tsx`
**Type:** Client
**Props:** `{ lessonId: string; quiz: { questions: Question[] } | null }`
**Purpose:**
- Toggle "Add quiz" / "Edit quiz" button.
- Modal with form: `useFieldArray` for questions. Each question: text input + 4 option inputs + RadioGroup for correctIndex.
- "+ Add question" / "Remove question" controls.
- Submit → `upsertQuiz`.

### `DeleteConfirm` — `components/admin/DeleteConfirm.tsx`
**Type:** Client
**Props:** `{ onConfirm: () => Promise<void>; title: string; description: string; trigger: ReactNode }`
**Purpose:** Reusable shadcn AlertDialog wrapper.

---

## Dashboard

### `EnrolledCourseCard` — `components/dashboard/EnrolledCourseCard.tsx`
**Type:** Server Component
**Props:**
```ts
{
  course: { slug: string; title: string; thumbnail: string };
  percentage: number;
  continueLessonId: string | null;
}
```
**Purpose:** Card with thumbnail + title + ProgressBar + "Tiếp tục học" link.

### `StatsCards` — `components/dashboard/StatsCards.tsx`
**Type:** Server Component
**Props:** `{ courseCount: number; completedLessons: number; hoursStudied: number }`
**Purpose:** 3-column stat cards with icons.

---

## Shared utility

### `ProgressBar` — `components/ProgressBar.tsx`
**Type:** Server Component
**Props:** `{ value: number; label?: string }`
**Purpose:** Wrap shadcn Progress + optional label "X% hoàn thành".

### `EmptyState` — `components/EmptyState.tsx`
**Type:** Server Component
**Props:** `{ icon?: LucideIcon; title: string; description?: string; action?: { label: string; href: string } }`
**Purpose:** Reused everywhere empty list. Centered icon + text + CTA.

---

## Summary

| Scope        | Count |
|--------------|-------|
| Layout       | 4     |
| Discovery    | 5     |
| Payment      | 1     |
| Learning     | 6     |
| Admin        | 5     |
| Dashboard    | 2     |
| Shared       | 2     |
| **TOTAL**    | **25** |

Plus ~20 shadcn ui/ primitives (added via CLI).
