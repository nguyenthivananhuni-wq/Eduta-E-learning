"use client";

import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RatingStars } from "./RatingStars";
import { ReviewForm } from "./ReviewForm";
import { ReportButton } from "@/components/reports/ReportButton";
import { DeleteConfirm } from "@/components/admin/DeleteConfirm";
import { deleteReview } from "@/lib/actions/review.actions";

type Props = {
  review: {
    id: string;
    userId: string;
    courseId: string;
    rating: number;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
    user: { id: string; name: string };
  };
  currentUserId?: string;
};

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function ReviewItem({ review, currentUserId }: Props) {
  const router = useRouter();
  const isOwn = currentUserId === review.userId;
  const wasEdited = review.updatedAt.getTime() - review.createdAt.getTime() > 1000;

  return (
    <article className="flex gap-3 py-4 border-b last:border-0">
      <Avatar className="size-10 shrink-0">
        <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">
          {getInitials(review.user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium leading-tight">{review.user.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <RatingStars value={review.rating} size="sm" />
              <span className="text-xs text-muted-foreground">
                {formatDate(review.createdAt)}
                {wasEdited && " · đã sửa"}
              </span>
            </div>
          </div>
          {!isOwn && currentUserId && (
            <ReportButton
              targetType="REVIEW"
              targetId={review.id}
              targetLabel={review.comment.slice(0, 80)}
              variant="icon"
              className="size-7 -mr-2"
            />
          )}
          {isOwn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7 -mr-2">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <ReviewForm
                  courseId={review.courseId}
                  existing={{
                    id: review.id,
                    rating: review.rating,
                    comment: review.comment,
                  }}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Pencil className="size-4" />
                      Sửa
                    </DropdownMenuItem>
                  }
                />
                <DeleteConfirm
                  trigger={
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="size-4" />
                      Xóa
                    </DropdownMenuItem>
                  }
                  title="Xóa đánh giá?"
                  description="Đánh giá sẽ bị xóa vĩnh viễn. Bạn có thể viết lại sau."
                  onConfirm={() => deleteReview(review.id)}
                  onSuccess={() => router.refresh()}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <p className="text-sm mt-2 whitespace-pre-wrap leading-relaxed">{review.comment}</p>
      </div>
    </article>
  );
}
