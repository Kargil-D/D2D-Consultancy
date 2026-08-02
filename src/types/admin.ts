/**
 * Shared admin master-module types.
 * Mirrors the planned SQL schema so swapping localStorage for the .NET API
 * later is a 1:1 mapping.
 */

export type AuditColumns = {
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedDate?: string;
  isDeleted?: boolean;
};

export type Status = "Active" | "Inactive";

/* -------------------------------------------------------------------------- */
/*  Destination Master                                                         */
/* -------------------------------------------------------------------------- */
export interface AdminDestination extends AuditColumns {
  id: string;
  name: string;
  country: string;
  state?: string;
  city?: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  thumbnailImage: string;
  bannerImage: string;
  isPopular: boolean;
  displayOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  importantNotes?: string;
  status: Status;
  isDomestic: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Package / Campaign Master                                                  */
/* -------------------------------------------------------------------------- */
export type TravelType = "Family" | "Honeymoon" | "Adventure" | "Group" | "Solo";

export interface ActivityDetail {
  id: string;
  title: string;
  icon?: string;
}

export interface AdminPackage extends AuditColumns {
  id: string;
  name: string;
  destinationId: string;
  packageType: string;
  days: number;
  nights: number;
  startingPrice: number;
  offerPrice?: number;
  thumbnail: string;
  coverBanner: string;
  shortDescription: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  bestTimeToVisit?: string;
  travelTypes: TravelType[];
  isFeatured: boolean;
  isRecentlyViewed: boolean;
  isHeroCampaign: boolean;
  viewDetailsRedirect: string;
  slug: string;
  seoTitle?: string;
  seoDescription?: string;
  status: Status;
  gallery: string[];
  bookedByName?: string;
  bookedByCity?: string;
  bookedByAgo?: string;
  activities: ActivityDetail[];
  inclusionsText: string;
  exclusionsText: string;
  packageCost: number;
  platformFee: number;
  gstPercent: number;
  marginPrice: number;
  insurancePrice: number;
  noOfPersons?: number | null;
  pricePerPerson?: string | null;
}

/* -------------------------------------------------------------------------- */
/*  Itinerary Master                                                           */
/* -------------------------------------------------------------------------- */
export interface ItineraryDayDetail {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  activities: string[];
  mealsIncluded: string[];
  stayDetails: string;
  transportDetails: string;
  dayImage?: string;
  order: number;
}

export interface AdminItinerary extends AuditColumns {
  id: string;
  packageId: string;
  title: string;
  overview: string;
  totalDays: number;
  days: ItineraryDayDetail[];
  status: Status;
}

/* -------------------------------------------------------------------------- */
/*  Hotel Master                                                               */
/* -------------------------------------------------------------------------- */
export interface HotelStayDetail {
  id: string;
  name: string;
  images?: string[];
  roomType: string;
  description: string;
}

export interface AdminHotel extends AuditColumns {
  id: string;
  packageId: string;
  hotels: HotelStayDetail[];
  status: Status;
}

/* -------------------------------------------------------------------------- */
/*  Transfer Master                                                            */
/* -------------------------------------------------------------------------- */
export interface TransferStopDetail {
  id: string;
  from: string;
  to: string;
  transferTypeId?: string;
}

export interface AdminTransfer extends AuditColumns {
  id: string;
  packageId: string;
  transfers: TransferStopDetail[];
  status: Status;
}

/** Standalone transfer type reference list (e.g. "Speedboat", "Private Car") — not linked to a package. */
export interface AdminTransferType extends AuditColumns {
  id: string;
  name: string;
  status: Status;
}

/* -------------------------------------------------------------------------- */
/*  Hotel Master (searchable hotel catalog used by the Quotation Hotel step)   */
/* -------------------------------------------------------------------------- */
export interface AdminHotelMaster extends AuditColumns {
  id: string;
  name: string;
  destinationId?: string | null;
  destination?: AdminDestination | null;
  images: string[];
  description: string;
  category?: string | null;
  roomTypes: string[];
  mealPlans: string[];
  amenities: string[];
  googleMapUrl?: string | null;
  website?: string | null;
  status: Status;
}

/* -------------------------------------------------------------------------- */
/*  Employee Master                                                             */
/* -------------------------------------------------------------------------- */
export type EmploymentType = "Permanent" | "Contract" | "Intern";

export interface AdminEmployeeManagerOption {
  id: string;
  fullName: string;
  designation: string;
  employeeCode?: string;
}

/** The Employee's linked login account, if any — see AdminEmployee.userId. Role here is the real, enforced Role (see AdminRole), not a label. */
export interface AdminEmployeeLinkedUser {
  id: string;
  email: string;
  isActive: boolean;
  lastLogin?: string | null;
  role: { id: string; name: string; status: Status };
}

/**
 * aadhaarNumber/accountNumber are write-only — send them to create/update only when the
 * user is setting a new value. Reads always come back as aadhaarNumberMasked/accountNumberMasked
 * (e.g. "XXXX XXXX 1234"); the plaintext is only ever available via employeesApi.reveal().
 */
export interface AdminEmployee extends AuditColumns {
  id: string;
  seq: number;
  employeeCode: string;

