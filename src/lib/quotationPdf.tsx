import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

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
}

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, fontFamily: "Helvetica", color: "#1e293b" },
  header: { marginBottom: 20, paddingBottom: 14, borderBottom: "2 solid #06b6d4" },
  brand: { fontSize: 18, fontWeight: 700, color: "#0f766e" },
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
});

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(value);
}

function QuotationDocument({ data }: { data: QuotationPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>D2D Holidays</Text>
          <Text style={styles.tagline}>Drive to Destination</Text>
        </View>

        <Text style={styles.title}>Travel Quotation</Text>
        <Text style={styles.meta}>Quote ID: {data.quoteCode}</Text>
        <Text style={styles.meta}>Prepared for: {data.customerName}</Text>
        <Text style={styles.meta}>Destination: {data.destinationName}</Text>
        {data.travelDate && <Text style={styles.meta}>Travel Date: {data.travelDate}</Text>}
        <Text style={styles.meta}>Date: {data.createdDate}</Text>

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

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total Package Price</Text>
          <Text style={styles.totalValue}>{formatINR(data.sellingPrice)}</Text>
        </View>

        <Text style={styles.footer}>
          This is an indicative quotation and is subject to availability at the time of booking. D2D Holidays — Drive to Destination.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderQuotationPdf(data: QuotationPdfData): Promise<Buffer> {
  return renderToBuffer(<QuotationDocument data={data} />);
}
