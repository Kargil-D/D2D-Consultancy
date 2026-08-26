import { Document, Page, Text, View, Image, Link, Svg, Path, Circle, Defs, LinearGradient, Stop, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { QuotationActivityItem, QuotationHotelOptionGroup, QuotationItineraryDay, QuotationTransferItem } from "@/types/admin";
import { SUPPORT_PHONES, SUPPORT_EMAIL, SUPPORT_WEBSITE, SUPPORT_ADDRESS, COMPANY_FULL_NAME } from "@/data/contact";

/**
 * Customer-facing quote PDF — the approved "sky & hills" brand deck. Only ever receives the
 * selling price — never per-line cost/margin figures (see "Only the selling price is shown
 * to customers" business rule). Shape mirrors PublicQuoteData from quotationService.
 */
export interface QuotationPdfData {
  quoteCode: string;
  customerName: string;
  destinationName: string;
  packageName: string | null;
  importantNotes: string | null;
  heroImage: string;
  travelDate: string | null;
  travelEndDate: string | null;
  days: number | null;
  nights: number | null;
  adults: number;
  children: number;
  infants: number;
  validUntil: string | null;
  createdDate: string;
  itineraryDays: QuotationItineraryDay[];
  hotelOptions: QuotationHotelOptionGroup[];
  transfers: QuotationTransferItem[];
  activities: QuotationActivityItem[];
  inclusionLines: string[];
  exclusionLines: string[];
  subtotal: number;
  gstPercent: number;
  includeChildCosting: boolean;
  sellingPrice: number;
  advanceAmount: number;
  highlights: string[];
}

const C = {
  sky1: "#cfe9fb",
  sky2: "#eaf6fd",
  hill1: "#a9d66a",
  hill2: "#7fb542",
  hill3: "#4f7a2a",
  band: "#dceff0",
  ink: "#0e3a40",
  teal: "#12828f",
  tealDark: "#0b5b64",
  navy: "#0c2b30",
  navyDark: "#082024",
  orange: "#e08a3c",
  orangeDark: "#c96f28",
  cream: "#f8f1e4",
  muted: "#6b7d7c",
  body: "#3a4d4c",
  line: "#d9ecec",
  paper: "#ffffff",
};

// A4 in points is 595.28 x 841.89 — stay a hair under the real page box (never over it),
// since react-pdf's Yoga layout silently inserts a blank continuation page if an
// absolutely-positioned full-bleed element is even a fraction of a point taller than the
// page itself (this is what caused the blank page 2 right after the cover).
const PAGE_W = 595;
const PAGE_H = 841;
const PAD_X = 32;

const styles = StyleSheet.create({
  page: { paddingTop: 0, paddingHorizontal: 0, paddingBottom: 0, fontSize: 10, fontFamily: "Helvetica", color: C.body, backgroundColor: C.paper },
  content: { paddingHorizontal: PAD_X, paddingTop: 16, paddingBottom: 34, position: "relative" },

  // ------------------------------------------------------------ Header / Footer bands --
  band: { backgroundColor: C.band, paddingVertical: 12, paddingHorizontal: PAD_X, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bandRightText: { fontSize: 9, color: C.ink },
  bandRightBold: { fontWeight: 700, color: C.orangeDark },
  footerBand: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: C.band, paddingVertical: 10, paddingHorizontal: PAD_X,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  footerLeft: { fontSize: 8, color: C.tealDark },
  footerSmall: { fontSize: 7, color: C.tealDark, marginTop: 2 },
  footerN: { fontWeight: 700, fontSize: 11, color: C.navy },

  logoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  logoWordD2D: { fontSize: 11, fontWeight: 700, color: C.ink },
  logoWordHolidays: { fontSize: 11, fontWeight: 700, color: C.teal },
  logoTagline: { fontSize: 5, letterSpacing: 1.2, color: C.muted, marginTop: 1 },

  // -------------------------------------------------------------------- Section head --
  sec: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 16, marginBottom: 10 },
  secDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.orange },
  secTitle: { fontFamily: "Times-Bold", fontWeight: 700, fontSize: 16, color: C.ink },

  card: { backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderStyle: "solid", borderRadius: 8 },

  // -------------------------------------------------------------------------- Cover --
  coverBadge: { position: "absolute", top: 26, right: 26, borderWidth: 1, borderColor: "rgba(14,58,64,0.35)", borderStyle: "solid", borderRadius: 16, paddingVertical: 5, paddingHorizontal: 14, color: C.ink, fontSize: 8.5, fontWeight: 700, letterSpacing: 1 },
  coverLogo: { position: "absolute", top: 26, left: 26 },
  coverMid: { position: "absolute", top: 240, left: 40, right: 40, textAlign: "center" },
  coverEyebrow: { fontSize: 9.5, fontWeight: 700, letterSpacing: 3, color: C.orangeDark, textAlign: "center" },
  coverTitle: { marginTop: 8, fontFamily: "Times-Bold", fontWeight: 700, fontSize: 34, color: C.navy, textAlign: "center" },
  coverTitleEm: { fontFamily: "Times-Italic", fontWeight: 400, color: C.orangeDark },
  coverSub: { marginTop: 8, fontSize: 12, color: C.ink, textAlign: "center" },
  coverFor: { marginTop: 6, fontSize: 9.5, color: C.ink, textAlign: "center" },
  coverForBold: { fontWeight: 700 },
  coverChipsRow: { position: "absolute", bottom: 34, left: 26, right: 26, flexDirection: "row", gap: 8 },
  cchip: { flex: 1, backgroundColor: "rgba(20,50,30,0.72)", borderWidth: 1, borderColor: "rgba(255,255,255,0.5)", borderStyle: "solid", borderRadius: 6, paddingVertical: 8, paddingHorizontal: 8 },
  cchipL: { fontSize: 6, fontWeight: 700, letterSpacing: 1, color: "#dfead0" },
  cchipV: { marginTop: 4, fontWeight: 700, fontSize: 10.5, color: "#ffffff" },

  // --------------------------------------------------------------------- Overview --
  grid2: { flexDirection: "row", gap: 12 },
  officeCard: { padding: 13 },
  officeTitle: { fontFamily: "Times-Bold", fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 8 },
  kvRow: { flexDirection: "row", marginTop: 6 },
  kvKey: { width: 62, fontSize: 8.5, color: C.muted },
  kvVal: { flex: 1, fontSize: 8.5, color: "#26363d" },

  qdetails: { backgroundColor: C.navy, borderRadius: 8, padding: 13 },
  qdetailsTitle: { fontSize: 9, fontWeight: 700, letterSpacing: 1.8, color: "#ffffff", marginBottom: 9 },
  qrow: { flexDirection: "row", justifyContent: "space-between", fontSize: 9, marginTop: 7 },
  qrowK: { color: "rgba(255,255,255,0.85)" },
  qrowV: { color: C.orange, fontWeight: 700, textAlign: "right" },

  chipsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  metaChip: { flex: 1, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderStyle: "solid", borderRadius: 6, padding: 9, position: "relative", overflow: "hidden" },
  metaChipBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3, backgroundColor: C.teal },
  metaChipL: { fontSize: 6.5, fontWeight: 700, letterSpacing: 0.8, color: C.muted },
  metaChipV: { marginTop: 4, fontWeight: 700, fontSize: 11, color: C.ink },

  tstrip: { marginTop: 12, backgroundColor: C.band, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 12, flexDirection: "row", justifyContent: "space-between", fontSize: 9, color: "#26363d", flexWrap: "wrap", gap: 4 },
  tstripB: { fontWeight: 700 },

  hlCard: { padding: 13 },
  hlGrid: { flexDirection: "row", flexWrap: "wrap" },
  hl: { width: "50%", flexDirection: "row", gap: 6, fontSize: 9, color: "#2c3e46", marginBottom: 6, paddingRight: 6 },
  hlCheck: { color: C.teal, fontWeight: 700 },

  // ------------------------------------------------------------------------- Day --
  day: { padding: 11, marginBottom: 10 },
  dhead: { flexDirection: "row", alignItems: "center", gap: 9 },
  dpill: { backgroundColor: C.navy, color: "#ffffff", borderRadius: 14, paddingVertical: 3, paddingHorizontal: 11, fontFamily: "Times-Bold", fontWeight: 700, fontSize: 10 },
  ddate: { fontWeight: 700, fontSize: 9.5, color: "#55666e" },
  ddist: { marginLeft: "auto", fontWeight: 700, fontSize: 9, color: C.orangeDark },
  dbody: { marginTop: 6, fontSize: 9, lineHeight: 1.5, color: C.body },
  dnote: { marginTop: 4, fontStyle: "italic", fontSize: 8, color: C.muted },

  // --------------------------------------------------- Split (hotel/act/transfer) --
  split: { flexDirection: "row", marginBottom: 10, borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: C.line, borderStyle: "solid", backgroundColor: C.paper },
  splitCream: { backgroundColor: C.cream },
  splitTxt: { flex: 1.15, padding: 12 },
  splitPicWrap: { width: 150, height: 118 },
  splitH3: { fontFamily: "Times-Bold", fontWeight: 700, fontSize: 12.5, color: C.ink, marginBottom: 6 },
  splitH3Route: { color: C.tealDark },
  srow: { flexDirection: "row", justifyContent: "space-between", fontSize: 9, marginTop: 4, gap: 6 },
  srowK: { color: C.muted },
  srowV: { fontWeight: 700, color: "#26363d", textAlign: "right" },
  npill: { marginTop: 8, alignSelf: "flex-start", backgroundColor: "#cfe6f0", borderRadius: 14, paddingVertical: 3, paddingHorizontal: 9, fontFamily: "Times-Bold", fontWeight: 700, fontSize: 8.5, color: C.ink },

  // ------------------------------------------------------- Inclusions / Price --
  ieCard: { padding: 12 },
  ieCardTitle: { fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8 },
  ieCardTitleInc: { color: C.teal },
  ieCardTitleExc: { color: C.orangeDark },
  ie: { flexDirection: "row", gap: 6, fontSize: 9, color: "#2c3e46", lineHeight: 1.5, marginBottom: 4 },
  ieMarkInc: { color: C.teal, fontWeight: 700 },
  ieMarkExc: { color: C.orangeDark, fontWeight: 700 },

  pgrid: { flexDirection: "row", gap: 12 },
  ptableWrap: { flex: 1.5, borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: C.line, borderStyle: "solid", backgroundColor: C.paper },
  ptHeadRow: { flexDirection: "row", backgroundColor: C.navy },
  pth: { color: "#ffffff", fontWeight: 700, fontSize: 8.5, paddingVertical: 8, paddingHorizontal: 8 },
  ptr: { flexDirection: "row", borderBottom: "1 solid #ecf3f6" },
  ptd: { fontSize: 9, paddingVertical: 7, paddingHorizontal: 8, color: C.body },
  ptdBold: { fontWeight: 700, color: C.ink },

  psum: { flex: 1, backgroundColor: C.navy, borderRadius: 8, padding: 13 },
  psumRow: { flexDirection: "row", justifyContent: "space-between", fontSize: 9.5, marginBottom: 8, color: "#ffffff" },
  psumRowV: { fontWeight: 700 },
  gt: { backgroundColor: C.navyDark, borderRadius: 6, padding: 11, marginTop: 6, alignItems: "center" },
  gtLbl: { fontSize: 8, fontWeight: 700, letterSpacing: 1.8, color: "rgba(255,255,255,0.85)" },
  gtVal: { marginTop: 4, fontFamily: "Times-Bold", fontWeight: 700, fontSize: 22, color: C.orange },
  pnote: { marginTop: 12, textAlign: "center", fontStyle: "italic", fontSize: 8.5, color: C.muted },

  // ------------------------------------------------------------------------ Terms --
  termsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  termCard: { width: "48.5%", padding: 11 },
  termTitle: { fontFamily: "Times-Bold", fontWeight: 700, fontSize: 11.5, color: C.ink, marginBottom: 6 },
  termLi: { flexDirection: "row", gap: 4, fontSize: 8.5, color: "#45566e", lineHeight: 1.5, marginBottom: 2 },
  termDot: { color: "#8aa0a8" },
  termP: { fontSize: 8.5, color: "#45566e", lineHeight: 1.5 },

  statsRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 18, marginHorizontal: 10 },
  stat: { alignItems: "center" },
  statV: { fontFamily: "Times-Bold", fontWeight: 700, fontSize: 21, color: C.ink },
  statL: { marginTop: 4, fontSize: 7.5, fontWeight: 700, letterSpacing: 1.5, color: C.muted },

  cta: { marginTop: 16, backgroundColor: C.navy, borderRadius: 10, padding: 16, alignItems: "center" },
  ctaTitle: { fontFamily: "Times-Bold", fontWeight: 700, fontSize: 15, color: "#ffffff" },
  ctaP1: { marginTop: 6, fontSize: 9.5, color: "#ffffff" },
  ctaP1B: { color: C.orange, fontWeight: 700 },
  ctaP2: { marginTop: 3, fontSize: 9, color: "rgba(255,255,255,0.85)" },

  closingLockup: { alignItems: "center", marginTop: 26 },
  closingWord: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  closingWordD2D: { fontSize: 22, fontWeight: 700, color: C.ink },
  closingWordHolidays: { fontSize: 22, fontWeight: 700, color: C.teal },
  closingTagline: { marginTop: 4, fontSize: 8, letterSpacing: 3, color: C.muted },

  // --------------------------------------------------------------------- Thanks --
  thanksTitle: { fontFamily: "Times-BoldItalic", fontSize: 22, color: C.tealDark, lineHeight: 1.25 },
  thanksMsg: { fontSize: 9.5, lineHeight: 1.7, color: "#1d3a44", marginBottom: 8 },
  contactCard: { marginTop: 14, backgroundColor: "rgba(214,236,245,0.9)", borderRadius: 8, padding: 12 },
  contactCardBold: { fontSize: 10, fontWeight: 700, color: "#23343c" },
  contactCardLine: { fontSize: 8.5, color: "#23343c", marginTop: 4, lineHeight: 1.5 },
});

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(value);
}

