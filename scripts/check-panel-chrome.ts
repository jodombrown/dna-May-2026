#!/usr/bin/env tsx
/**
 * Chrome-in-panel guard (BD135 rule 5, BD110 one layer down).
 *
 * The shell owns chrome. A surface or panel that renders its own sliding
 * container, scrim, header, close or full-page frame does not merge.
 *
 * ── Why this ships WITH the migration and not before it ────────────────────
 * Against `main` before DR2 this gate failed most of the tree on day one:
 * seven settings pages render inside drawer panels via `SettingsLayout`, which
 * rendered `<UnifiedHeader />`, a `min-h-screen` frame, a Back-to-Feed button
 * and a seven-item sidebar — an entire page inside a 448px panel. A gate that
 * has to be muted to merge is not a gate, so it lands in the cycle that fixes
 * the thing it detects.
 *
 * ── Two checks, both deterministic, no heuristics ──────────────────────────
 *
 * A. Nothing in `src/components/drawer/` renders chrome. That module is the
 *    shell and its surfaces; `AppDrawer.tsx` IS the shell and is the single
 *    exemption. This is BD135 rule 5 stated exactly.
 *
 * B. No drawer panel reaches chrome that is not panel-aware. Panels are read
 *    from the `React.lazy` imports in `AccountSurface.tsx` — the live list, not
 *    a second one maintained here. For each panel, this walks its local imports
 *    one level; any module that renders chrome must reference
 *    `useIdentitySheetSafe`, which is how a shared layout tells route context
 *    from panel context. Direct chrome in the panel file itself is held to the
 *    same rule.
 *
 *    One level of indirection is deliberate. Every chrome path a panel has
 *    today goes page -> layout -> chrome, and a full transitive walk would turn
 *    a deterministic gate into a reachability estimate.
 *
 * ── Matching discipline (earned in DR1, four times) ────────────────────────
 * Comments and string literals are stripped before matching. A structural gate
 * that reads source WILL otherwise match the prose about the thing it looks
 * for, the error copy that names it, and — in DR1 — a regex literal inside the
 * assertion written to prevent the violation.
 *
 * Every matcher carries a self-check. A gate that reports clean while seeing
 * zero files is a vacuous green, and it is worse than a red one.
 *
 * Run:
 *   tsx scripts/check-panel-chrome.ts
 *
 * Exit codes:
 *   0  no violations
 *   1  violations found, or the gate could not establish its own preconditions
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = process.cwd();

/**
 * Two vocabularies, because they are two different violations.
 *
 * FRAME chrome is page furniture: an app header, a bottom nav, a full-viewport
 * frame. A panel is not a page, so a panel must never render these. This was
 * one blunt list on the gate's first run and it over-fired: it flagged a
 * hashtag panel for opening a confirm dialog, which is not the disease.
 */
const FRAME_COMPONENTS = ['UnifiedHeader', 'DnaMobileHeader', 'MobileBottomNav'];
const FRAME_CLASSES = ['min-h-screen'];

/**
 * CONTAINER primitives are the sliding containers themselves. A drawer surface
 * that builds one is reimplementing the shell, which is the exact disease
 * BD135 names. But a panel that OPENS a dialog on top of itself is doing
 * something ordinary and correct, so these are checked only inside the drawer
 * module, never against panel content.
 */
const CONTAINER_COMPONENTS = ['SheetContent', 'DrawerContent', 'DialogContent', 'ResponsiveModal'];

/** The one file that IS the shell. */
const SHELL_FILE = 'src/components/drawer/AppDrawer.tsx';

/** The detector a shared layout uses to tell panel context from route context. */
const PANEL_AWARE = 'useIdentitySheetSafe';

const SURFACE_FILE = 'src/components/drawer/surfaces/AccountSurface.tsx';

interface Violation {
  file: string;
  found: string;
  why: string;
}

/**
 * Strip block comments, line comments and string/template literals.
 * Order matters: comments first, then literals.
 */
function strip(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g, "''");
}

function read(file: string): string {
  return readFileSync(resolve(ROOT, file), 'utf8');
}

function mountsIn(source: string, components: string[]): string[] {
  const code = strip(source);
  return components.filter((c) => new RegExp(`<${c}[\\s\\n/>]`).test(code)).map((c) => `<${c}>`);
}

/** Page furniture: a panel must never render this. */
function frameIn(source: string): string[] {
  const hits = mountsIn(source, FRAME_COMPONENTS);
  // Class names live inside the string literals `strip` removes, so classes are
  // matched against the raw source with comments taken out.
  const noComments = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const cls of FRAME_CLASSES) {
    if (new RegExp(`\\b${cls}\\b`).test(noComments)) hits.push(cls);
  }
  return hits;
}

