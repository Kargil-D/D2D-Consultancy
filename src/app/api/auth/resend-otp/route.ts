import { withApiHandler, ok } from "@/lib/apiHandler";
import { ResendOtpSchema } from "@/lib/validation/auth";
import { findUserByEmail } from "@/services/userService";
import { issueOtp } from "@/services/otpService";
import { sendOtpEmail } from "@/services/emailService";

export const runtime = "nodejs";

const GENERIC_MESSAGE = "If an account matches, a new code has been sent.";

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend a registration or password-reset OTP (60s cooldown)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, purpose]
 *             properties:
 *               email: { type: string, example: jane@example.com }
 *               purpose: { type: string, enum: [Registration, ForgotPassword], example: Registration }
 *     responses:
 *       200:
 *         description: OTP re-sent (or generic message for ForgotPassword to avoid leaking account existence)
 *       429:
 *         description: Resend requested before the 60s cooldown elapsed
 */
export const POST = withApiHandler("[/api/auth/resend-otp] POST", async (req) => {
  const { email, purpose } = ResendOtpSchema.parse(await req.json());

  const user = await findUserByEmail(email);

  if (purpose === "ForgotPassword") {
    // Never reveal whether the email exists — including via cooldown/rate-limit errors.
    if (user) {
      try {
        const otp = await issueOtp(email, purpose, user.id);
        await sendOtpEmail(email, otp, purpose);
      } catch (err) {
        console.error("[/api/auth/resend-otp] issue/send failed", err);
      }
    }
    return ok({}, GENERIC_MESSAGE);
  }

  // Registration purpose: only meaningful for an existing, unverified account.
  if (!user || user.isEmailVerified) {
    return ok({}, "If an unverified account matches, a new code has been sent.");
  }

  const otp = await issueOtp(email, purpose, user.id);
  await sendOtpEmail(email, otp, purpose).catch((err) =>
    console.error("[/api/auth/resend-otp] OTP email failed", err),
  );
  return ok({}, "A new code has been sent.");
});
