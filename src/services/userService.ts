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
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    roles: [ROLE_NAME_MAP[user.role.name] ?? "customer"],
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
