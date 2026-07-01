# Current Implementation

## Purpose
A code-verified inventory of what exists today, module by module, with exact file references.
This is the ground truth other documents (especially `GAP_ANALYSIS.md`) are compared against.

## Scope
The entire repository as of commit `e013e08` ("Done the Database Migration and worked on the
destination page") plus the uncommitted working-tree changes present at analysis time (a
Package→Campaign copy rename across 10 files).

## Architecture (what's actually wired up)

```
Browser
  │
  ├─ Public site (Server Components, mostly static/SSG)
  │    / , /destinations/[slug], /packages/[slug], /itinerary/[id], /plan-trip, /register
  │
  ├─ Admin panel ("use client" pages, NO auth guard)
  │    /admin, /admin/destinations, /admin/packages, /admin/packages-master,
  │    /admin/packages/new, /admin/packages/[id]/edit, /admin/itineraries,
  │    /admin/hero, /admin/reviews, /admin/enquiry-config
  │
  └─ API routes (src/app/api/**), all Node runtime, none auth-gated
       /api/send-enquiry            → Nodemailer / Gmail SMTP (real)
       /api/admin/destinations      → Prisma → PostgreSQL (real)
       /api/admin/destinations/[id]
       /api/admin/destinations/[id]/toggle-status
       /api/destinations/menu       → public menu data
```

## Module-by-Module Status

### 1. Destinations — ✅ Fully implemented (reference module)
- **Schema:** `prisma/schema.prisma` — model `Destination`, enum `Status`, mapped to table
  `destinations`. Migration: `prisma/migrations/20260606_init_destinations/`.
- **Service:** `src/services/destinationService.ts` — `listDestinations` (search/paginate/filter),
  `getDestination`, `createDestination`, `updateDestination`, `removeDestination` (soft delete
  via `isDeleted`), `toggleDestinationStatus`.
- **Validation:** `src/lib/validation/destination.ts` — Zod `DestinationCreateSchema` /
  `DestinationUpdateSchema`.
- **API:** `src/app/api/admin/destinations/route.ts` (GET list, POST create),
  `[id]/route.ts` (presumed GET/PUT/DELETE), `[id]/toggle-status/route.ts`.
- **Admin client:** `src/lib/adminApi.ts` → `destinationsApi` — real `fetch()` calls, not mocked.
- **Admin UI:** `src/app/admin/destinations/page.tsx` — full CRUD table with search, country
  filter, pagination, drawer form, image upload, status toggle, delete confirm.
- **Public consumption:** `src/app/api/destinations/menu/route.ts`, `src/app/destinations/[slug]/page.tsx`.
- **Gap:** no server-side auth check on any of the above routes (see `SECURITY_GUIDELINES.md`).

### 2. Packages / Campaigns / Itineraries — ⚠️ Implemented twice, inconsistently, on file storage only
Two entirely separate, non-interoperating systems both claim this domain:

**(a) Markdown-backed itinerary editor** (the one the public site actually renders from):
- **Content store:** `content/itineraries/*.md` — 19 files, YAML frontmatter + markdown body.
- **Service:** `src/services/itineraryService.ts` — fs + `gray-matter` read/write, in-memory
  cache with `invalidateItineraryCache()`, custom markdown-body parser for days/inclusions/exclusions.
- **Admin UI:** `src/app/admin/packages/page.tsx` (list), `new/page.tsx`, `[id]/edit/page.tsx`,
  `src/components/admin/PackageForm.tsx` (tabbed editor: Basic Info/Itinerary/Hotels/
  Activities/Transfers/Pricing/Inclusions/Terms — mirrors the PDF's Campaign tab list almost
  exactly), `src/app/admin/packages/actions.ts` (Server Action `saveItineraryAction` writes the
  `.md` file).
- **Public consumption:** `src/app/packages/[slug]/page.tsx`, `src/app/itinerary/[id]/page.tsx`.
- **No Postgres table backs this at all.**

**(b) `localStorage`-backed "Packages Master"** (disconnected from (a)):
- **Type:** `AdminPackage` in `src/types/admin.ts` — a different shape (destinationId,
  packageType, days/nights, startingPrice/offerPrice, highlights/inclusions/exclusions,
  travelTypes, isFeatured/isHeroCampaign, viewDetailsRedirect, gallery).
- **Client:** `src/lib/adminApi.ts` → `packagesApi = repo<AdminPackage>("packages", …)` — pure
  browser `localStorage`, no network call, no server persistence at all.
