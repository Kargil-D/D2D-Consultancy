"use client";

import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { useToast } from "@/components/admin/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { sheetSyncApi } from "@/lib/adminApi";
import type { AdminSheetTarget } from "@/types/admin";

const LABELS: Record<AdminSheetTarget, { sheet: string; rows: string }> = {
  leads: { sheet: "Lead Sheet", rows: "leads" },
  bookings: { sheet: "Booking Sheet", rows: "bookings" },
};

const BUTTON_CLASS =
  "inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed";

/** "Open sheet" + "Sync to Google Sheet" for one Google Sheet mirror (see sheetSyncService).
 * Admin-only, and renders nothing until the sync is configured on the server. */
export default function SheetSyncButtons({ target }: { target: AdminSheetTarget }) {
  const { notify } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.roles.includes("admin") ?? false;
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    sheetSyncApi
      .status()
      .then((res) => {
        if (!res.success) return;
        setSheetUrl(target === "leads" ? res.data.leadsSheetUrl : res.data.bookingsSheetUrl);
      })
      .catch(() => setSheetUrl(null));
  }, [isAdmin, target]);

  if (!isAdmin || !sheetUrl) return null;

  const sync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await sheetSyncApi.sync(target);
      if (!res.success) {
        notify(res.message || "Google Sheet sync failed", "error");
        return;
      }
      notify(`${LABELS[target].sheet} updated: ${res.data.rows[target] ?? 0} ${LABELS[target].rows}`, "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Google Sheet sync failed", "error");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <a href={sheetUrl} target="_blank" rel="noopener noreferrer" className={BUTTON_CLASS}>
        <ExternalLink className="w-4 h-4" /> {LABELS[target].sheet}
      </a>
      <button onClick={sync} disabled={syncing} className={BUTTON_CLASS}>
        <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
        {syncing ? "Syncing…" : "Sync to Google Sheet"}
      </button>
    </>
  );
}
