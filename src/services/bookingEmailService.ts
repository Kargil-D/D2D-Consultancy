import { prisma } from "@/lib/prisma";
import { getBooking, bookingCode, addBookingTimelineEvent } from "@/services/bookingService";
import { sendComposedEmail } from "@/services/emailService";
import { formatINR } from "@/utils/format";
import type { EmailRecipientType } from "@/generated/prisma/client";
import type { BookingEmailDraftInput, BookingSendEmailInput } from "@/lib/validation/bookingEmail";

type Booking = NonNullable<Awaited<ReturnType<typeof getBooking>>>;

const fmtDate = (d: Date | null | undefined) => (d ? d.toLocaleDateString("en-IN") : null);

/** `{{Key}}` → value, falling back to "N/A" for anything not supplied — the reusable placeholder mechanism shared by both templates. */
function renderPlaceholders(html: string, data: Record<string, string | null | undefined>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = data[key];
    return value && value.trim() ? value : "N/A";
  });
}

export async function getOrBuildEmailDraft(bookingId: string, recipientType: EmailRecipientType) {
  const saved = await prisma.bookingEmailDraft.findUnique({
    where: { bookingId_recipientType: { bookingId, recipientType } },
  });
  if (saved) return saved;

  const booking = await getBooking(bookingId);
  if (!booking) return null;

  const template = recipientType === "Customer" ? buildCustomerEmailTemplate(booking) : buildSupplierEmailTemplate(booking);
  return {
    id: "",
    bookingId,
    recipientType,
    toEmail: recipientType === "Customer" ? booking.lead.email ?? "" : "",
    cc: "",
    bcc: "",
    subject: template.subject,
    bodyHtml: template.bodyHtml,
    updatedDate: new Date(),
  };
}

export async function saveEmailDraft(bookingId: string, recipientType: EmailRecipientType, input: Omit<BookingEmailDraftInput, "recipientType">) {
  return prisma.bookingEmailDraft.upsert({
    where: { bookingId_recipientType: { bookingId, recipientType } },
    create: { bookingId, recipientType, ...input },
    update: { ...input },
  });
}

export async function sendBookingEmail(bookingId: string, input: BookingSendEmailInput) {
  const booking = await getBooking(bookingId);
  if (!booking) throw new Error("Booking not found");

  await sendComposedEmail(input.toEmail, { cc: input.cc, bcc: input.bcc, subject: input.subject, html: input.bodyHtml });

  await prisma.bookingEmailDraft.upsert({
    where: { bookingId_recipientType: { bookingId, recipientType: input.recipientType } },
    create: { bookingId, recipientType: input.recipientType, toEmail: input.toEmail, cc: input.cc, bcc: input.bcc, subject: input.subject, bodyHtml: input.bodyHtml },
    update: { toEmail: input.toEmail, cc: input.cc, bcc: input.bcc, subject: input.subject, bodyHtml: input.bodyHtml },
  });

  const label = input.recipientType === "Customer" ? "customer" : `supplier (${input.toEmail})`;
  await addBookingTimelineEvent(bookingId, `Email sent to ${label}`);
}

