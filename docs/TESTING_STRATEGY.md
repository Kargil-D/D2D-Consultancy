# Testing Strategy

## Purpose
State the current (absent) testing posture honestly, and propose a minimal, proportionate
starting point.

## Scope
Test tooling, coverage, and CI enforcement.

## Current Status
**No automated tests exist.** `package.json` has no test framework dependency (no
jest/vitest/@testing-library/playwright). No `/tests` directory. No `.github/workflows/*` to run
tests in CI even if they existed. The only verification step currently practiced is `npm run
build` (per `.github/copilot-instructions.md` §11: "After any non-trivial change, run `npm run
build` to verify the route map, types, and lint").

## Architecture (proposed minimal starting point)
Given the codebase's current shape, the highest-leverage first tests are not UI snapshot tests
but targeted coverage of the few places real logic lives:
1. **`itineraryService.ts`'s `parseBody()`** — pure function, markdown-to-structured-data
   parsing, easy to unit test with fixture strings, and currently the most complex hand-rolled
   parsing logic in the repo.
2. **`destinationService.ts`** — integration tests against a real (test) Postgres instance,
   since this is the one module with real DB semantics (soft delete, search, pagination) worth
   protecting from regression.
3. **Zod schemas** (`src/lib/validation/*`) — cheap, high-value unit tests as more entities gain
   schemas.
4. **API route handlers** — once auth exists, route-level tests are the right place to assert
   401/403 behavior for unauthenticated/wrong-role requests.

## Best Practices
- Don't retrofit tests onto the `localStorage` mock modules (`packagesApi`, `heroApi`, etc.) —
  they're slated for replacement (`docs/GAP_ANALYSIS.md`); testing them locks in behavior that
  shouldn't be preserved.
- Prefer integration tests over heavy mocking for anything touching Prisma — Prisma's generated
  client + a real test database catches more real bugs than mocking the client.

## Recommendations
1. Introduce **Vitest** (fast, ESM-native, minimal config, pairs well with Next.js 15) for unit
   tests, starting with `parseBody()` and the Zod schemas.
2. Add a `test` script to `package.json` and a `.github/workflows/ci.yml` that runs
   `npm run lint && npm run build && npm test` on every PR — currently nothing runs
   automatically at all.
3. Defer end-to-end testing (Playwright, as `docs/ARCHITECTURE.md` proposes) until the
   authentication/CRM modules exist — there's limited value E2E-testing flows that are still
   fully mocked.

## Future Improvements
Once `Lead`→`Booking`→`Payment` exists and the Won-trigger transaction is implemented, that
transaction is the single most important thing in the entire system to have an integration test
around, given it's described as a guarantee ("This guarantees Customer Support is engaged
immediately after a booking is Won") in the PDF §6.1.
