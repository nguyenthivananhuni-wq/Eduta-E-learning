"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Flag, Check, X, Loader2, ExternalLink, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { resolveReport, dismissReport } from "@/lib/actions/report.actions";
import {
  actionsByTarget,
  reportActionLabels,
  destructiveActions,
  type ReportAction,
} from "@/lib/validations/report";

type Target = {
  type: "COURSE" | "USER" | "REVIEW";
  id: string;
  label: string;
  link: string | null;
  exists: boolean;
};

type Props = {
  report: {
    id: string;
    targetType: "COURSE" | "USER" | "REVIEW";
    targetId: string;
    reason: string;
    createdAt: Date;
    reporter: { id: string; name: string; email: string };
  };
  target: Target;
};

const TYPE_LABEL: Record<Props["report"]["targetType"], string> = {
  COURSE: "Khóa học",
  USER: "Người dùng",
  REVIEW: "Đánh giá",
};

/** Hành động mặc định gợi ý theo loại (bỏ NONE). */
function defaultActionFor(targetType: Props["report"]["targetType"]): ReportAction {
  const real = actionsByTarget[targetType].find((a) => a !== "NONE");
  return real ?? "NONE";
}

export function ReportCard({ report, target }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Nếu nội dung đã bị xóa trước đó → chỉ cho phép ghi chú
  const options: ReportAction[] = target.exists
    ? [...actionsByTarget[report.targetType]]
    : ["NONE"];
  const [action, setAction] = useState<ReportAction>(
    target.exists ? defaultActionFor(report.targetType) : "NONE"
  );
  const [note, setNote] = useState("");

  const isDestructive = destructiveActions.has(action);

  const handleResolve = () => {
    startTransition(async () => {
      const result = await resolveReport(report.id, {
        action,
        resolution: note.trim() || undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã xử lý báo cáo");
      router.refresh();
    });
  };

  const handleDismiss = () => {
    startTransition(async () => {
      const result = await dismissReport(report.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã bỏ qua");
      router.refresh();
    });
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Flag className="size-4 text-destructive" />
            <Badge variant="outline">{TYPE_LABEL[report.targetType]}</Badge>
            <Badge variant="destructive">Chờ xử lý</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat("vi-VN", {
              dateStyle: "short",
              timeStyle: "short",
            }).format(report.createdAt)}
          </p>
        </div>

        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          <p className="text-xs text-muted-foreground mb-1">Mục bị báo cáo:</p>
          <div className="flex items-center gap-2">
            {target.exists && target.link ? (
              <Link href={target.link} className="font-medium hover:underline inline-flex items-center gap-1" target="_blank">
                {target.label}
                <ExternalLink className="size-3" />
              </Link>
            ) : (
              <span className="font-medium italic text-muted-foreground">{target.label}</span>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">Lý do:</p>
          <p className="text-sm whitespace-pre-wrap">{report.reason}</p>
        </div>

        <div className="text-xs text-muted-foreground">
          Người báo cáo: <strong>{report.reporter.name}</strong> ({report.reporter.email})
        </div>

        {/* Bộ chọn hành động */}
        <div className="grid gap-3 sm:grid-cols-2 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs">Hành động xử lý</Label>
            <Select
              value={action}
              onValueChange={(v) => setAction(v as ReportAction)}
              disabled={isPending || !target.exists}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((a) => (
                  <SelectItem key={a} value={a}>
                    {reportActionLabels[a]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!target.exists && (
              <p className="text-[11px] text-muted-foreground">
                Nội dung đã bị gỡ — chỉ có thể ghi chú.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Ghi chú (tùy chọn)</Label>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Lý do xử lý, gửi kèm thông báo..."
              disabled={isPending}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={handleDismiss} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
            Bỏ qua
          </Button>

          {isDestructive ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" disabled={isPending}>
                  <AlertTriangle className="size-4" />
                  {reportActionLabels[action]}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận hành động</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn sắp <strong>{reportActionLabels[action].toLowerCase()}</strong> đối với
                    “{target.label}”. Hành động này có thể không hoàn tác. Tiếp tục?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResolve}>Xác nhận</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              size="sm"
              onClick={handleResolve}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Xử lý
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
