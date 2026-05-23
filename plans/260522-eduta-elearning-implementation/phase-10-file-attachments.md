# Phase 10 — File Attachments (PDF/docs via URL)

## Context links
- Parent: [plan.md](./plan.md)
- Prev: [Phase 09 — AI Recommendation](./phase-09-ai-recommendation.md)
- Refs: [reports/09-extended-schema.md](./reports/09-extended-schema.md), [reports/10-extended-server-actions.md](./reports/10-extended-server-actions.md)
- Dependencies: Phase 07 (instructor edit lesson scope + LessonEditor accessible from instructor route), Phase 04 (lesson viewer exists).

## Overview
- **Date:** 2026-05-23
- **Description:** Đính kèm tài liệu tham khảo (PDF, slides, docs) cho lesson. URL paste only — no upload service. New table `Attachment` (id, lessonId, name, url, order). LessonEditor add CRUD UI. LessonContent render downloadable links. Không tốn storage.
- **Priority:** Low (nice-to-have)
- **Implementation status:** Not Started
- **Review status:** Not Reviewed

## Key Insights
- URL paste = zero infrastructure. Instructor self-host Google Drive / Dropbox public / GitHub raw.
- Separate `Attachment` table > inline JSON: easier UPSERT, order field, no SQLite JSON quirks.
- URL validation `z.string().url()` + refine reject `javascript:` / `data:` scheme.
- Name optional → fall back to URL last segment.
- Render: lucide `Download` icon + name + `target="_blank" rel="noopener noreferrer"`.

## Pre-requisites & Existing Code Refactor

### Schema changes
- 1 migration `attachments`:
  - New `Attachment` (id, lessonId FK cascade, name, url, order Int @default(0), createdAt) + index `(lessonId, order)`.
- No backfill (separate table, empty initially).

### Files to modify (existing)
| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add Attachment model + Lesson.attachments relation |
| `components/admin/LessonEditor.tsx` | Embed `<AttachmentSection />` below content editor |
| `components/learn/LessonContent.tsx` | Render `<LessonAttachments />` below markdown |
| `prisma/seed.ts` | Add 1-2 sample attachments to demo first lesson (e.g., slide PDF link) |

### Files to create (new)
- `components/instructor/AttachmentSection.tsx` — list + add inline form + delete + edit
- `components/lesson/LessonAttachments.tsx` — viewer rendering downloadable links
- `lib/actions/attachment.actions.ts` — addLessonAttachment, removeLessonAttachment, updateLessonAttachment
- `lib/validations/attachment.ts` — attachmentSchema + updateAttachmentSchema
- `prisma/migrations/<ts>_attachments/migration.sql`

## Requirements
1. New table `Attachment` (id, lessonId, name, url, order, createdAt).
2. LessonEditor "Tài liệu đính kèm" section: list + add (name + URL) + delete.
3. Lesson viewer `/learn/[slug]/[id]`: "Tài liệu tham khảo" below content if any.
4. 3 actions với instructor ownership check.
5. URL validation `z.string().url()` + scheme refine.
6. No migration backfill needed.

## Architecture

**Add flow:**
```
Instructor LessonEditor → "+ Thêm tài liệu" → inline form (name, url)
  → action addLessonAttachment({ lessonId, name, url })
  → requireAuth + assert lesson belongs to own course OR admin
  → order = max(existing order) + 1
  → Prisma create
  → revalidatePath(edit page + learn page)
```

**Ownership check pattern:**
```ts
const lesson = await db.lesson.findUnique({
  where: { id: lessonId },
  include: { module: { include: { course: true } } },
});
if (!lesson) throw new Error("NOT_FOUND");
const isOwner = lesson.module.course.instructorId === session.user.id;
const isAdmin = session.user.role === "ADMIN";
if (!isOwner && !isAdmin) throw new Error("FORBIDDEN");
```

## Related code files

**Create:**
- `components/instructor/AttachmentSection.tsx`
- `components/lesson/LessonAttachments.tsx`
- `lib/actions/attachment.actions.ts`
- `lib/validations/attachment.ts`
- `prisma/migrations/<ts>_attachments/migration.sql`

**Modify:**
- `prisma/schema.prisma`
- `components/admin/LessonEditor.tsx`
- `components/learn/LessonContent.tsx`
- `prisma/seed.ts`

## Implementation Steps
1. Update `prisma/schema.prisma`: add `Attachment` model + cascade + reverse relation `Lesson.attachments`.
2. Migration `pnpm prisma migrate dev --name attachments`.
3. Build `lib/validations/attachment.ts`:
   ```
   attachmentSchema = { lessonId: cuid, name: string(min 2, max 100), url: string.url().refine(scheme not in [javascript, data]) }
   updateAttachmentSchema = partial without lessonId
   ```
4. Build `lib/actions/attachment.actions.ts` — 3 actions với ownership check + revalidate.
5. Build `AttachmentSection` (instructor editor):
   - Server-side `initialAttachments` prop.
   - List with delete X + edit pencil (opens inline form).
   - "+ Thêm tài liệu" button → reveal form (name input, url input) → submit → action → toast.
6. Build `LessonAttachments` (viewer):
   - If `attachments.length === 0` → render nothing.
   - Else: heading "Tài liệu tham khảo" + ul of links với `Download` icon.
7. Wire `AttachmentSection` into `LessonEditor.tsx` below content editor.
8. Wire `LessonAttachments` into `LessonContent.tsx` below markdown.
9. Seed: add 2 attachments to demo first lesson.
10. End-to-end test: instructor add → save → student enroll → view lesson → click link opens new tab.

## Todo list
- [ ] Step 1: schema Attachment + relation
- [ ] Step 2: migrate
- [ ] Step 3: zod schemas
- [ ] Step 4: attachment.actions.ts (3 actions)
- [ ] Step 5: AttachmentSection editor component
- [ ] Step 6: LessonAttachments viewer component
- [ ] Step 7: wire into LessonEditor
- [ ] Step 8: wire into LessonContent
- [ ] Step 9: seed sample attachments
- [ ] Step 10: end-to-end test

## Success Criteria
- Instructor add attachment với name + URL → row in DB with correct order.
- Student in lesson viewer sees Tài liệu section, click → opens URL in new tab.
- Delete attachment removes row + UI updates.
- Edit attachment updates name and URL.
- Lesson với 0 attachments hides section entirely (no empty heading).
- Non-owner instructor cannot add attachment to lesson họ không own.
- Invalid URL ("abc") rejected by zod với error message.
- `javascript:` URL rejected.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Instructor link to malicious file | Med | High | Disclaimer + admin can report+remove (Phase 11) |
| Linked file 404 over time | High | Low | Acceptable cho demo |
| URL with `javascript:` XSS | Low | High | zod `.url()` + scheme refine; `target="_blank" rel="noopener noreferrer"` |
| Reorder UX missing | Med | Low | Order ASC by createdAt sufficient cho đồ án |
| File name leaks PII in URL | Low | Low | Instructor responsibility |

## Security Considerations
- URL validation `z.string().url()` + explicit `.refine` reject `javascript:`, `data:` schemes.
- Render `<a href={url} target="_blank" rel="noopener noreferrer">` — `noopener` prevents tab-nabbing.
- Server-side ownership re-check; don't trust client lessonId/courseId.
- Cascade delete: Lesson delete → attachments removed (FK cascade).
- No upload = no file storage attack surface, no virus scanning.
- Max 20 attachments per lesson (server-side count check before insert).

## Next steps
→ [Phase 11 — Admin Enhancements](./phase-11-admin-enhancements.md)
