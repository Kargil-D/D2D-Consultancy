# State Management

## Purpose
Document how state is actually handled today, since `docs/ARCHITECTURE.md` proposes a library
(Zustand) that isn't in use.

## Scope
Client and server state patterns across the app.

## Architecture

### Server state
Server Components fetch directly (Prisma for Destinations, filesystem for itineraries) — no
client-side data-fetching library (no React Query/SWR) is used or needed for these read paths.

### Client state
- **Local component state** (`useState`/`useReducer`) is the default and covers the vast
  majority of interactivity: the plan-trip wizard, admin forms/drawers, mega-menus.
  Confirmed in `src/app/plan-trip/page.tsx`, all `src/app/admin/**/page.tsx` files.
- **React Context** is used for exactly one cross-cutting concern: `AuthContext`
  (`src/contexts/AuthContext.tsx`). It is a `"use client"` provider wrapping the app (presumably
  from `layout.tsx`), exposing `useAuth()`.
- **Toast notifications** use a second, admin-scoped context: `ToastProvider`/`useToast` in
  `src/components/admin/ui/Toast.tsx`, instantiated per-admin-page via `AdminShell`.
- **Browser storage as a state layer:** both `AuthContext` (session) and `adminApi.ts`'s
  `repo<T>()` factory (Packages/Hero/Reviews/Itineraries/EnquiryConfig) use `localStorage`/
  `sessionStorage` directly as their persistence — this is unusual (state management doubling as
  a database substitute) and is specific to this repo's current mocked-backend phase; see
  `docs/CURRENT_IMPLEMENTATION.md`.
- **URL state:** not currently used for filters (the PDF's target destination-listing filters
  aren't built yet); the admin `DataTable`/`Pagination` components hold page/search state
  locally instead of in the URL.

No global client store (Redux/Zustand/Jotai) exists, despite `docs/ARCHITECTURE.md` proposing
Zustand for admin filters — not needed at current scale.

## Current Status
Adequate for the app's current size. The `localStorage`-as-database pattern is the one aspect
that needs to be understood as temporary scaffolding, not a state-management choice to extend.

## Best Practices
- Keep using local `useState` for form/wizard state; don't reach for Context or a store until
  genuine cross-tree sharing is needed.
- Don't add new `localStorage`-backed "repos" — any new entity needing durable state should go
  through Prisma (see `docs/DATABASE_DESIGN.md`), not extend the `repo<T>()` pattern in
  `adminApi.ts`.

## Recommendations
If/when server data-fetching grows past what Server Components + the current admin `fetch()`
wrappers comfortably handle (e.g. optimistic updates across the CRM dashboard), consider React
Query at that point — not preemptively.

## Future Improvements
Once real filtering (destination listing, campaign search) is built per the PDF, move filter
state into the URL (`useSearchParams`) as `docs/ARCHITECTURE.md` §6.4 anticipates, so filtered
views are shareable/SEO-indexable.
