/**
 * GatedActionButton — wraps a button in a feature gate. If the user's
 * profile meets the gate, clicking invokes `onAllowed`. If not, we open
 * a ResponsiveModal containing <FeatureGateNotice /> so the user sees
 * exactly what's missing plus a deep link to /dna/profile/edit.
 *
 * While the profile is loading, the button falls through to `onAllowed`
 * so first paint isn't blocked.
 */

import React, { useState } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from '@/components/ui/responsive-modal';
import { FeatureGateNotice } from './FeatureGateNotice';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import type { FeatureKey } from '@/config/profileGates';

interface GatedActionButtonProps extends Omit<ButtonProps, 'onClick'> {
  feature: FeatureKey;
  onAllowed: () => void;
  /** Render as a plain button element (no shadcn Button wrapper) — useful for
   *  bespoke UI like chip pills. When true, `children` is used as-is. */
  asChildTrigger?: React.ReactElement;
}

export const GatedActionButton: React.FC<GatedActionButtonProps> = ({
  feature,
  onAllowed,
  asChildTrigger,
  children,
  ...buttonProps
}) => {
  const gate = useFeatureGate(feature);
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    if (gate.loading) return;
    if (gate.allowed) {
      onAllowed();
    } else {
      setOpen(true);
    }
  };

  const trigger = asChildTrigger
    ? React.cloneElement(asChildTrigger, { onClick: handleClick })
    : (
      <Button {...buttonProps} onClick={handleClick}>
        {children}
      </Button>
    );

  return (
    <>
      {trigger}
      <ResponsiveModal open={open} onOpenChange={setOpen} className="max-w-md">
        <ResponsiveModalHeader className="px-4 pt-4">
          <ResponsiveModalTitle>{gate.label}</ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Finish setting up your profile to unlock this action.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>
        <div className="px-4 pb-4">
          <FeatureGateNotice feature={feature} />
        </div>
      </ResponsiveModal>
    </>
  );
};

export default GatedActionButton;
