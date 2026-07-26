import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { encryptSensitive, decryptSensitive } from "@/lib/crypto";
import { maskAadhaar, maskAccountNumber } from "@/lib/mask";
import type { Paginated } from "@/types/admin";
import type { Prisma } from "@/generated/prisma/client";
import type { EmployeeCreate, EmployeeUpdate } from "@/lib/validation/employee";

export interface ListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  filter?: Prisma.EmployeeWhereInput;
}

const MANAGER_SELECT = { id: true, fullName: true, designation: true } as const;

const EMPLOYEE_INCLUDE = {
  reportingManager: { select: MANAGER_SELECT },
  user: { select: { id: true, email: true, isActive: true, lastLogin: true, role: { select: { id: true, name: true, status: true } } } },
} satisfies Prisma.EmployeeInclude;

/** Strips ciphertext columns and replaces them with the masked display string — the only shape that should ever leave this service except via revealSensitiveField. */
function toMasked<T extends { aadhaarNumberEnc: string | null; aadhaarLast4: string | null; accountNumberEnc: string | null; accountLast4: string | null }>(
  row: T,
) {
  const { aadhaarNumberEnc: _a, accountNumberEnc: _b, ...rest } = row;
  void _a;
  void _b;
  return {
    ...rest,
    aadhaarNumberMasked: maskAadhaar(row.aadhaarLast4),
    accountNumberMasked: maskAccountNumber(row.accountLast4),
  };
}

