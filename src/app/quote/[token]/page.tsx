import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Anchor, ArrowLeft, Bed, Bus, Calendar, Car, CheckCircle2, Compass,
  Fish, Heart, Home, Info, MapPin, Phone, Plane, PlaneTakeoff, Sailboat, Ship,
  Shield, Sparkles, Star, Waves, CalendarDays, Users, Download,
  type LucideIcon,
} from "lucide-react";
import { formatINR } from "@/utils/format";
import Logo from "@/components/common/Logo";
import { getQuotationByShareToken, buildPublicQuoteData } from "@/services/quotationService";
import ReviewsSection from "@/components/reviews/ReviewsSection";
import CampaignDayAccordion from "@/components/campaigns/CampaignDayAccordion";
import CampaignHotelGallery from "@/components/campaigns/CampaignHotelGallery";
import type { ItineraryDayDetail } from "@/types/admin";

interface PageProps {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = { title: "Your Quote - D2D Holidays" };

const ICON_MAP: Record<string, LucideIcon> = {
  Calendar, Home, Plane, PlaneTakeoff, Sparkles, Anchor, Waves, Compass, Fish,
  Heart, Sailboat, Ship, Bus, Car, Shield, Star, MapPin, Bed,
};
const getIcon = (name?: string): LucideIcon => (name && ICON_MAP[name]) || Sparkles;

function getTransferIcon(typeName: string): LucideIcon {
  const t = typeName.toLowerCase();
  if (t.includes("seaplane")) return PlaneTakeoff;
  if (t.includes("speedboat") || t.includes("boat")) return Sailboat;
  if (t.includes("ferry")) return Ship;
  if (t.includes("bus") || t.includes("coach")) return Bus;
  if (t.includes("cab") || t.includes("taxi") || t.includes("car")) return Car;
  if (t.includes("flight") || t.includes("plane") || t.includes("air")) return Plane;
  return Sparkles;
}

export default async function PublicQuotePage({ params }: PageProps) {
  const { token } = await params;
  const quotation = await getQuotationByShareToken(token);
  if (!quotation) notFound();

  const data = await buildPublicQuoteData(quotation);

  // Adapted into ItineraryDayDetail shape so CampaignDayAccordion — the exact same
  // component the Campaign Detail page uses — can render it without modification.
  const days: ItineraryDayDetail[] = data.itineraryDays.map((d) => ({
    id: d.id,
    dayNumber: d.dayNumber,
    title: d.title,
    description: [d.description, d.notes].filter(Boolean).join("\n"),
    activities: [],
    mealsIncluded: d.meals,
    stayDetails: "",
    transportDetails: "",
    dayImage: d.images[0],
    order: d.dayNumber,
  }));

  const hotels = data.hotelOptions.flatMap((g) => g.hotels);
  const nightsDays = data.nights != null && data.days != null ? `${data.nights}N / ${data.days}D` : null;
  const paxParts = [
    data.adults ? `${data.adults} Adult${data.adults > 1 ? "s" : ""}` : null,
    data.children ? `${data.children} Child${data.children > 1 ? "ren" : ""}` : null,
    data.infants ? `${data.infants} Infant${data.infants > 1 ? "s" : ""}` : null,
  ].filter(Boolean);

  const gstAmount = data.sellingPrice - data.subtotal;

  // Price per Adult / per Child — "Include child count for costing" (set on the quotation)
  // weights the package cost 80% across adults / 20% across children instead of splitting
  // it evenly across adults only.
  const splitAcrossChildren = data.includeChildCosting && data.children > 0;
  const pricePerAdult = data.adults > 0
    ? (splitAcrossChildren ? data.subtotal * 0.8 : data.subtotal) / data.adults
    : null;
  const pricePerChild = splitAcrossChildren ? (data.subtotal * 0.2) / data.children : null;

  return (
    <main className="relative min-h-screen bg-slate-50">
      <header className="sticky top-0 inset-x-0 z-50 bg-slate-900/85 backdrop-blur-xl border-b border-white/10 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center group" aria-label="D2D Holidays - back to home">
            <Logo size="md" tone="light" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </nav>
      </header>

      <section className="relative h-[55vh] sm:h-[68vh] min-h-[400px] sm:min-h-[480px] w-full">
        <div className="absolute inset-0 overflow-hidden bg-slate-800">
          {data.heroImage && (
            <Image src={data.heroImage} alt={data.packageName ?? data.destinationName} fill priority sizes="100vw" className="object-cover" unoptimized />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/30 to-slate-900/90" />
        </div>
        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight">{data.packageName || data.destinationName}</h1>
          {nightsDays && <p className="mt-2 text-xl sm:text-2xl font-semibold text-white/95">{nightsDays}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-white/90 text-sm">
            <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" />{data.destinationName}</span>
            {data.travelDate && <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-4 h-4" />{data.travelDate}</span>}
            {paxParts.length > 0 && <span className="inline-flex items-center gap-1.5"><Users className="w-4 h-4" />{paxParts.join(", ")}</span>}
          </div>
          <div className="mt-5">
            <div className="text-white/80 text-sm">Total Package Price</div>
            <div className="text-3xl sm:text-4xl font-bold text-white">{formatINR(data.sellingPrice)}</div>
            <div className="text-white/80 text-sm">Prepared for {data.customerName} · Quote {data.quoteCode}</div>
          </div>
        </div>
      </section>

      <div className="sticky top-16 md:top-20 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-1 min-w-max">
            {[
              { id: "itinerary", label: "Itinerary", icon: Calendar },
              { id: "hotels", label: "Hotels", icon: Home },
              { id: "activities", label: "Activities", icon: Anchor },
              { id: "transfers", label: "Transfers", icon: Plane },
              { id: "inclusions", label: "Inclusions", icon: CheckCircle2 },
            ].map(({ id, label, icon: Icon }) => (
              <a key={id} href={`#${id}`} className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-slate-600 border-b-2 border-transparent hover:text-blue-600 hover:border-blue-600 transition-colors whitespace-nowrap">
                <Icon className="w-4 h-4" />{label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-8">
            {days.length > 0 && (
              <section id="itinerary">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Day-wise Itinerary</h2>
                <CampaignDayAccordion days={days} />
              </section>
            )}

            {hotels.length > 0 && (
              <section id="hotels">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Your Hotel</h2>
                    <p className="text-sm text-slate-500 mt-1">Handpicked stays for an unforgettable experience</p>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />Secure & Easy Booking
                  </span>
                </div>
                <div className="space-y-5">
                  {hotels.map((h) => (
                    <div key={h.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md shadow-slate-900/5">
                      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1.6fr]">
                        <CampaignHotelGallery images={h.images} alt={h.hotelName} />
                        <div className="p-5 lg:p-6 flex flex-col gap-2">
                          <h4 className="text-lg font-bold text-slate-900 leading-tight">{h.hotelName}</h4>
                          {h.roomType && (
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                              <Bed className="w-4 h-4 text-blue-600" /><span className="font-medium">{h.roomType}</span>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 mt-1">
                            {h.checkIn && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                                <CalendarDays className="w-3.5 h-3.5" /> Check-in: {h.checkIn}
                              </span>
                            )}
                            {h.checkOut && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                                <CalendarDays className="w-3.5 h-3.5" /> Check-out: {h.checkOut}
                              </span>
                            )}
                            {h.nights > 0 && (
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                                {h.nights} Night{h.nights > 1 ? "s" : ""} / {h.nights + 1} Day{h.nights + 1 > 1 ? "s" : ""}
                              </span>
                            )}
                            {h.mealPlan && (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">{h.mealPlan}</span>
                            )}
                          </div>
                          {h.description && <p className="text-sm text-slate-600 mt-1">{h.description}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {data.activities.length > 0 && (
              <section id="activities">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Activities Included</h2>
                <div className="space-y-5">
                  {data.activities.map((a) => {
                    const Icon = getIcon();
                    return (
                      <div key={a.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md shadow-slate-900/5">
                        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1.6fr]">
                          <CampaignHotelGallery images={a.images} alt={a.name} />
                          <div className="p-5 lg:p-6 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-50 text-blue-600 shrink-0">
                                <Icon className="w-4 h-4" />
                              </span>
                              <h4 className="text-lg font-bold text-slate-900 leading-tight">{a.name}</h4>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {a.activityDate && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                                  <CalendarDays className="w-3.5 h-3.5" /> {a.activityDate}
                                </span>
                              )}
                              {a.activityTime && (
                                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">Starts {a.activityTime}</span>
                              )}
                              {a.duration && (
                                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">{a.duration}</span>
                              )}
                              {a.pax > 0 && (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">{a.pax} Pax</span>
                              )}
                            </div>
                            {a.reportingTime && (
                              <p className="text-sm text-slate-600">Reporting time: <span className="font-medium text-slate-800">{a.reportingTime}</span></p>
                            )}
                            {a.description && <p className="text-sm text-slate-600 mt-1">{a.description}</p>}
                            {a.notes && <p className="text-xs text-slate-500 mt-1 italic">{a.notes}</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {data.transfers.length > 0 && (
              <section id="transfers">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Transfers</h2>
                <div className="space-y-5">
                  {data.transfers.map((t) => {
                    const typeName = t.vehicleType || t.name || "Transfer";
                    const Icon = getTransferIcon(typeName);
                    return (
                      <div key={t.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md shadow-slate-900/5">
                        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1.6fr]">
                          <CampaignHotelGallery images={t.images} alt={t.name || typeName} />
                          <div className="p-5 lg:p-6 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-sm shrink-0">
                                <Icon className="w-4 h-4" />
                              </span>
                              <h4 className="text-lg font-bold text-slate-900 leading-tight">{t.name || typeName}</h4>
                            </div>
                            {(t.pickupLocation || t.dropLocation) && (
                              <p className="text-sm font-medium text-slate-700">{t.pickupLocation} → {t.dropLocation}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-bold">
                                <Icon className="w-3.5 h-3.5" />{typeName}
                              </span>
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">{t.mode}</span>
                              {t.transferDate && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                                  <CalendarDays className="w-3.5 h-3.5" /> {t.transferDate}
                                </span>
                              )}
                              {t.duration && (
                                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">{t.duration}</span>
                              )}
                            </div>
                            {(t.pickupTime || t.dropTime) && (
                              <p className="text-sm text-slate-600">
                                {t.pickupTime && <>Pickup <span className="font-medium text-slate-800">{t.pickupTime}</span></>}
                                {t.pickupTime && t.dropTime && " · "}
                                {t.dropTime && <>Drop <span className="font-medium text-slate-800">{t.dropTime}</span></>}
                              </p>
                            )}
                            {t.description && <p className="text-sm text-slate-600 mt-1">{t.description}</p>}
                            {t.notes && <p className="text-xs text-slate-500 mt-1 italic">{t.notes}</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {(data.inclusionLines.length > 0 || data.exclusionLines.length > 0) && (
              <section id="inclusions" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-6">
                  <h3 className="text-lg font-bold text-emerald-700 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Inclusions
                  </h3>
                  <ul className="space-y-2">
                    {data.inclusionLines.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-rose-200 bg-rose-50/30 p-6">
                  <h3 className="text-lg font-bold text-rose-700 mb-3">Exclusions</h3>
                  <ul className="space-y-2">
                    {data.exclusionLines.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-rose-500 flex-shrink-0" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-900/5 lg:sticky lg:top-32">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Price Break down</h3>

              {paxParts.length > 0 && (
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-dashed border-slate-200">
                  <span className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Users className="w-4 h-4 text-blue-600" />
                    Travellers
                  </span>
                  <span className="text-sm font-semibold text-slate-900">{paxParts.join(", ")}</span>
                </div>
              )}

              {(data.travelDate || data.travelEndDate) && (
                <div className="flex items-center justify-between gap-3 py-3 border-b border-dashed border-slate-200 text-sm">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <CalendarDays className="w-4 h-4 text-blue-600" />
                    Travel Dates
                  </span>
                  <span className="font-semibold text-slate-900 text-right">
                    {data.travelDate ?? "—"}
                    {data.travelEndDate && <> &rarr; {data.travelEndDate}</>}
                  </span>
                </div>
              )}

              {(pricePerAdult != null || pricePerChild != null) && (
                <div className="py-3 border-b border-dashed border-slate-200 space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Price per Adult</span>
                    <span className="font-semibold text-slate-900">{pricePerAdult != null ? formatINR(pricePerAdult) : "—"}</span>
                  </div>
                  {pricePerChild != null && (
                    <div className="flex justify-between text-slate-600">
                      <span>Price per Child</span>
                      <span className="font-semibold text-slate-900">{formatINR(pricePerChild)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2.5 text-sm pt-3">
                <div className="flex justify-between text-slate-600">
                  <span>Package Cost</span>
                  <span className="font-semibold text-slate-900">{formatINR(data.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST ({data.gstPercent}%)</span>
                  <span className="font-semibold text-slate-900">{formatINR(gstAmount)}</span>
                </div>
              </div>
              <div className="my-4 border-t border-dashed border-slate-200" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">Grand Total</span>
                <span className="text-xl font-bold text-slate-900">{formatINR(data.sellingPrice)}</span>
              </div>
              <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />Best Price Guaranteed
              </div>
              <a
                href={`/api/quote/${token}/pdf`}
                target="_blank"
                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 hover:shadow-lg transition-all"
              >
                <Download className="w-4 h-4" /> Download PDF
              </a>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Need Help?</h3>
              <p className="text-xs text-slate-500 mb-4">Our travel experts are here for you</p>
              <div className="space-y-2 text-sm">
                <a href="tel:+919876543210" className="flex items-center gap-2 text-slate-700 hover:text-blue-600">
                  <Phone className="w-4 h-4 text-blue-600" />+91 98765 43210
                </a>
                <a href="mailto:info@d2dholidays.com" className="flex items-center gap-2 text-slate-700 hover:text-blue-600 break-all">
                  <Sparkles className="w-4 h-4 text-blue-600" />info@d2dholidays.com
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {data.importantNotes && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
            <h3 className="text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
              <Info className="w-5 h-5" /> Important Notes
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{data.importantNotes}</p>
          </div>
        </section>
      )}

      <ReviewsSection />

      <div className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600">
            <ArrowLeft className="w-4 h-4" />Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
