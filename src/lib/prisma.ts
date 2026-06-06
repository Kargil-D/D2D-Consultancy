import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL environment variable");
}

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClient = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL),
});

export const prisma = global.prisma ?? prismaClient;

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export default prisma;
