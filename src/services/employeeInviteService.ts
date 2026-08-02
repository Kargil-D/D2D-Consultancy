import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { sendEmployeeInviteEmail } from "@/services/emailService";

const INVITE_TTL_HOURS = 72;

function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Admin action: emails a one-time link to the employee's officialEmail so they can set their own password. Never generates or stores a plaintext password on the Admin's behalf. */
export async function sendEmployeeInvite(employeeId: string, performedBy: string, siteUrl: string) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw new Error("Employee not found");
  if (!employee.officialEmail) throw new Error("Add an Official Email before sending an invite");
  if (employee.userId) throw new Error("This employee already has a linked login account");

  const existingUser = await prisma.user.findUnique({ where: { email: employee.officialEmail } });
  if (existingUser) throw new Error(`${employee.officialEmail} is already registered to another login — link the account instead of inviting`);

  // Superseding any previous unused invite keeps exactly one valid link per employee at a time.
  await prisma.employeeInvite.updateMany({
    where: { employeeId, isUsed: false },
    data: { isUsed: true },
  });

  const token = generateInviteToken();
  await prisma.employeeInvite.create({
    data: {
      employeeId,
      email: employee.officialEmail,
      tokenHash: hashInviteToken(token),
      expiresAt: new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000),
      createdBy: performedBy,
    },
  });

  const link = `${siteUrl}/employee-invite?token=${token}`;
  await sendEmployeeInviteEmail(employee.officialEmail, employee.fullName, link);

  return { email: employee.officialEmail, expiresInHours: INVITE_TTL_HOURS };
}

/** Public: resolves a raw invite token (from the emailed link) to its still-valid EmployeeInvite row, without consuming it — used to render the "set your password" page. */
export async function resolveEmployeeInvite(token: string) {
  const invite = await prisma.employeeInvite.findUnique({
    where: { tokenHash: hashInviteToken(token) },
    include: { employee: { select: { fullName: true, officialEmail: true, userId: true } } },
  });
  if (!invite || invite.isUsed || invite.expiresAt < new Date()) return null;
  if (invite.employee.userId) return null; // already completed via another path
  return invite;
}

/** Public: completes registration — creates the User (with the employee's own chosen password), links it to the Employee, and consumes the invite token. */
export async function acceptEmployeeInvite(token: string, password: string) {
  const invite = await resolveEmployeeInvite(token);
  if (!invite) throw new Error("This invite link is invalid, expired, or already used");

  const role = await prisma.role.findUniqueOrThrow({ where: { name: "Employee" } });
  const [firstName, ...rest] = invite.employee.fullName.trim().split(/\s+/);
  const lastName = rest.join(" ") || firstName;
  const passwordHash = await hashPassword(password);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        firstName,
        lastName,
        email: invite.email,
        passwordHash,
        isEmailVerified: true,
        isActive: true,
        role: { connect: { id: role.id } },
      },
    });
    await tx.employee.update({ where: { id: invite.employeeId }, data: { userId: user.id } });
    await tx.employeeInvite.update({ where: { id: invite.id }, data: { isUsed: true } });
    await tx.employeeAuditLog.create({
      data: { employeeId: invite.employeeId, action: "LINKED_ACCOUNT", field: "self-registered", performedBy: invite.email },
    });
    return user;
  });
}
