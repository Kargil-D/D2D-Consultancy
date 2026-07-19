import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

export interface VoucherPdfData {
  bookingCode: string;
  customerName: string;
  mobile: string;
  destinationName: string;
  travelDate: string | null;
  totalAmount: number;
  components: { component: string; detail: string; status: string }[];
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
  colComponent: { width: "25%" },
  colDetail: { width: "50%" },
  colStatus: { width: "25%", textAlign: "right" },
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

function VoucherDocument({ data }: { data: VoucherPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>D2D Holidays</Text>
          <Text style={styles.tagline}>Drive to Destination</Text>
        </View>

        <Text style={styles.title}>Travel Voucher</Text>
        <Text style={styles.meta}>Booking ID: {data.bookingCode}</Text>
        <Text style={styles.meta}>Guest: {data.customerName}</Text>
        <Text style={styles.meta}>Mobile: {data.mobile}</Text>
        <Text style={styles.meta}>Destination: {data.destinationName}</Text>
        {data.travelDate && <Text style={styles.meta}>Travel Date: {data.travelDate}</Text>}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Components</Text>
          <View style={styles.rowHeader}>
            <Text style={styles.colComponent}>Component</Text>
            <Text style={styles.colDetail}>Detail</Text>
            <Text style={styles.colStatus}>Status</Text>
          </View>
          {data.components.map((c, i) => (
            <View style={styles.row} key={i}>
              <Text style={styles.colComponent}>{c.component}</Text>
              <Text style={styles.colDetail}>{c.detail || "—"}</Text>
              <Text style={styles.colStatus}>{c.status}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>{formatINR(data.totalAmount)}</Text>
        </View>

        <Text style={styles.footer}>
          Please carry a copy of this voucher and a valid photo ID during your trip. D2D Holidays — Drive to Destination.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderVoucherPdf(data: VoucherPdfData): Promise<Buffer> {
  return renderToBuffer(<VoucherDocument data={data} />);
}
