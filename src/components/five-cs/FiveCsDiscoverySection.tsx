import React, { useState } from 'react';
import { FiveCsDiscoveryRow } from './FiveCsDiscoveryRow';
import { FiveCDetailSheet } from './FiveCDetailSheet';
import type { FiveCId } from '@/content/fiveCs.content';

interface FiveCsDiscoverySectionProps {
  /** Optional profile context for analytics. */
  username?: string;
  memberFirstName?: string | null;
}

/**
 * Universal Five C's discovery block: card row + right-sheet detail. Mounted
 * inside PublicProfileLandingView so it appears on every signed-out profile
 * automatically. Signed-in visitors never render this component because they
 * go through the authenticated ProfileV2 view.
 */
export const FiveCsDiscoverySection: React.FC<FiveCsDiscoverySectionProps> = ({
  username,
  memberFirstName,
}) => {
  const [openId, setOpenId] = useState<FiveCId | null>(null);

  const handleOpen = (id: FiveCId) => {
    setOpenId(id);
    // Analytics hook - swallow if the global tracker is not present.
    try {
      const w = window as unknown as {
        posthog?: { capture: (name: string, props: Record<string, unknown>) => void };
      };
      w.posthog?.capture('five_cs_card_open', {
        c_id: id,
        source: 'public_profile',
        username: username ?? null,
        member_first_name: memberFirstName ?? null,
      });
    } catch {
      /* no-op */
    }
  };

  return (
    <>
      <FiveCsDiscoveryRow onOpen={handleOpen} />
      <FiveCDetailSheet openId={openId} onOpenChange={setOpenId} />
    </>
  );
};

export default FiveCsDiscoverySection;
