import { Document, Page, Text, View, Image, Svg, Path, Defs, LinearGradient, Stop, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { QuotationActivityItem, QuotationHotelOptionGroup, QuotationItineraryDay, QuotationTransferItem } from "@/types/admin";
import { REVIEWS } from "@/data/reviews";

/**
 * Customer-facing quote PDF. Only ever receives the selling price — never
 * per-line cost/margin figures (see "Only the selling price is shown to
 * customers" business rule). Shape mirrors PublicQuoteData from quotationService.
 *
 * Rendered as a dedicated multi-page "quote deck" — a cover page plus one page
 * per content section — rather than a single scrolling page, since this PDF is
 * the primary sales artifact customers decide on.
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
}

const ACCENT = {
  itinerary: "#4f46e5", // indigo
  itineraryBg: "#eef2ff",
  hotels: "#a21caf", // fuchsia
  hotelsBg: "#fdf4ff",
  activities: "#0f766e", // teal
  activitiesBg: "#f0fdfa",
  transfers: "#c2410c", // orange
  transfersBg: "#fff7ed",
  inclusions: "#0f172a", // slate
  pricing: "#1d4ed8", // blue (gradient banner)
  notes: "#b45309", // amber
  reviews: "#0891b2", // cyan
};

const styles = StyleSheet.create({
  page: { paddingTop: 32, paddingHorizontal: 32, paddingBottom: 56, fontSize: 10, fontFamily: "Helvetica", color: "#1e293b" },

  // ---------------------------------------------------------------- Cover --
  masthead: { marginHorizontal: -32, marginTop: -32 },
  mastheadContent: {
    marginTop: -130,
    height: 130,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mastheadBrandRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  mastheadTitle: { fontSize: 30, fontWeight: 700, color: "#ffffff" },
  mastheadTitleAccent: { color: "#a5f3fc" },
  mastheadTagline: { fontSize: 9, fontWeight: 700, color: "#e0f2fe", marginTop: 4, letterSpacing: 1.5 },
  mastheadMeta: { alignItems: "flex-end" },
  mastheadQuoteCode: { fontSize: 13, fontWeight: 700, color: "#ffffff" },
  mastheadQuoteDate: { fontSize: 8.5, color: "#e0f2fe", marginTop: 3 },

  heroBanner: { borderRadius: 10, overflow: "hidden", marginTop: 20 },
  heroImage: { width: "100%", height: 250, objectFit: "cover" },
  heroTitleBar: { padding: 18, backgroundColor: "#0f172a" },
  heroEyebrow: { fontSize: 8, fontWeight: 700, color: "#5eead4", letterSpacing: 2 },
  heroTitle: { fontSize: 23, fontWeight: 700, color: "#ffffff", marginTop: 5 },
  heroSub: { fontSize: 9.5, color: "#cbd5e1", marginTop: 4 },

  metaPillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 16 },
  metaPill: { fontSize: 8.5, fontWeight: 700, borderRadius: 10, paddingVertical: 4, paddingHorizontal: 9 },

  tocWrap: { marginTop: 22, borderRadius: 10, backgroundColor: "#f8fafc", border: "1 solid #e2e8f0", padding: 16 },
  tocTitle: { fontSize: 10.5, fontWeight: 700, color: "#0f172a", marginBottom: 11 },
  tocGrid: { flexDirection: "row", flexWrap: "wrap" },
  tocRow: { flexDirection: "row", alignItems: "center", gap: 8, width: "50%", marginBottom: 9, paddingRight: 8 },
  tocNumberBadge: { width: 17, height: 17, borderRadius: 8.5, alignItems: "center", justifyContent: "center" },
  tocNumberText: { fontSize: 7.5, fontWeight: 700, color: "#ffffff" },
  tocLabel: { fontSize: 8.5, fontWeight: 700, color: "#334155" },

  coverFooterNote: { marginTop: 20, fontSize: 8, color: "#94a3b8", textAlign: "center" },

  // -------------------------------------------------------- Section banner --
  sectionBanner: {
    marginHorizontal: -32,
    marginTop: -32,
    marginBottom: 22,
    paddingHorizontal: 32,
    paddingTop: 26,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  sectionBannerEyebrow: { fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: 2 },
  sectionBannerTitle: { fontSize: 21, fontWeight: 700, color: "#ffffff", marginTop: 5 },
  sectionBannerSubtitle: { fontSize: 9, color: "rgba(255,255,255,0.85)", marginTop: 4 },
  sectionBannerBrand: { alignItems: "flex-end" },
  sectionBannerBrandText: { fontSize: 9, fontWeight: 700, color: "#ffffff" },
  sectionBannerQuoteCode: { fontSize: 7.5, color: "rgba(255,255,255,0.75)", marginTop: 2 },

  // -------------------------------------------------------------- Footer --
  pageFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderTop: "1 solid #e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pageFooterText: { fontSize: 7, color: "#94a3b8" },

  // ------------------------------------------------------------ Itinerary --
  dayCard: { marginBottom: 9, padding: 11, borderRadius: 6, backgroundColor: ACCENT.itineraryBg, borderLeft: `3 solid ${ACCENT.itinerary}` },
  dayBadgeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  dayBadge: { fontSize: 8, fontWeight: 700, color: "#ffffff", backgroundColor: ACCENT.itinerary, borderRadius: 8, paddingVertical: 2, paddingHorizontal: 7 },
  dayTitle: { fontSize: 10.5, fontWeight: 700, color: "#1e1b4b" },
  dayText: { fontSize: 9, color: "#475569", marginTop: 2, lineHeight: 1.4 },
  dayMetaLabel: { fontSize: 8.5, fontWeight: 700, color: ACCENT.itinerary },

  // ---------------------------------------------------------------- Hotels --
  optionBadge: { fontSize: 8, fontWeight: 700, color: "#ffffff", backgroundColor: ACCENT.hotels, borderRadius: 8, paddingVertical: 2, paddingHorizontal: 7, marginBottom: 8, alignSelf: "flex-start" },
  hotelCard: { flexDirection: "row", gap: 10, marginBottom: 9, padding: 11, borderRadius: 6, backgroundColor: ACCENT.hotelsBg, border: "1 solid #f0abfc" },
  hotelImage: { width: 92, height: 78, borderRadius: 4, objectFit: "cover" },
  hotelName: { fontSize: 10.5, fontWeight: 700, color: "#701a75" },
  hotelMeta: { fontSize: 8.5, color: "#6b21a8", marginTop: 2 },
  hotelPillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  hotelPill: { fontSize: 7.5, fontWeight: 700, color: ACCENT.hotels, backgroundColor: "#ffffff", borderRadius: 8, paddingVertical: 2, paddingHorizontal: 6 },

  // ------------------------------------------------ Transfer / Activity --
  detailCard: { flexDirection: "row", gap: 10, marginBottom: 9, padding: 11, borderRadius: 6 },
  transferCard: { backgroundColor: ACCENT.transfersBg, border: "1 solid #fed7aa" },
  activityCard: { backgroundColor: ACCENT.activitiesBg, border: "1 solid #99f6e4" },
  detailImage: { width: 92, height: 78, borderRadius: 4, objectFit: "cover" },
  detailImagePlaceholder: { width: 92, height: 78, borderRadius: 4, backgroundColor: "#ffffff" },
  detailBody: { flex: 1 },
  transferName: { fontSize: 9.5, fontWeight: 700, color: "#7c2d12" },
  transferRoute: { fontSize: 8.5, fontWeight: 700, color: "#9a3412", marginTop: 2 },
  activityName: { fontSize: 9.5, fontWeight: 700, color: "#134e4a" },
  detailPillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  transferPill: { fontSize: 7.5, fontWeight: 700, color: ACCENT.transfers, backgroundColor: "#ffffff", borderRadius: 8, paddingVertical: 2, paddingHorizontal: 6 },
  activityPill: { fontSize: 7.5, fontWeight: 700, color: ACCENT.activities, backgroundColor: "#ffffff", borderRadius: 8, paddingVertical: 2, paddingHorizontal: 6 },
  detailMeta: { fontSize: 8, color: "#475569", marginTop: 3, lineHeight: 1.4 },
  detailNotes: { fontSize: 7.5, color: "#64748b", marginTop: 2, lineHeight: 1.3 },

  // ---------------------------------------------------------- Inclusions --
  twoCol: { flexDirection: "row", gap: 18, marginTop: 4 },
  col: { flex: 1 },
  colHeaderGreen: { fontSize: 11, fontWeight: 700, color: "#047857", marginBottom: 8 },
  colHeaderRose: { fontSize: 11, fontWeight: 700, color: "#be123c", marginBottom: 8 },
  bulletRow: { flexDirection: "row", marginBottom: 5, alignItems: "flex-start" },
  bulletDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#0f766e", marginTop: 4, marginRight: 6 },
  bulletDotRose: { backgroundColor: "#e11d48" },
  bulletText: { fontSize: 9, color: "#334155", flex: 1, lineHeight: 1.4 },

  // -------------------------------------------------------------- Pricing --
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 8, backgroundColor: "#f8fafc", border: "1 solid #e2e8f0", padding: 11, alignItems: "center" },
  statLabel: { fontSize: 6.5, fontWeight: 700, color: "#94a3b8", letterSpacing: 1 },
  statValue: { fontSize: 10.5, fontWeight: 700, color: "#0f172a", marginTop: 4, textAlign: "center" },

  priceCard: { borderRadius: 8, border: "1 solid #e2e8f0", padding: 14 },
  priceCardTitle: { fontSize: 11.5, fontWeight: 700, color: "#0f172a", marginBottom: 8 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottom: "1 dashed #e2e8f0" },
  priceLabel: { fontSize: 9, color: "#475569" },
  priceValue: { fontSize: 9, fontWeight: 700, color: "#0f172a" },

  totalBox: {
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: "#0891b2",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  totalLabel: { fontSize: 12, fontWeight: 700, color: "#ffffff" },
  totalSub: { fontSize: 8, color: "#e0f2fe", marginTop: 2 },
  totalValue: { fontSize: 22, fontWeight: 700, color: "#ffffff" },

  trustRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  trustBadge: { width: "48.5%", flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 6, backgroundColor: "#f0fdfa", border: "1 solid #99f6e4", paddingVertical: 8, paddingHorizontal: 10 },
  trustCheck: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: ACCENT.activities },
  trustText: { fontSize: 8, fontWeight: 700, color: "#134e4a" },

  ctaRibbon: { marginTop: 16, borderRadius: 8, backgroundColor: "#fff1f2", border: "1 solid #fecdd3", padding: 12, alignItems: "center" },
  ctaRibbonText: { fontSize: 8.5, fontWeight: 700, color: "#9f1239", textAlign: "center" },

  // ---------------------------------------------------------------- Notes --
  notesBox: { borderRadius: 8, backgroundColor: "#fffbeb", border: "1 solid #fde68a", padding: 14 },
  notesText: { fontSize: 9, color: "#78350f", lineHeight: 1.6 },

  // -------------------------------------------------------------- Reviews --
  reviewsRow: { flexDirection: "row", gap: 9 },
  reviewCard: { flex: 1, padding: 10, borderRadius: 6, backgroundColor: "#f8fafc", border: "1 solid #e2e8f0" },
  reviewName: { fontSize: 8.5, fontWeight: 700, color: "#0f172a" },
  reviewLocation: { fontSize: 7, color: "#94a3b8", marginTop: 1 },
  reviewStarsRow: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 4 },
  reviewStarDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#f59e0b" },
  reviewStarDotEmpty: { backgroundColor: "#e2e8f0" },
  reviewTrip: { fontSize: 7, fontWeight: 700, color: "#0891b2", marginLeft: 4 },
  reviewComment: { fontSize: 7.5, color: "#475569", marginTop: 5, lineHeight: 1.35 },

  closingBlock: { marginTop: 22, borderRadius: 10, backgroundColor: "#0f172a", padding: 20, alignItems: "center" },
  closingTitle: { fontSize: 15, fontWeight: 700, color: "#ffffff" },
  closingText: { fontSize: 9, color: "#cbd5e1", marginTop: 6, textAlign: "center", lineHeight: 1.5 },
});

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(value);
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Same mark as the web brand (src/components/common/Logo.tsx) in solid white, for contrast on the colorful masthead. */
function CompanyLogoMarkWhite({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M96 8 L3 42 L50 60 Z" fill="#ffffff" />
      <Path d="M96 8 L50 60 L42 95 Z" fill="#ffffff" opacity={0.85} />
      <Path d="M96 8 L50 60" stroke="#0f766e" strokeWidth={1.5} strokeLinecap="round" opacity={0.35} />
    </Svg>
  );
}

/** Full A4 page width in points — the masthead bleeds edge-to-edge, so its art is sized 1:1 against that, not the padded content width (no percentage/viewBox scaling ambiguity either way). */
const MASTHEAD_WIDTH = 595;
const MASTHEAD_HEIGHT = 130;

/**
 * Big colorful masthead: a gradient band with decorative travel motifs (sun, clouds, a flight
 * path with a plane, a mountain skyline) sits in normal flow; the brand lockup is pulled back
 * on top of it with a negative margin — same visual result as absolute overlay, without the
 * absolute-positioning + percentage-size combination that broke the price box earlier.
 */
function CoverMasthead({ quoteCode, createdDate }: { quoteCode: string; createdDate: string }) {
  return (
    <View style={styles.masthead}>
      <Svg width={MASTHEAD_WIDTH} height={MASTHEAD_HEIGHT} viewBox={`0 0 ${MASTHEAD_WIDTH} ${MASTHEAD_HEIGHT}`}>
        <Defs>
          <LinearGradient id="mastheadGrad" x1="0" y1="0" x2={MASTHEAD_WIDTH} y2={MASTHEAD_HEIGHT} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#1d4ed8" />
            <Stop offset="0.55" stopColor="#0891b2" />
            <Stop offset="1" stopColor="#0d9488" />
          </LinearGradient>
        </Defs>
        <Path d={`M0 0 H${MASTHEAD_WIDTH} V${MASTHEAD_HEIGHT} H0 Z`} fill="url(#mastheadGrad)" />
        {/* sun */}
        <Path d="M475 32 m-19,0 a19,19 0 1,0 38,0 a19,19 0 1,0 -38,0" fill="#ffffff" opacity={0.16} />
        {/* distant clouds */}
        <Path d="M380 82 m-13,0 a13,13 0 1,0 26,0 a13,13 0 1,0 -26,0" fill="#ffffff" opacity={0.1} />
        <Path d="M403 88 m-9,0 a9,9 0 1,0 18,0 a9,9 0 1,0 -18,0" fill="#ffffff" opacity={0.1} />
        {/* flight path + plane silhouette */}
        <Path d="M60 95 Q 250 25 495 38" stroke="#ffffff" strokeWidth={1.2} strokeDasharray="3,5" opacity={0.4} fill="none" />
        <Path d="M481 32 L500 38 L481 45 L485 38 Z" fill="#ffffff" opacity={0.55} />
        {/* mountain skyline along the base */}
        <Path d={`M0 ${MASTHEAD_HEIGHT} L55 76 L110 ${MASTHEAD_HEIGHT} Z`} fill="#ffffff" opacity={0.12} />
        <Path d={`M80 ${MASTHEAD_HEIGHT} L150 58 L220 ${MASTHEAD_HEIGHT} Z`} fill="#ffffff" opacity={0.09} />
      </Svg>

      <View style={styles.mastheadContent}>
        <View style={styles.mastheadBrandRow}>
          <CompanyLogoMarkWhite size={52} />
          <View>
            <Text style={styles.mastheadTitle}>D2D <Text style={styles.mastheadTitleAccent}>Holidays</Text></Text>
            <Text style={styles.mastheadTagline}>DRIVE TO DESTINATION</Text>
          </View>
        </View>
        <View style={styles.mastheadMeta}>
          <Text style={styles.mastheadQuoteCode}>{quoteCode}</Text>
          <Text style={styles.mastheadQuoteDate}>{createdDate}</Text>
        </View>
      </View>
    </View>
  );
}

/** Solid-color page header used on every content page (repeats via `fixed` if a section overflows onto extra pages). */
function SectionBanner({
  color,
  eyebrow,
  title,
  subtitle,
  quoteCode,
}: {
  color: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  quoteCode: string;
}) {
  return (
    <View style={[styles.sectionBanner, { backgroundColor: color }]} fixed>
      <View>
        <Text style={styles.sectionBannerEyebrow}>{eyebrow}</Text>
        <Text style={styles.sectionBannerTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionBannerSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.sectionBannerBrand}>
        <Text style={styles.sectionBannerBrandText}>D2D Holidays</Text>
        <Text style={styles.sectionBannerQuoteCode}>{quoteCode}</Text>
      </View>
    </View>
  );
}

/** Gradient variant of SectionBanner, reserved for the pricing/closing page — the page most likely to decide the sale. */
function GradientSectionBanner({
  eyebrow,
  title,
  subtitle,
  quoteCode,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  quoteCode: string;
}) {
  const height = 96;
  return (
    <View style={{ marginHorizontal: -32, marginTop: -32, marginBottom: 22 }} fixed>
      <Svg width={MASTHEAD_WIDTH} height={height} viewBox={`0 0 ${MASTHEAD_WIDTH} ${height}`}>
        <Defs>
          <LinearGradient id="pricingGrad" x1="0" y1="0" x2={MASTHEAD_WIDTH} y2={height} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#1d4ed8" />
            <Stop offset="0.55" stopColor="#0891b2" />
            <Stop offset="1" stopColor="#0d9488" />
          </LinearGradient>
        </Defs>
        <Path d={`M0 0 H${MASTHEAD_WIDTH} V${height} H0 Z`} fill="url(#pricingGrad)" />
        <Path d="M470 20 m-16,0 a16,16 0 1,0 32,0 a16,16 0 1,0 -32,0" fill="#ffffff" opacity={0.12} />
      </Svg>
      <View
        style={{
          marginTop: -height,
          height,
          paddingHorizontal: 32,
          paddingBottom: 20,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <View>
          <Text style={styles.sectionBannerEyebrow}>{eyebrow}</Text>
          <Text style={styles.sectionBannerTitle}>{title}</Text>
          {subtitle && <Text style={styles.sectionBannerSubtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.sectionBannerBrand}>
          <Text style={styles.sectionBannerBrandText}>D2D Holidays</Text>
          <Text style={styles.sectionBannerQuoteCode}>{quoteCode}</Text>
        </View>
      </View>
    </View>
  );
}

function PageFooter({ quoteCode }: { quoteCode: string }) {
  return (
    <View style={styles.pageFooter} fixed>
      <Text style={styles.pageFooterText}>D2D Holidays · Drive to Destination · Quote {quoteCode}</Text>
      <Text style={styles.pageFooterText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

function QuotationDocument({ data }: { data: QuotationPdfData }) {
  const nightsDays = data.nights != null && data.days != null ? `${data.nights}N / ${data.days}D` : null;
  const paxParts = [
    data.adults ? `${data.adults} Adult${data.adults > 1 ? "s" : ""}` : null,
    data.children ? `${data.children} Child${data.children > 1 ? "ren" : ""}` : null,
    data.infants ? `${data.infants} Infant${data.infants > 1 ? "s" : ""}` : null,
  ].filter(Boolean);

  const gstAmount = data.sellingPrice - data.subtotal;
  const splitAcrossChildren = data.includeChildCosting && data.children > 0;
  const pricePerAdult = data.adults > 0
    ? (splitAcrossChildren ? data.subtotal * 0.8 : data.subtotal) / data.adults
    : null;
  const pricePerChild = splitAcrossChildren ? (data.subtotal * 0.2) / data.children : null;

  const hasItinerary = data.itineraryDays.length > 0;
  const hasHotels = data.hotelOptions.some((g) => g.hotels.length > 0);
  const hasActivities = data.activities.length > 0;
  const hasTransfers = data.transfers.length > 0;
  const hasInclusions = data.inclusionLines.length > 0 || data.exclusionLines.length > 0;
  const hasNotes = !!data.importantNotes;

  // Section numbering — every page gets "SECTION 0X OF 0Y" in its banner, and the cover's
  // table of contents uses the same numbers, so the document reads as a coherent deck.
  let counter = 0;
  const itineraryNum = hasItinerary ? ++counter : 0;
  const hotelsNum = hasHotels ? ++counter : 0;
  const activitiesNum = hasActivities ? ++counter : 0;
  const transfersNum = hasTransfers ? ++counter : 0;
  const inclusionsNum = hasInclusions ? ++counter : 0;
  const pricingNum = ++counter;
  const notesNum = hasNotes ? ++counter : 0;
  const reviewsNum = ++counter;
  const totalSections = counter;

  const tocEntries: { num: number; label: string; color: string }[] = [
    hasItinerary && { num: itineraryNum, label: "Day-wise Itinerary", color: ACCENT.itinerary },
    hasHotels && { num: hotelsNum, label: "Your Stay", color: ACCENT.hotels },
    hasActivities && { num: activitiesNum, label: "Activities Included", color: ACCENT.activities },
    hasTransfers && { num: transfersNum, label: "Transfers", color: ACCENT.transfers },
    hasInclusions && { num: inclusionsNum, label: "Inclusions & Exclusions", color: ACCENT.inclusions },
    { num: pricingNum, label: "Price Breakdown & Booking", color: ACCENT.pricing },
    hasNotes && { num: notesNum, label: "Important Notes", color: ACCENT.notes },
    { num: reviewsNum, label: "Traveller Reviews", color: ACCENT.reviews },
  ].filter(Boolean) as { num: number; label: string; color: string }[];

  const eyebrow = (num: number) => `SECTION ${pad2(num)} OF ${pad2(totalSections)}`;

  const trustBadges = [
    "Best Price Guaranteed",
    "24 x 7 Concierge Support",
    "Handpicked Stays & Experiences",
    "Secure & Easy Booking",
  ];

  return (
    <Document>
      {/* ---------------------------------------------------------- Cover -- */}
      <Page size="A4" style={styles.page}>
        <CoverMasthead quoteCode={data.quoteCode} createdDate={data.createdDate} />

        <View style={styles.heroBanner}>
          {data.heroImage && <Image src={data.heroImage} style={styles.heroImage} />}
          <View style={styles.heroTitleBar}>
            <Text style={styles.heroEyebrow}>YOUR PERSONALISED TRAVEL QUOTE</Text>
            <Text style={styles.heroTitle}>{data.packageName || data.destinationName}</Text>
            <Text style={styles.heroSub}>
              Prepared for {data.customerName}{nightsDays ? ` · ${nightsDays}` : ""} · {data.destinationName}
            </Text>
          </View>
        </View>

        <View style={styles.metaPillsRow}>
          {data.travelDate && <Text style={[styles.metaPill, { color: "#1d4ed8", backgroundColor: "#dbeafe" }]}>Travel Date: {data.travelDate}</Text>}
          {paxParts.length > 0 && <Text style={[styles.metaPill, { color: "#a16207", backgroundColor: "#fef9c3" }]}>{paxParts.join(", ")}</Text>}
          {data.validUntil && <Text style={[styles.metaPill, { color: "#be123c", backgroundColor: "#ffe4e6" }]}>Valid Until: {data.validUntil}</Text>}
        </View>

        <View style={styles.tocWrap}>
          <Text style={styles.tocTitle}>What&apos;s Inside This Quote</Text>
          <View style={styles.tocGrid}>
            {tocEntries.map((entry) => (
              <View key={entry.label} style={styles.tocRow}>
                <View style={[styles.tocNumberBadge, { backgroundColor: entry.color }]}>
                  <Text style={styles.tocNumberText}>{pad2(entry.num)}</Text>
                </View>
                <Text style={styles.tocLabel}>{entry.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.coverFooterNote}>
          This is an indicative quotation and is subject to availability at the time of booking.
        </Text>

        <PageFooter quoteCode={data.quoteCode} />
      </Page>

      {/* ------------------------------------------------------ Itinerary -- */}
      {hasItinerary && (
        <Page size="A4" style={styles.page}>
          <SectionBanner
            color={ACCENT.itinerary}
            eyebrow={eyebrow(itineraryNum)}
            title="Day-wise Itinerary"
            subtitle="Every day, planned so you don't have to"
            quoteCode={data.quoteCode}
          />
          {data.itineraryDays.map((d) => (
            <View key={d.id} style={styles.dayCard} wrap={false}>
              <View style={styles.dayBadgeRow}>
                <Text style={styles.dayBadge}>DAY {d.dayNumber}</Text>
                <Text style={styles.dayTitle}>{d.title}</Text>
              </View>
              {d.description && <Text style={styles.dayText}>{d.description}</Text>}
              {d.meals.length > 0 && (
                <Text style={styles.dayText}><Text style={styles.dayMetaLabel}>Meals: </Text>{d.meals.join(", ")}</Text>
              )}
              {d.notes && <Text style={styles.dayText}><Text style={styles.dayMetaLabel}>Notes: </Text>{d.notes}</Text>}
            </View>
          ))}
          <PageFooter quoteCode={data.quoteCode} />
        </Page>
      )}

      {/* ---------------------------------------------------------- Hotels -- */}
      {hasHotels && (
        <Page size="A4" style={styles.page}>
          <SectionBanner
            color={ACCENT.hotels}
            eyebrow={eyebrow(hotelsNum)}
            title="Your Stay"
            subtitle="Handpicked stays for an unforgettable experience"
            quoteCode={data.quoteCode}
          />
          {data.hotelOptions.map((group) =>
            group.hotels.length === 0 ? null : (
              <View key={group.id} wrap={false}>
                {data.hotelOptions.length > 1 && <Text style={styles.optionBadge}>{group.label}</Text>}
                {group.hotels.map((h) => (
                  <View key={h.id} style={styles.hotelCard} wrap={false}>
                    {h.images?.[0] && <Image src={h.images[0]} style={styles.hotelImage} />}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.hotelName}>{h.hotelName}</Text>
                      {h.description && <Text style={styles.hotelMeta}>{h.description}</Text>}
                      <View style={styles.hotelPillsRow}>
                        {h.roomType && <Text style={styles.hotelPill}>{h.roomType}</Text>}
                        {h.checkIn && <Text style={styles.hotelPill}>Check-in: {h.checkIn}</Text>}
                        {h.checkOut && <Text style={styles.hotelPill}>Check-out: {h.checkOut}</Text>}
                        {h.mealPlan && <Text style={styles.hotelPill}>{h.mealPlan}</Text>}
                        {h.nights > 0 && <Text style={styles.hotelPill}>{h.nights}N · {h.rooms} Room{h.rooms > 1 ? "s" : ""}</Text>}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ),
          )}
          <PageFooter quoteCode={data.quoteCode} />
        </Page>
      )}

      {/* ------------------------------------------------------ Activities -- */}
      {hasActivities && (
        <Page size="A4" style={styles.page}>
          <SectionBanner
            color={ACCENT.activities}
            eyebrow={eyebrow(activitiesNum)}
            title="Activities Included"
            subtitle="Experiences that make the trip unforgettable"
            quoteCode={data.quoteCode}
          />
          {data.activities.map((a) => (
            <View key={a.id} style={[styles.detailCard, styles.activityCard]} wrap={false}>
              {a.images?.[0] ? (
                <Image src={a.images[0]} style={styles.detailImage} />
              ) : (
                <View style={styles.detailImagePlaceholder} />
              )}
              <View style={styles.detailBody}>
                <Text style={styles.activityName}>{a.name}</Text>
                <View style={styles.detailPillsRow}>
                  {a.activityDate && <Text style={styles.activityPill}>{a.activityDate}</Text>}
                  {a.activityTime && <Text style={styles.activityPill}>Starts {a.activityTime}</Text>}
                  {a.duration && <Text style={styles.activityPill}>{a.duration}</Text>}
                  {a.pax > 0 && <Text style={styles.activityPill}>{a.pax} Pax</Text>}
                </View>
                {a.reportingTime && <Text style={styles.detailMeta}>Reporting time: {a.reportingTime}</Text>}
                {a.description && <Text style={styles.detailMeta}>{a.description}</Text>}
                {a.notes && <Text style={styles.detailNotes}>{a.notes}</Text>}
              </View>
            </View>
          ))}
          <PageFooter quoteCode={data.quoteCode} />
        </Page>
      )}

      {/* -------------------------------------------------------- Transfers -- */}
      {hasTransfers && (
        <Page size="A4" style={styles.page}>
          <SectionBanner
            color={ACCENT.transfers}
            eyebrow={eyebrow(transfersNum)}
            title="Transfers"
            subtitle="Seamless movement, door to door"
            quoteCode={data.quoteCode}
          />
          {data.transfers.map((t) => (
            <View key={t.id} style={[styles.detailCard, styles.transferCard]} wrap={false}>
              {t.images?.[0] ? (
                <Image src={t.images[0]} style={styles.detailImage} />
              ) : (
                <View style={styles.detailImagePlaceholder} />
              )}
              <View style={styles.detailBody}>
                <Text style={styles.transferName}>{t.name || t.vehicleType || "Transfer"}</Text>
                {(t.pickupLocation || t.dropLocation) && (
                  <Text style={styles.transferRoute}>{t.pickupLocation} {"->"} {t.dropLocation}</Text>
                )}
                <View style={styles.detailPillsRow}>
                  {t.vehicleType && <Text style={styles.transferPill}>{t.vehicleType}</Text>}
                  <Text style={styles.transferPill}>{t.mode}</Text>
                  {t.transferDate && <Text style={styles.transferPill}>{t.transferDate}</Text>}
                  {t.duration && <Text style={styles.transferPill}>{t.duration}</Text>}
                </View>
                {(t.pickupTime || t.dropTime) && (
                  <Text style={styles.detailMeta}>
                    {t.pickupTime && `Pickup ${t.pickupTime}`}
                    {t.pickupTime && t.dropTime && "  ·  "}
                    {t.dropTime && `Drop ${t.dropTime}`}
                  </Text>
                )}
                {t.description && <Text style={styles.detailMeta}>{t.description}</Text>}
                {t.notes && <Text style={styles.detailNotes}>{t.notes}</Text>}
              </View>
            </View>
          ))}
          <PageFooter quoteCode={data.quoteCode} />
        </Page>
      )}

      {/* ------------------------------------------------------ Inclusions -- */}
      {hasInclusions && (
        <Page size="A4" style={styles.page}>
          <SectionBanner
            color={ACCENT.inclusions}
            eyebrow={eyebrow(inclusionsNum)}
            title="Inclusions & Exclusions"
            subtitle="No surprises — know exactly what's covered"
            quoteCode={data.quoteCode}
          />
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.colHeaderGreen}>Inclusions</Text>
              {data.inclusionLines.map((line, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{line}</Text>
                </View>
              ))}
            </View>
            <View style={styles.col}>
              <Text style={styles.colHeaderRose}>Exclusions</Text>
              {data.exclusionLines.map((line, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={[styles.bulletDot, styles.bulletDotRose]} />
                  <Text style={styles.bulletText}>{line}</Text>
                </View>
              ))}
            </View>
          </View>
          <PageFooter quoteCode={data.quoteCode} />
        </Page>
      )}

      {/* ---------------------------------------------------------- Pricing -- */}
      <Page size="A4" style={styles.page}>
        <GradientSectionBanner
          eyebrow={eyebrow(pricingNum)}
          title="Price Breakdown & Booking"
          subtitle="Transparent pricing — no hidden costs"
          quoteCode={data.quoteCode}
        />

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>DESTINATION</Text>
            <Text style={styles.statValue}>{data.destinationName}</Text>
          </View>
          {nightsDays && (
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>DURATION</Text>
              <Text style={styles.statValue}>{nightsDays}</Text>
            </View>
          )}
          {paxParts.length > 0 && (
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>TRAVELLERS</Text>
              <Text style={styles.statValue}>{paxParts.join(", ")}</Text>
            </View>
          )}
          {data.validUntil && (
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>VALID UNTIL</Text>
              <Text style={styles.statValue}>{data.validUntil}</Text>
            </View>
          )}
        </View>

        <View style={styles.priceCard} wrap={false}>
          <Text style={styles.priceCardTitle}>Price Break down</Text>
          {paxParts.length > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Travellers</Text>
              <Text style={styles.priceValue}>{paxParts.join(", ")}</Text>
            </View>
          )}
          {(data.travelDate || data.travelEndDate) && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Travel Dates</Text>
              <Text style={styles.priceValue}>
                {data.travelDate ?? "-"}
                {data.travelEndDate ? ` -> ${data.travelEndDate}` : ""}
              </Text>
            </View>
          )}
          {pricePerAdult != null && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Price per Adult</Text>
              <Text style={styles.priceValue}>{formatINR(pricePerAdult)}</Text>
            </View>
          )}
          {pricePerChild != null && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Price per Child</Text>
              <Text style={styles.priceValue}>{formatINR(pricePerChild)}</Text>
            </View>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Package Cost</Text>
            <Text style={styles.priceValue}>{formatINR(data.subtotal)}</Text>
          </View>
          <View style={[styles.priceRow, { borderBottom: "none" }]}>
            <Text style={styles.priceLabel}>GST ({data.gstPercent}%)</Text>
            <Text style={styles.priceValue}>{formatINR(gstAmount)}</Text>
          </View>
        </View>

        <View style={styles.totalBox} wrap={false}>
          <View>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalSub}>Inclusive of GST{data.validUntil ? ` · Valid until ${data.validUntil}` : ""}</Text>
          </View>
          <Text style={styles.totalValue}>{formatINR(data.sellingPrice)}</Text>
        </View>

        <View style={styles.trustRow}>
          {trustBadges.map((label) => (
            <View key={label} style={styles.trustBadge}>
              <View style={styles.trustCheck} />
              <Text style={styles.trustText}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.ctaRibbon} wrap={false}>
          <Text style={styles.ctaRibbonText}>
            {data.validUntil ? `This quote is valid until ${data.validUntil}. ` : ""}Reserve your dates today — availability is subject to change.
          </Text>
        </View>

        <PageFooter quoteCode={data.quoteCode} />
      </Page>

      {/* ------------------------------------------------------------ Notes -- */}
      {hasNotes && (
        <Page size="A4" style={styles.page}>
          <SectionBanner
            color={ACCENT.notes}
            eyebrow={eyebrow(notesNum)}
            title="Important Notes"
            subtitle="Please read before you travel"
            quoteCode={data.quoteCode}
          />
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>{data.importantNotes}</Text>
          </View>
          <PageFooter quoteCode={data.quoteCode} />
        </Page>
      )}

      {/* --------------------------------------------------------- Reviews -- */}
      <Page size="A4" style={styles.page}>
        <SectionBanner
          color={ACCENT.reviews}
          eyebrow={eyebrow(reviewsNum)}
          title="Real Reviews from Real Journeys"
          subtitle="Trusted by travellers across India"
          quoteCode={data.quoteCode}
        />
        <View style={styles.reviewsRow}>
          {REVIEWS.slice(0, 3).map((r) => (
            <View key={r.id} style={styles.reviewCard}>
              <Text style={styles.reviewName}>{r.name}</Text>
              <Text style={styles.reviewLocation}>{r.location}</Text>
              <View style={styles.reviewStarsRow}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <View
                    key={i}
                    style={i < r.rating ? styles.reviewStarDot : { ...styles.reviewStarDot, ...styles.reviewStarDotEmpty }}
                  />
                ))}
                <Text style={styles.reviewTrip}>{r.trip}</Text>
              </View>
              <Text style={styles.reviewComment}>&quot;{r.comment}&quot;</Text>
            </View>
          ))}
        </View>

        <View style={styles.closingBlock} wrap={false}>
          <Text style={styles.closingTitle}>Ready to make it real?</Text>
          <Text style={styles.closingText}>
            Reply to confirm this quotation, or reach us at +91 98765 43210 / info@d2dholidays.com — our travel experts are on standby to help you book.
          </Text>
        </View>

        <PageFooter quoteCode={data.quoteCode} />
      </Page>
    </Document>
  );
}

export async function renderQuotationPdf(data: QuotationPdfData): Promise<Buffer> {
  return renderToBuffer(<QuotationDocument data={data} />);
}
