/**
 * SettingsRouteShell - wraps all /dna/settings/* routes with the shared
 * DnaMobileHubShell so the mobile chrome (top bar + bottom nav) matches
 * every other /dna/* hub.
 */
import React, { type ReactNode } from 'react';
import { DnaMobileHubShell } from '@/components/mobile/DnaMobileHubShell';

interface SettingsRouteShellProps {
  children: ReactNode;
  title?: string;
}

export function SettingsRouteShell({
  children,
  title = 'Settings',
}: SettingsRouteShellProps) {
  return (
    <DnaMobileHubShell bubble={{ kind: 'static', placeholder: title }}>
      {children}
    </DnaMobileHubShell>
  );
}

export default SettingsRouteShell;
