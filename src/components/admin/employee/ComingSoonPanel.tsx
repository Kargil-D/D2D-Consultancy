import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
}

/** Documents/Payroll/Permissions each need their own real infra (file storage, a payroll ledger, a module/branch access matrix) before they can be more than a form — flagged here rather than faked. */
export default function ComingSoonPanel({ icon: Icon, title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
      <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-sm">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">{description}</p>
    </div>
  );
}
