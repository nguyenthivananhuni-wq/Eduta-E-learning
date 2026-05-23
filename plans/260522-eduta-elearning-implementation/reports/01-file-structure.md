# Report 01 — File Structure

Full file tree cho project Eduta E-Learning 2.0. Mọi file đều rooted ở `d:/Eduta e-learning 2.0/`.

```
eduta-elearning/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx                    # centered card layout
│   │   ├── login/page.tsx                # login form
│   │   └── register/page.tsx             # register form
│   ├── (public)/
│   │   ├── layout.tsx                    # public layout với SiteHeader + Footer
│   │   ├── page.tsx                      # landing (override root)
│   │   ├── courses/
│   │   │   ├── page.tsx                  # catalog + search + filter
│   │   │   ├── loading.tsx               # skeleton grid
│   │   │   └── [slug]/page.tsx           # course detail
│   │   └── error.tsx                     # public error boundary
│   ├── (student)/
│   │   ├── layout.tsx                    # requireAuth guard
│   │   ├── dashboard/
│   │   │   ├── page.tsx                  # my courses + progress
│   │   │   └── loading.tsx
│   │   ├── checkout/
│   │   │   └── [courseId]/page.tsx       # mock payment screen
│   │   ├── learn/
│   │   │   └── [courseSlug]/
│   │   │       ├── layout.tsx            # enrollment guard + sidebar
│   │   │       └── [lessonId]/
│   │   │           ├── page.tsx          # lesson viewer
│   │   │           └── loading.tsx
│   │   └── error.tsx
│   ├── (admin)/
│   │   ├── layout.tsx                    # requireAdmin guard + sidebar
│   │   └── admin/
│   │       ├── page.tsx                  # overview stats
│   │       └── courses/
│   │           ├── page.tsx              # courses table
│   │           ├── new/page.tsx          # create form
│   │           └── [id]/edit/page.tsx    # full editor
│   ├── api/
│   │   └── auth/[...nextauth]/route.ts   # Auth.js handler
│   ├── layout.tsx                        # root layout (html, body, Toaster)
│   ├── globals.css                       # Tailwind + shadcn vars
│   ├── not-found.tsx                     # 404
│   ├── global-error.tsx                  # root crash
│   ├── favicon.ico
│   └── icon.png
│
├── components/
│   ├── ui/                               # shadcn primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   ├── label.tsx
│   │   ├── textarea.tsx
│   │   ├── select.tsx
│   │   ├── switch.tsx
│   │   ├── dialog.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── avatar.tsx
│   │   ├── sheet.tsx
│   │   ├── progress.tsx
│   │   ├── accordion.tsx
│   │   ├── radio-group.tsx
│   │   ├── tooltip.tsx
│   │   ├── skeleton.tsx
│   │   ├── badge.tsx
│   │   ├── table.tsx
│   │   ├── separator.tsx
│   │   └── sonner.tsx                    # toast
│   ├── layout/
│   │   ├── SiteHeader.tsx                # public + student nav
│   │   ├── SiteFooter.tsx
│   │   ├── UserMenu.tsx                  # avatar dropdown
│   │   └── AdminSidebar.tsx              # admin nav
│   ├── admin/
│   │   ├── CourseForm.tsx
│   │   ├── ModuleEditor.tsx
│   │   ├── LessonEditor.tsx
│   │   ├── QuizEditor.tsx
│   │   └── DeleteConfirm.tsx
│   ├── learn/
│   │   ├── LessonSidebar.tsx             # desktop + mobile drawer
│   │   ├── LessonContent.tsx             # markdown render
│   │   ├── VideoPlayer.tsx               # YouTube iframe
│   │   ├── CompletionButton.tsx
│   │   ├── QuizPlayer.tsx
│   │   └── LessonNav.tsx                 # prev/next
│   ├── dashboard/
│   │   ├── EnrolledCourseCard.tsx
│   │   └── StatsCards.tsx
│   ├── CourseCard.tsx                    # catalog card
│   ├── CourseGrid.tsx
│   ├── CatalogFilters.tsx                # search + category
│   ├── EnrollButton.tsx
│   ├── MockPaymentScreen.tsx             # fake payment client
│   ├── Hero.tsx                          # landing hero
│   ├── ProgressBar.tsx                   # wrap shadcn Progress
│   └── EmptyState.tsx                    # reusable
│
├── lib/
│   ├── db.ts                             # Prisma singleton
│   ├── auth.ts                           # Auth.js helpers (re-export)
│   ├── auth-helpers.ts                   # requireAuth / requireAdmin
│   ├── actions/                          # Server Actions only
│   │   ├── auth.actions.ts               # registerUser
│   │   ├── course.actions.ts             # CRUD course
│   │   ├── module.actions.ts             # CRUD module
│   │   ├── lesson.actions.ts             # CRUD lesson
│   │   ├── quiz.actions.ts               # upsert quiz
│   │   ├── enrollment.actions.ts         # enrollCourse
│   │   └── progress.actions.ts           # markComplete + submitQuiz
│   ├── queries/                          # Server-only Prisma queries
│   │   ├── course.queries.ts
│   │   ├── learn.queries.ts
│   │   └── dashboard.queries.ts
│   ├── validations/                      # zod schemas
│   │   ├── auth.ts
│   │   ├── course.ts
│   │   ├── module.ts
│   │   ├── lesson.ts
│   │   └── quiz.ts
│   └── utils/
│       ├── cn.ts                         # shadcn cn helper
│       ├── format.ts                     # formatVND
│       ├── youtube.ts                    # extractYouTubeId
│       ├── progress.ts                   # calcCourseProgress
│       └── slug.ts                       # toKebab
│
├── prisma/
│   ├── schema.prisma                     # full schema (xem report 02)
│   ├── seed.ts                           # seed 3 courses
│   ├── dev.db                            # SQLite local (gitignored)
│   └── migrations/                       # auto-generated
│
├── scripts/
│   └── seed-prod.ts                      # seed against Turso
│
├── public/
│   ├── logo.svg
│   ├── qr-placeholder.png                # mock VietQR image
│   └── og-image.png                      # social preview
│
├── docs/
│   ├── screenshots/                      # for README
│   └── development-rules.md              # (nếu có)
│
├── auth.ts                               # Auth.js v5 setup (Node)
├── auth.config.ts                        # Edge-safe config
├── middleware.ts                         # route protection
├── next.config.ts                        # image domains
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json                         # strict
├── components.json                       # shadcn config
├── package.json
├── pnpm-lock.yaml
├── .env.local                            # gitignored
├── .env.example                          # committed
├── .gitignore
├── README.md
└── LICENSE                               # optional
```

