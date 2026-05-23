"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Star, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RatingStars } from "./RatingStars";
import { createReview, updateReview } from "@/lib/actions/review.actions";

type Props = {
  courseId: string;
  /** If present → edit mode */
  existing?: { id: string; rating: number; comment: string };
  trigger?: React.ReactNode;
};

export function ReviewForm({ courseId, existing, trigger }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [isPending, startTransition] = useTransition();

  const isEdit = !!existing;
  const valid = rating >= 1 && rating <= 5 && comment.trim().length >= 5;

  const reset = () => {
    if (!isEdit) {
      setRating(0);
      setComment("");
    } else {
      setRating(existing.rating);
      setComment(existing.comment);
    }
  };

  const handleSubmit = () => {
    if (!valid) {
      toast.error("Vui lòng chọn số sao và viết nhận xét (tối thiểu 5 ký tự)");
      return;
    }
    startTransition(async () => {
      const result = isEdit
        ? await updateReview(existing.id, { rating, comment })
        : await createReview({ courseId, rating, comment });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Đã cập nhật đánh giá" : "Đã gửi đánh giá. Cảm ơn bạn!");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            {isEdit ? <Pencil className="size-4" /> : <Star className="size-4" />}
            {isEdit ? "Sửa đánh giá" : "Viết đánh giá"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Sửa đánh giá" : "Đánh giá khóa học"}</DialogTitle>
          <DialogDescription>
            Chia sẻ trải nghiệm của bạn để giúp học viên khác và giảng viên cải thiện khóa học.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="mb-2 block">Số sao *</Label>
            <RatingStars value={rating} onChange={setRating} size="lg" />
            <p className="text-xs text-muted-foreground mt-1">
              {rating === 0
                ? "Chưa chọn"
                : ["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Tuyệt vời"][rating]}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Nhận xét *</Label>
            <Textarea
              id="comment"
              rows={5}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Bạn thích/không thích điều gì? Khóa học giúp bạn cải thiện ra sao?"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length} / 1000
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={!valid || isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Lưu thay đổi" : "Gửi đánh giá"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
