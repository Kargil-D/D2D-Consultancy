import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, Eye } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { getAllItineraries } from "@/services/itineraryService";
import { formatINR } from "@/utils/format";

export const metadata = { title: "Campaigns - Admin ï¿½ D2D Holidays" };

export default function AdminPackagesPage() {
  const items = getAllItineraries();

  return (
    <AdminShell title="Campaigns">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Campaigns</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage itineraries that show up across the site. Edits write to{" "}
            <code className="text-xs">content/itineraries/*.md</code>.
          </p>
        </div>
        <Link
          href="/admin/packages/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold">Package</th>
              <th className="px-4 py-3 font-semibold">Destination</th>
              <th className="px-4 py-3 font-semibold">Nights</th>
              <th className="px-4 py-3 font-semibold">Price (INR)</th>
              <th className="px-4 py-3 font-semibold">Bucket</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                  No campaigns yet. Create your first one.
                </td>
              </tr>
            )}
            {items.map((it) => (
              <tr key={it.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                      <Image src={it.image} alt={it.title} fill sizes="56px" className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{it.title}</div>
                      <div className="text-xs text-slate-500">{it.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">{it.destination}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{it.nights}N</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{formatINR(it.price)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                    {it.bucket}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Link
                      href={`/itinerary/${it.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100"
                      title="View on site"
                    >
                      <Eye className="w-3.5 h-3.5" />View
                    </Link>
                    <Link
                      href={`/admin/packages/${it.id}/edit`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100"
                    >
                      <Edit className="w-3.5 h-3.5" />Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
