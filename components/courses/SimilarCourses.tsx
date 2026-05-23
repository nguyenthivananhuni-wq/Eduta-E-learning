import { Layers } from "lucide-react";
import { CourseCard } from "@/components/courses/CourseCard";
import { getSimilarCourses } from "@/lib/ai/recommendations";

type Props = {
  courseId: string;
};

export async function SimilarCourses({ courseId }: Props) {
  const courses = await getSimilarCourses(courseId, 3);
  if (courses.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
        <Layers className="size-5 text-primary" />
        Khóa học tương tự
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </div>
    </section>
  );
}
