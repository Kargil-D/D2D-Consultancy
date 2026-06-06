"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";

interface ToastMsg {
  id: string;
  kind: ToastKind;
  text: string;
}

interface ToastCtx {
  notify: (text: string, kind?: ToastKind) => void;
}

const Ctx = createContext<ToastCtx>({ notify: () => {} });

export function useToast() {
  return useContext(Ctx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastMsg[]>([]);

  const notify = useCallback((text: string, kind: ToastKind = "success") => {
    const id = `${Date.now()}-${Math.random()}`;
    setItems((p) => [...p, { id, kind, text }]);
    setTimeout(
      () => setItems((p) => p.filter((t) => t.id !== id)),
      3200,
    );
  }, []);

  const dismiss = (id: string) =>
    setItems((p) => p.filter((t) => t.id !== id));

  return (
    <Ctx.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[200] space-y-2 max-w-sm w-full pointer-events-none">
        {items.map((t) => {
          const Icon =
            t.kind === "success"
              ? CheckCircle2
              : t.kind === "error"
              ? XCircle
              : Info;
          const tone =
            t.kind === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : t.kind === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-blue-200 bg-blue-50 text-blue-800";
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-md ${tone}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm font-medium flex-1">{t.text}</div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="opacity-60 hover:opacity-100"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}
