"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { approveCourse, rejectCourse } from "@/lib/actions/course-approval.actions";

type Props = {
  courseId: string;
};

export function ApproveRejectButtons({ courseId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveCourse(courseId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã duyệt khóa học");
      router.refresh();
    });
  };

  const handleReject = () => {
    if (reason.trim().length < 10) {
      toast.error("Lý do phải có ít nhất 10 ký tự");
      return;
    }
    startTransition(async () => {
      const result = await rejectCourse(courseId, { reason });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã từ chối khóa học");
      setRejectOpen(false);
      setReason("");
      router.refresh();
    });
  };

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={handleApprove}
        disabled={isPending}
        className="bg-emerald-600 hover:bg-emerald-700"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        Duyệt
      </Button>
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={isPending}>
            <X className="size-4" />
            Từ chối
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối khóa học</DialogTitle>
            <DialogDescription>
              Lý do sẽ được gửi tới giảng viên để họ chỉnh sửa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reason">Lý do từ chối *</Label>
            <Textarea
              id="reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Nội dung chưa đủ chi tiết, thiếu video bài giảng, quiz quá ít câu hỏi..."
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={isPending}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
