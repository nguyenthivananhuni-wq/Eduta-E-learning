import { Search } from "lucide-react";
import { CatalogFilters } from "@/components/courses/CatalogFilters";
import { CourseGrid } from "@/components/courses/CourseGrid";
import { EmptyState } from "@/components/shared/EmptyState";
import { getPublishedCourses, type CourseSort } from "@/lib/queries/course.queries";

export const metadata = { title: "Tất cả khóa học" };

// Catalog page should always reflect latest data (query depends on searchParams)
export const dynamic = "force-dynamic";

const SORT_VALUES: CourseSort[] = ["newest", "rating", "price-asc", "price-desc"];

type SearchParams = Promise<{ q?: string; category?: string; sort?: string }>;

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : undefined;
  const category = typeof sp.category === "string" ? sp.category.slice(0, 50) : undefined;
  const sort =
    typeof sp.sort === "string" && SORT_VALUES.includes(sp.sort as CourseSort)
      ? (sp.sort as CourseSort)
      : undefined;

  const courses = await getPublishedCourses({ q, category, sort });

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold">Khóa học</h1>
        <p className="text-muted-foreground mt-2">
          Khám phá tất cả khóa học hiện có trên Eduta
        </p>
      </div>

      <CatalogFilters />

      {courses.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Không tìm thấy khóa học"
          description="Thử tìm với từ khóa khác hoặc bỏ bộ lọc danh mục"
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Tìm thấy <strong>{courses.length}</strong> khóa học
          </p>
          <CourseGrid courses={courses} />
        </>
      )}
    </div>
  );
}
