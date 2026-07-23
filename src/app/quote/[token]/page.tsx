import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Download,
  MapPin,
  CalendarDays,
  Users,
  ShieldCheck,
  BedDouble,
  ArrowRightLeft,
  Ticket,
  CheckCircle2,
  XCircle,
  Plane,
  Sun,
  Mountain,
} from "lucide-react";
import Logo from "@/components/common/Logo";
import { getQuotationByShareToken, buildPublicQuoteData } from "@/services/quotationService";

interface PageProps {
  params: Promise<{ token: string }>;
}

export const metadata = { title: "Your Quote — D2D Holidays" };

const formatINR = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(v);

const OPTION_COLORS: Record<string, string> = {
  "Option A": "bg-blue-100 text-blue-700 border-blue-200",
  "Option B": "bg-purple-100 text-purple-700 border-purple-200",
  "Option C": "bg-amber-100 text-amber-700 border-amber-200",
};

export default async function PublicQuotePage({ params }: PageProps) {
  const { token } = await params;
  const quotation = await getQuotationByShareToken(token);

  if (!quotation) {
    notFound();
  }

  const data = await buildPublicQuoteData(quotation);

  const paxParts = [
    data.adults ? `${data.adults} Adult${data.adults > 1 ? "s" : ""}` : null,
    data.children ? `${data.children} Child${data.children > 1 ? "ren" : ""}` : null,
    data.infants ? `${data.infants} Infant${data.infants > 1 ? "s" : ""}` : null,
  ].filter(Boolean);
  const nightsDays = data.nights != null && data.days != null ? `${data.nights}N / ${data.days}D` : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-900/5 overflow-hidden">
          {/* Masthead */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-cyan-600 to-teal-600 px-6 sm:px-10 py-9">
            <Sun className="absolute right-16 -top-3 w-16 h-16 text-white/15" strokeWidth={1.5} aria-hidden />
            <Plane className="absolute right-6 top-10 w-10 h-10 text-white/25 -rotate-45" strokeWidth={1.5} aria-hidden />
            <Mountain className="absolute -bottom-4 left-8 w-28 h-28 text-white/10" strokeWidth={1} aria-hidden />
            <div className="relative flex items-center justify-between flex-wrap gap-4">
              <Logo size="lg" tone="light" />
              <div className="text-right">
                <p className="text-sm font-bold text-white">{data.quoteCode}</p>
                <p className="text-xs text-white/70 mt-0.5">{data.createdDate}</p>
              </div>
            </div>
          </div>

          {/* Hero */}
          <div className="relative">
            {data.heroImage ? (
              <div className="relative h-56 w-full">
                <Image src={data.heroImage} alt={data.packageName ?? data.destinationName} fill sizes="768px" className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
              </div>
            ) : (
              <div className="h-40 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500" />
            )}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h2 className="text-2xl font-bold drop-shadow-sm">{data.packageName || data.destinationName}</h2>
              <p className="text-sm opacity-95 mt-1">Prepared for {data.customerName}</p>
            </div>
          </div>

          {/* Meta pills */}
          <div className="px-6 pt-5 flex flex-wrap gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
              <MapPin className="w-3.5 h-3.5" /> {data.destinationName}
            </span>
            {nightsDays && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-50 text-cyan-700 text-xs font-semibold border border-cyan-100">
                <CalendarDays className="w-3.5 h-3.5" /> {nightsDays}
              </span>
            )}
            {data.travelDate && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold border border-teal-100">
                <CalendarDays className="w-3.5 h-3.5" /> {data.travelDate}
              </span>
            )}
            {paxParts.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-100">
                <Users className="w-3.5 h-3.5" /> {paxParts.join(", ")}
              </span>
            )}
            {data.validUntil && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-100">
                <ShieldCheck className="w-3.5 h-3.5" /> Valid until {data.validUntil}
              </span>
            )}
          </div>

          <div className="p-6 space-y-8">
            {/* Itinerary */}
            {data.itineraryDays.length > 0 && (
              <section>
                <h3 className="flex items-center gap-2 text-sm font-bold text-indigo-700 mb-3">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" /> Day-wise Itinerary
                </h3>
                <div className="space-y-3">
                  {data.itineraryDays.map((d) => (
                    <div key={d.id} className="rounded-xl bg-indigo-50/60 border-l-4 border-indigo-500 p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">DAY {d.dayNumber}</span>
                        <span className="text-sm font-bold text-indigo-950">{d.title}</span>
                      </div>
                      {d.description && <p className="text-xs text-slate-600 leading-relaxed">{d.description}</p>}
                      {d.meals.length > 0 && (
                        <p className="text-xs text-slate-600 mt-1"><span className="font-semibold text-indigo-700">Meals: </span>{d.meals.join(", ")}</p>
                      )}
                      {d.notes && <p className="text-xs text-slate-600 mt-1"><span className="font-semibold text-indigo-700">Notes: </span>{d.notes}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Hotels */}
            {data.hotelOptions.some((g) => g.hotels.length > 0) && (
              <section>
                <h3 className="flex items-center gap-2 text-sm font-bold text-fuchsia-700 mb-3">
                  <BedDouble className="w-4 h-4" /> Your Stay
                </h3>
                <div className="space-y-4">
                  {data.hotelOptions.map((group) =>
                    group.hotels.length === 0 ? null : (
                      <div key={group.id}>
                        {data.hotelOptions.length > 1 && (
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border mb-2 ${OPTION_COLORS[group.label] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}>
                            {group.label}
                          </span>
                        )}
                        <div className="space-y-3">
                          {group.hotels.map((h) => (
                            <div key={h.id} className="flex gap-3 rounded-xl bg-fuchsia-50/60 border border-fuchsia-100 p-3">
                              {h.images?.[0] && (
                                <div className="relative w-24 h-20 rounded-lg overflow-hidden shrink-0">
                                  <Image src={h.images[0]} alt={h.hotelName} fill sizes="96px" className="object-cover" unoptimized />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-fuchsia-950">{h.hotelName}</p>
                                {h.description && <p className="text-xs text-slate-600 mt-0.5">{h.description}</p>}
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  {h.roomType && <span className="px-2 py-0.5 rounded-full bg-white text-fuchsia-700 text-[10px] font-semibold">{h.roomType}</span>}
                                  {h.mealPlan && <span className="px-2 py-0.5 rounded-full bg-white text-fuchsia-700 text-[10px] font-semibold">{h.mealPlan}</span>}
                                  {h.nights > 0 && <span className="px-2 py-0.5 rounded-full bg-white text-fuchsia-700 text-[10px] font-semibold">{h.nights}N · {h.rooms} Room{h.rooms > 1 ? "s" : ""}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </section>
            )}

            {/* Transfers */}
            {data.transfers.length > 0 && (
              <section>
                <h3 className="flex items-center gap-2 text-sm font-bold text-orange-700 mb-3">
                  <ArrowRightLeft className="w-4 h-4" /> Transfers
                </h3>
                <div className="space-y-2">
                  {data.transfers.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-xl bg-orange-50/60 border border-orange-100 px-4 py-2.5">
                      <div>
                        <p className="text-sm font-bold text-orange-950">{t.name}</p>
                        {(t.pickupLocation || t.dropLocation) && (
                          <p className="text-xs text-orange-800/80 mt-0.5">{t.pickupLocation} → {t.dropLocation}</p>
                        )}
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-orange-600 text-white text-[10px] font-bold shrink-0">{t.vehicleType || t.mode}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Activities */}
            {data.activities.length > 0 && (
              <section>
                <h3 className="flex items-center gap-2 text-sm font-bold text-teal-700 mb-3">
                  <Ticket className="w-4 h-4" /> Activities
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {data.activities.map((a) => (
                    <div key={a.id} className="rounded-xl bg-teal-50/60 border border-teal-100 p-3">
                      <p className="text-sm font-bold text-teal-950">{a.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-teal-800/80">
                        {a.duration && <span>{a.duration}</span>}
                        {a.pax > 0 && <span>· {a.pax} Pax</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Inclusions / Exclusions */}
            {(data.inclusionLines.length > 0 || data.exclusionLines.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {data.inclusionLines.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-emerald-700 mb-2">Inclusions</h4>
                    <ul className="space-y-1.5">
                      {data.inclusionLines.map((line, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.exclusionLines.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-rose-700 mb-2">Exclusions</h4>
                    <ul className="space-y-1.5">
                      {data.exclusionLines.map((line, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                          <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" /> {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Final price */}
            <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 p-6 flex items-center justify-between shadow-lg shadow-cyan-900/10">
              <div>
                <p className="text-sm font-semibold text-white/90">Total Package Price</p>
                <p className="text-xs text-white/70 mt-0.5">Inclusive of GST</p>
              </div>
              <span className="text-3xl font-bold text-white">{formatINR(data.sellingPrice)}</span>
            </div>

            <a
              href={`/api/quote/${token}/pdf`}
              target="_blank"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 hover:shadow-lg transition-all"
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
