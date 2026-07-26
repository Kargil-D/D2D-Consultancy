import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import RoleForm from "@/components/admin/RoleForm";

export const metadata = { title: "New Role - Admin — D2D Holidays" };

export default function NewRolePage() {
  return (
    <AdminShell title="New Role">
      <Breadcrumb
        items={[
          { label: "Locker", href: "/admin/locker" },
          { label: "Roles", href: "/admin/roles" },
          { label: "New Role" },
        ]}
      />
      <RoleForm />
    </AdminShell>
  );
}
