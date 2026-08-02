import { z } from "zod";
import { passwordField } from "@/lib/validation/auth";

export const EmployeeInviteAcceptSchema = z
  .object({
    token: z.string().min(1),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type EmployeeInviteAcceptInput = z.infer<typeof EmployeeInviteAcceptSchema>;