  fullName: string;
  dateOfBirth?: string | null;
  gender: string;
  mobileNumber: string;
  personalEmail?: string | null;
  officialEmail?: string | null;
  profilePhotoUrl?: string | null;

  designation: string;
  department: string;
  branch: string;
  reportingManagerId?: string | null;
  reportingManager?: AdminEmployeeManagerOption | null;
  employmentType: EmploymentType;
  joiningDate?: string | null;
  confirmationDate?: string | null;
  status: Status;

  username?: string | null;
  userId?: string | null;
  user?: AdminEmployeeLinkedUser | null;
  lastLogin?: string | null;

  currentAddress: string;
  permanentAddress: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;

  aadhaarNumberMasked: string;
  aadhaarNumber?: string;
  panNumber?: string | null;
  passportNumber?: string | null;
  drivingLicenceNumber?: string | null;

  accountHolderName: string;
  bankName: string;
  bankBranchName: string;
  accountNumberMasked: string;
  accountNumber?: string;
  ifscCode: string;
  upiId?: string | null;
  salaryPaymentMode: PaymentMode;

  emergencyContactName: string;
  emergencyRelationship: string;
  emergencyMobile: string;
}

export interface AdminEmployeeAuditLog {
  id: string;
  employeeId: string;
  action: string;
  field?: string | null;
  performedBy: string;
  performedAt: string;
}

/* -------------------------------------------------------------------------- */
/*  Roster (attendance) — Present/Absent per employee per day, no shift types  */
/* -------------------------------------------------------------------------- */
export type RosterStatus = "Present" | "Absent";

export interface AdminRosterEmployeeRow {
  id: string;
  fullName: string;
  employeeCode: string;
  designation: string;
  department: string;
  /** date (YYYY-MM-DD) -> status, sparse — a missing key means unmarked. */
  days: Record<string, RosterStatus>;
  presentCount: number;
  absentCount: number;
}

export interface AdminRosterGrid {
  year: number;
  month: number;
  daysInMonth: number;
  employees: AdminRosterEmployeeRow[];
  summary: { present: number; absent: number };
}

export interface AdminMyRoster {
  year: number;
  month: number;
  daysInMonth: number;
  days: Record<string, RosterStatus>;
}

/* -------------------------------------------------------------------------- */
/*  Roles & Permissions                                                        */
/* -------------------------------------------------------------------------- */
/**
 * The app's real admin screens (see DepartmentTiles usage in src/app/admin/{page,pm,sales,finance}/page.tsx),
 * excluding placeholder department tiles with no href yet (CX, Roster, Ticketing, Report).
 * Policy labels today — Role.status is the only piece actually enforced (gates login);
 * per-module route gating is a separate follow-up, not yet wired to these flags.
 */
export type AdminModule =
  | "Dashboard"
  | "Destinations"
  | "Campaigns"
  | "TransferTypes"
  | "HotelMaster"
  | "CurrencyMaster"
  | "Employees"
  | "Roles"
  | "HeroSection"
  | "Reviews"
  | "EnquiryConfig"
  | "Leads"
  | "Quotations"
  | "Bookings";

export interface AdminRolePermission {
  module: AdminModule;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  status: Status;
  permissions: AdminRolePermission[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminRolePickerOption {
  id: string;
  name: string;
}

/* -------------------------------------------------------------------------- */
/*  Currency Master                                                            */
/* -------------------------------------------------------------------------- */
export interface AdminCurrency extends AuditColumns {
  id: string;
  code: string;
  name: string;
  exchangeRate: number;
  effectiveFrom: string;
  status: Status;
}

export interface AdminCurrencyRateHistory {
  id: string;
  currencyId: string;
  currencyCode: string;
  oldRate: number | null;
  newRate: number;
  effectiveFrom: string;
  changedBy?: string | null;
  changedDate: string;
}

/* -------------------------------------------------------------------------- */
/*  Hero Section                                                               */
/* -------------------------------------------------------------------------- */
export interface AdminHeroConfig extends AuditColumns {
  id: string;
  bannerText: string;
  subtitle: string;
  backgroundImage: string;
  backgroundVideo?: string;
  ctaPrimaryText: string;
  ctaPrimaryLink: string;
  ctaSecondaryText?: string;
  ctaSecondaryLink?: string;
  searchDropdownDestinationIds: string[];
  featuredCampaignIds: string[];
  status: Status;
}

/* -------------------------------------------------------------------------- */
/*  Customer Reviews                                                           */
/* -------------------------------------------------------------------------- */
export interface AdminReview extends AuditColumns {
  id: string;
  customerName: string;
  customerImage: string;
  rating: number;
  reviewText: string;
  taggedDestinationId?: string;
  taggedPackageId?: string;
  reviewDate: string;
  isFeatured: boolean;
  status: Status;
}

/* -------------------------------------------------------------------------- */
/*  Enquiry Configuration                                                      */
/* -------------------------------------------------------------------------- */
export interface AdminEnquiryConfig extends AuditColumns {
  id: string;
  destinationId: string;
  packageId?: string;
  preferredMonths: string[];
  budgetRanges: string[];
  travelTypes: TravelType[];
  maxTravelers: number;
  autoTagPackage: boolean;
  status: Status;
}

/* -------------------------------------------------------------------------- */
/*  Lead Management                                                            */
/* -------------------------------------------------------------------------- */
export type LeadSource = "Website" | "MetaAds" | "GoogleAds" | "SEO" | "WhatsApp" | "Referral" | "Manual";
export type LeadStatus = "New" | "Contacted" | "FollowUp" | "QuotationSent" | "PaymentPending" | "Won" | "Lost";

export interface AdminLeadActivity {
  id: string;
  leadId: string;
  message: string;
  createdDate: string;
}

export interface AdminLead {
  id: string;
  seq: number;
  customerName: string;
  mobile: string;
  email?: string | null;
  companyName?: string | null;
  destinationId: string;
  destination?: AdminDestination;
  travelDate?: string | null;
  source: LeadSource;
  adults?: number | null;
  children?: number | null;
  assignedToId?: string | null;
  assignedTo?: AdminSalesUser | null;
  remarks?: string | null;
  status: LeadStatus;
  activities?: AdminLeadActivity[];
  createdDate: string;
  updatedDate: string;
}

export interface AdminSalesUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/* -------------------------------------------------------------------------- */
/*  Lead Assignment Board                                                      */
/* -------------------------------------------------------------------------- */

export type LeadAssignmentMethod = "Manual" | "Reassign" | "BulkReassign" | "RoundRobin";

export interface AdminLeadBoardEmployee {
  id: string;
  userId: string;
  fullName: string;
  employeeCode: string;
  designation: string;
  rosterStatus: "Present" | "Absent" | null;
  assignedLeads: number;
  completedLeads: number;
  pendingLeads: number;
  capacity: number;
  utilization: number;
}

export interface AdminLeadBoardUnassignedLead {
  id: string;
  seq: number;
  customerName: string;
  destinationName: string;
  source: LeadSource;
  createdDate: string;
}

export interface AdminLeadBoardFeedEntry {
  id: string;
  leadId: string;
  fromUserName: string | null;
  toUserName: string;
  method: LeadAssignmentMethod;
  performedBy: string;
  createdDate: string;
}

export interface AdminLeadBoardRoundRobin {
  nextEmployeeId: string;
  nextEmployeeName: string;
  nextEmployeeDesignation: string;
  sequence: number;
  total: number;
  lastAssignedLeadSeq: number | null;
  lastAssignedToName: string | null;
  lastAssignedAt: string | null;
}

export interface AdminLeadBoard {
  date: string;
  summary: {
    employeesWorking: number;
    totalEmployees: number;
    newLeadsToday: number;
    assignedLeads: number;
    unassignedLeads: number;
    reassignedToday: number;
    employeesOnLeave: number;
  };
  employees: AdminLeadBoardEmployee[];
  unassignedLeadsList: AdminLeadBoardUnassignedLead[];
  feed: AdminLeadBoardFeedEntry[];
  roundRobin: AdminLeadBoardRoundRobin | null;
  workloadSummary: { wellBalanced: number; high: number; low: number };
  trend: { date: string; count: number }[];
}

/* -------------------------------------------------------------------------- */
/*  Quotation Builder                                                          */
/* -------------------------------------------------------------------------- */
export type QuotationComponentType = "Hotel" | "Transfer" | "Activity" | "Visa" | "Insurance" | "Flight";
export type QuotationStatus = "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired";

export interface AdminQuotationItem {
  id?: string;
  /** Links this row back to its source hotel/activity/transfer id — set only for auto-generated Pricing rows, null for manual (Visa/Insurance/Flight) rows. */
  sourceId?: string | null;
  component: QuotationComponentType;
  detail: string;
  qty: number;
  cost: number;
  currencyCode?: string;
  foreignAmount?: number | null;
  exchangeRate?: number;
  sortOrder?: number;
}

/** Step 1 — customer-detail form input. Not persisted on Quotation directly; drives find-or-create-Lead. */
export interface QuotationCustomerInput {
  customerName: string;
  mobile: string;
  email?: string | null;
  companyName?: string | null;
}

/** Step 2 — one itinerary day (manual entry or copied in from a Campaign template). */
export interface QuotationItineraryDay {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  images: string[];
  meals: string[];
  notes: string;
}

/** Step 3 — one hotel selected (from Hotel Master) within a hotel option group. */
export interface QuotationHotelSelection {
  id: string;
  hotelMasterId?: string | null;
  hotelName: string;
  images: string[];
  description: string;
  category?: string | null;
  roomType: string;
  mealPlan: string;
  amenities: string[];
  googleMapUrl?: string | null;
  website?: string | null;
  checkIn: string;
  checkOut: string;
  rooms: number;
  nights: number;
}

export type QuotationHotelOptionLabel = "Option A" | "Option B" | "Option C";

export interface QuotationHotelOptionGroup {
  id: string;
  label: QuotationHotelOptionLabel;
  hotels: QuotationHotelSelection[];
}

export type QuotationLineStatus = "Included" | "Optional" | "Excluded";

/** Step 4 — one transfer leg. */
export interface QuotationTransferItem {
  id: string;
  name: string;
  description: string;
  images: string[];
  pickupLocation: string;
  dropLocation: string;
  vehicleType: string;
  mode: "Private" | "SIC";
  transferDate: string;
  duration: string;
  pickupTime: string;
  dropTime: string;
  status: QuotationLineStatus;
  notes: string;
}

/** Step 5 — one activity. */
export interface QuotationActivityItem {
  id: string;
  name: string;
  description: string;
  images: string[];
  activityDate: string;
  duration: string;
  reportingTime: string;
  activityTime: string;
  pax: number;
  notes: string;
}

export interface AdminQuotation {
  id: string;
  seq: number;
  leadId: string;
  lead?: AdminLead;
  destinationId: string;
  destination?: AdminDestination;
  campaignId?: string | null;
  campaign?: AdminPackage | null;
  marginPercent: number;
  gstPercent: number;
  status: QuotationStatus;
  shareToken?: string | null;

  // Step 1 — Trip / Traveller / Other details
  travelDate?: string | null;
  days?: number | null;
  nights?: number | null;
  adults: number;
  children: number;
  infants: number;
  salesExecutiveId?: string | null;
  salesExecutive?: AdminSalesUser | null;
  source?: LeadSource | null;
  validUntil?: string | null;
  internalNotes?: string | null;

  // Steps 2–5 — content modules
  itineraryMode: "template" | "custom";
  itineraryDays: QuotationItineraryDay[];
  hotelOptions: QuotationHotelOptionGroup[];
  transfers: QuotationTransferItem[];
  activities: QuotationActivityItem[];

  // Step 6 — Inclusions / Exclusions
  inclusionsText: string;
  exclusionsText: string;

  // Step 7 — Pricing
  includeChildCosting: boolean;
  advanceAmount: number;

  items: AdminQuotationItem[];
  /** Non-deleted Bookings already converted from this Quotation — see "Convert into Booking" in QuotationBuilder. */
  bookings?: { id: string; status: BookingStatus }[];
  createdDate: string;
  updatedDate: string;
}

/* -------------------------------------------------------------------------- */
/*  Booking Module                                                             */
/* -------------------------------------------------------------------------- */
export type BookingStatus = "Won" | "Booked" | "OnTrip" | "Completed" | "Cancelled";
export type BookingDocumentType = "Passport" | "Visa" | "Aadhaar" | "PAN" | "PassportPhoto" | "Other" | "FlightTicket" | "Insurance";
export type BookingServiceType = "Flight" | "Hotel" | "Activity" | "Transfer" | "Visa" | "Insurance";
export type CostSheetStatus = "Pending" | "Confirmed" | "Invoiced" | "Settled";
export type TourType = "Private" | "SIC";
export type VisaProcessStatus = "Applied" | "Approved" | "Rejected" | "Issued";
export type PaymentMode = "Cash" | "BankTransfer" | "Card" | "UPI" | "Cheque" | "Other";
export type SettlementStatus = "Pending" | "Settled" | "Partial";

export interface AdminBookingDocument {
  id: string;
  type: BookingDocumentType;
  url: string;
  description?: string | null;
  uploadedDate: string;
}

/* FRD §4 — Flight */
export interface AdminBookingFlight {
  id?: string;
  airline: string;
  flightNumber: string;
  pnr: string;
  ticketNumber: string;
  fromLocation: string;
  toLocation: string;
  departureAt?: string | null;
  arrivalAt?: string | null;
  cabinClass: string;
  baggage: string;
  meal: string;
  supplier: string;
  ticketUrl?: string | null;
  voucherUrl?: string | null;
  sortOrder?: number;
}

/* FRD §5 — Hotel */
export interface AdminBookingHotel {
  id?: string;
  hotelName: string;
  hotelCategory: string;
  checkIn?: string | null;
  checkOut?: string | null;
  nights: number;
  rooms: number;
  roomCategory: string;
  roomType: string;
  mealPlan: string;
  occupancy: string;
  amenities: string[];
  hotelAddress: string;
  googleMapLink?: string | null;
  hotelContactNumber: string;
  supplier: string;
  voucherUrl?: string | null;
  bookedCurrency: string;
  paymentMode: PaymentMode;
  bookingDate?: string | null;
  bookingPnr: string;
  updatedBy: string;
  sortOrder?: number;
}

/* FRD §6 — Activity */
export interface AdminBookingActivity {
  id?: string;
  activityName: string;
  activityDate?: string | null;
  activityTime: string;
  duration: string;
  tourType: TourType;
  pickupIncluded: boolean;
  pickupTime: string;
  pax: number;
  supplier: string;
  voucherUrl?: string | null;
  invoiceUrl?: string | null;
  bookedCurrency: string;
  paymentMode: PaymentMode;
  bookingDate?: string | null;
  bookingPnr: string;
  updatedBy: string;
  sortOrder?: number;
}

/* FRD §7 — Transfer */
export interface AdminBookingTransfer {
  id?: string;
  transferType: string;
  vehicleType: string;
  mode: TourType;
  pickupAt?: string | null;
  pickupLocation: string;
  dropLocation: string;
  driverName: string;
  driverMobile: string;
  vehicleNumber: string;
  supplier: string;
  voucherUrl?: string | null;
  invoiceUrl?: string | null;
  bookedCurrency: string;
  paymentMode: PaymentMode;
  bookingDate?: string | null;
  bookingPnr: string;
  updatedBy: string;
  sortOrder?: number;
}

/* FRD §8 — Visa */
export interface AdminBookingVisa {
  id?: string;
  country: string;
  visaType: string;
  visaNumber: string;
  applicationDate?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  status: VisaProcessStatus;
  supplier: string;
  visaCopyUrl?: string | null;
  sortOrder?: number;
}

/* FRD §9 — Insurance */
export interface AdminBookingInsurance {
  id?: string;
  insuranceCompany: string;
  policyNumber: string;
  planName: string;
  coverageAmount: number;
  travelStartDate?: string | null;
  travelEndDate?: string | null;
  policyPdfUrl?: string | null;
  sortOrder?: number;
}

/** FRD §3 — Cost Sheet. `profit` is computed (sellingPrice - bookingCost), never stored. */
export interface AdminBookingCostSheetEntry {
  id: string;
  serviceType: BookingServiceType;
  sourceId: string;
  supplierName: string;
  serviceName: string;
  bookingCost: number;
  settlementCost: number;
  sellingPrice: number;
  profit: number;
  status: CostSheetStatus;
  remarks?: string | null;
  sortOrder?: number;
}

export interface AdminBookingCustomerPayment {
  id?: string;
  paymentDate: string;
  paymentMode: PaymentMode;
  amount: number;
  transactionReference?: string | null;
  remarks?: string | null;
  createdDate?: string;
}

export interface AdminBookingSupplierPayment {
  id?: string;
  supplierName: string;
  paymentDate: string;
  amount: number;
  paymentMode: PaymentMode;
  transactionReference?: string | null;
  settlementStatus: SettlementStatus;
  createdDate?: string;
}

export interface AdminBookingTimelineEvent {
  id: string;
  message: string;
  createdDate: string;
}

export interface AdminBookingNote {
  id?: string;
  authorName: string;
  message: string;
  createdDate?: string;
}

export interface AdminBooking {
  id: string;
  seq: number;
  leadId: string;
  lead?: AdminLead;
  quotationId?: string | null;
  quotation?: AdminQuotation | null;
  destinationId: string;
  destination?: AdminDestination;
  travelDate?: string | null;
  bookingExecutiveId?: string | null;
  bookingExecutive?: AdminSalesUser | null;
  customerSupportId?: string | null;
  customerSupport?: AdminSalesUser | null;
  totalAmount: number;
  status: BookingStatus;
  remarks?: string | null;
  dmcName?: string | null;
  dmcEmailSentDate?: string | null;
  dmcResponse?: string | null;
  dmcRemarks?: string | null;
  documents: AdminBookingDocument[];
  flights: AdminBookingFlight[];
  hotels: AdminBookingHotel[];
  activities: AdminBookingActivity[];
  transfers: AdminBookingTransfer[];
  visas: AdminBookingVisa[];
  insurances: AdminBookingInsurance[];
  costSheet: AdminBookingCostSheetEntry[];
  customerPayments: AdminBookingCustomerPayment[];
  supplierPayments: AdminBookingSupplierPayment[];
  timeline: AdminBookingTimelineEvent[];
  notes: AdminBookingNote[];
  createdDate: string;
  updatedDate: string;
}

/* -------------------------------------------------------------------------- */
/*  Standard API response shape                                                */
/* -------------------------------------------------------------------------- */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
