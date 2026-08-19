import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import ActivityForm from "@/components/admin/ActivityForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Edit Activity - Admin — D2D Holidays" };

export default async function EditActivityPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <AdminShell title="Edit Activity">
      <Breadcrumb items={[{ label: "PM", href: "/admin/pm" }, { label: "Activities", href: "/admin/activities" }, { label: "Edit Activity" }]} />
      <ActivityForm id={id} />
    </AdminShell>
  );
}
