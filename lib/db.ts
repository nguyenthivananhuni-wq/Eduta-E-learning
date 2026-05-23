import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrisma(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const isTurso = url.startsWith("libsql:") || url.startsWith("https:");

  if (isTurso) {
    // Production / preview — Turso libSQL via HTTP
    const adapter = new PrismaLibSQL({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  // Local dev — file SQLite via default engine
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
