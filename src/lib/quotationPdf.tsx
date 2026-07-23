import { Document, Page, Text, View, Image, Svg, Path, Defs, LinearGradient, Stop, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { QuotationActivityItem, QuotationHotelOptionGroup, QuotationItineraryDay, QuotationTransferItem } from "@/types/admin";

/**
 * Customer-facing quote PDF. Only ever receives the selling price — never
 * per-line cost/margin figures (see "Only the selling price is shown to
 * customers" business rule). Shape mirrors PublicQuoteData from quotationService.
 */
export interface QuotationPdfData {
  quoteCode: string;
  customerName: string;
  destinationName: string;
  packageName: string | null;
  heroImage: string;
  travelDate: string | null;
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
  sellingPrice: number;
}

const ACCENT = {
  itinerary: "#4f46e5", // indigo
  itineraryBg: "#eef2ff",
  hotels: "#a21caf", // fuchsia
  hotelsBg: "#fdf4ff",
  transfers: "#c2410c", // orange
  transfersBg: "#fff7ed",
  activities: "#0f766e", // teal
  activitiesBg: "#f0fdfa",
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#1e293b" },

  masthead: { marginBottom: 18, marginHorizontal: -32, marginTop: -32 },
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

  heroBanner: { borderRadius: 8, overflow: "hidden", marginBottom: 14 },
  heroImage: { width: "100%", height: 150, objectFit: "cover" },
  heroTitleBar: { padding: 14, backgroundColor: "#0f172a" },
  heroTitle: { fontSize: 18, fontWeight: 700, color: "#ffffff" },
  heroSub: { fontSize: 9.5, color: "#cbd5e1", marginTop: 3 },

  metaPillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 },
  metaPill: { fontSize: 8.5, fontWeight: 700, borderRadius: 10, paddingVertical: 4, paddingHorizontal: 9 },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, marginTop: 6 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 12, fontWeight: 700 },

  dayCard: { marginBottom: 8, padding: 10, borderRadius: 6, backgroundColor: ACCENT.itineraryBg, borderLeft: `3 solid ${ACCENT.itinerary}` },
  dayBadgeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  dayBadge: { fontSize: 8, fontWeight: 700, color: "#ffffff", backgroundColor: ACCENT.itinerary, borderRadius: 8, paddingVertical: 2, paddingHorizontal: 7 },
  dayTitle: { fontSize: 10.5, fontWeight: 700, color: "#1e1b4b" },
  dayText: { fontSize: 9, color: "#475569", marginTop: 2, lineHeight: 1.4 },
  dayMetaLabel: { fontSize: 8.5, fontWeight: 700, color: ACCENT.itinerary },

  optionBadge: { fontSize: 8, fontWeight: 700, color: "#ffffff", backgroundColor: ACCENT.hotels, borderRadius: 8, paddingVertical: 2, paddingHorizontal: 7, marginBottom: 6, alignSelf: "flex-start" },
  hotelCard: { flexDirection: "row", gap: 10, marginBottom: 8, padding: 10, borderRadius: 6, backgroundColor: ACCENT.hotelsBg, border: `1 solid #f0abfc` },
  hotelImage: { width: 84, height: 62, borderRadius: 4, objectFit: "cover" },
  hotelName: { fontSize: 10.5, fontWeight: 700, color: "#701a75" },
  hotelMeta: { fontSize: 8.5, color: "#6b21a8", marginTop: 2 },
  hotelPillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  hotelPill: { fontSize: 7.5, fontWeight: 700, color: ACCENT.hotels, backgroundColor: "#ffffff", borderRadius: 8, paddingVertical: 2, paddingHorizontal: 6 },

  transferCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6, padding: 9, borderRadius: 6, backgroundColor: ACCENT.transfersBg, border: "1 solid #fed7aa" },
  transferName: { fontSize: 9.5, fontWeight: 700, color: "#7c2d12" },
  transferRoute: { fontSize: 8.5, color: "#9a3412", marginTop: 2 },
  transferModeBadge: { fontSize: 7.5, fontWeight: 700, color: "#ffffff", backgroundColor: ACCENT.transfers, borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8 },

  activityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  activityCard: { width: "48%", marginBottom: 8, padding: 9, borderRadius: 6, backgroundColor: ACCENT.activitiesBg, border: "1 solid #99f6e4" },
  activityName: { fontSize: 9.5, fontWeight: 700, color: "#134e4a" },
  activityMeta: { fontSize: 8, color: "#0f766e", marginTop: 2 },

  twoCol: { flexDirection: "row", gap: 16, marginTop: 4 },
  col: { flex: 1 },
  colHeaderGreen: { fontSize: 10.5, fontWeight: 700, color: "#047857", marginBottom: 6 },
  colHeaderRose: { fontSize: 10.5, fontWeight: 700, color: "#be123c", marginBottom: 6 },
  bulletRow: { flexDirection: "row", marginBottom: 4, alignItems: "flex-start" },
  bulletDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#0f766e", marginTop: 4, marginRight: 6 },
  bulletDotRose: { backgroundColor: "#e11d48" },
  bulletText: { fontSize: 9, color: "#334155", flex: 1, lineHeight: 1.4 },

  totalBox: {
    marginTop: 18,
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

  footer: { position: "absolute", bottom: 20, left: 32, right: 32, fontSize: 7.5, color: "#94a3b8", textAlign: "center" },
});

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(value);
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

