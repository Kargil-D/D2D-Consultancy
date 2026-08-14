import { Phone, Sparkles } from "lucide-react";
import { SUPPORT_PHONES, SUPPORT_EMAIL } from "@/data/contact";

/** Shown on public campaign, itinerary, and quote pages — same contact block, one place to update. */
export default function NeedHelpCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-sm font-bold text-slate-900 mb-2">Need Help?</h3>
      <p className="text-xs text-slate-500 mb-4">Our travel experts are here for you</p>
      <div className="space-y-2 text-sm">
        {SUPPORT_PHONES.map((phone) => (
          <a key={phone} href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-slate-700 hover:text-blue-600">
            <Phone className="w-4 h-4 text-blue-600" />{phone}
          </a>
        ))}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-2 text-slate-700 hover:text-blue-600 break-all">
          <Sparkles className="w-4 h-4 text-blue-600" />{SUPPORT_EMAIL}
        </a>
      </div>
    </div>
  );
}
