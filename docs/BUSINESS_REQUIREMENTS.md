# Business Requirements

## Purpose
Capture the business goals and functional requirements for D2D Nexus / D2D Holidays as stated
in the supplied architecture brief, translated into requirements an engineer can trace against
code.

## Scope
Requirements only — not implementation. See [`docs/GAP_ANALYSIS.md`](GAP_ANALYSIS.md) for how
much of this is actually built.

## Business Vision
A travel consultancy needs one internal platform that does two jobs at once:
1. **Operational CRM** — run the day-to-day sales/ops business: capture leads, quote them,
   collect payment, manage bookings end-to-end (documents, DMC communication, invoices,
   vouchers), and hand off to customer support until the trip is closed.
2. **Website content-admin** — control what appears on the public marketing site: Campaigns
   (itineraries) and Destinations (which drive the hero search, destination pages, and the
   navigation mega-menu).

## Functional Requirements (from the architecture brief)

### Operational CRM
| Requirement | Detail |
|---|---|
| Lead capture | Leads carry customer contact info, destination, travel date, party size, source, assignment, status. |
| Quotation | A Lead can have many Quotations; each has line items (`QuotationItem`) per component type (Hotel/Transfer/Activity/Visa/Insurance/Flight), computed selling price = total cost × (1 + margin%). |
| Won automation | Setting a Lead to "Won" must, in one transaction: create a `Booking`, assign a Booking Executive and a Customer Support agent, create a linked `Payment` (balance = total) and an empty `SupportCase`. |
| Booking workspace | Booking Executive manages `BookingComponent`, `Document`, `DmcCommunication` records per booking. |
| Payments | `Payment` (1) → `PaymentEntry` (N) tracks running balance history. |
| Documents | Quotation, Invoice, Voucher generated as PDF server-side. Internal `CostSheet` (supplier cost, profit, margin) is never customer-visible and restricted to Admin/Booking roles. |
| Support | `SupportCase` (1) → `SupportLog` (N) tracks the support workflow stage-by-stage, ending in feedback collection. |

### Website Content-Admin
| Requirement | Detail |
|---|---|
| Campaign | Structured metadata (name, slug, destination, nights, audience, price bucket, rating, feature chips, itinerary/hotels/activities/transfers/inclusions/terms) persisted as a Postgres row **and** published to `content/itineraries/<slug>.md` for the public site build. |
| Destination | Pure database record; drives hero search dropdown, destination landing pages, and header mega-grid. No markdown file needed. |
| Terminology | The entity is **Campaign**, not "Package" — earlier UI drafts using "Create / Edit Package" are explicitly called out as needing correction. |

### Roles & Access
| Role | Access |
|---|---|
| Admin | Everything — user/department management, CRM config, all reports, content admin. |
| Sales | Leads, Quotations; marks Won/Lost. |
| Booking Executive | Booking module — documents, DMC comms, components, voucher generation. |
| Customer Support | Support module — workflow, logs, feedback. |
| Accounts (future) | Payments only — reserved for Phase 2. |

Content-admin screens (Campaigns, Destinations) are **Admin-only** in Phase 1. Every screen and
API route must be gated by role, server-side, not just hidden client-side.

## Non-Functional Requirements
- Budget-friendly: one Next.js app (UI + API), one managed Postgres DB, minimal third-party
  services, monolithic deployment.
- Hashed passwords (bcrypt/argon2), signed tokens for shareable quotation links, private
  document storage.
- `createdAt`/`updatedAt` audit columns on all tables; activity timeline on leads and bookings.
- Pagination on all list screens; indexed queries.
- Managed Postgres automated backups.

## Current Status
See [`docs/GAP_ANALYSIS.md`](GAP_ANALYSIS.md) for the authoritative, code-verified comparison.
In short: the Website Content-Admin requirements are ~40% built (Destination fully, Campaign
partially and inconsistently); the Operational CRM requirements are effectively 0% built — no
Lead, Quotation, Booking, Payment, Invoice, Voucher, or Support entities exist in the schema or
codebase.

## Best Practices
- Treat this document as the requirements source of truth; treat `docs/GAP_ANALYSIS.md` as the
  status source of truth. Don't let a new feature get built against a stale mental model of
  "what's probably already there."

## Recommendations
- Sequence CRM work as: `User` (with real auth) → `Lead` → `Quotation`/`QuotationItem` →
  `Booking` (+ Won-trigger transaction) → `Payment`/`PaymentEntry` → `CostSheet`/`Invoice`/
  `Voucher` → `SupportCase`/`SupportLog`. Each step is meaningfully shippable and testable on
  its own, and matches the PDF's relational dependency chain.

## Future Improvements
Phase 2+ items explicitly out of scope per the brief: dedicated Accounts role + accounting
integration, background job queue for PDF/email at volume, WhatsApp/Meta/Google Ads lead
ingestion via webhooks, customer-facing portal + payment gateway, advanced analytics/cohort
reporting. Do not build these ahead of Phase 1 completion.
