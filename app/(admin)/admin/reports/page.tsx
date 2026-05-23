import { Flag } from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReportCard } from "@/components/admin/ReportCard";

export const metadata = { title: "Báo cáo — Admin" };
export const dynamic = "force-dynamic";

type Target = {
  type: "COURSE" | "USER" | "REVIEW";
  id: string;
  label: string;
  link: string | null;
  exists: boolean;
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
  const [pending, resolved] = await Promise.all([
    db.report.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: { reporter: { select: { id: true, name: true, email: true } } },
    }),
    db.report.count({ where: { status: { in: ["RESOLVED", "DISMISSED"] } } }),
  ]);

  const targets = await Promise.all(
    pending.map((r) => resolveTarget(r.targetType, r.targetId))
  );

  return (
    <div className="container max-w-4xl mx-auto px-6 py-8 space-y-6">
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
          {pending.length} đang chờ xử lý • {resolved} đã xử lý
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
            <ReportCard key={report.id} report={report} target={targets[i]!} />
          ))}
        </div>
      )}
    </div>
  );
}
