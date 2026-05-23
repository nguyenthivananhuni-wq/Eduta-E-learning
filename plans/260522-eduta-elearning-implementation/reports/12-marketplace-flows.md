# Report 12 — Marketplace User Flows

> **NOTE (2026-05-23):** Phase structure restructured. Flows below cover marketplace post-**Phase 07** (foundation) + Phase 08-11 features. See [BRAINSTORM_DECISIONS.md](../BRAINSTORM_DECISIONS.md).
>
> **Flow → phase mapping:**
> - Wallet + instructor application + course approval + notification → **Phase 07 Marketplace Foundation**.
> - Review submission → **Phase 08 Reviews & Ratings**.
> - AI recommendations → **Phase 09 AI Recommendation**.
> - File attachments display → **Phase 10 File Attachments**.
> - Admin user/transaction/analytics/reports → **Phase 11 Admin Enhancements**.

3 primary user journeys after Phase 07-11 complete. ASCII flow diagrams for each role.

## 1. Student Journey

End-to-end: account → wallet → buy → learn → review → personalized recs.

```
┌─────────────┐
│  /register  │  email + name + password
└──────┬──────┘
       │ registerUser action
       │ ↳ create User + create Wallet (balance=0)
       ▼
┌─────────────┐
│  /login     │
└──────┬──────┘
       │ signIn("credentials")
       ▼
┌─────────────┐
│ /dashboard  │  ← Header shows balance pill "0đ"
└──────┬──────┘
       │ click "Nạp tiền" or /wallet
       ▼
┌─────────────┐
│  /wallet    │
│  Balance: 0đ │
│  [100k] [200k] [500k] [1M]
└──────┬──────┘
       │ click 200.000đ → 2s loader → topupWallet(200000)
       │ ↳ wallet.balance = 200000
       │ ↳ Transaction TOPUP row
       ▼
┌─────────────┐
│  /courses   │  catalog with rating sort
└──────┬──────┘
       │ click course card
       ▼
┌──────────────────────────┐
│  /courses/[slug]         │
│  Title + RatingStars     │
│  Price 99.000đ           │
│  [Mua khóa] button       │
└──────┬───────────────────┘
       │ click → /checkout/[id]
       ▼
┌──────────────────────────┐
│  /checkout/[id]          │
│  Balance: 200.000đ ✓     │
│  Price: 99.000đ          │
│  [Mua bằng ví]           │
└──────┬───────────────────┘
       │ purchaseCourseFromWallet(courseId)
       │ ↳ $transaction:
       │   - Wallet decrement 99k (student)
       │   - Enrollment create
       │   - Transaction PURCHASE (student)
       │   - Transaction EARNING 69300đ (instructor, 70%)
       │   - Wallet increment 69300 (instructor)
       ▼
┌──────────────────────────┐
│ /learn/[slug]/[lessonId] │  ← redirect to first lesson
│  YouTube video + content │
│  [Hoàn thành] button     │
└──────┬───────────────────┘
       │ markLessonComplete
       ▼
┌──────────────────────────┐
│  Quiz (if exists)        │
│  submitQuiz → score 80%  │
└──────┬───────────────────┘
       │ ... iterate lessons
       ▼
┌──────────────────────────┐
│  /courses/[slug]         │
│  [Viết đánh giá]         │
└──────┬───────────────────┘
       │ createReview(5★, "Khóa rất hay")
       │ ↳ Review row + recompute Course.avgRating
       ▼
┌──────────────────────────┐
│  /dashboard              │
│  "Đề xuất cho bạn":      │
│   3 cards (AI recs)      │
│   + Vì sao? tooltip      │
└──────────────────────────┘
       │ click recommended course → repeat from /courses/[slug]
```

### Key checkpoints (Student)
- Wallet auto-created on register (Phase 08).
- Top-up = mock 2s, balance increments instantly (Phase 08).
- Insufficient funds redirects to `/wallet?course=<id>` with banner.
- Review requires Enrollment row.
- AI recs cached 1h, "Làm mới" button to force refresh (Phase 11).

