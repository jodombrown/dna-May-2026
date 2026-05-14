#!/usr/bin/env tsx
/**
 * check-adinkra-usage.ts
 *
 * Regression guard for Adinkra icon usage. Per the Anti Vibe-Coded Doctrine:
 *  - Adinkra icons are reserved for Five C identity surfaces and DIA.
 *  - They MUST NOT be added as decoration in generic feed/UI chrome.
 *
 * This script flags NEW Adinkra icon imports in files outside the recognised
 * identity surfaces. The current state of the codebase is captured in a
 * baseline file (`scripts/.adinkra-baseline.json`); only deltas against that
 * baseline fail the check, so we lock in today's truth without forcing a
 * mass refactor in a single PR.
 *
 * Run: `tsx scripts/check-adinkra-usage.ts`
 *      `tsx scripts/check-adinkra-usage.ts --update` (regenerate baseline)
 */
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(process.cwd(), 'src');
const BASELINE = join(process.cwd(), 'scripts', '.adinkra-baseline.json');

const ICONS = new Set([
  'Sankofa',
  'Nkonsonkonson',
  'FuntunfunefuDenkyemfunefu',
  'Adinkrahene',
  'Mpatapo',
  'MateMasie',
]);

const FILE_EXEMPT = [
  /components\/icons\/adinkra\//,
  /pages\/DesignSystem/,
  /pages\/dna\/IconUsageGuide/,
  /scripts\//,
  /_archived\//,
  /\.test\.(t|j)sx?$/,
];

function walk(dir: string, out: string[] = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(name)) out.push(p);
  }
  return out;
}

type Usage = { file: string; icon: string };

function collect(): Usage[] {
  const out: Usage[] = [];
  for (const file of walk(ROOT)) {
    const rel = relative(process.cwd(), file).replace(/\\/g, '/');
    if (FILE_EXEMPT.some((r) => r.test(rel))) continue;
    const src = readFileSync(file, 'utf8');
    if (!/from\s+['"]@\/components\/icons\/adinkra/.test(src)) continue;
    const matches = src.matchAll(
      /import\s*(?:type\s*)?\{([^}]+)\}\s*from\s+['"]@\/components\/icons\/adinkra(?:\/[^'"]+)?['"]/g,
    );
    for (const m of matches) {
      for (const part of m[1].split(',')) {
        const icon = part.trim().split(/\s+as\s+/)[0].trim();
        if (ICONS.has(icon)) out.push({ file: rel, icon });
      }
    }
  }
  return out.sort((a, b) =>
    a.file.localeCompare(b.file) || a.icon.localeCompare(b.icon),
  );
}

const key = (u: Usage) => `${u.file}::${u.icon}`;
const current = collect();

if (process.argv.includes('--update')) {
  writeFileSync(BASELINE, JSON.stringify(current.map(key), null, 2));
  console.log(`[Adinkra usage] Baseline updated (${current.length} entries).`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  writeFileSync(BASELINE, JSON.stringify(current.map(key), null, 2));
  console.log(`[Adinkra usage] Baseline created (${current.length} entries).`);
  process.exit(0);
}

const baseline = new Set<string>(JSON.parse(readFileSync(BASELINE, 'utf8')));
const added = current.filter((u) => !baseline.has(key(u)));

if (added.length) {
  console.error('\n[Adinkra usage] NEW Adinkra icon usage detected:\n');
  for (const u of added) console.error(`  ${u.file}  ${u.icon}`);
  console.error(
    '\nAdinkra icons are reserved for Five C identity surfaces and DIA.',
  );
  console.error(
    'If this is a legitimate identity surface, run:\n  tsx scripts/check-adinkra-usage.ts --update\n',
  );
  process.exit(1);
}

console.log(`[Adinkra usage] OK - no new decorative usage (${current.length} tracked).`);
