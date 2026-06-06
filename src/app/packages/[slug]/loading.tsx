/**
 * Route-level loading UI for /packages/[slug]. Shown instantly during
 * navigation while the page streams in.
 */
export default function PackagesLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero skeleton */}
      <div className="relative h-[60vh] min-h-[420px] w-full overflow-hidden bg-slate-900">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-slate-800 to-slate-900" />
        <div className="relative z-10 flex h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-col justify-end pb-14">
          <div className="h-6 w-32 animate-pulse rounded-full bg-white/15" />
          <div className="mt-4 h-12 w-72 animate-pulse rounded-2xl bg-white/15 sm:w-96" />
          <div className="mt-3 h-5 w-80 animate-pulse rounded-lg bg-white/10" />
          <div className="mt-7 flex gap-3">
            <div className="h-12 w-40 animate-pulse rounded-full bg-white/15" />
            <div className="h-12 w-32 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12 text-center">
          <div className="mx-auto h-6 w-40 animate-pulse rounded-full bg-slate-200" />
          <div className="mx-auto mt-4 h-10 w-80 animate-pulse rounded-2xl bg-slate-200" />
          <div className="mx-auto mt-3 h-4 w-64 animate-pulse rounded-lg bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-3xl bg-white ring-1 ring-slate-100"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
