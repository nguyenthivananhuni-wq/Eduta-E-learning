"use client";

import { useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { upsertQuiz, deleteQuiz } from "@/lib/actions/quiz.actions";
import { quizQuestionSchema } from "@/lib/validations/course";

type Lesson = {
  id: string;
  title: string;
  quiz: { questions: string } | null;
};

const formSchema = z.object({
  questions: z.array(quizQuestionSchema).min(1).max(20),
});

type FormData = z.infer<typeof formSchema>;

function parseQuestions(json: string | undefined): FormData["questions"] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
}

const EMPTY_QUESTION = {
  question: "",
  options: ["", "", "", ""],
  correctIndex: 0,
};

type Props = {
  lesson: Lesson;
  onClose: () => void;
};

export function QuizEditor({ lesson, onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const existing = parseQuestions(lesson.quiz?.questions);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      questions: existing.length > 0 ? existing : [EMPTY_QUESTION],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  });

  const watchedQuestions = watch("questions");

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const result = await upsertQuiz({
        lessonId: lesson.id,
        questions: data.questions,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã lưu quiz");
      onClose();
    });
  };

  const handleDelete = () => {
    if (!confirm("Xóa toàn bộ quiz của bài học này?")) return;
    startTransition(async () => {
      const result = await deleteQuiz(lesson.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã xóa quiz");
      onClose();
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Quiz cho: {lesson.title}</DialogTitle>
          <DialogDescription>
            Tối thiểu 1 câu hỏi, tối đa 20. Mỗi câu có 2-6 lựa chọn, chọn 1 đáp án đúng.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {fields.map((field, qIdx) => (
            <Card key={field.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Câu {qIdx + 1}</Label>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => remove(qIdx)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
                <Input
                  placeholder="Nội dung câu hỏi"
                  disabled={isPending}
                  {...register(`questions.${qIdx}.question`)}
                />
                {errors.questions?.[qIdx]?.question && (
                  <p className="text-xs text-destructive">
                    {errors.questions[qIdx]?.question?.message}
                  </p>
                )}

                <Separator />

                <Label className="text-xs text-muted-foreground">
                  Đáp án (chọn radio để đánh dấu đáp án đúng)
                </Label>

                <RadioGroup
                  value={String(watchedQuestions[qIdx]?.correctIndex ?? 0)}
                  onValueChange={(v) =>
                    setValue(`questions.${qIdx}.correctIndex`, Number(v), {
                      shouldValidate: true,
                    })
                  }
                  className="space-y-2"
                >
                  {[0, 1, 2, 3].map((optIdx) => (
                    <div key={optIdx} className="flex items-center gap-3">
                      <RadioGroupItem
                        value={String(optIdx)}
                        id={`q${qIdx}-opt${optIdx}`}
                        disabled={isPending}
                      />
                      <Input
                        placeholder={`Lựa chọn ${optIdx + 1}`}
                        disabled={isPending}
                        {...register(`questions.${qIdx}.options.${optIdx}`)}
                      />
                    </div>
                  ))}
                </RadioGroup>
                {errors.questions?.[qIdx]?.options && (
                  <p className="text-xs text-destructive">Vui lòng điền đủ các lựa chọn</p>
                )}
              </CardContent>
            </Card>
          ))}

          {fields.length < 20 && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => append(EMPTY_QUESTION)}
              disabled={isPending}
            >
              <Plus className="size-4" />
              Thêm câu hỏi
            </Button>
          )}

          <DialogFooter className="flex sm:justify-between gap-2 pt-2">
            <div>
              {existing.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  Xóa toàn bộ quiz
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                Hủy
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Lưu quiz
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
