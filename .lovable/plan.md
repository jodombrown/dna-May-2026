## Goal

On the public landing page, the five pillar sections (Connect, Convene, Collaborate, Contribute, Convey) currently route to `/connect`, `/convene`, etc. Those routes were already redirected to `/`, so the cards and Explore buttons effectively bounce users home. We will:

1. Make the cards non-interactive (no navigation, no hover-click).
2. Replace each Explore button's navigate call with opening a right-side slide-out panel that contains a rich, self-contained explanation of that pillar.

Scope is limited to the 5 platform section components on the landing page. No routing, auth, or business logic changes.

## Files to change

- `src/components/platform/ConnectSection.tsx`
- `src/components/platform/ConveneSection.tsx`
- `src/components/platform/CollaborateSection.tsx`
- `src/components/platform/ContributeSection.tsx`
- `src/components/platform/ConveySection.tsx`

## New file

- `src/components/platform/PillarInfoSheet.tsx` - shared right-side slide-out built on the existing `Sheet` primitive (`side="right"`, `w-full sm:max-w-xl`), accepting `{ open, onOpenChange, pillar }` and rendering a structured explainer (overview, what you can do, who it is for, how it connects to the other C's, what is coming) sourced from a local `pillarContent` map.

## Implementation steps

1. Create `PillarInfoSheet.tsx`
   - Uses `Sheet` / `SheetContent side="right"` from `@/components/ui/sheet`.
   - Internal `PILLAR_CONTENT` record keyed by `'connect' | 'convene' | 'collaborate' | 'contribute' | 'convey'` with: title, tagline, Adinkra icon (Sankofa, Nkonsonkonson, FuntunfunefuDenkyemfunefu, Adinkrahene, Mpatapo), accent color token, sections: Overview, What you can do (bullet list), Who it is for, How it connects to the other C's, Roadmap / coming soon. Copy follows project knowledge (no em dashes, Lora for headings, Inter for body).
   - No CTA buttons that link out; the panel is purely informational. Close button comes from `SheetContent`.

2. In each `*Section.tsx`:
   - Add `const [infoOpen, setInfoOpen] = useState(false)`.
   - Replace any card-level `onClick={() => navigate('/connect')}` (and equivalents) so cards no longer navigate. Remove the `cursor-pointer` / hover-affordance classes tied to navigation. Keep visual styling otherwise unchanged.
   - Repoint every "Explore ..." button's `onClick` to `setInfoOpen(true)` instead of `navigate(...)`.
   - Render `<PillarInfoSheet pillar="connect" open={infoOpen} onOpenChange={setInfoOpen} />` at the bottom of the section.
   - Remove now-unused `useNavigate` imports where applicable.

3. Leave `HeroTriangleSection.tsx` untouched (its buttons scroll to in-page sections, not marketing routes).

4. Sanity pass: `rg -n "navigate\('/(connect|convene|collaborate|contribute|convey)'\)" src/components/platform` should return no results after the edit.

## Notes / constraints honored

- Right-side slide-out per request (Radix Dialog via `Sheet`, already used elsewhere).
- No em dashes anywhere in new copy.
- Adinkra icons reserved for the five C's, per memory.
- No new routes added; marketing pages stay redirected.
- Mobile: sheet defaults to `w-[90vw] max-w-sm`; we widen to `sm:max-w-xl` for readable explainer copy.
