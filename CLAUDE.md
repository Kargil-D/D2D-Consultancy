# CLAUDE.md — AI Development Rules for D2D Holidays / D2D Nexus

> This file is auto-loaded by Claude Code at the start of every session in this repository.
> It is the single most important document for AI-assisted work here. Read it before writing
> any code. For deeper context see [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md),
> [`docs/CURRENT_IMPLEMENTATION.md`](docs/CURRENT_IMPLEMENTATION.md) and
> [`docs/GAP_ANALYSIS.md`](docs/GAP_ANALYSIS.md).

## 0. What this project is

A Next.js 15 (App Router) monolith for a travel consultancy: a public marketing site
(destinations, campaigns/itineraries, enquiry funnel) plus an internal admin panel. The
attached architecture brief (`D2D_Nexus_Architecture.pdf`) describes the **target** Phase‑1
CRM + content-admin platform. The repository today implements a subset of that: **only the
`Destination` entity is a real, database-backed module**; everything else in `/admin` (Packages/
Campaigns, Hero, Reviews, Enquiry Config) is either a markdown-file store or a `localStorage`
mock. Treat any other document in this repo (`PROJECT_CONTEXT.md`, `docs/ARCHITECTURE.md`,
`.github/copilot-instructions.md`) as **aspirational/target** state unless it's corroborated by
actual code — they were written ahead of implementation and have already drifted from what
exists. When in doubt, trust the code, not the docs.

## 1. Non-negotiable rules

1. **Analyze before you generate.** Read the existing implementation of the area you're
   touching (the page, its service, its types, its admin counterpart) before writing new code.
   Never assume a helper, hook, or table exists — verify with Grep/Read/Glob first.
2. **Never create duplicate functionality.** This repo already has one cautionary tale: two
   independent, disconnected "package" editors exist (`/admin/packages-master` → `AdminPackage`
   in `localStorage`, and `/admin/packages` → markdown itineraries via `itineraryService`). Do
   not add a third. If you find near-duplicate logic, flag it and propose consolidation instead
   of adding another variant.
3. **Reuse existing components before creating new ones.** Check `src/components/admin/ui/*`
   (DataTable, Drawer, Field, ConfirmModal, StatusToggle, Pagination, ImageUpload, Toast,
   Breadcrumb, TagInput) and `src/components/common/*` before building new primitives.
4. **Preserve the established architecture and folder structure.** See
   [`docs/FOLDER_STRUCTURE.md`](docs/FOLDER_STRUCTURE.md). New page → `src/app/<route>/page.tsx`.
   New business logic → `src/services/<name>Service.ts` (server-only, never imported from a
   `"use client"` file). New Prisma-backed CRUD → mirror the `Destination` pattern exactly:
   `prisma/schema.prisma` model → `src/lib/validation/<entity>.ts` (Zod) →
   `src/services/<entity>Service.ts` → `src/app/api/admin/<entity>/route.ts` (+ `[id]/route.ts`)
   → `src/lib/adminApi.ts` client wrapper → admin page under `src/app/admin/<entity>/page.tsx`.
5. **Follow existing coding standards.** TypeScript strict, no `any`, named exports for
   services/utils, default exports for pages/components, Server Components by default,
   `"use client"` only when genuinely needed. Full detail:
   [`docs/CODING_STANDARDS.md`](docs/CODING_STANDARDS.md).
6. **Composition over duplication; SOLID where it earns its keep.** Don't over-abstract a
   one-off. Three similar lines beat a premature interface.
7. **Never break existing functionality.** The public site (`/`, `/destinations/[slug]`,
   `/packages/[slug]`, `/itinerary/[id]`, `/plan-trip`) and the `/api/send-enquiry` email flow
   are the only fully working end-to-end paths in production terms — treat them as load-bearing.
8. **Explain architectural decisions before implementing** anything non-trivial (new table, new
   auth mechanism, new route group). State the tradeoff in one or two sentences, then proceed.
