import { getBooking, bookingCode } from "@/services/bookingService";
import { bookingTotalPrice } from "@/lib/quotationPricing";
import { amountInWords, formatINRSymbol } from "@/lib/bookingVoucherPdf";
import type { QuotationItineraryDay } from "@/types/admin";
import type {
  TripReceiptPdfData, TripReceiptDay, TripReceiptPassenger,
  HotelTravelVoucherPdfData, HotelTravelVoucherEntry,
} from "@/lib/bookingVoucherPdf";

/** The full Booking-with-relations shape getBooking()/getCustomerOwnedBooking() both return
 * (same BOOKING_INCLUDE on both) — the one input type every document builder below needs. */
export type BookingWithRelations = NonNullable<Awaited<ReturnType<typeof getBooking>>>;

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function shortDate(d: Date) {
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}
function shortDateYear(d: Date) {
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}
function dayHeaderLabel(d: Date) {
  return `${WEEKDAY_SHORT[d.getDay()]}, ${shortDate(d)}`;
}
function fullDate(d: Date) {
  return `${d.getDate()} ${MONTH_FULL[d.getMonth()]} ${d.getFullYear()}`;
}
function formatFullDateOrNull(d: Date | null) {
  return d ? fullDate(d) : null;
}
function dateKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Builds the full trip receipt ("Generate Travel Voucher") payload — trip summary, passengers,
 * accommodation, day-by-day transport/activities, and payment acknowledgement. Same document for
 * admin and the customer's own self-service download; only the auth/ownership check differs
 * between the two routes that call this.
 *
 * `variant: "receipt"` is the wording used by the issued Payment Receipt (see
 * buildPaymentReceiptData) — same document, phrased like the approved sample. */
