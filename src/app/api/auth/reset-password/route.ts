import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { ResetPasswordSchema } from "@/lib/validation/auth";
import { verifyResetTicket } from "@/lib/jwt";
import { findValidOtpById } from "@/services/otpService";
import { findUserByEmail } from "@/services/userService";
import { resetPasswordAndConsumeOtp } from "@/services/authTransactions";
import { hashPassword } from "@/lib/password";
import { sendPasswordResetConfirmationEmail } from "@/services/emailService";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Set a new password using a reset ticket from /api/auth/verify-reset-otp
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resetTicket, newPassword, confirmPassword]
 *             properties:
 *               resetTicket: { type: string, example: "eyJhbGciOi..." }
 *               newPassword: { type: string, example: "N3wStr0ng!Pass" }
 *               confirmPassword: { type: string, example: "N3wStr0ng!Pass" }
 *     responses:
 *       200:
 *         description: Password updated
 *       400:
 *         description: Reset ticket expired/invalid, or the underlying OTP was already consumed
 */
export const POST = withApiHandler("[/api/auth/reset-password] POST", async (req) => {
  const { resetTicket, newPassword } = ResetPasswordSchema.parse(await req.json());

  const { sub: otpId, email } = await verifyResetTicket(resetTicket);

  // Defense in depth: re-check the OTP row is still valid even though the ticket itself is signed.
  const record = await findValidOtpById(otpId, email, "ForgotPassword");
  if (!record) throw new ApiError(400, "Reset code already used or expired. Please start over.");

  const user = await findUserByEmail(email);
  if (!user) throw new ApiError(400, "Account not found");

  const passwordHash = await hashPassword(newPassword);
  await resetPasswordAndConsumeOtp(user.id, record.id, passwordHash);

  await sendPasswordResetConfirmationEmail(email).catch((err) =>
    console.error("[/api/auth/reset-password] confirmation email failed", err),
  );

  return ok({}, "Password updated. You can now log in.");
});
