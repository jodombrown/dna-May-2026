/**
 * Composer as a drawer surface (DR1 step 5).
 *
 * The single-mode reference: one surface, no panel stack, no Back. It exists to
 * prove the shell handles the simple case without a surface knowing anything
 * about chrome.
 *
 * The bridge is deliberately thin. `UniversalComposer` is content only now, and
 * everything it used to own — sliding container, scrim, header, title, close,
 * focus trap, safe areas, route binding — belongs to `AppDrawer`.
 */

import { UniversalComposer } from '@/components/composer/UniversalComposer';
import { useUniversalComposer } from '@/contexts/ComposerContext';

export const COMPOSER_SURFACE_ID = 'composer';

export function ComposerSurface() {
  const composer = useUniversalComposer();
  return (
    <UniversalComposer
      isOpen={composer.isOpen}
      mode={composer.mode}
      context={composer.context}
      isSubmitting={composer.isSubmitting}
      onClose={composer.close}
      onModeChange={composer.switchMode}
      successData={composer.successData}
      onSubmit={composer.submit}
      onDismissSuccess={composer.dismissSuccess}
    />
  );
}
