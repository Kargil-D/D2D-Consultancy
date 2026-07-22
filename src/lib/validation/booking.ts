import { z } from "zod";

export const BookingCreateSchema = z.object({
  leadId: z.string().min(1),
  quotationId: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional().nullable()),
  destinationId: z.string().min(1),
  travelDate: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional().nullable()),
  bookingExecutiveId: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional().nullable()),
  customerSupportId: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional().nullable()),
  totalAmount: z.coerce.number().min(0).default(0),
  remarks: z.string().optional().nullable(),
});

export const BookingUpdateSchema = BookingCreateSchema.partial();

export const BookingStatusUpdateSchema = z.object({
  status: z.enum(["Won", "Booked", "OnTrip", "Completed", "Cancelled"]),
});

export const DmcUpdateSchema = z.object({
  dmcName: z.string().optional().nullable(),
  dmcEmailSentDate: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional().nullable()),
  dmcResponse: z.string().optional().nullable(),
  dmcRemarks: z.string().optional().nullable(),
});

export const DocumentUploadSchema = z.object({
  type: z.enum(["Passport", "Visa", "FlightTicket", "Insurance"]),
  url: z.string().min(1),
});

export const ComponentUpsertSchema = z.object({
  id: z.string().optional(),
  component: z.enum(["Hotel", "Transfer", "Activity", "Visa"]),
  detail: z.string().optional().default(""),
  status: z.enum(["Pending", "Confirmed", "Cancelled", "Approved", "Rejected"]).default("Pending"),
  sortOrder: z.coerce.number().int().default(0),
});

export type BookingCreate = z.infer<typeof BookingCreateSchema>;
export type BookingUpdate = z.infer<typeof BookingUpdateSchema>;
export type ComponentUpsert = z.infer<typeof ComponentUpsertSchema>;
