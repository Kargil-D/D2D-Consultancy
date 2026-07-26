import { z } from "zod";

/** Mirrors the app's real admin screens — see AdminModule's doc comment in schema.prisma. */
export const ADMIN_MODULES = [
  "Dashboard",
  "Destinations",
  "Campaigns",
  "TransferTypes",
  "HotelMaster",
  "CurrencyMaster",
  "Employees",
  "Roles",
  "HeroSection",
  "Reviews",
  "EnquiryConfig",
  "Leads",
  "Quotations",
  "Bookings",
] as const;

export const RolePermissionSchema = z.object({
  module: z.enum(ADMIN_MODULES),
  canView: z.coerce.boolean().default(false),
  canAdd: z.coerce.boolean().default(false),
  canEdit: z.coerce.boolean().default(false),
  canDelete: z.coerce.boolean().default(false),
});

export const RoleCreateSchema = z.object({
  name: z.string().trim().min(1, "Role Name is required"),
  description: z.string().optional().default(""),
  status: z.enum(["Active", "Inactive"]).optional().default("Active"),
  permissions: z.array(RolePermissionSchema).optional().default([]),
});

export const RoleUpdateSchema = RoleCreateSchema.partial();

export type RoleCreate = z.infer<typeof RoleCreateSchema>;
export type RoleUpdate = z.infer<typeof RoleUpdateSchema>;
