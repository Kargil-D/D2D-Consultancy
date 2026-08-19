"use client";

interface LoadingOverlayProps {
  show: boolean;
  label?: string;
}

/** Full-page busy overlay: blocks interaction with the page behind it while an action is in flight. */
export default function LoadingOverlay({ show, label = "Processing…" }: LoadingOverlayProps) {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px]"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-white shadow-2xl border border-slate-200">
        <span className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
    </div>
  );
}
