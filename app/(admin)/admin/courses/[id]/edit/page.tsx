import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CourseForm } from "@/components/admin/CourseForm";
import { ModuleEditor } from "@/components/admin/ModuleEditor";

export const metadata = { title: "Chỉnh sửa khóa học" };

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  return (
    <div className="container max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/courses">
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
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <p className="text-muted-foreground mt-1">
          ID: <code className="text-xs">{course.id}</code>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin khóa học</CardTitle>
          <CardDescription>
            Chỉnh sửa các thông tin hiển thị cho học viên
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CourseForm
            courseId={course.id}
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
            Quản lý modules, bài học và quiz. Học viên chỉ thấy khóa này nếu đã được duyệt và có ít nhất 1 bài học.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ModuleEditor courseId={course.id} modules={course.modules} />
        </CardContent>
      </Card>
    </div>
  );
}
