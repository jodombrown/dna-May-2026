#!/usr/bin/env tsx
/**
 * Type-scale guard — no phantom font-size tokens.
 *
 * ── The bug this closes ────────────────────────────────────────────────────
 * An unknown Tailwind class is not an error. It compiles, it ships, and it
 * renders nothing. `text-caption` looked like a DNA token, was used in six
 * places including the most-tapped surface in the app, and had never existed:
 * the real scale in `tailwind.config.ts` is
 *
 *     hero  display  h1  h2  h3  body  meta  micro
 *
 * `text-title` was live in three more places and was equally imaginary.
 *
 * The cause was documentation. `CLAUDE.md` stated the scale as
 * `caption small body lead title heading display` — five of those seven do not
 * exist — directly beneath a correct warning that an off-scale size "will
 * silently render nothing." Anyone following our own doc wrote the bug.
 *
 * ── Why a gate and not a fixed doc ─────────────────────────────────────────
 * The doc is fixed too. But a doc is a claim and a config is a fact, and the
 * existing design-system gate could not tell them apart: it bans the Tailwind
 * defaults (`text-xs` … `text-9xl`) and says nothing about invented tokens, so
 * it pushed authors off real classes and left the imaginary ones unguarded. A
 * manual invariant with no detector is a scheduled outage.
 *
 * So this reads the scale out of `tailwind.config.ts` at run time. When the
 * scale changes, the gate changes with it, and no doc has to be believed.
 *
 * ── How a size is told apart from a colour ─────────────────────────────────
 * `text-` is overloaded across size, colour and alignment. Everything allowed
 * is derived from the config or from Tailwind's own built-ins:
 *   · font sizes            parsed from the config's `fontSize` block
 *   · semantic colours      parsed from the config's `colors` block
 *   · palette colours       any token carrying a numeric shade (`-600`, `/40`)
 *   · built-in utilities    alignment, wrapping, overflow, keyword colours
 * A bare word that survives all four is a token nothing defines.
 *
 * Comments are stripped before matching; string literals are NOT, because a
 * className IS a string literal. A previous census matched the words
 * `text-level` inside a test comment and briefly counted it as a live usage.
 *
 * Run:
 *   tsx scripts/check-type-scale.ts
 *
 * Exit codes:
 *   0  every text-* token resolves
 *   1  phantom token found, or the gate could not establish its preconditions
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = process.cwd();
const CONFIG = 'tailwind.config.ts';
const EXTS = new Set(['.ts', '.tsx', '.css']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.next', '.turbo', '_archived']);

/** Tailwind's own non-size `text-` utilities. */
const BUILT_IN = new Set([
  'left', 'center', 'right', 'justify', 'start', 'end',
  'wrap', 'nowrap', 'balance', 'pretty',
  'clip', 'ellipsis',
  'transparent', 'current', 'inherit', 'white', 'black',
]);

/**
 * CSS properties that begin with `text-`. These are declarations, not classes,
 * and the first run of this gate flagged `text-align: center` in `App.css`.
 */
const CSS_PROPERTIES = new Set([
  'align', 'decoration', 'transform', 'overflow', 'shadow',
  'indent', 'rendering', 'wrap', 'emphasis', 'orientation', 'combine-upright',
  'decoration-color', 'decoration-line', 'decoration-style', 'decoration-thickness',
  'underline-offset', 'size-adjust', 'justify',
]);

/** Tailwind default type scale. Banned elsewhere, but they do resolve. */
const TW_SIZES = new Set([
  'xs', 'sm', 'base', 'lg', 'xl',
  '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl',
]);

function fail(message: string): never {
  console.error(`[lint:scale] ${message}`);
  process.exit(1);
}

/**
 * Extract a `key: { ... }` block by matching braces, not by regex.
 *
 * The first version of this gate sliced from `colors:` to end-of-file and
 * treated every key after it as an allowed colour. That pulled in `keyframes`,
 * `animation`, `borderRadius` and `boxShadow` along with every animation name,
 * shadow name and radius in the config — so `text-heartbeat`, `text-float` and
 * `text-dna-glow` would all have passed as "colours".
 *
 * It failed safe (under-firing, never blocking a real token) and it still caught
 * every phantom that actually existed. But this gate's entire claim is that it
 * derives its allowlist from the artifact precisely. An allowlist containing
 * every animation name is not a derivation; it is a coincidence that happened to
 * exclude `caption` and `title`. So both blocks are now bounded exactly.
 *
 * Quote-aware, because config keys are sometimes quoted and a brace inside a
 * string would otherwise throw the count off.
 */
