import type { AuthResponse, LoginPayload } from "@/types/auth";

/**
 * Authentication service.
 *
 * Currently uses a mocked implementation so the UI is fully functional.
 * Swap the `mockLogin` body with a real `fetch("/api/auth/login", …)`
 * against the .NET API when ready — the request/response shapes already
 * match the contract documented in PROJECT_CONTEXT.md.
 */

const USE_MOCK = true;

async function mockLogin(payload: LoginPayload): Promise<AuthResponse> {
  await new Promise((r) => setTimeout(r, 900));

  // Reject any password shorter than 4 chars for demo purposes.
  if (!payload.password || payload.password.length < 4) {
    throw new Error("Invalid email or password.");
  }

  const name = payload.email.split("@")[0] || "Traveller";
  return {
    token: `mock.jwt.${Date.now()}`,
    refreshToken: `mock.refresh.${Date.now()}`,
    expiresIn: 3600,
    user: {
      id: `u-${Date.now()}`,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email: payload.email,
      roles: payload.email.endsWith("@d2dholidays.com") ? ["admin"] : ["customer"],
    },
  };
}

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  if (USE_MOCK) return mockLogin(payload);

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message ?? "Login failed. Please try again.");
  }
  return data.data as AuthResponse;
}

export async function socialLoginApi(
  provider: "google" | "facebook",
): Promise<AuthResponse> {
  // Real implementation would redirect to OAuth flow and exchange the token.
  await new Promise((r) => setTimeout(r, 700));
  return {
    token: `mock.${provider}.${Date.now()}`,
    refreshToken: `mock.${provider}.refresh.${Date.now()}`,
    expiresIn: 3600,
    user: {
      id: `u-${provider}-${Date.now()}`,
      name: provider === "google" ? "Google User" : "Facebook User",
      email: `${provider}.user@example.com`,
      roles: ["customer"],
    },
  };
}
