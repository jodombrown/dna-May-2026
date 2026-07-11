/**
 * PulseDockTray - Expandable Tray for Mobile Dock
 *
 * Slides up from the bottom when user taps MORE button.
 * Contains remaining Five C's items (Contribute, Convey) plus
 * DIA, Messages, and utility items (Notifications, Settings, Profile).
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, MessageSquarePlus, Bell, Settings, User, X, Inbox, Sunrise } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PulseNavigationData } from '@/hooks/usePulseNavigation';
import type { PulseSection } from '@/types/pulse';
import { PulseTrayItem } from './PulseTrayItem';
import { MateMasie, Adinkrahene, Mpatapo } from '@/components/icons/adinkra';
import { InboxDigestSheet } from './InboxDigestSheet';
import { DailyPulseSheet } from './DailyPulseSheet';
import { MESSAGING_ENABLED } from '@/config/featureFlags';
import { useDiaSheet } from '@/contexts/DiaSheetContext';

interface PulseDockTrayProps {
  open: boolean;
  onClose: () => void;
  pulseNav: PulseNavigationData;
}

const PULSE_ITEMS = [
  { key: 'contribute', label: 'Contribute', icon: Adinkrahene, href: '/dna/contribute' },
  { key: 'convey', label: 'Convey', icon: Mpatapo, href: '/dna/convey' },
  { key: 'dia', label: 'DIA', icon: MateMasie, href: '__dia__' },
  { key: 'messages', label: 'Messages', icon: MessageCircle, href: '/dna/messages' },
  { key: 'digest', label: 'Digest', icon: Inbox, href: '__digest__' },
  { key: 'pulse', label: 'Daily Pulse', icon: Sunrise, href: '__pulse__' },
] as const;

const UTILITY_ITEMS = [
  { key: 'notifications', label: 'Notifications', icon: Bell, href: '/dna/notifications' },
  { key: 'feedback', label: 'Feedback', icon: MessageSquarePlus, href: '/dna/feedback' },
  { key: 'settings', label: 'Settings', icon: Settings, href: '/dna/settings' },
  { key: 'profile', label: 'Profile', icon: User, href: '/dna/profile' },
] as const;

export function PulseDockTray({ open, onClose, pulseNav }: PulseDockTrayProps) {
  const navigate = useNavigate();
  const [digestOpen, setDigestOpen] = useState(false);
  const [pulseOpen, setPulseOpen] = useState(false);

  const handleNavigation = (href: string) => {
    if (href === '__digest__') {
      setDigestOpen(true);
      return;
    }
    if (href === '__pulse__') {
      setPulseOpen(true);
      return;
    }
    onClose();
    // Small delay so the tray animates away before navigation
    setTimeout(() => navigate(href), 150);
  };

  const getPulseData = (key: string): Partial<PulseSection> | null => {
    switch (key) {
      case 'contribute':
        return pulseNav.contribute || null;
      case 'convey':
        return pulseNav.convey || null;
      case 'dia':
        return { status: 'active', micro_text: 'Ask DIA', count: 0 };
      case 'messages':
        return {
          count: pulseNav.messages.unreadCount,
          status: pulseNav.messages.unreadCount > 0 ? 'active' : 'dormant',
          micro_text:
            pulseNav.messages.unreadCount > 0
              ? `${pulseNav.messages.unreadCount} unread`
              : 'No new messages',
        };
      case 'digest':
        return {
          count: pulseNav.messages.unreadCount,
          status: pulseNav.messages.unreadCount > 0 ? 'active' : 'dormant',
          micro_text:
            pulseNav.messages.unreadCount > 0 ? 'Triage now' : 'All caught up',
        };
      case 'pulse':
        return { status: 'active', count: 0, micro_text: 'Across the 5 Cs' };
      case 'notifications':
        return {
          count: pulseNav.notifications.unreadCount,
          status: pulseNav.notifications.unreadCount > 0 ? 'active' : 'dormant',
          micro_text:
            pulseNav.notifications.unreadCount > 0
              ? `${pulseNav.notifications.unreadCount} new`
              : 'All caught up',
        };
      default:
        return null;
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
        onClick={onClose}
      />

      {/* Tray */}
      <div
        className={cn(
          'fixed bottom-16 left-0 right-0 z-40',
          'bg-white rounded-t-2xl',
          'shadow-2xl',
          'pb-safe',
          'lg:hidden',
          'animate-slide-up'
        )}
      >
        {/* Header: drag handle + close (reserved row so X never overlaps tiles) */}
        <div className="relative flex items-center justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-neutral-300 rounded-full" />
          <button
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 inline-flex items-center justify-center rounded-full text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pulse Items (Five C's completion + DIA + Messages) */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-4 gap-2">
            {/* BD063 hide-and-freeze: drop the Messages item while DM/group messaging is OUT at v0.0. */}
            {PULSE_ITEMS.filter((item) => MESSAGING_ENABLED || item.key !== 'messages').map((item) => (
              <PulseTrayItem
                key={item.key}
                item={item}
                pulseData={getPulseData(item.key)}
                onClick={() => handleNavigation(item.href)}
                variant="pulse"
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-neutral-100 mx-4" />

        {/* Utility Items */}
        <div className="px-4 py-4">
          <div className="flex justify-center gap-8">
            {UTILITY_ITEMS.map((item) => (
              <PulseTrayItem
                key={item.key}
                item={item}
                pulseData={getPulseData(item.key)}
                onClick={() => handleNavigation(item.href)}
                variant="utility"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Phase 15 - Cross-thread inbox digest */}
      <InboxDigestSheet
        open={digestOpen}
        onOpenChange={setDigestOpen}
        onBeforeNavigate={onClose}
      />

      {/* Phase 18 - Cross-module daily pulse */}
      <DailyPulseSheet
        open={pulseOpen}
        onOpenChange={setPulseOpen}
        onBeforeNavigate={onClose}
      />
    </>
  );
}

export default PulseDockTray;