/** Brand mark: two-triangle paper-plane, teal/cyan — same silhouette as the web header logo (src/components/common/Logo.tsx), just recolored for light backgrounds. */
function PlaneMark({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="planeGrad" x1="0" y1="0" x2="100" y2="100">
          <Stop offset="0" stopColor={C.teal} />
          <Stop offset="1" stopColor={C.tealDark} />
        </LinearGradient>
      </Defs>
      <Path d="M96 8 L3 42 L50 60 Z" fill="url(#planeGrad)" />
      <Path d="M96 8 L50 60 L42 95 Z" fill={C.tealDark} opacity={0.75} />
    </Svg>
  );
}

function BrandLogo({ size = 20, tagline = true }: { size?: number; tagline?: boolean }) {
  return (
    <View style={styles.logoRow}>
      <PlaneMark size={size} />
      <View>
        <Text><Text style={styles.logoWordD2D}>D2D </Text><Text style={styles.logoWordHolidays}>Holidays</Text></Text>
        {tagline && <Text style={styles.logoTagline}>DRIVE TO DESTINATION</Text>}
      </View>
    </View>
  );
}

/**
 * Illustrated sky + clouds + rolling hills — the brand's signature background, used full-size
 * on the cover and scaled down as the "no photo yet" placeholder inside split cards.
 */
