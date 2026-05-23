"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteConfirm } from "./DeleteConfirm";
import { deleteCourse } from "@/lib/actions/course.actions";

type Props = {
  courseId: string;
  title: string;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
};

export function CourseRowActions({ courseId, title }: Props) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button size="icon" variant="ghost" asChild title="Chỉnh sửa">
        <Link href={`/admin/courses/${courseId}/edit`}>
          <Pencil className="size-4" />
        </Link>
      </Button>
      <DeleteConfirm
        trigger={
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            title="Xóa"
          >
            <Trash2 className="size-4" />
          </Button>
        }
        title="Xóa khóa học?"
        description={`Bạn có chắc muốn xóa "${title}"? Tất cả modules, bài học và quiz cũng sẽ bị xóa. Không thể hoàn tác.`}
        onConfirm={() => deleteCourse(courseId)}
      />
    </div>
  );
}
