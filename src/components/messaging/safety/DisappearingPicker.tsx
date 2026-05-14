import React, { useEffect, useState } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { safetyService } from '@/services/safetyService';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface DisappearingPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
}

const OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Off' },
  { value: 60 * 60, label: '1 hour' },
  { value: 24 * 60 * 60, label: '24 hours' },
  { value: 7 * 24 * 60 * 60, label: '7 days' },
];

export const DisappearingPicker: React.FC<DisappearingPickerProps> = ({
  open,
  onOpenChange,
  conversationId,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data: current } = useQuery({
    queryKey: ['disappearing', conversationId],
    queryFn: () => safetyService.getDisappearingDuration(conversationId),
    enabled: open,
  });

  const [selected, setSelected] = useState<number | null>(current ?? null);
  useEffect(() => {
    if (open) setSelected(current ?? null);
  }, [open, current]);

  const handleSave = async () => {
    setBusy(true);
    try {
      await safetyService.setDisappearingDuration(conversationId, selected);
      queryClient.invalidateQueries({ queryKey: ['disappearing', conversationId] });
      toast({
        title: selected ? 'Disappearing messages on' : 'Disappearing messages off',
      });
      onOpenChange(false);
    } catch (e) {
      toast({
        title: 'Failed to update setting',
        description: e instanceof Error ? e.message : 'Try again.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} className="sm:max-w-sm">
      <ResponsiveModalHeader>
        <ResponsiveModalTitle>Disappearing messages</ResponsiveModalTitle>
        <ResponsiveModalDescription>
          New messages in this chat will be removed after the chosen duration.
        </ResponsiveModalDescription>
      </ResponsiveModalHeader>

      <div className="px-4 pb-2 grid grid-cols-1 gap-1.5">
        {OPTIONS.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.label}
              onClick={() => setSelected(opt.value)}
              className={cn(
                'text-left px-3 py-2 rounded-md border text-sm transition-colors',
                isSelected
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border hover:bg-muted/60 text-muted-foreground hover:text-foreground',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <ResponsiveModalFooter className="gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={busy}>
          {busy ? 'Saving...' : 'Save'}
        </Button>
      </ResponsiveModalFooter>
    </ResponsiveModal>
  );
};
