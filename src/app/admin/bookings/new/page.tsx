import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import BookingForm from "@/components/admin/BookingForm";

export default function NewBookingPage() {
  return (
    <AdminShell title="New Booking">
      <Breadcrumb
        items={[
          { label: "Bookings", href: "/admin/bookings" },
          { label: "New Booking" },
        ]}
      />
      <BookingForm />
    </AdminShell>
  );
}
