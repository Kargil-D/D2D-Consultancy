# Reusable Components

## Purpose
Catalog existing reusable components so new work reuses them instead of duplicating.

## Scope
`src/components/common/*` and `src/components/admin/ui/*` — the two intentional shared-primitive
folders in the codebase.

## Architecture / Inventory

### Public site primitives — `src/components/common/`
| Component | Purpose |
|---|---|
| `Button` | Styled button with variants |
| `Logo` | Brand logo, light/dark tone + size variants |
| `SectionHeading` | Consistent section titles |

### Feature components (public site)
| Component | Location | Purpose |
|---|---|---|
| `StepperTabs` | `planner/` | Multi-step wizard navigation |
| `DestinationSearch` | `search/` | Autocomplete search bar |
| `TravellerSelector` / `TravellerCountSelector` / `FamilyTravellerSelector` | `travellers/` | Plan-trip step 1 |
| `DurationSelector` | `duration/` | Plan-trip step 2 |
| `DepartureCitySelector` | `departure/` | Plan-trip step 3 |
| `LanguageSelector` | `language/` | Plan-trip step 4 |
| `DepartureDatePicker` | `calendar/` | Plan-trip step 5 |
| `CustomerDetailsForm` | `customer/` | Plan-trip step 6 |
| `DestinationPackageCard` / `DestinationPackagesGrid` | `packages/` | Package card grid |
| `HotelCard` | `itinerary/` | Hotel info display |
| `ItineraryAccordion` / `ItineraryView` | `itinerary/` | Day-wise expandable content |
| `RecentItinerariesRail` / `RecentItinerariesSection` | `recent/` | Homepage recent-trips rail |
| `ReviewsSection` | `reviews/` | Customer reviews wall |
| `TrustBadgesSection` | `trust/` | Social-proof badges |
| `Navbar`, `DestinationsMegaMenu`, `PackagesMegaMenu` | `navbar/` | Header + mega-menus |
| `Footer` | `footer/` | Site footer |

### Admin UI kit — `src/components/admin/ui/`
| Component | Purpose |
|---|---|
| `DataTable` | Generic typed table w/ search, columns, loading state |
| `Pagination` | Page controls, paired with `Paginated<T>` |
| `Drawer` | Slide-over panel for create/edit forms |
| `Field` | Labeled form field wrapper (+ `inputCls`/`textareaCls`/`selectCls` shared class strings) |
| `ConfirmModal` | Destructive-action confirmation |
| `StatusToggle` / `StatusBadge` | Active/Inactive toggle + badge |
| `ImageUpload` | File → data-URL uploader (mocked storage, see `CURRENT_IMPLEMENTATION.md`) |
| `TagInput` | Multi-value chip input |
| `Toast` / `ToastProvider` / `useToast` | Notification system, wraps every admin page via `AdminShell` |
| `Breadcrumb` | Page breadcrumb trail |

`AdminShell` composes all admin pages with sidebar/header + `ToastProvider` — every new admin
page should be wrapped in `<AdminShell title="...">`.

### Auth components — `src/components/auth/`
`LoginModal`, `ModalWrapper`, `LoginForm`, `InputField`, `PasswordField`,
`SocialLoginButtons`, `AnimatedBackground` — real UI, backed by the mocked `authService.ts`
(see `docs/AUTHENTICATION.md`). Reuse these when building the real login flow; don't rebuild.

## Current Status
The admin UI kit is well-factored and is exactly what makes the Destinations module's admin page
concise. The public-site components are similarly well-factored per feature folder.

## Best Practices
Before writing a new form field, table, modal, or toast, check the tables above — the admin UI
kit in particular covers nearly every CRUD UI need already.

## Recommendations
When building the next Prisma-backed admin module (per `docs/GAP_ANALYSIS.md`), copy
`src/app/admin/destinations/page.tsx` as the starting structure — it already demonstrates
correct usage of every component in the admin UI kit.

## Future Improvements
If a `Campaign` admin page is built to replace the two disconnected Package systems, extract the
tab-based form pattern from `PackageForm.tsx` (Basic Info/Itinerary/Hotels/Activities/
Transfers/Pricing/Inclusions/Terms) into a reusable tabbed-form shell, since the PDF implies this
same tab structure for the Campaign editor.
