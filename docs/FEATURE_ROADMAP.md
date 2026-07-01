# Feature Roadmap

## Purpose
Sequence remaining work by dependency order, reconciling the PDF's phases with what's actually
built.

## Scope
High-level phases only — see `docs/TASK_BREAKDOWN.md` for itemized, actionable tasks.

## Architecture — Phase Status (reconciled against `.github/copilot-instructions.md`'s table
and verified against code)

| Phase | Theme | Stated status | Verified status |
|---|---|---|---|
| 1 — Foundation | Next.js/Tailwind/Prisma scaffold | ✅ Done | ✅ Confirmed |
| 2 — Website | Hero, navbar, destinations, packages, itinerary pages | ✅ Done | ✅ Confirmed |
| 3 — Enquiry | 5/6-step planner + `/api/send-enquiry` | ✅ Done | ✅ Confirmed (no Lead persistence though — see below) |
| 4 — Admin | Auth, RBAC, admin shell, leads dashboard | 🔜 Next | ⚠️ Admin shell + one real CRUD module (Destinations) done; auth/RBAC/leads = 0% |
| 5 — Quotation | Clone-edit-share, PDF, signed quote URLs | 🔜 | ❌ 0% |
| 6 — Costing | Multi-currency, FX cron, GST/margin/fee engine | 🔜 | ❌ 0% |
| 7 — Optimization | Schema.org expansion, AI assistants, Web Vitals tuning | 🔜 | ❌ 0%, sitemap/robots also missing |

## Roadmap (this document's own sequencing, dependency-ordered)

**Stage A — Close out Phase 4 foundations (blocks everything after)**
1. Resolve backend architecture question (Next.js/Prisma vs. .NET) — see `GAP_ANALYSIS.md`.
2. `User` model + real authentication + `middleware.ts` authorization gate.
3. Finish the Package→Campaign rename as one atomic pass.
4. `Campaign` Prisma model; make the existing markdown pipeline also upsert it; retire
   `packages-master` and `admin/itineraries` once consolidated.
5. `Lead` model; wire `/api/send-enquiry` (or a new `/api/leads`) to persist a row, not just send
   an email.

**Stage B — CRM core (PDF Phase 5)**
6. `Quotation`/`QuotationItem`, quote builder UI, share-token public quote view.
7. `Booking`/`BookingComponent`/`Document`/`DmcCommunication`, the Won-trigger transaction.
8. `Payment`/`PaymentEntry`.

**Stage C — Documents & Support (PDF Phase 5/1 tail)**
9. `CostSheet`, `Invoice`, `Voucher` + PDF generation (pick `@react-pdf/renderer` or Puppeteer —
   neither is installed yet).
10. `SupportCase`/`SupportLog`, support workflow UI.

**Stage D — Costing Engine (PDF Phase 6)**
11. Multi-currency support, FX snapshot locking at quote time, margin/platform-fee/GST
    breakdown — explicitly out of scope for the PDF's own Phase 1, sequence after Stage B/C.

**Stage E — Optimization (PDF Phase 7)**
12. `sitemap.ts`/`robots.ts`, Schema.org JSON-LD expansion, Web Vitals measurement, real object
    storage for images/documents, testing/CI (see `TESTING_STRATEGY.md`).

## Current Status
Stage A is where the project actually is — none of its 5 items are complete, and every later
stage depends on at least items 1–2.

## Best Practices
Don't start Stage B work (Quotation) before Stage A's auth/authorization items land — a
Quotation builder with no session to attribute it to has nowhere correct to write `leadId`/
`assignedUserId` from.

## Recommendations
Treat Stage A as the literal next sprint. See `docs/TASK_BREAKDOWN.md` for the checklist form.

## Future Improvements
Re-evaluate this roadmap after Stage A ships — the backend-architecture decision (item 1) may
change item ordering for everything downstream.
