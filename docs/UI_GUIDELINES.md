# UI Guidelines

## Purpose
Capture the visual language already established so new UI stays consistent without a designer
re-reviewing every PR.

## Scope
Public site and admin panel styling conventions, derived from actual class usage across
`src/components/**` and `src/app/**`.

## Architecture / Design Language

### Brand feel
Premium/luxury travel: cinematic imagery, generous whitespace, refined typography, gradient
accents. Copy is aspirational, concise, second-person ("Your dream vacation, perfectly
planned").

### Palette & surface
- Primary gradient: `from-cyan-500 to-teal-500` (CTAs), sometimes `via-blue-600` for a
  three-stop gradient on hero buttons.
- Neutrals: `slate-*` throughout (`slate-900` text, `slate-50`/`slate-100` backgrounds,
  `slate-200` borders).
- Admin panel uses a plainer `blue-600` action color and `slate-900` header — distinct from the
  public site's cyan/teal, intentionally: admin is a utility surface, not a brand surface.
- Radius: `rounded-2xl` / `rounded-3xl` for cards and modals.
- Shadows: `shadow-xl shadow-slate-900/5` for soft elevation; `shadow-lg shadow-cyan-500/30` on
  gradient CTA buttons.
- Glassmorphism: `bg-white/15 backdrop-blur-xl border border-white/30` for the sticky navbar and
  overlays.

### Typography
`font-poppins` for headings, `font-inter` for body — both loaded via `next/font` and exposed as
CSS variables in the root layout.

### Animation
Framer Motion is the only animation library. Standard easing curve `[0.16, 1, 0.3, 1]`,
durations `0.18–0.35s`. Use `<AnimatePresence>` for mount/unmount transitions. Respect
`prefers-reduced-motion`.

### Responsive rules
Mobile-first: base classes target mobile, then layer `sm:`/`md:`/`lg:`. No overlapping UI at any
breakpoint. Dropdowns/menus use fixed positioning on mobile to avoid z-index issues. Admin
tables collapse to horizontal-scroll nav on mobile (see `AdminShell.tsx`'s `lg:hidden` nav row).

### Icons
Lucide React only, named imports (`import { ArrowRight } from "lucide-react"`).

## Current Status
Consistently applied across the public site. The admin panel has its own coherent but separate
visual language (utilitarian, blue accent) — this is a deliberate, acceptable split, not
inconsistency.

## Best Practices
- Don't introduce a new color outside the cyan/teal (public) or blue/slate (admin) systems
  without a stated reason.
- Reuse `src/components/common/Button.tsx`, `Logo.tsx`, `SectionHeading.tsx` rather than
  hand-rolling equivalents.
- New admin forms should use the `src/components/admin/ui/*` kit (Field, DataTable, Drawer,
  ConfirmModal, StatusToggle, Pagination, ImageUpload, TagInput, Toast, Breadcrumb) — it already
  implements the admin visual language correctly.

## Recommendations
No changes needed to the design language itself; the main risk is drift if new admin screens
hand-roll styling instead of reusing the `admin/ui` kit (see `docs/REUSABLE_COMPONENTS.md`).

## Future Improvements
Consider extracting the repeated gradient/shadow/radius tokens into Tailwind theme config
(`@theme` in Tailwind v4) once the palette stabilizes, rather than repeating the same utility
strings across components.
