import { PrismaClient } from "./src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL!) });

async function main() {
  const user = await prisma.user.findUnique({ where: { email: "davidsalamon2202@gmail.com" }, include: { role: true } });
  console.log("Admin exists:", !!user, user ? { role: user.role.name, active: user.isActive } : null);

  const employee = user ? await prisma.employee.findFirst({ where: { userId: user.id } }) : null;
  console.log("Linked employee:", employee?.employeeCode, employee?.fullName);
}
main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
