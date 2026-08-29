import { Document, Page, Text, View, Svg, Path, Defs, LinearGradient, Stop, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { SUPPORT_EMAIL, SUPPORT_WEBSITE, SUPPORT_ADDRESS, COMPANY_FULL_NAME } from "@/data/contact";

/** Payslip PDF — plain, no-frills A4 layout. Admin owns every figure (no statutory auto-calculation), this just lays out what was entered. */
export interface PayslipPdfData {
  employeeName: string;
  employeeCode: string;
  designation: string;
  department: string;
  year: number;
  month: number; // 1-12
  pfNumber: string;
  esiNumber: string;
  bankName: string;
  accountNumberMasked: string;
  ifscCode: string;
  basicSalary: number;
  hra: number;
  otherAllowances: number;
  bonus: number;
  pfDeduction: number;
  esiDeduction: number;
  professionalTax: number;
  tds: number;
  otherDeductions: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  notes: string;
  generatedDate: string;
}

const C = {
  ink: "#0e3a40",
  teal: "#12828f",
  navy: "#0c2b30",
  muted: "#6b7d7c",
  body: "#3a4d4c",
  line: "#d9ecec",
  band: "#dceff0",
  paper: "#ffffff",
  orange: "#e08a3c",
};

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: C.body, backgroundColor: C.paper },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2 solid " + C.teal, paddingBottom: 12, marginBottom: 16 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  brandD2D: { fontSize: 16, fontWeight: 700, color: C.ink },
  brandHolidays: { fontSize: 16, fontWeight: 700, color: C.teal },
  brandAddr: { fontSize: 7.5, color: C.muted, marginTop: 4, maxWidth: 220, lineHeight: 1.4 },
  titleBlock: { alignItems: "flex-end" },
  title: { fontSize: 14, fontWeight: 700, color: C.navy },
  period: { fontSize: 10, color: C.teal, fontWeight: 700, marginTop: 2 },

  card: { borderWidth: 1, borderColor: C.line, borderStyle: "solid", borderRadius: 6, padding: 12, marginBottom: 12 },
  cardTitle: { fontSize: 8.5, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 8, textTransform: "uppercase" },
  kvGrid: { flexDirection: "row", flexWrap: "wrap" },
  kv: { width: "50%", flexDirection: "row", marginBottom: 6 },
  kvKey: { width: 90, fontSize: 8.5, color: C.muted },
  kvVal: { flex: 1, fontSize: 9, fontWeight: 700, color: C.ink },

  tablesRow: { flexDirection: "row", gap: 10 },
  tCol: { flex: 1, borderWidth: 1, borderColor: C.line, borderStyle: "solid", borderRadius: 6, overflow: "hidden" },
  tHead: { backgroundColor: C.navy, color: "#ffffff", fontSize: 9, fontWeight: 700, paddingVertical: 6, paddingHorizontal: 10 },
  tRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, paddingHorizontal: 10, borderBottom: "1 solid #ecf3f6" },
  tRowLabel: { fontSize: 8.5, color: C.body },
  tRowVal: { fontSize: 8.5, fontWeight: 700, color: C.ink },
  tFoot: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, paddingHorizontal: 10, backgroundColor: C.band },
  tFootLabel: { fontSize: 8.5, fontWeight: 700, color: C.ink },
  tFootVal: { fontSize: 8.5, fontWeight: 700, color: C.ink },

  netPayBox: { marginTop: 14, backgroundColor: C.navy, borderRadius: 8, padding: 14, alignItems: "center" },
  netPayLabel: { fontSize: 8.5, fontWeight: 700, letterSpacing: 1.5, color: "rgba(255,255,255,0.85)" },
  netPayVal: { marginTop: 4, fontSize: 22, fontWeight: 700, color: C.orange },

  notes: { marginTop: 12, fontSize: 8.5, color: C.muted, lineHeight: 1.5 },
  footer: { position: "absolute", bottom: 24, left: 32, right: 32, textAlign: "center", fontSize: 7.5, color: C.muted, borderTop: "1 solid " + C.line, paddingTop: 8 },
});

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(value);
}

