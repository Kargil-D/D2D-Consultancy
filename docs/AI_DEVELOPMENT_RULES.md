# AI Development Rules

## Purpose
The detailed backing document for the summary rules in [`CLAUDE.md`](../CLAUDE.md). Where
`CLAUDE.md` is the always-loaded quick reference, this document is the fuller rationale — read
it when a rule in `CLAUDE.md` needs justification or nuance.

## Scope
Applies to any AI agent (Claude Code, GitHub Copilot, or otherwise) generating code in this
repository. `.github/copilot-instructions.md` predates this document and remains largely valid;
where the two disagree, this document and `CLAUDE.md` take precedence, since they were written
after verifying the current code state rather than the target state.

## Rules

### 1. Analyze existing code before generating new code
This repo has already accumulated three overlapping "itinerary-shaped" concepts
(`AdminPackage`, `AdminItinerary`, `ItineraryContent`) and two disconnected "package editor"
admin screens because past work was added without first checking what already existed. Before
adding anything itinerary/campaign/package-adjacent, read `docs/MODULE_BREAKDOWN.md` in full.

### 2. Never create duplicate functionality
If you find yourself about to write a new `localStorage`-backed repo, a new markdown parser, or
a new admin table component, stop — `src/lib/adminApi.ts`'s `repo<T>()` factory,
`itineraryService.ts`'s parser, and `src/components/admin/ui/DataTable.tsx` already exist and
should be reused or extended, not reimplemented.

### 3. Reuse existing components
Check `docs/REUSABLE_COMPONENTS.md` before writing new UI. The admin UI kit
(`src/components/admin/ui/*`) covers table/pagination/drawer/modal/toast/upload needs already.

### 4. Preserve project architecture
New Prisma-backed entities follow the `Destination` module's exact layering: schema →
`src/lib/validation/<entity>.ts` → `src/services/<entity>Service.ts` →
`src/app/api/admin/<entity>/route.ts` (+ `[id]/route.ts`) →
`src/lib/adminApi.ts` client wrapper → `src/app/admin/<entity>/page.tsx`. This is documented in
full in `docs/DATABASE_DESIGN.md`, `docs/API_ARCHITECTURE.md`, and `docs/FOLDER_STRUCTURE.md`.

### 5. Follow existing coding standards
TypeScript strict, no `any`, Server Components by default, named exports for services, default
exports for components — see `docs/CODING_STANDARDS.md` for the full, verified list.

### 6. Composition over duplication; SOLID where it earns its keep
Don't build a generic abstraction for a single use case. The `repo<T>()` factory in
`adminApi.ts` is a good example of earned abstraction (five entities share it); don't add a
sixth abstraction layer for a one-off form.

### 7. Maintain scalability
Be aware of the specific scaling trap already identified in `docs/PERFORMANCE_GUIDELINES.md`:
base64 images in `localStorage`. Don't extend that pattern; route new image needs toward real
object storage once it exists, or flag the gap if asked to add image upload before then.

### 8. Explain architectural decisions before implementation
For anything touching the data model, auth, or the backend-choice question in
`docs/GAP_ANALYSIS.md`, state the decision and its one-sentence rationale before writing code —
don't silently pick an approach on a genuinely open question.

### 9. Never break existing functionality
The public site and `/api/send-enquiry` are the only two things confirmed working end-to-end
today. Changes to `src/services/enquiryService.ts`, `googleFormService.ts`,
`itineraryService.ts`, or any public `src/app/**` page should be tested against `npm run build`
and, where feasible, manually verified in the browser before considering the task done.

### 10. Respect existing folder structure
See `docs/FOLDER_STRUCTURE.md` — don't invent new top-level folders (`hooks/`, `store/`, etc.)
until the documented trigger condition (state genuinely outgrowing Context) is met.

### 11. Keep files modular and maintainable
Follow the tabbed-form pattern in `PackageForm.tsx` for complex multi-section admin forms rather
than one large flat component.

### 12. Generate production-ready code only; avoid placeholders and mocks unless requested
This is the rule most in tension with the current codebase, which is full of *deliberate*
mocks (`USE_MOCK`, `localStorage` repos, base64 image upload). Those are pre-existing, sanctioned
scaffolding — do not add *new* ones, but also do not assume you should silently "complete" the
existing ones without being asked; that's exactly the architecture decision `CLAUDE.md` §2 says
to surface rather than resolve unilaterally.

## Current Status
This document set is complete as of this analysis pass. No code was changed while producing it,
per the explicit Phase 5 instruction ("No Code Generation") governing this task.

## Best Practices
Re-read `CLAUDE.md` at the start of every session in this repo; use this document for the
reasoning behind any rule that seems to conflict with what you observe in the code.

## Recommendations
Update this document (and `CLAUDE.md`) in the same PR as any change that resolves one of the
open questions in `docs/GAP_ANALYSIS.md` — especially the backend-architecture question, which
this entire rule set is written around.

## Future Improvements
Once real auth/RBAC lands, add an explicit rule here about never bypassing `requireRole()`
checks "to make a demo work," since that's a realistic future failure mode for AI-assisted
admin-panel work.
