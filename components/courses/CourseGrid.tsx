import { CourseCard } from "./CourseCard";

type Course = React.ComponentProps<typeof CourseCard>["course"];

export function CourseGrid({ courses }: { courses: Course[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((c) => (
        <CourseCard key={c.slug} course={c} />
      ))}
    </div>
  );
}