function QuotationDocument({ data }: { data: QuotationPdfData }) {
  const nightsDays = data.nights != null && data.days != null ? `${data.nights}N / ${data.days}D` : null;
  const paxParts = [
    data.adults ? `${data.adults} Adult${data.adults > 1 ? "s" : ""}` : null,
    data.children ? `${data.children} Child${data.children > 1 ? "ren" : ""}` : null,
    data.infants ? `${data.infants} Infant${data.infants > 1 ? "s" : ""}` : null,
  ].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <CoverMasthead quoteCode={data.quoteCode} createdDate={data.createdDate} />

        <View style={styles.heroBanner}>
          {data.heroImage && <Image src={data.heroImage} style={styles.heroImage} />}
          <View style={styles.heroTitleBar}>
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

        {data.itineraryDays.length > 0 && (
          <View wrap>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: ACCENT.itinerary }]} />
              <Text style={styles.sectionTitle}>Day-wise Itinerary</Text>
            </View>
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
          </View>
        )}

        {data.hotelOptions.some((g) => g.hotels.length > 0) && (
          <View wrap>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: ACCENT.hotels }]} />
              <Text style={styles.sectionTitle}>Your Stay</Text>
            </View>
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
                          {h.mealPlan && <Text style={styles.hotelPill}>{h.mealPlan}</Text>}
                          {h.nights > 0 && <Text style={styles.hotelPill}>{h.nights}N · {h.rooms} Room{h.rooms > 1 ? "s" : ""}</Text>}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ),
            )}
          </View>
        )}

        {data.transfers.length > 0 && (
          <View wrap>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: ACCENT.transfers }]} />
              <Text style={styles.sectionTitle}>Transfers</Text>
            </View>
            {data.transfers.map((t) => (
              <View key={t.id} style={styles.transferCard} wrap={false}>
                <View>
                  <Text style={styles.transferName}>{t.name}</Text>
                  {(t.pickupLocation || t.dropLocation) && (
                    <Text style={styles.transferRoute}>{t.pickupLocation} {"->"} {t.dropLocation}</Text>
                  )}
                </View>
                <Text style={styles.transferModeBadge}>{t.vehicleType || t.mode}</Text>
              </View>
            ))}
          </View>
        )}

        {data.activities.length > 0 && (
          <View wrap>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: ACCENT.activities }]} />
              <Text style={styles.sectionTitle}>Activities</Text>
            </View>
            <View style={styles.activityGrid}>
              {data.activities.map((a) => (
                <View key={a.id} style={styles.activityCard} wrap={false}>
                  <Text style={styles.activityName}>{a.name}</Text>
                  {a.duration && <Text style={styles.activityMeta}>Duration: {a.duration}</Text>}
                  {a.pax > 0 && <Text style={styles.activityMeta}>{a.pax} Pax</Text>}
                </View>
              ))}
            </View>
          </View>
        )}

        {(data.inclusionLines.length > 0 || data.exclusionLines.length > 0) && (
          <View wrap>
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
          </View>
        )}

        <View style={styles.totalBox} wrap={false}>
          <View>
            <Text style={styles.totalLabel}>Total Package Price</Text>
            <Text style={styles.totalSub}>Inclusive of GST{data.validUntil ? ` · Valid until ${data.validUntil}` : ""}</Text>
          </View>
          <Text style={styles.totalValue}>{formatINR(data.sellingPrice)}</Text>
        </View>

        <Text style={styles.footer} fixed>
          This is an indicative quotation and is subject to availability at the time of booking. D2D Holidays — Drive to Destination.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderQuotationPdf(data: QuotationPdfData): Promise<Buffer> {
  return renderToBuffer(<QuotationDocument data={data} />);
}
