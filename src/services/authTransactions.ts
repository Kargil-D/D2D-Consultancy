import { prisma } from "@/lib/prisma";
import { generateOtp, hashOtp, OTP_EXPIRY_MINUTES } from "@/lib/otp";
import type { Prisma } from "@/generated/prisma/client";

/** New-user creation + first OTP must land together or not at all. */
export async function registerUserWithOtp(userData: Prisma.UserCreateInput) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: userData, include: { role: true } });
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60_000);
    await tx.emailOtp.create({
      data: { userId: user.id, email: user.email, purpose: "Registration", otpHash: hashOtp(otp), expiresAt },
    });
    return { user, otp };
  }).then((result) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV ONLY] OTP for ${result.user.email} (Registration): ${result.otp}`);
    }
    return result;
  });
}

/** Marking the account verified and burning the OTP must be atomic — otherwise a retry could reuse the code. */
export async function activateUserAndConsumeOtp(userId: string, otpId: string) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { isEmailVerified: true, isActive: true },
      include: { role: true },
    });
    await tx.emailOtp.update({ where: { id: otpId }, data: { isUsed: true } });
    return user;
  });
}

/** Same reasoning as above — password change and OTP consumption must succeed or fail together. */
export async function resetPasswordAndConsumeOtp(userId: string, otpId: string, passwordHash: string) {
  return prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { passwordHash } });
    await tx.emailOtp.update({ where: { id: otpId }, data: { isUsed: true } });
  });
}
