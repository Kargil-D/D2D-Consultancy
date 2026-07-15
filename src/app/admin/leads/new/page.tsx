import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import LeadForm from "@/components/admin/LeadForm";

export const metadata = { title: "New Lead - Admin — D2D Holidays" };

export default function NewLeadPage() {
  return (
    <AdminShell title="New Lead">
      <Breadcrumb
        items={[
          { label: "Sales", href: "/admin/sales" },
          { label: "Leads", href: "/admin/leads" },
          { label: "New Lead" },
        ]}
      />
      <LeadForm />
    </AdminShell>
  );
}
