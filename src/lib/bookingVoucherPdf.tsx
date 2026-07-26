import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

export interface VoucherPdfData {
  bookingCode: string;
  customerName: string;
  mobile: string;
  destinationName: string;
  travelDate: string | null;
  totalAmount: number;
  flights: { airline: string; flightNumber: string; fromLocation: string; toLocation: string; pnr: string }[];
  hotels: { hotelName: string; roomType: string; checkIn: string | null; checkOut: string | null; nights: number }[];
  activities: { activityName: string; activityDate: string | null; duration: string }[];
  transfers: { transferType: string; vehicleType: string; pickupLocation: string; dropLocation: string }[];
  visas: { country: string; visaType: string; status: string }[];
  insurances: { insuranceCompany: string; policyNumber: string; planName: string }[];
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
  row: { flexDirection: "row", borderBottom: "1 solid #e2e8f0", paddingVertical: 6 },
  rowHeader: { flexDirection: "row", backgroundColor: "#f1f5f9", paddingVertical: 6, fontWeight: 700 },
  col: { flex: 1 },
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

        {data.flights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Flights</Text>
            <View style={styles.rowHeader}>
              <Text style={styles.col}>Airline / Flight</Text>
              <Text style={styles.col}>Route</Text>
              <Text style={styles.col}>PNR</Text>
            </View>
            {data.flights.map((f, i) => (
              <View style={styles.row} key={i}>
                <Text style={styles.col}>{[f.airline, f.flightNumber].filter(Boolean).join(" ") || "—"}</Text>
                <Text style={styles.col}>{f.fromLocation} {"->"} {f.toLocation}</Text>
                <Text style={styles.col}>{f.pnr || "—"}</Text>
              </View>
            ))}
          </View>
        )}

        {data.hotels.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hotels</Text>
            <View style={styles.rowHeader}>
              <Text style={styles.col}>Hotel</Text>
              <Text style={styles.col}>Room</Text>
              <Text style={styles.col}>Check-in / Check-out</Text>
            </View>
            {data.hotels.map((h, i) => (
              <View style={styles.row} key={i}>
                <Text style={styles.col}>{h.hotelName || "—"}</Text>
                <Text style={styles.col}>{h.roomType || "—"}</Text>
                <Text style={styles.col}>{h.checkIn || "—"} — {h.checkOut || "—"} ({h.nights}N)</Text>
              </View>
            ))}
          </View>
        )}

        {data.activities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activities</Text>
            <View style={styles.rowHeader}>
              <Text style={styles.col}>Activity</Text>
              <Text style={styles.col}>Date</Text>
              <Text style={styles.col}>Duration</Text>
            </View>
            {data.activities.map((a, i) => (
              <View style={styles.row} key={i}>
                <Text style={styles.col}>{a.activityName || "—"}</Text>
                <Text style={styles.col}>{a.activityDate || "—"}</Text>
                <Text style={styles.col}>{a.duration || "—"}</Text>
              </View>
            ))}
          </View>
        )}

        {data.transfers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transfers</Text>
            <View style={styles.rowHeader}>
              <Text style={styles.col}>Type</Text>
              <Text style={styles.col}>Vehicle</Text>
              <Text style={styles.col}>Route</Text>
            </View>
            {data.transfers.map((t, i) => (
              <View style={styles.row} key={i}>
                <Text style={styles.col}>{t.transferType || "—"}</Text>
                <Text style={styles.col}>{t.vehicleType || "—"}</Text>
                <Text style={styles.col}>{t.pickupLocation} {"->"} {t.dropLocation}</Text>
              </View>
            ))}
          </View>
        )}

        {data.visas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Visa</Text>
            <View style={styles.rowHeader}>
              <Text style={styles.col}>Country</Text>
              <Text style={styles.col}>Type</Text>
              <Text style={styles.col}>Status</Text>
            </View>
            {data.visas.map((v, i) => (
              <View style={styles.row} key={i}>
                <Text style={styles.col}>{v.country || "—"}</Text>
                <Text style={styles.col}>{v.visaType || "—"}</Text>
                <Text style={styles.col}>{v.status}</Text>
              </View>
            ))}
          </View>
        )}

        {data.insurances.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insurance</Text>
            <View style={styles.rowHeader}>
              <Text style={styles.col}>Company</Text>
              <Text style={styles.col}>Policy No.</Text>
              <Text style={styles.col}>Plan</Text>
            </View>
            {data.insurances.map((ins, i) => (
              <View style={styles.row} key={i}>
                <Text style={styles.col}>{ins.insuranceCompany || "—"}</Text>
                <Text style={styles.col}>{ins.policyNumber || "—"}</Text>
                <Text style={styles.col}>{ins.planName || "—"}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.totalBox} wrap={false}>
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
