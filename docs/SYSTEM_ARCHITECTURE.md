# System Architecture

## Purpose
Describe the actual, current runtime architecture of the application — as opposed to the
target architecture in `docs/ARCHITECTURE.md` or the PDF brief.

## Scope
Request flow, layering, and integration points as they exist in code today.

## Architecture

### Deployment unit
One Next.js 15 App Router application. No separate backend service is deployed; the "API
layer" is Next.js Route Handlers inside the same build (`src/app/api/**`). Hosting target is
Vercel (per `PROJECT_CONTEXT.md`); no infra-as-code or CI/CD exists in-repo to confirm this in
practice.

### Layers actually present

```
┌─────────────────────────────────────────────────────────────┐
│ Presentation — Next.js App Router pages, RSC + "use client"  │
│   Tailwind CSS v4, Framer Motion, Lucide React                │
├─────────────────────────────────────────────────────────────┤
│ API — Route Handlers under src/app/api/**                     │
│   Only 5 routes exist: send-enquiry, admin/destinations (×3), │
│   destinations/menu                                            │
├─────────────────────────────────────────────────────────────┤
│ Domain / Services — src/services/*.ts                         │
│   enquiryService, googleFormService, itineraryService,        │
│   authService (mocked), destinationService (real)             │
├─────────────────────────────────────────────────────────────┤
│ Data access — src/lib/prisma.ts (singleton PrismaClient)       │
│   Used by exactly one service: destinationService.ts           │
├─────────────────────────────────────────────────────────────┤
│ Persistence — PostgreSQL (one table: destinations)              │
│   + content/itineraries/*.md (file-based, 19 files)             │
│   + browser localStorage (packages, hero, reviews, enquiryConfig,│
│     auth session — client-side only, not real persistence)      │
├─────────────────────────────────────────────────────────────┤
│ Integrations — Nodemailer/Gmail SMTP (real), Google Form         │
│   (best-effort, silent failure)                                  │
└─────────────────────────────────────────────────────────────┘
```

Compare against the PDF's target layering in `D2D_Nexus_Architecture.pdf` §2 — the Domain/
Services and Persistence layers are the two that are mostly aspirational today.

### Request Flow — Destination CRUD (the one fully real flow)
```
Admin browser → /admin/destinations (client component)
  → destinationsApi.list()/create()/update()/remove() [src/lib/adminApi.ts]
    → fetch("/api/admin/destinations...") 
      → Route Handler [src/app/api/admin/destinations/**]
        → Zod validation [src/lib/validation/destination.ts]
          → destinationService [src/services/destinationService.ts]
            → Prisma → PostgreSQL
```
No auth check occurs anywhere in this chain today (see `docs/SECURITY_GUIDELINES.md`).

### Request Flow — Enquiry submission (real, but doesn't persist)
```
/plan-trip wizard (client) → enquiryService.validate() + submit()
  → Promise.allSettled([
      googleFormService.submit()   // best-effort, no-cors, silent failure
      fetch("/api/send-enquiry")   // Nodemailer → Gmail SMTP
    ])
  → window.location.href = "/destinations/<slug>"  // always redirects
```
Nothing is written to a database. The email is the only durable record.

### Request Flow — Campaign/Package publish (markdown-only)
```
/admin/packages/new or [id]/edit → PackageForm.tsx (client)
  → <form action={saveItineraryAction}>  // Next.js Server Action
    → src/app/admin/packages/actions.ts
      → itineraryService.writeItineraryFile()
        → fs.writeFileSync(content/itineraries/<id>.md)  // gray-matter
```
No database write occurs. Public pages (`/packages/[slug]`, `/itinerary/[id]`) read the same
files back via `itineraryService.getAllItineraries()`/`getItineraryById()`, cached in-process
and invalidated on save.

## Current Status
Only the Destination vertical slice reaches a real database. Every other "CRUD" surface in the
admin panel is either file-based (itineraries) or browser-only (`localStorage`), which means it
does not survive across devices/browsers and is invisible to any other user or to a server
render.

## Best Practices
- New features that need durable, shared, server-visible data must go through Prisma +
  PostgreSQL, following the Destination flow above — not `localStorage`.
- Keep services server-only (`src/services/*.ts` must never be imported by a `"use client"`
  file); this convention is already followed correctly throughout the repo.

## Recommendations
- Add `middleware.ts` to gate `/admin/**` and `/api/admin/**` once real auth exists — there is
  currently no interception point in the request path at all.
- Introduce a `src/lib/env.ts` Zod-validated environment loader (referenced by
  `.github/copilot-instructions.md` but not present in code) so missing/malformed env vars fail
  fast at boot instead of at first use (`src/lib/prisma.ts` currently throws only when imported).

## Future Improvements
Once the CRM entities exist, revisit whether heavy operations (PDF generation, email at volume)
should move off the request path into a queue, per PDF §11 "Phase 2 & Beyond."
