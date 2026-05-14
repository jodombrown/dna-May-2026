#!/usr/bin/env tsx
// After Phase 5 completes the sweep, remove LINT_TOKENS_MODE handling
// and restore strict-only enforcement on prebuild.
/**
 * Phase 3 Token Lock-In — forbidden class lint guard.
 *
 * Scans src/**\/*.{ts,tsx,css} for AI-tell Tailwind palette usage that
 * violates the DNA Design Standards (mem://style/anti-vibe-coded-doctrine).
 *
 * Default: exit 1 on any forbidden match (strict gate).
 * With LINT_TOKENS_MODE=warn: print violations as warnings and exit 0
 * (advisory mode used by `prebuild` until the Phase 5 sweep lands).
 *
 * Wire via package.json:
 *   "lint:tokens": "tsx scripts/check-forbidden-classes.ts"   // strict
 *   "prebuild":    "LINT_TOKENS_MODE=warn npm run lint:tokens" // advisory
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

const FORBIDDEN_FAMILIES = [
  'purple', 'violet', 'indigo', 'pink', 'fuchsia', 'zinc', 'slate',
] as const;

// Match `bg-purple-500`, `text-violet-600/40`, `from-indigo-300`, `via-pink-200`,
// `to-fuchsia-700`, `border-slate-200`, etc. Word-boundary anchored.
const FORBIDDEN_RE = new RegExp(
  String.raw`\b(?:bg|text|border|from|via|to|ring|placeholder|decoration|divide|outline|shadow|fill|stroke|caret|accent)-(?:` +
  FORBIDDEN_FAMILIES.join('|') +
  String.raw`)-(?:50|100|200|300|400|500|600|700|800|900|950)\b`,
  'g',
);

const GRAY_RE = /\b(?:bg|text|border|from|via|to|ring)-gray-(?:50|100|200|300|400|500|600|700|800|900|950)\b/g;

const EXTS = new Set(['.ts', '.tsx', '.css']);
const SKIP_DIRS = new Set(['node_modules', 'dist', '.next', '.turbo', 'build']);

interface Hit {
  file: string;
  line: number;
  match: string;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const s = statSync(full);
    if (s.isDirectory()) walk(full, out);
    else {
      const dot = name.lastIndexOf('.');
      if (dot >= 0 && EXTS.has(name.slice(dot))) out.push(full);
    }
  }
  return out;
}

function scan(file: string, re: RegExp): Hit[] {
  const text = readFileSync(file, 'utf8');
  const hits: Hit[] = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      hits.push({ file, line: i + 1, match: m[0] });
    }
  }
  return hits;
}

function main(): void {
  const files = walk(SRC);
  const forbidden: Hit[] = [];
  const grayWarnings: Hit[] = [];

  for (const f of files) {
    forbidden.push(...scan(f, FORBIDDEN_RE));
    grayWarnings.push(...scan(f, GRAY_RE));
  }

  if (grayWarnings.length > 0) {
    console.warn(
      `\n[lint:tokens] gray-* usage flagged for Phase 5 review (${grayWarnings.length} occurrences). ` +
      `Allowed transitionally; do not add new ones.`,
    );
  }

  if (forbidden.length === 0) {
    console.log('[lint:tokens] OK — no forbidden palette usage found.');
    process.exit(0);
  }

  const warnMode = process.env.LINT_TOKENS_MODE === 'warn';
  const log = warnMode ? console.warn : console.error;
  const label = warnMode ? '[lint:tokens][warn]' : '[lint:tokens]';

  log(`\n${label} ${forbidden.length} forbidden palette violation(s) found:\n`);
  for (const h of forbidden) {
    log(`  ${relative(ROOT, h.file)}:${h.line}  ${h.match}`);
  }
  log(
    `\nForbidden palettes (per DNA Design Standards): ${FORBIDDEN_FAMILIES.join(', ')}.\n` +
    `Use Emerald / Forest / Copper / warm neutrals via semantic tokens instead.\n`,
  );

  if (warnMode) {
    log(`${label} advisory mode (LINT_TOKENS_MODE=warn) — not failing the build.`);
    process.exit(0);
  }
  process.exit(1);
}

main();
