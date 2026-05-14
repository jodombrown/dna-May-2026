// src/components/hubs/collaborate/CollaborateAspiration.tsx
// Aspiration mode for Collaborate hub (Spaces)

import React, { useState } from 'react';
import { AspirationMode } from '../shared/AspirationMode';
import { NotifyMeModal } from '../shared/NotifyMeModal';
import { HostApplicationModal } from '../shared/HostApplicationModal';
import { CollaborateIllustration } from '../shared/HubIllustrations';
import { Bell } from 'lucide-react';
import { FuntunfunefuDenkyemfunefu } from '@/components/icons/adinkra';

interface CollaborateAspirationProps {
  earlyContent?: React.ReactNode;
}

export function CollaborateAspiration({ earlyContent }: CollaborateAspirationProps) {
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showHostModal, setShowHostModal] = useState(false);

  const comingSoonFeatures = [
    'Startup co-founder matching',
    'Community initiative coordination',
    'Creative project collaboration',
    'Mentorship circles',
    'Research partnerships',
    'Social impact ventures'
  ];

  return (
    <>
      <AspirationMode
        hub="collaborate"
        illustration={<CollaborateIllustration className="w-full h-full" />}
        title="COLLABORATE"
        tagline="Build Together, Impact Together"
        description="Great things happen when the diaspora works together. DNA Spaces bring professionals, creators, and changemakers into shared projects, from startup ventures to community initiatives to creative collaborations."
        primaryCTA={{
          label: 'Notify Me When Spaces Open',
          icon: <Bell className="w-4 h-4 mr-2" />,
          onClick: () => setShowNotifyModal(true)
        }}
        secondaryCTA={{
          label: 'Propose a Space',
          icon: <FuntunfunefuDenkyemfunefu className="w-4 h-4 ml-2" />,
          onClick: () => setShowHostModal(true)
        }}
        comingSoon={comingSoonFeatures}
        earlyContent={earlyContent}
        pattern="ndebele"
      />

      <NotifyMeModal
        isOpen={showNotifyModal}
        onClose={() => setShowNotifyModal(false)}
        hub="collaborate"
      />

      <HostApplicationModal
        isOpen={showHostModal}
        onClose={() => setShowHostModal(false)}
        hub="collaborate"
      />
    </>
  );
}

export default CollaborateAspiration;
