import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Anchor, ArrowLeft, ArrowRight, Bed, Bus, Calendar, Car, CheckCircle2, Compass,
  Fish, Heart, Home, MapPin, Phone, Plane, PlaneTakeoff, Sailboat, Ship,
  Shield, Sparkles, Star, Waves,
  type LucideIcon,
} from "lucide-react";
import { formatINR } from "@/utils/format";
import Logo from "@/components/common/Logo";
import { getCampaignBySlug } from "@/services/campaignService";
import { findItineraryByPackageId } from "@/services/campaignItineraryService";
import { findHotelByPackageId } from "@/services/campaignHotelService";
import { findTransferByPackageId } from "@/services/campaignTransferService";
import { listTransferTypes } from "@/services/transferTypeService";
import TravelerStories from "@/components/itinerary/TravelerStories";
import CampaignDayAccordion from "@/components/campaigns/CampaignDayAccordion";
import CampaignHotelGallery from "@/components/campaigns/CampaignHotelGallery";
import type { ActivityDetail, HotelStayDetail, ItineraryDayDetail, TransferStopDetail } from "@/types/admin";

interface PageProps { params: Promise<{ slug: string }>; }

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) return { title: "Campaign - D2D Holidays" };
  return {
    title: `${campaign.name} - D2D Holidays`,
    description: campaign.shortDescription || undefined,
    openGraph: campaign.coverBanner ? { images: [campaign.coverBanner] } : undefined,
    alternates: { canonical: `/campaigns/${campaign.slug}` },
  };
}

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

