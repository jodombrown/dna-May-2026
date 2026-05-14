import React, { useState } from 'react';
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
import { useQueryClient } from '@tanstack/react-query';

interface BlockConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  targetUserName: string;
  /** When true, this dialog is unblocking instead of blocking */
  isUnblock?: boolean;
}

export const BlockConfirmDialog: React.FC<BlockConfirmDialogProps> = ({
  open,
  onOpenChange,
  targetUserId,
  targetUserName,
  isUnblock,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      if (isUnblock) {
        await safetyService.unblockUser(targetUserId);
        toast({ title: `${targetUserName} unblocked` });
      } else {
        await safetyService.blockUser(targetUserId);
        toast({ title: `${targetUserName} blocked` });
      }
      queryClient.invalidateQueries({ queryKey: ['user-block', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['user-blocks'] });
      onOpenChange(false);
    } catch (e) {
      toast({
        title: isUnblock ? 'Failed to unblock' : 'Failed to block',
        description: e instanceof Error ? e.message : 'Try again.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalHeader>
        <ResponsiveModalTitle>
          {isUnblock ? `Unblock ${targetUserName}?` : `Block ${targetUserName}?`}
        </ResponsiveModalTitle>
        <ResponsiveModalDescription>
          {isUnblock
            ? 'You will be able to message each other again.'
            : 'They will no longer be able to message you. You can unblock anytime from Settings -> Privacy.'}
        </ResponsiveModalDescription>
      </ResponsiveModalHeader>
      <ResponsiveModalFooter className="gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant={isUnblock ? 'default' : 'destructive'}
          onClick={handleConfirm}
          disabled={busy}
        >
          {busy ? 'Working...' : isUnblock ? 'Unblock' : 'Block'}
        </Button>
      </ResponsiveModalFooter>
    </ResponsiveModal>
  );
};
