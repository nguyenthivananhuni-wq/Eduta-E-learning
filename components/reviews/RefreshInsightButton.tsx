"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refreshReviewInsight } from "@/lib/actions/review-insight.actions";

type Props = {
  courseId: string;
};

export function RefreshInsightButton({ courseId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await refreshReviewInsight(courseId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã cập nhật phân tích");
      router.refresh();
    });
  };

  return (
    <Button size="sm" variant="outline" onClick={handleClick} disabled={isPending}>
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
      Cập nhật phân tích
    </Button>
  );
}
