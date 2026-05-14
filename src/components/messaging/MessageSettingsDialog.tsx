import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useDiaMessagingPrefs } from '@/hooks/messaging/useDiaMessagingPrefs';

interface MessageSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Per-user messaging preferences. Replaces the old "coming soon" stub.
 * Currently exposes DIA Smart Replies + Conversation Summaries; this is the
 * single home for any future messaging-wide toggles (read receipts, push, etc.).
 */
export const MessageSettingsDialog: React.FC<MessageSettingsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { prefs, update } = useDiaMessagingPrefs();

  const setPref = (key: 'smartRepliesEnabled' | 'summariesEnabled', value: boolean) => {
    update.mutate({ [key]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Message settings</DialogTitle>
          <DialogDescription>
            Control how DIA assists you in your conversations.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="smart-replies" className="text-sm font-medium">
                Smart Replies
              </Label>
              <p className="text-xs text-muted-foreground">
                Suggested one-tap replies appear above the composer.
              </p>
            </div>
            <Switch
              id="smart-replies"
              checked={prefs.smartRepliesEnabled}
              onCheckedChange={(v) => setPref('smartRepliesEnabled', v)}
            />
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="summaries" className="text-sm font-medium">
                Conversation summaries
              </Label>
              <p className="text-xs text-muted-foreground">
                Catch up on long threads with a short DIA-generated summary.
              </p>
            </div>
            <Switch
              id="summaries"
              checked={prefs.summariesEnabled}
              onCheckedChange={(v) => setPref('summariesEnabled', v)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
