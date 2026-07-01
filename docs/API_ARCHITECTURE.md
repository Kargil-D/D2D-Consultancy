# API Architecture

## Purpose
Document the API conventions actually used in this repo, and the response contract every route
must follow.

## Scope
`src/app/api/**` Route Handlers, plus the `ApiResponse<T>` contract used by both real and mocked
clients.

## Architecture

### Response envelope (must be preserved)
```ts
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
```
Defined in `src/types/admin.ts` (and duplicated conceptually for enquiry responses in
`src/types/enquiry.ts`). Every route handler returns this shape via `NextResponse.json(...)`,
including error cases (`success: false`, `data: null`, appropriate HTTP status).

### Existing routes
| Method | Route | File | Auth | Notes |
|---|---|---|---|---|
| POST | `/api/send-enquiry` | `src/app/api/send-enquiry/route.ts` | None | Real Nodemailer send, server-validated |
| GET | `/api/admin/destinations` | `src/app/api/admin/destinations/route.ts` | **None** | list + search + pagination + country filter |
| POST | `/api/admin/destinations` | same file | **None** | Zod-validated via `DestinationCreateSchema` |
| GET/PUT/DELETE | `/api/admin/destinations/[id]` | `src/app/api/admin/destinations/[id]/route.ts` | **None** | inferred CRUD pattern |
| POST | `/api/admin/destinations/[id]/toggle-status` | `.../toggle-status/route.ts` | **None** | flips Active/Inactive |
| GET | `/api/destinations/menu` | `src/app/api/destinations/menu/route.ts` | None (public) | powers nav mega-menu |

### Pagination contract
```ts
interface Paginated<T> { items: T[]; total: number; page: number; pageSize: number; }
```
`listDestinations()` implements this server-side (Prisma `skip`/`take`); the `localStorage`
mocks in `adminApi.ts` implement an equivalent client-side `paginate()` helper so admin UI code
is agnostic to which backend it's talking to — useful precedent when a mock is finally replaced.

### Validation pattern
Zod schema colocated in `src/lib/validation/<entity>.ts`, `.parse()`'d inside the route handler
before touching the service layer (`destination.ts` is the only example; replicate its shape:
`<Entity>CreateSchema` + `<Entity>UpdateSchema = CreateSchema.partial()`).

## Current Status
5 routes total, all in the Destinations/enquiry space. No `/api/leads`, `/api/quotes/*`,
`/api/auth/*`, `/api/bookings/*` etc. exist — these are all still design-only per the PDF.

## Best Practices
- Always wrap route logic in try/catch, log with a `[/api/...]` prefix (as the existing routes
  do), and return the `ApiResponse` envelope even on failure.
- Validate with Zod **inside the route handler**, not just client-side.
- New admin CRUD entities should follow the exact `route.ts` + `[id]/route.ts` (+ any
  entity-specific sub-action route like `toggle-status`) file layout the Destinations module
  uses.

## Recommendations
1. Every `/api/admin/**` route needs a server-side auth/role check before any other logic runs
   — currently none has one. See `docs/SECURITY_GUIDELINES.md` and `docs/AUTHORIZATION.md`.
2. When `Lead` persistence is added, extend `/api/send-enquiry` (or add `/api/leads`) to write a
   `Lead` row in the same request, rather than only sending an email — this is the fastest way
   to close the biggest CRM gap without touching the wizard UI at all.
3. Rate-limit public-facing mutating routes (`/api/send-enquiry`) before traffic scales — no
   rate limiting exists today.

## Future Improvements
Once `Quotation`/`Booking` land, add `/api/quotes/[id]/pdf` and `/api/quotes/[id]/share`
following the PDF §7.3–7.4 contract (signed JWT share tokens, streamed PDF response).
