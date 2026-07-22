/**
 * Resolve a design-token CSS custom property (an HSL triple such as
 * `25 51% 46%`) into a concrete `hsl(...)` string.
 *
 * Mapbox GL paints onto a canvas/WebGL layer, not the DOM, so it cannot read
 * `hsl(var(--token))` the way a stylesheet can — it needs a resolved color at
 * paint time. This reads the live computed value of the token off the document
 * root so map colors track `tokens.css` (and light/dark theme) instead of
 * hard-coding a hex/hsl literal at the call site.
 */
export function tokenColor(variableName: string, alpha = 1): string {
  const fallbackTriple = '25 51% 46%'; // mirrors --dna-copper; only used if the var cannot be read (e.g. SSR)
  let triple = fallbackTriple;

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(variableName)
      .trim();
    if (value) triple = value;
  }

  return alpha >= 1 ? `hsl(${triple})` : `hsl(${triple} / ${alpha})`;
}
