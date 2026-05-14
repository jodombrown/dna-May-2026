/**
 * DNA Clickability Scanner
 *
 * Heuristically scans /dna/* surfaces for "stat-like" elements (counts,
 * metrics, chips, tiles) that are not wrapped in an interactive element
 * (button, a, Link, or have onClick / to / href / role="button").
 *
 * Advisory only - exits 0. Run via:
 *   bunx tsx scripts/check-dna-clickability.ts
 */
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['src/pages/dna', 'src/components'];
const REPORT_PATH = 'audit-reports/dna-clickability.md';

const STAT_HINT = /\b(stat|metric|count|tile|chip|kpi|badge-count)\b/i;
const NUMBER_LABEL = /\{[^}]*\b(count|total|length|value|num|stats?\.[a-zA-Z]+)\b[^}]*\}/;
const INTERACTIVE_HINT =
  /(onClick=|onPress=|to=|href=|role=["']button["']|<button|<a |<Link|<NavLink|StatLink|<button>|<a>)/;

interface Finding {
  file: string;
  line: number;
  snippet: string;
  reason: string;
}

const findings: Finding[] = [];

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(tsx|jsx)$/.test(e)) out.push(p);
  }
  return out;
}

function scanFile(file: string) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const looksLikeStat = STAT_HINT.test(line) || NUMBER_LABEL.test(line);
    if (!looksLikeStat) continue;
    // Look at a 4-line window for an interactive ancestor.
    const start = Math.max(0, i - 3);
    const end = Math.min(lines.length, i + 4);
    const window = lines.slice(start, end).join('\n');
    if (INTERACTIVE_HINT.test(window)) continue;
    findings.push({
      file: relative(ROOT, file),
      line: i + 1,
      snippet: line.trim().slice(0, 160),
      reason: 'Stat/metric pattern with no interactive ancestor in 7-line window',
    });
  }
}

const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));
files.forEach(scanFile);

mkdirSync(join(ROOT, 'audit-reports'), { recursive: true });

const md = [
  '# DNA Clickability Report',
  '',
  `Generated: ${new Date().toISOString()}`,
  `Files scanned: ${files.length}`,
  `Potential issues: ${findings.length}`,
  '',
  '> Heuristic scan. False positives expected. Use this as a triage list,',
  '> not a hard gate. Each entry is a stat-like element with no nearby',
  '> button/link/onClick handler.',
  '',
  '| File | Line | Snippet |',
  '| --- | ---: | --- |',
  ...findings.map(
    (f) => `| \`${f.file}\` | ${f.line} | \`${f.snippet.replace(/\|/g, '\\|')}\` |`,
  ),
  '',
].join('\n');

writeFileSync(join(ROOT, REPORT_PATH), md);

console.log(`Scanned ${files.length} files. ${findings.length} potential issues.`);
console.log(`Report: ${REPORT_PATH}`);
process.exit(0);
