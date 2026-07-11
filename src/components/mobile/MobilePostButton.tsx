/**
 * MobilePostButton — Floating Action Button for mobile composer
 *
 * Sprint 3A: Replaced old PostComposer dialog with UniversalComposer.
 * Now just a simple FAB that calls useUniversalComposer.open().
 * The UniversalComposer renders as a bottom sheet on mobile.
 */

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUniversalComposer } from '@/hooks/useUniversalComposer';
import { UniversalComposer } from '@/components/composer/UniversalComposer';
import { useMobile } from '@/hooks/useMobile';
import { cn } from '@/lib/utils';
import { haptic } from '@/utils/haptics';

const MobilePostButton = () => {
  const { isMobile } = useMobile();
  const composer = useUniversalComposer();

  if (!isMobile) return null;

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => { haptic('medium'); composer.open('story'); }}
        className={cn(
          "fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full shadow-lg",
          "bg-[#4A8D77] hover:bg-[#3d7a66] text-white",
          "transition-all duration-200 hover:scale-105 active:scale-95"
        )}
        size="icon"
        aria-label="Create"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* UniversalComposer renders as bottom sheet on mobile */}
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
    </>
  );
};

export default MobilePostButton;
