import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  courseSlug: string;
  prevId: string | null;
  nextId: string | null;
};

export function LessonNav({ courseSlug, prevId, nextId }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 pt-6 border-t">
      {prevId ? (
        <Button asChild variant="outline">
          <Link href={`/learn/${courseSlug}/${prevId}`}>
            <ChevronLeft className="size-4" />
            Bài trước
          </Link>
        </Button>
      ) : (
        <div />
      )}

      {nextId ? (
        <Button asChild>
          <Link href={`/learn/${courseSlug}/${nextId}`}>
            Bài tiếp theo
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      ) : (
        <Button asChild variant="outline">
          <Link href={`/dashboard`}>Hoàn thành khóa</Link>
        </Button>
      )}
    </div>
  );
}
