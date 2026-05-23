import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CourseForm } from "@/components/admin/CourseForm";
import { ModuleEditor } from "@/components/admin/ModuleEditor";
import { SubmitForReviewButton } from "@/components/instructor/SubmitForReviewButton";

export const metadata = { title: "Chỉnh sửa khóa học" };

export default async function InstructorEditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const course = await db.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: {
              quiz: true,
              attachments: { orderBy: { order: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!course) notFound();

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && course.instructorId !== session.user.id) {
    redirect("/instructor/courses");
  }

  const hasLessons = course.modules.some((m) => m.lessons.length > 0);
  const canSubmit =
    (course.status === "DRAFT" || course.status === "REJECTED") && hasLessons;

  return (
    <div className="container max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/instructor/courses">
            <ArrowLeft className="size-4" />
            Quay lại danh sách
          </Link>
        </Button>
        {course.status === "APPROVED" && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/courses/${course.slug}`} target="_blank">
              <ExternalLink className="size-4" />
              Xem trang công khai
            </Link>
          </Button>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          {course.status === "APPROVED" ? (
            <Badge variant="success">Đã duyệt</Badge>
          ) : course.status === "PENDING" ? (
            <Badge variant="outline" className="border-amber-500 text-amber-600">
              Chờ duyệt
            </Badge>
          ) : course.status === "REJECTED" ? (
            <Badge variant="destructive">Bị từ chối</Badge>
          ) : (
            <Badge variant="outline">Bản nháp</Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold">{course.title}</h1>
      </div>

      {course.status === "REJECTED" && course.rejectionReason && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm flex-1">
              <p className="font-medium text-destructive">Khóa học bị từ chối</p>
              <p className="text-destructive/80 mt-0.5">
                Lý do: {course.rejectionReason}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sau khi chỉnh sửa, hãy bấm <strong>Gửi duyệt</strong> để gửi lại.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {course.status === "PENDING" && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="size-5 text-amber-600 shrink-0" />
            <p className="text-sm flex-1">
              Khóa học đang chờ admin duyệt. Bạn có thể tiếp tục chỉnh sửa, nhưng thay đổi sẽ không hiển thị công khai cho đến khi được duyệt lại.
            </p>
          </CardContent>
        </Card>
      )}

      {canSubmit && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3 flex-wrap">
            <CheckCircle2 className="size-5 text-primary shrink-0" />
            <p className="text-sm flex-1">
              Khóa học đã đủ điều kiện gửi duyệt ({course.modules.length} chương, có bài học).
            </p>
            <SubmitForReviewButton courseId={course.id} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Thông tin khóa học</CardTitle>
          <CardDescription>
            Chỉnh sửa thông tin hiển thị cho học viên
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CourseForm
            courseId={course.id}
            basePath="/instructor/courses"
            defaultValues={{
              title: course.title,
              slug: course.slug,
              description: course.description,
              thumbnail: course.thumbnail,
              price: course.price,
              category: course.category as never,
            }}
          />
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Nội dung khóa học</CardTitle>
          <CardDescription>
            Quản lý chương, bài học và quiz. Cần ít nhất 1 bài học để gửi duyệt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ModuleEditor courseId={course.id} modules={course.modules} />
        </CardContent>
      </Card>
    </div>
  );
}
