import { notFound } from "next/navigation";
import { Download, MapPin, CalendarDays, CheckCircle2 } from "lucide-react";
import { getQuotationByShareToken, toPublicQuoteData } from "@/services/quotationService";

interface PageProps {
  params: Promise<{ token: string }>;
}

export const metadata = { title: "Your Quote — D2D Holidays" };

export default async function PublicQuotePage({ params }: PageProps) {
  const { token } = await params;
  const quotation = await getQuotationByShareToken(token);

  if (!quotation) {
    notFound();
  }

  const data = toPublicQuoteData(quotation);

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-bold uppercase tracking-widest border border-cyan-100">
            D2D Holidays
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">Your Travel Quotation</h1>
          <p className="mt-1 text-sm text-slate-500">Quote ID: {data.quoteCode}</p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-md shadow-slate-900/5 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 text-white p-6">
            <p className="text-sm opacity-90">Prepared for</p>
            <h2 className="text-xl font-bold">{data.customerName}</h2>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {data.destinationName}
              </span>
              {data.travelDate && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" /> {data.travelDate}
                </span>
              )}
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Package Includes</h3>
            <ul className="space-y-2 mb-6">
              {data.components.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold">{c.component}</span>
                    {c.detail ? ` — ${c.detail}` : ""}
                    {c.qty > 1 ? ` (x${c.qty})` : ""}
                  </span>
                </li>
              ))}
            </ul>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Total Package Price</span>
              <span className="text-2xl font-bold text-slate-900">
                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(
                  data.sellingPrice,
                )}
              </span>
            </div>

            <a
              href={`/api/quote/${token}/pdf`}
              target="_blank"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 hover:shadow-lg transition-all"
            >
              <Download className="w-4 h-4" /> Download PDF
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          This is an indicative quotation and is subject to availability at the time of booking.
        </p>
      </div>
    </main>
  );
}
