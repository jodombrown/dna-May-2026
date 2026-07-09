#!/usr/bin/env tsx
/**
 * check-responsive-dialogs.ts
 *
 * Guardrail against the mobile-keyboard layout-shift bug where a Radix
 * <Dialog> that contains a user input field (<Textarea> / <Input>) shifts
 * or clips on mobile when the virtual keyboard opens.
 *
 * Project standard: any dialog that hosts a text input MUST use
 * ResponsiveModal (Vaul drawer on mobile, Radix Dialog on desktop) instead
 * of Radix Dialog directly.
 *
 * Fails CI if a src file imports from '@/components/ui/dialog' AND
 * references a <Textarea or <Input tag.
 *
 * Allowlist covers non-user-facing/admin surfaces already vetted.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(process.cwd(), 'src');

// Files exempt from the rule. Add here only after visual QA on mobile
// confirms no keyboard-shift issue (typically admin-only surfaces).
const ALLOWLIST = new Set<string>([
  // Admin surfaces (desktop-first, low mobile traffic)
  'src/pages/admin/spaces/SpaceModeration.tsx',
  'src/pages/admin/spaces/SpaceManagement.tsx',
  'src/pages/admin/ContentModeration.tsx',
  'src/pages/admin/SponsorshipManagement.tsx',
  'src/pages/admin/WaitlistManagement.tsx',
  'src/pages/admin/UserManagement.tsx',
  'src/pages/admin/contributions/ContributionModeration.tsx',
  'src/pages/admin/contributions/ContributionManagement.tsx',
  'src/components/admin/ContributionModerationQueue.tsx',
  // Convene management console (desktop-first)
  'src/components/convene/management/team/TeamManager.tsx',
  'src/components/convene/management/settings/EventSettingsPage.tsx',
  'src/components/convene/management/communications/CommunicationsHub.tsx',
  'src/components/convene/management/checkin/CheckInDashboard.tsx',
  'src/components/convene/management/attendees/AttendeeManagement.tsx',
]);

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === '_archived' || entry === 'node_modules') continue;
      walk(full, files);
    } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
}

const DIALOG_IMPORT = /from ['"]@\/components\/ui\/dialog['"]/;
const HAS_INPUT = /<Textarea\b|<Input\s/;

const violations: string[] = [];
for (const file of walk(ROOT)) {
  const rel = relative(process.cwd(), file);
  if (ALLOWLIST.has(rel)) continue;
  const src = readFileSync(file, 'utf8');
  if (DIALOG_IMPORT.test(src) && HAS_INPUT.test(src)) {
    violations.push(rel);
  }
}

if (violations.length > 0) {
  console.error(
    '\n[check-responsive-dialogs] Dialogs with text inputs must use ResponsiveModal, not Radix Dialog directly.',
  );
  console.error(
    'Reason: on mobile, Radix Dialog shifts/clips when the virtual keyboard opens. ResponsiveModal renders a Vaul bottom sheet on mobile that resizes with the keyboard.',
  );
  console.error('\nOffenders:');
  for (const v of violations) console.error('  - ' + v);
  console.error(
    '\nFix: replace Dialog/DialogContent/DialogHeader/DialogTitle/DialogDescription/DialogFooter with',
  );
  console.error(
    '     ResponsiveModal/ResponsiveModalHeader/ResponsiveModalTitle/ResponsiveModalDescription/ResponsiveModalFooter',
  );
  console.error('     from @/components/ui/responsive-modal.');
  console.error(
    '\nIf the surface is admin-only and desktop-first, add it to the ALLOWLIST in scripts/check-responsive-dialogs.ts after mobile QA.\n',
  );
  process.exit(1);
}

console.log(`[check-responsive-dialogs] ok - scanned ${violations.length === 0 ? 'all' : ''} dialogs with inputs use ResponsiveModal.`);
