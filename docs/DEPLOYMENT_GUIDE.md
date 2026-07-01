# Deployment Guide

## Purpose
Document actual deployment configuration (what exists) versus the target (per PDF §10).

## Scope
Build scripts, environment variables, hosting assumptions.

## Current Status

### Build/run scripts (`package.json`)
```json
"dev": "next dev",
"build": "next build",
"start": "next start",
"lint": "eslint"
```
No `prisma generate`, `prisma migrate deploy`, or `prisma db seed` script exists — a deploy today
would need these run manually/out-of-band, since `src/generated/prisma` is gitignored and must
be regenerated from `schema.prisma` before `next build` can succeed (the client import in
`src/lib/prisma.ts` resolves to that generated path).

### Environment variables
Currently defined (empty locally): `DATABASE_URL`. Per `PROJECT_CONTEXT.md`, also required in
practice: `EMAIL_USER`, `EMAIL_PASS` (Gmail SMTP for `/api/send-enquiry`),
`NEXT_PUBLIC_GOOGLE_FORM_URL`, `NEXT_PUBLIC_GFORM_ENTRY_*`. None of these are validated at boot
(no `src/lib/env.ts` exists — see `docs/SECURITY_GUIDELINES.md`).

### Hosting
Vercel is the stated target (`PROJECT_CONTEXT.md`), consistent with the Next.js App Router
choice. No `vercel.json`, no infra-as-code, and no CI/CD workflow files exist in `.github/` to
confirm or automate this.

### README
`README.md` is unedited `create-next-app` boilerplate — provides no project-specific setup
instructions (no mention of `DATABASE_URL`, Prisma migrations, or the itinerary content
convention).

## Target (PDF §10)
Three environments — Local (Docker Postgres, `prisma migrate dev`), Staging (seeded demo data),
Production (managed Postgres + Next.js host, secrets in host dashboard) — with deployment being
"a single build of the Next.js app plus `prisma migrate deploy`."

## Best Practices
Anyone deploying today must manually: set `DATABASE_URL` to a real Postgres instance, run
`npx prisma migrate deploy` (or `db push` for a fresh environment), run `npx prisma generate`,
set the email/Google Form env vars, then `next build && next start`.

## Recommendations
1. Add `"postinstall": "prisma generate"` and a `"db:migrate": "prisma migrate deploy"` script to
   `package.json` — the single highest-value deployment fix, since a fresh clone cannot currently
   build without manually running `prisma generate` first.
2. Replace `README.md` with real setup instructions (env vars, Prisma steps, content convention).
3. Add a `prisma/seed.ts` for local/staging demo data, referenced by `docs/ARCHITECTURE.md`'s
   target folder structure but not present.

## Future Improvements
Add a GitHub Actions workflow once tests exist (`docs/TESTING_STRATEGY.md`) to run lint/build/
test on every PR before Vercel preview deploys are trusted as a merge gate.
