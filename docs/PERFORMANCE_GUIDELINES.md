# Performance Guidelines

## Purpose
Document current performance-relevant patterns and where they fall short of the PDF's targets.

## Scope
Rendering strategy, image handling, data fetching, bundle considerations.

## Architecture / Current Patterns

- **Server Components by default**, `"use client"` scoped narrowly to interactive leaves
  (forms, menus, the wizard, admin pages) — this is followed consistently and is the single
  biggest lever already pulled correctly.
- **SSG** confirmed on destination/package/itinerary pages via `generateStaticParams` +
  `generateMetadata` (per `PROJECT_CONTEXT.md`, corroborated by file structure).
- **`next/image`** used in admin tables (`Image` import in `admin/destinations/page.tsx`) with
  explicit `sizes`; `next.config.ts` restricts remote image hosts to `images.unsplash.com` and
  `images.pexels.com` — any other host needs `unoptimized` or a config addition (already used
  with `unoptimized` for admin thumbnails, presumably because those can be base64 data URLs from
  the mocked `uploadImage()`).
- **In-memory caching** for markdown itineraries (`itineraryService.ts`'s module-level `cache`,
  invalidated on write) avoids re-reading the filesystem on every request within a server
  instance's lifetime.
- **Pagination** implemented server-side for Destinations (`skip`/`take` in Prisma) and
  client-side (array slicing) for the `localStorage` mocks — correct for their respective
  backends.

## Current Status
No performance regressions or anti-patterns were found in the reviewed code. The main
performance risk is architectural, not code-level: **base64 image uploads** stored in
`localStorage` (2.5–10MB browser storage limits, and large JSON payloads on every `repo<T>()`
read/write) will degrade badly the moment real images are used at volume — this is a scaling
trap baked into the current mock, not a bug to "fix" in isolation, but a reason to prioritize
real object storage before the mocked admin modules see real content.

## Best Practices
- Keep new pages as Server Components unless there's a concrete interactivity requirement.
- Use `next/image` with explicit `sizes` for any new image-bearing UI.
- Don't add client-side data fetching libraries (React Query/SWR) for reads that a Server
  Component can already do directly — see `docs/STATE_MANAGEMENT.md`.

## Recommendations
1. Prioritize real object storage (S3/R2) before any admin module storing images moves beyond
   mock status — this is a performance issue as much as an architecture one.
2. Add `export const revalidate = 600` (ISR) to destination/package pages once they're
   DB-backed, per PDF §15.4 — not urgent while content is small and mostly static-built.

## Future Improvements
Once traffic/content volume grows, revisit the PDF's Web Vitals targets (LCP < 2.5s, CLS < 0.05,
INP < 200ms) with real measurement (Vercel Analytics or Lighthouse CI) rather than assuming
compliance — no such measurement currently exists in the repo.
