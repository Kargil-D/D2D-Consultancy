import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import EmployeeForm from "@/components/admin/EmployeeForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Edit Employee - Admin — D2D Holidays" };

export default async function EditEmployeePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <AdminShell title="Edit Employee">
      <Breadcrumb
        items={[
          { label: "Locker", href: "/admin/locker" },
          { label: "Employees", href: "/admin/employees" },
          { label: "Edit Employee" },
        ]}
      />
      <EmployeeForm id={id} />
    </AdminShell>
  );
}
