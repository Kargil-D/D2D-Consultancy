import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import MailDrafter from "@/components/admin/booking/MailDrafter";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}

export const metadata = { title: "Draft Email - Admin — D2D Holidays" };

export default async function BookingMailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { type } = await searchParams;
  const recipientType = type === "Supplier" ? "Supplier" : "Customer";

  return (
    <AdminShell title="Draft Email">
      <Breadcrumb
        items={[
          { label: "Bookings", href: "/admin/bookings" },
          { label: "Booking Detail", href: `/admin/bookings/${id}` },
          { label: "Draft Email" },
        ]}
      />
      <MailDrafter bookingId={id} recipientType={recipientType} />
    </AdminShell>
  );
}
