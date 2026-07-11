import { z } from "zod";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(
    PASSWORD_REGEX,
    "Password must include an uppercase letter, a lowercase letter, a digit, and a special character",
  );

const otpField = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code");

export const RegisterSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    phoneNumber: z.string().trim().min(7, "Enter a valid phone number").optional(),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const OtpPurposeSchema = z.enum(["Registration", "ForgotPassword"]);

export const VerifyEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  otp: otpField,
});

export const ResendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  purpose: OtpPurposeSchema,
});

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const VerifyResetOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  otp: otpField,
});

export const ResetPasswordSchema = z
  .object({
    resetTicket: z.string().min(1),
    newPassword: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
export type ResendOtpInput = z.infer<typeof ResendOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type VerifyResetOtpInput = z.infer<typeof VerifyResetOtpSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
