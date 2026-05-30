import Link from "next/link";
import { BookOpen } from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CourseRowActions } from "@/components/admin/CourseRowActions";
import { formatVND } from "@/lib/utils/format";

export const metadata = { title: "Quản lý khóa học" };

export default async function AdminCoursesPage() {
  const courses = await db.course.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { enrollments: true, modules: true },
      },
    },
  });

  return (
    <div className="container max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Quản lý khóa học</h1>
        <p className="text-muted-foreground mt-1">
          Tổng cộng {courses.length} khóa học — kiểm duyệt, chỉnh sửa và gỡ bỏ.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {courses.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="size-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Chưa có khóa học nào</p>
              <p className="text-sm text-muted-foreground mt-1">
                Khóa học do giảng viên tạo sẽ xuất hiện ở đây để bạn kiểm duyệt.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead className="text-center">Modules</TableHead>
                  <TableHead className="text-center">Học viên</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/courses/${c.id}/edit`}
                        className="hover:text-primary hover:underline"
                      >
                        {c.title}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        /{c.slug}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{c.category}</Badge>
                    </TableCell>
                    <TableCell>{formatVND(c.price)}</TableCell>
                    <TableCell className="text-center">{c._count.modules}</TableCell>
                    <TableCell className="text-center">
                      {c._count.enrollments}
                    </TableCell>
                    <TableCell>
                      {c.status === "APPROVED" ? (
                        <Badge variant="success">Đã duyệt</Badge>
                      ) : c.status === "PENDING" ? (
                        <Badge variant="outline" className="border-amber-500 text-amber-600">Chờ duyệt</Badge>
                      ) : c.status === "REJECTED" ? (
                        <Badge variant="destructive">Bị từ chối</Badge>
                      ) : (
                        <Badge variant="outline">Bản nháp</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <CourseRowActions
                        courseId={c.id}
                        title={c.title}
                        status={c.status}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
