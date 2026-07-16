import { Suspense } from "react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import QuotationBuilder from "@/components/admin/quotation/QuotationBuilder";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Edit Quotation - Admin — D2D Holidays" };

export default async function EditQuotationPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <AdminShell title="Edit Quotation">
      <Breadcrumb
        items={[
          { label: "Sales", href: "/admin/sales" },
          { label: "Quotations", href: "/admin/quotations" },
          { label: "Edit Quotation" },
        ]}
      />
      <Suspense>
        <QuotationBuilder id={id} />
      </Suspense>
    </AdminShell>
  );
}
