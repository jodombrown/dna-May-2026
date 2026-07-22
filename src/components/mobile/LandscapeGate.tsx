/**
 * LandscapeGate (BD158) — the honest notice that landscape is unbuilt.
 *
 * This is a SCOPE CUT wearing a feature's clothes. Landscape layout is
 * unfinished at v0.0 and we are choosing not to finish it, so we say so plainly
 * instead of letting a member discover it as breakage. When landscape gets
 * built, this component is deleted rather than configured.
 *
 * ── The media query is the whole risk ──────────────────────────────────────
 * A bare `(orientation: landscape)` matches EVERY DESKTOP MONITOR. Shipped
 * unscoped it would blur the entire web app behind a rotate-your-phone message
 * for every desktop member. The height bound is what makes this a phone rule:
 * a phone on its side is short, a desktop and an iPad in landscape are not.
 *
 * Do not relax `max-height` without re-testing an iPad in landscape, which is a
 * legitimate way to use DNA and must never be caught.
 *
 * ── Dismissible, deliberately (WCAG 2.1 SC 1.3.4, Level AA) ────────────────
 * Content must not restrict its view to a single orientation unless that
 * orientation is essential. Ours is not essential, it is unfinished, and the
 * people most likely to need landscape are the ones least able to choose it:
 * mounted devices, wheelchair mounts, assistive rigs where the phone's
 * orientation is not the member's to set. Almost everyone will rotate. The few
 * who cannot are not locked out of the platform built for their return.
 *
 * The dismissal is per-rotation on purpose. Rotating back to portrait and
 * returning to landscape shows the notice again, because the second visit is
 * usually a different member on a shared device or a different intent, and a
 * remembered dismissal would silently hide a known-broken layout forever.
 */

import * as React from 'react';

/** A phone on its side. Not a desktop, not an iPad. */
const PHONE_LANDSCAPE = '(orientation: landscape) and (max-height: 500px)';

/**
 * Above every band in the app, including alert-dialog.
 *
 * Written as a constant and applied inline, matching `DRAWER_Z_INDEX` in
 * `components/drawer/constants.ts`, because `tailwind.config.ts` declares no
 * `zIndex` scale: a `z-*` utility beyond Tailwind's defaults renders NOTHING.
 * The bands, per that file: sheet 999/1000, drawer 1060, alert-dialog 1100.
 *
 * This one sits on top of all of them on purpose. If landscape is unbuilt, an
 * open drawer over a broken landscape layout is not a state worth preserving.
 */
const LANDSCAPE_GATE_Z_INDEX = 1200;

export function LandscapeGate() {
  const [isPhoneLandscape, setIsPhoneLandscape] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(PHONE_LANDSCAPE);

    const apply = (matches: boolean) => {
      setIsPhoneLandscape(matches);
      // Rotating back to portrait rearms the notice. See the note above.
      if (!matches) setDismissed(false);
    };

    apply(mq.matches);
    const onChange = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  if (!isPhoneLandscape || dismissed) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="landscape-gate-title"
      style={{ zIndex: LANDSCAPE_GATE_Z_INDEX }}
      className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 px-6 text-center backdrop-blur-md"
    >
      <h2 id="landscape-gate-title" className="text-h3 text-foreground">
        Turn your phone upright.
      </h2>
      <p className="text-body text-muted-foreground">DNA is built for portrait.</p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        // `min-h-11` is 44px, the iOS minimum target. NOT `min-h-touch`: that
        // token is live at five sites on main and does not exist in the config.
        className="min-h-11 rounded-full px-4 text-meta text-muted-foreground underline hover:text-foreground"
      >
        Continue anyway
      </button>
    </div>
  );
}

export default LandscapeGate;
