import { Document, Page, Text, View, Svg, Path, Defs, LinearGradient, Stop, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { SUPPORT_PHONES, SUPPORT_EMAIL } from "@/data/contact";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, fontFamily: "Helvetica", color: "#1e293b" },
  header: { marginBottom: 20, paddingBottom: 14, borderBottom: "2 solid #06b6d4" },
  brand: { fontSize: 18, fontWeight: 700, color: "#0f766e" },
  tagline: { fontSize: 9, color: "#64748b", marginTop: 2 },
  title: { fontSize: 16, fontWeight: 700, marginTop: 16, marginBottom: 4 },
  meta: { fontSize: 10, color: "#475569", marginBottom: 2 },
  section: { marginTop: 18 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 8 },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 8, color: "#94a3b8", textAlign: "center" },
});

export interface ServiceVoucherPdfData {
  bookingCode: string;
  customerName: string;
  mobile: string;
  serviceLabel: string;
  title: string;
  fields: { label: string; value: string }[];
}

const serviceStyles = StyleSheet.create({
  detailRow: { flexDirection: "row", borderBottom: "1 solid #e2e8f0", paddingVertical: 8 },
  detailLabel: { width: 160, fontSize: 10, color: "#64748b", fontWeight: 700 },
  detailValue: { flex: 1, fontSize: 11 },
});

