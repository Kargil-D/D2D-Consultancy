import { Document, Page, Text, View, Svg, Path, Circle, Defs, LinearGradient, Stop, StyleSheet, Font, renderToBuffer } from "@react-pdf/renderer";
import { SUPPORT_PHONES, SUPPORT_EMAIL } from "@/data/contact";
import { PDF_SYMBOL_FONT_REGULAR, PDF_SYMBOL_FONT_BOLD, PDF_SYMBOL_GLYPHS } from "@/lib/pdfSymbolFont";

// Helvetica can't draw ₹ → ★ ✓ (see pdfSymbolFont.ts) — those characters alone are set in this font.
Font.register({
  family: "D2DSymbols",
  fonts: [
    { src: PDF_SYMBOL_FONT_REGULAR, fontWeight: 400 },
    { src: PDF_SYMBOL_FONT_BOLD, fontWeight: 700 },
  ],
});
const SYMBOL_SPLIT = new RegExp(`([${PDF_SYMBOL_GLYPHS}]+)`);

/** Text that may contain ₹ / arrows / stars / ticks: those runs use the symbol font, the rest inherits
 * the surrounding style (size, weight, colour). Must sit inside a <Text>. */
function Sym({ children }: { children: string }) {
  return (
    <>
      {children.split(SYMBOL_SPLIT).map((part, i) =>
        i % 2 === 1 ? <Text key={i} style={{ fontFamily: "D2DSymbols" }}>{part}</Text> : part,
      )}
    </>
  );
}

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
  /** Optional extras used by the issued Payment Receipt — when absent the classic layout is unchanged. */
  /** Heading for the days block — defaults to "Transportation & Activities". */
  daysTitle?: string;
  inclusions?: string[];
  exclusions?: string[];
  acknowledgement?: { text: string; emphasis: string };
  footerNote?: string;
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

