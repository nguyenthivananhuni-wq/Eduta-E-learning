import { MessageCircle } from "lucide-react";
import { ReviewItem } from "./ReviewItem";

type Review = {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string };
};

type Props = {
  reviews: Review[];
  currentUserId?: string;
  totalCount: number;
};

export function ReviewList({ reviews, currentUserId, totalCount }: Props) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed py-10 text-center">
        <MessageCircle className="size-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm font-medium">Chưa có đánh giá nào</p>
        <p className="text-xs text-muted-foreground mt-1">
          Hãy là người đầu tiên đánh giá khóa học này!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card px-5">
      {reviews.map((r) => (
        <ReviewItem key={r.id} review={r} currentUserId={currentUserId} />
      ))}
      {totalCount > reviews.length && (
        <p className="py-3 text-center text-xs text-muted-foreground">
          Hiện {reviews.length} trên tổng {totalCount} đánh giá gần nhất
        </p>
      )}
    </div>
  );
}
