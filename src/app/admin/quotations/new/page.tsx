"use client";

import { Suspense } from "react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import QuotationBuilder from "@/components/admin/quotation/QuotationBuilder";

export default function NewQuotationPage() {
  return (
    <AdminShell title="New Quotation">
      <Breadcrumb
        items={[
          { label: "Sales", href: "/admin/sales" },
          { label: "Quotations", href: "/admin/quotations" },
          { label: "New Quotation" },
        ]}
      />
      <Suspense>
        <QuotationBuilder />
      </Suspense>
    </AdminShell>
  );
}