function buildCustomerEmailTemplate(booking: Booking): { subject: string; bodyHtml: string } {
  const code = bookingCode(booking.seq);
  const destinationName = booking.destination.name;
  const shareUrl = booking.quotation?.shareToken ? `/quote/${booking.quotation.shareToken}` : null;
  const hotelNames = booking.hotels.map((h) => h.hotelName).filter(Boolean).join(", ");

  const data: Record<string, string | null | undefined> = {
    Customer_Name: booking.lead.customerName,
    Booking_ID: code,
    Destination: destinationName,
    Travel_Start_Date: fmtDate(booking.travelDate),
    Travel_End_Date: fmtDate(booking.travelDate),
    Duration: booking.hotels.length ? `${booking.hotels.reduce((s, h) => s + h.nights, 0)} Nights` : null,
    Pax: booking.lead.travellerCount ? `${booking.lead.travellerCount}` : null,
    Hotel_Name: hotelNames,
  };

  const subject = renderPlaceholders("Booking Confirmation – {{Booking_ID}} | {{Destination}}", data);

  const packageLinkBlock = shareUrl
    ? `<h3>YOUR TRAVEL DETAILS</h3>
       <p>Please find your complete booked package and travel details below:</p>
       <p><a href="${shareUrl}">View Your Package &amp; Travel Details</a></p>`
    : "";

  const bodyHtml = `
    <p>Dear {{Customer_Name}},</p>
    <p>Greetings from <strong>Drive To Destination Holidays!</strong></p>
    <p>We are pleased to confirm your booking. Your package has been successfully booked.</p>

    <h3>YOUR BOOKING DETAILS</h3>
    <p>
      <strong>Booking ID:</strong> {{Booking_ID}}<br/>
      <strong>Destination:</strong> {{Destination}}<br/>
      <strong>Travel Date:</strong> {{Travel_Start_Date}}<br/>
      <strong>Duration:</strong> {{Duration}}<br/>
      <strong>No. of Travellers:</strong> {{Pax}}<br/>
      <strong>Hotel:</strong> {{Hotel_Name}}
    </p>

    ${packageLinkBlock}

    <h3>TRAVEL CHECKLIST</h3>
    <ul>
      <li>Passport &amp; required travel documents</li>
      <li>Visa / E-Visa, if applicable</li>
      <li>Flight tickets</li>
      <li>Hotel booking confirmation</li>
      <li>Travel insurance, if applicable</li>
      <li>Airport transfer details</li>
      <li>Foreign currency / international payment facility</li>
      <li>Important medicines &amp; personal essentials</li>
      <li>Copies of important documents</li>
    </ul>

    <h3>FURTHER ASSISTANCE</h3>
    <p>
      <strong>Service Team – David</strong><br/>9500121263<br/><br/>
      <strong>Sales Team – Safeer</strong><br/>9500121261
    </p>

    <p>Thank you for choosing <strong>Drive To Destination Holidays</strong>.</p>
    <p>Wishing you a wonderful and memorable journey!</p>
    <p><strong>Drive To Destination Holidays</strong><br/>Travel Made Easy. Memories Made Forever.</p>
  `.trim();

  return { subject, bodyHtml: renderPlaceholders(bodyHtml, data) };
}

