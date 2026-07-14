// Curated-event identity helpers.
//
// A curated event is one DNA has seen at a source, not one DNA hosts. The
// events row carries no host column — curated_source names the discovery
// agent (e.g. "perplexity"), not the host — so the only honest host identity
// is the source itself: the domain people will register at. These helpers
// centralise that derivation so the card, the cover, and the detail page
// cannot disagree about who the host is or whether an image is real.

/** "https://www.nyadiff.org/x?y" → "nyadiff.org". Returns '' for junk. */
export function curatedSourceDomain(url?: string | null): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * The name that leads a curated card: the organizer when DNA actually knows
 * one, else the source domain (the place the viewer will register). Never
 * the discovery agent, never a placeholder — '' when nothing is known.
 */
export function curatedHostName(e: {
  organizer_name?: string | null;
  curated_source_url?: string | null;
}): string {
  return e.organizer_name || curatedSourceDomain(e.curated_source_url);
}

// Stock-photo hosts. A photograph of strangers in a room that is not the
// room is the same fabrication as a made-up venue: if the cover didn't come
// from the event's source, it doesn't render.
const STOCK_IMAGE_HOSTS = [
  'images.unsplash.com',
  'unsplash.com',
  'images.pexels.com',
  'pexels.com',
  'picsum.photos',
  'source.unsplash.com',
];

export function isStockImage(url?: string | null): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return STOCK_IMAGE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/**
 * The cover a curated surface may show: the source's own image, or null —
 * in which case the surface renders a typographic cover (host + city set
 * large), never stock photography.
 */
export function realCuratedCover(e: {
  cover_image_url?: string | null;
}): string | null {
  const url = e.cover_image_url || null;
  return url && !isStockImage(url) ? url : null;
}
