import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { VerifyEmailSchema } from "@/lib/validation/auth";
import { verifyOtp } from "@/services/otpService";
import { findUserByEmail, toPublicUser } from "@/services/userService";
import { activateUserAndConsumeOtp } from "@/services/authTransactions";
import { issueTokenPair } from "@/services/tokenService";
import { sendWelcomeEmail } from "@/services/emailService";
import { setAuthCookies } from "@/lib/authCookies";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify the registration OTP and activate the account (auto-login on success)
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
 *         description: Account activated, session cookies set
 *         content:
 *           application/json:
 *             example: { success: true, message: "Email verified", data: { user: { id: "...", name: "Jane Doe", email: "jane@example.com", roles: ["customer"] } } }
 *       400:
 *         description: Invalid, expired, or already-used OTP
 */
export const POST = withApiHandler("[/api/auth/verify-email] POST", async (req) => {
  const { email, otp } = VerifyEmailSchema.parse(await req.json());

  const user = await findUserByEmail(email);
  if (!user) throw new ApiError(400, "No account found for this email");

  const record = await verifyOtp(email, otp, "Registration");
  const activated = await activateUserAndConsumeOtp(user.id, record.id);

  await sendWelcomeEmail(activated.email, activated.firstName).catch((err) =>
    console.error("[/api/auth/verify-email] welcome email failed", err),
  );

  const { accessToken, refreshToken } = await issueTokenPair(activated);

  const res = ok({ user: toPublicUser(activated) }, "Email verified");
  setAuthCookies(res, accessToken, refreshToken);
  return res;
});
