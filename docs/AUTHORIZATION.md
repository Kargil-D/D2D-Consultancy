# Authorization

## Purpose
Document role-based access control: what the PDF requires, and what actually gates access today
(spoiler: nothing does, server-side).

## Scope
`/admin/**` pages, `/api/admin/**` routes, and the role model in `src/types/auth.ts`.

## Target Model (PDF §5)
| Role | Access |
|---|---|
| Admin | Everything |
| Sales | Leads, Quotations |
| Booking Executive | Booking module |
| Customer Support | Support module |
| Accounts (Phase 2) | Payments only |

Rule stated explicitly in the PDF: *"Access is enforced in two places: the UI hides screens a
role cannot use, and every API route re-checks the role server-side. Never trust the client
alone."* Content-admin screens (Campaigns, Destinations) are Admin-only in Phase 1.

## Current Implementation
- **Client-side only, and not even enforced there for admin routes.** `AuthContext.user.roles`
  is an array (`["admin"]` or `["customer"]`) but nothing in `src/app/admin/**` reads it to
  gate rendering — every admin page renders unconditionally for any visitor, logged in or not.
- **No `middleware.ts`** exists to intercept requests to `/admin/**` or `/api/admin/**`.
- **No server-side role check** exists in any route handler (`src/app/api/admin/destinations/
  route.ts` and siblings perform Zod validation but never check who's calling).
- Practical consequence: today, anyone with the URL can view, create, edit, and delete
  Destinations in production, and can view every admin screen, without logging in at all.

## Current Status
0% implemented server-side. This is the most severe concrete finding in this analysis — see
`docs/SECURITY_GUIDELINES.md` for the consolidated security view.

## Best Practices (for when this is built)
- Gate at two layers, per the PDF: `middleware.ts` (or a shared `requireRole()` helper called at
  the top of every admin route handler and every admin page/layout) for the server check, and
  conditional rendering/redirects for the UX layer. The server check is the one that actually
  matters; never ship the UX layer alone.
- A single protected layout (`src/app/admin/layout.tsx`, currently absent — each admin page
  wraps itself in `<AdminShell>` individually with no gate) would centralize this instead of
  repeating checks per page.

## Recommendations
1. Add `src/app/admin/layout.tsx` that verifies the session and role before rendering
   `children`, redirecting to a login screen otherwise — this single file would close most of
   the client-side exposure at once.
2. Add a `requireRole()` server helper (referenced by name in
   `.github/copilot-instructions.md` §7 but not present in code) and call it at the top of every
   `/api/admin/**` route handler.
3. Do this immediately after real authentication lands (`docs/AUTHENTICATION.md`) — authorization
   without authentication has nothing to check against.

## Future Improvements
Once Sales/Booking Executive/Customer Support roles have real modules to guard (Leads,
Bookings, Support), extend `requireRole()` calls to those routes too, and add an audit log
(PDF §17 "Best Practices": immutable `events` table) recording who did what.