/** Brand mark: two-triangle paper-plane, teal/cyan — same silhouette as the web header logo (src/components/common/Logo.tsx) and the quotation PDF's BrandLogo (src/lib/quotationPdf.tsx). */
function PlaneMark({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="planeGrad" x1="0" y1="0" x2="100" y2="100">
          <Stop offset="0" stopColor={C.teal} />
          <Stop offset="1" stopColor={C.ink} />
        </LinearGradient>
      </Defs>
      <Path d="M97 2 L2 26 L39 48 Z" fill="url(#planeGrad)" />
      <Path d="M97 2 L51 59 L73 99 Z" fill={C.ink} opacity={0.9} />
    </Svg>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.tRow}>
      <Text style={styles.tRowLabel}>{label}</Text>
      <Text style={styles.tRowVal}>{formatINR(value)}</Text>
    </View>
  );
}

function PayslipDocument({ data: d }: { data: PayslipPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <View style={styles.logoRow}>
              <PlaneMark size={18} />
              <Text>
                <Text style={styles.brandD2D}>D2D </Text>
                <Text style={styles.brandHolidays}>Holidays</Text>
              </Text>
            </View>
            <Text style={styles.brandAddr}>{COMPANY_FULL_NAME}{"\n"}{SUPPORT_ADDRESS}{"\n"}{SUPPORT_EMAIL} · {SUPPORT_WEBSITE}</Text>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>PAYSLIP</Text>
            <Text style={styles.period}>{MONTH_NAMES[d.month - 1]} {d.year}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Employee Details</Text>
          <View style={styles.kvGrid}>
            <View style={styles.kv}><Text style={styles.kvKey}>Name</Text><Text style={styles.kvVal}>{d.employeeName}</Text></View>
            <View style={styles.kv}><Text style={styles.kvKey}>Employee Code</Text><Text style={styles.kvVal}>{d.employeeCode}</Text></View>
            <View style={styles.kv}><Text style={styles.kvKey}>Designation</Text><Text style={styles.kvVal}>{d.designation || "—"}</Text></View>
            <View style={styles.kv}><Text style={styles.kvKey}>Department</Text><Text style={styles.kvVal}>{d.department || "—"}</Text></View>
            <View style={styles.kv}><Text style={styles.kvKey}>PF Number</Text><Text style={styles.kvVal}>{d.pfNumber || "—"}</Text></View>
            <View style={styles.kv}><Text style={styles.kvKey}>ESI Number</Text><Text style={styles.kvVal}>{d.esiNumber || "—"}</Text></View>
            <View style={styles.kv}><Text style={styles.kvKey}>Bank</Text><Text style={styles.kvVal}>{d.bankName || "—"}{d.ifscCode ? ` (${d.ifscCode})` : ""}</Text></View>
            <View style={styles.kv}><Text style={styles.kvKey}>Account No.</Text><Text style={styles.kvVal}>{d.accountNumberMasked || "—"}</Text></View>
          </View>
        </View>

        <View style={styles.tablesRow}>
          <View style={styles.tCol}>
            <Text style={styles.tHead}>Earnings</Text>
            <Row label="Basic Salary" value={d.basicSalary} />
            <Row label="HRA" value={d.hra} />
            <Row label="Other Allowances" value={d.otherAllowances} />
            <Row label="Bonus" value={d.bonus} />
            <View style={styles.tFoot}>
              <Text style={styles.tFootLabel}>Gross Pay</Text>
              <Text style={styles.tFootVal}>{formatINR(d.grossPay)}</Text>
            </View>
          </View>
          <View style={styles.tCol}>
            <Text style={styles.tHead}>Deductions</Text>
            <Row label="Provident Fund" value={d.pfDeduction} />
            <Row label="ESI" value={d.esiDeduction} />
            <Row label="Professional Tax" value={d.professionalTax} />
            <Row label="TDS" value={d.tds} />
            <Row label="Other Deductions" value={d.otherDeductions} />
            <View style={styles.tFoot}>
              <Text style={styles.tFootLabel}>Total Deductions</Text>
              <Text style={styles.tFootVal}>{formatINR(d.totalDeductions)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.netPayBox}>
          <Text style={styles.netPayLabel}>NET PAY</Text>
          <Text style={styles.netPayVal}>{formatINR(d.netPay)}</Text>
        </View>

        {d.notes ? <Text style={styles.notes}>Notes: {d.notes}</Text> : null}

        <Text style={styles.footer}>
          This is a computer-generated payslip and does not require a signature. Generated on {d.generatedDate}.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderPayslipPdf(data: PayslipPdfData): Promise<Buffer> {
  return renderToBuffer(<PayslipDocument data={data} />);
}
