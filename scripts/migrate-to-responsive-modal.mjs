#!/usr/bin/env node
/**
 * One-shot codemod: migrate Radix Dialog to ResponsiveModal in files
 * that contain a text input. Idempotent-ish. Manual review recommended.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const files = process.argv.slice(2);

for (const file of files) {
  let src = readFileSync(file, 'utf8');
  const before = src;

  // 1) Rewrite the dialog import line to ResponsiveModal imports.
  src = src.replace(
    /import\s*\{[^}]*\}\s*from\s*['"]@\/components\/ui\/dialog['"];?/g,
    `import {\n  ResponsiveModal,\n  ResponsiveModalHeader,\n  ResponsiveModalTitle,\n  ResponsiveModalDescription,\n  ResponsiveModalFooter,\n} from '@/components/ui/responsive-modal';`,
  );

  // 2) Merge <Dialog ...>\n  <DialogContent ...> into <ResponsiveModal ... />
  //    Handle both orderings of props.
  src = src.replace(
    /<Dialog(\s[^>]*?)>\s*<DialogContent(\s[^>]*)?>/g,
    (_m, dialogAttrs, contentAttrs) => {
      const attrs = `${dialogAttrs || ''}${contentAttrs || ''}`.trim();
      return `<ResponsiveModal ${attrs}>`;
    },
  );

  // 3) Close: </DialogContent>\s*</Dialog> -> </ResponsiveModal>
  src = src.replace(/<\/DialogContent>\s*<\/Dialog>/g, '</ResponsiveModal>');

  // 4) Rename remaining sub-parts.
  src = src.replace(/<DialogHeader/g, '<ResponsiveModalHeader');
  src = src.replace(/<\/DialogHeader>/g, '</ResponsiveModalHeader>');
  src = src.replace(/<DialogTitle/g, '<ResponsiveModalTitle');
  src = src.replace(/<\/DialogTitle>/g, '</ResponsiveModalTitle>');
  src = src.replace(/<DialogDescription/g, '<ResponsiveModalDescription');
  src = src.replace(/<\/DialogDescription>/g, '</ResponsiveModalDescription>');
  src = src.replace(/<DialogFooter/g, '<ResponsiveModalFooter');
  src = src.replace(/<\/DialogFooter>/g, '</ResponsiveModalFooter>');

  // 5) Strip DialogTrigger asChild wrappers - modal is controlled externally.
  src = src.replace(/<DialogTrigger\s+asChild>\s*/g, '');
  src = src.replace(/\s*<\/DialogTrigger>/g, '');

  if (src !== before) {
    writeFileSync(file, src);
    console.log(`migrated: ${file}`);
  } else {
    console.log(`unchanged: ${file}`);
  }
}
