"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  FileText,
  FileQuestion,
  PlayCircle,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeleteConfirm } from "./DeleteConfirm";
import { QuizEditor } from "./QuizEditor";
import { AttachmentSection } from "@/components/instructor/AttachmentSection";
import { createLesson, updateLesson, deleteLesson } from "@/lib/actions/lesson.actions";
import { lessonSchema } from "@/lib/validations/course";

type Attachment = { id: string; name: string; url: string; order: number };

type Lesson = {
  id: string;
  title: string;
  videoUrl: string;
  content: string;
  order: number;
  quiz: { id: string; lessonId: string; questions: string } | null;
  attachments: Attachment[];
};

type LessonFormData = {
  title: string;
  videoUrl: string;
  content: string;
};

const formSchema = lessonSchema.omit({ moduleId: true });

type Props = {
  moduleId: string;
  lessons: Lesson[];
};

export function LessonEditor({ moduleId, lessons }: Props) {
  const [openForm, setOpenForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [quizForLesson, setQuizForLesson] = useState<Lesson | null>(null);
  const [attachmentsForLesson, setAttachmentsForLesson] = useState<Lesson | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LessonFormData>({
    resolver: zodResolver(formSchema),
  });

  const openCreate = () => {
    reset({ title: "", videoUrl: "https://www.youtube.com/watch?v=", content: "" });
    setEditingLesson(null);
    setOpenForm(true);
  };

  const openEdit = (lesson: Lesson) => {
    reset({ title: lesson.title, videoUrl: lesson.videoUrl, content: lesson.content });
    setEditingLesson(lesson);
    setOpenForm(true);
  };

  const onSubmit = (data: LessonFormData) => {
    startTransition(async () => {
      const result = editingLesson
        ? await updateLesson(editingLesson.id, data)
        : await createLesson({ moduleId, ...data });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(editingLesson ? "Đã lưu bài học" : "Đã thêm bài học");
      setOpenForm(false);
    });
  };

  return (
    <div className="space-y-2">
      {lessons.length === 0 ? (
        <p className="text-sm text-muted-foreground py-3 text-center">
          Chưa có bài học nào
        </p>
      ) : (
        <ul className="space-y-2">
          {lessons.map((lesson) => (
            <li
              key={lesson.id}
              className="flex items-center justify-between rounded-md border bg-card p-3 hover:bg-accent/30"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Badge variant="outline" className="shrink-0">
                  {lesson.order}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{lesson.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <PlayCircle className="size-3" />
                      Video
                    </span>
                    {lesson.content && (
                      <span className="flex items-center gap-1">
                        <FileText className="size-3" />
                        Markdown
                      </span>
                    )}
                    {lesson.quiz && (
                      <span className="flex items-center gap-1 text-primary">
                        <FileQuestion className="size-3" />
                        Quiz
                      </span>
                    )}
                    {lesson.attachments.length > 0 && (
                      <span className="flex items-center gap-1 text-primary">
                        <Paperclip className="size-3" />
                        {lesson.attachments.length} tài liệu
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAttachmentsForLesson(lesson)}
                  title="Quản lý tài liệu"
                >
                  <Paperclip className="size-4" />
                  Tài liệu
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setQuizForLesson(lesson)}
                  title="Quản lý quiz"
                >
                  <FileQuestion className="size-4" />
                  Quiz
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => openEdit(lesson)}
                  title="Sửa"
                >
                  <Pencil className="size-3.5" />
                </Button>
                <DeleteConfirm
                  trigger={
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  }
                  title="Xóa bài học?"
                  description={`Bài học "${lesson.title}" và quiz đi kèm sẽ bị xóa.`}
                  onConfirm={() => deleteLesson(lesson.id)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button onClick={openCreate} variant="outline" size="sm" className="w-full">
        <Plus className="size-4" />
        Thêm bài học
      </Button>

      {/* Create/Edit lesson dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? "Sửa bài học" : "Thêm bài học mới"}
            </DialogTitle>
            <DialogDescription>
              Mỗi bài học gồm 1 video YouTube và nội dung markdown
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lesson-title">Tiêu đề</Label>
              <Input id="lesson-title" disabled={isPending} {...register("title")} />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-video">URL YouTube</Label>
              <Input
                id="lesson-video"
                type="url"
                disabled={isPending}
                placeholder="https://www.youtube.com/watch?v=..."
                {...register("videoUrl")}
              />
              {errors.videoUrl && (
                <p className="text-sm text-destructive">{errors.videoUrl.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-content">Nội dung (Markdown)</Label>
              <Textarea
                id="lesson-content"
                rows={10}
                className="font-mono text-sm"
                disabled={isPending}
                placeholder="# Tiêu đề..."
                {...register("content")}
              />
              <p className="text-xs text-muted-foreground">
                Hỗ trợ Markdown cơ bản: # heading, **bold**, [link](url), table, list
              </p>
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenForm(false)}
                disabled={isPending}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {editingLesson ? "Lưu" : "Thêm"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quiz editor dialog */}
      {quizForLesson && (
        <QuizEditor
          lesson={quizForLesson}
          onClose={() => setQuizForLesson(null)}
        />
      )}

      {/* Attachment editor dialog */}
      {attachmentsForLesson && (
        <AttachmentSection
          lessonId={attachmentsForLesson.id}
          lessonTitle={attachmentsForLesson.title}
          attachments={attachmentsForLesson.attachments}
          onClose={() => setAttachmentsForLesson(null)}
        />
      )}
    </div>
  );
}
