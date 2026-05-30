import "server-only";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type CourseSort = "newest" | "rating" | "price-asc" | "price-desc";

/** Giới hạn số khóa trả về cho catalog để truy vấn không phình theo dữ liệu. */
const CATALOG_LIMIT = 60;
/** Thời gian cache (giây) cho danh sách khóa học công khai. */
const COURSE_LIST_TTL = 60;

type ListFilter = {
  q?: string;
  category?: string;
  sort?: CourseSort;
};

function buildOrderBy(sort?: CourseSort): Prisma.CourseOrderByWithRelationInput[] {
  switch (sort) {
    case "rating":
      return [{ avgRating: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }];
    case "price-asc":
      return [{ price: "asc" }, { createdAt: "desc" }];
    case "price-desc":
      return [{ price: "desc" }, { createdAt: "desc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }];
  }
}

export async function getPublishedCourses(filter: ListFilter = {}) {
  // Cache theo bộ lọc; làm tươi sau COURSE_LIST_TTL hoặc khi revalidateTag("courses").
  const cached = unstable_cache(
    async (f: ListFilter) =>
      db.course.findMany({
        where: {
          status: "APPROVED",
          ...(f.q
            ? {
                OR: [
                  { title: { contains: f.q } },
                  { description: { contains: f.q } },
                ],
              }
            : {}),
          ...(f.category ? { category: f.category } : {}),
        },
        orderBy: buildOrderBy(f.sort),
        take: CATALOG_LIMIT,
        include: {
          _count: { select: { modules: true, enrollments: true } },
        },
      }),
    ["published-courses", filter.q ?? "", filter.category ?? "", filter.sort ?? "newest"],
    { revalidate: COURSE_LIST_TTL, tags: ["courses"] }
  );
  return cached(filter);
}

export const getFeaturedCourses = unstable_cache(
  async (take = 3) =>
    db.course.findMany({
      where: {
        status: "APPROVED",
        modules: { some: { lessons: { some: {} } } },
      },
      orderBy: [{ enrollments: { _count: "desc" } }, { createdAt: "desc" }],
      take,
      include: {
        _count: { select: { modules: true, enrollments: true } },
      },
    }),
  ["featured-courses"],
  { revalidate: COURSE_LIST_TTL, tags: ["courses"] }
);

export async function getCourseBySlug(slug: string) {
  return db.course.findUnique({
    where: { slug },
    include: {
      instructor: { select: { id: true, name: true } },
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              order: true,
              quiz: { select: { id: true } },
            },
          },
        },
      },
      _count: { select: { enrollments: true } },
    },
  });
}

export async function getFirstLessonId(courseId: string): Promise<string | null> {
  const first = await db.lesson.findFirst({
    where: { module: { courseId } },
    orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
    select: { id: true },
  });
  return first?.id ?? null;
}

export async function isUserEnrolled(userId: string, courseId: string): Promise<boolean> {
  const found = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true },
  });
  return !!found;
}
