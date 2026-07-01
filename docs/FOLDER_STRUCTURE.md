# Folder Structure

## Purpose
Document the actual folder layout so new files land in the right place by convention, not
guesswork.

## Scope
`src/`, `prisma/`, `content/`, `public/`, root config files.

## Architecture

```
D2D_Website-main/
├── CLAUDE.md                     # AI development rules (this session's addition)
├── PROJECT_CONTEXT.md            # Pre-existing AI knowledge base (partially stale)
├── README.md                     # Unedited create-next-app boilerplate — needs real content
├── docs/                         # This documentation set + pre-existing ARCHITECTURE.md
│   └── ARCHITECTURE.md           # Target-state architecture (not current-state)
├── .github/
│   └── copilot-instructions.md   # Distilled AI coding rules for GitHub Copilot
├── content/
│   └── itineraries/*.md          # 19 markdown files, YAML frontmatter + body (see DATABASE_DESIGN.md)
├── prisma/
│   ├── schema.prisma             # 1 model: Destination
│   └── migrations/20260606_init_destinations/
├── public/                       # Static assets
└── src/
    ├── app/                      # Next.js App Router
    │   ├── page.tsx              # Home
    │   ├── layout.tsx            # Root layout
    │   ├── destinations/[slug]/  # Public destination page (SSG)
    │   ├── packages/[slug]/      # Public package/campaign page
    │   ├── itinerary/[id]/       # Public itinerary detail
    │   ├── plan-trip/            # Enquiry wizard
    │   ├── register/             # Registration (mocked)
    │   ├── admin/                # Admin panel — NO auth guard at any level
    │   │   ├── page.tsx          # Dashboard
    │   │   ├── destinations/     # ✅ Real CRUD
    │   │   ├── packages/         # Markdown-backed campaign editor
    │   │   ├── packages-master/  # ❌ localStorage-only, separate concept
    │   │   ├── itineraries/      # ❌ localStorage-only, yet another separate concept
    │   │   ├── hero/             # ❌ localStorage-only
    │   │   ├── reviews/          # ❌ localStorage-only
    │   │   └── enquiry-config/   # ❌ localStorage-only
    │   └── api/
    │       ├── send-enquiry/     # ✅ Real (Nodemailer)
    │       ├── destinations/menu/# ✅ Real (public)
    │       └── admin/destinations/ # ✅ Real (Prisma), 3 route files
    ├── components/                # Feature-grouped, PascalCase filenames
    │   ├── admin/                 # AdminShell + admin/ui/* primitives
    │   ├── auth/                  # Login/Register UI (backend mocked)
    │   ├── calendar/, common/, customer/, departure/, duration/,
    │   │   footer/, hero/, itinerary/, language/, navbar/, packages/,
    │   │   planner/, recent/, reviews/, search/, travellers/, trust/
    ├── contexts/
    │   └── AuthContext.tsx        # Client-only mocked session
    ├── data/                      # Static typed content (destinations, cities, planner opts, nav)
    ├── generated/prisma/          # Prisma client output (gitignored, run `prisma generate`)
    ├── lib/
    │   ├── prisma.ts              # Singleton PrismaClient (PrismaPg adapter)
    │   ├── adminApi.ts            # Client API layer — real fetch for destinations, localStorage mocks for the rest
    │   └── validation/            # Zod schemas — only destination.ts exists
    ├── services/                  # Server-only business logic
    │   ├── destinationService.ts  # ✅ Real Prisma queries
    │   ├── itineraryService.ts    # ✅ Real fs + gray-matter
    │   ├── enquiryService.ts, googleFormService.ts # ✅ Real
    │   └── authService.ts         # ❌ Mocked
    ├── types/                     # Shared TS types (index, enquiry, auth, admin)
    └── utils/                     # Pure helpers (format.ts, slug.ts)
```

## Current Status
Structure matches `docs/ARCHITECTURE.md`'s target layout closely (a good sign the aspirational
doc's folder plan was already being followed) with a few deltas: no `hooks/`, `store/`, or
`styles/` top-level folders exist yet (styling lives in `app/globals.css`, referenced implicitly);
no `tests/` folder; no route groups like `(marketing)`/`(admin)`/`(quote)` — all routes are flat
under `src/app/`.

## Best Practices
- New page → `src/app/<route>/page.tsx`. Default to Server Component.
- New reusable UI → `src/components/<feature>/<ComponentName>.tsx` (PascalCase file, default
  export, `<ComponentName>Props` interface colocated).
- New server-only business logic → `src/services/<name>Service.ts`.
- New static lookup data → `src/data/<name>.ts` (typed export).
- New shared type → `src/types/<domain>.ts`.
- New Zod schema → `src/lib/validation/<entity>.ts`.

## Recommendations
- Introduce route groups (`(marketing)`, `(admin)`) once an admin auth layout is added, so the
  layout boundary is structural, not just a shared `<AdminShell>` component each page opts into.
- Add a `tests/` folder (see `docs/TESTING_STRATEGY.md`) once a framework is chosen.

## Future Improvements
Add `src/hooks/` and `src/store/` if/when client state grows beyond what Context can reasonably
hold (`docs/ARCHITECTURE.md` anticipates Zustand for admin filters — not needed yet at current
scale).
