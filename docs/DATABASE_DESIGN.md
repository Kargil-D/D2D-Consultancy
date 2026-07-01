# Database Design

## Purpose
Document the actual Prisma schema in this repository, plus the target schema from the PDF, so
new models are added consistently.

## Scope
`prisma/schema.prisma` and its one migration. Does not cover the `localStorage`-only shapes in
`src/types/admin.ts`, which are not database entities (see `CURRENT_IMPLEMENTATION.md`).

## Current Schema (verbatim structure)

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum Status {
  Active
  Inactive
}

model Destination {
  id                String   @id @default(uuid())
  name              String
  country           String
  state             String?
  city              String?
  slug              String   @unique
  shortDescription  String
  fullDescription   String
  thumbnailImage    String?
  bannerImage       String?
  isPopular         Boolean  @default(false)
  displayOrder      Int      @default(0)
  seoTitle          String?
  seoDescription    String?
  status            Status   @default(Active)
  isDomestic        Boolean  @default(false)

  createdBy   String?
  createdDate DateTime @default(now())
  updatedBy   String?
  updatedDate DateTime @updatedAt
  isDeleted   Boolean  @default(false)

  @@map("destinations")
}
```

Notes on choices already made, worth preserving in future models:
- `generator client { provider = "prisma-client" }` (Prisma 7's new client generator, not the
  legacy `prisma-client-js`), output to `src/generated/prisma` (gitignored — must run
  `prisma generate` locally/in CI before build).
- `PrismaPg` driver adapter (`@prisma/adapter-pg`) used in `src/lib/prisma.ts`, not the default
  Prisma connection — keep using the adapter for consistency.
- Soft delete via `isDeleted: Boolean` rather than actually removing rows.
- Manual audit columns (`createdBy`/`createdDate`/`updatedBy`/`updatedDate`) rather than Prisma's
  auto `createdAt`/`updatedAt` names — **follow this exact naming** for new models to stay
  consistent, even though it deviates from the PDF's `createdAt`/`updatedAt` convention.
- `@@map("destinations")` — table names are lowercase snake/plural, model names are PascalCase
  singular. Follow this for every new model.

## Target Schema (from PDF §4, not yet implemented)

The PDF specifies these additional entities, none of which exist in `schema.prisma` today:
`User`, `Lead`, `Quotation`, `QuotationItem`, `ItineraryTemplate`, `Booking`,
`BookingComponent`, `Document`, `DmcCommunication`, `Payment`, `PaymentEntry`, `CostSheet`,
`Invoice`, `Voucher`, `SupportCase`, `SupportLog`, `Campaign`. Field lists for each are in
`D2D_Nexus_Architecture.pdf` §4.1; relationships in §4.2. Do not re-derive these from memory —
read the PDF section directly when implementing, since exact field names/types matter for the
Won-trigger transaction and the Quotation→Booking chain.

## Current Status
1 of ~17 entities implemented. No foreign keys exist yet (nothing to reference). No
`prisma/seed.ts` exists despite `docs/ARCHITECTURE.md` listing one in its target folder
structure.

## Best Practices
- Every new model: UUID `id`, the audit-column block above, `@@map` to a lowercase plural table
  name, a `status`-style enum where the PDF calls for one.
- Use `Prisma.<Model>WhereInput`/`CreateInput`/`UpdateInput` types in services (as
  `destinationService.ts` does) rather than hand-rolled interfaces, so schema changes propagate
  as type errors.
- Migrations: name them descriptively with a date prefix, matching
  `20260606_init_destinations`.

## Recommendations
1. Add `User` next (with a real `passwordHash` column) — every other entity depends on it via
   `assignedUserId`/`bookingExecutiveId`/`supportAgentId`/`agentId`.
2. Add `Campaign` before touching the `packages-master` localStorage system further — see
   `GAP_ANALYSIS.md` recommendation 4.
3. Keep `Lead → Quotation → Booking → Payment → CostSheet/Invoice/Voucher → SupportCase` as one
   connected migration sequence rather than building tables in isolation, since the Won-trigger
   transaction (PDF §6.1) touches four of them atomically.

## Future Improvements
Once `Booking` exists, add DB indexes mirroring the PDF's non-functional requirement
("indexed queries") — at minimum on foreign keys and any `status` column used for dashboard
filtering.