function SkyHills({ width, height }: { width: number; height: number }) {
  const gradId = `sky-${width}-${height}`;
  const hillTop = height * 0.62;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2={height}>
          <Stop offset="0" stopColor={C.sky1} />
          <Stop offset="1" stopColor={C.sky2} />
        </LinearGradient>
      </Defs>
      <Path d={`M0 0 H${width} V${height} H0 Z`} fill={`url(#${gradId})`} />
      <Circle cx={width * 0.32} cy={height * 0.34} r={height * 0.24} fill="#ffffff" opacity={0.85} />
      <Circle cx={width * 0.46} cy={height * 0.4} r={height * 0.19} fill="#ffffff" opacity={0.85} />
      <Circle cx={width * 0.68} cy={height * 0.22} r={height * 0.13} fill="#ffffff" opacity={0.7} />
      <Path d={`M0 ${hillTop + height * 0.08} Q ${width * 0.25} ${hillTop - height * 0.06} ${width * 0.55} ${hillTop + height * 0.04} T ${width} ${hillTop} V${height} H0 Z`} fill={C.hill1} />
      <Path d={`M0 ${hillTop + height * 0.16} Q ${width * 0.3} ${hillTop + height * 0.02} ${width * 0.62} ${hillTop + height * 0.14} T ${width} ${hillTop + height * 0.1} V${height} H0 Z`} fill={C.hill2} />
      <Path d={`M0 ${hillTop + height * 0.26} Q ${width * 0.4} ${hillTop + height * 0.14} ${width} ${hillTop + height * 0.24} V${height} H0 Z`} fill={C.hill3} />
    </Svg>
  );
}

