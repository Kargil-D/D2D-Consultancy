import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL environment variable");
}

declare global {
  var prisma: PrismaClient | undefined;
}

// Instantiate only when no cached client exists — the old unconditional `new PrismaClient()`
// opened a fresh connection pool on every dev hot-reload and immediately abandoned it.
export const prisma =
  global.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export default prisma;
