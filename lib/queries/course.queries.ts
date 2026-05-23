import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type CourseSort = "newest" | "rating" | "price-asc" | "price-desc";

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
  return db.course.findMany({
    where: {
      status: "APPROVED",
      ...(filter.q
        ? {
            OR: [
              { title: { contains: filter.q } },
              { description: { contains: filter.q } },
            ],
          }
        : {}),
      ...(filter.category ? { category: filter.category } : {}),
    },
    orderBy: buildOrderBy(filter.sort),
    include: {
      _count: { select: { modules: true, enrollments: true } },
    },
  });
}

export async function getFeaturedCourses(take = 3) {
  return db.course.findMany({
    where: {
      status: "APPROVED",
      modules: { some: { lessons: { some: {} } } },
    },
    orderBy: [{ enrollments: { _count: "desc" } }, { createdAt: "desc" }],
    take,
    include: {
      _count: { select: { modules: true, enrollments: true } },
    },
  });
}

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
