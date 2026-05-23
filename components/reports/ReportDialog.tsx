"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Flag, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { reportContent } from "@/lib/actions/report.actions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: "COURSE" | "USER" | "REVIEW";
  targetId: string;
  targetLabel?: string;
};

const TARGET_LABEL: Record<Props["targetType"], string> = {
  COURSE: "khóa học",
  USER: "người dùng",
  REVIEW: "đánh giá",
};

export function ReportDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetLabel,
}: Props) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (reason.trim().length < 10) {
      toast.error("Lý do phải có ít nhất 10 ký tự");
      return;
    }
    startTransition(async () => {
      const result = await reportContent({ targetType, targetId, reason });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã gửi báo cáo. Đội ngũ admin sẽ xem xét sớm.");
      setReason("");
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="size-4 text-destructive" />
            Báo cáo {TARGET_LABEL[targetType]}
          </DialogTitle>
          <DialogDescription>
            {targetLabel
              ? `Báo cáo "${targetLabel}". `
              : ""}
            Mô tả ngắn gọn lý do (sai phạm bản quyền, nội dung không phù hợp, spam, v.v.). Admin sẽ kiểm tra trong thời gian sớm.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="report-reason">Lý do *</Label>
          <Textarea
            id="report-reason"
            rows={5}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="VD: Khóa học có thông tin sai lệch về..."
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground text-right">
            {reason.length} / 500
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Gửi báo cáo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
