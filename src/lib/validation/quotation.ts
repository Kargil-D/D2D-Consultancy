import { z } from "zod";

const QuotationComponentEnum = z.enum(["Hotel", "Transfer", "Activity", "Visa", "Insurance", "Flight"]);
const LeadSourceEnum = z.enum(["Website", "MetaAds", "GoogleAds", "SEO", "WhatsApp", "Referral", "Manual"]);
const LineStatusEnum = z.enum(["Included", "Optional", "Excluded"]);

const QuotationItemSchema = z.object({
  id: z.string().optional(), // present when editing an existing row
  component: QuotationComponentEnum,
  detail: z.string().optional().default(""),
  qty: z.coerce.number().int().min(1).default(1),
  cost: z.coerce.number().min(0).default(0),
  currencyCode: z.string().trim().toUpperCase().optional().default("INR"),
  foreignAmount: z.coerce.number().min(0).optional().nullable(),
  exchangeRate: z.coerce.number().positive().optional().default(1),
  sortOrder: z.coerce.number().int().default(0),
});

/** Step 1 — customer-detail form input, used to find-or-create the linked Lead. */
const QuotationCustomerSchema = z.object({
  customerName: z.string().trim().min(1),
  mobile: z.string().trim().min(1),
  email: z.string().trim().email().optional().nullable().or(z.literal("")),
  companyName: z.string().trim().optional().nullable(),
});

/** Step 2 — one itinerary day. */
const QuotationItineraryDaySchema = z.object({
  id: z.string(),
  dayNumber: z.coerce.number().int().min(1),
  title: z.string().optional().default(""),
  description: z.string().optional().default(""),
  images: z.array(z.string()).optional().default([]),
  meals: z.array(z.string()).optional().default([]),
  notes: z.string().optional().default(""),
});

/** Step 3 — one hotel selected from Hotel Master within an option group. */
const QuotationHotelSelectionSchema = z.object({
  id: z.string(),
  hotelMasterId: z.string().optional().nullable(),
  hotelName: z.string().optional().default(""),
  images: z.array(z.string()).optional().default([]),
  description: z.string().optional().default(""),
  category: z.string().optional().nullable(),
  roomType: z.string().optional().default(""),
  mealPlan: z.string().optional().default(""),
  amenities: z.array(z.string()).optional().default([]),
  googleMapUrl: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  checkIn: z.string().optional().default(""),
  checkOut: z.string().optional().default(""),
  rooms: z.coerce.number().int().min(1).default(1),
  nights: z.coerce.number().int().min(0).default(1),
});

const QuotationHotelOptionGroupSchema = z.object({
  id: z.string(),
  label: z.enum(["Option A", "Option B", "Option C"]),
  hotels: z.array(QuotationHotelSelectionSchema).default([]),
});

/** Step 4 — one transfer leg. */
const QuotationTransferItemSchema = z.object({
  id: z.string(),
  name: z.string().optional().default(""),
  description: z.string().optional().default(""),
  images: z.array(z.string()).optional().default([]),
  pickupLocation: z.string().optional().default(""),
  dropLocation: z.string().optional().default(""),
  vehicleType: z.string().optional().default(""),
  mode: z.enum(["Private", "SIC"]).default("Private"),
  duration: z.string().optional().default(""),
  pickupTime: z.string().optional().default(""),
  dropTime: z.string().optional().default(""),
  status: LineStatusEnum.default("Included"),
  notes: z.string().optional().default(""),
});

/** Step 5 — one activity. */
const QuotationActivityItemSchema = z.object({
  id: z.string(),
  name: z.string().optional().default(""),
  description: z.string().optional().default(""),
  images: z.array(z.string()).optional().default([]),
  duration: z.string().optional().default(""),
  reportingTime: z.string().optional().default(""),
  activityTime: z.string().optional().default(""),
  status: LineStatusEnum.default("Included"),
  notes: z.string().optional().default(""),
});

export const QuotationCreateSchema = z.object({
  // Step 1 — Customer Details (drives find-or-create-Lead; not persisted verbatim on Quotation)
  customer: QuotationCustomerSchema,
  destinationId: z.string().min(1),
  campaignId: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional().nullable()),

  // Step 1 — Trip / Traveller / Other details
  travelDate: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.date().optional().nullable()),
  days: z.coerce.number().int().min(0).optional().nullable(),
  nights: z.coerce.number().int().min(0).optional().nullable(),
  adults: z.coerce.number().int().min(1).default(1),
  children: z.coerce.number().int().min(0).default(0),
  infants: z.coerce.number().int().min(0).default(0),
  salesExecutiveId: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional().nullable()),
  source: z.preprocess((v) => (v === "" ? undefined : v), LeadSourceEnum.optional().nullable()),
  validUntil: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.date().optional().nullable()),
  internalNotes: z.string().optional().nullable(),

  // Pricing (unchanged)
  marginPercent: z.coerce.number().min(0).default(0),
  items: z.array(QuotationItemSchema).default([]),

  // Steps 2–5 — content modules
  itineraryMode: z.enum(["template", "custom"]).default("custom"),
  itineraryDays: z.array(QuotationItineraryDaySchema).default([]),
  hotelOptions: z.array(QuotationHotelOptionGroupSchema).default([]),
  transfers: z.array(QuotationTransferItemSchema).default([]),
  activities: z.array(QuotationActivityItemSchema).default([]),
});

export const QuotationUpdateSchema = QuotationCreateSchema.partial();

export type QuotationCreate = z.infer<typeof QuotationCreateSchema>;
export type QuotationUpdate = z.infer<typeof QuotationUpdateSchema>;
export type QuotationItemInput = z.infer<typeof QuotationItemSchema>;