/** Frame furniture plus sliding containers: nothing in the drawer module owns either. */
function drawerChromeIn(source: string): string[] {
  return [...frameIn(source), ...mountsIn(source, CONTAINER_COMPONENTS)];
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry === '_archived') continue;
      walk(full, out);
    } else if (full.endsWith('.tsx') && !full.includes('.test.')) {
      out.push(relative(ROOT, full));
    }
  }
  return out;
}

/** Resolve an `@/...` import to a file on disk, or null. */
function resolveAlias(spec: string): string | null {
  if (!spec.startsWith('@/')) return null;
  const base = join('src', spec.slice(2));
  for (const candidate of [`${base}.tsx`, `${base}.ts`, join(base, 'index.tsx'), join(base, 'index.ts')]) {
    if (existsSync(resolve(ROOT, candidate))) return candidate;
  }
  return null;
}

function localImportsOf(source: string): string[] {
  const specs = new Set<string>();
  for (const m of strip(source).matchAll(/from\s+'(@\/[^']+)'/g)) specs.add(m[1]);
  // `strip` blanked the literals, so re-read specifiers from the raw source.
  for (const m of source.matchAll(/^\s*import[\s\S]*?from\s+'(@\/[^']+)';/gm)) specs.add(m[1]);
  return [...specs].map(resolveAlias).filter((f): f is string => f !== null);
}

function checkDrawerModule(): Violation[] {
  const dir = resolve(ROOT, 'src/components/drawer');
  if (!existsSync(dir)) {
    console.error('panel-chrome: src/components/drawer does not exist. Failing closed.');
    process.exit(1);
  }
  const files = walk(dir).filter((f) => f !== SHELL_FILE);
  if (files.length === 0) {
    console.error('panel-chrome: found zero drawer files to check. A gate that sees nothing is not a gate. Failing closed.');
    process.exit(1);
  }
  const violations: Violation[] = [];
  for (const file of files) {
    for (const found of drawerChromeIn(read(file))) {
      violations.push({
        file,
        found,
        why: 'a drawer surface renders chrome the shell already owns (BD135 rule 5)',
      });
    }
  }
  return violations;
}

/** Panel page files, read from the live lazy imports in AccountSurface. */
function panelFiles(): string[] {
  const source = read(SURFACE_FILE);
  const files = new Set<string>();
  for (const m of source.matchAll(/React\.lazy\(\(\)\s*=>\s*import\('(@\/[^']+)'\)\)/g)) {
    const resolved = resolveAlias(m[1]);
    if (resolved) files.add(resolved);
  }
  return [...files];
}

function checkPanels(): Violation[] {
  const panels = panelFiles();
  if (panels.length === 0) {
    console.error(`panel-chrome: parsed zero panels out of ${SURFACE_FILE}. The matcher is broken or the surface moved. Failing closed.`);
    process.exit(1);
  }

  const violations: Violation[] = [];
  for (const panel of panels) {
    const panelSource = read(panel);

    // Chrome rendered directly by the panel.
    if (!panelSource.includes(PANEL_AWARE)) {
      for (const found of frameIn(panelSource)) {
        violations.push({
          file: panel,
          found,
          why: `a drawer panel renders chrome and is not panel-aware (no ${PANEL_AWARE})`,
        });
      }
    }

    // Chrome reached one level out, through a shared layout.
    for (const dep of localImportsOf(panelSource)) {
      const depSource = read(dep);
      const found = frameIn(depSource);
      if (found.length === 0) continue;
      if (depSource.includes(PANEL_AWARE)) continue;
      violations.push({
        file: dep,
        found: found.join(', '),
        why: `renders chrome and is imported by the drawer panel ${panel}, but is not panel-aware (no ${PANEL_AWARE})`,
      });
    }
  }
  return violations;
}

function main(): void {
  // Matcher self-check: the chrome vocabulary must match SOMETHING in the tree,
  // or every clean result below is vacuous.
  const all = walk(resolve(ROOT, 'src'));
  const anyChrome = all.some((f) => drawerChromeIn(read(f)).length > 0);
  if (!anyChrome) {
    console.error('panel-chrome: the chrome matcher found no chrome anywhere in src. It is broken. Failing closed.');
    process.exit(1);
  }

  const violations = [...checkDrawerModule(), ...checkPanels()];

  if (violations.length === 0) {
    console.log('panel-chrome: OK - no surface or panel renders chrome the shell owns.');
    process.exit(0);
  }

  console.error('\nChrome rendered inside a drawer surface or panel:\n');
  const seen = new Set<string>();
  for (const v of violations) {
    const key = `${v.file}|${v.found}`;
    if (seen.has(key)) continue;
    seen.add(key);
    console.error(`  ${v.file}`);
    console.error(`    found: ${v.found}`);
    console.error(`    why:   ${v.why}\n`);
  }
  console.error(
    'The shell owns anchor edge, scrim, header, back, close and safe areas.\n' +
      `A layout shared between a route and a panel branches on ${PANEL_AWARE}().\n`,
  );
  process.exit(1);
}

main();
