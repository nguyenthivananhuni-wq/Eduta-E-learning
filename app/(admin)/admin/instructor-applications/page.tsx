import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApplicationActions } from "@/components/admin/ApplicationActions";

export const metadata = { title: "Đơn đăng ký giảng viên" };

export default async function InstructorApplicationsPage() {
  const [pending, processed] = await Promise.all([
    db.instructorApplication.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    db.instructorApplication.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
      orderBy: { reviewedAt: "desc" },
      take: 20,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  return (
    <div className="container max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Đơn đăng ký giảng viên</h1>
        <p className="text-muted-foreground mt-1">
          Duyệt yêu cầu trở thành giảng viên từ học viên
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">
          Chờ duyệt ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Không có đơn nào đang chờ duyệt
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pending.map((app) => (
              <Card key={app.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-base">{app.user.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {app.user.email}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("vi-VN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(app.createdAt)}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Chuyên môn</p>
                      <p>{app.expertise}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Giới thiệu</p>
                      <p className="whitespace-pre-wrap">{app.bio}</p>
                    </div>
                    {app.motivation && (
                      <div>
                        <p className="text-xs text-muted-foreground">Động lực</p>
                        <p className="whitespace-pre-wrap">{app.motivation}</p>
                      </div>
                    )}
                  </div>
                  <ApplicationActions applicationId={app.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {processed.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Lịch sử xử lý</h2>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y">
                {processed.map((app) => (
                  <li key={app.id} className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{app.user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {app.user.email}
                      </p>
                    </div>
                    {app.status === "APPROVED" ? (
                      <Badge variant="success">Đã duyệt</Badge>
                    ) : (
                      <Badge variant="destructive">Từ chối</Badge>
                    )}
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {app.reviewedAt &&
                        new Intl.DateTimeFormat("vi-VN", {
                          dateStyle: "short",
                        }).format(app.reviewedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
