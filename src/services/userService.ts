import { prisma } from "@/lib/prisma";
import type { Prisma, User as UserModel, Role } from "@/generated/prisma/client";
import type { User, UserRole } from "@/types/auth";

export const CUSTOMER_ROLE_NAME = "Customer";

const ROLE_NAME_MAP: Record<string, UserRole> = {
  Admin: "admin",
  Employee: "consultant",
  Customer: "customer",
};

export function toPublicUser(user: UserModel & { role: Role }): User {
  // Only an exact "Customer" role name maps to "customer" — any other role (Admin, Employee,
  // Sales, BookingExecutive, CustomerSupport, or a custom Role created via /admin/roles) is
  // staff and must not fall through to "customer" here, since /admin/login relies on this to
  // tell staff accounts apart from customer accounts.
  const roles: UserRole[] = user.role.name === CUSTOMER_ROLE_NAME ? ["customer"] : [ROLE_NAME_MAP[user.role.name] ?? "consultant"];
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    roles,
  };
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email }, include: { role: true } });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id }, include: { role: true } });
}

export async function getCustomerRoleId(): Promise<string> {
  const role = await prisma.role.findUnique({ where: { name: CUSTOMER_ROLE_NAME } });
  if (!role) throw new Error(`Role "${CUSTOMER_ROLE_NAME}" is not seeded`);
  return role.id;
}

export function createUser(data: Prisma.UserCreateInput) {
  return prisma.user.create({ data, include: { role: true } });
}

export function updateUser(id: string, data: Prisma.UserUpdateInput) {
  return prisma.user.update({ where: { id }, data });
}

export function activateUser(id: string) {
  return prisma.user.update({ where: { id }, data: { isEmailVerified: true, isActive: true } });
}

export function updateLastLogin(id: string) {
  return prisma.user.update({ where: { id }, data: { lastLogin: new Date() } });
}

export function updatePasswordHash(id: string, passwordHash: string) {
  return prisma.user.update({ where: { id }, data: { passwordHash } });
}

export function listUsersByRole(roleName: string) {
  return prisma.user.findMany({
    where: { role: { name: roleName }, isActive: true },
    select: { id: true, firstName: true, lastName: true, email: true },
    orderBy: { firstName: "asc" },
  });
}

export function updateOwnProfile(
  id: string,
  data: { firstName: string; lastName: string; phoneNumber: string | null },
) {
  return prisma.user.update({
    where: { id },
    data,
    include: { role: true },
  });
}
