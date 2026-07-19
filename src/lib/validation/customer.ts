import { z } from "zod";

export const UpdateProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  phoneNumber: z.string().trim().min(7, "Enter a valid phone number").optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
