# Gap Analysis — D2D Nexus Architecture Brief vs. Current Repository

## Purpose
Line up every requirement in the attached D2D Nexus architecture document against verified
code in this repository, and rank what's missing by how much it blocks Phase 1.

## Scope
Compares `D2D_Nexus_Architecture.pdf` (sections 1–11) against the repository state documented
in [`docs/CURRENT_IMPLEMENTATION.md`](CURRENT_IMPLEMENTATION.md). Does not re-litigate the
aspirational `docs/ARCHITECTURE.md`, which itself is not fully implemented either (see note at
the end).

## Architecture Conflict — read this first

The PDF and `docs/ARCHITECTURE.md` both assume a **single Next.js monolith**: pages, API route
handlers, and Prisma all in one codebase, one Postgres database. But the actual code contains
explicit forward-looking comments pointing somewhere else:

- `src/services/authService.ts:6-9`: *"Swap the `mockLogin` body with a real
  `fetch("/api/auth/login", …)` against the **.NET API** when ready."*
- `src/lib/adminApi.ts:6-9`: *"Swap each `localRepo<T>` call with a real
  `fetch("/api/admin/...")` call against the **.NET API** when it's ready."*
- `src/types/admin.ts:1-5`: *"Mirrors the planned SQL schema so swapping localStorage for the
  **.NET API** later is a 1:1 mapping."*

This is a real, three-way disagreement between (1) the PDF, (2) `docs/ARCHITECTURE.md`, and
(3) the actual code's stated intent, on the single most consequential decision in the system:
**what serves the API?** Every module built after the `Destination` slice should not proceed
until this is resolved, because the answer determines whether new work belongs in
`src/app/api/**` (Prisma direct) or is throwaway UI scaffolding awaiting a different backend.
This is called out again in [`CLAUDE.md`](../CLAUDE.md) §2 as a standing instruction to ask
before assuming.

## Gap Table — by PDF Section

### §4 Data Model (Prisma Entities)

| PDF Entity | Status | Evidence |
|---|---|---|
| `Destination` | ✅ Implemented, closely matches spec | `prisma/schema.prisma`; field names differ slightly (`thumbnailImage`/`bannerImage` vs. PDF's `thumbnailUrl`/`bannerUrl`; `isDomestic` boolean vs. PDF's `type` enum) but semantically equivalent |
| `Campaign` | ⚠️ Partially implemented, wrong storage, split across two systems, wrong name | See `CURRENT_IMPLEMENTATION.md` §2. No Postgres row exists for it at all — PDF explicitly requires **both** a DB row and a markdown file (§7); only the markdown half exists |
| `User` | ❌ Not modeled | No `User` table in schema; `authService.ts` is 100% mocked |
| `Lead` | ❌ Not modeled | `/api/send-enquiry` sends an email but persists nothing |
| `Quotation` / `QuotationItem` | ❌ Not modeled | No quotation builder, no share token, no costing |
| `ItineraryTemplate` | ⚠️ Loosely represented | `content/itineraries/*.md` + `ItineraryContent` type cover similar ground but as flat files, not a DB table referenced by Quotation |
| `Booking` / `BookingComponent` / `Document` / `DmcCommunication` | ❌ Not modeled | No booking module exists |
| `Payment` / `PaymentEntry` | ❌ Not modeled | — |
| `CostSheet` | ❌ Not modeled | No supplier-cost/margin tracking anywhere; `AdminPackage.startingPrice`/`offerPrice` is customer-facing pricing only |
| `Invoice` / `Voucher` | ❌ Not modeled | No PDF-generation dependency in `package.json` at all |
| `SupportCase` / `SupportLog` | ❌ Not modeled | No customer-support module |

### §5 Roles & Access Control
❌ **Not implemented.** No role is persisted anywhere; `authService.ts` derives a fake
`"admin"`/`"customer"` role from the email domain string, client-side, and nothing checks it
server-side. Every admin screen and every `/api/admin/**` route is reachable without
authentication. This is the single largest deviation from the brief, which states plainly:
*"Never trust the client alone."* (PDF §5).

### §6 Workflow & Automation (the "Won" trigger)
❌ **Not implemented.** Requires `Lead`, `Booking`, `Payment`, `SupportCase` to exist first —
none do. No transactional logic of any kind exists in the codebase yet (no `prisma.$transaction`
usage found).

