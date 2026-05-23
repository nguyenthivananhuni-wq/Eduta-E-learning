"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markLessonComplete } from "@/lib/actions/progress.actions";

type Props = {
  lessonId: string;
  courseSlug: string;
  completed: boolean;
  hasQuiz: boolean;
};

export function CompletionButton({ lessonId, courseSlug, completed, hasQuiz }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await markLessonComplete(lessonId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã đánh dấu hoàn thành");
      if (result.nextLessonId) {
        router.push(`/learn/${courseSlug}/${result.nextLessonId}`);
      }
      router.refresh();
    });
  };

  if (completed) {
    return (
      <Button variant="outline" disabled className="text-emerald-600 border-emerald-200">
        <CheckCircle2 className="size-4" />
        Đã hoàn thành
      </Button>
    );
  }

  return (
    <Button onClick={handleClick} disabled={isPending}>
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <CheckCircle2 className="size-4" />
      )}
      {hasQuiz ? "Bỏ qua quiz và đánh dấu hoàn thành" : "Đánh dấu hoàn thành"}
    </Button>
  );
}
