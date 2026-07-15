import React, { useState } from 'react';
import { FiveCsDiscoveryRow } from './FiveCsDiscoveryRow';
import { FiveCDetailSheet } from './FiveCDetailSheet';
import type { FiveCId } from '@/content/fiveCs.content';

interface FiveCsDiscoverySectionProps {
  /** Optional profile context for analytics. */
  username?: string;
  memberFirstName?: string | null;
  /** Analytics source tag. Defaults to 'public_profile'. */
  source?: 'public_profile' | 'public_post';
}

/**
 * Universal Five C's discovery block: card row + right-sheet detail. Mounted
 * on every signed-out public surface (profile, post) so visitors get one
 * consistent "what is DNA" learning affordance. Signed-in visitors never
 * render this component.
 */
export const FiveCsDiscoverySection: React.FC<FiveCsDiscoverySectionProps> = ({
  username,
  memberFirstName,
  source = 'public_profile',
}) => {
  const [openId, setOpenId] = useState<FiveCId | null>(null);

  const handleOpen = (id: FiveCId) => {
    setOpenId(id);
    try {
      const w = window as unknown as {
        posthog?: { capture: (name: string, props: Record<string, unknown>) => void };
      };
      w.posthog?.capture('five_cs_card_open', {
        c_id: id,
        source,
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