export async function listEmployees(query: ListQuery = {}) {
  const { search = "", page = 1, pageSize = 10, filter = {} } = query;
  const where: Prisma.EmployeeWhereInput = { isDeleted: false, ...filter };

  if (search.trim()) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { employeeCode: { contains: search, mode: "insensitive" } },
      { designation: { contains: search, mode: "insensitive" } },
      { department: { contains: search, mode: "insensitive" } },
      { officialEmail: { contains: search, mode: "insensitive" } },
    ];
  }

  const total = await prisma.employee.count({ where });
  const items = await prisma.employee.findMany({
    where,
    include: EMPLOYEE_INCLUDE,
    orderBy: { createdDate: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { items: items.map(toMasked), total, page, pageSize } satisfies Paginated<ReturnType<typeof toMasked>>;
}

/** Unpaginated, Active-only — used by the Reporting Manager picker. */
export function listActiveEmployeesForPicker(excludeId?: string) {
  return prisma.employee.findMany({
    where: { isDeleted: false, status: "Active", ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true, fullName: true, designation: true, employeeCode: true },
    orderBy: { fullName: "asc" },
  });
}

export async function getEmployee(id: string) {
  const row = await prisma.employee.findUnique({ where: { id }, include: EMPLOYEE_INCLUDE });
  return row ? toMasked(row) : null;
}

function buildSensitiveWrites(input: { aadhaarNumber?: string; accountNumber?: string }) {
  const data: Record<string, string | null> = {};
  if (input.aadhaarNumber !== undefined) {
    data.aadhaarNumberEnc = encryptSensitive(input.aadhaarNumber);
    data.aadhaarLast4 = input.aadhaarNumber.slice(-4);
  }
  if (input.accountNumber !== undefined) {
    data.accountNumberEnc = encryptSensitive(input.accountNumber);
    data.accountLast4 = input.accountNumber.slice(-4);
  }
  return data;
}

async function logAudit(employeeId: string, action: string, performedBy: string, field?: string) {
  await prisma.employeeAuditLog.create({ data: { employeeId, action, field, performedBy } });
}

/** Employee Code is auto-generated from the row's own seq (D2D-1001, D2D-1002, …) — never client-supplied, same convention as the Employee ID badge (EMP-0001) shown next to it. */
export async function createEmployee(input: EmployeeCreate, createdBy: string) {
  const { aadhaarNumber, accountNumber, employeeCode: _ignoredCode, ...rest } = input;
  void _ignoredCode;
  const created = await prisma.employee.create({
    data: {
      ...rest,
      employeeCode: `PENDING-${crypto.randomUUID()}`,
      reportingManagerId: rest.reportingManagerId || null,
      ...buildSensitiveWrites({ aadhaarNumber, accountNumber }),
      createdBy,
      updatedBy: createdBy,
    },
  });
  const withCode = await prisma.employee.update({
    where: { id: created.id },
    data: { employeeCode: `D2D-${1000 + created.seq}` },
    include: EMPLOYEE_INCLUDE,
  });
  await logAudit(withCode.id, "CREATED", createdBy);
  return toMasked(withCode);
}

export async function updateEmployee(id: string, input: EmployeeUpdate, updatedBy: string) {
  const { aadhaarNumber, accountNumber, employeeCode: _ignoredCode, ...rest } = input;
  void _ignoredCode;
  const data: Prisma.EmployeeUpdateInput = { updatedBy };
  for (const [key, value] of Object.entries(rest)) {
    if (value === undefined) continue;
    (data as Record<string, unknown>)[key] = key === "reportingManagerId" ? value || null : value;
  }
  Object.assign(data, buildSensitiveWrites({ aadhaarNumber, accountNumber }));

  const updated = await prisma.employee.update({ where: { id }, data, include: EMPLOYEE_INCLUDE });

  const changedFields = Object.keys(rest).filter((k) => (rest as Record<string, unknown>)[k] !== undefined);
  if (changedFields.length > 0) await logAudit(id, "UPDATED", updatedBy, changedFields.join(", "));
  if (aadhaarNumber !== undefined) await logAudit(id, "UPDATED_SENSITIVE", updatedBy, "aadhaarNumber");
  if (accountNumber !== undefined) await logAudit(id, "UPDATED_SENSITIVE", updatedBy, "accountNumber");

  return toMasked(updated);
}

export async function removeEmployee(id: string, performedBy: string) {
  const removed = await prisma.employee.update({ where: { id }, data: { isDeleted: true } });
  await logAudit(id, "DELETED", performedBy);
  return removed;
}

export async function toggleEmployeeStatus(id: string, updatedBy: string) {
  const current = await prisma.employee.findUnique({ where: { id } });
  if (!current) return null;
  const next = current.status === "Active" ? "Inactive" : "Active";
  const updated = await prisma.employee.update({ where: { id }, data: { status: next, updatedBy }, include: EMPLOYEE_INCLUDE });
  return toMasked(updated);
}

/** Decrypts one sensitive field for display — the only path in the app that ever returns plaintext Aadhaar/bank account numbers. Caller must already have checked the requesting user's role. */
export async function revealSensitiveField(id: string, field: "aadhaarNumber" | "accountNumber", performedBy: string) {
  const row = await prisma.employee.findUnique({
    where: { id },
    select: { aadhaarNumberEnc: true, accountNumberEnc: true },
  });
  if (!row) return null;

  const ciphertext = field === "aadhaarNumber" ? row.aadhaarNumberEnc : row.accountNumberEnc;
  if (!ciphertext) return "";

  await logAudit(id, "VIEWED_SENSITIVE", performedBy, field);
  return decryptSensitive(ciphertext);
}

export function listAuditLogs(employeeId: string) {
  return prisma.employeeAuditLog.findMany({
    where: { employeeId },
    orderBy: { performedAt: "desc" },
    take: 200,
  });
}

/** Links this Employee HR record to an existing login User by email — does not create new User accounts (that's a separate, not-yet-built invite flow). */
export async function linkEmployeeToUser(id: string, email: string, performedBy: string) {
  const user = await prisma.user.findUnique({ where: { email }, include: { employee: true } });
  if (!user) throw new Error(`No login account found for ${email}`);
  if (user.employee && user.employee.id !== id) throw new Error(`${email} is already linked to another employee`);

  const updated = await prisma.employee.update({ where: { id }, data: { userId: user.id }, include: EMPLOYEE_INCLUDE });
  await logAudit(id, "LINKED_ACCOUNT", performedBy, email);
  return toMasked(updated);
}

export async function unlinkEmployeeUser(id: string, performedBy: string) {
  const updated = await prisma.employee.update({ where: { id }, data: { userId: null }, include: EMPLOYEE_INCLUDE });
  await logAudit(id, "UNLINKED_ACCOUNT", performedBy);
  return toMasked(updated);
}

/** Sets the Role on the Employee's linked User — this is the real, enforced permission grant (see getCurrentUser), not a label. Requires the employee to already be linked to a login account. */
export async function assignEmployeeRole(id: string, roleId: string, performedBy: string) {
  const employee = await prisma.employee.findUnique({ where: { id }, select: { userId: true } });
  if (!employee?.userId) throw new Error("Link this employee to a login account before assigning a role");

  await prisma.user.update({ where: { id: employee.userId }, data: { roleId } });
  const updated = await prisma.employee.findUniqueOrThrow({ where: { id }, include: EMPLOYEE_INCLUDE });
  await logAudit(id, "ROLE_ASSIGNED", performedBy, roleId);
  return toMasked(updated);
}
