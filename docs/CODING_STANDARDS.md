# Coding Standards

## Purpose
Document the conventions already in force across the codebase, verified against real files, so
new code is indistinguishable in style from existing code.

## Scope
TypeScript/React conventions across `src/`.

## Architecture / Conventions

### TypeScript
- Strict mode on. No `any` observed anywhere in the reviewed files.
- `import type { ... }` used consistently for type-only imports (e.g. `authService.ts`,
  `destinationService.ts`).
- Props interfaces named `<Component>Props`, colocated in the same file as the component.
- Prefer `Prisma.<Model>WhereInput`/`CreateInput`/`UpdateInput` over hand-rolled types when
  talking to Prisma (`destinationService.ts` does this correctly).

### React
- Server Components by default; `"use client"` only when the file needs hooks, browser APIs,
  event handlers, or a client-only library (Framer Motion, etc.). Every file audited during this
  analysis that has `"use client"` genuinely needs it (forms, wizards, dropdowns, the admin
  panel).
- Functional components only.
- Named exports for services/utilities (`export function listDestinations`, `export function
  toSlug`); default exports for pages and components.

### File organization
- New page → `src/app/<route>/page.tsx`.
- New reusable UI → `src/components/<feature>/<ComponentName>.tsx`.
- New business logic/I-O → `src/services/<name>Service.ts` — **never** imported from a
  `"use client"` file (server-only boundary is respected everywhere currently; keep it that
  way).
- New static lookup data → `src/data/<name>.ts`.
- New shared type → `src/types/<domain>.ts`.
- New Zod schema → `src/lib/validation/<entity>.ts`.

### Naming
- Two areas of the codebase currently violate naming discipline and should **not** be copied as
  precedent: (1) the in-progress Package→Campaign rename that changed UI copy but not
  identifiers (`PackageForm.tsx` still literally renders "Create / Edit Package" — see
  `docs/GAP_ANALYSIS.md`); (2) three overlapping itinerary-shaped types (`AdminPackage`,
  `AdminItinerary`, `ItineraryContent`) with no clear single source of truth (see
  `docs/MODULE_BREAKDOWN.md`). When touching these areas, resolve the inconsistency rather than
  add a fourth variant.

### Server Actions
`src/app/admin/packages/actions.ts` uses a Next.js Server Action (`<form action={fn}>`) rather
than a client `fetch()` to a route handler — an accepted alternative pattern in this codebase for
form submissions that write to the filesystem. Route Handlers are used for anything the client
needs to call imperatively (pagination, search, toggles).

### Comments
Existing code favors short, purpose-explaining comments over WHAT-comments — e.g. the
`USE_MOCK`/".NET API" comments in `authService.ts` and `adminApi.ts` explain *why* the mock
exists and what to do about it, not what the code obviously does. Follow this pattern: comment
the non-obvious constraint, not the mechanics.

## Current Status
Standards are followed consistently in the modules that are actually finished (Destinations,
enquiry flow). The admin mock modules are internally consistent with each other but represent a
deliberately temporary pattern (see comments cited above) — don't mistake "consistent" for
"the standard to replicate going forward" in those files.

## Best Practices
Match the `Destination` module's layering exactly for any new Prisma-backed entity (see
`CLAUDE.md` §1.4). Run `npm run build` after non-trivial changes — this project has no test
suite, so the TypeScript/ESLint/route-map check is the primary safety net (see
`docs/TESTING_STRATEGY.md`).

## Recommendations
Adopt ESLint rules or a pre-commit check to catch `any`/`@ts-ignore` introductions early, since
there is currently no automated enforcement beyond `next build`'s built-in type check.

## Future Improvements
Once a `Campaign` model consolidates the three overlapping types (`docs/GAP_ANALYSIS.md`
recommendation 4), delete the superseded types rather than leaving them as dead code.