### §7 Campaign Content Pipeline
⚠️ **Half-built.** The PDF's 5-step pipeline (Edit → Validate → Persist to Postgres → Publish
markdown → Serve) is implemented for steps 1, 2 (partially), 4, and 5 via the markdown itinerary
editor — but step 3 ("Prisma upserts the Campaign row") is entirely missing, because no
`Campaign` Postgres model exists. The `PackageForm.tsx` editor is functionally very close to
what the PDF describes for the Campaign tabbed form (Basic Info/Itinerary/Hotels/Activities/
Transfers/Pricing/Inclusions/Terms tabs match almost 1:1) — this is the fastest path to closing
this gap, not a rewrite.

### §8 Document Generation (PDF)
❌ **Not implemented.** No `react-pdf`, `puppeteer`, or any PDF library in `package.json`. No
Quotation/Invoice/Voucher entities to generate from either.

### §9 Non-Functional Considerations
| Area | PDF requirement | Status |
|---|---|---|
| Security | Hashed passwords, server-side role checks, signed shareable-quote tokens, private document storage | ❌ None present |
| Data integrity | Postgres FKs + Prisma transactions for Won trigger/payments | N/A — only one table exists, nothing to enforce yet |
| Auditability | `createdAt`/`updatedAt` on all tables, activity timeline | ✅ Pattern established on `Destination` (`createdBy`/`createdDate`/`updatedBy`/`updatedDate`/`isDeleted`); not yet replicated elsewhere |
| Performance | Server components, indexed queries, pagination on all lists | ✅ Pagination UI exists generically (`Pagination.tsx`, `DataTable.tsx`); ⚠️ no additional DB indexes beyond the unique `slug` |
| Backups | Managed Postgres automated backups | N/A — no managed DB provisioned yet (`DATABASE_URL` empty in local `.env`) |

### §10 Deployment & Environments
⚠️ **Not codified.** `package.json` has no `prisma migrate deploy` or seed script. `README.md`
is unedited `create-next-app` boilerplate. No Staging environment config or docs. No CI/CD
pipeline (`.github/` contains only `copilot-instructions.md`, no workflow files).

### Terminology Correction (PDF Introduction)
> *"There is no separate Package entity — that heading is being corrected to 'Create / Edit
> Campaign'."*

⚠️ **In progress, incomplete, uncommitted.** A working-tree change (not yet committed) renames
UI copy in 10 files from "Package" to "Campaign" (button labels, headings, placeholders — see
`git diff --stat` at analysis time). But the underlying identifiers have **not** followed:
`src/components/admin/PackageForm.tsx:73` still literally renders `"Create / Edit Package"`;
the route segments (`/admin/packages`, `/admin/packages-master`), the type (`AdminPackage`),
the client wrapper (`packagesApi`), and the component filename are all still "Package". This
produces a codebase where the UI says "Campaign" but every identifier a developer would search
for says "Package" — a maintainability trap. See
[`docs/TASK_BREAKDOWN.md`](TASK_BREAKDOWN.md) for the itemized completion list.

## What's *Ahead* of the PDF
- `/plan-trip` enquiry wizard is more polished (6 steps incl. language preference) than the
  PDF's minimal description implies, and has working email delivery — a real asset to build the
  `Lead` persistence layer on top of, rather than around.
- The `Destination` module's soft-delete + audit-column pattern is a stronger baseline than the
  PDF explicitly specifies and should be the template for every future table.

## Best Practices
Re-run this comparison after any milestone that touches the data model, and update the status
column rather than letting this document drift the way `PROJECT_CONTEXT.md` and
`docs/ARCHITECTURE.md` have.

## Recommendations (priority order)
1. Resolve the Next.js-vs-.NET backend question (blocks everything else meaningfully).
2. Stand up a real `User` model + server-side session/role check + `middleware.ts` guard on
   `/admin/**` and `/api/admin/**` — currently the single biggest security exposure.
3. Finish the Campaign rename as one atomic pass (routes + types + files + copy).
4. Add a `Campaign` Prisma model and make the existing markdown pipeline also upsert it,
   closing PDF §7 step 3. Retire the disconnected `packages-master` localStorage system once the
   real `Campaign` model exists — don't merge it as-is, its schema shape doesn't match anything
   the public site reads.
5. Build `Lead` persistence into the existing, working `/plan-trip` → `/api/send-enquiry` flow
   before starting Quotation/Booking, per the dependency chain in `BUSINESS_REQUIREMENTS.md`.

## Future Improvements
Once Lead/Quotation/Booking/Payment exist, revisit this document to gap-check the Won-trigger
transaction, PDF generation, and role-based route gating against PDF §6, §8, §5 respectively.
