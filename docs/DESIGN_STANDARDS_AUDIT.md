# DNA Design Standards Audit

**Source doctrine:** `DNA_Design_Standards_Eliminating_the_Vibe-Coded_Aesthetic.pdf` (uploaded May 2026)
**Auditor:** Lovable agent
**Date:** 2026-05-09
**Status:** Phase 2 (read-only). No code changed yet.

This report quantifies how far the current `src/` deviates from the locked-in doctrine in `mem://style/anti-vibe-coded-doctrine`. Numbers are violation counts across `.tsx`, `.ts`, and `.css` files.

---

## Headline numbers

| Violation                                                  | Count | Severity |
| ---------------------------------------------------------- | ----: | -------- |
| `purple-*` / `violet-*` / `indigo-*` / `pink-*` utilities  |   103 | High     |
| `slate-*` / `zinc-*` neutrals                              |   120 | High     |
| `rounded-2xl`                                              |   123 | High     |
| `rounded-3xl`                                              |    16 | Medium   |
| `Sparkles` / `Zap` / `Rocket` / `Wand2` references         |   350 | High     |
| `py-20` / `py-24` / `py-28` / `py-32` section padding      |    55 | Medium   |
| `min-h-[80vh]` and 80-100vh hero heights                   |    36 | Medium   |
| Framer `whileHover` with `scale` or `y`                    |     3 | Low      |
| `backdrop-blur-xl/2xl/3xl` glassmorphism                   |     0 | Clean    |

The single biggest signal: 350 references to the AI-builder icon set (`Sparkles`/`Zap`/`Rocket`/`Wand2`) versus zero Adinkra icons. Per the standards doc, replacing this set is the highest-leverage single change DNA can make.

---

## High-severity hotspots

### 1. Purple/pink/indigo palette (103)
Concentrated in:
- `src/components/connect/eventData.ts` (purple/indigo/pink/violet city color stamps)
- `src/pages/admin/contributions/*` and `src/pages/admin/AdminDashboardOverview.tsx` (purple as the COLLABORATE color - directly clashes with Forest token)
- `src/pages/ConveneCategoryPage.tsx`, `src/pages/FeaturedCalendarsPage.tsx` (multi-stop AI gradients `from-blue-500 to-purple-600`, `from-pink-500 to-orange-500`)
- `src/lib/constants/bannerGradients.ts` (banner gradients reaching for purple/pink/slate)
- `src/components/connect/hub/EnhancedMemberCard.tsx` (sector chips using indigo/pink/purple)
- `src/types/reactions.ts` ("insightful" reaction colored `text-purple-500`)

**Fix direction:** Map every category/sector/reaction color through the Emerald/Forest/Copper scale plus warm-earth neutrals. No raw Tailwind palette imports.

### 2. Slate/zinc neutrals (120)
Concentrated in:
- `src/pages/admin/AdminLogin.tsx` (full slate-900 gradient login - the most visible offender)
- `src/pages/features/archived/*` (slate-50 backgrounds, slate-600 icons throughout)
- `src/routes/adminRoutes.tsx` (slate placeholders)
- `src/pages/releases/*` (slate alerts and chips)

**Fix direction:** Replace every `slate-*`/`zinc-*` with warm-earth neutral tokens (`bg-background`, `text-foreground`, `text-muted-foreground`) once `mem://style/color-scales-spec` is materialised in `index.css`.

### 3. `rounded-2xl` proliferation (123)
Default Lovable card radius is leaking everywhere. Per doctrine: default 8px, cards max 12px, never 16px+ as a default. 16 additional `rounded-3xl` instances reinforce the marketing-page fingerprint.

**Fix direction:** Sweep `rounded-2xl` -> `rounded-xl` (12px) for cards; `rounded-3xl` -> `rounded-2xl` only where intentional (large CTAs, hero media). Tighten `--radius` in `index.css` to 8px.

### 4. AI-tell icons (350)
`Sparkles`, `Zap`, `Rocket`, `Wand2` collectively appear 350 times. Even allowing some legitimate uses (e.g. `Zap` as a generic "fast" indicator), this is far above the doctrine ceiling of zero.

**Fix direction:** Build `src/components/icons/adinkra/` with Sankofa/Nkonsonkonson/Funtunfunefu Denkyemfunefu/Adinkrahene/Mpatapo (Phase 4 in plan). Then sweep the four banned lucide icons and replace with Adinkra (for Five C's identity) or remove (for "AI excited" decoration).

---

## Medium-severity hotspots

### 5. Marketing-page padding (55)
55 instances of `py-20` / `py-24` / `py-28` / `py-32`. Doctrine cap is `py-12` (with `py-16` reserved for true page breaks). Most offenders are on landing/marketing pages and onboarding shells.

### 6. Tall hero shells (36)
36 instances of `h-[80vh]` / `min-h-[80vh]` / `h-[90vh]` etc. Each is a candidate for the "centered headline + two CTAs + gradient" anti-pattern.

### 7. Framer scale/y hover (3)
Only 3 raw `whileHover` translations. Low remediation cost.

---

## Clean areas (no violations found)

- Glassmorphism (`backdrop-blur-xl/2xl/3xl`): zero. Good.
- The core feed card system (`FeedCardBase.tsx`) already uses module-aligned bevel colors, not generic palettes.
- Typography config (`src/lib/typography.config.ts`) already enforces Lora + Inter pairing with no `font-bold`-only hierarchy.

---

## Recommended remediation order

Aligned with the approved plan in `.lovable/plan.md`:

1. **Phase 3 - Token lock-in** (small, safe): bake the 50-950 HSL scales into `src/index.css`, drop `--radius` to 8px, and add a `scripts/check-forbidden-classes.ts` lint guard so violations cannot regress.
2. **Phase 4 - Adinkra icon set** (highest visual leverage): 5 SVG components + sweep of the 350 lucide-AI-icon references for Five C's contexts.
3. **Phase 5 - Motion + density sweep**: `rounded-2xl` -> `rounded-xl`, `py-20+` -> `py-12`, kill 80vh hero shells, strip the 3 `whileHover scale/y`.

Each phase will be surfaced as its own approval gate before edits land.
