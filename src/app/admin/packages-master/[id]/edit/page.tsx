import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import CampaignForm from "@/components/admin/CampaignForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Edit Campaign - Admin — D2D Holidays" };

export default async function EditCampaignPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <AdminShell title="Edit Campaign">
      <Breadcrumb
        items={[
          { label: "PM", href: "/admin/pm" },
          { label: "Campaigns Master", href: "/admin/packages-master" },
          { label: "Edit Campaign" },
        ]}
      />
      <CampaignForm id={id} />
    </AdminShell>
  );
}
