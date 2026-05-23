import Link from "next/link";
import { Plus, BookOpen, BarChart3 } from "lucide-react";
import { requireInstructor } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
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
import { formatVND } from "@/lib/utils/format";

export const metadata = { title: "Khóa học của tôi" };

export default async function InstructorCoursesPage() {
  const session = await requireInstructor();
  const courses = await db.course.findMany({
    where: { instructorId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { modules: true, enrollments: true } } },
  });

  return (
    <div className="container max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Khóa học của tôi</h1>
          <p className="text-muted-foreground mt-1">
            Tổng cộng {courses.length} khóa học
          </p>
        </div>
        <Button asChild>
          <Link href="/instructor/courses/new">
            <Plus className="size-4" />
            Tạo khóa mới
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {courses.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="size-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Chưa có khóa học nào</p>
              <Button asChild className="mt-4">
                <Link href="/instructor/courses/new">Tạo khóa đầu tiên</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead className="text-center">Chương</TableHead>
                  <TableHead className="text-center">Học viên</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Phân tích</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/instructor/courses/${c.id}/edit`}
                        className="hover:text-primary hover:underline"
                      >
                        {c.title}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">/{c.slug}</p>
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
                        <Badge variant="outline" className="border-amber-500 text-amber-600">
                          Chờ duyệt
                        </Badge>
                      ) : c.status === "REJECTED" ? (
                        <Badge variant="destructive">Bị từ chối</Badge>
                      ) : (
                        <Badge variant="outline">Bản nháp</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="icon" variant="ghost" title="Phân tích">
                        <Link href={`/instructor/courses/${c.id}/analytics`}>
                          <BarChart3 className="size-4" />
                        </Link>
                      </Button>
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
