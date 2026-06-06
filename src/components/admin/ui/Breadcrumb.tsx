import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: Crumb[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-xs text-slate-500 mb-4">
      <Link href="/admin" className="flex items-center gap-1 hover:text-slate-800">
        <Home className="w-3.5 h-3.5" /> Admin
      </Link>
      {items.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="w-3.5 h-3.5" />
          {c.href ? (
            <Link href={c.href} className="hover:text-slate-800">
              {c.label}
            </Link>
          ) : (
            <span className="text-slate-700 font-medium">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
