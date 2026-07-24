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
  type: z.enum(["Passport", "Visa", "Aadhaar", "PAN", "PassportPhoto", "Other", "FlightTicket", "Insurance"]),
  url: z.string().min(1),
});

const nullableDate = z.preprocess((v) => (v === "" ? undefined : v), z.coerce.date().optional().nullable());
const nullableStr = z.string().optional().nullable();

export const BookingFlightSchema = z.object({
  id: z.string().optional(),
  airline: z.string().optional().default(""),
  flightNumber: z.string().optional().default(""),
  pnr: z.string().optional().default(""),
  ticketNumber: z.string().optional().default(""),
  fromLocation: z.string().optional().default(""),
  toLocation: z.string().optional().default(""),
  departureAt: nullableDate,
  arrivalAt: nullableDate,
  cabinClass: z.string().optional().default(""),
  baggage: z.string().optional().default(""),
  meal: z.string().optional().default(""),
  supplier: z.string().optional().default(""),
  ticketUrl: nullableStr,
  voucherUrl: nullableStr,
  sortOrder: z.coerce.number().int().default(0),
});

export const BookingHotelSchema = z.object({
  id: z.string().optional(),
  hotelName: z.string().optional().default(""),
  hotelCategory: z.string().optional().default(""),
  checkIn: nullableDate,
  checkOut: nullableDate,
  nights: z.coerce.number().int().min(0).default(0),
  rooms: z.coerce.number().int().min(1).default(1),
  roomCategory: z.string().optional().default(""),
  roomType: z.string().optional().default(""),
  mealPlan: z.string().optional().default(""),
  occupancy: z.string().optional().default(""),
  amenities: z.array(z.string()).optional().default([]),
  hotelAddress: z.string().optional().default(""),
  googleMapLink: nullableStr,
  hotelContactNumber: z.string().optional().default(""),
  supplier: z.string().optional().default(""),
  voucherUrl: nullableStr,
  sortOrder: z.coerce.number().int().default(0),
});

export const BookingActivitySchema = z.object({
  id: z.string().optional(),
  activityName: z.string().optional().default(""),
  activityDate: nullableDate,
  activityTime: z.string().optional().default(""),
  duration: z.string().optional().default(""),
  tourType: z.enum(["Private", "SIC"]).default("Private"),
  pickupIncluded: z.coerce.boolean().default(false),
  pickupTime: z.string().optional().default(""),
  pickupLocation: z.string().optional().default(""),
  meetingPoint: z.string().optional().default(""),
  dropLocation: z.string().optional().default(""),
  inclusions: z.string().optional().default(""),
  exclusions: z.string().optional().default(""),
  supplier: z.string().optional().default(""),
  voucherUrl: nullableStr,
  sortOrder: z.coerce.number().int().default(0),
});

export const BookingTransferSchema = z.object({
  id: z.string().optional(),
  transferType: z.string().optional().default(""),
  vehicleType: z.string().optional().default(""),
  mode: z.enum(["Private", "SIC"]).default("Private"),
  pickupAt: nullableDate,
  pickupLocation: z.string().optional().default(""),
  dropLocation: z.string().optional().default(""),
  driverName: z.string().optional().default(""),
  driverMobile: z.string().optional().default(""),
  vehicleNumber: z.string().optional().default(""),
  supplier: z.string().optional().default(""),
  voucherUrl: nullableStr,
  sortOrder: z.coerce.number().int().default(0),
});

export const BookingVisaSchema = z.object({
  id: z.string().optional(),
  country: z.string().optional().default(""),
  visaType: z.string().optional().default(""),
  visaNumber: z.string().optional().default(""),
  applicationDate: nullableDate,
  issueDate: nullableDate,
  expiryDate: nullableDate,
  status: z.enum(["Applied", "Approved", "Rejected", "Issued"]).default("Applied"),
  supplier: z.string().optional().default(""),
  visaCopyUrl: nullableStr,
  sortOrder: z.coerce.number().int().default(0),
});

export const BookingInsuranceSchema = z.object({
  id: z.string().optional(),
  insuranceCompany: z.string().optional().default(""),
  policyNumber: z.string().optional().default(""),
  planName: z.string().optional().default(""),
  coverageAmount: z.coerce.number().min(0).default(0),
  travelStartDate: nullableDate,
  travelEndDate: nullableDate,
  policyPdfUrl: nullableStr,
  sortOrder: z.coerce.number().int().default(0),
});

export const CostSheetEntrySchema = z.object({
  serviceType: z.enum(["Flight", "Hotel", "Activity", "Transfer", "Visa", "Insurance"]),
  sourceId: z.string().min(1),
  supplierName: z.string().optional().default(""),
  serviceName: z.string().optional().default(""),
  dmcCost: z.coerce.number().min(0).default(0),
  bookingCost: z.coerce.number().min(0).default(0),
  settlementCost: z.coerce.number().min(0).default(0),
  sellingPrice: z.coerce.number().min(0).default(0),
  status: z.enum(["Pending", "Confirmed", "Invoiced", "Settled"]).default("Pending"),
  remarks: nullableStr,
});

export const CustomerPaymentSchema = z.object({
  paymentDate: z.coerce.date(),
  paymentMode: z.enum(["Cash", "BankTransfer", "Card", "UPI", "Cheque", "Other"]).default("Cash"),
  amount: z.coerce.number().min(0),
  transactionReference: nullableStr,
  remarks: nullableStr,
});

export const SupplierPaymentSchema = z.object({
  supplierName: z.string().min(1),
  paymentDate: z.coerce.date(),
  amount: z.coerce.number().min(0),
  paymentMode: z.enum(["Cash", "BankTransfer", "Card", "UPI", "Cheque", "Other"]).default("Cash"),
  transactionReference: nullableStr,
  settlementStatus: z.enum(["Pending", "Settled", "Partial"]).default("Pending"),
});

export const BookingNoteSchema = z.object({
  authorName: z.string().optional().default(""),
  message: z.string().min(1),
});

export type BookingCreate = z.infer<typeof BookingCreateSchema>;
export type BookingUpdate = z.infer<typeof BookingUpdateSchema>;
export type BookingFlightInput = z.infer<typeof BookingFlightSchema>;
export type BookingHotelInput = z.infer<typeof BookingHotelSchema>;
export type BookingActivityInput = z.infer<typeof BookingActivitySchema>;
export type BookingTransferInput = z.infer<typeof BookingTransferSchema>;
export type BookingVisaInput = z.infer<typeof BookingVisaSchema>;
export type BookingInsuranceInput = z.infer<typeof BookingInsuranceSchema>;
export type CostSheetEntryInput = z.infer<typeof CostSheetEntrySchema>;
export type CustomerPaymentInput = z.infer<typeof CustomerPaymentSchema>;
export type SupplierPaymentInput = z.infer<typeof SupplierPaymentSchema>;
export type BookingNoteInput = z.infer<typeof BookingNoteSchema>;
