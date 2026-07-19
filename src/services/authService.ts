import { apiClient } from "@/lib/apiClient";
import type { LoginPayload, User } from "@/types/auth";

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  confirmPassword: string;
}

export type OtpPurpose = "Registration" | "ForgotPassword";

export function registerApi(payload: RegisterPayload) {
  return apiClient.post<{ email: string }>("/api/auth/register", payload);
}

export function verifyEmailApi(email: string, otp: string) {
  return apiClient.post<{ user: User }>("/api/auth/verify-email", { email, otp });
}

export function resendOtpApi(email: string, purpose: OtpPurpose) {
  return apiClient.post<Record<string, never>>("/api/auth/resend-otp", { email, purpose });
}

export function loginApi(payload: LoginPayload): Promise<{ user: User }> {
  return apiClient.post<{ user: User }>("/api/auth/login", {
    email: payload.email,
    password: payload.password,
  });
}

export function forgotPasswordApi(email: string) {
  return apiClient.post<Record<string, never>>("/api/auth/forgot-password", { email });
}

export function verifyResetOtpApi(email: string, otp: string) {
  return apiClient.post<{ resetTicket: string }>("/api/auth/verify-reset-otp", { email, otp });
}

export function resetPasswordApi(resetTicket: string, newPassword: string, confirmPassword: string) {
  return apiClient.post<Record<string, never>>("/api/auth/reset-password", {
    resetTicket,
    newPassword,
    confirmPassword,
  });
}

export function meApi() {
  return apiClient.get<{ user: User }>("/api/auth/me");
}

/** Rotates the refresh token cookie into a fresh access token — keeps the session alive past the 15-minute access-token TTL. */
export function refreshSessionApi() {
  return apiClient.post<Record<string, never>>("/api/auth/refresh");
}

export function logoutApi() {
  return apiClient.post<Record<string, never>>("/api/auth/logout");
}

/**
 * Social login/OAuth is not part of this auth module — kept mocked so the
 * existing SocialLoginButtons UI doesn't break.
 */
export async function socialLoginApi(provider: "google" | "facebook"): Promise<{ user: User }> {
  await new Promise((r) => setTimeout(r, 700));
  return {
    user: {
      id: `u-${provider}-${Date.now()}`,
      name: provider === "google" ? "Google User" : "Facebook User",
      email: `${provider}.user@example.com`,
      roles: ["customer"],
    },
  };
}