export function buildTripReceiptData(booking: BookingWithRelations, variant: "voucher" | "receipt" = "voucher"): TripReceiptPdfData {
  const receipt = variant === "receipt";
  const paxCount = booking.adults + booking.children;

  // ---- trip date range: earliest/latest known dates across travel date + hotel stays ----
  const knownDates: Date[] = [];
  if (booking.travelDate) knownDates.push(startOfDay(booking.travelDate));
  for (const h of booking.hotels) {
    if (h.checkIn) knownDates.push(startOfDay(h.checkIn));
    if (h.checkOut) knownDates.push(startOfDay(h.checkOut));
  }
  const tripStart = knownDates.length ? new Date(Math.min(...knownDates.map((d) => d.getTime()))) : null;
  const tripEnd = knownDates.length ? new Date(Math.max(...knownDates.map((d) => d.getTime()))) : null;

  let travelDatesLabel = "—";
  let durationLabel = "—";
  if (tripStart && tripEnd) {
    const nights = Math.max(0, Math.round((tripEnd.getTime() - tripStart.getTime()) / 86400000));
    const days = nights + 1;
    const dash = receipt ? " – " : " - ";
    travelDatesLabel = tripStart.getMonth() === tripEnd.getMonth() && tripStart.getFullYear() === tripEnd.getFullYear()
      ? `${tripStart.getDate()}${dash}${tripEnd.getDate()} ${MONTH_SHORT[tripEnd.getMonth()]} ${tripEnd.getFullYear()}`
      : `${shortDate(tripStart)}${dash}${shortDate(tripEnd)} ${tripEnd.getFullYear()}`;
    durationLabel = `${nights}N / ${days}D`;
  }

  const travellersLabel = [
    `${booking.adults} ${booking.adults === 1 ? "Adult" : "Adults"}`,
    booking.children > 0 ? `${booking.children} ${booking.children === 1 ? "Child" : "Children"}` : null,
    booking.infants > 0 ? `${booking.infants} ${booking.infants === 1 ? "Infant" : "Infants"}` : null,
  ].filter(Boolean).join(", ");

  // ---- passengers ----
  let passengers: TripReceiptPassenger[];
  if (booking.passengers.length > 0) {
    passengers = booking.passengers.map((p, i) => ({
      role: i === 0 ? "Lead Passenger" : booking.passengers.length === 2 ? "Co-Passenger" : `Passenger ${i + 1}`,
      name: p.name || (i === 0 ? booking.lead.customerName : ""),
      phone: p.contactNumber || (i === 0 ? booking.lead.mobile : ""),
      email: i === 0 ? booking.lead.email : null,
    }));
  } else {
    passengers = [{ role: "Lead Passenger", name: booking.lead.customerName, phone: booking.lead.mobile, email: booking.lead.email }];
  }
  // The Payment Receipt is addressed to the lead passenger only — no co-passenger details.
  if (receipt) passengers = passengers.slice(0, 1);

  // ---- accommodation ----
  let runningNight = 1;
  const hotels = booking.hotels.map((h) => {
    const nights = Math.max(h.nights, 0);
    const nightsLabel = nights <= 0
      ? "Stay"
      : receipt
        ? `${nights} ${nights === 1 ? "Night" : "Nights"}`
        : nights === 1
          ? `Night ${runningNight}`
          : `Nights ${runningNight} & ${runningNight + nights - 1}`;
    runningNight += Math.max(nights, 1);

    const starsMatch = h.hotelCategory.match(/(\d)/);
    const roomLabel = [h.roomCategory, h.roomType].filter(Boolean).join(" ") || "Room";

    return {
      nightsLabel,
      location: h.hotelAddress,
      checkInLabel: h.checkIn ? shortDate(h.checkIn) : "—",
      checkOutLabel: h.checkOut ? shortDate(h.checkOut) : "—",
      hotelName: h.hotelName,
      stars: starsMatch ? Number(starsMatch[1]) : 0,
      mealPlan: h.mealPlan,
      roomDetail: receipt ? `${h.rooms} ${roomLabel} – ${paxCount} Pax` : `${h.rooms} ${roomLabel} (${paxCount} Pax)`,
      amenities: h.amenities,
    };
  });

  // ---- day-by-day transport & activities ----
  const dayMap = new Map<string, { date: Date; items: string[] }>();
  const additionalServices: string[] = [];

  for (const t of booking.transfers) {
    const text = `${t.transferType || "Transfer"} - ${[t.pickupLocation, t.dropLocation].filter(Boolean).join(" to ")}${t.vehicleType ? ` (${t.vehicleType})` : ""}`;
    if (t.pickupAt) {
      const key = dateKey(startOfDay(t.pickupAt));
      const bucket = dayMap.get(key) ?? { date: startOfDay(t.pickupAt), items: [] };
      bucket.items.push(text);
      dayMap.set(key, bucket);
    } else {
      additionalServices.push(text);
    }
  }
  for (const a of booking.activities) {
    const text = `${a.activityName || "Activity"}${a.duration ? ` - ${a.duration}` : ""} (${a.pax} Pax)`;
    if (a.activityDate) {
      const key = dateKey(startOfDay(a.activityDate));
      const bucket = dayMap.get(key) ?? { date: startOfDay(a.activityDate), items: [] };
      bucket.items.push(text);
      dayMap.set(key, bucket);
    } else {
      additionalServices.push(text);
    }
  }

  const sortedDayBuckets = Array.from(dayMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  const days: TripReceiptDay[] = sortedDayBuckets.map((bucket) => {
    const dayNumber = tripStart
      ? Math.round((bucket.date.getTime() - tripStart.getTime()) / 86400000) + 1
      : sortedDayBuckets.indexOf(bucket) + 1;
    return { label: `Day ${dayNumber} · ${dayHeaderLabel(bucket.date)}`, items: bucket.items };
  });

  // The Payment Receipt shows the quotation's itinerary instead of the booked transfers/activities.
  const itineraryDays: TripReceiptDay[] = (booking.quotation?.itineraryDays as unknown as QuotationItineraryDay[] | undefined ?? [])
    .map((d, i) => {
      const dayNumber = d.dayNumber || i + 1;
      const date = tripStart ? new Date(tripStart.getFullYear(), tripStart.getMonth(), tripStart.getDate() + dayNumber - 1) : null;
      const title = d.title?.trim();
      const meals = d.meals?.filter(Boolean) ?? [];
      return {
        label: [`Day ${dayNumber}`, date ? shortDate(date) : null, title && title.toLowerCase() !== `day ${dayNumber}` ? title : null].filter(Boolean).join(" · "),
        items: [...bulletLines(d.description), ...(meals.length > 0 ? [`Meals: ${meals.join(", ")}`] : [])],
      };
    });

  // ---- payments ----
  // Same figure the booking header ("Deal Price") and the Customer Payments cap use — never the
  // raw totalAmount column, which is only a fallback for bookings with no linked quotation and
  // can otherwise sit stale after the quotation's pricing changes post-booking.
  const totalCost = bookingTotalPrice(booking) ?? 0;
  const paymentsAsc = [...booking.customerPayments].sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime());
  const totalReceived = paymentsAsc.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = Math.max(0, totalCost - totalReceived);
  const paidStatus: TripReceiptPdfData["paidStatus"] = totalReceived <= 0 ? "pending" : balanceDue <= 0 ? "full" : "partial";
  const payments = paymentsAsc.map((p, i) => ({
    label: `Payment ${i + 1}`,
    amount: p.amount,
    dateLabel: shortDateYear(p.paymentDate),
  }));

  const costPerLabel = receipt
    ? `for ${travellersLabel}`
    : booking.adults === 2 && booking.children === 0 ? "per Couple" : `per ${paxCount || 1} Pax`;
  const perPersonCost = totalCost / (paxCount || 1);

  return {
    bookingId: bookingCode(booking.lead.seq),
    issuedOn: fullDate(new Date()),
    packageTitle: `${booking.destination.name.toUpperCase()} HOLIDAY PACKAGE`,
    paidStatus,
    travelDatesLabel,
    durationLabel,
    travellersLabel,
    destinationName: booking.destination.name,
    passengers,
    hotels,
    days: receipt ? itineraryDays : days,
    daysTitle: receipt ? "Itinerary" : undefined,
    additionalServices: receipt ? [] : additionalServices,
    payments,
    totalReceived,
    balanceDue,
    totalCost,
    costPerLabel,
    perPersonCost,
  };
}

