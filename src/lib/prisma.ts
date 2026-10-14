import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL environment variable");
}

function createClient(url: string) {
  return new PrismaClient({
    adapter: new PrismaPg(url),
    // Booking.quotationSyncSnapshot carries the quotation's margin % and item costs. Omitted from every
    // query by default so no route that returns a booking row (admin list, customer account, …) can
    // leak it — the quotation-change check opts back in with `omit: { quotationSyncSnapshot: false }`.
    omit: { booking: { quotationSyncSnapshot: true } },
  });
}

declare global {
  var prisma: ReturnType<typeof createClient> | undefined;
}

// Instantiate only when no cached client exists — the old unconditional `new PrismaClient()`
// opened a fresh connection pool on every dev hot-reload and immediately abandoned it.
export const prisma = global.prisma ?? createClient(process.env.DATABASE_URL);

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export default prisma;
