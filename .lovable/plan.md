## What changes

Three fixes to the Five C's detail sheet, plus one color defect on the homepage pillar sheet.

### 1. Flush top with a visible pull-down handle (mobile)

Today the shared drawer renders a grey handle on the white drawer surface, then the colored C header starts below it, so there is a white band above the color band.

- Add an optional `hideHandle` prop to `src/components/ui/drawer.tsx` so a drawer can suppress the default handle. Existing drawers are unaffected.
- In `FiveCDetailSheet`, pass `hideHandle`, add `overflow-hidden rounded-t-[10px]` to the content, and render the handle inside the colored header as a custom div carrying `vaul-drawer-handle` (per the vaul 0.9.3 workaround), tinted light against the color so it stays visible.
- Result: the C color runs edge to edge at the very top of the sheet with the drag handle sitting on it.

### 2. Scroll always starts at the top when moving between C's

The scroll container keeps its position because only the content swaps, not the element.

- Attach a ref to the scrollable body and reset `scrollTop = 0` in an effect keyed on `openId`. Applies to both the mobile drawer and the desktop right sheet.

### 3. Five C's colors repointed to the canonical module tokens

Canonical mapping (already defined in `src/index.css`, no new values introduced):

```text
Connect      --module-connect      emerald
Convene      --module-convene      amber gold
Collaborate  --module-collaborate  forest green
Contribute   --module-contribute   copper
Convey       --module-convey       deep teal
```

- `src/content/fiveCs.content.ts`: change each entry's `colorToken` to `hsl(var(--module-<id>))`. This corrects Convene, Collaborate, Contribute, and Convey, which currently reuse `--dna-gold` / `--dna-copper` and duplicate each other.
- `FiveCDetailSheet` header: replace the cross-hue wash (`color -> muted`) with a single-hue gradient from `hsl(var(--module-<id>))` to `hsl(var(--module-<id>-dark))`, so one C reads as one color.
- `src/components/platform/PillarInfoSheet.tsx`: repoint every `accentBg` from the legacy `dna-*` cross-C gradients to its own module token and `-dark` terminus. This is the root cause of Convey showing Collaborate's green on the homepage.

## Technical notes

- Both the sheet card tiles (`FiveCsDiscoveryRow`) and the sheet header read `colorToken` from the same content file, so the fix propagates to the card grid automatically.
- No database, routing, or copy changes. No new tokens, hexes, or arbitrary sizes beyond the existing `hsl(var(--token))` runtime-variable exception.
