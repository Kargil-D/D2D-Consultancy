import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import RoleForm from "@/components/admin/RoleForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Edit Role - Admin — D2D Holidays" };

export default async function EditRolePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <AdminShell title="Edit Role">
      <Breadcrumb
        items={[
          { label: "PM", href: "/admin/pm" },
          { label: "Roles", href: "/admin/roles" },
          { label: "Edit Role" },
        ]}
      />
      <RoleForm id={id} />
    </AdminShell>
  );
}
