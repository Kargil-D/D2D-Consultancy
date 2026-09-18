import { getBooking, bookingCode } from "@/services/bookingService";
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
const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];

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
function ordinal(n: number) {
  return ORDINALS[n - 1] ?? `${n}th`;
}

/** Builds the full trip receipt ("Generate Travel Voucher") payload — trip summary, passengers,
 * accommodation, day-by-day transport/activities, and payment acknowledgement. Same document for
 * admin and the customer's own self-service download; only the auth/ownership check differs
 * between the two routes that call this. */
export function buildTripReceiptData(booking: BookingWithRelations): TripReceiptPdfData {
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
    travelDatesLabel = tripStart.getMonth() === tripEnd.getMonth() && tripStart.getFullYear() === tripEnd.getFullYear()
      ? `${tripStart.getDate()} - ${tripEnd.getDate()} ${MONTH_SHORT[tripEnd.getMonth()]} ${tripEnd.getFullYear()}`
      : `${shortDate(tripStart)} - ${shortDate(tripEnd)} ${tripEnd.getFullYear()}`;
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

  // ---- accommodation ----
  let runningNight = 1;
  const hotels = booking.hotels.map((h) => {
    const nights = Math.max(h.nights, 0);
    const nightsLabel = nights <= 0
      ? "Stay"
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
      roomDetail: `${h.rooms} ${roomLabel} (${paxCount} Pax)`,
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

  // ---- payments ----
  const paymentsAsc = [...booking.customerPayments].sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime());
  const totalReceived = paymentsAsc.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = Math.max(0, booking.totalAmount - totalReceived);
  const paidStatus: TripReceiptPdfData["paidStatus"] = totalReceived <= 0 ? "pending" : balanceDue <= 0 ? "full" : "partial";
  const payments = paymentsAsc.map((p, i) => ({
    label: `Payment ${i + 1}`,
    amount: p.amount,
    dateLabel: shortDateYear(p.paymentDate),
  }));

  const costPerLabel = booking.adults === 2 && booking.children === 0 ? "per Couple" : `per ${paxCount || 1} Pax`;
  const perPersonCost = booking.totalAmount / (paxCount || 1);

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
    days,
    additionalServices,
    payments,
    totalReceived,
    balanceDue,
    totalCost: booking.totalAmount,
    costPerLabel,
    perPersonCost,
  };
}

/** Builds the per-hotel-stay voucher ("Generate Hotel Voucher") payload. Returns null when the
 * booking has no hotel rows yet — callers should 400 rather than render an empty document. */
export function buildHotelVoucherData(booking: BookingWithRelations): HotelTravelVoucherPdfData | null {
  if (booking.hotels.length === 0) return null;

  const tripCode = bookingCode(booking.lead.seq);
  const occupancy = [
    `${booking.adults} ${booking.adults === 1 ? "Adult" : "Adults"}`,
    booking.children > 0 ? `${booking.children} ${booking.children === 1 ? "Child" : "Children"}` : null,
  ].filter(Boolean).join(", ");
  const paxCount = booking.adults + booking.children;

  const entries: HotelTravelVoucherEntry[] = booking.hotels.map((h) => {
    const roomLabel = [h.roomCategory, h.roomType].filter(Boolean).join(" ") || "Room";
    const rows = Array.from({ length: Math.max(h.nights, 1) }, (_, i) => ({
      night: ordinal(i + 1),
      mealPlan: h.mealPlan,
      room: `${h.rooms} ${roomLabel} (${paxCount} Pax)`,
    }));

    return {
      hotelName: h.hotelName,
      hotelAddress: h.hotelAddress,
      guestName: booking.lead.customerName,
      occupancy,
      d2dBookingId: `D2D-${tripCode}`,
      bookingCnf: h.bookingPnr || "—",
      tripId: tripCode,
      checkInDate: formatFullDateOrNull(h.checkIn),
      checkOutDate: formatFullDateOrNull(h.checkOut),
      nights: h.nights,
      rows,
    };
  });

  const generatedOn = new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC",
  }).replace(",", "") + " Hrs UTC";

  return { entries, generatedOn };
}