/** One bullet per non-empty line; leading bullet marks ("•", "-", "*", ticks) are dropped. */
function bulletLines(text: string | null | undefined): string[] {
  return (text ?? "").split(/\r?\n/).map((l) => l.replace(/^\s*[•\-*✔✓✕✗]+\s*/, "").trim()).filter(Boolean);
}

/** "Rupees Fifty Nine Thousand Only" → "Rupees Fifty-Nine Thousand only" (how the sample reads). */
function receiptAmountWords(value: number) {
  return amountInWords(value)
    .replace(/\b(Twenty|Thirty|Forty|Fifty|Sixty|Seventy|Eighty|Ninety) (One|Two|Three|Four|Five|Six|Seven|Eight|Nine)\b/g, "$1-$2")
    .replace(/ Only$/, " only");
}

/** Builds the issued "Payment Receipt" payload — the trip receipt in the approved sample's wording,
 * plus Inclusions & Exclusions (from the linked quotation), an amount-in-words acknowledgement
 * and the SIC/Private footer note. Returns null until at least one customer payment is recorded —
 * callers should 400 rather than issue a receipt for nothing. */
export function buildPaymentReceiptData(booking: BookingWithRelations): TripReceiptPdfData | null {
  if (booking.customerPayments.length === 0) return null;

  const base = buildTripReceiptData(booking, "receipt");
  const fullyPaid = base.paidStatus === "full";
  const received = `${formatINRSymbol(base.totalReceived)}/- (${receiptAmountWords(base.totalReceived)})`;

  return {
    ...base,
    inclusions: bulletLines(booking.quotation?.inclusionsText),
    exclusions: bulletLines(booking.quotation?.exclusionsText),
    acknowledgement: fullyPaid
      ? { text: `We hereby acknowledge the receipt of ${received} as full and final payment towards the above ${booking.destination.name} booking.`, emphasis: "No balance is due." }
      : { text: `We hereby acknowledge the receipt of ${received} as part payment towards the above ${booking.destination.name} booking.`, emphasis: `Balance due: ${formatINRSymbol(base.balanceDue)}.` },
    footerNote: `This document confirms your booking and ${fullyPaid ? "full payment" : "payment"} received. Please carry a copy during your travel. SIC = Shared Transfer · Private = Dedicated Vehicle.`,
  };
}

