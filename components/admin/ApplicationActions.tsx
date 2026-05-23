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
import {
  approveApplication,
  rejectApplication,
} from "@/lib/actions/instructor.actions";

type Props = {
  applicationId: string;
};

export function ApplicationActions({ applicationId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveApplication(applicationId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã duyệt đơn — user đã trở thành giảng viên");
      router.refresh();
    });
  };

  const handleReject = () => {
    if (reason.trim().length < 5) {
      toast.error("Lý do phải có ít nhất 5 ký tự");
      return;
    }
    startTransition(async () => {
      const result = await rejectApplication(applicationId, { reason });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã từ chối đơn");
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
            <DialogTitle>Từ chối đơn đăng ký</DialogTitle>
            <DialogDescription>
              Vui lòng nêu lý do để người gửi đơn biết và có thể chỉnh sửa lại.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reason">Lý do từ chối *</Label>
            <Textarea
              id="reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Thông tin chưa đầy đủ, cần bổ sung kinh nghiệm giảng dạy..."
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
