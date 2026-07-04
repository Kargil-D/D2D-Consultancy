import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DestinationForm from "@/components/admin/DestinationForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Edit Destination - Admin — D2D Holidays" };

export default async function EditDestinationPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <AdminShell title="Edit Destination">
      <Breadcrumb
        items={[
          { label: "PM", href: "/admin/pm" },
          { label: "Destinations", href: "/admin/destinations" },
          { label: "Edit Destination" },
        ]}
      />
      <DestinationForm id={id} />
    </AdminShell>
  );
}
