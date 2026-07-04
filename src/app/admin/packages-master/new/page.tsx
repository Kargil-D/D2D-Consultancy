import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import CampaignForm from "@/components/admin/CampaignForm";

export const metadata = { title: "New Campaign - Admin — D2D Holidays" };

export default function NewCampaignPage() {
  return (
    <AdminShell title="New Campaign">
      <Breadcrumb
        items={[
          { label: "PM", href: "/admin/pm" },
          { label: "Campaigns Master", href: "/admin/packages-master" },
          { label: "New Campaign" },
        ]}
      />
      <CampaignForm />
    </AdminShell>
  );
}