function textToLines(text: string): string[] {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign || campaign.isDeleted) notFound();

  const [itinerary, hotelPlan, transferPlan, transferTypesRes] = await Promise.all([
    findItineraryByPackageId(campaign.id),
    findHotelByPackageId(campaign.id),
    findTransferByPackageId(campaign.id),
    listTransferTypes({ pageSize: 1000 }),
  ]);

  const transferTypeNameById = new Map(transferTypesRes.items.map((t) => [t.id, t.name]));

  const days = (itinerary?.days as unknown as ItineraryDayDetail[] | undefined) ?? [];
  const hotels = (hotelPlan?.hotels as unknown as HotelStayDetail[] | undefined) ?? [];
  const transfers = (transferPlan?.transfers as unknown as TransferStopDetail[] | undefined) ?? [];
  const activities = (campaign.activities as unknown as ActivityDetail[] | undefined) ?? [];
  const inclusionLines = textToLines(campaign.inclusionsText || "");
  const exclusionLines = textToLines(campaign.exclusionsText || "");

  const price = campaign.offerPrice || campaign.startingPrice;
  const subtotal =
    campaign.packageCost + campaign.platformFee + campaign.marginPrice + campaign.insurancePrice;
  const gstAmount = Math.round((subtotal * campaign.gstPercent) / 100);
  const grandTotal = subtotal + gstAmount;
  const hasPricingBreakdown =
    campaign.packageCost > 0 || campaign.platformFee > 0 || campaign.marginPrice > 0 || campaign.insurancePrice > 0;

  const heroImage = campaign.coverBanner || campaign.thumbnail || "";

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
          {heroImage && (
            <Image src={heroImage} alt={campaign.name} fill priority sizes="100vw" className="object-cover" unoptimized />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/30 to-slate-900/90" />
        </div>
        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight">{campaign.name}</h1>
          <p className="mt-2 text-xl sm:text-2xl font-semibold text-white/95">{campaign.nights}N / {campaign.days}D</p>
          <div className="mt-3 flex items-center gap-1.5 text-white/90 text-sm">
            <MapPin className="w-4 h-4" />{campaign.destination.name}
          </div>
          <div className="mt-5">
            <div className="text-white/80 text-sm">Starting From</div>
            <div className="text-3xl sm:text-4xl font-bold text-white">
              {formatINR(price)} <span className="text-base font-medium">/-</span>
            </div>
            <div className="text-white/80 text-sm">Per Person</div>
          </div>
          {campaign.highlights.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {campaign.highlights.map((h) => (
                <span key={h} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />{h}
                </span>
              ))}
            </div>
          )}
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
                        <CampaignHotelGallery images={h.images ?? []} alt={h.name} />
                        <div className="p-5 lg:p-6 flex flex-col gap-2">
                          <h4 className="text-lg font-bold text-slate-900 leading-tight">{h.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <Bed className="w-4 h-4 text-blue-600" /><span className="font-medium">{h.roomType}</span>
                          </div>
                          {h.description && <p className="text-sm text-slate-600 mt-1">{h.description}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activities.length > 0 && (
                <section id="activities" className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Activities Included</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                    {activities.map((a) => {
                      const Icon = getIcon(a.icon);
                      return (
                        <div key={a.id} className="flex flex-col items-center text-center gap-2">
                          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600">
                            <Icon className="w-5 h-5" />
                          </span>
                          <span className="text-xs font-medium text-slate-700 leading-tight">{a.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
              {transfers.length > 0 && (
                <section id="transfers" className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
                  <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-br from-cyan-500/10 via-teal-500/5 to-transparent pointer-events-none" />
                  <div className="relative mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-sm">
                        <Plane className="w-3.5 h-3.5" />
                      </span>
                      Transfers
                    </h3>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-700 bg-cyan-50 border border-cyan-100 rounded-full px-2 py-0.5">Included</span>
                  </div>
                  <ul className="relative space-y-3">
                    {transfers.map((t) => {
                      const typeName = (t.transferTypeId && transferTypeNameById.get(t.transferTypeId)) || "Transfer";
                      const Icon = getTransferIcon(typeName);
                      return (
                        <li key={t.id} className="group relative flex items-center justify-between gap-3 text-sm rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-cyan-200 hover:shadow-sm transition p-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="relative inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-sm flex-shrink-0">
                              <Icon className="w-5 h-5" />
                            </span>
                            <span className="text-slate-800 font-medium truncate">{t.from} → {t.to}</span>
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-cyan-700 text-xs font-bold border border-cyan-200 shadow-sm whitespace-nowrap flex-shrink-0">
                            <Icon className="w-3.5 h-3.5" />{typeName}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </div>

            {(inclusionLines.length > 0 || exclusionLines.length > 0) && (
              <section id="inclusions" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-6">
                  <h3 className="text-lg font-bold text-emerald-700 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Inclusions
                  </h3>
                  <ul className="space-y-2">
                    {inclusionLines.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-rose-200 bg-rose-50/30 p-6">
                  <h3 className="text-lg font-bold text-rose-700 mb-3">Exclusions</h3>
                  <ul className="space-y-2">
                    {exclusionLines.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
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
              {hasPricingBreakdown ? (
                <>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>Package Cost</span><span className="font-semibold text-slate-900">{formatINR(campaign.packageCost + campaign.marginPrice)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Planning Platform fee</span><span className="font-semibold text-slate-900">{formatINR(campaign.platformFee)}</span>
                    </div>
                    {campaign.insurancePrice > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Insurance</span><span className="font-semibold text-slate-900">{formatINR(campaign.insurancePrice)}</span>
                      </div>
                    )}
                    <div className="my-2 border-t border-dashed border-slate-200" />
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span><span className="font-semibold text-slate-900">{formatINR(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>GST ({campaign.gstPercent}%)</span><span className="font-semibold text-slate-900">{formatINR(gstAmount)}</span>
                    </div>
                  </div>
                  <div className="my-4 border-t border-dashed border-slate-200" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-700">Grand Total</span>
                    <span className="text-xl font-bold text-slate-900">{formatINR(grandTotal)}</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-2">
                  <div className="text-sm text-slate-500">Starting From</div>
                  <div className="text-2xl font-bold text-slate-900">{formatINR(price)}</div>
                </div>
              )}
              <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />Best Price Guaranteed
              </div>
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

      <TravelerStories destination={campaign.destination.name} />

      <div className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600">
            <ArrowLeft className="w-4 h-4" />Back to Home
          </Link>
          <Link
            href={`/plan-trip?destination=${encodeURIComponent(campaign.destination.name)}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
          >
            Customise This Trip<ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