---

## 2. Instructor Journey

End-to-end: register → apply → wait → create → submit → publish → earn.

```
┌─────────────┐
│  /register  │  same as student
└──────┬──────┘
       │ User created with role=STUDENT
       ▼
┌──────────────────────────┐
│  /become-instructor      │
│  bio (50+ chars)         │
│  expertise (comma list)  │
│  [Gửi đơn]               │
└──────┬───────────────────┘
       │ applyInstructor action
       │ ↳ InstructorApplication row (PENDING)
       ▼
┌──────────────────────────┐
│  Wait...                 │  (admin reviews queue)
│  Status: Chờ duyệt        │
└──────┬───────────────────┘
       │ Admin approves (see admin flow below)
       │ ↳ User.role = INSTRUCTOR
       │ ↳ Notification "Đơn xin làm instructor được duyệt"
       ▼
┌──────────────────────────┐
│  Re-login (refresh JWT)  │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  /instructor             │  ← dashboard
│  Stats: 0 courses, 0đ    │
│  [Tạo khóa mới]          │
└──────┬───────────────────┘
       │ click → /instructor/courses/new
       ▼
┌──────────────────────────┐
│ CourseForm               │
│ title, slug, desc, price │
│ instructorId = session.id│
└──────┬───────────────────┘
       │ createCourse → status DRAFT
       ▼
┌──────────────────────────┐
│ /instructor/courses/[id]/edit
│ ModuleEditor + Lesson    │
│ + Quiz + Attachments     │
└──────┬───────────────────┘
       │ build content
       │ click [Gửi duyệt]
       ▼
┌──────────────────────────┐
│ submitCourseForReview    │
│ status: DRAFT → PENDING  │
│ ↳ visible in /admin/courses/pending
└──────┬───────────────────┘
       │ Admin reviews → Approve OR Reject
       │
       ├─ APPROVED:
       │  ↳ status APPROVED
       │  ↳ Notification "Khóa học đã được duyệt"
       │  ↳ visible at /courses for students
       │
       └─ REJECTED:
          ↳ status REJECTED + rejectionReason
          ↳ Notification with reason
          ↳ instructor edits → DRAFT → re-submit
       ▼
┌──────────────────────────┐
│  Student buys course     │
│  → EARNING transaction   │
│    +69.300đ for 99k sale │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  /instructor             │
│  Earnings: 69.300đ       │
│  Recent: 1 EARNING       │
│  Feedback: review 5★     │
└──────────────────────────┘
```

### Key checkpoints (Instructor)
- After approve, user must re-login OR session JWT refresh (Phase 07 risk noted).
- Edit on APPROVED course resets status to DRAFT → must re-submit.
- Cannot submit course with 0 lessons (Phase 09 guard).
- 70% revenue share to instructor, 30% to platform (Phase 08 constants).
- No withdrawal in scope (out of scope in plan).

---

## 3. Admin Journey

End-to-end: review queues + content moderation + analytics oversight.

