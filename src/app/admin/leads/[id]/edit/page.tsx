import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import LeadForm from "@/components/admin/LeadForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Edit Lead - Admin — D2D Holidays" };

export default async function EditLeadPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <AdminShell title="Edit Lead">
      <Breadcrumb
        items={[
          { label: "Sales", href: "/admin/sales" },
          { label: "Leads", href: "/admin/leads" },
          { label: "Edit Lead" },
        ]}
      />
      <LeadForm id={id} />
    </AdminShell>
  );
}
