# Project Overview

## Purpose
Orient any engineer (human or AI) joining this repository: what the product is, who it's for,
what state it's actually in, and which documents to trust.

## Scope
Covers the whole repository: the public marketing site, the internal admin panel, and the
partially-implemented CRM concept described in the attached architecture brief. Does not cover
business/legal terms of the travel consultancy itself.

## Product Summary

**D2D Holidays** ("Doorstep to Dreamland") is a luxury travel consultancy. The codebase
implements a public-facing inspiration website (destinations, campaigns/itineraries, a
multi-step enquiry wizard) and the beginning of an internal admin panel for managing that
content. A separate architecture brief supplied to this project — titled **"D2D Nexus"** —
specifies a fuller **Travel Consultancy CRM & Admin Platform** (leads → quotations → bookings →
payments → support) that the current codebase does not yet implement beyond content
administration.

**Naming note:** the codebase self-identifies as "D2D Holidays" (see `PROJECT_CONTEXT.md`,
page titles, `Logo` component copy). The supplied PDF calls the CRM/admin platform "D2D Nexus".
Treat these as the same underlying business, at two different documentation snapshots — the
PDF's "D2D Nexus" is the more recent and more precise specification for the CRM/admin surface.
Confirm with the product owner whether "D2D Nexus" is meant to formally rename the platform.

## Architecture at a Glance

- **Framework:** Next.js 15.5.18 (App Router), React 19.1.0, TypeScript (strict).
- **Styling:** Tailwind CSS v4, Framer Motion, Lucide React icons.
- **Data:** PostgreSQL via Prisma 7.8 — but only for **one** entity so far (`Destination`).
  Everything else is markdown files (`content/itineraries/*.md`) or browser `localStorage`.
- **Auth:** Fully mocked client-side (`AuthContext` + `authService.ts`, `USE_MOCK = true`). No
  server-side session, no role enforcement anywhere.
- **Email:** Nodemailer over Gmail SMTP in `/api/send-enquiry` — real and functional.
- **Hosting target:** Vercel (per `PROJECT_CONTEXT.md`); no CI/CD pipeline exists in-repo.

See [`docs/SYSTEM_ARCHITECTURE.md`](SYSTEM_ARCHITECTURE.md) for the full layered view and
[`docs/CURRENT_IMPLEMENTATION.md`](CURRENT_IMPLEMENTATION.md) for a module-by-module status.

## Current Status

Two commits exist in history: `Initial commit` and `Done the Database Migration and worked on
the destination page`. That second commit is the entirety of the database work done to date —
one Prisma model (`Destination`), one migration, one full CRUD vertical slice (schema →
service → API routes → admin UI). A "Package" → "Campaign" terminology rename is in progress
and currently uncommitted (UI copy only; see [`docs/GAP_ANALYSIS.md`](GAP_ANALYSIS.md)).

Documents already in the repo before this analysis:
- `PROJECT_CONTEXT.md` (root) — a fairly accurate current-state AI knowledge base, but written
  before the Destinations migration and the Package→Campaign rename, so partially stale.
- `docs/ARCHITECTURE.md` — a **target-state** architecture document (tRPC, Auth.js v5, Zustand,
  dnd-kit, a full CRM SQL schema) describing where the product is headed, not what exists today.
- `.github/copilot-instructions.md` — distilled AI coding rules, mostly still valid, but its
  Phase table ("Phase 4 – Admin: 🔜 Next") is the most honest self-assessment in the repo.
- `D2d Holidays Nextjs Architecture Document (1).pdf` (root) — an earlier architecture PDF,
  likely the source `docs/ARCHITECTURE.md` was derived from.

This new `/docs` set supersedes none of the above outright but is intended to be the **accurate,
code-verified** reference. Where it disagrees with `PROJECT_CONTEXT.md` or `docs/ARCHITECTURE.md`,
prefer this set.

## Best Practices
- Before starting any feature, read [`CLAUDE.md`](../CLAUDE.md) and the relevant module section
  in [`docs/MODULE_BREAKDOWN.md`](MODULE_BREAKDOWN.md).
- Treat the `Destination` module as the reference implementation for any new Prisma-backed
  entity — it is the only module implemented end-to-end correctly.

## Recommendations
- Resolve the "Next.js API vs. .NET API" question (see [`docs/GAP_ANALYSIS.md`](GAP_ANALYSIS.md)
  §"Architecture Conflict") before building any more admin modules — every hour spent on
  `localStorage` mocks is throwaway if a .NET backend is actually intended.
- Decide and document whether "D2D Nexus" formally supersedes "D2D Holidays" as the product name.

## Future Improvements
- Once the backend decision is made, retire whichever of `docs/ARCHITECTURE.md` /
  `D2d_Holidays_Nextjs_Architecture_Document.pdf` / `D2D_Nexus_Architecture.pdf` is not
  authoritative, to stop three architecture documents from silently diverging further.
