import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { RegisterSchema } from "@/lib/validation/auth";
import { hashPassword } from "@/lib/password";
import { findUserByEmail, getCustomerRoleId, updateUser } from "@/services/userService";
import { registerUserWithOtp } from "@/services/authTransactions";
import { issueOtp } from "@/services/otpService";
import { sendOtpEmail } from "@/services/emailService";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new customer account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password, confirmPassword]
 *             properties:
 *               firstName: { type: string, example: Jane }
 *               lastName: { type: string, example: Doe }
 *               email: { type: string, example: jane@example.com }
 *               phoneNumber: { type: string, example: "+919876543210" }
 *               password: { type: string, example: "Str0ng!Pass" }
 *               confirmPassword: { type: string, example: "Str0ng!Pass" }
 *     responses:
 *       200:
 *         description: OTP sent to the registered email
 *         content:
 *           application/json:
 *             example: { success: true, message: "OTP sent", data: { email: "jane@example.com" } }
 *       409:
 *         description: Email already registered and verified
 */
export const POST = withApiHandler("[/api/auth/register] POST", async (req) => {
  const payload = RegisterSchema.parse(await req.json());

  const existing = await findUserByEmail(payload.email);

  if (existing?.isEmailVerified) {
    throw new ApiError(409, "This email is already registered. Please log in.");
  }

  if (existing) {
    // Unverified stub from a prior incomplete signup — refresh their details and resend a code.
    const passwordHash = await hashPassword(payload.password);
    await updateUser(existing.id, {
      firstName: payload.firstName,
      lastName: payload.lastName,
      phoneNumber: payload.phoneNumber,
      passwordHash,
    });
    const otp = await issueOtp(payload.email, "Registration", existing.id);
    // The user + OTP are already committed — a transient email-send failure
    // shouldn't fail the whole request (the dev-only console log still has the code).
    await sendOtpEmail(payload.email, otp, "Registration").catch((err) =>
      console.error("[/api/auth/register] OTP email failed", err),
    );
    return ok({ email: payload.email }, "OTP sent");
  }

  const passwordHash = await hashPassword(payload.password);
  const roleId = await getCustomerRoleId();

  const { otp } = await registerUserWithOtp({
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    phoneNumber: payload.phoneNumber,
    passwordHash,
    role: { connect: { id: roleId } },
  });

  await sendOtpEmail(payload.email, otp, "Registration").catch((err) =>
    console.error("[/api/auth/register] OTP email failed", err),
  );

  return ok({ email: payload.email }, "OTP sent");
});
