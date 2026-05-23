import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApproveRejectButtons } from "@/components/admin/ApproveRejectButtons";
import { formatVND } from "@/lib/utils/format";

export const metadata = { title: "Duyệt khóa học" };

export default async function PendingCoursesPage() {
  const pending = await db.course.findMany({
    where: { status: "PENDING" },
    orderBy: { updatedAt: "desc" },
    include: {
      instructor: { select: { id: true, name: true, email: true } },
      _count: { select: { modules: true } },
    },
  });

  return (
    <div className="container max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Duyệt khóa học</h1>
        <p className="text-muted-foreground mt-1">
          Khóa học do giảng viên gửi và đang chờ admin duyệt
        </p>
      </div>

      {pending.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            Không có khóa học nào đang chờ duyệt
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pending.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-5">
                <div className="grid sm:grid-cols-[120px_1fr_auto] gap-4 items-start">
                  <div className="relative aspect-video sm:size-30 rounded-md overflow-hidden bg-muted">
                    <Image
                      src={c.thumbnail}
                      alt={c.title}
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">{c.category}</Badge>
                      <Badge variant="outline" className="border-amber-500 text-amber-600">
                        Chờ duyệt
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg leading-tight">
                      <Link
                        href={`/admin/courses/${c.id}/edit`}
                        className="hover:underline"
                      >
                        {c.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {c.description}
                    </p>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                      <span>
                        Giảng viên:{" "}
                        <span className="font-medium text-foreground">
                          {c.instructor?.name ?? "—"}
                        </span>
                      </span>
                      <span>{c._count.modules} chương</span>
                      <span>{formatVND(c.price)}</span>
                      <span>
                        Gửi:{" "}
                        {new Intl.DateTimeFormat("vi-VN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(c.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/courses/${c.id}/edit`}>Xem chi tiết</Link>
                    </Button>
                    <ApproveRejectButtons courseId={c.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
