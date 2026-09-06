import BookingTracking from "@/components/account/BookingTracking";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Track Booking — D2D Holidays" };

export default async function BookingTrackingPage({ params }: PageProps) {
  const { id } = await params;
  return <BookingTracking id={id} />;
}
