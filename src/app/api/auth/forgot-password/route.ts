import { withApiHandler, ok } from "@/lib/apiHandler";
import { ForgotPasswordSchema } from "@/lib/validation/auth";
import { findUserByEmail } from "@/services/userService";
import { issueOtp } from "@/services/otpService";
import { sendOtpEmail } from "@/services/emailService";

export const runtime = "nodejs";

const GENERIC_MESSAGE = "If an account with that email exists, a reset code has been sent.";

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password-reset OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: jane@example.com }
 *     responses:
 *       200:
 *         description: Always returns the same generic message, regardless of whether the email exists
 *         content:
 *           application/json:
 *             example: { success: true, message: "If an account with that email exists, a reset code has been sent.", data: {} }
 */
export const POST = withApiHandler("[/api/auth/forgot-password] POST", async (req) => {
  const { email } = ForgotPasswordSchema.parse(await req.json());

  const user = await findUserByEmail(email);
  if (user) {
    // Swallow cooldown/rate-limit errors here too — surfacing them would let an
    // attacker distinguish "no account" from "account exists, resend too soon".
    try {
      const otp = await issueOtp(email, "ForgotPassword", user.id);
      await sendOtpEmail(email, otp, "ForgotPassword");
    } catch (err) {
      console.error("[/api/auth/forgot-password] issue/send failed", err);
    }
  }

  return ok({}, GENERIC_MESSAGE);
});
