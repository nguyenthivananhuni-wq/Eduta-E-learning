"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refreshRecommendationsAction } from "@/lib/actions/recommendation.actions";

export function RefreshRecommendations() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await refreshRecommendationsAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã làm mới gợi ý");
      router.refresh();
    });
  };

  return (
    <Button size="sm" variant="ghost" onClick={handleClick} disabled={isPending}>
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <RefreshCw className="size-4" />
      )}
      Làm mới
    </Button>
  );
}
