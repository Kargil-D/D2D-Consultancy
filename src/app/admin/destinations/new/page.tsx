import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DestinationForm from "@/components/admin/DestinationForm";

export const metadata = { title: "New Destination - Admin — D2D Holidays" };

export default function NewDestinationPage() {
  return (
    <AdminShell title="New Destination">
      <Breadcrumb
        items={[
          { label: "PM", href: "/admin/pm" },
          { label: "Destinations", href: "/admin/destinations" },
          { label: "New Destination" },
        ]}
      />
      <DestinationForm />
    </AdminShell>
  );
}
