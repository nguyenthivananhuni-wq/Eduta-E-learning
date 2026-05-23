import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const c = await db.course.findUnique({
  where: { slug: "tieng-anh-10-global-success-unit-1-3" },
  select: { id: true },
});
console.log(c?.id ?? "");
await db.$disconnect();
