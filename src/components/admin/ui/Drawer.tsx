"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

interface DrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: "md" | "lg" | "xl";
}

const widthMap = { md: "max-w-md", lg: "max-w-2xl", xl: "max-w-4xl" };

export default function Drawer({
  open,
  title,
  onClose,
  children,
  footer,
  width = "lg",
}: DrawerProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[140] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full ${widthMap[width]} h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