function ServiceVoucherDocument({ data }: { data: ServiceVoucherPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>D2D Holidays</Text>
          <Text style={styles.tagline}>Drive to Destination</Text>
        </View>

        <Text style={styles.title}>{data.serviceLabel} Voucher</Text>
        <Text style={styles.meta}>Booking ID: {data.bookingCode}</Text>
        <Text style={styles.meta}>Guest: {data.customerName}</Text>
        <Text style={styles.meta}>Mobile: {data.mobile}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{data.title}</Text>
          {data.fields.map((f, i) => (
            <View style={serviceStyles.detailRow} key={i}>
              <Text style={serviceStyles.detailLabel}>{f.label}</Text>
              <Text style={serviceStyles.detailValue}>{f.value || "—"}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Please carry a copy of this voucher and a valid photo ID during your trip. D2D Holidays — Drive to Destination.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderServiceVoucherPdf(data: ServiceVoucherPdfData): Promise<Buffer> {
  return renderToBuffer(<ServiceVoucherDocument data={data} />);
}

/**
 * Full trip "Payment Received" receipt — one page (auto-paginating), laid out to match the
 * D2D_Receipt_TEMPLATE.html reference tool: header rule, package band with paid badge, trip
 * summary strip, passenger cards, per-hotel accommodation blocks, day-by-day transport/activity
 * itinerary, and a payment acknowledgement + cost summary.
 */
export interface TripReceiptPassenger {
  role: string;
  name: string;
  phone: string;
  email: string | null;
}

export interface TripReceiptHotel {
  nightsLabel: string;
  location: string;
  checkInLabel: string;
  checkOutLabel: string;
  hotelName: string;
  stars: number;
  mealPlan: string;
  roomDetail: string;
  amenities: string[];
}

export interface TripReceiptDay {
  label: string;
  items: string[];
}

export interface TripReceiptPayment {
  label: string;
  amount: number;
  dateLabel: string;
}

export interface TripReceiptPdfData {
  bookingId: string;
  issuedOn: string;
  packageTitle: string;
  paidStatus: "full" | "partial" | "pending";
  travelDatesLabel: string;
  durationLabel: string;
  travellersLabel: string;
  destinationName: string;
  passengers: TripReceiptPassenger[];
  hotels: TripReceiptHotel[];
  days: TripReceiptDay[];
  additionalServices: string[];
  payments: TripReceiptPayment[];
  totalReceived: number;
  balanceDue: number;
  totalCost: number;
  costPerLabel: string;
  perPersonCost: number;
}

const RC = {
  ink: "#2a3547",
  teal: "#17b3ac",
  tealDark: "#1f9e97",
  paidBg: "#0e7a5f",
  partialBg: "#b45309",
  pendingBg: "#b91c1c",
  muted: "#7a8699",
  muted2: "#8a94a6",
  body: "#5a6577",
  line: "#e2e8f0",
  line2: "#e8edf2",
  lightBg: "#f9fbfc",
  headBg: "#f4f7f9",
  tealBg: "#e6f7f5",
  gold: "#f0a500",
  dashLine: "#d4dce4",
};

function formatINRSymbol(value: number) {
  return `₹${new Intl.NumberFormat("en-IN").format(Math.round(value))}`;
}

const rcStyles = StyleSheet.create({
  page: { paddingTop: 32, paddingHorizontal: 34, paddingBottom: 30, fontSize: 10, fontFamily: "Helvetica", color: RC.ink },

  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 14, borderBottom: `3 solid ${RC.teal}` },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  logoWordD2D: { fontSize: 12, fontWeight: 700, color: RC.ink },
  logoWordHolidays: { fontSize: 12, fontWeight: 700, color: RC.teal },
  logoTagline: { fontSize: 5.5, letterSpacing: 1.2, color: RC.muted, marginTop: 1 },
  docMeta: { alignItems: "flex-end" },
  docTitle: { fontSize: 14, fontWeight: 700, color: RC.ink, letterSpacing: 0.5 },
  docId: { fontSize: 11, color: RC.teal, fontWeight: 700, marginTop: 3 },
  docIssued: { fontSize: 8.5, color: RC.muted, marginTop: 2 },

  band: { backgroundColor: RC.tealDark, color: "#ffffff", paddingVertical: 11, paddingHorizontal: 16, borderRadius: 8, marginTop: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bandTitle: { fontSize: 15, fontWeight: 700, letterSpacing: 1, color: "#ffffff" },
  paidPill: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20, fontSize: 9, fontWeight: 700, letterSpacing: 0.5, color: "#ffffff" },

  summary: { flexDirection: "row", marginTop: 14, borderWidth: 1, borderColor: RC.line, borderStyle: "solid", borderRadius: 8 },
  summaryCell: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRightWidth: 1, borderRightColor: RC.line, borderRightStyle: "solid" },
  summaryCellLast: { borderRightWidth: 0 },
  summaryLbl: { fontSize: 7.5, textTransform: "uppercase", letterSpacing: 0.5, color: RC.muted2, fontWeight: 700 },
  summaryVal: { fontSize: 11, fontWeight: 700, color: RC.ink, marginTop: 3 },

  secH: { fontSize: 11.5, fontWeight: 700, color: RC.tealDark, textTransform: "uppercase", letterSpacing: 0.7, marginTop: 20, marginBottom: 9, paddingLeft: 9, borderLeftWidth: 4, borderLeftColor: RC.teal, borderLeftStyle: "solid" },

  paxWrap: { flexDirection: "row", gap: 12 },
  pax: { flex: 1, borderWidth: 1, borderColor: RC.line, borderStyle: "solid", borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: RC.lightBg },
  paxRole: { fontSize: 7.5, textTransform: "uppercase", letterSpacing: 0.5, color: RC.teal, fontWeight: 700 },
  paxName: { fontSize: 12, fontWeight: 700, marginTop: 3, marginBottom: 4 },
  paxContact: { fontSize: 9, color: RC.body, marginTop: 1 },
  paxContactLbl: { color: RC.muted2 },

  hotel: { borderWidth: 1, borderColor: RC.line, borderStyle: "solid", borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 9, flexDirection: "row", gap: 12 },
  hotelStay: { width: 96, borderRightWidth: 1, borderRightColor: RC.line2, borderRightStyle: "solid", paddingRight: 12 },
  hotelNights: { fontSize: 10, fontWeight: 700, color: RC.ink },
  hotelLoc: { fontSize: 9, color: RC.teal, fontWeight: 700, marginTop: 2 },
  hotelDates: { fontSize: 8, color: RC.muted2, marginTop: 5 },
  hotelInfo: { flex: 1 },
  hotelNameRow: { fontSize: 11, fontWeight: 700 },
  hotelStars: { color: RC.gold, fontSize: 9 },
  hotelDetail: { fontSize: 9, color: RC.body, marginTop: 4 },
  hotelBadge: { alignSelf: "flex-start", marginTop: 5, backgroundColor: RC.tealBg, color: RC.paidBg, fontSize: 8, fontWeight: 600, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 12 },

  day: { marginBottom: 10 },
  dayH: { fontSize: 9.5, fontWeight: 700, color: "#ffffff", backgroundColor: RC.ink, alignSelf: "flex-start", paddingVertical: 3, paddingHorizontal: 10, borderRadius: 5, marginBottom: 5 },
  dayItem: { flexDirection: "row", fontSize: 9, color: "#3a4657", paddingVertical: 2, paddingLeft: 2 },
  dayArrow: { color: RC.teal, fontWeight: 700, width: 12 },
  dayText: { flex: 1 },

  payCols: { flexDirection: "row", gap: 12, marginTop: 2 },
  payBox: { flex: 1, borderWidth: 1, borderColor: RC.line, borderStyle: "solid", borderRadius: 8 },
  payRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, paddingHorizontal: 14, fontSize: 10, borderBottomWidth: 1, borderBottomColor: RC.line2, borderBottomStyle: "solid" },
  payRowLast: { borderBottomWidth: 0 },
  payRowHead: { backgroundColor: RC.headBg, fontWeight: 700, color: RC.ink },
  payRowTotal: { backgroundColor: RC.tealBg, fontWeight: 700, fontSize: 11, color: RC.paidBg },
  payK: { color: RC.body },
  payV: { fontWeight: 700 },

  costCard: { flex: 1, borderWidth: 1, borderColor: RC.line, borderStyle: "solid", borderRadius: 8, padding: 14, textAlign: "center", backgroundColor: RC.lightBg },
  costAmt: { fontSize: 21, fontWeight: 700, color: RC.tealDark },
  costLbl: { fontSize: 8, textTransform: "uppercase", letterSpacing: 0.5, color: RC.muted2, marginTop: 3 },
  costPp: { fontSize: 9, color: RC.body, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: RC.dashLine, borderTopStyle: "dashed" },

  footer: { marginTop: 22, textAlign: "center", borderTopWidth: 2, borderTopColor: RC.teal, borderTopStyle: "solid", paddingTop: 12 },
  footerThanks: { fontSize: 11, fontWeight: 700, color: RC.tealDark },
  footerNote: { fontSize: 8, color: "#9aa4b4", marginTop: 5, lineHeight: 1.5 },
  footerContact: { marginTop: 7, color: RC.ink, fontWeight: 700, fontSize: 9 },
});

function ReceiptLogo() {
  return (
    <View style={rcStyles.logoRow}>
      <Svg width={20} height={20} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="rcPlaneGrad" x1="0" y1="0" x2="100" y2="100">
            <Stop offset="0" stopColor={RC.teal} />
            <Stop offset="1" stopColor={RC.tealDark} />
          </LinearGradient>
        </Defs>
        <Path d="M97 2 L2 26 L39 48 Z" fill="url(#rcPlaneGrad)" />
        <Path d="M97 2 L51 59 L73 99 Z" fill={RC.tealDark} opacity={0.9} />
      </Svg>
      <View>
        <Text><Text style={rcStyles.logoWordD2D}>D2D </Text><Text style={rcStyles.logoWordHolidays}>Holidays</Text></Text>
        <Text style={rcStyles.logoTagline}>DRIVE TO DESTINATION</Text>
      </View>
    </View>
  );
}

const PAID_LABEL: Record<TripReceiptPdfData["paidStatus"], string> = {
  full: "✓ FULLY PAID",
  partial: "PARTIALLY PAID",
  pending: "PAYMENT PENDING",
};
const PAID_BG: Record<TripReceiptPdfData["paidStatus"], string> = {
  full: RC.paidBg,
  partial: RC.partialBg,
  pending: RC.pendingBg,
};

function Stars({ count }: { count: number }) {
  if (count <= 0) return null;
  return <Text style={rcStyles.hotelStars}> {"★".repeat(count)}</Text>;
}

function TripReceiptDocument({ data }: { data: TripReceiptPdfData }) {
  return (
    <Document>
      <Page size="A4" style={rcStyles.page}>
        <View style={rcStyles.head}>
          <ReceiptLogo />
          <View style={rcStyles.docMeta}>
            <Text style={rcStyles.docTitle}>PAYMENT RECEIVED</Text>
            <Text style={rcStyles.docId}>Booking ID: {data.bookingId}</Text>
            <Text style={rcStyles.docIssued}>Issued: {data.issuedOn}</Text>
          </View>
        </View>

        <View style={rcStyles.band}>
          <Text style={rcStyles.bandTitle}>{data.packageTitle}</Text>
          <Text style={[rcStyles.paidPill, { backgroundColor: PAID_BG[data.paidStatus] }]}>{PAID_LABEL[data.paidStatus]}</Text>
        </View>

        <View style={rcStyles.summary}>
          <View style={rcStyles.summaryCell}>
            <Text style={rcStyles.summaryLbl}>Travel Dates</Text>
            <Text style={rcStyles.summaryVal}>{data.travelDatesLabel}</Text>
          </View>
          <View style={rcStyles.summaryCell}>
            <Text style={rcStyles.summaryLbl}>Duration</Text>
            <Text style={rcStyles.summaryVal}>{data.durationLabel}</Text>
          </View>
          <View style={rcStyles.summaryCell}>
            <Text style={rcStyles.summaryLbl}>Travellers</Text>
            <Text style={rcStyles.summaryVal}>{data.travellersLabel}</Text>
          </View>
          <View style={[rcStyles.summaryCell, rcStyles.summaryCellLast]}>
            <Text style={rcStyles.summaryLbl}>Destination</Text>
            <Text style={rcStyles.summaryVal}>{data.destinationName}</Text>
          </View>
        </View>

        {data.passengers.length > 0 && (
          <>
            <Text style={rcStyles.secH}>Passenger Details</Text>
            <View style={rcStyles.paxWrap}>
              {data.passengers.map((p, i) => (
                <View style={rcStyles.pax} key={i}>
                  <Text style={rcStyles.paxRole}>{p.role}</Text>
                  <Text style={rcStyles.paxName}>{p.name || "—"}</Text>
                  {p.phone ? <Text style={rcStyles.paxContact}><Text style={rcStyles.paxContactLbl}>Phone: </Text>{p.phone}</Text> : null}
                  {p.email ? <Text style={rcStyles.paxContact}><Text style={rcStyles.paxContactLbl}>Email: </Text>{p.email}</Text> : null}
                </View>
              ))}
            </View>
          </>
        )}

        {data.hotels.length > 0 && (
          <>
            <Text style={rcStyles.secH}>Accommodation</Text>
            {data.hotels.map((h, i) => (
              <View style={rcStyles.hotel} key={i} wrap={false}>
                <View style={rcStyles.hotelStay}>
                  <Text style={rcStyles.hotelNights}>{h.nightsLabel}</Text>
                  {h.location ? <Text style={rcStyles.hotelLoc}>{h.location}</Text> : null}
                  <Text style={rcStyles.hotelDates}>In: {h.checkInLabel}{"\n"}Out: {h.checkOutLabel}</Text>
                </View>
                <View style={rcStyles.hotelInfo}>
                  <Text style={rcStyles.hotelNameRow}>{h.hotelName || "—"}<Stars count={h.stars} /></Text>
                  <Text style={rcStyles.hotelDetail}>{h.mealPlan || "—"} • {h.roomDetail}</Text>
                  {h.amenities.length > 0 && <Text style={rcStyles.hotelBadge}>{h.amenities.join(", ")}</Text>}
                </View>
              </View>
            ))}
          </>
        )}

        {(data.days.length > 0 || data.additionalServices.length > 0) && (
          <>
            <Text style={rcStyles.secH}>Transportation &amp; Activities</Text>
            {data.days.map((d, i) => (
              <View style={rcStyles.day} key={i} wrap={false}>
                <Text style={rcStyles.dayH}>{d.label}</Text>
                {d.items.map((item, j) => (
                  <View style={rcStyles.dayItem} key={j}>
                    <Text style={rcStyles.dayArrow}>{"›"}</Text>
                    <Text style={rcStyles.dayText}>{item}</Text>
                  </View>
                ))}
              </View>
            ))}
            {data.additionalServices.length > 0 && (
              <View style={rcStyles.day} wrap={false}>
                <Text style={rcStyles.dayH}>Additional Services</Text>
                {data.additionalServices.map((item, j) => (
                  <View style={rcStyles.dayItem} key={j}>
                    <Text style={rcStyles.dayArrow}>{"›"}</Text>
                    <Text style={rcStyles.dayText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <Text style={rcStyles.secH}>Payment Acknowledgement</Text>
        <View style={rcStyles.payCols} wrap={false}>
          <View style={rcStyles.payBox}>
            <View style={[rcStyles.payRow, rcStyles.payRowHead]}>
              <Text>Payment</Text>
              <Text>Amount / Date</Text>
            </View>
            {data.payments.map((p, i) => (
              <View style={rcStyles.payRow} key={i}>
                <Text style={rcStyles.payK}>{p.label}</Text>
                <Text style={rcStyles.payV}>{formatINRSymbol(p.amount)} · {p.dateLabel}</Text>
              </View>
            ))}
            <View style={[rcStyles.payRow, rcStyles.payRowTotal]}>
              <Text>Total Received</Text>
              <Text>{formatINRSymbol(data.totalReceived)}</Text>
            </View>
            <View style={[rcStyles.payRow, rcStyles.payRowLast]}>
              <Text style={rcStyles.payK}>Balance Due</Text>
              <Text style={[rcStyles.payV, { color: data.balanceDue <= 0 ? RC.paidBg : RC.ink }]}>{formatINRSymbol(data.balanceDue)}</Text>
            </View>
          </View>
          <View style={rcStyles.costCard}>
            <Text style={rcStyles.costLbl}>Total Package Cost</Text>
            <Text style={rcStyles.costAmt}>{formatINRSymbol(data.totalCost)}</Text>
            <Text style={rcStyles.costLbl}>{data.costPerLabel}</Text>
            <Text style={rcStyles.costPp}>Per Person: {formatINRSymbol(data.perPersonCost)}</Text>
          </View>
        </View>

        <View style={rcStyles.footer}>
          <Text style={rcStyles.footerThanks}>Thank you for choosing D2D Holidays!</Text>
          <Text style={rcStyles.footerNote}>
            This document is a confirmation of your booking and payment. Please carry a copy during your travel.{"\n"}
            Drive To Destination · For assistance, contact your D2D Holidays travel coordinator.
          </Text>
          <Text style={rcStyles.footerContact}>Phone: {SUPPORT_PHONES.join(", ")} &nbsp;·&nbsp; Email: {SUPPORT_EMAIL}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderTripReceiptPdf(data: TripReceiptPdfData): Promise<Buffer> {
  return renderToBuffer(<TripReceiptDocument data={data} />);
}
