"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Flag, Check, X, Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolveReport, dismissReport } from "@/lib/actions/report.actions";

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

export function ReportCard({ report, target }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleResolve = () => {
    startTransition(async () => {
      const result = await resolveReport(report.id, {});
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã giải quyết");
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

        <div className="flex justify-end gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={handleDismiss} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
            Bỏ qua
          </Button>
          <Button
            size="sm"
            onClick={handleResolve}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Đã giải quyết
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
