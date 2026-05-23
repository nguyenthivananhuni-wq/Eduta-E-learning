import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CourseForm } from "@/components/admin/CourseForm";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Tạo khóa học mới" };

export default function NewInstructorCoursePage() {
  return (
    <div className="container max-w-4xl mx-auto px-6 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/instructor/courses">
          <ArrowLeft className="size-4" />
          Quay lại
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tạo khóa học mới</h1>
        <p className="text-muted-foreground mt-1">
          Khóa mới sẽ ở trạng thái <strong>Bản nháp</strong>. Sau khi thêm bài học, bạn có thể submit cho admin duyệt.
        </p>
      </div>

      <CourseForm basePath="/instructor/courses" />
    </div>
  );
}
