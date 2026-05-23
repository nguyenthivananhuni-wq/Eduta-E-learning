import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const result = await db.recommendationCache.deleteMany();
console.log(`Deleted ${result.count} rows`);
await db.$disconnect();
