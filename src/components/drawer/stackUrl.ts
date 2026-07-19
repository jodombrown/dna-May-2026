/**
 * Drawer stack <-> URL serialization (DR1 step 4).
 *
 * DR0 finding 1: not one of the 28 live sliding containers in the app bound to
 * a URL. Browser back closed nothing, nothing was deep-linkable, nothing
 * survived a refresh. This is net-new construction, not a migration.
 *
 * ── Format ────────────────────────────────────────────────────────────────
 *   ?drawer=account                     surface root
 *   ?drawer=account.privacy             a panel pushed inside a surface
 *   ?drawer=account.privacy*feedback    swapped to a sibling, origin suspended
 *
 *   `*` separates SURFACES (swap chain)
 *   `.` separates PANELS within a surface (push chain)
 *
 * Both separators were chosen EMPIRICALLY, not by taste. `URLSearchParams`
 * percent-encodes most punctuation, and an encoded separator produces URLs like
 * `?drawer=account%7Efeedback` — correct but unshareable and unreadable. Only
 * `* - _ .` survive form-urlencoding intact. `-` and `_` both occur inside real
 * ids (`alpha-test-guide`, `my_posts`), which leaves `*` and `.`.
 *
 * The first draft used `~` and a route-binding test caught it. There is a
 * regression guard for exactly this in `appDrawerShell.test.tsx`; if a
 * separator is ever changed, that guard is the thing that must stay green.
 *
 * ── Why one param ─────────────────────────────────────────────────────────
 * BD135 rule 3 says surfaces never nest. A single param cannot hold two
 * independent open surfaces, so the rule stops being a discipline someone has
 * to remember and becomes a property of the data structure. Do not add a second
 * param to work around this; if two surfaces need to be open at once, the rule
 * is wrong and that is a BD, not a patch.
 */

export const DRAWER_PARAM = 'drawer';

export interface SerializedSurface {
  surfaceId: string;
  /** Panels pushed on top of the surface root. Empty means the root. */
  panelIds: string[];
}

const SURFACE_SEP = '*';
const PANEL_SEP = '.';

/** Ids must round-trip cleanly, so the separators are not permitted inside them. */
export function isValidId(id: string): boolean {
  return id.length > 0 && !id.includes(SURFACE_SEP) && !id.includes(PANEL_SEP);
}

export function serializeStack(stack: SerializedSurface[]): string {
  return stack
    .map((s) => [s.surfaceId, ...s.panelIds].join(PANEL_SEP))
    .join(SURFACE_SEP);
}

/**
 * Tolerant by design: a hand-edited or truncated URL yields the best valid
 * prefix rather than throwing. A bad URL should degrade to a closed drawer or a
 * shallower one, never to a crashed app.
 */
export function parseStack(raw: string | null): SerializedSurface[] {
  if (!raw) return [];
  const out: SerializedSurface[] = [];
  for (const chunk of raw.split(SURFACE_SEP)) {
    if (!chunk) continue;
    const [surfaceId, ...panelIds] = chunk.split(PANEL_SEP).filter(Boolean);
    if (!surfaceId) continue;
    out.push({ surfaceId, panelIds });
  }
  return out;
}

/** Total depth across surfaces and panels. Back is available when > 1. */
export function stackDepth(stack: SerializedSurface[]): number {
  return stack.reduce((n, s) => n + 1 + s.panelIds.length, 0);
}
