/**
 * Pulse Bar Types - DIA Phase 1 Foundation
 *
 * These types define the data structures for the Pulse Bar component,
 * which shows real-time status across all Five C's (CONNECT, CONVENE,
 * COLLABORATE, CONTRIBUTE, CONVEY).
 */

export type PulseStatus = 'active' | 'attention' | 'dormant' | 'urgent';

export interface PulseItem {
  id: string;
  title: string;
  subtitle?: string;
  avatar_url?: string;
  action_url: string;
  timestamp?: string;
}

export interface PulseSection {
  count: number;
  status: PulseStatus;
  micro_text: string;
  top_items: PulseItem[];
}

export interface ConnectPulse extends PulseSection {
  pending_requests: number;
  suggestions_count: number;
}

export interface ConvenePulse extends PulseSection {
  upcoming_count: number;
  pending_invites: number;
  next_event?: {
    id: string;
    title: string;
    starts_at: string;
  };
}

export interface CollaboratePulse extends PulseSection {
  active_spaces: number;
  stalled_count: number;
  attention_space?: {
    id: string;
    name: string;
    status: string;
  };
}

export interface ContributePulse extends PulseSection {
  match_count: number;
  open_listings: number;
}

export interface ConveyPulse extends PulseSection {
  total_engagement_24h: number;
  is_trending: boolean;
  top_performing_post?: {
    id: string;
    title: string;
    engagement_count: number;
  };
}

export interface UserPulseData {
  connect: ConnectPulse;
  convene: ConvenePulse;
  collaborate: CollaboratePulse;
  contribute: ContributePulse;
  convey: ConveyPulse;
  last_updated: string;
}

export type PulseKey = 'connect' | 'convene' | 'collaborate' | 'contribute' | 'convey';

export interface PulseConfig {
  label: string;
  icon: string;
  href: string;
  color: string;
}

export const PULSE_CONFIG: Record<PulseKey, PulseConfig> = {
  connect: {
    label: 'CONNECT',
    icon: 'Sankofa',
    href: '/dna/connect',
    color: 'emerald',
  },
  convene: {
    label: 'CONVENE',
    icon: 'Nkonsonkonson',
    href: '/dna/convene',
    color: 'emerald',
  },
  collaborate: {
    label: 'COLLABORATE',
    icon: 'FuntunfunefuDenkyemfunefu',
    href: '/dna/collaborate',
    color: 'emerald',
  },
  contribute: {
    label: 'CONTRIBUTE',
    icon: 'Adinkrahene',
    href: '/dna/contribute',
    color: 'emerald',
  },
  convey: {
    label: 'CONVEY',
    icon: 'Mpatapo',
    href: '/dna/convey',
    color: 'emerald',
  },
} as const;

/**
 * Mobile Navigation Types for Pulse Dock
 */
export interface PulseDockNavItem {
  key: string;
  label: string;
  icon: string;
  href: string | null;
  isCenter?: boolean;
  isTrigger?: boolean;
}

export interface MoreButtonState {
  hasActivity: boolean;
  totalCount: number;
  hasAttention: boolean;
  hasUrgent: boolean;
  status: PulseStatus;
}