function buildSupplierEmailTemplate(booking: Booking): { subject: string; bodyHtml: string } {
  const code = bookingCode(booking.seq);
  const destinationName = booking.destination.name;
  const totalRooms = booking.hotels.reduce((s, h) => s + h.rooms, 0);
  const totalSupplierCost = booking.costSheet.reduce((s, c) => s + c.bookingCost, 0);

  const data: Record<string, string | null | undefined> = {
    Booking_ID: code,
    Supplier_Reference: booking.dmcName,
    Destination: destinationName,
    Travel_Start_Date: fmtDate(booking.travelDate),
    Travel_End_Date: fmtDate(booking.travelDate),
    Pax: booking.lead.travellerCount ? `${booking.lead.travellerCount}` : null,
    Adults: booking.lead.adults != null ? `${booking.lead.adults}` : null,
    Children: booking.lead.children != null ? `${booking.lead.children}` : null,
    Rooms: totalRooms ? `${totalRooms}` : null,
    Lead_Passenger_Name: booking.lead.customerName,
    Customer_Phone: booking.lead.mobile,
    Customer_Email: booking.lead.email,
    Supplier_Cost: totalSupplierCost ? formatINR(totalSupplierCost) : null,
  };

  const subject = renderPlaceholders("Booking Request – {{Booking_ID}} | {{Destination}} | {{Travel_Start_Date}}", data);

  const hotelBlock = booking.hotels.length
    ? `<h3>HOTEL / ACCOMMODATION DETAILS</h3>` +
      booking.hotels
        .map(
          (h) => `<p>
            <strong>Hotel Name:</strong> ${h.hotelName || "N/A"}<br/>
            <strong>Room Category:</strong> ${h.roomCategory || "N/A"}<br/>
            <strong>Room Basis:</strong> ${h.roomType || "N/A"}<br/>
            <strong>Meal Plan:</strong> ${h.mealPlan || "N/A"}<br/>
            <strong>Check-in:</strong> ${fmtDate(h.checkIn) ?? "N/A"}<br/>
            <strong>Check-out:</strong> ${fmtDate(h.checkOut) ?? "N/A"}<br/>
            <strong>No. of Nights:</strong> ${h.nights || "N/A"}
          </p>`,
        )
        .join("")
    : "";

  const flightBlock = booking.flights.length
    ? `<h3>FLIGHT DETAILS</h3>` +
      booking.flights
        .map(
          (f) => `<p>
            <strong>Flight:</strong> ${f.airline || "N/A"} ${f.flightNumber || ""}<br/>
            <strong>Route:</strong> ${f.fromLocation || "N/A"} → ${f.toLocation || "N/A"}<br/>
            <strong>Departure:</strong> ${f.departureAt ? f.departureAt.toLocaleString("en-IN") : "N/A"}<br/>
            <strong>Arrival:</strong> ${f.arrivalAt ? f.arrivalAt.toLocaleString("en-IN") : "N/A"}
          </p>`,
        )
        .join("")
    : "";

  const transferBlock = booking.transfers.length
    ? `<h3>TRANSFER DETAILS</h3>` +
      booking.transfers
        .map(
          (t) => `<p>
            <strong>${t.transferType || "Transfer"}:</strong> ${t.pickupLocation || "N/A"} → ${t.dropLocation || "N/A"}<br/>
            <strong>Vehicle:</strong> ${t.vehicleType || "N/A"} (${t.mode})<br/>
            <strong>Pickup At:</strong> ${t.pickupAt ? t.pickupAt.toLocaleString("en-IN") : "N/A"}
          </p>`,
        )
        .join("")
    : "";

  const activityBlock = booking.activities.length
    ? `<h3>ACTIVITIES / ATTRACTIONS</h3>` +
      booking.activities
        .map(
          (a) => `<p>
            <strong>${a.activityName || "Activity"}</strong> — ${fmtDate(a.activityDate) ?? "N/A"} ${a.activityTime || ""}<br/>
            <strong>Duration:</strong> ${a.duration || "N/A"} &middot; <strong>Pax:</strong> ${a.pax || "N/A"} &middot; <strong>Type:</strong> ${a.tourType}
          </p>`,
        )
        .join("")
    : "";

  const bodyHtml = `
    <p>Dear Team,</p>
    <p>Greetings from <strong>Drive To Destination Holidays!</strong></p>
    <p>Please find below the confirmed booking details for our mutual customer. Kindly proceed with the arrangements as per the confirmed itinerary and services.</p>

    <h3>BOOKING DETAILS</h3>
    <p>
      <strong>Booking ID:</strong> {{Booking_ID}}<br/>
      <strong>Supplier / DMC Reference:</strong> {{Supplier_Reference}}<br/>
      <strong>Destination:</strong> {{Destination}}<br/>
      <strong>Travel Date:</strong> {{Travel_Start_Date}}<br/>
      <strong>Total Pax:</strong> {{Pax}} (Adults: {{Adults}}, Children: {{Children}})<br/>
      <strong>No. of Rooms:</strong> {{Rooms}}
    </p>

    <h3>PASSENGER DETAILS</h3>
    <p>
      <strong>Lead Passenger Name:</strong> {{Lead_Passenger_Name}}<br/>
      <strong>Contact Number:</strong> {{Customer_Phone}}<br/>
      <strong>Email:</strong> {{Customer_Email}}
    </p>

    ${hotelBlock}
    ${flightBlock}
    ${transferBlock}
    ${activityBlock}

    <h3>BOOKING / PAYMENT DETAILS</h3>
    <p><strong>Total Supplier Cost:</strong> {{Supplier_Cost}}</p>

    <p>Please ensure all the above services are arranged as per the confirmed booking and itinerary.</p>
    <p>Thank you for your support and cooperation.</p>

    <p>Best Regards,<br/><strong>Drive To Destination Holidays</strong></p>
    <p>
      <strong>Service Team – David</strong><br/>9500121263<br/><br/>
      <strong>Sales Team – Safeer</strong><br/>9500121261
    </p>
  `.trim();

  return { subject, bodyHtml: renderPlaceholders(bodyHtml, data) };
}