- **Admin UI:** `src/app/admin/packages-master/page.tsx`.
- **Not read by any public page.** Purely an admin-side data-entry exercise with no consumer.

### 3. Hero Section, Reviews, Enquiry Config — ⚠️ localStorage mocks only
- Types: `AdminHeroConfig`, `AdminReview`, `AdminEnquiryConfig` in `src/types/admin.ts`.
- Client: `heroApi`, `reviewsApi`, `enquiryConfigApi` in `src/lib/adminApi.ts` — all
  `repo<T>()` (browser `localStorage`, no backend).
- Admin UI: `src/app/admin/hero/page.tsx`, `src/app/admin/reviews/page.tsx`,
  `src/app/admin/enquiry-config/page.tsx`.
- The **public-facing** Hero (`src/components/hero/Hero.tsx`) and Reviews
  (`src/components/reviews/ReviewsSection.tsx`) sections render from `src/data/*.ts` static
  exports, not from the admin-editable `localStorage` records — so editing Hero/Reviews in the
  admin panel currently has **no visible effect on the live site**.

### 4. Authentication — ❌ Fully mocked, no server verification
- `src/contexts/AuthContext.tsx` — client-only session state, persisted to
  `localStorage`/`sessionStorage`, hydrated on mount.
- `src/services/authService.ts` — `USE_MOCK = true` (hardcoded). `mockLogin()` accepts any
  password ≥ 4 chars, assigns role `"admin"` if the email ends in `@d2dholidays.com` else
  `"customer"`. Fake JWT strings (`mock.jwt.<timestamp>`). Social login likewise mocked.
- `src/components/auth/LoginModal.tsx` / `LoginForm.tsx` / `SocialLoginButtons.tsx` — real UI,
  fake backend.
- `src/app/register/page.tsx` — client-only form, `await new Promise(setTimeout)` instead of an
  API call; nothing is persisted.
- **No `middleware.ts` exists anywhere in the repo.** `/admin/**` routes and
  `/api/admin/**` routes are reachable by anyone, authenticated or not.

### 5. Enquiry / Plan-Trip Wizard — ✅ Functional, but doesn't persist a Lead
- `src/app/plan-trip/page.tsx` — 6-step client wizard (Travellers, Duration, Departure City,
  Language, Departure Date, Contact Details).
- `src/services/enquiryService.ts` — orchestrates validation + `Promise.allSettled()` of
  Google Form submission (`googleFormService.ts`) and email (`/api/send-enquiry`).
- `src/app/api/send-enquiry/route.ts` — real Nodemailer/Gmail SMTP send, server-validated.
- **No `Lead` record is ever written to a database.** The only durable trace of a submission is
  the email itself (and, best-effort, the Google Form response).

### 6. SEO — ⚠️ Partially implemented
- `generateMetadata` + `generateStaticParams` present on destination/package/itinerary pages
  (per `PROJECT_CONTEXT.md`, corroborated by route structure).
- No `sitemap.ts` or `robots.ts` found in `src/app/`.

### 7. Image Handling — ⚠️ Mocked
- `src/components/admin/ui/ImageUpload.tsx` + `uploadImage()` in `adminApi.ts` convert the
  selected file to a base64 data URL client-side. No object storage (S3/R2) integration exists.
  `next.config.ts` whitelists only `images.unsplash.com` and `images.pexels.com` as remote image
  hosts — a data-URL or any other host would need explicit config or `unoptimized`.

### 8. Testing, CI/CD — ❌ Not present
- No test framework in `package.json` (no jest/vitest/playwright).
- No `/tests` directory.
- No `.github/workflows/*` — only `.github/copilot-instructions.md`.
- `package.json` scripts: `dev`, `build`, `start`, `lint` only. No `prisma migrate deploy`,
  `prisma db seed`, or test script wired up.

## Best Practices
When extending any module above, match the `Destination` module's shape (schema → validation →
service → route handlers → typed client wrapper → admin UI) rather than either of the
`Packages` patterns, which are legacy/parallel and should not be replicated further.

## Recommendations
See [`docs/GAP_ANALYSIS.md`](GAP_ANALYSIS.md) and [`docs/TASK_BREAKDOWN.md`](TASK_BREAKDOWN.md)
for prioritized next steps.

## Future Improvements
Consolidate the two Package/Campaign systems into one Prisma-backed `Campaign` model per the
PDF spec, retire the `localStorage` mocks entity-by-entity as real API routes land, and wire the
admin-editable Hero/Reviews content into the actual public-facing components.
