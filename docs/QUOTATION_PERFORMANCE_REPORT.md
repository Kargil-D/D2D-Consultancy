# Quotation Page — Performance Analysis & Optimization Report

**Date:** 2026-08-26 · **Scope:** `/admin/quotations` (list) and `/admin/quotations/new|[id]/edit` (builder), their APIs, queries, uploads, and production configuration.

---

## 1. Executive summary

The quotation page was slow in production for two compounding reasons:

1. **Geography.** Vercel serverless functions run in US-East (`iad1`) by default while the Neon
   database lives in Singapore (`ap-southeast-1`). Every database round trip paid ~200–250 ms of
   network latency. A single builder save performs 6–10 sequential queries → 1.5–2.5 s server
   time *per save*, and the auto-saver fires on every edit burst. Dev talks to `localhost:5432`
   (sub-millisecond), which is why dev never showed the problem.
2. **Payload gravity.** Nearly every read fetched far more than the page renders: full
   destination rows (with a cities join) for a name dropdown, full campaign rows (itinerary
   JSON, gallery, pricing) for a template dropdown, the complete quotation content JSON —
   which can embed legacy base64 images — in the list table, in every builder load, in every
   auto-save request **and again in every save response echo**.

Both root causes are now fixed in code/config. No business rule changed; every endpoint keeps
its previous shape unless a caller explicitly opts into the new lean views.

---

## 2. Findings and fixes by priority

### P0 – Critical (directly caused production slowness)

| # | Issue | Root cause | Fix (implemented) |
|---|-------|-----------|-------------------|
| 1 | Every API request pays ~230 ms × N queries | Vercel functions in `iad1`, Neon in Singapore | `vercel.json` pins functions to `sin1`, colocating compute with the DB. Round-trip cost drops from ~230 ms to low single-digit ms. |
| 2 | Auto-save (1.5 s debounce) PUT the **entire** quotation — itinerary text, inclusions, customer — and the server echoed the full record back | `buildPayload()` reused for auto-save; PUT returned `QUOTATION_INCLUDE` | Auto-save now sends only `hotelOptions/transfers/activities/items`; the PUT returns a slim `{id, updatedDate, status, shareToken}` ack (`QuotationBuilder.tsx`, `quotationService.updateQuotation`). |
| 3 | Every save ran an **unindexed full scan of the leads table** (`mobile endsWith`) — even when the customer hadn't changed | `updateQuotation` always called `findOrCreateLeadForQuotation` | Fast path compares the payload against the already-linked lead (one indexed PK read) and skips the scan when nothing changed, including the status-advance rule. The scan itself now selects 6 columns instead of full rows. |
| 4 | Quotations **list table** fetched every row's full content JSON (which can embed base64 images) for 10 rows per page | `QUOTATION_LIST_INCLUDE` returned all scalar columns | New `view=summary` (`listQuotationSummaries`, `QUOTATION_SUMMARY_SELECT`) returns only what the table renders. Lead-scoped consumers (BookingDetail cost-sheet import needs the JSON) keep the old endpoint. |

### P1 – High

| # | Issue | Root cause | Fix (implemented) |
|---|-------|-----------|-------------------|
| 5 | Builder load fetched full destination rows + cities join (pageSize 1000) for a name dropdown | `destinationsApi.all()` | `view=options` endpoint returning `{id, name}` (`listDestinationOptions`). |
| 6 | Selecting a destination fetched up to 1000 **full campaign rows** (itinerary JSON, gallery, pricing) for a name-only template dropdown | `packagesApi.list({pageSize: 1000})` | `view=options` on `/api/admin/campaigns` returning `{id, name}` (`listCampaignOptions`). |
| 7 | Builder GET dragged the related campaign/destination/salesExecutive **full rows** along although only their ids are used | `QUOTATION_INCLUDE` on the admin GET | `getQuotationForBuilder` with `QUOTATION_BUILDER_INCLUDE` (lead + items + bookings only). PDF/share/email keep the full include — they render those relations. |
| 8 | Image uploads sent originals up to 5 MB; a phone photo is ~3–4 MB for a card-sized render | No client-side processing | `ImageUpload` now downscales to ≤1600 px and re-encodes (JPEG q0.82; PNG stays PNG so transparency survives) before upload; falls back to the original if compression doesn't help. Upload architecture (direct client → Vercel Blob, DB stores URL only) was already correct. |

### P2 – Medium (implemented)

| # | Issue | Fix |
|---|-------|-----|
| 9 | Dev-only: `prisma.ts` created a client (and connection pool) on every hot reload before discarding it | Client now instantiated only when the cached global is absent. |

### P2/P3 – Recommended, **not** implemented (need data access or a migration)

* **Legacy base64 images inside quotation JSON** (acknowledged by the code's own comment near
  `QUOTATION_TRANSACTION_OPTIONS`). A one-off migration should walk existing quotations, upload
  embedded `data:` images to Vercel Blob, and replace them with URLs. Run it when the database
  is active again; new content is URL-based already.
