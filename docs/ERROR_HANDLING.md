# Error Handling

## Purpose
Document the error-handling conventions in use across API routes, services, and UI.

## Scope
Route handler try/catch patterns, the `ApiResponse` envelope, and admin UI error surfacing.

## Architecture

### API routes
Every route handler follows the same shape (see `src/app/api/admin/destinations/route.ts`):
```ts
try {
  // ...logic...
  return NextResponse.json({ success: true, message: "...", data });
} catch (err) {
  console.error("[/api/admin/destinations] GET", err);
  const msg = err instanceof Error ? err.message : "Invalid payload";
  return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 or 500 });
}
```
Console logging is prefixed with the route path in square brackets — a searchable, greppable
convention worth keeping.

### Services
Services (e.g. `destinationService.ts`) don't catch errors themselves — they let Prisma errors
propagate up to the route handler's `catch`. This is the correct layering: don't swallow errors
in the service layer.

### Client / Admin UI
Admin pages catch at the call site and surface via the shared `useToast()` notification system:
```ts
try {
  const res = await destinationsApi.create(payload);
  if (!res.success) return notify(res.message || "Unable to ...", "error");
  notify("... created", "success");
} catch (error) {
  notify(error instanceof Error ? error.message : "Unexpected error", "error");
}
```
Two layers of failure are handled distinctly: a well-formed `{ success: false }` response (show
`res.message`), and a thrown/network error (show a generic fallback). Replicate both branches.

### Best-effort / non-blocking errors
The enquiry flow deliberately treats side effects as best-effort: `Promise.allSettled()` across
the Google Form submission and the email send means either can fail silently without blocking
the user's redirect to `/destinations/[slug]`. This is an intentional UX decision
(`.github/copilot-instructions.md` §12: "never block the user redirect") — don't "fix" it by
making these calls blocking/awaited-with-throw.

## Current Status
Consistent within the Destinations module and the enquiry flow. No global error boundary
(`error.tsx`) was found under `src/app/` — an uncaught render error in a Server Component would
fall back to Next.js's default error UI rather than a branded one.

## Best Practices
- New route handlers: try/catch, `console.error("[/api/<route>] <METHOD>", err)`, return the
  `ApiResponse` envelope with an appropriate status code (400 for validation, 500 for
  unexpected).
- New admin mutations: catch at the call site, use `useToast()`, distinguish `res.success ===
  false` from thrown errors as shown above.
- Non-critical side effects (analytics, best-effort integrations) should use
  `Promise.allSettled()` and never block primary user flows, following the enquiry pattern.

## Recommendations
Add `src/app/error.tsx` and `src/app/admin/error.tsx` boundaries so unexpected render errors get
a branded fallback instead of Next.js's default, especially before the CRM modules (with more
complex data dependencies) are built.

## Future Improvements
Once real authentication/authorization exist, standardize 401/403 responses in the same
`ApiResponse` envelope (`{ success: false, message: "Unauthorized", data: null }`, status 401/403)
so the admin UI's existing `notify()` error path handles auth failures without new code.
