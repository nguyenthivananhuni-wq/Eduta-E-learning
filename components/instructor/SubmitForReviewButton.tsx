"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitForReview } from "@/lib/actions/course-approval.actions";

type Props = {
  courseId: string;
};

export function SubmitForReviewButton({ courseId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await submitForReview(courseId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã gửi cho admin duyệt");
      router.refresh();
    });
  };

  return (
    <Button onClick={handleSubmit} disabled={isPending}>
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
      Gửi duyệt
    </Button>
  );
}
