/**
 * Route-level loading UI for /plan-trip. Shown instantly during navigation
 * (especially helpful in dev where the route compiles on first visit).
 */
export default function PlanTripLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-20">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-4 h-5 w-72 animate-pulse rounded-lg bg-slate-200" />

        <div className="mt-10 space-y-4">
          <div className="h-14 w-full animate-pulse rounded-2xl bg-white ring-1 ring-slate-100" />
          <div className="h-14 w-full animate-pulse rounded-2xl bg-white ring-1 ring-slate-100" />
          <div className="h-14 w-full animate-pulse rounded-2xl bg-white ring-1 ring-slate-100" />
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4">
          <div className="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-slate-100" />
          <div className="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-slate-100" />
          <div className="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-slate-100" />
          <div className="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-slate-100" />
        </div>
      </div>
    </main>
  );
}