const SALUTATION_RE = /^(mr|mrs|ms|miss|mstr|master|dr)\b\.?/i;

function utcGeneratedOn(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())} ${MONTH_SHORT[d.getUTCMonth()]}, ${d.getUTCFullYear()} - ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} Hrs UTC`;
}

/** Builds the Hotel Voucher ("Generate Hotel Voucher") payload — one entry (= one page) per
 * hotel. Hotels-section rows for the same hotel + confirmation number are merged into one page
 * whose table lists each row as a line item (rather than one row per night). Returns null when
 * the booking has no hotel rows yet — callers should 400 rather than render an empty document.
 *
 * Field mapping: D2D Booking ID = the booking's tracking code, Booking CNF = the hotel row's
 * Booking PNR, Trip ID = the booking's Supplier Track ID (Supplier Invoice section). */
export function buildHotelVoucherData(booking: BookingWithRelations): HotelTravelVoucherPdfData | null {
  if (booking.hotels.length === 0) return null;

  const bookingId = bookingCode(booking.lead.seq);
  const tripId = booking.supplierTrackId?.trim() || "—";
  const paxCount = booking.adults + booking.children;
  const occupancy = [
    `${booking.adults} ${booking.adults === 1 ? "Adult" : "Adults"}`,
    booking.children > 0 ? `${booking.children} ${booking.children === 1 ? "Child" : "Children"}` : null,
  ].filter(Boolean).join(", ");

  const leadPax = booking.passengers[0];
  const rawGuest = (leadPax?.name?.trim() || booking.lead.customerName || "").trim();
  const salutation = !rawGuest || SALUTATION_RE.test(rawGuest)
    ? ""
    : leadPax?.gender === "Male" ? "Mr." : leadPax?.gender === "Female" ? "Ms." : "";
  const guestName = [salutation, rawGuest].filter(Boolean).join(" ");

  const groups = new Map<string, typeof booking.hotels>();
  booking.hotels.forEach((h, i) => {
    const name = h.hotelName.trim().toLowerCase();
    const key = name ? `${name}|${h.bookingPnr.trim().toLowerCase()}` : `__row${i}`;
    groups.set(key, [...(groups.get(key) ?? []), h]);
  });

  const entries: HotelTravelVoucherEntry[] = Array.from(groups.values()).map((lines) => {
    const checkIns = lines.map((h) => h.checkIn).filter((d): d is Date => !!d);
    const checkOuts = lines.map((h) => h.checkOut).filter((d): d is Date => !!d);
    const checkIn = checkIns.length ? new Date(Math.min(...checkIns.map((d) => d.getTime()))) : null;
    const checkOut = checkOuts.length ? new Date(Math.max(...checkOuts.map((d) => d.getTime()))) : null;

    return {
      hotelName: lines[0].hotelName,
      hotelAddress: lines.find((h) => h.hotelAddress.trim())?.hotelAddress.trim() || booking.destination.name,
      guestName,
      occupancy,
      d2dBookingId: bookingId,
      bookingCnf: lines.find((h) => h.bookingPnr.trim())?.bookingPnr.trim() || "—",
      tripId,
      checkInDate: formatFullDateOrNull(checkIn),
      checkOutDate: formatFullDateOrNull(checkOut),
      nights: lines.reduce((sum, h) => sum + Math.max(h.nights, 0), 0),
      rows: lines.map((h) => {
        const roomLabel = [h.roomCategory, h.roomType].filter(Boolean).join(" ") || "Room";
        return {
          night: h.nights > 0 ? `${h.nights} ${h.nights === 1 ? "Night" : "Nights"}` : "—",
          dates: lines.length > 1 && h.checkIn && h.checkOut ? `${shortDate(h.checkIn)} – ${shortDate(h.checkOut)}` : null,
          mealPlan: h.mealPlan,
          room: `${h.rooms} ${roomLabel} (${paxCount} Pax)`,
        };
      }),
    };
  });

  return { entries, generatedOn: utcGeneratedOn(new Date()) };
}
