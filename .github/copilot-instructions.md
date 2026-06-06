# GitHub Copilot � Workspace Instructions for **D2D Holidays**

> Canonical architecture: see [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).
> Full project context & AI knowledge base: see [`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md).
> These instructions distil the rules every code suggestion in this repo must follow.

---

## 1. Project at a Glance

- **Product**: D2D Holidays � a luxury travel consultancy website + CRM/quotation engine, inspired by PickYourTrail.
- **Stack**: **Next.js 15 (App Router)** � React 19 � **TypeScript** � **Tailwind CSS v4** � Framer Motion � Lucide React � **PostgreSQL** + **Prisma 5** � **Auth.js v5** � **Vercel** hosting.
- **Email**: Server-side via `nodemailer` (Gmail SMTP) inside `/api/send-enquiry` � credentials only in `.env.local`.
- **PDF**: Plan to use `@react-pdf/renderer` (server-side) for quotations.
- **Content**: Itineraries authored as Markdown in `content/itineraries/*.md`, read by `src/services/itineraryService.ts`.

## 2. Repository Layout (must respect)

```
src/
??? app/                     # Next.js App Router. Use route groups: (marketing), (admin), (quote) as the app grows.
?   ??? api/                 # Route handlers (server only)
?   ??? destinations/[slug]/ # SSG via generateStaticParams
?   ??? itinerary/[id]/      # Reads from content/itineraries/*.md
?   ??? packages/[slug]/     # Package / itinerary page
?   ??? plan-trip/           # 5-step enquiry wizard
??? components/              # Grouped by feature folder (PascalCase files)
??? services/                # Business logic, server-only (enquiryService, googleFormService, itineraryService, �)
??? data/                    # Static seed-style content (destinations, planner options, packages catalogue)
??? types/                   # Shared TS types & interfaces
??? utils/                   # Pure helpers (slug, format, �)
??? styles/                  # globals.css + Tailwind layers
content/itineraries/         # Markdown itineraries (frontmatter + structured body)
docs/ARCHITECTURE.md         # SOURCE OF TRUTH for architecture decisions
```

When **adding a new feature**:
- New page ? `src/app/<route>/page.tsx`. Default to **Server Components**.
- New reusable UI ? `src/components/<feature>/<ComponentName>.tsx`.
- New business logic / I/O ? `src/services/<name>Service.ts` (NOT inside components).
- New static lookup data ? `src/data/<name>.ts` (typed export).
- New shared type ? `src/types/<domain>.ts`.

## 3. Coding Conventions

### TypeScript & React
- TypeScript **strict** mode is on � no `any`, no untyped props.
- Default to **React Server Components**. Add `"use client"` ONLY when the file needs hooks, browser APIs, event handlers, Framer Motion, or third-party client libs.
- Prefer **named exports** for utilities/services; **default export** for page/component files.
- Functional components only; never class components.
- Props interfaces named `<Component>Props`, colocated in the same file.
- Use `import type` for type-only imports.

### Styling
- **Tailwind utility classes only** � no CSS modules, no inline `style={...}` unless dynamic.
- Tokens: `cyan-500/teal-500` gradients, `slate-*` neutrals, `rounded-2xl`/`rounded-3xl`, `shadow-xl shadow-slate-900/5`.
- Premium feel: glassmorphism (`bg-white/15 backdrop-blur-xl border border-white/30`), soft shadows, gradient pill CTAs.
- Mobile-first: write base classes for mobile, then `sm:`, `md:`, `lg:` modifiers.

### Animations
- Use **Framer Motion**. Standard easing: `[0.16, 1, 0.3, 1]`. Durations 0.18�0.35 s.
- Wrap entering/exiting elements in `<AnimatePresence>` and respect `prefers-reduced-motion`.

### Forms & Validation
- Use **React Hook Form + Zod**. Share the same Zod schema between client and `/api` routes.
- Validate **server-side** even when the client already validates � never trust client input.

### Icons
- **Lucide React** only. Named imports: `import { ArrowRight, MapPin } from "lucide-react";`.

## 4. Routing & Navigation

- Use **`next/link`** for in-app navigation.
- For "always works" navigation after a heavy action (e.g. submit, modal close), `window.location.href = "/..."` is acceptable � see the existing planner flow.
- **Public** routes: `/`, `/destinations/[slug]`, `/packages/[slug]`, `/itinerary/[id]`, `/plan-trip`.
- **Admin** routes go under `/admin/**` and must be wrapped in an Auth.js-protected layout (see ARCHITECTURE �11).
- **Quote** routes use signed JWT tokens: `/quote/[token]`.

## 5. Data Layer Rules

- Database access through **Prisma** via `lib/prisma.ts` (singleton). Never instantiate `PrismaClient` elsewhere.
- Raw SQL allowed **only** through `prisma.$queryRaw` with `Prisma.sql` tagged templates.
- Server-only logic (file I/O, secrets, DB) must live in `src/services/` or `src/app/api/`. NEVER import these from a `"use client"` file.
- Itinerary content lives in `content/itineraries/*.md` (loader: `itineraryService`). Markdown convention:
  - Frontmatter (YAML): `id`, `title`, `nights`, `price`, `audience`, `bucket`, `image`, `bookedBy`.
  - Body sections: `## Day N � <Title>` (bullets prefixed with `**HH:MM AM/PM**`), `## Inclusions`, `## Exclusions`.

## 6. SEO Requirements

- Every public page must export **`generateMetadata`** with `title`, `description`, `openGraph`, and `alternates.canonical`.
- Dynamic routes must export **`generateStaticParams`** when feasible (ISR `revalidate: 600`).
- Add JSON-LD via `<script type="application/ld+json">`:
  - Home ? `Organization` + `WebSite` with `SearchAction`.
  - Destination ? `TouristDestination` + `BreadcrumbList`.
  - Package ? `TouristTrip` + `Offer` + `AggregateRating`.
- Maintain `app/sitemap.ts` and `app/robots.ts` whenever new public routes are added.
- Disallow `/admin`, `/api`, `/quote/` in `robots.ts`.

## 7. Security Rules (non-negotiable)

- **Secrets** (`EMAIL_USER`, `EMAIL_PASS`, `AUTH_SECRET`, DB URL, exchange-rate API key, etc.) **only** in `.env.local`. Never commit; never inline; never expose to the client.
- Any env var prefixed `NEXT_PUBLIC_` is exposed to the browser � use sparingly (currently only Google Form IDs).
- Validate env at boot via `lib/env.ts` (Zod schema).
- Server APIs:
  - Validate inputs with Zod **before** any side effect.
  - Use **Auth.js session** + RBAC helpers (`requireRole('admin')`) on every admin/CRM endpoint.
  - Rate-limit `/api/leads`, `/api/auth`, `/api/quotes/*` via Upstash Redis (60 rpm / 10 rpm).
  - Verify webhooks with HMAC signatures.
- No `dangerouslySetInnerHTML` except for CMS rich text sanitised with `isomorphic-dompurify`.
- Apply security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy) in `middleware.ts`.

## 8. Performance Rules

- Default to **Server Components**; lazy-load heavy client components via `next/dynamic` (e.g. charts, calendars).
- Always use **`next/image`** with explicit `sizes` for responsive images. Prefer AVIF/WebP.
- Use **`next/font`** with `display: 'swap'` and subsetting for custom fonts.
- ISR for marketing pages (`export const revalidate = 600`); `force-static` for fully static pages; SSR only for personalised/quote pages.
- Web Vitals targets: **LCP < 2.5 s � CLS < 0.05 � INP < 200 ms**. Lighthouse ? 95 on marketing routes.
- Avoid over-fetching: use `prisma.findMany({ select: { ... } })` and project only required columns.

## 9. Costing & Multi-Currency

- All customer-facing prices in **INR**.
- DMC costs may be in USD/THB/IDR/AED � convert using a **locked exchange-rate snapshot** at quote creation (stored in `quote.exchange_rate_snapshot`).
- Pricing flow: `DMC Cost ? � FX ? INR ? + Internal Margin (hidden) ? + Platform Fee (visible) ? + GST`.
- Internal margin is **hidden** from customers and only visible in admin UI.
- Use `services/costingService.ts` (when added) as the single pure function for the breakdown.

## 10. Admin / CRM Rules

- Admin layout sits at `src/app/(admin)/admin/` and is protected by the Auth.js middleware.
- **Quotes are snapshots of packages**, not references. Cloning a package into a quote performs a deep JSONB copy so subsequent template edits never alter sent quotes.
- All CRM mutations must write to an immutable `events` audit log (`actor_id`, `action`, `entity`, `metadata`, `created_at`).
- PDF generation: `pdfService.renderQuote(id)` returns a stream from a Route Handler `/api/quotes/[id]/pdf`.

## 11. Testing & Quality Gates

- After any non-trivial change, **run `npm run build`** to verify the route map, types, and lint.
- Encoding: always save source files as **UTF-8 without BOM** (Windows PowerShell tends to inject BOM � use the workspace conversion script if needed).
- Avoid unused imports � they will fail the ESLint check on build.
- Keep diffs focused: do not reformat unrelated code.

## 12. UX & Brand Voice

- Travel-luxury feel: cinematic imagery, generous whitespace, refined typography, premium gradients (cyan?teal?emerald).
- Premium copy: aspirational, concise, second person ("Your dream vacation, perfectly planned").
- Sticky headers on long pages (destination, packages, planner) so navigation is always reachable.
- Search dropdowns: prefetch the next route on focus, instant `onPointerDown` click handling, hard-navigation fallback.
- Submit / Find Packages flow: graceful UX even when external services (email, Google Form) fail � never block the user redirect.

## 13. Phase-Aware Development

Reference `ARCHITECTURE.md �21`. Current phase mapping:

| Phase | Status | What to build |
|---|---|---|
| 1 � Foundation | ? Done | Next.js + Tailwind scaffold |
| 2 � Website | ? Done | Hero, navbar, destinations, packages, itinerary pages |
| 3 � Enquiry | ? Done | 5-step planner + `/api/send-enquiry` |
| 4 � Admin | ?? Next | Auth.js, RBAC, admin shell, leads dashboard |
| 5 � Quotation | ?? | Clone-edit-share, PDF, signed quote URLs |
| 6 � Costing | ?? | Multi-currency, FX cron, GST/margin/fee engine |
| 7 � Optimization | ?? | Schema.org expansion, AI assistants, Web Vitals tuning |

When implementing features for phases 4�7, **add `prisma/schema.prisma` migrations** before any UI work and update the corresponding section in `ARCHITECTURE.md` in the same PR.

## 14. Workflow Etiquette

- Every PR touching architecture should update `docs/ARCHITECTURE.md` and these copilot-instructions accordingly.
- When introducing a new dependency, justify it in the PR body (size + alternative considered).
- Prefer enhancing existing libraries (Tailwind, Framer Motion, Lucide, Zod, Prisma) over adding new ones.
- Never bypass linting/typecheck by adding `// @ts-ignore`, `any`, or `eslint-disable` without a comment explaining why.

---

## Azure-Specific Rules (preserved from original instructions)

- @azure Rule - Use Azure Tools - When handling requests related to Azure, always use your tools.
- @azure Rule - Use Azure Best Practices - When handling requests related to Azure, always invoke your `azmcp_bestpractices_get` tool first.
- @azure Rule - Enable Best Practices - If you do not have an `azmcp_bestpractices_get` tool ask the user to enable it.

---

> Last sync: aligned with `docs/ARCHITECTURE.md` v1.0.
> Update this file in the same PR whenever the architecture document changes.