export function formatINRSymbol(value: number) {
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

  incExcWrap: { flexDirection: "row", gap: 12 },
  incBox: { flex: 1, borderWidth: 1, borderColor: "#d7efe9", borderStyle: "solid", borderRadius: 8, padding: 12, backgroundColor: "#f0faf8" },
  excBox: { flex: 1, borderWidth: 1, borderColor: "#f5d9d9", borderStyle: "solid", borderRadius: 8, padding: 12, backgroundColor: "#fef5f5" },
  incExcTitle: { fontSize: 10.5, fontWeight: 700, marginBottom: 7 },
  incExcItem: { flexDirection: "row", fontSize: 8.5, color: "#3a4657", paddingVertical: 2 },
  incExcMark: { width: 12, fontWeight: 700 },
  incExcText: { flex: 1 },

  ackBox: { marginTop: 12, borderLeftWidth: 3, borderLeftColor: RC.paidBg, borderLeftStyle: "solid", borderRadius: 6, backgroundColor: "#f0faf8", paddingVertical: 10, paddingHorizontal: 14, fontSize: 10, lineHeight: 1.5, color: RC.ink },

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
  return <Text style={rcStyles.hotelStars}> <Sym>{"★".repeat(count)}</Sym></Text>;
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
          <Text style={[rcStyles.paidPill, { backgroundColor: PAID_BG[data.paidStatus] }]}><Sym>{PAID_LABEL[data.paidStatus]}</Sym></Text>
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
                  {/* The issued Payment Receipt (only document that sets `acknowledgement`) omits amenities; the Travel Voucher keeps them. Hidden at render time rather than in the builder so issued snapshots and their stale-check hashes stay valid. */}
                  {!data.acknowledgement && h.amenities.length > 0 && <Text style={rcStyles.hotelBadge}>{h.amenities.join(", ")}</Text>}
                </View>
              </View>
            ))}
          </>
        )}

        {(data.days.length > 0 || data.additionalServices.length > 0) && (
          <>
            <Text style={rcStyles.secH}>{data.daysTitle ?? "Transportation & Activities"}</Text>
            {data.days.map((d, i) => (
              <View style={rcStyles.day} key={i} wrap={false}>
                <Text style={rcStyles.dayH}>{d.label}</Text>
                {d.items.map((item, j) => (
                  <View style={rcStyles.dayItem} key={j}>
                    <Text style={rcStyles.dayArrow}>{"›"}</Text>
                    <Text style={rcStyles.dayText}><Sym>{item}</Sym></Text>
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
                    <Text style={rcStyles.dayText}><Sym>{item}</Sym></Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {((data.inclusions?.length ?? 0) > 0 || (data.exclusions?.length ?? 0) > 0) && (
          <>
            <Text style={rcStyles.secH} minPresenceAhead={120}>Inclusions &amp; Exclusions</Text>
            <View style={rcStyles.incExcWrap}>
              <View style={rcStyles.incBox}>
                <Text style={[rcStyles.incExcTitle, { color: RC.paidBg }]}><Sym>✔</Sym> Inclusions</Text>
                {(data.inclusions ?? []).map((item, i) => (
                  <View style={rcStyles.incExcItem} key={i} wrap={false}>
                    <Text style={[rcStyles.incExcMark, { color: RC.paidBg }]}><Sym>✔</Sym></Text>
                    <Text style={rcStyles.incExcText}><Sym>{item}</Sym></Text>
                  </View>
                ))}
              </View>
              <View style={rcStyles.excBox}>
                <Text style={[rcStyles.incExcTitle, { color: RC.pendingBg }]}><Sym>✕</Sym> Exclusions</Text>
                {(data.exclusions ?? []).map((item, i) => (
                  <View style={rcStyles.incExcItem} key={i} wrap={false}>
                    <Text style={[rcStyles.incExcMark, { color: RC.pendingBg }]}><Sym>✕</Sym></Text>
                    <Text style={rcStyles.incExcText}><Sym>{item}</Sym></Text>
                  </View>
                ))}
              </View>
            </View>
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
                <Text style={rcStyles.payV}><Sym>{`${formatINRSymbol(p.amount)} · ${p.dateLabel}`}</Sym></Text>
              </View>
            ))}
            <View style={[rcStyles.payRow, rcStyles.payRowTotal]}>
              <Text>Total Received</Text>
              <Text><Sym>{formatINRSymbol(data.totalReceived)}</Sym></Text>
            </View>
            <View style={[rcStyles.payRow, rcStyles.payRowLast]}>
              <Text style={rcStyles.payK}>Balance Due</Text>
              <Text style={[rcStyles.payV, { color: data.balanceDue <= 0 ? RC.paidBg : RC.ink }]}><Sym>{formatINRSymbol(data.balanceDue)}</Sym></Text>
            </View>
          </View>
          <View style={rcStyles.costCard}>
            <Text style={rcStyles.costLbl}>Total Package Cost</Text>
            <Text style={rcStyles.costAmt}><Sym>{formatINRSymbol(data.totalCost)}</Sym></Text>
            <Text style={rcStyles.costLbl}>{data.costPerLabel}</Text>
            <Text style={rcStyles.costPp}><Sym>{`Per Person: ${formatINRSymbol(data.perPersonCost)}`}</Sym></Text>
          </View>
        </View>

        {data.acknowledgement && (
          <Text style={rcStyles.ackBox} wrap={false}>
            <Sym>{data.acknowledgement.text}</Sym> <Text style={{ fontWeight: 700 }}><Sym>{data.acknowledgement.emphasis}</Sym></Text>
          </Text>
        )}

        <View style={rcStyles.footer} wrap={false}>
          <Text style={rcStyles.footerThanks}>Thank you for choosing D2D Holidays!</Text>
          <Text style={rcStyles.footerNote}>
            {data.footerNote ?? "This document is a confirmation of your booking and payment. Please carry a copy during your travel."}{"\n"}
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

/**
 * "Hotel Voucher" — one page per hotel (same hotel + confirmation number), laid out to match the
 * approved sample (Golden_Beach_Voucher_D2D.pdf): header rule, hotel/guest columns, ref bar,
 * stay box, line-item table, notes, footer rule. Table rows are the Hotels-section line items
 * that belong to that hotel — not one row per night.
 */
export interface HotelTravelVoucherRow {
  /** e.g. "2 Nights" */
  night: string;
  /** e.g. "22 Sep – 24 Sep" — only set when the hotel has more than one line item. */
  dates: string | null;
  mealPlan: string;
  room: string;
}

export interface HotelTravelVoucherEntry {
  hotelName: string;
  hotelAddress: string;
  guestName: string;
  occupancy: string;
  d2dBookingId: string;
  bookingCnf: string;
  tripId: string;
  checkInDate: string | null;
  checkOutDate: string | null;
  nights: number;
  rows: HotelTravelVoucherRow[];
}

export interface HotelTravelVoucherPdfData {
  entries: HotelTravelVoucherEntry[];
  generatedOn: string;
}

const HV = {
  navy: "#26334d",
  teal: "#1eb3b8",
  tealDark: "#189aa0",
  grey: "#5a6169",
  line: "#d3d9de",
  light: "#f2f7f9",
};

const hvStyles = StyleSheet.create({
  page: { paddingTop: 34, paddingHorizontal: 40, paddingBottom: 30, fontSize: 10, fontFamily: "Helvetica", color: HV.navy },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: `2 solid ${HV.teal}` },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  logoWordD2D: { fontSize: 12, fontWeight: 700, color: HV.navy },
  logoWordHolidays: { fontSize: 12, fontWeight: 700, color: HV.teal },
  logoTagline: { fontSize: 5.5, letterSpacing: 1.2, color: HV.grey, marginTop: 1 },
  hvTitle: { fontSize: 18, fontWeight: 700, color: HV.navy },
  cols: { flexDirection: "row", marginTop: 18, gap: 20 },
  col: { flex: 1 },
  secLabel: { fontSize: 9, fontWeight: 700, color: HV.teal, letterSpacing: 0.5, marginBottom: 6 },
  secMain: { fontSize: 14, fontWeight: 700, color: HV.navy },
  secSub: { fontSize: 10.5, color: HV.grey, marginTop: 2 },
  refbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: HV.light,
    paddingVertical: 9,
    paddingHorizontal: 8,
    marginTop: 14,
  },
  refItem: { fontSize: 10, fontWeight: 700, color: HV.navy },

  stay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: HV.line,
    borderStyle: "solid",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 36,
  },
  staySide: { alignItems: "center" },
  stayLbl: { fontSize: 9, color: HV.grey, letterSpacing: 0.4 },
  stayDate: { fontSize: 13, fontWeight: 700, color: HV.navy, marginTop: 2 },
  stayTime: { fontSize: 9, color: HV.grey, marginTop: 2 },
  stayNights: { fontSize: 14, fontWeight: 700, color: HV.teal },

  table: { marginTop: 36, borderBottom: `1 solid ${HV.line}` },
  tHeadRow: { flexDirection: "row", backgroundColor: HV.navy, paddingVertical: 9, paddingHorizontal: 12 },
  tHeadCell: { color: "#ffffff", fontSize: 10, fontWeight: 700 },
  tRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 12 },
  tRowOdd: { backgroundColor: HV.light },
  tCell: { fontSize: 10, color: HV.navy },
  tSub: { fontSize: 8, color: HV.grey, marginTop: 1 },
  colNum: { width: "8%" },
  colNight: { width: "26%" },
  colMeal: { width: "26%" },
  colRoom: { width: "40%" },
  notes: { flexDirection: "row", marginTop: 14, paddingHorizontal: 6 },
  notesLbl: { fontSize: 10, fontWeight: 700, color: HV.teal },
  notesText: { fontSize: 10, color: HV.grey },
  foot: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTop: `1.5 solid ${HV.teal}`,
    fontSize: 8,
    color: HV.grey,
  },
  footBrand: { color: HV.teal, fontWeight: 700 },
});

function HotelVoucherLogo() {
  return (
    <View style={hvStyles.logoRow}>
      <Svg width={20} height={20} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="hvPlaneGrad" x1="0" y1="0" x2="100" y2="100">
            <Stop offset="0" stopColor={HV.teal} />
            <Stop offset="1" stopColor={HV.tealDark} />
          </LinearGradient>
        </Defs>
        <Path d="M97 2 L2 26 L39 48 Z" fill="url(#hvPlaneGrad)" />
        <Path d="M97 2 L51 59 L73 99 Z" fill={HV.tealDark} opacity={0.9} />
      </Svg>
      <View>
        <Text><Text style={hvStyles.logoWordD2D}>D2D </Text><Text style={hvStyles.logoWordHolidays}>Holidays</Text></Text>
        <Text style={hvStyles.logoTagline}>DRIVE TO DESTINATION</Text>
      </View>
    </View>
  );
}

const HV_CHECK_IN_TIME = "14:00";
const HV_CHECK_OUT_TIME = "12:00";
const HV_NOTES = "A security deposit is not required for this Hotel";

/** One hotel = one page, in the same order as the approved sample: hotel/guest columns, ref bar,
 * stay box, line-item table, notes. The footer is `fixed` so it repeats if a hotel with many
 * line items ever spills onto a second page. */
function HotelVoucherPage({ entry, generatedOn }: { entry: HotelTravelVoucherEntry; generatedOn: string }) {
  return (
    <Page size="A4" style={hvStyles.page} wrap>
      <View style={hvStyles.head}>
        <HotelVoucherLogo />
        <Text style={hvStyles.hvTitle}>Hotel Voucher</Text>
      </View>

      <View style={hvStyles.cols}>
        <View style={hvStyles.col}>
          <Text style={hvStyles.secLabel}>HOTEL DETAILS</Text>
          <Text style={hvStyles.secMain}>{entry.hotelName || "—"}</Text>
          {entry.hotelAddress ? <Text style={hvStyles.secSub}>{entry.hotelAddress}</Text> : null}
        </View>
        <View style={hvStyles.col}>
          <Text style={hvStyles.secLabel}>GUEST DETAILS</Text>
          <Text style={hvStyles.secMain}>{entry.guestName || "—"}</Text>
          <Text style={hvStyles.secSub}>{entry.occupancy}</Text>
        </View>
      </View>

      <View style={hvStyles.refbar}>
        <Text style={hvStyles.refItem}>D2D Booking ID: {entry.d2dBookingId}</Text>
        <Text style={hvStyles.refItem}>Booking CNF: {entry.bookingCnf}</Text>
        <Text style={hvStyles.refItem}>Trip ID: {entry.tripId}</Text>
      </View>

      <View style={hvStyles.stay} wrap={false}>
        <View style={hvStyles.staySide}>
          <Text style={hvStyles.stayLbl}>CHECK-IN</Text>
          <Text style={hvStyles.stayDate}>{entry.checkInDate || "—"}</Text>
          <Text style={hvStyles.stayTime}>at {HV_CHECK_IN_TIME} hrs</Text>
        </View>
        <Text style={hvStyles.stayNights}>{entry.nights} {entry.nights === 1 ? "Night" : "Nights"}</Text>
        <View style={hvStyles.staySide}>
          <Text style={hvStyles.stayLbl}>CHECK-OUT</Text>
          <Text style={hvStyles.stayDate}>{entry.checkOutDate || "—"}</Text>
          <Text style={hvStyles.stayTime}>at {HV_CHECK_OUT_TIME} hrs</Text>
        </View>
      </View>

      <View style={hvStyles.table}>
        <View style={hvStyles.tHeadRow}>
          <Text style={[hvStyles.tHeadCell, hvStyles.colNum]}>#</Text>
          <Text style={[hvStyles.tHeadCell, hvStyles.colNight]}>Night</Text>
          <Text style={[hvStyles.tHeadCell, hvStyles.colMeal]}>Meal Plan</Text>
          <Text style={[hvStyles.tHeadCell, hvStyles.colRoom]}>Rooms</Text>
        </View>
        {entry.rows.map((r, i) => (
          <View style={[hvStyles.tRow, ...(i % 2 === 0 ? [hvStyles.tRowOdd] : [])]} key={i} wrap={false}>
            <Text style={[hvStyles.tCell, hvStyles.colNum]}>{i + 1}</Text>
            <View style={hvStyles.colNight}>
              <Text style={hvStyles.tCell}>{r.night}</Text>
              {r.dates ? <Text style={hvStyles.tSub}>{r.dates}</Text> : null}
            </View>
            <Text style={[hvStyles.tCell, hvStyles.colMeal]}>{r.mealPlan || "—"}</Text>
            <Text style={[hvStyles.tCell, hvStyles.colRoom]}>{r.room || "—"}</Text>
          </View>
        ))}
      </View>

      <View style={hvStyles.notes}>
        <Text style={hvStyles.notesText}><Text style={hvStyles.notesLbl}>NOTES:  </Text>{HV_NOTES}</Text>
      </View>

      <View style={hvStyles.foot} fixed>
        <Text>Generated On : {generatedOn}</Text>
        <Text><Text style={hvStyles.footBrand}>D2D Holidays</Text>  |  <Text style={hvStyles.footBrand}>Drive to Destination</Text></Text>
      </View>
    </Page>
  );
}

function HotelTravelVoucherDocument({ data }: { data: HotelTravelVoucherPdfData }) {
  return (
    <Document>
      {data.entries.map((entry, i) => (
        <HotelVoucherPage entry={entry} generatedOn={data.generatedOn} key={i} />
      ))}
    </Document>
  );
}

export async function renderHotelTravelVoucherPdf(data: HotelTravelVoucherPdfData): Promise<Buffer> {
  return renderToBuffer(<HotelTravelVoucherDocument data={data} />);
}

/**
 * Customer-facing "Payment Acknowledgement" — a single-page certificate-style receipt for the
 * *total* amount a customer has paid on a booking to date, with a supporting payment-by-payment
 * breakup. Reuses the RC palette/logo from the trip receipt above for brand consistency. The
 * circular "seal" on the hero card is the one deliberately decorative touch — everything else
 * stays plain and legible since this is a document customers keep for their own records.
 */
export interface PaymentAckEntry {
  label: string;
  dateLabel: string;
  modeLabel: string;
  reference: string | null;
  amount: number;
}

export interface PaymentAcknowledgementPdfData {
  ackNumber: string;
  issuedOn: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  destinationName: string;
  bookingId: string;
  bookingStatusLabel: string;
  totalReceived: number;
  totalCost: number;
  balanceDue: number;
  payments: PaymentAckEntry[];
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigitWords(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return TENS[t] + (o ? ` ${ONES[o]}` : "");
}
function threeDigitWords(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return (h ? `${ONES[h]} Hundred${r ? " " : ""}` : "") + (r ? twoDigitWords(r) : "");
}
/** Indian numbering (crore/lakh/thousand), e.g. 1234567 -> "Twelve Lakh Thirty Four Thousand Five Hundred Sixty Seven". */
export function amountInWords(value: number): string {
  const n = Math.round(Math.abs(value));
  if (n === 0) return "Rupees Zero Only";
  let remaining = n;
  const crore = Math.floor(remaining / 10000000); remaining %= 10000000;
  const lakh = Math.floor(remaining / 100000); remaining %= 100000;
  const thousand = Math.floor(remaining / 1000); remaining %= 1000;
  const hundred = remaining;
  const parts: string[] = [];
  if (crore) parts.push(`${threeDigitWords(crore)} Crore`);
  if (lakh) parts.push(`${threeDigitWords(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigitWords(thousand)} Thousand`);
  if (hundred) parts.push(threeDigitWords(hundred));
  return `Rupees ${parts.join(" ")} Only`;
}

const paStyles = StyleSheet.create({
  page: { paddingTop: 32, paddingHorizontal: 34, paddingBottom: 30, fontSize: 10, fontFamily: "Helvetica", color: RC.ink },

  hero: { marginTop: 18, borderRadius: 14, backgroundColor: RC.tealDark, paddingVertical: 22, paddingHorizontal: 24, position: "relative", overflow: "hidden" },
  heroLbl: { fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#d7f3f1" },
  heroAmt: { fontSize: 32, fontWeight: 700, color: "#ffffff", marginTop: 6 },
  heroWords: { fontSize: 9, fontStyle: "italic", color: "#d7f3f1", marginTop: 6, maxWidth: 340 },

  stampWrap: { position: "absolute", top: 14, right: 18, width: 88, height: 88, transform: "rotate(-12deg)" },
  stampTextWrap: { position: "absolute", top: 0, left: 0, width: 88, height: 88, alignItems: "center", justifyContent: "center" },
  stampBrand: { fontSize: 6, fontWeight: 700, letterSpacing: 1, color: "#ffffff" },
  stampWord: { fontSize: 7.5, fontWeight: 700, letterSpacing: 0.5, color: "#ffffff", marginTop: 1 },
  stampCheck: { fontSize: 13, fontWeight: 700, color: "#ffffff", marginTop: 2, marginBottom: 2 },

  cols: { flexDirection: "row", marginTop: 18, gap: 20 },
  col: { flex: 1, borderWidth: 1, borderColor: RC.line, borderStyle: "solid", borderRadius: 8, padding: 12, backgroundColor: RC.lightBg },
  colLbl: { fontSize: 7.5, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: RC.teal, marginBottom: 5 },
  colMain: { fontSize: 12, fontWeight: 700, color: RC.ink },
  colSub: { fontSize: 9, color: RC.body, marginTop: 2 },

  table: { marginTop: 8, borderWidth: 1, borderColor: RC.line, borderStyle: "solid", borderRadius: 8, overflow: "hidden" },
  tHeadRow: { flexDirection: "row", backgroundColor: RC.headBg, paddingVertical: 8, paddingHorizontal: 12 },
  tHeadCell: { fontSize: 8.5, fontWeight: 700, color: RC.ink, textTransform: "uppercase", letterSpacing: 0.3 },
  tRow: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: RC.line2, borderTopStyle: "solid" },
  tCell: { fontSize: 9.5, color: RC.ink },
  colNum: { width: "6%" },
  colDate: { width: "20%" },
  colMode: { width: "20%" },
  colRef: { width: "30%" },
  colAmt: { width: "24%", textAlign: "right", fontWeight: 700 },
  tTotalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 9, paddingHorizontal: 12, backgroundColor: RC.tealBg, borderTopWidth: 1, borderTopColor: RC.line, borderTopStyle: "solid" },
  tTotalLbl: { fontSize: 10, fontWeight: 700, color: RC.ink },
  tTotalVal: { fontSize: 11, fontWeight: 700, color: RC.paidBg },

  strip: { flexDirection: "row", marginTop: 16, borderWidth: 1, borderColor: RC.line, borderStyle: "solid", borderRadius: 8 },
  stripCell: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRightWidth: 1, borderRightColor: RC.line, borderRightStyle: "solid" },
  stripCellLast: { borderRightWidth: 0 },
  stripLbl: { fontSize: 7.5, textTransform: "uppercase", letterSpacing: 0.5, color: RC.muted2, fontWeight: 700 },
  stripVal: { fontSize: 11, fontWeight: 700, color: RC.ink, marginTop: 3 },

  sign: { marginTop: 34, flexDirection: "row", justifyContent: "flex-end" },
  signBox: { alignItems: "center", width: 170 },
  signLine: { borderTopWidth: 1, borderTopColor: RC.ink, borderTopStyle: "solid", width: "100%", marginBottom: 4 },
  signLbl: { fontSize: 8.5, color: RC.body },

  footer: { marginTop: 18, textAlign: "center", borderTopWidth: 2, borderTopColor: RC.teal, borderTopStyle: "solid", paddingTop: 12 },
  footerNote: { fontSize: 7.5, color: "#9aa4b4", lineHeight: 1.5 },
  footerContact: { marginTop: 6, color: RC.ink, fontWeight: 700, fontSize: 9 },
});

function PaymentAckStamp() {
  return (
    <View style={paStyles.stampWrap}>
      <Svg width={88} height={88} viewBox="0 0 88 88">
        <Circle cx={44} cy={44} r={41} stroke="#ffffff" strokeWidth={1.25} strokeDasharray="3,3" fill="none" />
        <Circle cx={44} cy={44} r={33} stroke="#ffffff" strokeWidth={0.75} fill="none" />
      </Svg>
      <View style={paStyles.stampTextWrap}>
        <Text style={paStyles.stampBrand}>D2D HOLIDAYS</Text>
        <Text style={paStyles.stampCheck}>✓</Text>
        <Text style={paStyles.stampWord}>PAYMENT</Text>
        <Text style={paStyles.stampWord}>RECEIVED</Text>
      </View>
    </View>
  );
}

function PaymentAcknowledgementDocument({ data }: { data: PaymentAcknowledgementPdfData }) {
  return (
    <Document>
      <Page size="A4" style={paStyles.page}>
        <View style={rcStyles.head}>
          <ReceiptLogo />
          <View style={rcStyles.docMeta}>
            <Text style={rcStyles.docTitle}>PAYMENT ACKNOWLEDGEMENT</Text>
            <Text style={rcStyles.docId}>Ack No: {data.ackNumber}</Text>
            <Text style={rcStyles.docIssued}>Issued: {data.issuedOn}</Text>
          </View>
        </View>

        <View style={paStyles.hero}>
          <PaymentAckStamp />
          <Text style={paStyles.heroLbl}>Total Amount Received</Text>
          <Text style={paStyles.heroAmt}>{formatINRSymbol(data.totalReceived)}</Text>
          <Text style={paStyles.heroWords}>{amountInWords(data.totalReceived)}</Text>
        </View>

        <View style={paStyles.cols}>
          <View style={paStyles.col}>
            <Text style={paStyles.colLbl}>Received From</Text>
            <Text style={paStyles.colMain}>{data.customerName || "—"}</Text>
            {data.customerPhone ? <Text style={paStyles.colSub}>{data.customerPhone}</Text> : null}
            {data.customerEmail ? <Text style={paStyles.colSub}>{data.customerEmail}</Text> : null}
          </View>
          <View style={paStyles.col}>
            <Text style={paStyles.colLbl}>For Booking</Text>
            <Text style={paStyles.colMain}>{data.destinationName || "—"}</Text>
            <Text style={paStyles.colSub}>Booking ID: {data.bookingId} · {data.bookingStatusLabel}</Text>
          </View>
        </View>

        <Text style={rcStyles.secH}>Payment Breakup</Text>
        <View style={paStyles.table}>
          <View style={paStyles.tHeadRow}>
            <Text style={[paStyles.tHeadCell, paStyles.colNum]}>#</Text>
            <Text style={[paStyles.tHeadCell, paStyles.colDate]}>Date</Text>
            <Text style={[paStyles.tHeadCell, paStyles.colMode]}>Mode</Text>
            <Text style={[paStyles.tHeadCell, paStyles.colRef]}>Reference</Text>
            <Text style={[paStyles.tHeadCell, paStyles.colAmt]}>Amount</Text>
          </View>
          {data.payments.map((p, i) => (
            <View style={paStyles.tRow} key={i}>
              <Text style={[paStyles.tCell, paStyles.colNum]}>{i + 1}</Text>
              <Text style={[paStyles.tCell, paStyles.colDate]}>{p.dateLabel}</Text>
              <Text style={[paStyles.tCell, paStyles.colMode]}>{p.modeLabel}</Text>
              <Text style={[paStyles.tCell, paStyles.colRef]}>{p.reference || "—"}</Text>
              <Text style={[paStyles.tCell, paStyles.colAmt]}>{formatINRSymbol(p.amount)}</Text>
            </View>
          ))}
          <View style={paStyles.tTotalRow}>
            <Text style={paStyles.tTotalLbl}>Total Received</Text>
            <Text style={paStyles.tTotalVal}>{formatINRSymbol(data.totalReceived)}</Text>
          </View>
        </View>

        <View style={paStyles.strip}>
          <View style={paStyles.stripCell}>
            <Text style={paStyles.stripLbl}>Total Package Cost</Text>
            <Text style={paStyles.stripVal}>{formatINRSymbol(data.totalCost)}</Text>
          </View>
          <View style={paStyles.stripCell}>
            <Text style={paStyles.stripLbl}>Total Received</Text>
            <Text style={[paStyles.stripVal, { color: RC.paidBg }]}>{formatINRSymbol(data.totalReceived)}</Text>
          </View>
          <View style={[paStyles.stripCell, paStyles.stripCellLast]}>
            <Text style={paStyles.stripLbl}>Balance Due</Text>
            <Text style={[paStyles.stripVal, { color: data.balanceDue > 0 ? RC.partialBg : RC.paidBg }]}>{formatINRSymbol(data.balanceDue)}</Text>
          </View>
        </View>

        <View style={paStyles.sign}>
          <View style={paStyles.signBox}>
            <View style={paStyles.signLine} />
            <Text style={paStyles.signLbl}>For D2D Holidays — Authorized Signatory</Text>
          </View>
        </View>

        <View style={paStyles.footer}>
          <Text style={paStyles.footerNote}>
            This is a system-generated acknowledgement of payment(s) received towards the booking referenced above and does not require a physical signature or stamp.{"\n"}
            Please retain this document for your records.
          </Text>
          <Text style={paStyles.footerContact}>Phone: {SUPPORT_PHONES.join(", ")} &nbsp;·&nbsp; Email: {SUPPORT_EMAIL}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderPaymentAcknowledgementPdf(data: PaymentAcknowledgementPdfData): Promise<Buffer> {
  return renderToBuffer(<PaymentAcknowledgementDocument data={data} />);
}
