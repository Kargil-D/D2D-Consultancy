# Authentication

## Purpose
Document how login/session state currently works, and how it is supposed to work per the PDF
and `docs/ARCHITECTURE.md`.

## Scope
`src/contexts/AuthContext.tsx`, `src/services/authService.ts`, `src/components/auth/*`,
`src/app/register/page.tsx`.

## Current Implementation (fully mocked)

- **State:** `AuthContext` holds `{ user, token, refreshToken, loading, error }` in React state,
  hydrated from `localStorage`("d2d.auth.session") or `sessionStorage` on mount depending on
  "remember me". No server round-trip validates the session on load — if a token string exists
  and hasn't "expired" per a client-computed timestamp, the user is considered logged in.
- **Login:** `loginApi()` in `authService.ts` — `USE_MOCK = true` short-circuits to
  `mockLogin()`, which accepts any password ≥ 4 characters and fabricates a JWT-shaped string
  (`mock.jwt.<Date.now()>`) that is never actually a JWT and is never verified by anything.
- **Role assignment:** purely by string-matching the email domain
  (`payload.email.endsWith("@d2dholidays.com") ? ["admin"] : ["customer"]`) — trivially
  spoofable, and happens entirely client-side.
- **Social login:** `socialLoginApi()` — same mock pattern, no real OAuth redirect.
- **Registration:** `src/app/register/page.tsx` — client-side field validation only, then
  `await new Promise((r) => setTimeout(r, 900))` standing in for an API call. Nothing is
  persisted anywhere.
- **Logout:** clears both storage keys and resets context state — this part is real/correct.

## Target (per PDF §3, §9.1 and `docs/ARCHITECTURE.md` §19.1)
NextAuth (Credentials) or Lucia; hashed passwords (bcrypt/argon2); session + role encoded in a
server-verified JWT or DB-backed session; HTTP-only secure cookies, `SameSite=Lax`.

## Current Status
0% of the target is implemented. There is no `User` table, no password hashing, no server
session verification, and no `/api/auth/*` route of any kind (`src/app/api/` contains no `auth`
subfolder).

## Best Practices
- Do not build new features that assume `AuthContext`'s `user`/`token` values are trustworthy on
  the server — they are not verified anywhere today.
- When implementing real auth, keep the same `AuthContextValue` shape/consumer API
  (`useAuth()`, `login()`, `socialLogin()`, `logout()`, `isAuthenticated`) so existing UI
  (`LoginModal`, `LoginForm`) doesn't need to change — only `authService.ts`'s internals should
  change from mock to real `fetch`.

## Recommendations
1. Resolve the Next.js-vs-.NET backend question first (`docs/GAP_ANALYSIS.md`) — it determines
   whether `/api/auth/login` is a Next.js Route Handler calling NextAuth/Lucia, or a proxy to an
   external service.
2. Add a `User` Prisma model (id, name, mobile, email, username, passwordHash, department, role,
   status per PDF §4.1) before wiring real login.
3. Flip `USE_MOCK = false` in `authService.ts` only once `/api/auth/login` exists and returns the
   same `AuthResponse` shape the mock already returns — this is a genuinely low-risk swap given
   how the mock was deliberately shaped to match.
4. Add `middleware.ts` to verify the session server-side on every `/admin/**` request — see
   `docs/AUTHORIZATION.md`.

## Future Improvements
Add OAuth (Google/Facebook) for real once `socialLoginApi()`'s consumer contract is confirmed
stable; add password-reset and email-verification flows, neither of which exist even as UI today.
