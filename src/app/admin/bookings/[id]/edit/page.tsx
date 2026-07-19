import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import BookingForm from "@/components/admin/BookingForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBookingPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <AdminShell title="Edit Booking">
      <Breadcrumb
        items={[
          { label: "Bookings", href: "/admin/bookings" },
          { label: "Edit Booking" },
        ]}
      />
      <BookingForm id={id} />
    </AdminShell>
  );
}
