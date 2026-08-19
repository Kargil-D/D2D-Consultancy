/**
 * Dev-only timing helper for the quotation performance investigation. No-ops in production
 * builds so nothing here can leak query timings or payload sizes into prod logs. Never pass
 * customer/quotation content as `meta` — labels and counts only.
 */
const ENABLED = process.env.NODE_ENV !== "production";

export async function perfTime<T>(label: string, fn: () => Promise<T>, meta?: (result: T) => Record<string, unknown>): Promise<T> {
  if (!ENABLED) return fn();
  const start = performance.now();
  const result = await fn();
  const ms = (performance.now() - start).toFixed(1);
  const extra = meta ? meta(result) : undefined;
  console.log(`[perf] ${label} ${ms}ms${extra ? " " + JSON.stringify(extra) : ""}`);
  return result;
}
