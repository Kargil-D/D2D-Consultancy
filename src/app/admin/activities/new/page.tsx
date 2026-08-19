import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import ActivityForm from "@/components/admin/ActivityForm";

export const metadata = { title: "New Activity - Admin — D2D Holidays" };

export default function NewActivityPage() {
  return (
    <AdminShell title="New Activity">
      <Breadcrumb items={[{ label: "PM", href: "/admin/pm" }, { label: "Activities", href: "/admin/activities" }, { label: "New Activity" }]} />
      <ActivityForm />
    </AdminShell>
  );
}
