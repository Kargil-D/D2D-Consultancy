# Security Guidelines

## Purpose
Consolidate every security finding from this analysis in one place, ranked by severity, so
they're addressed rather than re-discovered later.

## Scope
Authentication, authorization, input handling, secrets, and data exposure across the repo.

## Current Status — Findings (most severe first)

1. **No server-side authorization anywhere.** `/admin/**` pages and all `/api/admin/**` routes
   are publicly reachable with no session/role check. Anyone with the URL can list, create,
   update, or delete Destinations in the live database today. See `docs/AUTHORIZATION.md`.
2. **No real authentication.** `authService.ts` accepts any password ≥ 4 characters and derives
   admin privilege from an email-domain string match, entirely client-side and unverified. See
   `docs/AUTHENTICATION.md`.
3. **No `middleware.ts`.** There is no single interception point for auth, security headers, or
   CSP — anything added later (rate limiting, HSTS, X-Frame-Options) has nowhere to live yet.
4. **Secrets handling is currently correct, but fragile.** `.env`/`.env.local` are gitignored
   (verified in `.gitignore`), and `src/lib/prisma.ts` throws if `DATABASE_URL` is missing. No
   `NEXT_PUBLIC_`-prefixed secret leakage was found. However, there is no `src/lib/env.ts`
   Zod-validated loader (referenced by `.github/copilot-instructions.md` but absent), so a
   malformed/missing var elsewhere would only fail at first use, not at boot.
5. **No rate limiting.** `/api/send-enquiry` and the destinations API accept unlimited requests.
6. **Image upload is a client-side base64 mock**, not scanned or stored server-side — low risk
   today since nothing consumes it server-side yet, but must not go to production as-is; the PDF
   explicitly requires private, scanned document storage (§9.1) for the Documents module this
   will need to support later.
7. **No CSRF/same-origin protections** on mutating routes — acceptable only because there's no
   session to forge yet; must be addressed in lockstep with real auth, not after.

## Best Practices
- "Never trust the client alone" (verbatim from the PDF §5) — every new mutating route must
  re-validate both input (Zod) and, once available, the caller's role, server-side.
- Keep the `Destination` route handlers' try/catch + `console.error("[/api/...]", err)` pattern;
  don't leak stack traces or raw DB errors to the client (`err instanceof Error ? err.message :
  "..."` is already a reasonable middle ground — reserve verbose messages for validation errors,
  not internal exceptions).

## Recommendations (priority order)
1. Ship real authentication (`docs/AUTHENTICATION.md`) and a `requireRole()` / `middleware.ts`
   authorization gate (`docs/AUTHORIZATION.md`) before adding any more admin functionality —
   every new admin module built before this point inherits the same exposure.
2. Add `src/lib/env.ts` with a Zod schema for all required env vars, imported at the top of
   `src/lib/prisma.ts` and anywhere else secrets are read.
3. Add security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy) via `middleware.ts` once
   it exists for auth — bundle both concerns into the same file.
4. Rate-limit `/api/send-enquiry` (public, unauthenticated, sends email — a spam vector today).

## Future Improvements
Once Documents/Invoices/Vouchers exist, move file storage off client-side base64 to real S3/R2
object storage with private ACLs, per PDF §3 and §9.1.
