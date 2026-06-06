import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import PackageForm from "@/components/admin/PackageForm";
import { getItineraryById } from "@/services/itineraryService";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return { title: `Edit ${id} - Admin ï¿½ D2D Holidays` };
}

export default async function EditPackagePage({ params }: PageProps) {
  const { id } = await params;
  const itin = getItineraryById(id);
  if (!itin) notFound();

  return (
    <AdminShell title={`Edit ï¿½ ${itin.title}`}>
      <PackageForm initial={itin} />
    </AdminShell>
  );
}
