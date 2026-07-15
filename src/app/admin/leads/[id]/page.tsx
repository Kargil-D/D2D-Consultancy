import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import LeadDetail from "@/components/admin/lead/LeadDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Lead Detail - Admin — D2D Holidays" };

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <AdminShell title="Lead Detail">
      <Breadcrumb
        items={[
          { label: "Sales", href: "/admin/sales" },
          { label: "Leads", href: "/admin/leads" },
          { label: "Lead Detail" },
        ]}
      />
      <LeadDetail id={id} />
    </AdminShell>
  );
}
