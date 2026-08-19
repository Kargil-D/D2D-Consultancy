import { z } from "zod";

export const BookingEmailDraftSchema = z.object({
  recipientType: z.enum(["Customer", "Supplier"]),
  toEmail: z.string().optional().default(""),
  cc: z.string().optional().default(""),
  bcc: z.string().optional().default(""),
  subject: z.string().optional().default(""),
  bodyHtml: z.string().optional().default(""),
});

export const BookingSendEmailSchema = z.object({
  recipientType: z.enum(["Customer", "Supplier"]),
  toEmail: z.string().email("A valid recipient email is required"),
  cc: z.string().optional().default(""),
  bcc: z.string().optional().default(""),
  subject: z.string().min(1, "Subject is required"),
  bodyHtml: z.string().min(1, "Message body is required"),
});

export type BookingEmailDraftInput = z.infer<typeof BookingEmailDraftSchema>;
export type BookingSendEmailInput = z.infer<typeof BookingSendEmailSchema>;
