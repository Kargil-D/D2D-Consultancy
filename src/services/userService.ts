import { prisma } from "@/lib/prisma";
import { AdminModule } from "@/generated/prisma/client";
import type { Prisma, User as UserModel, Role, RolePermission } from "@/generated/prisma/client";
import type { User, UserRole } from "@/types/auth";

export const CUSTOMER_ROLE_NAME = "Customer";
const ADMIN_ROLE_NAME = "Admin";

const ROLE_NAME_MAP: Record<string, UserRole> = {
  Admin: "admin",
  Employee: "consultant",
  Customer: "customer",
};

const ALL_MODULES = Object.values(AdminModule);

/** Admin bypasses the matrix entirely (super-user); everyone else gets exactly what their role's RolePermission rows grant, defaulting to no access for modules with no row. */
function buildPermissionMap(user: { role: { name: string; permissions: RolePermission[] } }): User["permissions"] {
  const isAdmin = user.role.name === ADMIN_ROLE_NAME;
  const byModule = new Map(user.role.permissions.map((p) => [p.module, p]));
  return Object.fromEntries(
    ALL_MODULES.map((module) => {
      const p = byModule.get(module);
      return [
        module,
        {
          canView: isAdmin || !!p?.canView,
          canAdd: isAdmin || !!p?.canAdd,
          canEdit: isAdmin || !!p?.canEdit,
          canDelete: isAdmin || !!p?.canDelete,
        },
      ];
    }),
  ) as User["permissions"];
}

export function toPublicUser(user: UserModel & { role: Role & { permissions: RolePermission[] } }): User {
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
    permissions: roles[0] === "customer" ? undefined : buildPermissionMap(user),
  };
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email }, include: { role: { include: { permissions: true } } } });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id }, include: { role: { include: { permissions: true } } } });
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
