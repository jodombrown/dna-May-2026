/**
 * WCAG AA contrast regression script
 *
 * Verifies the project's semantic token pairs meet 4.5:1 (normal text)
 * and reports any failing pair. Run with: bun scripts/check-contrast.ts
 */

type HSL = { h: number; s: number; l: number };

const TOKENS = {
  // Light theme pairs (background -> text it carries)
  background: { bg: '34 33% 97%', fg: '20 8% 15%' },
  card: { bg: '0 0% 100%', fg: '20 8% 15%' },
  popover: { bg: '0 0% 100%', fg: '20 8% 15%' },
  primary: { bg: '153 31% 42%', fg: '0 0% 100%' },
  secondary: { bg: '34 33% 94%', fg: '20 8% 15%' },
  muted: { bg: '34 20% 94%', fg: '25 8% 38%' },
  accent: { bg: '25 51% 38%', fg: '0 0% 100%' },
  destructive: { bg: '0 70% 45%', fg: '0 0% 100%' },
  emerald: { bg: '153 31% 42%', fg: '0 0% 100%' },
  emeraldDark: { bg: '153 31% 34%', fg: '0 0% 100%' },
  copper: { bg: '25 51% 46%', fg: '0 0% 100%' },
  copperDark: { bg: '25 51% 37%', fg: '0 0% 100%' },
  forest: { bg: '147 33% 27%', fg: '0 0% 100%' },
  crimson: { bg: '0 70% 45%', fg: '0 0% 100%' },
  black: { bg: '0 0% 10%', fg: '0 0% 100%' },
};

function parseHSL(s: string): HSL {
  const [h, sat, l] = s.split(/\s+/).map((p) => parseFloat(p));
  return { h, s: sat, l };
}

function hslToRgb({ h, s, l }: HSL): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function relLum(rgb: [number, number, number]): number {
  const a = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function contrast(bg: string, fg: string): number {
  const L1 = relLum(hslToRgb(parseHSL(bg)));
  const L2 = relLum(hslToRgb(parseHSL(fg)));
  const [a, b] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (a + 0.05) / (b + 0.05);
}

let fails = 0;
console.log('WCAG AA contrast check (target >= 4.5:1 for normal text)');
console.log('-'.repeat(60));
for (const [name, pair] of Object.entries(TOKENS)) {
  const ratio = contrast(pair.bg, pair.fg);
  const ok = ratio >= 4.5;
  const status = ok ? 'PASS' : 'FAIL';
  if (!ok) fails += 1;
  console.log(`${status.padEnd(6)} ${name.padEnd(14)} ${ratio.toFixed(2)}:1`);
}
console.log('-'.repeat(60));
if (fails > 0) {
  console.error(`${fails} token pair(s) failed WCAG AA.`);
  process.exit(1);
} else {
  console.log('All token pairs pass WCAG AA.');
}