9. **No placeholders, no mock implementations, unless explicitly asked.** The codebase already
   has real mocks (`USE_MOCK = true` in `authService.ts`, `localStorage` repos in
   `adminApi.ts`) that were **deliberately** left as scaffolding pending a backend decision —
   don't silently "fix" them by inventing a fake backend; don't add new ones elsewhere.
10. **Server-side validation and authorization are currently missing almost everywhere.** Do
    not assume client-side checks are sufficient. If you add a mutating API route, validate with
    Zod server-side even if the existing sibling routes don't yet enforce auth — flag the gap
    rather than silently perpetuating it in new code (see
    [`docs/SECURITY_GUIDELINES.md`](docs/SECURITY_GUIDELINES.md)).

## 2. The one open architectural question you must not silently resolve

Code comments in `src/services/authService.ts` and `src/lib/adminApi.ts` say to wire the real
implementation "against the .NET API when it's ready." This contradicts the Next.js
Route-Handlers-+-Prisma model assumed by both the attached PDF and `docs/ARCHITECTURE.md`. If a
task requires deciding how an entity will be persisted or authenticated, **ask the user which
backend model is authoritative** rather than guessing — this determines whether new work goes
into `src/app/api/**` (Next.js monolith, matches the `Destination` module and the PDF) or is
scaffolding for a separate .NET service. Do not build both. Default assumption, absent other
instruction: follow the `Destination` module's pattern (Next.js + Prisma), since it's the only
one actually wired end-to-end.

## 3. Known in-flight work — don't collide with it

A "Package" → "Campaign" terminology rename (per the PDF's explicit correction in its
Introduction) is partially applied and **uncommitted** as of this writing: UI copy/labels in
10 files now say "Campaign", but routes (`/admin/packages`, `/admin/packages-master`), types
(`AdminPackage`, `packagesApi`), components (`PackageForm.tsx`, whose h2 still literally reads
"Create / Edit Package"), and service names are unchanged. If asked to continue this rename,
do it as a deliberate, scoped pass (routes + types + files + copy together) rather than
copy-only edits — see [`docs/TASK_BREAKDOWN.md`](docs/TASK_BREAKDOWN.md) for the itemized list.

## 4. Quality bar

- Production-ready code only. No `// @ts-ignore` or `eslint-disable` without a comment
  explaining why (existing rule from `.github/copilot-instructions.md`, still valid).
- Run `npm run build` after any non-trivial change — this repo has no test suite, so the
  TypeScript/ESLint/route-map check performed by `next build` is the primary safety net.
- Keep diffs focused; don't reformat unrelated code.
- Default all customer-facing prices to INR; never expose internal cost/margin fields to
  public routes (none exist yet, but this rule anticipates the Costing module).

## 5. Where to look for more

| Question | Document |
|---|---|
| What actually exists vs. what's planned? | [`docs/CURRENT_IMPLEMENTATION.md`](docs/CURRENT_IMPLEMENTATION.md), [`docs/GAP_ANALYSIS.md`](docs/GAP_ANALYSIS.md) |
| Where does X live? | [`docs/FOLDER_STRUCTURE.md`](docs/FOLDER_STRUCTURE.md), [`docs/MODULE_BREAKDOWN.md`](docs/MODULE_BREAKDOWN.md) |
| How do I add a new Prisma-backed entity? | [`docs/DATABASE_DESIGN.md`](docs/DATABASE_DESIGN.md), [`docs/API_ARCHITECTURE.md`](docs/API_ARCHITECTURE.md) |
| What are the styling/component conventions? | [`docs/UI_GUIDELINES.md`](docs/UI_GUIDELINES.md), [`docs/REUSABLE_COMPONENTS.md`](docs/REUSABLE_COMPONENTS.md) |
| What's next on the roadmap? | [`docs/FEATURE_ROADMAP.md`](docs/FEATURE_ROADMAP.md), [`docs/TASK_BREAKDOWN.md`](docs/TASK_BREAKDOWN.md) |

Update this file whenever an architectural decision changes (especially §2's open question,
once resolved).