/** Low-opacity wave arcs + a flight path with a plane glyph — the recurring page watermark on content pages. */
function PageWatermark() {
  const y = PAGE_H - 190;
  return (
    <Svg width={PAGE_W} height={220} viewBox={`0 0 ${PAGE_W} 220`} style={{ position: "absolute", left: 0, bottom: 0 }}>
      {[0, 1, 2, 3].map((i) => (
        <Path
          key={i}
          d={`M0 ${40 + i * 32} Q ${PAGE_W / 2} ${10 + i * 32} ${PAGE_W} ${40 + i * 32}`}
          stroke={C.teal}
          strokeWidth={1}
          strokeOpacity={0.14}
          fill="none"
        />
      ))}
      <Path d={`M20 150 Q ${PAGE_W / 2 - 40} 90 ${PAGE_W - 40} 120`} stroke="#98a6a5" strokeWidth={1} strokeDasharray="3,5" strokeOpacity={0.4} fill="none" />
      <Path d="M0 0 L14 5 L0 10 L3 5 Z" fill={C.orangeDark} opacity={0.5} transform={`translate(${PAGE_W - 54}, 113) rotate(8)`} />
      {Array.from({ length: 10 }).map((_, i) => {
        const bw = 16 + (i % 3) * 6;
        const bh = 30 + ((i * 17) % 55);
        const bx = 10 + i * (PAGE_W - 20) / 10;
        return <Path key={i} d={`M${bx} ${y + 190 - bh} H${bx + bw} V${y + 190} H${bx} Z`} fill="#9fb0af" opacity={0.16} />;
      })}
    </Svg>
  );
}

function PageBand({ quoteCode, destinationName }: { quoteCode: string; destinationName: string }) {
  return (
    <View style={styles.band}>
      <BrandLogo size={18} />
      <Text style={styles.bandRightText}>Quotation <Text style={styles.bandRightBold}>{quoteCode}</Text> · {destinationName}</Text>
    </View>
  );
}

function PageFooter({ pageLabel }: { pageLabel: string }) {
  return (
    <View style={styles.footerBand} fixed>
      <View>
        <Text style={styles.footerLeft}>{SUPPORT_PHONES.join(" · ")} · {SUPPORT_EMAIL}</Text>
        <Text style={styles.footerSmall}>Indicative quotation, subject to availability.</Text>
      </View>
      <Text style={styles.footerN}>{pageLabel}</Text>
    </View>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <View style={styles.sec}>
      <View style={styles.secDot} />
      <Text style={styles.secTitle}>{title}</Text>
    </View>
  );
}

/** Real photo when one exists, the brand's sky-and-hills illustration otherwise — never a blank box. */
function SplitPic({ src }: { src?: string | null }) {
  return (
    <View style={styles.splitPicWrap}>
      {src ? <Image src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <SkyHills width={150} height={118} />}
    </View>
  );
}

