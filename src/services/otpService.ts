import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/apiError";
import {
  generateOtp,
  hashOtp,
  verifyOtpHash,
  OTP_EXPIRY_MINUTES,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_MAX_ATTEMPTS,
} from "@/lib/otp";
import type { OtpPurpose } from "@/generated/prisma/client";

export async function issueOtp(email: string, purpose: OtpPurpose, userId?: string): Promise<string> {
  const latest = await prisma.emailOtp.findFirst({
    where: { email, purpose },
    orderBy: { createdAt: "desc" },
  });

  if (latest && !latest.isUsed) {
    const secondsSinceLast = (Date.now() - latest.createdAt.getTime()) / 1000;
    if (secondsSinceLast < OTP_RESEND_COOLDOWN_SECONDS) {
      const wait = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLast);
      throw new ApiError(429, `Please wait ${wait}s before requesting another code`);
    }
    await prisma.emailOtp.update({ where: { id: latest.id }, data: { isUsed: true } });
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60_000);
  await prisma.emailOtp.create({
    data: { email, userId, purpose, otpHash: hashOtp(otp), expiresAt },
  });

  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV ONLY] OTP for ${email} (${purpose}): ${otp}`);
  }

  return otp;
}

/** Validates the latest unused OTP for email+purpose. Does NOT mark it used — callers decide when. */
export async function verifyOtp(email: string, otp: string, purpose: OtpPurpose) {
  const record = await prisma.emailOtp.findFirst({
    where: { email, purpose, isUsed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!record) throw new ApiError(400, "No active code found. Please request a new one.");
  if (record.expiresAt < new Date()) throw new ApiError(400, "Code expired. Please request a new one.");
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.emailOtp.update({ where: { id: record.id }, data: { isUsed: true } });
    throw new ApiError(400, "Too many incorrect attempts. Please request a new code.");
  }

  if (!verifyOtpHash(otp, record.otpHash)) {
    await prisma.emailOtp.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    throw new ApiError(400, "Incorrect code");
  }

  return record;
}

export async function consumeOtp(id: string) {
  await prisma.emailOtp.update({ where: { id }, data: { isUsed: true } });
}

export async function findValidOtpById(id: string, email: string, purpose: OtpPurpose) {
  const record = await prisma.emailOtp.findUnique({ where: { id } });
  if (!record || record.email !== email || record.purpose !== purpose || record.isUsed || record.expiresAt < new Date()) {
    return null;
  }
  return record;
}
