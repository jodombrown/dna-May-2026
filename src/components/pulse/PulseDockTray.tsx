/**
 * PulseDockTray - Expandable Tray for Mobile Dock
 *
 * Slides up from the bottom when user taps MORE button.
 * Contains remaining Five C's items (Contribute, Convey) plus
 * DIA, Messages, and utility items (Notifications, Settings, Profile).
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, MessageSquarePlus, Bell, Settings, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PulseNavigationData } from '@/hooks/usePulseNavigation';
import type { PulseSection } from '@/types/pulse';
import { PulseTrayItem } from './PulseTrayItem';
import { AdinkrahenIcon, MpatapoIcon, MateMasieIcon } from '@/components/icons/adinkra';

interface PulseDockTrayProps {
  open: boolean;
  onClose: () => void;
  pulseNav: PulseNavigationData;
}

const PULSE_ITEMS = [
  { key: 'contribute', label: 'Contribute', icon: AdinkrahenIcon, href: '/dna/contribute' },
  { key: 'convey', label: 'Convey', icon: MpatapoIcon, href: '/dna/convey' },
  { key: 'dia', label: 'DIA', icon: MateMasieIcon, href: '/dna/dia' },
  { key: 'messages', label: 'Messages', icon: MessageCircle, href: '/dna/messages' },
] as const;

const UTILITY_ITEMS = [
  { key: 'notifications', label: 'Notifications', icon: Bell, href: '/dna/notifications' },
  { key: 'feedback', label: 'Feedback', icon: MessageSquarePlus, href: '/dna/feedback' },
  { key: 'settings', label: 'Settings', icon: Settings, href: '/dna/settings' },
  { key: 'profile', label: 'Profile', icon: User, href: '/dna/profile' },
] as const;

export function PulseDockTray({ open, onClose, pulseNav }: PulseDockTrayProps) {
  const navigate = useNavigate();

  const handleNavigation = (href: string) => {
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
        {/* Drag Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Pulse Items (Five C's completion + DIA + Messages) */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-4 gap-2">
            {PULSE_ITEMS.map((item) => (
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
        <div className="border-t border-gray-100 mx-4" />

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
    </>
  );
}

export default PulseDockTray;
