# Module Breakdown

## Purpose
A per-module reference: what it is, where its files live, and its completion status, for
quickly orienting on any one feature area.

## Scope
All feature modules under `src/app/`, `src/components/`, `src/services/`.

## Architecture / Module List

### Public Site
| Module | Route(s) | Key files | Status |
|---|---|---|---|
| Home / Hero | `/` | `src/app/page.tsx`, `src/components/hero/Hero.tsx`, `src/data/*.ts` | ✅ Static data-driven |
| Destinations | `/destinations/[slug]` | `src/app/destinations/[slug]/page.tsx`, `destinationService.ts` | ✅ DB-backed |
| Packages / Itineraries | `/packages/[slug]`, `/itinerary/[id]` | `itineraryService.ts`, `content/itineraries/*.md` | ✅ File-backed |
| Plan Trip wizard | `/plan-trip` | `src/app/plan-trip/page.tsx`, `enquiryService.ts` | ✅ Functional, no persistence |
| Register | `/register` | `src/app/register/page.tsx` | ⚠️ Mocked |
| Navbar / Mega-menus | global | `src/components/navbar/*` | ✅ |
| Footer | global | `src/components/footer/Footer.tsx` | ✅ |
| Reviews section | `/` | `src/components/reviews/ReviewsSection.tsx`, `src/data/reviews.ts` | ✅ Static |

### Admin Panel
| Module | Route(s) | Key files | Status |
|---|---|---|---|
| Dashboard | `/admin` | `src/app/admin/page.tsx` | ⚠️ Stats likely computed from mocked data |
| Destinations admin | `/admin/destinations` | `src/app/admin/destinations/page.tsx` | ✅ Full CRUD, DB-backed |
| Packages (markdown) admin | `/admin/packages*` | `PackageForm.tsx`, `itineraryService.ts`, `actions.ts` | ⚠️ File-backed, works, wrong entity name |
| Packages Master admin | `/admin/packages-master` | `src/app/admin/packages-master/page.tsx` | ❌ localStorage-only, disconnected from public site |
| Itineraries admin | `/admin/itineraries` | `src/app/admin/itineraries/page.tsx` | ❌ localStorage-only (`itinerariesApi`), separate from the markdown itinerary system above — a **third**, overlapping concept |
| Hero admin | `/admin/hero` | `src/app/admin/hero/page.tsx` | ❌ localStorage-only, not read by live Hero |
| Reviews admin | `/admin/reviews` | `src/app/admin/reviews/page.tsx` | ❌ localStorage-only, not read by live Reviews |
| Enquiry Config admin | `/admin/enquiry-config` | `src/app/admin/enquiry-config/page.tsx` | ❌ localStorage-only |
| Admin shell/nav | global | `src/components/admin/AdminShell.tsx` | ✅ UI shell, no auth gate |
| Admin UI kit | — | `src/components/admin/ui/*` (DataTable, Drawer, Field, ConfirmModal, StatusToggle, Pagination, ImageUpload, Toast, Breadcrumb, TagInput) | ✅ Reusable, well-factored |

**Note on `/admin/itineraries` vs `/admin/packages`:** these are two more overlapping concepts
beyond the Package/Campaign split already flagged in `GAP_ANALYSIS.md`. `AdminItinerary` (in
`src/types/admin.ts`) has its own day-by-day model (`ItineraryDayDetail[]`) distinct from both
the markdown-based `ItineraryContent`/`ItineraryDay` (`itineraryService.ts`) and the
`AdminPackage` model. Before adding any new itinerary-related feature, read all three types and
decide which one (if any) is canonical — do not add a fourth.

### Cross-Cutting
| Module | Key files | Status |
|---|---|---|
| Auth | `AuthContext.tsx`, `authService.ts`, `src/components/auth/*` | ❌ Mocked, see `AUTHENTICATION.md` |
| Email | `src/app/api/send-enquiry/route.ts` | ✅ Real |
| Validation | `src/lib/validation/*.ts` (only `destination.ts` exists) | ⚠️ One entity covered |
| SEO | `generateMetadata`/`generateStaticParams` on public pages | ⚠️ Partial, no sitemap/robots |

## Current Status
See per-module table above. Overall: public-facing content browsing is solid; admin content
management is a patchwork of three different persistence strategies (Prisma, markdown files,
localStorage) applied inconsistently across near-identical concepts (Package/Campaign/
Itinerary); the CRM described in the PDF does not exist yet.

## Best Practices
When touching any "itinerary/package/campaign"-adjacent code, read this table first and confirm
which of the three systems you're actually in before editing.

## Recommendations
Consolidate `AdminPackage`, `AdminItinerary`, and `ItineraryContent`/`ItineraryFrontmatter` into
one `Campaign` concept per the PDF, backed by Prisma, before adding more surface area to any of
the three. See `docs/GAP_ANALYSIS.md` recommendation 4 and `docs/TASK_BREAKDOWN.md`.

## Future Improvements
Once consolidated, wire the admin-editable Hero and Reviews records into the actual public
components (`Hero.tsx`, `ReviewsSection.tsx`) so editing them in `/admin` has a visible effect —
currently a silent no-op from the end-user's perspective.
