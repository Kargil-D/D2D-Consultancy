# Task Breakdown

## Purpose
Actionable, itemized checklist derived from `docs/GAP_ANALYSIS.md` and `docs/FEATURE_ROADMAP.md`
— granular enough to pick up as individual PRs. No code has been written against this list; it
is planning output only, per this analysis's Phase 5 instruction not to implement.

## Scope
Stage A of the roadmap (the immediate next work), broken into concrete tasks with exact file
touch-points.

## Task List

### A1 — Architecture decision (blocking)
- [ ] Confirm with the product owner whether the backend is the Next.js monolith (as the PDF
      and `docs/ARCHITECTURE.md` assume) or a separate .NET API (as `authService.ts` and
      `adminApi.ts` comments anticipate). Update `CLAUDE.md` §2 with the resolution.

### A2 — Real authentication
- [ ] Add `User` model to `prisma/schema.prisma` (id, name, mobile, email, username,
      passwordHash, department, role, status — per PDF §4.1), matching the `Destination`
      module's audit-column style.
- [ ] Add `src/lib/validation/user.ts`.
- [ ] Implement `/api/auth/login` (Route Handler), returning the exact `AuthResponse` shape
      `authService.ts`'s mock already returns, so `AuthContext` needs no changes.
- [ ] Flip `USE_MOCK = false` in `src/services/authService.ts`; delete `mockLogin`.
- [ ] Wire `src/app/register/page.tsx` to a real `/api/auth/register` route instead of its
      `setTimeout` stand-in.

### A3 — Authorization gate
- [ ] Add `src/app/admin/layout.tsx` verifying session + role before rendering `children`.
- [ ] Add a `requireRole()` helper (server-side) and call it at the top of every
      `/api/admin/**` route handler, starting with the three existing Destinations routes.
- [ ] Add `middleware.ts` at the project root to intercept `/admin/**` and `/api/admin/**`.

### A4 — Finish the Package → Campaign rename
- [ ] Rename `src/components/admin/PackageForm.tsx` → `CampaignForm.tsx`; update its `h2` text
      (currently literally `"Create / Edit Package"` at line 73) to `"Create / Edit Campaign"`.
- [ ] Rename route segment `src/app/admin/packages/` → `src/app/admin/campaigns/` (update all
      internal `Link href`s and the `AdminShell` nav entry, which already reads "Campaigns").
- [ ] Rename route segment `src/app/admin/packages-master/` → decide fate per A5 before renaming
      (may be deleted rather than renamed).
- [ ] Rename `AdminPackage` type → align with a real `Campaign` model once A5 lands, rather than
      renaming in place twice.
- [ ] Rename `packagesApi` → `campaignsApi` in `src/lib/adminApi.ts` once backed by a real API.

### A5 — Campaign model consolidation
- [ ] Add `Campaign` model to `prisma/schema.prisma` per PDF §4.1 field list.
- [ ] Add `src/lib/validation/campaign.ts`.
- [ ] Add `src/services/campaignService.ts` (mirror `destinationService.ts`).
- [ ] Add `/api/admin/campaigns` routes (mirror the Destinations route files exactly).
- [ ] Extend `itineraryService.writeItineraryFile()` (or replace its call site in
      `src/app/admin/packages/actions.ts`) to also upsert the Campaign row, closing PDF §7 step 3.
- [ ] Decide and execute: delete `src/app/admin/packages-master/page.tsx` and
      `src/app/admin/itineraries/page.tsx` (and their `AdminPackage`/`AdminItinerary` types +
      `packagesApi`/`itinerariesApi` client wrappers) once the consolidated `Campaign` editor
      covers their fields — don't leave three systems running in parallel.

### A6 — Lead persistence
- [ ] Add `Lead` model to `prisma/schema.prisma` per PDF §4.1.
- [ ] Add `src/lib/validation/lead.ts`.
- [ ] Add `src/services/leadService.ts`.
- [ ] Update `src/app/api/send-enquiry/route.ts` (or add `/api/leads`) to persist a `Lead` row
      in the same request that sends the email — don't change the wizard UI, only the service
      layer it already calls.

### Hygiene tasks (small, independent, do anytime)
- [ ] Replace `README.md` boilerplate with real setup instructions (env vars, `prisma generate`,
      content convention).
- [ ] Add `"postinstall": "prisma generate"` to `package.json`.
- [ ] Add `src/lib/env.ts` (Zod-validated env loader).
- [ ] Add `src/app/sitemap.ts` and `src/app/robots.ts`.

## Current Status
None of the above are started; this list is the planning deliverable requested for this
analysis pass. Do not begin implementation without separate, explicit authorization per this
task's Phase 5 instruction.

## Best Practices
Work top-to-bottom within Stage A — A2/A3 unblock A5/A6's ability to attribute records to a real
user; A1 should be resolved before any of A2–A6 begin in earnest.

## Recommendations
Scope each checkbox above as its own PR; several (A4's renames, hygiene tasks) are safe to do
independently and in parallel with the auth work.

## Future Improvements
Once Stage A is complete, derive a Stage B task breakdown (Quotation/Booking/Payment) in the
same format.
