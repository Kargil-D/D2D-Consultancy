import { prisma } from "@/lib/prisma";
import type { Paginated } from "@/types/admin";
import type { Prisma } from "@/generated/prisma/client";
import type { RoleCreate, RoleUpdate } from "@/lib/validation/role";

export interface ListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  filter?: Prisma.RoleWhereInput;
}

const ROLE_INCLUDE = { permissions: true } satisfies Prisma.RoleInclude;

export async function listRoles(query: ListQuery = {}) {
  const { search = "", page = 1, pageSize = 10, filter = {} } = query;
  const where: Prisma.RoleWhereInput = { ...filter };

  if (search.trim()) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const total = await prisma.role.count({ where });
  const items = await prisma.role.findMany({
    where,
    include: ROLE_INCLUDE,
    orderBy: { name: "asc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { items, total, page, pageSize } satisfies Paginated<(typeof items)[number]>;
}

/** Unpaginated, Active-only — used by the Employee screen's "Assign Role" picker. */
export function listActiveRolesForPicker() {
  return prisma.role.findMany({
    where: { status: "Active" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export function getRole(id: string) {
  return prisma.role.findUnique({ where: { id }, include: ROLE_INCLUDE });
}

async function replacePermissions(tx: Prisma.TransactionClient, roleId: string, permissions: RoleCreate["permissions"]) {
  if (!permissions) return;
  await tx.rolePermission.deleteMany({ where: { roleId } });
  if (permissions.length === 0) return;
  await tx.rolePermission.createMany({
    data: permissions.map((p) => ({ roleId, ...p })),
  });
}

export async function createRole(input: RoleCreate) {
  return prisma.$transaction(async (tx) => {
    const role = await tx.role.create({
      data: { name: input.name, description: input.description, status: input.status },
    });
    await replacePermissions(tx, role.id, input.permissions);
    return tx.role.findUniqueOrThrow({ where: { id: role.id }, include: ROLE_INCLUDE });
  });
}

export async function updateRole(id: string, input: RoleUpdate) {
  return prisma.$transaction(async (tx) => {
    await tx.role.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.status !== undefined && { status: input.status }),
      },
    });
    if (input.permissions !== undefined) await replacePermissions(tx, id, input.permissions);
    return tx.role.findUniqueOrThrow({ where: { id }, include: ROLE_INCLUDE });
  });
}

/** Blocked if any User still holds this role — reassign them first (mirrors the FK, but with a clearer message). */
export async function removeRole(id: string) {
  const usersWithRole = await prisma.user.count({ where: { roleId: id } });
  if (usersWithRole > 0) {
    throw new Error(`${usersWithRole} user(s) still have this role assigned — reassign them before deleting it.`);
  }
  return prisma.role.delete({ where: { id } });
}

export async function toggleRoleStatus(id: string) {
  const current = await prisma.role.findUnique({ where: { id } });
  if (!current) return null;
  const next = current.status === "Active" ? "Inactive" : "Active";
  return prisma.role.update({ where: { id }, data: { status: next }, include: ROLE_INCLUDE });
}
