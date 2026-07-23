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
  packageIncludes: string[];
  packageExcludes: string[];
  termsAndConditions: string;
  cancellationPolicy: string;
  faqs: { question: string; answer: string }[];
  galleryImages: string[];
  mapLocation?: string;
  customerNotes?: string;
  ctaButtonText: string;
  ctaRedirect: string;
  status: Status;
  isPublished: boolean;
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

  items: AdminQuotationItem[];
  createdDate: string;
  updatedDate: string;
}

/* -------------------------------------------------------------------------- */
/*  Booking Module                                                             */
/* -------------------------------------------------------------------------- */
export type BookingStatus = "Won" | "Booked" | "OnTrip" | "Completed" | "Cancelled";
export type BookingComponentType = "Hotel" | "Transfer" | "Activity" | "Visa";
export type BookingComponentStatus = "Pending" | "Confirmed" | "Cancelled" | "Approved" | "Rejected";
export type BookingDocumentType = "Passport" | "Visa" | "FlightTicket" | "Insurance";

export interface AdminBookingComponent {
  id?: string;
  component: BookingComponentType;
  detail: string;
  status: BookingComponentStatus;
  sortOrder?: number;
}

export interface AdminBookingDocument {
  id: string;
  type: BookingDocumentType;
  url: string;
  uploadedDate: string;
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
  components: AdminBookingComponent[];
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