function blockAt(source: string, key: string): string | null {
  const anchor = source.search(new RegExp(`(^|[^a-zA-Z])${key}\\s*:\\s*\\{`, 'm'));
  if (anchor < 0) return null;
  const open = source.indexOf('{', anchor);
  let depth = 0;
  let quote: string | null = null;
  for (let i = open; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (ch === '\\') i += 1;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  return null;
}

/**
 * Keys declared inside a bounded block, quote- and depth-aware.
 *
 * `topLevelOnly` matters and the two blocks want opposite answers. A font size
 * nests its own `lineHeight` / `fontWeight` / `letterSpacing`, none of which is
 * a size — so `fontSize` takes depth 0 only. A colour legitimately nests
 * (`primary.DEFAULT`, `primary.foreground`) and those nested names ARE real
 * classes, `text-primary-foreground` among them — so `colors` takes every depth.
 *
 * Comments are stripped first. Without that, the comment `mem://style/...` above
 * the scale parsed as a key named `mem`.
 */
function keysIn(block: string, topLevelOnly: boolean): string[] {
  const src = block.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const keys: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let token = '';

  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];

    if (quote) {
      if (ch === '\\') { i += 1; continue; }
      if (ch === quote) { quote = null; continue; }
      token += ch;
      continue;
    }

    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; token = ''; continue; }
    if (ch === '{' || ch === '[') { depth += 1; token = ''; continue; }
    if (ch === '}' || ch === ']') { depth -= 1; token = ''; continue; }
    if (ch === ':') {
      const name = token.trim();
      if (/^[a-zA-Z][a-zA-Z0-9-]*$/.test(name) && (!topLevelOnly || depth === 0)) keys.push(name);
      token = '';
      continue;
    }
    if (ch === ',' || ch === '\n') { token = ''; continue; }
    token += ch;
  }
  return keys;
}

/**
 * Strip comments from TypeScript source, quote-aware.
 *
 * Required BEFORE any brace matching, and the reason is worth recording. The
 * colours block in `tailwind.config.ts` carries the comment
 *
 *     // Five C's Module Colors
 *
 * and the apostrophe in `C's` opened a quote state that the brace matcher never
 * closed, so it counted braces through the rest of the file and reported the
 * colours block as running to line 512 — swallowing `borderRadius`, `boxShadow`,
 * `keyframes` and `animation` whole. Bounding the block by braces was the right
 * fix and it silently did nothing until this ran.
 *
 * A structural gate that reads source keeps colliding with prose. Four times in
 * DR1 a grep matched a comment describing the thing it looked for. This is the
 * inverse and it is worse, because prose did not produce a false hit here, it
 * corrupted the parse and produced a false PASS.
 *
 * Quote-aware in both directions: a `//` inside a string literal is not a
 * comment, so a URL in a value survives.
 */
function stripCodeComments(source: string): string {
  let out = '';
  let quote: string | null = null;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (quote) {
      out += ch;
      if (ch === '\\') { out += next ?? ''; i += 1; }
      else if (ch === quote) quote = null;
      continue;
    }

    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; out += ch; continue; }

    if (ch === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') i += 1;
      out += '\n';
      continue;
    }

    if (ch === '/' && next === '*') {
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
      i += 1;
      continue;
    }

    out += ch;
  }
  return out;
}

function readConfig(): string {
  try {
    // Comments are removed here, once, because every consumer below parses
    // structure and an apostrophe in prose corrupts that parse.
    return stripCodeComments(readFileSync(resolve(ROOT, CONFIG), 'utf8'));
  } catch {
    return fail(`cannot read ${CONFIG}. The scale is defined there; without it this gate is guessing. Failing closed.`);
  }
}

/** The `fontSize` keys, read from the config rather than from any doc. */
function scaleFrom(config: string): Set<string> {
  const block = blockAt(config, 'fontSize');
  if (block === null) fail(`could not locate the fontSize block in ${CONFIG}. Failing closed.`);
  const keys = keysIn(block, true);
  if (keys.length === 0) fail(`parsed zero font sizes out of ${CONFIG}. The matcher is broken. Failing closed.`);
  return new Set(keys);
}

/** Every key appearing anywhere in the config's colors block. */
/**
 * Colour class names, as full dotted paths flattened to Tailwind's dash form.
 *
 * `primary` + `primary.foreground` become `primary` and `primary-foreground`,
 * which are exactly the names `text-*` can carry. `DEFAULT` collapses onto its
 * parent, the same way Tailwind resolves it.
 *
 * The earlier version kept a flat set of every key at any depth and then asked
 * whether ANY dash-separated part of a token matched one. That waved through
 * `text-dna-glow`: `dna` is a real colour family, `glow` is a shadow, and the
 * pair is not a colour at all. A loose membership test is how a gate ends up
 * agreeing with something that does not exist — which is the bug this whole
 * lane is about. So the check became exact.
 */
