import React from 'react';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from '@/components/ui/responsive-modal';
import { Switch } from '@/components/ui/switch';
import { MateMasie } from '@/components/icons/adinkra';
import { useDiaMessagingPrefs } from '@/hooks/messaging/useDiaMessagingPrefs';
import { Button } from '@/components/ui/button';

interface DiaMessagingSettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Phase 13 - per-user toggles for DIA messaging surfaces.
 * Lives in the chat header More menu.
 */
export const DiaMessagingSettingsDrawer: React.FC<DiaMessagingSettingsDrawerProps> = ({
  open,
  onOpenChange,
}) => {
  const { prefs, update } = useDiaMessagingPrefs();

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} className="sm:max-w-md">
      <ResponsiveModalHeader>
        <div className="flex items-start gap-2">
          <MateMasie className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <ResponsiveModalTitle>DIA in messaging</ResponsiveModalTitle>
            <ResponsiveModalDescription>
              Choose how DIA shows up in your conversations.
            </ResponsiveModalDescription>
          </div>
        </div>
      </ResponsiveModalHeader>

      <div className="px-4 pb-4 space-y-3">
        <div className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Smart replies</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              DIA suggests short replies above the composer when someone messages you.
            </p>
          </div>
          <Switch
            checked={prefs.smartRepliesEnabled}
            onCheckedChange={(v) => update.mutate({ smartRepliesEnabled: v })}
            aria-label="Toggle smart replies"
          />
        </div>

        <div className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Catch me up</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              DIA can summarise the last 24 hours of a thread on demand.
            </p>
          </div>
          <Switch
            checked={prefs.summariesEnabled}
            onCheckedChange={(v) => update.mutate({ summariesEnabled: v })}
            aria-label="Toggle catch-me-up summaries"
          />
        </div>

        <p className="text-[11px] text-muted-foreground leading-snug pt-1">
          DIA never sends on your behalf. Suggestions only fill the composer for you to review.
        </p>
      </div>

      <div className="px-4 pb-4 pt-2 border-t border-border flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
          Done
        </Button>
      </div>
    </ResponsiveModal>
  );
};
