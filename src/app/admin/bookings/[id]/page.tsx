import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import BookingDetail from "@/components/admin/booking/BookingDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <AdminShell title="Booking Detail">
      <Breadcrumb
        items={[
          { label: "Bookings", href: "/admin/bookings" },
          { label: "Booking Detail" },
        ]}
      />
      <BookingDetail id={id} />
    </AdminShell>
  );
}
