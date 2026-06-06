# D2D Holidays — Travel CRM & Website Architecture

> **Version**: 1.0
> **Owner**: D2D Holidays Engineering
> **Status**: Foundational architecture (living document)
> **Stack**: Next.js 15 (App Router) · TypeScript · Tailwind CSS · PostgreSQL · Prisma · Auth.js · Vercel

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Folder Structure](#4-folder-structure)
5. [Dashboard / Hero Page](#5-dashboard--hero-page)
6. [Destination Listing Page](#6-destination-listing-page)
7. [Package / Itinerary Page](#7-package--itinerary-page)
8. [Transfer System](#8-transfer-system)
9. [Hotel Management](#9-hotel-management)
10. [Enquiry Flow](#10-enquiry-flow)
11. [Admin Dashboard](#11-admin-dashboard)
12. [Package Management](#12-package-management)
13. [Itinerary Builder](#13-itinerary-builder)
14. [Costing Engine](#14-costing-engine)
15. [SEO Architecture](#15-seo-architecture)
16. [Display Settings](#16-display-settings)
17. [CRM Quotation System](#17-crm-quotation-system)
18. [Database Design](#18-database-design)
19. [Security](#19-security)
20. [Performance Optimization](#20-performance-optimization)
21. [Development Phases](#21-development-phases)
22. [UI Manual Screens](#22-ui-manual-screens)
23. [Final Recommendations](#23-final-recommendations)

---

## 1. Project Overview

### 1.1 Business Vision
D2D Holidays ("Doorstep to Dreamland") is a **luxury travel consultancy** specialising in curated international and domestic itineraries. The platform combines a public-facing **inspiration website** with a private **CRM & quotation engine** so travel consultants can convert organic leads to bookings in minutes — not days.

### 1.2 Product Goals
| Goal | Success Metric |
|---|---|
| Drive qualified enquiries via SEO | 60 % of leads from organic search within 6 months |
| Reduce quote-turnaround time | Median quote generation < 10 minutes |
| Increase quote ? booking conversion | ? 18 % conversion |
| Establish premium brand perception | Lighthouse a11y + perf ? 95 |
| Operate fully from one workspace | One CRM, one CMS, one source of truth |

### 1.3 Travel CRM Workflow
```
  Lead capture (web form / WhatsApp / call)
         ?
         ?
  Assigned to consultant
         ?
         ?
  Discovery call (notes captured in lead record)
         ?
         ?
  Consultant clones a base package
         ?
         ?
  Edits days / hotels / transfers / pricing
         ?
         ?
  Generates a sharable quote link + PDF
         ?
         ?
  Customer accepts ? booking confirmed ? payment link
         ?
         ?
  Post-trip review request + loyalty tag
```

### 1.4 Customer Quotation Workflow
```
  Customer lands on destination page (SEO)
         ?
         ?
  Submits multi-step enquiry
         ?
         ?
  Lead routed to consultant
         ?
         ?
  Receives personalised quote (link + PDF) via email/WhatsApp
         ?
         ?
  Pays advance to confirm
```

### 1.5 SEO Strategy
- **Programmatic SEO** — one URL per destination × theme (`/honeymoon-packages/maldives`).
- **Long-form content** at the city + activity level (`/maldives/water-villa-resorts`).
- **Schema.org** `TouristTrip`, `Hotel`, `Offer`, `BreadcrumbList`, `FAQPage` on every package.
- Static rendering + ISR for inventory pages; SSR for personalised quote pages.

---

## 2. Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| **Frontend** | Next.js 15 (App Router) + React 19 | RSC, partial pre-rendering, file-based routing |
| **Styling** | Tailwind CSS v4 + Framer Motion + Lucide React | Utility-first, fast iteration, premium animations |
| **Backend (API)** | Next.js Route Handlers + tRPC (admin) | Type-safe end-to-end inside one repo |
| **Database** | PostgreSQL 16 (Neon / Supabase / RDS) | Relational, mature, JSONB for flexible content |
| **ORM** | Prisma 5 | Type-safe queries, migrations, introspection |
| **Authentication** | Auth.js (NextAuth v5) with Credentials + Google OAuth | RBAC via JWT claims |
| **State Management** | React Server Components + Zustand (admin) + URL state (filters) | Minimise client state |
| **Form Management** | React Hook Form + Zod | Shared schemas client/server |
| **Validation** | Zod | Single source of truth for shapes |
| **SEO** | Next.js metadata API + JSON-LD + next-sitemap | Native, zero-runtime |
| **Hosting** | Vercel (frontend + serverless API) + Neon (DB) | First-class Next.js support, edge caching |
| **PDF Generation** | `@react-pdf/renderer` (server-side) or Puppeteer on a queue | Component-based PDFs reuse React tree |
| **Email** | Resend (transactional) + Postmark (marketing) | Modern DX, deliverability |
| **File Storage** | Cloudflare R2 / AWS S3 + Cloudflare CDN | Cheap egress for images |
| **Observability** | Vercel Analytics + Sentry + Axiom logs | Full-stack errors and perf |
| **CI/CD** | GitHub Actions + Vercel | Preview deployments per PR |

---

## 3. High-Level Architecture

### 3.1 System Overview
```
?????????????????????????????????????????????????????????????????????
?                          CLIENT (Browser)                          ?
?   ????????????????????  ????????????????????  ??????????????????? ?
?   ? Public Website   ?  ? Quotation Viewer ?  ? Admin Console   ? ?
?   ? (RSC + Static)   ?  ?   (signed URL)   ?  ? (Auth required) ? ?
?   ????????????????????  ????????????????????  ??????????????????? ?
?????????????????????????????????????????????????????????????????????
             ?                     ?                     ?
             ?                     ?                     ?
?????????????????????????????????????????????????????????????????????
?                     NEXT.JS EDGE / SERVERLESS                      ?
?                                                                    ?
?   App Router pages   |  Route Handlers   |  Server Actions         ?
?   Static + ISR + SSR |  REST endpoints   |  Mutations              ?
?????????????????????????????????????????????????????????????????????
             ?                     ?                     ?
             ?                     ?                     ?
?????????????????????????????????????????????????????????????????????
?                          SERVICE LAYER                             ?
?                                                                    ?
?  PackageService  QuoteService  LeadService  CostingService         ?
?  HotelService    TransferSvc   PdfService    SeoService            ?
?  EmailService    AuthService   CurrencyService                     ?
?????????????????????????????????????????????????????????????????????
             ?                     ?                     ?
             ?                     ?                     ?
?????????????????????????????????????????????????????????????????????
?                          PRISMA ORM                                ?
?????????????????????????????????????????????????????????????????????
             ?                     ?                     ?
             ?                     ?                     ?
?????????????????????????????????????????????????????????????????????
?       PostgreSQL (Neon)     ?     R2 / S3 Media     ?   Redis      ?
?       (primary data store)   ?     (images, PDFs)    ?   (cache)    ?
?????????????????????????????????????????????????????????????????????
                     ?
                     ?
?????????????????????????????????????????????????????????????????????
?  EXTERNAL: Resend (mail) | Google Maps | Exchange-rate API | OAuth ?
?????????????????????????????????????????????????????????????????????
```

### 3.2 Request Flow — Public Package Page
```
Browser  ?  Vercel Edge (cache hit?)
                 ? MISS
                 ?
              Next.js RSC renders /packages/[slug]
                 ?
                 ?
              PackageService.getBySlug()
                 ?
                 ?
              Prisma ? PostgreSQL (joined: days, hotels, transfers, seo)
                 ?
                 ?
              HTML streamed back, cached via ISR (revalidate: 600s)
```

### 3.3 Request Flow — Lead Submission
```
Form Submit  ?  Server Action (validate via Zod)
                       ?
                       ?
                LeadService.create()
                       ?
        ???????????????????????????????
        ?              ?              ?
    DB insert     Resend email   CRM webhook
                       ?
                       ?
                Redirect ? /destinations/[slug]
```

---

## 4. Folder Structure

```
travel-consultancy/
??? prisma/
?   ??? schema.prisma
?   ??? migrations/
?   ??? seed.ts
??? public/
?   ??? images/
?   ??? favicon.ico
??? src/
?   ??? app/
?   ?   ??? (marketing)/                   # public site (route group, no URL prefix)
?   ?   ?   ??? page.tsx                   # hero landing
?   ?   ?   ??? destinations/
?   ?   ?   ?   ??? page.tsx               # destination index
?   ?   ?   ?   ??? [slug]/page.tsx        # destination detail + packages
?   ?   ?   ??? packages/[slug]/page.tsx   # package / itinerary
?   ?   ?   ??? about/page.tsx
?   ?   ?   ??? plan-trip/page.tsx         # multi-step enquiry
?   ?   ??? (quote)/
?   ?   ?   ??? quote/[token]/page.tsx     # signed customer quote URL
?   ?   ??? (admin)/admin/
?   ?   ?   ??? layout.tsx                 # protected layout
?   ?   ?   ??? page.tsx                   # dashboard
?   ?   ?   ??? packages/
?   ?   ?   ?   ??? page.tsx
?   ?   ?   ?   ??? [id]/edit/page.tsx
?   ?   ?   ??? leads/[id]/page.tsx
?   ?   ?   ??? quotes/[id]/page.tsx
?   ?   ?   ??? settings/
?   ?   ??? api/
?   ?   ?   ??? auth/[...nextauth]/route.ts
?   ?   ?   ??? leads/route.ts
?   ?   ?   ??? quotes/[id]/pdf/route.ts
?   ?   ?   ??? webhooks/payment/route.ts
?   ?   ?   ??? revalidate/route.ts
?   ?   ?   ??? send-enquiry/route.ts      # already implemented
?   ?   ??? sitemap.ts
?   ?   ??? robots.ts
?   ?   ??? opengraph-image.tsx
?   ??? components/
?   ?   ??? common/             # buttons, Logo, SectionHeading
?   ?   ??? hero/
?   ?   ??? search/             # DestinationSearch
?   ?   ??? planner/            # StepperTabs
?   ?   ??? travellers/
?   ?   ??? duration/
?   ?   ??? departure/
?   ?   ??? calendar/
?   ?   ??? customer/
?   ?   ??? itinerary/          # ItineraryView (existing)
?   ?   ??? packages/           # PackageCard
?   ?   ??? reviews/
?   ?   ??? footer/
?   ?   ??? admin/              # admin-only UI primitives
?   ??? services/               # business logic (server-only)
?   ?   ??? packageService.ts
?   ?   ??? quoteService.ts
?   ?   ??? leadService.ts
?   ?   ??? costingService.ts
?   ?   ??? pdfService.ts
?   ?   ??? seoService.ts
?   ?   ??? currencyService.ts
?   ?   ??? enquiryService.ts   # existing
?   ?   ??? googleFormService.ts
?   ??? lib/
?   ?   ??? prisma.ts
?   ?   ??? auth.ts             # Auth.js config
?   ?   ??? rbac.ts
?   ?   ??? env.ts              # zod-validated env
?   ?   ??? slug.ts
?   ?   ??? http.ts
?   ??? hooks/
?   ?   ??? usePlanner.ts
?   ?   ??? useDebounce.ts
?   ?   ??? useSafeNavigate.ts
?   ??? store/
?   ?   ??? plannerStore.ts     # zustand (client only)
?   ?   ??? adminFiltersStore.ts
?   ??? data/                   # seed-style static content
?   ?   ??? destinations.ts
?   ?   ??? destinationPackages.ts
?   ?   ??? cities.ts
?   ?   ??? planner.ts
?   ?   ??? navigation.ts
?   ??? types/
?   ?   ??? index.ts
?   ?   ??? enquiry.ts
?   ??? utils/
?   ?   ??? format.ts
?   ?   ??? slug.ts
?   ??? styles/
?       ??? globals.css
??? tests/
?   ??? unit/
?   ??? e2e/                    # Playwright
??? next.config.ts
??? tailwind.config.ts
??? tsconfig.json
??? package.json
```

---

# USER SIDE MODULES

## 5. Dashboard / Hero Page

### 5.1 Header Menu
| Item | Behaviour |
|---|---|
| **Logo** | Returns to `/` |
| **Destinations** | Mega-menu showing top continents/countries |
| **Packages** | Trending themes (Honeymoon, Family, Luxury) |
| **About Us** | Brand story, team, awards |
| **Login** | Triggers Auth.js modal (Google + Email magic link) |

### 5.2 Hero Components
| Component | Purpose |
|---|---|
| Cinematic background image (compressed AVIF/WebP) | Brand mood |
| Animated headline + slogan | Doorstep to Dreamland |
| `DestinationSearch` with autocomplete | Primary CTA |
| Trust ribbon (logos / 25k+ travellers / 4.9?) | Social proof |

### 5.3 Below the Hero
1. **Ads / Campaign strip** — gradient cards for seasonal offers
2. **Trending packages carousel** — horizontally scrollable, snap points
3. **Recently visited** — read from `localStorage`, falls back to popular
4. **Reviews wall** — masonry layout, schema.org `Review`
5. **Why D2D** — 4 USPs (experts, fully customised, 24×7, best price)
6. **Newsletter footer** — Resend list opt-in

### 5.4 UX Expectations
- **First Contentful Paint** < 1.2 s on 4G
- Above-the-fold zero CLS
- Search opens dropdown instantly (prefetch `/plan-trip` on focus)
- All sections lazy-hydrate via `dynamic(() => …, { ssr: true })`

### 5.5 SEO Expectations
- `<title>D2D Holidays · Doorstep to Dreamland</title>`
- `og:image` rendered via `app/opengraph-image.tsx`
- `Organization` + `WebSite` JSON-LD with `SearchAction`
- Canonical = `https://d2dholidays.com/`

---

## 6. Destination Listing Page

URL: `/destinations` (index) and `/destinations/[slug]` (detail).

### 6.1 Filters (left rail on desktop, sheet on mobile)
| Filter | Type |
|---|---|
| Continent | Multi-select chips |
| Trip duration | Slider 3–21 days |
| Budget per person | Range slider |
| Theme | Honeymoon / Family / Adventure / Luxury / Spiritual |
| Best time to visit | Months |
| Visa-on-arrival | Toggle |

URL state via `?duration=5-7&theme=honeymoon` (shareable, SEO-indexable).

### 6.2 Destination Banner
- Hero image, country chip, tagline
- Sticky CTA "Plan my trip" ? `/plan-trip?destination=...`

### 6.3 Package Cards
Each card uses the `PackageCard` component:
- Image with hover zoom
- Tag (Best Seller / Honeymoon / Adventure)
- Title, duration, ? rating, highlights, INR price, **View Details**

### 6.4 Dynamic Filtering
- Server: `?theme=honeymoon` ? `PackageService.list({ theme })`
- Client: optimistic UI with `useTransition` for snappy filter changes
- Result set rendered via virtualised grid (`@tanstack/virtual`) at 100+ items

### 6.5 SEO URLs
| Pattern | Example |
|---|---|
| `/destinations/[slug]` | `/destinations/maldives` |
| `/destinations/[slug]/[theme]` | `/destinations/maldives/honeymoon` |
| `/[theme]-packages/[slug]` | `/honeymoon-packages/maldives` |

All three resolve to the same data but provide multiple SEO surfaces with `canonical` pointing to the primary URL.

---

## 7. Package / Itinerary Page

URL: `/packages/[slug]` — used as:
1. **Public catalogue** (anyone)
2. **Personalised quotation** when accessed via signed token (`/quote/[token]`)
3. **Campaign landing** when arrived from paid ads (auto-fills enquiry source)

### 7.1 Layout
```
??????????????????????????????????????????????????????????????????????
? HERO (full-width image · title · duration · price · CTA)            ?
??????????????????????????????????????????????????????????????????????
? Tabs: Itinerary | Hotels | Transfers     ?  Sticky pricing card    ?
?        | Activities | Inclusions         ?  + Download PDF         ?
?                                          ?  + Share link            ?
? Day-wise itinerary (existing component)  ?  + Enquire now           ?
? Hotel cards                              ?                         ?
? Transfer cards                           ?                         ?
? Activity cards                           ?                         ?
? Inclusions / Exclusions                  ?                         ?
? Terms & conditions accordion             ?                         ?
? FAQ accordion                            ?                         ?
??????????????????????????????????????????????????????????????????????
```

### 7.2 Pricing Summary
| Line item | Source |
|---|---|
| Base package per pax | `package.basePrice` |
| × Pax count | from query / quote |
| GST (5 % or 18 %) | `costingService.computeGst()` |
| Planning Platform Fee | `package.platformFee` (customer-visible) |
| **Total** | sum |

Hidden from customer: internal margin (used only in CRM).

### 7.3 PDF Generation
Triggered by `GET /api/quotes/[id]/pdf`:
1. Server fetches quote + package tree
2. Renders `<QuotePdfDocument>` via `@react-pdf/renderer`
3. Streams `application/pdf` with `Content-Disposition: attachment`

### 7.4 Share Link
- `POST /api/quotes/[id]/share` ? returns signed URL `https://d2dholidays.com/quote/<token>`
- Token is `JWT` (24-hour expiry) ? no auth required for guest viewing

---

## 8. Transfer System

### 8.1 Supported Types
| Code | Label | Icon (lucide) |
|---|---|---|
| `speedboat` | Speedboat | `Sailboat` |
| `seaplane` | Seaplane | `PlaneTakeoff` |
| `domestic_flight` | Domestic Flight | `Plane` |
| `cab` | Private Cab | `Car` |
| `sic` | SIC Transfer | `Bus` |
| `ferry` | Ferry | `Ship` |
| `bus` | Bus | `Bus` |
| `internal_flight` | Internal Flight | `Plane` |

### 8.2 Backend Schema
```sql
CREATE TABLE package_transfers (
  id            UUID PRIMARY KEY,
  package_id    UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  day_number    INT NOT NULL,
  type          transfer_type NOT NULL,
  from_location TEXT NOT NULL,
  to_location   TEXT NOT NULL,
  duration_min  INT,
  is_included   BOOLEAN DEFAULT true,
  cost_usd      NUMERIC(10,2),
  notes         TEXT
);
```

### 8.3 UI Rendering
- Component: `<TransferCard type="seaplane" />` reads from a registry that maps `type ? { icon, label, color }`.
- Dynamic icons fetched once at module load, no runtime branching beyond a lookup.
- On the customer page they appear inline in each day; in admin they're managed under a dedicated **Transfers** tab.

---

## 9. Hotel Management

### 9.1 Features
| Feature | Implementation |
|---|---|
| Multiple hotel options per stay | `package_hotels` rows with `priority_order` |
| Google Maps link | `map_url TEXT` (deep link) |
| Meal plans | enum: `BB`, `HB`, `FB`, `AI` |
| Priority order | `INT 0–100`, lower = shown first |
| "Subject to availability" | `is_subject_to_availability BOOLEAN` |
| Star rating | `INT 1..5` |
| Hotel images | `text[]` URLs in R2 |

### 9.2 Meal Plan Legend
| Code | Description |
|---|---|
| **BB** | Bed & Breakfast |
| **HB** | Half Board (Breakfast + Dinner) |
| **FB** | Full Board (3 meals) |
| **AI** | All Inclusive (meals + select beverages) |

### 9.3 Schema
```sql
CREATE TABLE package_hotels (
  id              UUID PRIMARY KEY,
  package_id      UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  city            TEXT NOT NULL,
  name            TEXT NOT NULL,
  star_rating     INT CHECK (star_rating BETWEEN 1 AND 5),
  meal_plan       meal_plan_enum NOT NULL,
  nights          INT NOT NULL,
  priority_order  INT DEFAULT 0,
  is_subject_to_availability BOOLEAN DEFAULT false,
  map_url         TEXT,
  images          TEXT[]
);
```

### 9.4 Rendering Logic
- Group hotels by `(package_id, city)` and sort by `priority_order`.
- Within a city, the first hotel is "default", subsequent are "alternative options".
- If `is_subject_to_availability`, append a small grey pill on the card.

---

## 10. Enquiry Flow

A 5-step PickYourTrail-style wizard at `/plan-trip` (already implemented).

### 10.1 Steps
1. **Travellers** — Couple / Family / Friends / Solo + dynamic count picker
2. **Duration** — 3 / 5 / 7 / 10 / 14 / Custom
3. **Departure City** — searchable Indian-city dropdown
4. **Travel Date** — future-only calendar
5. **Your Details** — name / email / phone

### 10.2 UX Flow
| Behaviour | Implementation |
|---|---|
| Per-step validation | `useMemo` over Zod schema |
| Smooth transitions | `<AnimatePresence mode="wait">` |
| Stepper jumps back freely | Click on completed steps |
| Persist on refresh | `localStorage` mirror of `PlannerState` |
| Mobile swipe support | `framer-motion`'s `drag="x"` on the wizard card |

### 10.3 CRM Integration
On final submit (`POST /api/leads`):
```
1. Validate (Zod, server-side)
2. Insert into leads table
3. Compute round-robin consultant assignment
4. Resend ? transactional email to consultant
5. Resend ? confirmation email to customer
6. (Optional) Push to Google Form for backup archival
7. Redirect to /destinations/<slug>
```

### 10.4 Validation Rules
| Field | Rule |
|---|---|
| `customerEmail` | Zod `.email()` |
| `customerPhone` | E.164 regex |
| `travellerCount` | `? rule.min && ? rule.max` per type |
| `departureDate` | `>= today` |

---

# ADMIN SIDE MODULES

## 11. Admin Dashboard

Path: `/admin` (Auth.js-protected layout).

### 11.1 KPI Cards
| Card | Source |
|---|---|
| Revenue (MTD) | `SUM(bookings.total_inr) WHERE month` |
| New leads (7d) | `COUNT(leads) WHERE created_at >= now() - 7d` |
| Bookings confirmed | `COUNT(bookings.status = 'confirmed')` |
| Pending quotations | `COUNT(quotes.status = 'sent' AND expires_at > now())` |
| Conversion rate | `bookings / leads` |

### 11.2 Sections
- **Funnel chart** — leads ? quotes ? bookings (Recharts)
- **Top destinations** — bar chart sorted by enquiries
- **Consultant leaderboard** — bookings per consultant this month
- **Recent activity feed** — last 20 events (lead created, quote sent, booking paid)

---

## 12. Package Management

Path: `/admin/packages/[id]/edit` — tabbed editor.

| Tab | Fields |
|---|---|
| **Basic Info** | Title, slug, destination, theme, duration, summary, hero image |
| **Itinerary** | Day-by-day builder (see §13) |
| **Hotels** | Add/edit `package_hotels` |
| **Transfers** | Add/edit `package_transfers` |
| **Activities** | Add/edit `package_activities` |
| **Pricing** | DMC cost, currency, margin %, platform fee, GST % |
| **SEO** | Title, description, OG image, keywords, canonical |
| **Display Settings** | D2D tag, landing-page mapping, priority order, published |
| **Publish** | Toggle live / preview, schedule, save & exit |

Tabs share local state via a React Context Provider; saves are autosaved every 5 s with optimistic UI.

---

## 13. Itinerary Builder

A drag-and-drop builder using `@dnd-kit/sortable`.

### 13.1 Capabilities
| Action | Behaviour |
|---|---|
| Add day | Inserts at end with default title "Day N — Activity" |
| Reorder days | Drag handle on each card; persisted via `arrayMove` + `PATCH /api/packages/:id/days` |
| Add activity | Inline form with time + description |
| Add transfer | Modal with type dropdown (§8.1) |
| Link hotel option | Multi-select from hotels in the same city |
| Meal plan | Per-day toggle: Breakfast / Lunch / Dinner |

### 13.2 Storage
- One `package_days` row per day
- Activities stored as `JSONB` array for flexibility (or `package_activities` if querying)

---

## 14. Costing Engine

A pure (testable) service that turns DMC cost into customer-visible total.

### 14.1 Supported Currencies
INR · USD · THB · IDR · AED (extendable).

### 14.2 Workflow
```
   DMC Cost (foreign currency)
        ?
        ?
   Exchange rate snapshot
   (locked at quote creation)
        ?
        ?
   Subtotal in INR
        ?
        ?
   + Hidden internal margin (% or flat) ? admin-only
        ?
        ?
   = Net package price
        ?
        ?
   + Planning Platform Fee (customer-visible)
        ?
        ?
   = Pre-GST total
        ?
        ?
   + GST (5 % or 18 % per package_type)
        ?
        ?
   = Final price shown to customer
```

### 14.3 Inputs / Outputs (TypeScript)
```ts
interface CostingInput {
  dmcCost: number;
  dmcCurrency: 'USD' | 'INR' | 'THB' | 'IDR' | 'AED';
  exchangeRateInr: number;         // locked at quote time
  internalMarginPct: number;       // e.g. 18
  platformFeeInr: number;          // e.g. 999
  gstPct: number;                  // 5 or 18
  paxCount: number;
}

interface CostingBreakdown {
  baseInrPerPax: number;
  marginInr: number;
  netInrPerPax: number;
  platformFeeInr: number;
  preGstInr: number;
  gstInr: number;
  totalInr: number;
  totalPerPaxInr: number;
}
```

### 14.4 Exchange Rate Locking
- A nightly cron pulls rates from `openexchangerates.org` into `exchange_rates`.
- When a quote is created, the current rate is **copied** into `quote.exchange_rate_snapshot` so subsequent rate changes don't alter pricing.

---

## 15. SEO Architecture

### 15.1 Per-page Metadata (Next.js `generateMetadata`)
```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const seo = await seoService.forPackage(params.slug);
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: seo.canonical },
    openGraph: { images: [seo.ogImage], type: 'website' },
    twitter:   { card: 'summary_large_image', images: [seo.ogImage] },
  };
}
```

### 15.2 Structured Data (JSON-LD)
| Page | Schema |
|---|---|
| Hero | `Organization`, `WebSite` + `SearchAction` |
| Destination | `TouristDestination`, `BreadcrumbList` |
| Package | `TouristTrip`, `Offer`, `AggregateRating`, `FAQPage` |
| Reviews section | `Review` |

### 15.3 Sitemap & Robots
- `app/sitemap.ts` — dynamic, queries packages + destinations + themes
- `app/robots.ts` — disallows `/admin`, `/api`, `/quote/`
- `next-sitemap` optional for splitting > 50k URLs

### 15.4 Performance for SEO
- All marketing pages render statically (ISR `revalidate: 600`)
- Images served as AVIF + WebP via `next/image`
- Critical CSS inlined automatically by Tailwind
- Web Vitals reported to Vercel Analytics

---

## 16. Display Settings

Per-package settings controlling listing rendering.

| Field | Type | Effect |
|---|---|---|
| `d2d_tag` | enum: `bestseller`, `honeymoon`, `family`, `luxury`, `none` | Coloured pill on the card |
| `landing_page_mapping` | text[] | Slugs of landing pages this package should appear on (e.g. `["maldives", "honeymoon-packages/maldives"]`) |
| `priority_order` | `INT 0–5000` | Lower numbers float to the top in listings |
| `is_published` | boolean | Hides from public site, still editable in admin |
| `publish_at` | timestamptz | Scheduled go-live |

Rendering logic for `/destinations/[slug]`:
```sql
SELECT * FROM packages
WHERE :slug = ANY(landing_page_mapping)
  AND is_published = true
  AND (publish_at IS NULL OR publish_at <= now())
ORDER BY priority_order ASC, created_at DESC
LIMIT 24;
```

---

## 17. CRM Quotation System

### 17.1 Workflow
```
   Lead arrives (CRM dashboard)
        ?
        ?
   Consultant opens lead ? reviews preferences
        ?
        ?
   "Create Quote" ? choose a base package ? CLONE
        ?
        ?
   Edit cloned package: days, hotels, transfers, pricing
        ?
        ?
   Save ? generate signed quote URL (/quote/<token>)
        ?
        ?
   Generate PDF (server)
        ?
        ?
   Send to customer (Resend) with link + PDF attachment
        ?
        ?
   Customer accepts ? booking confirmed
```

### 17.2 Reusable Architecture
- **Packages are templates**, never sent directly to customers.
- A **Quote** is a `package_snapshot` — a deep JSONB copy at quote time. Edits on quotes never bleed back to the template.
- This lets the same package power: marketing pages, ads, quotes, and bookings — without coupling.

### 17.3 Quote Link Generation
- `POST /admin/quotes/:id/share` ? server signs `{ quoteId, exp }` as JWT
- URL: `https://d2dholidays.com/quote/<jwt>`
- Page is server-rendered, no auth, but read-only

### 17.4 PDF Quote Flow
1. Admin clicks **Download PDF**
2. `GET /api/quotes/:id/pdf` runs `pdfService.renderQuote(id)`
3. `@react-pdf/renderer` returns a stream
4. Customer email contains both link + PDF attachment

---

## 18. Database Design

### 18.1 Entity Relationship (simplified)
```
users ???
        ??? leads ??? quotes ??? bookings
        ?              ?
packages ????? package_days ?? activities
           ??? package_hotels
           ??? package_transfers
           ??? package_activities
           ??? seo_metadata
currencies ?? exchange_rates
```

### 18.2 Tables (Prisma-flavoured DDL)
```sql
-- ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'consultant', 'customer');
CREATE TYPE meal_plan_enum AS ENUM ('BB','HB','FB','AI');
CREATE TYPE transfer_type AS ENUM (
  'speedboat','seaplane','domestic_flight','cab','sic','ferry','bus','internal_flight'
);
CREATE TYPE quote_status AS ENUM ('draft','sent','accepted','expired','cancelled');
CREATE TYPE lead_status AS ENUM ('new','in_progress','quoted','won','lost');

-- USERS
CREATE TABLE users (
  id           UUID PRIMARY KEY,
  email        TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  role         user_role NOT NULL DEFAULT 'customer',
  password_hash TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- PACKAGES (template)
CREATE TABLE packages (
  id                 UUID PRIMARY KEY,
  slug               TEXT UNIQUE NOT NULL,
  title              TEXT NOT NULL,
  destination_slug   TEXT NOT NULL,
  theme              TEXT,
  duration_days      INT NOT NULL,
  hero_image         TEXT,
  base_price_inr     NUMERIC(12,2) NOT NULL,
  platform_fee_inr   NUMERIC(12,2) DEFAULT 999,
  gst_pct            NUMERIC(4,2)  DEFAULT 5,
  internal_margin_pct NUMERIC(4,2) DEFAULT 18, -- hidden
  d2d_tag            TEXT,
  landing_page_mapping TEXT[],
  priority_order     INT DEFAULT 1000,
  is_published       BOOLEAN DEFAULT false,
  publish_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_packages_published ON packages(is_published, priority_order);
CREATE INDEX idx_packages_landing ON packages USING GIN (landing_page_mapping);

CREATE TABLE package_days (
  id           UUID PRIMARY KEY,
  package_id   UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  day_number   INT NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  meals        TEXT[],          -- e.g. {'breakfast','dinner'}
  activities   JSONB DEFAULT '[]'::jsonb,
  UNIQUE (package_id, day_number)
);

CREATE TABLE package_hotels (
  id              UUID PRIMARY KEY,
  package_id      UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  city            TEXT NOT NULL,
  name            TEXT NOT NULL,
  star_rating     INT,
  meal_plan       meal_plan_enum NOT NULL,
  nights          INT NOT NULL,
  priority_order  INT DEFAULT 0,
  is_subject_to_availability BOOLEAN DEFAULT false,
  map_url         TEXT,
  images          TEXT[]
);

CREATE TABLE package_transfers (
  id            UUID PRIMARY KEY,
  package_id    UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  day_number    INT NOT NULL,
  type          transfer_type NOT NULL,
  from_location TEXT NOT NULL,
  to_location   TEXT NOT NULL,
  duration_min  INT,
  is_included   BOOLEAN DEFAULT true,
  cost_usd      NUMERIC(10,2),
  notes         TEXT
);

CREATE TABLE package_activities (
  id           UUID PRIMARY KEY,
  package_id   UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  day_number   INT,
  title        TEXT NOT NULL,
  description  TEXT,
  is_included  BOOLEAN DEFAULT true,
  cost_usd     NUMERIC(10,2)
);

-- LEADS / QUOTES / BOOKINGS
CREATE TABLE leads (
  id              UUID PRIMARY KEY,
  destination     TEXT NOT NULL,
  traveller_type  TEXT NOT NULL,
  traveller_count INT NOT NULL,
  duration        TEXT NOT NULL,
  departure_city  TEXT NOT NULL,
  departure_date  DATE NOT NULL,
  customer_name   TEXT NOT NULL,
  customer_email  TEXT NOT NULL,
  customer_phone  TEXT NOT NULL,
  status          lead_status DEFAULT 'new',
  assigned_to     UUID REFERENCES users(id),
  source          TEXT,              -- 'web','ads','referral'
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE quotations (
  id                      UUID PRIMARY KEY,
  lead_id                 UUID REFERENCES leads(id),
  template_package_id     UUID REFERENCES packages(id),
  package_snapshot        JSONB NOT NULL,
  exchange_rate_snapshot  JSONB NOT NULL,
  total_inr               NUMERIC(12,2) NOT NULL,
  status                  quote_status DEFAULT 'draft',
  share_token             TEXT UNIQUE,
  expires_at              TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_quotes_status ON quotations(status, expires_at);

CREATE TABLE bookings (
  id            UUID PRIMARY KEY,
  quote_id      UUID NOT NULL REFERENCES quotations(id),
  total_inr     NUMERIC(12,2) NOT NULL,
  paid_inr      NUMERIC(12,2) DEFAULT 0,
  status        TEXT,
  payment_ref   TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- SEO
CREATE TABLE seo_metadata (
  id            UUID PRIMARY KEY,
  entity_type   TEXT,           -- 'package' | 'destination'
  entity_id     UUID,
  title         TEXT,
  description   TEXT,
  keywords      TEXT[],
  og_image      TEXT,
  canonical     TEXT,
  structured    JSONB
);

-- CURRENCIES
CREATE TABLE currencies (
  code       TEXT PRIMARY KEY,    -- 'USD'
  name       TEXT NOT NULL,
  symbol     TEXT
);

CREATE TABLE exchange_rates (
  id         UUID PRIMARY KEY,
  base       TEXT REFERENCES currencies(code),
  target     TEXT REFERENCES currencies(code),
  rate       NUMERIC(14,6) NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX idx_rates_pair ON exchange_rates(base, target, fetched_at);
```

---

## 19. Security

### 19.1 Authentication & Sessions
- **Auth.js v5** with JWT strategy, signed by `AUTH_SECRET` (32-byte random)
- Sessions HTTP-only secure cookies, `SameSite=Lax`
- Magic-link emails via Resend; passwords (admin) hashed with **bcrypt 12 rounds**

### 19.2 Role-Based Access Control
| Role | Capabilities |
|---|---|
| `admin` | Full CRUD, user management, billing |
| `consultant` | CRUD leads & quotes assigned to them, read-only packages |
| `customer` | Read own quotes/bookings, submit enquiries |

Centralised guards: `requireRole('admin')` middleware on `/admin/**` and admin API routes.

### 19.3 SQL Injection
- 100 % Prisma — no raw SQL except whitelisted reporting queries
- `prisma.$queryRaw` only with `Prisma.sql` tagged templates

### 19.4 XSS
- React auto-escapes output
- `dangerouslySetInnerHTML` allowed **only** for sanitised CMS-rich-text via `isomorphic-dompurify`
- `Content-Security-Policy` header via `middleware.ts`

### 19.5 API Security
- All mutating routes require CSRF token (Auth.js built-in) or same-origin check
- Rate limit via Upstash Redis: 60 req/min/IP for `/api/leads`, 10/min for `/api/auth`
- All inputs validated through Zod **server-side**
- Webhooks verified with HMAC signatures
- Quote share links: short-lived JWT (24h) with `quoteId` + `iat`

### 19.6 Other Hardening
- `helmet`-equivalent headers via `middleware.ts`: HSTS, X-Frame-Options, Referrer-Policy
- File uploads scanned with ClamAV (R2 trigger) before serving
- Secrets never logged; environment variables validated with `lib/env.ts` (Zod)

---

## 20. Performance Optimization

| Technique | Where |
|---|---|
| **RSC + Streaming** | Marketing pages stream while data loads |
| **ISR** | Destination + package pages: `revalidate: 600` |
| **SSR + cache headers** | Quote pages: `Cache-Control: private, max-age=0` |
| **Static generation** | Home + landing pages: `force-static` |
| **Lazy loading** | `next/dynamic` for ItineraryView, Calendar, AdminCharts |
| **Image optimisation** | `next/image` with AVIF + WebP + responsive `sizes` |
| **Font optimisation** | `next/font` with `display: 'swap'` + subset |
| **Bundle splitting** | Route-based + `dynamic()` heavy clients |
| **Tree-shaking** | Lucide imports via `lucide-react` named imports |
| **Edge caching** | Vercel edge for static; Cloudflare in front of R2 |
| **DB query** | `prisma.findMany({ select })` to avoid over-fetching |
| **Connection pooling** | Neon serverless pool + PgBouncer |
| **Web Vitals target** | LCP < 2.5 s · CLS < 0.05 · INP < 200 ms |
| **Lighthouse** | All marketing pages ? 95 across all categories |

---

## 21. Development Phases

| Phase | Theme | Deliverables | Priority | Dependencies |
|---|---|---|---|---|
| **1 – Foundation** | Setup | Next.js scaffold, Tailwind, Prisma, Postgres, Auth.js, env validation, CI/CD on Vercel, Sentry | P0 | — |
| **2 – Website** | Public pages | Hero, navbar, footer, destinations index + detail, package page, SEO baseline, sitemap | P0 | Phase 1 |
| **3 – Enquiry** | Lead capture | 5-step planner, validation, lead persistence, Resend transactional emails, redirect flow | P0 | Phase 2 |
| **4 – Admin** | Internal tools | Admin shell, auth guard, leads dashboard, package CRUD, RBAC, audit log | P1 | Phase 1 |
| **5 – Quotation** | CRM | Clone-edit-share workflow, signed quote URLs, PDF generation, customer email | P1 | Phase 4 |
| **6 – Costing** | Pricing engine | Multi-currency model, exchange rate cron, GST/margin/fee, breakdown UI | P1 | Phase 5 |
| **7 – Optimization** | Polish & scale | Image pipeline, Web Vitals tuning, schema.org expansion, AI assistants | P2 | All |

---

## 22. UI Manual Screens

For every screen below: **Purpose** · **Layout** · **Components** · **UX behaviour** · **Responsive behaviour**.

### 22.1 Hero Page (`/`)
- **Purpose** Inspire visitors, capture intent.
- **Layout** Full-bleed cinematic hero ? search ? ads strip ? packages carousel ? reviews ? footer.
- **Components** `Navbar`, `Hero`, `DestinationSearch`, `AdsSection`, `PackagesSection`, `ReviewsSection`, `Footer`.
- **UX** Sticky transparent navbar that frosts on scroll; search prefetches `/plan-trip`; reduced motion supported.
- **Responsive** Single-column < 640 px, 12-col grid ? 1024 px.

### 22.2 Destination Page (`/destinations/[slug]`)
- **Purpose** Convert SEO traffic into enquiries for a specific destination.
- **Layout** Sticky frosted header ? hero ? filters rail ? package grid (3 cols).
- **Components** Sticky header, `DestinationHero`, `FiltersRail`, virtualised `PackageGrid`.
- **UX** Filters update URL; "Back to Home" always visible; infinite scroll for 50+ results.
- **Responsive** Filters become a bottom sheet on mobile.

### 22.3 Itinerary Page (`/packages/[slug]`)
- **Purpose** Convince visitor that this itinerary is perfect.
- **Layout** Hero ? tabs (Itinerary/Hotels/Transfers/Activities/Inclusions) ? sticky pricing card.
- **Components** `ItineraryView` (existing), `HotelCard`, `TransferCard`, `PricingCard`, `TermsAccordion`, `FAQAccordion`.
- **UX** Sticky pricing on desktop; sticky-bottom CTA bar on mobile.
- **Responsive** Pricing card collapses into a sheet < 768 px.

### 22.4 Enquiry Flow (`/plan-trip`)
- **Purpose** Capture qualified lead in < 90 s.
- **Layout** Sticky stepper + central card + live summary panel.
- **Components** `StepperTabs`, `TravellerSelector`, `DurationSelector`, `DepartureCitySelector`, `DepartureDatePicker`, `CustomerDetailsForm`, success modal.
- **UX** Smooth slide-in per step; Next disabled until valid; mobile swipe to advance.
- **Responsive** Stepper becomes horizontal scroll on mobile.

### 22.5 Admin Dashboard (`/admin`)
- **Purpose** At-a-glance health of the business.
- **Layout** Sidebar + top bar + 4 KPI cards + 3 charts + activity feed.
- **Components** `Sidebar`, `KpiCard`, `FunnelChart`, `TopDestinationsChart`, `ConsultantLeaderboard`, `ActivityFeed`.
- **UX** Date range selector top-right; charts skeleton-load.
- **Responsive** Sidebar collapses to icon rail < 1024 px.

### 22.6 Add / Edit Package (`/admin/packages/[id]/edit`)
- **Purpose** One screen to manage everything about a package.
- **Layout** Tab bar (9 tabs) + main content + sticky save bar.
- **Components** Tab navigation, per-tab forms, autosave indicator, "publish" toggle.
- **UX** Unsaved indicator; warn on navigation; Cmd+S to save.
- **Responsive** Tabs become a dropdown on mobile.

### 22.7 Transfer Management
- **Purpose** Maintain transfer rows for a package.
- **Layout** Table inside the Transfers tab; modal to add/edit a row.
- **Components** Type-aware icon, from/to combobox, duration input.
- **UX** Inline edit on hover; bulk delete with confirmation.
- **Responsive** Table ? stacked cards on mobile.

### 22.8 Costing Engine
- **Purpose** Make pricing transparent (internally) and explainable.
- **Layout** Two columns: inputs (DMC cost, FX, margin, fee, GST, pax) and live breakdown.
- **Components** Currency-aware inputs, breakdown table, "Lock exchange rate" button.
- **UX** Every input update recomputes instantly (Web Worker for heavy maths if needed).
- **Responsive** Stacked on mobile.

### 22.9 CRM Quotation
- **Purpose** Generate and track quotes.
- **Layout** Two-column: lead details (left) + quote builder (right).
- **Components** Lead profile card, package selector with "Clone", editable mini-builder, share + PDF buttons.
- **UX** Activity timeline at bottom (status changes, emails sent, viewed-at).
- **Responsive** Stacked panels on mobile.

### 22.10 PDF Quotation Preview
- **Purpose** Faithful preview of the PDF the customer will receive.
- **Layout** Centred A4 letterbox preview, side panel with "Email", "Download", "Regenerate".
- **Components** `<QuotePdfDocument>` rendered via `@react-pdf/renderer` viewer.
- **UX** Disabled while regenerating; toast on email send.
- **Responsive** PDF viewer scrolls horizontally on small screens.

---

## 23. Final Recommendations

### 23.1 UI Inspirations
- **PickYourTrail** — itinerary clarity & quote flow
- **Airbnb** — search dropdown + map integration
- **Booking.com** — filter density without clutter
- **Skift / Tablet Hotels** — premium editorial layouts

### 23.2 Best Practices
- **Single source of truth** for shapes (Zod schemas shared by client + server)
- **Server-first** rendering (RSC) — only hydrate what truly needs interactivity
- **Optimistic UI** on mutations with rollback on error
- **Audit logging** on every CRM action (immutable `events` table)
- **Feature flags** via `vercel/edge-config` for safe rollouts

### 23.3 Future Scalability
- Move heavy admin to a separate Next.js project sharing a Prisma package (monorepo with Turborepo)
- Introduce a job queue (Inngest or BullMQ) for PDF gen, emails, exchange-rate sync
- Add a search service (Algolia or Meilisearch) once package count > 500
- Multi-tenant readiness: prefix schema with `tenant_id` from day one for B2B white-labelling

### 23.4 AI Enhancements
| Use case | Approach |
|---|---|
| **Auto-itinerary drafts** | Prompt LLM with destination + duration + traveller type to produce a starting day-wise plan that the consultant edits |
| **Lead summarisation** | LLM condenses long call notes into structured fields |
| **Smart pricing nudges** | ML on historical quotes ? recommend margin per destination/season |
| **Chat concierge** | RAG over published packages for the public site |
| **Auto-translate quotes** | Translation step in PDF pipeline for international customers |

### 23.5 CRM Enhancements
- WhatsApp Business API integration (Twilio) for two-way messaging within the lead record
- Calendly-style scheduler embedded in quote emails
- Loyalty tier (Silver/Gold/Platinum) auto-applied per lifetime spend
- Post-trip NPS automation + auto-publish reviews after consent
- Consultant performance scorecard with weekly leaderboard email

---

> **End of document.** Treat this as the canonical architecture reference; update via PR with the `architecture` label.
