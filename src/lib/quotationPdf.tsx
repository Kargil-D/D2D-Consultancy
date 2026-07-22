import { Document, Page, Text, View, Image, Svg, Path, Defs, LinearGradient, Stop, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { ActivityDetail, HotelStayDetail, ItineraryDayDetail, TransferStopDetail } from "@/types/admin";

/**
 * Customer-facing quote PDF. Only ever receives the selling price — never
 * per-line cost/margin figures (see "Only the selling price is shown to
 * customers" business rule).
 */
export interface QuotationPdfData {
  quoteCode: string;
  customerName: string;
  destinationName: string;
  travelDate: string | null;
  createdDate: string;
  components: { component: string; detail: string; qty: number }[];
  sellingPrice: number;
  campaignDetail?: {
    name: string;
    nights: number;
    days: number;
    heroImage: string;
    itineraryDays: ItineraryDayDetail[];
    hotels: HotelStayDetail[];
    activities: ActivityDetail[];
    transfers: (TransferStopDetail & { typeName: string })[];
    inclusionLines: string[];
    exclusionLines: string[];
  };
}

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, fontFamily: "Helvetica", color: "#1e293b" },
  header: { marginBottom: 16, paddingBottom: 14, borderBottom: "2 solid #06b6d4", flexDirection: "row", alignItems: "center", gap: 10 },
  brand: { fontSize: 18, fontWeight: 700, color: "#0f766e" },
  brandAccent: { color: "#0891b2" },
  tagline: { fontSize: 9, color: "#64748b", marginTop: 2 },
  title: { fontSize: 16, fontWeight: 700, marginTop: 16, marginBottom: 4 },
  meta: { fontSize: 10, color: "#475569", marginBottom: 2 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 8 },
  row: { flexDirection: "row", borderBottom: "1 solid #e2e8f0", paddingVertical: 6 },
  rowHeader: { flexDirection: "row", backgroundColor: "#f1f5f9", paddingVertical: 6, fontWeight: 700 },
  colComponent: { width: "30%" },
  colDetail: { width: "55%" },
  colQty: { width: "15%", textAlign: "right" },
  totalBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#f0fdfa",
    borderRadius: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: 13, fontWeight: 700 },
  totalValue: { fontSize: 20, fontWeight: 700, color: "#0f766e" },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 8, color: "#94a3b8", textAlign: "center" },

  heroImage: { width: "100%", height: 160, borderRadius: 4, marginTop: 12, objectFit: "cover" },
  heroTitle: { fontSize: 20, fontWeight: 700, marginTop: 14 },
  heroSub: { fontSize: 11, color: "#475569", marginTop: 3 },
  highlightsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  highlightPill: { fontSize: 8, fontWeight: 700, color: "#0e7490", backgroundColor: "#ecfeff", borderRadius: 10, paddingVertical: 3, paddingHorizontal: 8 },

  dayCard: { marginBottom: 10, padding: 12, borderRadius: 4, border: "1 solid #e2e8f0" },
  dayTitle: { fontSize: 11, fontWeight: 700, marginBottom: 3 },
  dayText: { fontSize: 9.5, color: "#475569", marginBottom: 3, lineHeight: 1.4 },
  dayMetaLabel: { fontSize: 8.5, fontWeight: 700, color: "#0f766e" },

  hotelCard: { flexDirection: "row", gap: 10, marginBottom: 10, padding: 10, borderRadius: 4, border: "1 solid #e2e8f0" },
  hotelImage: { width: 90, height: 66, borderRadius: 3, objectFit: "cover" },
  hotelName: { fontSize: 11, fontWeight: 700 },
  hotelMeta: { fontSize: 9, color: "#475569", marginTop: 2 },

  bulletRow: { flexDirection: "row", marginBottom: 4, alignItems: "flex-start" },
  bulletDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#0f766e", marginTop: 4, marginRight: 6 },
  bulletDotRose: { backgroundColor: "#e11d48" },
  bulletText: { fontSize: 9.5, color: "#334155", flex: 1, lineHeight: 1.4 },

  twoCol: { flexDirection: "row", gap: 16, marginTop: 4 },
  col: { flex: 1 },
  colHeaderGreen: { fontSize: 11, fontWeight: 700, color: "#047857", marginBottom: 6 },
  colHeaderRose: { fontSize: 11, fontWeight: 700, color: "#be123c", marginBottom: 6 },

  transferRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottom: "1 solid #f1f5f9" },
  transferRoute: { fontSize: 9.5, color: "#334155" },
  transferType: { fontSize: 8.5, fontWeight: 700, color: "#0e7490" },
});

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(value);
}

/** Pixel-accurate reproduction of the web brand mark (src/components/common/Logo.tsx) using react-pdf's native SVG primitives. */
function CompanyLogoMark() {
  return (
    <Svg width={26} height={26} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="d2dPlaneGrad" x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#0d9488" />
          <Stop offset="1" stopColor="#67e8f9" />
        </LinearGradient>
      </Defs>
      <Path d="M96 8 L3 42 L50 60 Z" fill="url(#d2dPlaneGrad)" />
      <Path d="M96 8 L50 60 L42 95 Z" fill="url(#d2dPlaneGrad)" />
      <Path d="M96 8 L50 60" stroke="#ffffff" strokeWidth={1.5} strokeLinecap="round" opacity={0.45} />
    </Svg>
  );
}

