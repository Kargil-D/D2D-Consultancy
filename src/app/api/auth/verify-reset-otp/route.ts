import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { VerifyResetOtpSchema } from "@/lib/validation/auth";
import { verifyOtp } from "@/services/otpService";
import { findUserByEmail } from "@/services/userService";
import { signResetTicket } from "@/lib/jwt";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/auth/verify-reset-otp:
 *   post:
 *     summary: Verify a password-reset OTP and receive a short-lived reset ticket
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email: { type: string, example: jane@example.com }
 *               otp: { type: string, example: "123456" }
 *     responses:
 *       200:
 *         description: OTP valid — returns a 5-minute reset ticket to use with /api/auth/reset-password
 *         content:
 *           application/json:
 *             example: { success: true, message: "Code verified", data: { resetTicket: "eyJhbGciOi..." } }
 *       400:
 *         description: Invalid, expired, or already-used OTP
 */
export const POST = withApiHandler("[/api/auth/verify-reset-otp] POST", async (req) => {
  const { email, otp } = VerifyResetOtpSchema.parse(await req.json());

  const user = await findUserByEmail(email);
  if (!user) throw new ApiError(400, "Incorrect code");

  // Verifies correctness/expiry/attempts WITHOUT marking the OTP used — that
  // happens in /api/auth/reset-password once the new password is actually set,
  // so a user can reload this step without burning their code.
  const record = await verifyOtp(email, otp, "ForgotPassword");

  const resetTicket = await signResetTicket({ sub: record.id, email });

  return ok({ resetTicket }, "Code verified");
});