function QuotationDocument({ data }: { data: QuotationPdfData }) {
  const nightsDays = data.nights != null && data.days != null ? `${data.nights}N / ${data.days}D` : data.nights != null ? `${data.nights}N` : "-";
  const paxShort = [
    data.adults ? `${data.adults}A` : null,
    data.children ? `${data.children}C` : null,
    data.infants ? `${data.infants}I` : null,
  ].filter(Boolean).join(" · ") || "-";
  const paxLabel = [
    data.adults ? `${data.adults} Adult${data.adults > 1 ? "s" : ""}` : null,
    data.children ? `${data.children} Child${data.children > 1 ? "ren" : ""}` : null,
    data.infants ? `${data.infants} Infant${data.infants > 1 ? "s" : ""}` : null,
  ].filter(Boolean).join(", ") || "-";

  const gstAmount = data.sellingPrice - data.subtotal;
  const splitAcrossChildren = data.includeChildCosting && data.children > 0;
  const pricePerAdult = data.adults > 0 ? (splitAcrossChildren ? data.subtotal * 0.8 : data.subtotal) / data.adults : null;
  const pricePerChild = splitAcrossChildren ? (data.subtotal * 0.2) / data.children : null;

  const priceRows: { description: string; pax: number | string; unit: string; total: string }[] = [];
  if (pricePerAdult != null) priceRows.push({ description: "Price per Adult", pax: data.adults, unit: formatINR(pricePerAdult), total: formatINR(pricePerAdult * data.adults) });
  if (pricePerChild != null) priceRows.push({ description: "Price per Child", pax: data.children, unit: formatINR(pricePerChild), total: formatINR(pricePerChild * data.children) });
  if (data.infants > 0) priceRows.push({ description: "Infant", pax: data.infants, unit: "Complimentary", total: "—" });

  const primaryHotelGroup = data.hotelOptions.find((g) => g.hotels.length > 0);
  const totalRooms = primaryHotelGroup?.hotels.reduce((sum, h) => sum + (h.rooms || 0), 0) || 1;
  const firstHotel = primaryHotelGroup?.hotels[0];

  const hasItinerary = data.itineraryDays.length > 0;
  const hasHotels = data.hotelOptions.some((g) => g.hotels.length > 0);
  const hasActivities = data.activities.length > 0;
  const hasStayPage = hasHotels || hasActivities;
  const hasTransfers = data.transfers.length > 0;
  const hasHighlights = data.highlights.length > 0;

  const band = <PageBand quoteCode={data.quoteCode} destinationName={data.destinationName} />;

  return (
    <Document>
      {/* ========================================================== Page 1 · Cover == */}
      <Page size="A4" style={{ padding: 0 }}>
        <View style={{ position: "absolute", top: 0, left: 0 }}>
          <SkyHills width={PAGE_W} height={PAGE_H} />
        </View>

        <View style={styles.coverLogo}><BrandLogo size={26} /></View>
        <Text style={styles.coverBadge}>QUOTATION · {data.quoteCode}</Text>

        <View style={styles.coverMid}>
          <Text style={styles.coverEyebrow}>YOUR CUSTOM TRAVEL PLAN</Text>
          <Text style={styles.coverTitle}>{data.destinationName} <Text style={styles.coverTitleEm}>Escape</Text></Text>
          {nightsDays !== "-" && <Text style={styles.coverSub}>{nightsDays}</Text>}
          <Text style={styles.coverFor}>Prepared for <Text style={styles.coverForBold}>{data.customerName}</Text> · {paxLabel}</Text>
        </View>

        <View style={styles.coverChipsRow}>
          <View style={styles.cchip}><Text style={styles.cchipL}>TRAVEL DATE</Text><Text style={styles.cchipV}>{data.travelDate || "TBD"}</Text></View>
          <View style={styles.cchip}><Text style={styles.cchipL}>DURATION</Text><Text style={styles.cchipV}>{nightsDays}</Text></View>
          <View style={styles.cchip}><Text style={styles.cchipL}>TRAVELLERS</Text><Text style={styles.cchipV}>{paxShort}</Text></View>
          <View style={styles.cchip}><Text style={styles.cchipL}>VALID UNTIL</Text><Text style={styles.cchipV}>{data.validUntil || "-"}</Text></View>
        </View>
      </Page>

      {/* ========================================================== Page 2 · Overview == */}
      <Page size="A4" style={styles.page}>
        {band}
        <View style={styles.content}>
          <PageWatermark />
          <SectionHead title="Trip Overview" />
          <View style={styles.grid2}>
            <View style={[styles.card, styles.officeCard, { flex: 1.35 }]}>
              <Text style={styles.officeTitle}>Our Office</Text>
              <View style={styles.kvRow}><Text style={styles.kvKey}>Address</Text><Text style={styles.kvVal}>{SUPPORT_ADDRESS}</Text></View>
              <View style={styles.kvRow}><Text style={styles.kvKey}>Phone</Text><Text style={styles.kvVal}>{SUPPORT_PHONES.join(" · ")}</Text></View>
              <View style={styles.kvRow}><Text style={styles.kvKey}>Email</Text><Text style={styles.kvVal}>{SUPPORT_EMAIL}</Text></View>
              <View style={styles.kvRow}><Text style={styles.kvKey}>Website</Text><Text style={styles.kvVal}>{SUPPORT_WEBSITE}</Text></View>
            </View>
            <View style={[styles.qdetails, { flex: 1 }]}>
              <Text style={styles.qdetailsTitle}>QUOTATION DETAILS</Text>
              <View style={styles.qrow}><Text style={styles.qrowK}>Prepared For</Text><Text style={styles.qrowV}>{data.customerName}</Text></View>
              <View style={styles.qrow}><Text style={styles.qrowK}>Destination</Text><Text style={styles.qrowV}>{data.destinationName}</Text></View>
              <View style={styles.qrow}><Text style={styles.qrowK}>Departure From</Text><Text style={styles.qrowV}>Trichy</Text></View>
              <View style={styles.qrow}><Text style={styles.qrowK}>Valid Until</Text><Text style={styles.qrowV}>{data.validUntil || "-"}</Text></View>
            </View>
          </View>

          <View style={styles.chipsRow}>
            <View style={styles.metaChip}><View style={styles.metaChipBar} /><Text style={styles.metaChipL}>TRAVEL DATE</Text><Text style={styles.metaChipV}>{data.travelDate || "TBD"}</Text></View>
            <View style={styles.metaChip}><View style={styles.metaChipBar} /><Text style={styles.metaChipL}>DURATION</Text><Text style={styles.metaChipV}>{nightsDays}</Text></View>
            <View style={styles.metaChip}><View style={styles.metaChipBar} /><Text style={styles.metaChipL}>HOTEL CATEGORY</Text><Text style={styles.metaChipV}>{firstHotel?.category || "-"}</Text></View>
            <View style={styles.metaChip}><View style={styles.metaChipBar} /><Text style={styles.metaChipL}>ROOM TYPE</Text><Text style={styles.metaChipV}>{firstHotel?.roomType || "-"}</Text></View>
          </View>

          <View style={styles.tstrip}>
            <Text>Total Travellers <Text style={styles.tstripB}>{data.adults + data.children + data.infants}</Text></Text>
            <Text>Adults <Text style={styles.tstripB}>{data.adults}</Text></Text>
            <Text>Children <Text style={styles.tstripB}>{data.children}</Text></Text>
            <Text>Infants <Text style={styles.tstripB}>{data.infants}</Text></Text>
            <Text>Rooms <Text style={styles.tstripB}>{totalRooms}</Text></Text>
          </View>

          {hasHighlights && (
            <>
              <SectionHead title="Trip Highlights" />
              <View style={[styles.card, styles.hlCard]}>
                <View style={styles.hlGrid}>
                  {data.highlights.map((h) => (
                    <Text key={h} style={styles.hl}><Text style={styles.hlCheck}>✓</Text> {h}</Text>
                  ))}
                </View>
              </View>
            </>
          )}
        </View>
        <PageFooter pageLabel="02" />
      </Page>

      {/* ========================================================== Page 3 · Itinerary == */}
      {hasItinerary && (
        <Page size="A4" style={styles.page}>
          {band}
          <View style={styles.content}>
            <PageWatermark />
            <SectionHead title="Day-Wise Itinerary" />
            {data.itineraryDays.map((d) => (
              <View key={d.id} style={[styles.card, styles.day]} wrap={false}>
                <View style={styles.dhead}>
                  <Text style={styles.dpill}>Day {d.dayNumber}</Text>
                  <Text style={styles.ddate}>{d.title}</Text>
                </View>
                {d.description && <Text style={styles.dbody}>{d.description}</Text>}
                {d.meals.length > 0 && <Text style={styles.dbody}>Meals: {d.meals.join(", ")}</Text>}
                {d.notes && <Text style={styles.dnote}>Note: {d.notes}</Text>}
              </View>
            ))}
          </View>
          <PageFooter pageLabel="03" />
        </Page>
      )}

      {/* ========================================================== Page 4 · Stay + Activities == */}
      {hasStayPage && (
        <Page size="A4" style={styles.page}>
          {band}
          <View style={styles.content}>
            <PageWatermark />
            {hasHotels && (
              <>
                <SectionHead title="Your Stay" />
                {data.hotelOptions.map((group) =>
                  group.hotels.map((h, i) => (
                    <View key={h.id} style={[styles.split, i % 2 === 1 ? { flexDirection: "row-reverse" as const } : {}]} wrap={false}>
                      <View style={styles.splitTxt}>
                        <Text style={styles.splitH3}>{h.hotelName}</Text>
                        {h.roomType && <View style={styles.srow}><Text style={styles.srowK}>Room</Text><Text style={styles.srowV}>{h.roomType}</Text></View>}
                        {h.checkIn && <View style={styles.srow}><Text style={styles.srowK}>Check-in</Text><Text style={styles.srowV}>{h.checkIn}</Text></View>}
                        {h.checkOut && <View style={styles.srow}><Text style={styles.srowK}>Check-out</Text><Text style={styles.srowV}>{h.checkOut}</Text></View>}
                        {h.mealPlan && <View style={styles.srow}><Text style={styles.srowK}>Plan</Text><Text style={styles.srowV}>{h.mealPlan}</Text></View>}
                        {h.googleMapUrl && <View style={styles.srow}><Text style={styles.srowK}>Map</Text><Link src={h.googleMapUrl} style={styles.srowV}>View on Map</Link></View>}
                        {h.website && <View style={styles.srow}><Text style={styles.srowK}>Website</Text><Link src={h.website} style={styles.srowV}>Visit Website</Link></View>}
                        <Text style={styles.npill}>{h.nights || 1} {h.nights === 1 ? "Night" : "Nights"}</Text>
                      </View>
                      <SplitPic src={h.images?.[0]} />
                    </View>
                  )),
                )}
              </>
            )}

            {hasActivities && (
              <View style={{ marginTop: hasHotels ? 4 : 0 }}>
                <SectionHead title="Activities Included" />
                {data.activities.map((a, i) => (
                  <View key={a.id} style={[styles.split, styles.splitCream, i % 2 === 1 ? { flexDirection: "row-reverse" as const } : {}]} wrap={false}>
                    <View style={styles.splitTxt}>
                      <Text style={styles.splitH3}>{a.name}</Text>
                      {a.activityDate && <View style={styles.srow}><Text style={styles.srowK}>Date</Text><Text style={styles.srowV}>{a.activityDate}</Text></View>}
                      {(a.activityTime || a.duration || a.pax) && (
                        <View style={styles.srow}>
                          <Text style={styles.srowK}>Timing</Text>
                          <Text style={styles.srowV}>{[a.activityTime && `Starts ${a.activityTime}`, a.duration, a.pax ? `${a.pax} Pax` : null].filter(Boolean).join(" · ")}</Text>
                        </View>
                      )}
                      {a.reportingTime && <View style={styles.srow}><Text style={styles.srowK}>Reporting</Text><Text style={styles.srowV}>{a.reportingTime}</Text></View>}
                    </View>
                    <SplitPic src={a.images?.[0]} />
                  </View>
                ))}
              </View>
            )}
          </View>
          <PageFooter pageLabel="04" />
        </Page>
      )}

      {/* ========================================================== Page 5 · Transfers == */}
      {hasTransfers && (
        <Page size="A4" style={styles.page}>
          {band}
          <View style={styles.content}>
            <PageWatermark />
            <SectionHead title="Transfers" />
            {data.transfers.map((t, i) => (
              <View key={t.id} style={[styles.split, i % 2 === 0 ? { flexDirection: "row-reverse" as const } : {}]} wrap={false}>
                <View style={styles.splitTxt}>
                  <Text style={[styles.splitH3, styles.splitH3Route]}>{t.pickupLocation || "-"} → {t.dropLocation || "-"}</Text>
                  {(t.vehicleType || t.name) && <View style={styles.srow}><Text style={styles.srowK}>Vehicle</Text><Text style={styles.srowV}>{t.vehicleType || t.name}</Text></View>}
                  {(t.transferDate || t.duration) && (
                    <View style={styles.srow}><Text style={styles.srowK}>Date</Text><Text style={styles.srowV}>{[t.transferDate, t.duration].filter(Boolean).join(" · ")}</Text></View>
                  )}
                  {(t.pickupTime || t.dropTime) && (
                    <View style={styles.srow}><Text style={styles.srowK}>Pickup</Text><Text style={styles.srowV}>{[t.pickupTime, t.dropTime].filter(Boolean).join(" → ")}</Text></View>
                  )}
                </View>
                <SplitPic src={t.images?.[0]} />
              </View>
            ))}
          </View>
          <PageFooter pageLabel="05" />
        </Page>
      )}

      {/* ========================================================== Page 6 · Inclusions + Price == */}
      <Page size="A4" style={styles.page}>
        {band}
        <View style={styles.content}>
          <PageWatermark />
          <SectionHead title="Inclusions & Exclusions" />
          <View style={styles.grid2}>
            <View style={[styles.card, styles.ieCard, { flex: 1 }]}>
              <Text style={[styles.ieCardTitle, styles.ieCardTitleInc]}>INCLUSIONS</Text>
              {data.inclusionLines.map((line, i) => (
                <View key={i} style={styles.ie}><Text style={styles.ieMarkInc}>✓</Text><Text style={{ flex: 1 }}>{line}</Text></View>
              ))}
            </View>
            <View style={[styles.card, styles.ieCard, { flex: 1 }]}>
              <Text style={[styles.ieCardTitle, styles.ieCardTitleExc]}>EXCLUSIONS</Text>
              {data.exclusionLines.map((line, i) => (
                <View key={i} style={styles.ie}><Text style={styles.ieMarkExc}>✕</Text><Text style={{ flex: 1 }}>{line}</Text></View>
              ))}
            </View>
          </View>

          <SectionHead title="Price Breakdown" />
          <View style={styles.pgrid}>
            <View style={styles.ptableWrap}>
              <View style={styles.ptHeadRow}>
                <Text style={[styles.pth, { flex: 2 }]}>Description</Text>
                <Text style={[styles.pth, { flex: 0.8, textAlign: "center" }]}>Pax</Text>
                <Text style={[styles.pth, { flex: 1.2, textAlign: "right" }]}>Unit Price</Text>
                <Text style={[styles.pth, { flex: 1.2, textAlign: "right" }]}>Total</Text>
              </View>
              {priceRows.map((r) => (
                <View key={r.description} style={styles.ptr}>
                  <Text style={[styles.ptd, { flex: 2 }]}>{r.description}</Text>
                  <Text style={[styles.ptd, { flex: 0.8, textAlign: "center" }]}>{r.pax}</Text>
                  <Text style={[styles.ptd, { flex: 1.2, textAlign: "right" }]}>{r.unit}</Text>
                  <Text style={[styles.ptd, styles.ptdBold, { flex: 1.2, textAlign: "right" }]}>{r.total}</Text>
                </View>
              ))}
            </View>
            <View style={styles.psum}>
              <View style={styles.psumRow}><Text>Package Cost</Text><Text style={styles.psumRowV}>{formatINR(data.subtotal)}</Text></View>
              <View style={styles.psumRow}><Text>GST ({data.gstPercent}%)</Text><Text style={styles.psumRowV}>{formatINR(gstAmount)}</Text></View>
              <View style={styles.gt}>
                <Text style={styles.gtLbl}>GRAND TOTAL</Text>
                <Text style={styles.gtVal}>{formatINR(data.sellingPrice)}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.pnote}>
            Inclusive of GST{data.validUntil ? ` · Valid until ${data.validUntil}` : ""} · Rates are dynamic and subject to availability at the time of booking.
          </Text>
        </View>
        <PageFooter pageLabel="06" />
      </Page>

      {/* ========================================================== Page 7 · Terms + CTA + Lockup == */}
      <Page size="A4" style={styles.page}>
        {band}
        <View style={styles.content}>
          <PageWatermark />
          <SectionHead title="Booking Terms & Policies" />
          <View style={styles.termsGrid}>
            <View style={[styles.card, styles.termCard]}>
              <Text style={styles.termTitle}>Payment Policy</Text>
              <View style={styles.termLi}><Text style={styles.termDot}>•</Text><Text style={{ flex: 1 }}>Advance: {data.advanceAmount > 0 ? formatINR(data.advanceAmount) : "as agreed"} at booking</Text></View>
              <View style={styles.termLi}><Text style={styles.termDot}>•</Text><Text style={{ flex: 1 }}>Balance due before departure, as per confirmation</Text></View>
              <View style={styles.termLi}><Text style={styles.termDot}>•</Text><Text style={{ flex: 1 }}>Accepted: bank transfer, card, UPI</Text></View>
            </View>
            <View style={[styles.card, styles.termCard]}>
              <Text style={styles.termTitle}>Cancellation Policy</Text>
              <View style={styles.termLi}><Text style={styles.termDot}>•</Text><Text style={{ flex: 1 }}>More than 45 days before: partial refund</Text></View>
              <View style={styles.termLi}><Text style={styles.termDot}>•</Text><Text style={{ flex: 1 }}>30–45 days before: reduced refund</Text></View>
              <View style={styles.termLi}><Text style={styles.termDot}>•</Text><Text style={{ flex: 1 }}>Less than 30 days: no refund</Text></View>
              <View style={styles.termLi}><Text style={styles.termDot}>•</Text><Text style={{ flex: 1 }}>All cancellations must be in writing</Text></View>
            </View>
            <View style={[styles.card, styles.termCard]}>
              <Text style={styles.termTitle}>Hotel & Transport Notes</Text>
              <Text style={styles.termP}>
                Hotel accommodations are subject to availability at time of confirmation; equivalent alternatives offered where needed. Early check-in / late check-out chargeable directly at the hotel.
              </Text>
            </View>
            <View style={[styles.card, styles.termCard]}>
              <Text style={styles.termTitle}>Good to Know</Text>
              <View style={styles.termLi}><Text style={styles.termDot}>•</Text><Text style={{ flex: 1 }}>Keep ID / travel documents separate from originals</Text></View>
              <View style={styles.termLi}><Text style={styles.termDot}>•</Text><Text style={{ flex: 1 }}>Pack for destination weather; carry medication</Text></View>
              <View style={styles.termLi}><Text style={styles.termDot}>•</Text><Text style={{ flex: 1 }}>Share itinerary with a trusted contact</Text></View>
              {data.validUntil && <View style={styles.termLi}><Text style={styles.termDot}>•</Text><Text style={{ flex: 1 }}>Quote valid until {data.validUntil}</Text></View>}
            </View>
          </View>

          {data.importantNotes && (
            <View style={[styles.card, styles.termCard, { width: "100%", marginTop: 10 }]}>
              <Text style={styles.termTitle}>Important Notes</Text>
              <Text style={styles.termP}>{data.importantNotes}</Text>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.stat}><Text style={styles.statV}>4.9★</Text><Text style={styles.statL}>AVERAGE RATING</Text></View>
            <View style={styles.stat}><Text style={styles.statV}>25,000+</Text><Text style={styles.statL}>HAPPY TRAVELLERS</Text></View>
            <View style={styles.stat}><Text style={styles.statV}>98%</Text><Text style={styles.statL}>WOULD RECOMMEND</Text></View>
          </View>

          <View style={styles.cta}>
            <Text style={styles.ctaTitle}>Ready to make it yours?</Text>
            <Text style={styles.ctaP1}><Text style={styles.ctaP1B}>{SUPPORT_PHONES.join(" · ")}</Text> · {SUPPORT_EMAIL}</Text>
            <Text style={styles.ctaP2}>{SUPPORT_WEBSITE}</Text>
          </View>

          <View style={styles.closingLockup}>
            <PlaneMark size={38} />
            <View style={styles.closingWord}>
              <Text style={styles.closingWordD2D}>D2D</Text>
              <Text style={styles.closingWordHolidays}>Holidays</Text>
            </View>
            <Text style={styles.closingTagline}>DRIVE TO DESTINATION</Text>
          </View>
        </View>
        <PageFooter pageLabel="07" />
      </Page>

      {/* ========================================================== Page 8 · Thank You == */}
      <Page size="A4" style={styles.page}>
        {band}
        <View style={styles.content}>
          <PageWatermark />
          <Text style={styles.thanksTitle}>Thank you for choosing{"\n"}Drive to Destination</Text>
          <View style={{ marginTop: 16, maxWidth: 400 }}>
            <Text style={styles.thanksMsg}>
              Every unforgettable journey begins with trust. At {COMPANY_FULL_NAME}, we&apos;re proud to be a part of our customers&apos; most cherished travel memories.
            </Text>
            <Text style={styles.thanksMsg}>
              Your reviews inspire us to go the extra mile, ensuring every itinerary is thoughtfully planned, every experience is seamless, and every moment becomes unforgettable.
            </Text>
            <Text style={styles.thanksMsg}>Thank you for choosing us to create memories that last a lifetime.</Text>
          </View>

          <View style={[styles.contactCard, { maxWidth: 420 }]}>
            <Text style={styles.contactCardBold}>D2D Holidays — {COMPANY_FULL_NAME}</Text>
            <Text style={styles.contactCardLine}>Phone: {SUPPORT_PHONES.join(" / ")}</Text>
            <Text style={styles.contactCardLine}>Email: {SUPPORT_EMAIL}</Text>
            <Text style={styles.contactCardLine}>Website: {SUPPORT_WEBSITE}</Text>
            <Text style={styles.contactCardLine}>Address: {SUPPORT_ADDRESS}</Text>
          </View>

          {data.heroImage && (
            <View style={{ marginTop: 16, width: 220, height: 260, borderRadius: 12, overflow: "hidden", alignSelf: "center" }}>
              <Image src={data.heroImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </View>
          )}
        </View>
        <PageFooter pageLabel="08" />
      </Page>
    </Document>
  );
}

export async function renderQuotationPdf(data: QuotationPdfData): Promise<Buffer> {
  return renderToBuffer(<QuotationDocument data={data} />);
}