## Folder responsibilities

| Folder            | Purpose                                                                |
|-------------------|------------------------------------------------------------------------|
| `app/(auth)/`     | Login + register, centered card layout                                 |
| `app/(public)/`   | Anonymous-accessible: landing, catalog, course detail                  |
| `app/(student)/`  | Auth-gated: dashboard, checkout, learn                                 |
| `app/(admin)/`    | Admin-only: CRUD courses                                               |
| `app/api/auth/`   | ONLY API route (Auth.js callback). Everything else uses Server Actions |
| `components/ui/`  | shadcn primitives, do not modify after `add`                           |
| `components/<scope>/` | Feature-scoped components                                          |
| `lib/actions/`    | Server Actions (`"use server"` directive at top)                       |
| `lib/queries/`    | Server-only data fetchers (composable in Server Components)            |
| `lib/validations/`| zod schemas reused client + server                                     |
| `prisma/`         | Schema + seed + migrations                                             |
| `scripts/`        | One-off scripts (prod seed, helper utilities)                          |
| `public/`         | Static assets (logos, placeholders)                                    |

## File count estimate
- Pages: ~14 route files
- Components: ~25 (excluding shadcn ui/)
- Actions: 7 files
- Queries: 3 files
- Validations: 5 files
- Total source files: ~60
