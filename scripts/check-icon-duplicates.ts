#!/usr/bin/env tsx
/**
 * Icon Duplication Guard for Navigation Surfaces
 *
 * Enforces: within any navigation surface (tab bar, sidebar, dock, header
 * utility row), no two items may use the same lucide-react / Adinkra icon.
 *
 * Repeated icons inside cards (MapPin for location, Calendar for date,
 * Users for attendee counts) are correct UX and explicitly OUT of scope.
 *
 * The set of nav surfaces is registered below. Each entry points at one
 * file; the script extracts every `icon: SomeIcon` entry inside config
 * arrays and flags duplicates within that file. It also flags cross-
 * surface clashes for icons listed in RESERVED_ICONS (see
 * docs/ICON_USAGE_GUIDE.md).
 *
 * Run:
 *   tsx scripts/check-icon-duplicates.ts
 *
 * Exit codes:
 *   0  no duplicates
 *   1  duplicate icons found in one or more nav surfaces
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

interface NavSurface {
  id: string;
  file: string;
  /** Optional regex to scope detection (e.g. only inside TAB_CONFIG). */
  scopeRegex?: RegExp;
  /** When true, also extract JSX icon usage `<IconName ` inside the scope. */
  jsx?: boolean;
}

/**
 * Registry of navigation surfaces audited for icon uniqueness.
 * Add new surfaces here as the platform grows.
 */
const NAV_SURFACES: NavSurface[] = [
  // Feed
  { id: 'feed-tabs-mobile',      file: 'src/components/feed/MobileFeedTabs.tsx' },
  { id: 'feed-tab-explainer',    file: 'src/components/feed/FeedTabExplainer.tsx' },
  { id: 'feed-desktop-tabs',     file: 'src/pages/dna/Feed.tsx',
    scopeRegex: /<TabsList[\s\S]*?<\/TabsList>/, jsx: true },
  { id: 'feed-quick-links',      file: 'src/components/feed/FeedQuickLinks.tsx' },
  { id: 'feed-left-panel',       file: 'src/components/feed/FeedLeftPanel.tsx' },
  // Connect
  { id: 'connect-mobile-header', file: 'src/components/connect/ConnectMobileHeader.tsx' },
  // Pulse Dock + Tray
  { id: 'pulse-dock',            file: 'src/components/pulse/PulseDock.tsx' },
  { id: 'pulse-dock-tray-pulse', file: 'src/components/pulse/PulseDockTray.tsx',
    scopeRegex: /PULSE_ITEMS\s*=\s*\[[\s\S]*?\]/ },
  { id: 'pulse-dock-tray-utility', file: 'src/components/pulse/PulseDockTray.tsx',
    scopeRegex: /UTILITY_ITEMS\s*=\s*\[[\s\S]*?\]/ },
  // Layout
  { id: 'left-nav',              file: 'src/components/layout/columns/LeftNav.tsx' },
  // Admin
  { id: 'admin-layout',          file: 'src/pages/admin/AdminLayout.tsx' },
  // Settings (notification categories use distinct icons per row)
  { id: 'notification-settings', file: 'src/pages/dna/settings/NotificationSettings.tsx' },
];

/**
 * Icons reserved for a single semantic purpose across the entire app.
 * If two nav surfaces use the same RESERVED icon for different items,
 * that's a clash even though it would pass the per-surface check.
 */
const RESERVED_ICONS: Record<string, string> = {
  // Adinkra icons are reserved per the iconography rules.
  Sankofa: 'CONNECT module identity',
  Nkonsonkonson: 'CONVENE module identity',
  FuntunfunefuDenkyemfunefu: 'COLLABORATE module identity',
  Adinkrahene: 'CONTRIBUTE module identity',
  Mpatapo: 'CONVEY module identity',
  MateMasie: 'DIA identity',
  // Lucide nav-tab reservations (see docs/ICON_USAGE_GUIDE.md).
  Users: 'Members directory (Connect tab)',
  UserPlus: 'My Network (Feed tab)',
  Network: 'Network graph (Connect mobile tab)',
  Newspaper: 'All Posts (Feed tab)',
  Compass: 'For You / discovery (Feed tab)',
  PenSquare: 'My Posts (Feed tab)',
  Bookmark: 'Saved Posts (Feed tab)',
  Home: 'Feed home (Pulse Dock center)',
};

interface Hit { surface: string; file: string; icon: string; line: number; }

const ICON_LINE_RE = /icon:\s*([A-Z][A-Za-z0-9_]+)/g;
const JSX_ICON_RE = /<([A-Z][A-Za-z0-9_]+)[\s/>]/g;

