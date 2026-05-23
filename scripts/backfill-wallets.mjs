// One-shot: ensure every user has a Wallet row (idempotent).
// Run: node scripts/backfill-wallets.mjs
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const users = await db.user.findMany({
  where: { wallet: null },
  select: { id: true, email: true },
});

console.log(`Found ${users.length} users without wallet`);

for (const u of users) {
  await db.wallet.create({ data: { userId: u.id, balance: 0 } });
  console.log(`  + wallet for ${u.email}`);
}

await db.$disconnect();
console.log("Done.");
