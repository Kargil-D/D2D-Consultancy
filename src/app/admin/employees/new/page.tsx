import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import EmployeeForm from "@/components/admin/EmployeeForm";

export const metadata = { title: "New Employee - Admin — D2D Holidays" };

export default function NewEmployeePage() {
  return (
    <AdminShell title="New Employee">
      <Breadcrumb
        items={[
          { label: "PM", href: "/admin/pm" },
          { label: "Employees", href: "/admin/employees" },
          { label: "New Employee" },
        ]}
      />
      <EmployeeForm />
    </AdminShell>
  );
}
