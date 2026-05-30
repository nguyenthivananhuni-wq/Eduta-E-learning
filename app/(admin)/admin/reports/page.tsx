import Link from "next/link";
import { Flag, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReportCard } from "@/components/admin/ReportCard";

export const metadata = { title: "Báo cáo — Admin" };
export const dynamic = "force-dynamic";

const HISTORY_LIMIT = 50;

type Target = {
  type: "COURSE" | "USER" | "REVIEW";
  id: string;
  label: string;
  link: string | null;
  exists: boolean;
};

const TYPE_LABEL: Record<Target["type"], string> = {
  COURSE: "Khóa học",
  USER: "Người dùng",
  REVIEW: "Đánh giá",
};

async function resolveTarget(
  type: "COURSE" | "USER" | "REVIEW",
  id: string
): Promise<Target> {
  if (type === "COURSE") {
    const c = await db.course.findUnique({
      where: { id },
      select: { title: true, slug: true },
    });
    return c
      ? { type, id, label: c.title, link: `/courses/${c.slug}`, exists: true }
      : { type, id, label: "[Đã xóa]", link: null, exists: false };
  }
  if (type === "USER") {
    const u = await db.user.findUnique({
      where: { id },
      select: { name: true, email: true },
    });
    return u
      ? { type, id, label: `${u.name} (${u.email})`, link: `/admin/users`, exists: true }
      : { type, id, label: "[Đã xóa]", link: null, exists: false };
  }
  // REVIEW
  const r = await db.review.findUnique({
    where: { id },
    select: { comment: true, course: { select: { slug: true } } },
  });
  return r
    ? {
        type,
        id,
        label: r.comment.slice(0, 100) + (r.comment.length > 100 ? "..." : ""),
        link: `/courses/${r.course.slug}`,
        exists: true,
      }
    : { type, id, label: "[Đã xóa]", link: null, exists: false };
}

export default async function AdminReportsPage() {
  const [pending, history] = await Promise.all([
    db.report.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: { reporter: { select: { id: true, name: true, email: true } } },
    }),
    db.report.findMany({
      where: { status: { in: ["RESOLVED", "DISMISSED"] } },
      orderBy: { resolvedAt: "desc" },
      take: HISTORY_LIMIT,
      include: {
        reporter: { select: { name: true } },
        resolver: { select: { name: true } },
      },
    }),
  ]);

  const [pendingTargets, historyTargets] = await Promise.all([
    Promise.all(pending.map((r) => resolveTarget(r.targetType, r.targetId))),
    Promise.all(history.map((r) => resolveTarget(r.targetType, r.targetId))),
  ]);

  return (
    <div className="container max-w-4xl mx-auto px-6 py-8 space-y-10">
      {/* Pending */}
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Flag className="size-7 text-destructive" />
            Báo cáo nội dung
            {pending.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pending.length}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            {pending.length} đang chờ xử lý • {history.length} gần đây đã xử lý
          </p>
        </div>

        {pending.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Flag className="size-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Không có báo cáo nào đang chờ xử lý
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pending.map((report, i) => (
              <ReportCard key={report.id} report={report} target={pendingTargets[i]!} />
            ))}
          </div>
        )}
      </section>

      {/* History */}
      {history.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Đã xử lý gần đây</h2>
          <Card>
            <CardContent className="p-0 divide-y">
              {history.map((report, i) => {
                const target = historyTargets[i]!;
                const isResolved = report.status === "RESOLVED";
                return (
                  <div key={report.id} className="flex items-start gap-3 p-4">
                    <div className="mt-0.5 shrink-0">
                      {isResolved ? (
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      ) : (
                        <XCircle className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {TYPE_LABEL[report.targetType]}
                        </Badge>
                        <Badge
                          variant={isResolved ? "default" : "secondary"}
                          className={isResolved ? "bg-emerald-600 text-xs" : "text-xs"}
                        >
                          {isResolved ? "Đã giải quyết" : "Bỏ qua"}
                        </Badge>
                        {target.link ? (
                          <Link
                            href={target.link}
                            target="_blank"
                            className="text-sm font-medium hover:underline inline-flex items-center gap-1 truncate"
                          >
                            {target.label}
                            <ExternalLink className="size-3 shrink-0" />
                          </Link>
                        ) : (
                          <span className="text-sm font-medium italic text-muted-foreground truncate">
                            {target.label}
                          </span>
                        )}
                      </div>
                      {report.resolution && (
                        <p className="text-sm text-muted-foreground">{report.resolution}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Người báo cáo: {report.reporter.name}
                        {report.resolver && <> • Xử lý bởi: {report.resolver.name}</>}
                        {report.resolvedAt && (
                          <>
                            {" • "}
                            {new Intl.DateTimeFormat("vi-VN", {
                              dateStyle: "short",
                              timeStyle: "short",
                            }).format(report.resolvedAt)}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