```
┌─────────────┐
│  /login     │  admin@eduta.local
└──────┬──────┘
       │
       ▼
┌──────────────────────────┐
│  /admin                  │
│  → redirect /admin/analytics
└──────────────────────────┘
       │
       ▼
┌──────────────────────────┐
│  /admin/analytics        │
│  KPI cards:              │
│   - Total users          │
│   - Active users 30d     │
│   - Total revenue        │
│   - Total courses        │
│  Charts:                 │
│   - User growth 30d (CSS bars)
│   - Top 5 courses        │
│   - Top 5 instructors    │
└──────┬───────────────────┘
       │ sidebar nav
       │
       ├──→ /admin/instructor-applications
       │    ┌────────────────────────┐
       │    │ ApplicationCard list   │
       │    │ Bio + Expertise        │
       │    │ [Approve] [Reject]     │
       │    └─────────┬──────────────┘
       │              │ approveInstructorApplication
       │              │ ↳ User.role = INSTRUCTOR
       │              │ ↳ Notification
       │              ↓
       │
       ├──→ /admin/courses/pending
       │    ┌────────────────────────┐
       │    │ Course preview cards   │
       │    │ instructor name        │
       │    │ lesson count           │
       │    │ [Approve] [Reject+reason]
       │    └─────────┬──────────────┘
       │              │ approveCourse / rejectCourse
       │              │ ↳ status update + Notification
       │              ↓
       │
       ├──→ /admin/courses (existing, see ALL)
       │    Status column with badges
       │
       ├──→ /admin/users
       │    ┌────────────────────────┐
       │    │ Table: name, email, role, suspended
       │    │ Filters: role, search   │
       │    │ Actions per row:       │
       │    │  - Suspend/Unsuspend   │
       │    │  - Promote to admin    │
       │    │  - Delete (cascade!)   │
       │    └────────────────────────┘
       │
       ├──→ /admin/transactions
       │    Filter by type, date, user
       │
       ├──→ /admin/reports
       │    ┌────────────────────────┐
       │    │ Pending reports queue  │
       │    │ Preview target entity  │
       │    │ Reporter name + reason │
       │    │ [Resolve] [Dismiss]    │
       │    └────────────────────────┘
       │              │
       │              ▼
       │       resolveReport / dismissReport
       │       ↳ status RESOLVED/DISMISSED
       │       ↳ sidebar badge decrements
       │
       └──→ /admin/instructor-applications (same as above)
```

### Key checkpoints (Admin)
- Self-suspend/delete blocked.
- Promote-to-admin 2-step confirm.
- Reports polymorphic preview (COURSE/USER/REVIEW): action fetches entity by type.
- Sidebar shows pending counts as badges:
  - Pending applications
  - Pending courses
  - Pending reports
- Analytics queries indexed on Transaction.type, Enrollment.courseId for perf.

---

## Cross-flow interactions

| Trigger                       | Notifications Created                                   |
|-------------------------------|---------------------------------------------------------|
| Admin approves application    | APP_APPROVED → applicant                                |
| Admin rejects application     | APP_REJECTED + reason → applicant                       |
| Admin approves course         | COURSE_APPROVED → instructor                            |
| Admin rejects course          | COURSE_REJECTED + reason → instructor                   |
| Admin suspends user           | ACCOUNT_SUSPENDED → suspended user                      |
| Admin promotes user           | ROLE_PROMOTED → promoted user                           |
| Student buys course           | (optional future) NEW_SALE → instructor                 |

## Edge cases handled by design

1. **Race purchase:** unique Enrollment(userId, courseId) + $transaction prevents double-charge.
2. **Wallet shortfall mid-purchase:** action returns INSUFFICIENT early, no partial state.
3. **Course deleted after enroll:** cascade removes Enrollment + LessonProgress; user dashboard hides ghost.
4. **Instructor deleted:** Course.instructorId → NULL. Admin sees "No instructor" badge, can reassign.
5. **Review on un-enrolled course:** server action rejects.
6. **AI hallucination:** filtered against availableIds set.
7. **Notification on deleted resource:** link 404 acceptable; render fallback "Nội dung không tồn tại".
8. **Cascade delete user:** wallet + transactions + reviews + enrollments + notifications + recommendation cache all removed (FK cascade).

## Demo script (for thầy bảo vệ)

10 phút walkthrough:
1. (1') Admin login → /admin/analytics overview.
2. (1') New user register → wallet auto-created.
3. (2') Apply instructor → switch to admin → approve → switch back, refresh, see /instructor.
4. (2') Instructor create course → add 1 module + 1 lesson → submit.
5. (1') Admin approve course → see notification.
6. (1') Student top-up 200k → buy 99k course → check wallet (101k) + instructor wallet (69300đ).
7. (1') Student learn lesson → quiz → review 5★.
8. (1') Back to dashboard → AI recommendations card visible.
