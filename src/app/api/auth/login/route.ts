import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { LoginSchema } from "@/lib/validation/auth";
import { verifyPassword } from "@/lib/password";
import { findUserByEmail, toPublicUser, updateLastLogin } from "@/services/userService";
import { issueTokenPair } from "@/services/tokenService";
import { setAuthCookies } from "@/lib/authCookies";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: jane@example.com }
 *               password: { type: string, example: "Str0ng!Pass" }
 *     responses:
 *       200:
 *         description: Logged in, session cookies set
 *         content:
 *           application/json:
 *             example: { success: true, message: "Logged in", data: { user: { id: "...", name: "Jane Doe", email: "jane@example.com", roles: ["customer"] } } }
 *       401:
 *         description: Invalid credentials, unverified email, or inactive account
 */
export const POST = withApiHandler("[/api/auth/login] POST", async (req) => {
  const { email, password } = LoginSchema.parse(await req.json());

  const user = await findUserByEmail(email);
  if (!user) throw new ApiError(401, "Invalid email or password");

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) throw new ApiError(401, "Invalid email or password");

  if (!user.isEmailVerified) {
    throw new ApiError(401, "Please verify your email before logging in");
  }
  if (!user.isActive) {
    throw new ApiError(401, "This account has been deactivated. Please contact support.");
  }

  await updateLastLogin(user.id);
  const { accessToken, refreshToken } = await issueTokenPair(user);

  const res = ok({ user: toPublicUser(user) }, "Logged in");
  setAuthCookies(res, accessToken, refreshToken);
  return res;
});
