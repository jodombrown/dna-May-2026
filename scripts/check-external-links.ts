/**
 * External link validator
 *
 * Scans source files for http(s) URLs used as citations / hrefs and verifies
 * each one returns a non-4xx status. Fails the process with exit code 1 if
 * any dead link is found so it can gate CI / pre-deploy.
 *
 * Usage:
 *   npm run lint:links              # scan default globs
 *   npm run lint:links -- --quick   # only check URLs changed vs origin/main
 *
 * Config:
 *   - SCAN_DIRS: which folders to scan
 *   - ALLOWLIST_HOSTS: hosts that are known to block HEAD/GET from CI
 *     (they will be skipped, not failed)
 *   - CONCURRENCY / TIMEOUT_MS: tune network behavior
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const SCAN_DIRS = ['src', 'index.html', 'public/llms.txt'];
const FILE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.md', '.mdx', '.html', '.txt']);
const CONCURRENCY = 8;
const TIMEOUT_MS = 10_000;
const RETRIES = 1;

// Hosts to skip. These are either:
//   - internal / local
//   - well-known to block bot traffic (LinkedIn, X, Instagram, etc.)
//   - example / placeholder domains
const ALLOWLIST_HOSTS = new Set<string>([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'example.com',
  'example.org',
  'your-domain.com',
  'linkedin.com',
  'www.linkedin.com',
  'x.com',
  'twitter.com',
  'instagram.com',
  'www.instagram.com',
  'facebook.com',
  'www.facebook.com',
  // Supabase project URLs are validated by other checks
  'ybhssuehmfnxrzneobok.supabase.co',
]);

// Ignore obvious non-link matches
const IGNORED_PATH_PREFIXES = [
  '/schema/',   // JSON-LD @context
  '/ns/',
  '/2000/svg',  // xmlns
  '/1999/xhtml',
];

// Match http(s) URLs. Stops at whitespace, quotes, backticks, angle brackets,
// closing brackets/parens, and trailing punctuation.
const URL_RE = /https?:\/\/[^\s"'`<>)\]}]+/g;

interface Finding {
  url: string;
  file: string;
  line: number;
  status?: number;
  error?: string;
}

function walk(path: string, out: string[] = []): string[] {
  let stat;
  try {
    stat = statSync(path);
  } catch {
    return out;
  }
  if (stat.isFile()) {
    if (FILE_EXTS.has(extname(path))) out.push(path);
    return out;
  }
  if (!stat.isDirectory()) return out;
  for (const entry of readdirSync(path)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    walk(join(path, entry), out);
  }
  return out;
}

function extractUrls(files: string[]): Map<string, { file: string; line: number }[]> {
  const seen = new Map<string, { file: string; line: number }[]>();
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      const matches = line.match(URL_RE);
      if (!matches) return;
      for (const raw of matches) {
        // Strip trailing punctuation the regex left in
        const url = raw.replace(/[.,;:!?]+$/, '');
        let parsed: URL;
        try {
          parsed = new URL(url);
        } catch {
          continue;
        }
        if (ALLOWLIST_HOSTS.has(parsed.hostname)) continue;
        if (IGNORED_PATH_PREFIXES.some((p) => parsed.pathname.startsWith(p))) continue;
        // Skip pure asset URLs baked in by build tools
        if (parsed.hostname.endsWith('.lovable.app')) continue;
        if (parsed.hostname.endsWith('.supabase.co')) continue;

        const list = seen.get(url) ?? [];
        list.push({ file, line: i + 1 });
        seen.set(url, list);
      }
    });
  }
  return seen;
}

async function checkOnce(url: string, method: 'HEAD' | 'GET'): Promise<number | 'network'> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        // Some sites 403 default fetch UA; use a browser-like one.
        'user-agent':
          'Mozilla/5.0 (compatible; DNA-LinkChecker/1.0; +https://diasporanetwork.africa)',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
      },
    });
    return res.status;
  } catch {
    return 'network';
  } finally {
    clearTimeout(timer);
  }
}

async function checkUrl(url: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    // Try HEAD first (cheap), fall back to GET on 405/403/network.
    let status = await checkOnce(url, 'HEAD');
    if (status === 'network' || status === 403 || status === 405 || status === 501) {
      status = await checkOnce(url, 'GET');
    }
    if (status === 'network') {
      if (attempt === RETRIES) return { ok: false, error: 'network error / timeout' };
      continue;
    }
    // 2xx and 3xx are fine (redirect: follow gives us the final status).
    // 401/403 mean "reachable but auth-gated" -- not a dead link.
    if (status < 400 || status === 401 || status === 403 || status === 429) {
      return { ok: true, status };
    }
    if (attempt === RETRIES) return { ok: false, status };
  }
  return { ok: false, error: 'unknown' };
}

async function runPool<T, R>(items: T[], worker: (t: T) => Promise<R>, size: number): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await worker(items[i]);
    }
  });
  await Promise.all(runners);
  return results;
}

async function main() {
  const files = SCAN_DIRS.flatMap((p) => walk(p));
  console.log(`[link-check] scanning ${files.length} files...`);
  const urlMap = extractUrls(files);
  const urls = [...urlMap.keys()].sort();
  console.log(`[link-check] found ${urls.length} unique external URLs`);

  const findings: Finding[] = [];
  let checked = 0;

  await runPool(
    urls,
    async (url) => {
      const result = await checkUrl(url);
      checked++;
      if (checked % 20 === 0) {
        console.log(`[link-check] progress: ${checked}/${urls.length}`);
      }
      if (!result.ok) {
        for (const loc of urlMap.get(url) ?? []) {
          findings.push({ url, file: loc.file, line: loc.line, status: result.status, error: result.error });
        }
      }
    },
    CONCURRENCY,
  );

  if (findings.length === 0) {
    console.log(`\n✅ All ${urls.length} external links are reachable.`);
    process.exit(0);
  }

  console.error(`\n❌ Found ${findings.length} dead external link reference(s):\n`);
  for (const f of findings) {
    const reason = f.status ? `HTTP ${f.status}` : f.error ?? 'unknown';
    console.error(`  ${f.file}:${f.line}`);
    console.error(`    ${f.url}`);
    console.error(`    → ${reason}\n`);
  }
  console.error(
    'Fix the URLs above (or add the host to ALLOWLIST_HOSTS in scripts/check-external-links.ts if it is a false positive).',
  );
  process.exit(1);
}

main().catch((err) => {
  console.error('[link-check] fatal error:', err);
  process.exit(2);
});
