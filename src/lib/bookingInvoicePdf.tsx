import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

export interface InvoicePdfData {
  kind: "customer" | "supplier";
  bookingCode: string;
  customerName: string;
  destinationName: string;
  invoiceDate: string;
  lines: { serviceType: string; serviceName: string; supplierName: string; amount: number }[];
  total: number;
}

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, fontFamily: "Helvetica", color: "#1e293b" },
  masthead: { backgroundColor: "#0891b2", marginHorizontal: -36, marginTop: -36, padding: 24, marginBottom: 20 },
  brand: { fontSize: 22, fontWeight: 700, color: "#ffffff" },
  tagline: { fontSize: 9, fontWeight: 700, color: "#e0f2fe", marginTop: 4, letterSpacing: 1.2 },
  title: { fontSize: 16, fontWeight: 700, marginTop: 4, marginBottom: 4 },
  meta: { fontSize: 10, color: "#475569", marginBottom: 2 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 8 },
  row: { flexDirection: "row", borderBottom: "1 solid #e2e8f0", paddingVertical: 6 },
  rowHeader: { flexDirection: "row", backgroundColor: "#f1f5f9", paddingVertical: 6, fontWeight: 700 },
  colService: { width: "40%" },
  colSupplier: { width: "35%" },
  colAmount: { width: "25%", textAlign: "right" },
  totalBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#0891b2",
    borderRadius: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: 13, fontWeight: 700, color: "#ffffff" },
  totalValue: { fontSize: 20, fontWeight: 700, color: "#ffffff" },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 8, color: "#94a3b8", textAlign: "center" },
});

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(value);
}

function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  const isCustomer = data.kind === "customer";
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.masthead}>
          <Text style={styles.brand}>D2D Holidays</Text>
          <Text style={styles.tagline}>DRIVE TO DESTINATION</Text>
        </View>

        <Text style={styles.title}>{isCustomer ? "Customer Invoice" : "Supplier Invoice"}</Text>
        <Text style={styles.meta}>Booking ID: {data.bookingCode}</Text>
        {isCustomer && <Text style={styles.meta}>Billed to: {data.customerName}</Text>}
        <Text style={styles.meta}>Destination: {data.destinationName}</Text>
        <Text style={styles.meta}>Invoice Date: {data.invoiceDate}</Text>

        <View style={styles.section}>
          <View style={styles.rowHeader}>
            <Text style={styles.colService}>Service</Text>
            <Text style={styles.colSupplier}>Supplier</Text>
            <Text style={styles.colAmount}>Amount</Text>
          </View>
          {data.lines.map((l, i) => (
            <View style={styles.row} key={i}>
              <Text style={styles.colService}>{l.serviceType}: {l.serviceName || "—"}</Text>
              <Text style={styles.colSupplier}>{l.supplierName || "—"}</Text>
              <Text style={styles.colAmount}>{formatINR(l.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalBox} wrap={false}>
          <Text style={styles.totalLabel}>{isCustomer ? "Total Payable" : "Total Due to Suppliers"}</Text>
          <Text style={styles.totalValue}>{formatINR(data.total)}</Text>
        </View>

        <Text style={styles.footer}>
          D2D Holidays — Drive to Destination. This is a system-generated invoice.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument data={data} />);
}