* **`Lead.normalizedMobile` column + index** to eliminate the `endsWith` scan entirely (the
  fast path above removes it from the hot loop; the column removes it from first-save too).
* **Catalog caching between step visits**: the Hotels/Activities editors refetch their
  destination catalog on every remount (revisiting a step). A small in-memory map keyed by
  destinationId would remove those repeats.
* **Verify the production `DATABASE_URL` uses Neon's pooled endpoint** (`-pooler` host) — the
  env var lives in Vercel and could not be inspected from this machine.

---

## 3. What was analyzed and found healthy

* **Parallelism:** the builder's three lookup calls run in `Promise.all`, and the quotation GET
  runs concurrently with them. The template-apply path fans out 5 requests in parallel.
* **Step editors lazy-load correctly** — hotel/activity catalogs load only when their step is
  opened, filtered by destination and status.
* **Currencies/sales-users lookups** are already lean selects.
* **Auth cost** is one indexed PK query per request (`findUserById` with role+permissions
  include) — acceptable once colocated; JWT verification is stateless.
* **List query indexes:** `@@index([createdDate])`, `[leadId]`, `[destinationId]` cover the
  list's order/filter patterns.
* **No N+1 patterns** in the quotation read/write paths — includes batch in single queries;
  item replacement is `deleteMany` + `createMany` (2 statements, not per-row).
* **No client-side polling loops**; the auto-save debounce (1.5 s) is a sane cadence once the
  payload is proportional.

## 4. Timeout analysis

| Timeout | Current value | Verdict |
|---|---|---|
| Prisma interactive transaction (`QUOTATION_TRANSACTION_OPTIONS`) | 20 s (raised from 5 s default to survive prod latency) | **Keep for now** — it was masking root causes #1/#2, which are fixed. After the region move and a base64 migration, it can likely return to the default; do that only after observing real timings. |
| Frontend/API/HTTP client | none set (browser defaults) | Appropriate — no artificial timeouts to tune. |
| Image upload | Vercel Blob client default | Appropriate — uploads bypass the API server entirely. |

No timeout was increased as part of this work; the 20 s transaction value is inherited and now
has headroom rather than being load-bearing.

## 5. Production vs development — why prod was so much slower

| Factor | Dev | Prod (before) | Prod (after) |
|---|---|---|---|
| DB latency per query | ~0.2 ms (localhost) | ~230 ms (iad1 → Singapore) | ~1–5 ms (sin1 → Singapore) |
| Typical save (8 queries) | ~50 ms | ~2 s | ~150 ms |
| Builder initial load (5 requests × auth+data queries) | fast | 1.5–3 s serial DB time | ~0.2–0.4 s |
| Payloads | same code, but tiny local data | production rows carry real images/JSON | lean projections everywhere hot |

## 6. Measurement plan (before/after)

Live numbers could not be captured during this change: the Neon project is paused (free-plan
data-transfer limit) and dev-machine timings don't reflect the US↔Singapore latency that
dominated production. The table below combines static payload accounting (measurable from the
queries) with the latency model above; the right column tells you how to confirm each number
after deploy.

| Metric | Before | After | How to verify |
|---|---:|---:|---|
| Builder initial-load API payload | full destination rows + cities, full quotation include | id+name options + lean include (typically **80–95 % smaller**) | Network tab, or the existing `perfTime` `bytes` log on `GET /api/admin/quotations/[id]` (dev) |
| Campaign dropdown payload | up to 1000 full rows | `{id,name}` ×N (**~99 % smaller**) | Network tab on `/api/admin/campaigns?view=options` |
| Auto-save request size | entire quotation JSON | 4 sections only | Network tab during Hotels-step edits |
| Auto-save response size | entire quotation JSON echoed | ~120 bytes | Network tab |
| Queries per unchanged-customer save | scan-all-leads + 4–6 more | 1 PK read + 3–4 | `[perf]` logs (`mobileScan` disappears) |
| Server time per save (prod) | ~2 s (8 × 230 ms) | ~0.1–0.2 s | Vercel function logs after `sin1` deploy |
| List-page payload (10 rows) | 10 × full content JSON | 10 × table columns | `perfTime` `bytes` on `GET /api/admin/quotations` |
| Image upload size (4 MB photo) | 4 MB | typically 0.3–0.8 MB | Blob dashboard / network tab |

`src/lib/perf.ts` timings are dev-only by design; for production numbers use Vercel's function
duration logs, which need no code change.

## 7. Deployment notes & risks

* All changes are additive or behind new `view=` parameters; existing consumers keep their
  exact response shapes. The two intentional response changes are consumed only by code updated
  in the same commit: the builder PUT ack and the quotations-table summary rows.
* The lead fast-path preserves the status-advance rule (`New/Contacted/FollowUp →
  QuotationSent`) by falling through whenever the lead is still in those stages.
* `vercel.json` `regions: ["sin1"]` moves **all** functions to Singapore. This is right while
  the database is there and most users are in India (Singapore is also the closest Vercel
  region to India among Neon-matched options). If the DB ever moves, move this with it.
* Type-check and production build pass (`tsc --noEmit`, `next build`).