// Lucide / Adinkra icons we recognise when scanning JSX. Anything outside
// this set is treated as a regular React component and ignored.
const KNOWN_ICONS = new Set<string>([
  'Newspaper', 'Compass', 'UserPlus', 'Users', 'PenSquare', 'Bookmark',
  'Network', 'MessageCircle', 'MessageSquare', 'MessageSquarePlus',
  'Bell', 'Settings', 'User', 'Home', 'Grid3X3', 'Search', 'Filter',
  'SlidersHorizontal', 'MoreHorizontal', 'TrendingUp', 'Clock',
  'Calendar', 'CalendarDays', 'BookOpen', 'FileText', 'Heart', 'AtSign',
  'Send', 'Mail', 'Share2', 'GitBranch', 'BarChart', 'Activity',
  'ListChecks', 'Megaphone', 'Shield', 'ArrowLeft', 'Layers', 'HandHeart',
  'Briefcase', 'Folder', 'UserCheck', 'UserCircle', 'Contact',
  'Sankofa', 'Nkonsonkonson', 'FuntunfunefuDenkyemfunefu',
  'Adinkrahene', 'Mpatapo', 'MateMasie',
]);

function extractIcons(
  file: string,
  scope?: RegExp,
  jsx = false,
): { icon: string; line: number }[] {
  const abs = join(ROOT, file);
  if (!existsSync(abs)) return [];
  const src = readFileSync(abs, 'utf8');
  const haystack = scope ? (src.match(scope)?.[0] ?? src) : src;
  const out: { icon: string; line: number }[] = [];
  const seenAtLine = new Set<string>();
  const collect = (re: RegExp, filter?: (name: string) => boolean) => {
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(haystack)) !== null) {
      const name = m[1];
      if (filter && !filter(name)) continue;
      const upTo = haystack.slice(0, m.index);
      const line = upTo.split('\n').length;
      const key = `${name}@${line}`;
      if (seenAtLine.has(key)) continue;
      seenAtLine.add(key);
      out.push({ icon: name, line });
    }
  };
  collect(ICON_LINE_RE);
  if (jsx) collect(JSX_ICON_RE, (n) => KNOWN_ICONS.has(n));
  return out;
}

function checkPerSurface(): Hit[] {
  const hits: Hit[] = [];
  for (const s of NAV_SURFACES) {
    const icons = extractIcons(s.file, s.scopeRegex, s.jsx);
    const seen = new Map<string, number>();
    for (const { icon, line } of icons) {
      if (seen.has(icon)) {
        hits.push({ surface: s.id, file: s.file, icon, line });
        hits.push({ surface: s.id, file: s.file, icon, line: seen.get(icon)! });
      } else {
        seen.set(icon, line);
      }
    }
  }
  return hits;
}

function checkReservedClashes(): Hit[] {
  const hits: Hit[] = [];
  // For each reserved icon, count how many distinct surfaces use it.
  const usage = new Map<string, { surface: string; file: string; line: number }[]>();
  for (const s of NAV_SURFACES) {
    const icons = extractIcons(s.file, s.scopeRegex, s.jsx);
    const surfaceIcons = new Set<string>();
    for (const { icon, line } of icons) {
      if (!RESERVED_ICONS[icon]) continue;
      if (surfaceIcons.has(icon)) continue;
      surfaceIcons.add(icon);
      const list = usage.get(icon) ?? [];
      list.push({ surface: s.id, file: s.file, line });
      usage.set(icon, list);
    }
  }
  for (const [icon, list] of usage.entries()) {
    if (list.length > 1) {
      for (const u of list) hits.push({ ...u, icon });
    }
  }
  return hits;
}

function main() {
  const perSurface = checkPerSurface();

  // Reserved cross-surface usage is informational only. Mirroring is
  // intentional in some cases (e.g. FeedTabExplainer mirrors MobileFeedTabs)
  // so we report but do not fail the build on it.
  const reserved = checkReservedClashes();

  if (perSurface.length === 0) {
    if (reserved.length) {
      console.log('icon-duplicates: OK (within-surface). Cross-surface reserved-icon usage:');
      const seen = new Set<string>();
      for (const h of reserved) {
        const key = `${h.icon}@${h.surface}`;
        if (seen.has(key)) continue;
        seen.add(key);
        console.log(`  - ${h.icon} in ${h.surface} (reserved: ${RESERVED_ICONS[h.icon]})`);
      }
    } else {
      console.log('icon-duplicates: OK - no duplicate icons in nav surfaces.');
    }
    process.exit(0);
  }

  console.error('\nDuplicate icons WITHIN a navigation surface:');
  for (const h of perSurface) {
    console.error(`  [${h.surface}] ${relative(ROOT, h.file)}:${h.line}  icon=${h.icon}`);
  }
  console.error('\nFix by picking a different lucide icon (see docs/ICON_USAGE_GUIDE.md).');
  process.exit(1);
}

main();
