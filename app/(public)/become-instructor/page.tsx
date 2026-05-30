import Link from "next/link";
import { GraduationCap, CheckCircle2, Clock, XCircle } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApplicationForm } from "@/components/instructor/ApplicationForm";
import { INSTRUCTOR_EARNING_PERCENT, PLATFORM_FEE_PERCENT } from "@/lib/constants";
import { can } from "@/lib/auth/roles";

export const metadata = { title: "Trở thành giảng viên" };

export default async function BecomeInstructorPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const role = session?.user?.role;

  let latestApplication = null;
  if (userId) {
    latestApplication = await db.instructorApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  const isAlreadyInstructor = can(role, "teach");

  return (
    <div className="container max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center">
        <div className="inline-flex size-14 items-center justify-center rounded-full bg-primary/10 mb-4">
          <GraduationCap className="size-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Trở thành giảng viên Eduta</h1>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
          Chia sẻ kiến thức, xây dựng cộng đồng và kiếm thu nhập từ kỹ năng của bạn.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{INSTRUCTOR_EARNING_PERCENT}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              Doanh thu giảng viên nhận
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{PLATFORM_FEE_PERCENT}%</p>
            <p className="text-xs text-muted-foreground mt-1">Phí nền tảng</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">∞</p>
            <p className="text-xs text-muted-foreground mt-1">Số khóa học</p>
          </CardContent>
        </Card>
      </div>

      {!userId ? (
        <Card>
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-muted-foreground">
              Vui lòng đăng nhập để gửi đơn đăng ký
            </p>
            <Button asChild>
              <Link href="/login?callbackUrl=/become-instructor">Đăng nhập</Link>
            </Button>
          </CardContent>
        </Card>
      ) : isAlreadyInstructor ? (
        <Card>
          <CardContent className="p-6 text-center space-y-3">
            <CheckCircle2 className="size-10 text-emerald-500 mx-auto" />
            <p className="font-medium">Bạn đã là giảng viên</p>
            <Button asChild>
              <Link href="/instructor">Vào khu vực giảng viên</Link>
            </Button>
          </CardContent>
        </Card>
      ) : latestApplication?.status === "PENDING" ? (
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-amber-500" />
              <p className="font-medium">Đơn của bạn đang chờ duyệt</p>
              <Badge variant="outline" className="border-amber-500 text-amber-600">
                Chờ duyệt
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Gửi lúc:{" "}
              {new Intl.DateTimeFormat("vi-VN", {
                dateStyle: "short",
                timeStyle: "short",
              }).format(latestApplication.createdAt)}
            </p>
            <div className="rounded-lg border p-3 text-sm space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Chuyên môn</p>
                <p>{latestApplication.expertise}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Giới thiệu</p>
                <p className="whitespace-pre-wrap">{latestApplication.bio}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Đơn đăng ký</CardTitle>
            {latestApplication?.status === "REJECTED" && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 flex items-start gap-2">
                <XCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Đơn trước đã bị từ chối</p>
                  <p className="text-destructive/80 text-xs mt-0.5">
                    Lý do: {latestApplication.rejectionReason ?? "Không có"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Bạn có thể gửi lại đơn mới bên dưới.
                  </p>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <ApplicationForm />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
