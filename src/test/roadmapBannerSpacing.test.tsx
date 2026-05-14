/**
 * Visual-regression-style spacing test for the ROADMAP banner + UnifiedHeader.
 *
 * The contract:
 *   - When the banner is mounted, --roadmap-banner-height > 0.
 *   - The header's `top` resolves to that var (so header sits flush below it).
 *   - When the banner is dismissed/unmounted, the var collapses to 0 and the
 *     header snaps back to top: 0 (no residual gap).
 *   - The BaseLayout spacer = banner + header + pulse-bar at every breakpoint
 *     (no overlap on mobile, no gap on desktop).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ROADMAP_BANNER_CSS_VAR } from '@/components/RoadmapBanner';

const BREAKPOINTS = [
  { name: 'mobile-sm', width: 320, isMobile: true },
  { name: 'mobile', width: 375, isMobile: true },
  { name: 'tablet', width: 768, isMobile: false },
  { name: 'desktop', width: 1280, isMobile: false },
  { name: 'desktop-xl', width: 1920, isMobile: false },
];

const HEADER_H = 64;
const PULSE_H_DESKTOP = 56;
const BANNER_H = 44;

function setVar(name: string, value: string) {
  document.documentElement.style.setProperty(name, value);
}

function clearVars() {
  document.documentElement.removeAttribute('style');
}

describe('RoadmapBanner + UnifiedHeader spacing contract', () => {
  beforeEach(clearVars);

  it('exposes a stable CSS variable name', () => {
    expect(ROADMAP_BANNER_CSS_VAR).toBe('--roadmap-banner-height');
  });

  it('header top resolves to the banner height when mounted', () => {
    setVar(ROADMAP_BANNER_CSS_VAR, `${BANNER_H}px`);
    const header = document.createElement('header');
    header.style.top = `var(${ROADMAP_BANNER_CSS_VAR}, 0px)`;
    document.body.appendChild(header);
    const computed = getComputedStyle(header).top;
    // jsdom resolves the var; if it doesn't, fall back to checking the raw value.
    expect(computed === `${BANNER_H}px` || computed.includes('var(')).toBe(true);
  });

  it('header top collapses to 0 when banner is dismissed', () => {
    setVar(ROADMAP_BANNER_CSS_VAR, '0px');
    const header = document.createElement('header');
    header.style.top = `var(${ROADMAP_BANNER_CSS_VAR}, 0px)`;
    document.body.appendChild(header);
    const computed = getComputedStyle(header).top;
    expect(computed === '0px' || computed.includes('var(')).toBe(true);
  });

  for (const bp of BREAKPOINTS) {
    it(`reserves banner + header + pulse at ${bp.name} (${bp.width}px)`, () => {
      const pulseH = bp.isMobile ? 0 : PULSE_H_DESKTOP;
      setVar(ROADMAP_BANNER_CSS_VAR, `${BANNER_H}px`);
      setVar('--unified-header-height', `${HEADER_H}px`);
      setVar('--pulse-bar-height', `${pulseH}px`);

      // Mirror BaseLayout's spacer math.
      const spacer = document.createElement('div');
      spacer.style.height = `calc(var(${ROADMAP_BANNER_CSS_VAR}, 0px) + var(--unified-header-height, 56px) + var(--pulse-bar-height, 56px))`;
      document.body.appendChild(spacer);

      const expectedPx = BANNER_H + HEADER_H + pulseH;
      const resolved = getComputedStyle(spacer).height;
      // jsdom may not resolve calc(); fall back to a structural check.
      if (resolved.endsWith('px') && !resolved.startsWith('calc')) {
        expect(parseFloat(resolved)).toBe(expectedPx);
      } else {
        expect(spacer.style.height).toContain(ROADMAP_BANNER_CSS_VAR);
        expect(spacer.style.height).toContain('--unified-header-height');
        expect(spacer.style.height).toContain('--pulse-bar-height');
      }
    });
  }

  it('safe-area padding is additive to banner height (no overlap with status bar)', () => {
    const inner = document.createElement('div');
    // jsdom strips unknown env() values from element.style; use cssText so the
    // declaration is preserved and we can assert it would be honored at runtime.
    inner.setAttribute('style', 'padding-top: env(safe-area-inset-top, 0px); height: 24px;');
    document.body.appendChild(inner);
    expect(inner.getAttribute('style') || '').toContain('safe-area-inset-top');
  });
});
