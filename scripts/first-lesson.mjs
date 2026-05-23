import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const l = await db.lesson.findFirst({
  where: { module: { course: { slug: "tieng-anh-10-global-success-unit-1-3" } } },
  orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
  select: { id: true },
});
console.log(l?.id ?? "");
await db.$disconnect();