function colourPathsFrom(config: string): Set<string> {
  const block = blockAt(config, 'colors');
  if (block === null) fail(`could not locate the colors block in ${CONFIG}. Failing closed.`);

  const paths = new Set<string>();
  const stack: string[] = [];
  let pending: string | null = null;
  let token = '';
  let quote: string | null = null;

  const emit = (name: string) => {
    const parts = [...stack, name].filter((p) => p !== 'DEFAULT');
    if (parts.length) paths.add(parts.join('-'));
  };

  for (let i = 0; i < block.length; i += 1) {
    const ch = block[i];

    if (quote) {
      if (ch === '\\') { i += 1; continue; }
      if (ch === quote) { quote = null; continue; }
      token += ch;
      continue;
    }

    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; token = ''; continue; }

    if (ch === ':') {
      const name = token.trim();
      if (/^[a-zA-Z][a-zA-Z0-9-]*$/.test(name)) { emit(name); pending = name; }
      token = '';
      continue;
    }

    if (ch === '{') {
      // A brace right after `name:` opens that key's own nested scope.
      stack.push(pending ?? '');
      pending = null;
      token = '';
      continue;
    }

    if (ch === '}') { stack.pop(); pending = null; token = ''; continue; }
    if (ch === ',' || ch === '\n') { pending = null; token = ''; continue; }

    token += ch;
  }

  if (paths.size === 0) fail(`parsed zero colours out of ${CONFIG}. Failing closed.`);
  return paths;
}

/**
 * Utility classes defined in the CSS layer rather than the config.
 *
 * The first run flagged four live `text-responsive-*` classes that are declared
 * in `src/index.css`. A token defined in CSS resolves exactly as well as one
 * defined in the config, so the gate reads both. Same principle either way:
 * the artifact is the fact.
 */
function cssDefinedClasses(files: string[]): Set<string> {
  const defined = new Set<string>();
  for (const file of files.filter((f) => f.endsWith('.css'))) {
    for (const m of readFileSync(file, 'utf8').matchAll(/^\s*\.text-([a-z][a-zA-Z0-9-]*)\s*[,{]/gm)) {
      defined.add(m[1]);
    }
  }
  return defined;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else {
      const dot = name.lastIndexOf('.');
      if (dot >= 0 && EXTS.has(name.slice(dot))) out.push(full);
    }
  }
  return out;
}

/**
 * Blank comments OUT of each line, never remove lines.
 *
 * Two earlier attempts got this wrong in the same way. Stripping comments from
 * the whole file and then splitting shifted every line after a multi-line
 * comment, so the gate reported real violations at innocent lines — six off in
 * `ConveneEventCard`, five in `FirstTimeWalkthrough`. A gate that names the
 * wrong place teaches people the gate is broken.
 *
 * Line-by-line with a block-comment flag makes the correspondence exact by
 * construction rather than by arithmetic. A className is a string literal, so
 * literals must survive; only comments are blanked.
 */
function stripCommentsPerLine(lines: string[]): string[] {
  let inBlock = false;
  return lines.map((line) => {
    let out = '';
    for (let i = 0; i < line.length; i += 1) {
      if (inBlock) {
        if (line[i] === '*' && line[i + 1] === '/') { inBlock = false; i += 1; }
        continue;
      }
      if (line[i] === '/' && line[i + 1] === '*') { inBlock = true; i += 1; continue; }
      if (line[i] === '/' && line[i + 1] === '/') break;
      out += line[i];
    }
    return out;
  });
}

interface Hit {
  file: string;
  line: number;
  token: string;
}

function main(): void {
  const config = readConfig();
  const scale = scaleFrom(config);
  const colours = colourPathsFrom(config);

  const files = walk(resolve(ROOT, 'src'));
  if (files.length === 0) fail('found zero source files. A gate that sees nothing is not a gate. Failing closed.');

  const cssClasses = cssDefinedClasses(files);

  const hits: Hit[] = [];
  let considered = 0;

  for (const file of files) {
    const isCss = file.endsWith('.css');
    const lines = stripCommentsPerLine(readFileSync(file, 'utf8').split('\n'));
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/\btext-([a-z][a-zA-Z0-9-]*)\b/g)) {
        const token = m[1];
        considered += 1;
        // Palette colours carry a numeric shade: neutral-600, copper-400.
        if (/-\d{2,3}$/.test(token)) continue;
        if (isCss && CSS_PROPERTIES.has(token)) continue;
        if (cssClasses.has(token)) continue;
        if (scale.has(token)) continue;
        if (TW_SIZES.has(token)) continue;
        if (BUILT_IN.has(token)) continue;
        // Exact match only. `muted-foreground` and `sidebar-accent-foreground`
        // are in the set as whole paths; `dna-glow` is not, and must not be.
        if (colours.has(token)) continue;
        hits.push({ file: relative(ROOT, file), line: i + 1, token: `text-${token}` });
      }
    });
  }

  // Self-check: a matcher that examined nothing makes a clean result vacuous.
  if (considered === 0) fail('examined zero text-* tokens across src. The matcher is broken. Failing closed.');

  if (hits.length === 0) {
    console.log(`[lint:scale] OK — every text-* token resolves. Scale: ${[...scale].join(' ')}`);
    process.exit(0);
  }

  console.error(`\n[lint:scale] ${hits.length} token(s) that nothing defines. These render at inherited size, silently:\n`);
  for (const h of hits) console.error(`  ${h.file}:${h.line}  ${h.token}`);
  console.error(
    `\nThe scale, read from ${CONFIG}: ${[...scale].join('  ')}\n` +
      `Colours come from the same file. If a token belongs in either, add it there — the config is the fact.\n`,
  );
  process.exit(1);
}

main();