function QuotationDocument({ data }: { data: QuotationPdfData }) {
  const detail = data.campaignDetail;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <CompanyLogoMark />
          <View>
            <Text style={styles.brand}>D2D <Text style={styles.brandAccent}>Holidays</Text></Text>
            <Text style={styles.tagline}>Drive to Destination</Text>
          </View>
        </View>

        <Text style={styles.meta}>Quote ID: {data.quoteCode}</Text>
        <Text style={styles.meta}>Prepared for: {data.customerName}</Text>
        {!detail && <Text style={styles.meta}>Destination: {data.destinationName}</Text>}
        {data.travelDate && <Text style={styles.meta}>Travel Date: {data.travelDate}</Text>}
        <Text style={styles.meta}>Date: {data.createdDate}</Text>

        {detail ? (
          <>
            {detail.heroImage && <Image src={detail.heroImage} style={styles.heroImage} />}
            <Text style={styles.heroTitle}>{detail.name}</Text>
            <Text style={styles.heroSub}>{detail.nights}N / {detail.days}D · {data.destinationName}</Text>
            {detail.activities.length > 0 && (
              <View style={styles.highlightsRow}>
                {detail.activities.map((a) => (
                  <Text key={a.id} style={styles.highlightPill}>{a.title}</Text>
                ))}
              </View>
            )}

            {detail.itineraryDays.length > 0 && (
              <View style={styles.section} wrap>
                <Text style={styles.sectionTitle}>Day-wise Itinerary</Text>
                {detail.itineraryDays.map((d) => (
                  <View key={d.id} style={styles.dayCard} wrap={false}>
                    <Text style={styles.dayTitle}>Day {d.dayNumber}: {d.title}</Text>
                    {d.description && <Text style={styles.dayText}>{d.description}</Text>}
                    {d.activities.length > 0 && (
                      <Text style={styles.dayText}><Text style={styles.dayMetaLabel}>Activities: </Text>{d.activities.join(", ")}</Text>
                    )}
                    {d.mealsIncluded.length > 0 && (
                      <Text style={styles.dayText}><Text style={styles.dayMetaLabel}>Meals: </Text>{d.mealsIncluded.join(", ")}</Text>
                    )}
                    {d.stayDetails && (
                      <Text style={styles.dayText}><Text style={styles.dayMetaLabel}>Stay: </Text>{d.stayDetails}</Text>
                    )}
                    {d.transportDetails && (
                      <Text style={styles.dayText}><Text style={styles.dayMetaLabel}>Transport: </Text>{d.transportDetails}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {detail.hotels.length > 0 && (
              <View style={styles.section} wrap>
                <Text style={styles.sectionTitle}>Your Hotel</Text>
                {detail.hotels.map((h) => (
                  <View key={h.id} style={styles.hotelCard} wrap={false}>
                    {h.images?.[0] && <Image src={h.images[0]} style={styles.hotelImage} />}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.hotelName}>{h.name}</Text>
                      <Text style={styles.hotelMeta}>{h.roomType}</Text>
                      {h.description && <Text style={styles.hotelMeta}>{h.description}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {detail.transfers.length > 0 && (
              <View style={styles.section} wrap>
                <Text style={styles.sectionTitle}>Transfers</Text>
                {detail.transfers.map((t) => (
                  <View key={t.id} style={styles.transferRow}>
                    <Text style={styles.transferRoute}>{t.from} {"->"} {t.to}</Text>
                    <Text style={styles.transferType}>{t.typeName}</Text>
                  </View>
                ))}
              </View>
            )}

            {(detail.inclusionLines.length > 0 || detail.exclusionLines.length > 0) && (
              <View style={styles.section} wrap>
                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={styles.colHeaderGreen}>Inclusions</Text>
                    {detail.inclusionLines.map((line, i) => (
                      <View key={i} style={styles.bulletRow}>
                        <View style={styles.bulletDot} />
                        <Text style={styles.bulletText}>{line}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colHeaderRose}>Exclusions</Text>
                    {detail.exclusionLines.map((line, i) => (
                      <View key={i} style={styles.bulletRow}>
                        <View style={[styles.bulletDot, styles.bulletDotRose]} />
                        <Text style={styles.bulletText}>{line}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Package Includes</Text>
            <View style={styles.rowHeader}>
              <Text style={styles.colComponent}>Component</Text>
              <Text style={styles.colDetail}>Detail</Text>
              <Text style={styles.colQty}>Qty</Text>
            </View>
            {data.components.map((c, i) => (
              <View style={styles.row} key={i}>
                <Text style={styles.colComponent}>{c.component}</Text>
                <Text style={styles.colDetail}>{c.detail || "—"}</Text>
                <Text style={styles.colQty}>{c.qty}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.totalBox} wrap={false}>
          <Text style={styles.totalLabel}>Total Package Price</Text>
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
