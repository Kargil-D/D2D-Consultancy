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
