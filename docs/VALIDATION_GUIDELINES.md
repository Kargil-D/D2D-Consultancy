# Validation Guidelines

## Purpose
Document the validation approach and its current coverage gap.

## Scope
`src/lib/validation/*`, inline validation in forms, and the enquiry wizard's client-side checks.

## Architecture

### Established pattern (one example so far)
`src/lib/validation/destination.ts`:
```ts
export const DestinationCreateSchema = z.object({ ... });
export const DestinationUpdateSchema = DestinationCreateSchema.partial();
export type DestinationCreate = z.infer<typeof DestinationCreateSchema>;
export type DestinationUpdate = z.infer<typeof DestinationUpdateSchema>;
```
Used server-side in the route handler (`DestinationCreateSchema.parse(payload)`) before calling
the service. This `<Entity>CreateSchema` / `<Entity>UpdateSchema = CreateSchema.partial()` /
inferred types pattern is the one to replicate for every future entity.

### Client-side validation
- Admin forms (e.g. `admin/destinations/page.tsx`) do lightweight inline checks
  (`canSave = !!drawer.form.name && !!drawer.form.country`) plus a `notify()` toast on failure —
  not Zod-driven, just boolean gates.
- The plan-trip wizard validates via `enquiryService.validate()` (not read line-by-line in this
  pass, but referenced consistently in `PROJECT_CONTEXT.md` and confirmed present) before
  submission.
- `register/page.tsx` has a hand-written `validate()` function (name/email/password/confirm)
  returning a `FieldErrors` object — not Zod-based, and entirely client-side since there's no
  real registration endpoint yet.

## Current Status
Only the Destination entity has server-side Zod validation. Every other mutating surface
(Packages, Packages Master, Hero, Reviews, Enquiry Config, Register) either has no server
endpoint to validate against (localStorage/mocked) or validates client-side only.

## Best Practices
- Every new Prisma-backed entity gets a `src/lib/validation/<entity>.ts` Zod schema, `.parse()`'d
  inside the route handler — never trust that client-side checks ran.
- Where a schema is shared conceptually between client and server (e.g. a future `Lead` schema
  used by both the plan-trip wizard and `/api/leads`), define it once and import it in both
  places, per `.github/copilot-instructions.md` §3 ("Share the same Zod schema between client
  and `/api` routes").

## Recommendations
1. Add `src/lib/validation/enquiry.ts` (or promote existing inline checks in `enquiryService.ts`
   into a Zod schema) so `/api/send-enquiry` validates with the same rigor as the destinations
   API.
2. When registration becomes real, replace `register/page.tsx`'s hand-written `validate()` with
   a shared Zod schema mirrored server-side.

## Future Improvements
Once React Hook Form is introduced (per `docs/ARCHITECTURE.md`'s target stack) for
more complex forms (Campaign tabbed editor, Quotation builder), keep Zod as the single schema
source feeding both RHF's resolver and the server route — don't fork validation logic.
