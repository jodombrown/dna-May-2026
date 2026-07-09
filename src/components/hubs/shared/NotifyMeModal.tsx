// src/components/hubs/shared/NotifyMeModal.tsx
// Notification signup modal for hub aspiration mode

import React, { useState } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Bell, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  subscribeToHubNotifications,
  HUB_INTEREST_OPTIONS,
  HUB_FORMAT_OPTIONS,
  HubType
} from '@/services/hubNotifications';
import { toast } from 'sonner';

interface NotifyMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  hub: HubType;
  title?: string;
  description?: string;
}

export function NotifyMeModal({
  isOpen,
  onClose,
  hub,
  title,
  description
}: NotifyMeModalProps) {
  const { user, profile } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [format, setFormat] = useState('');
  const [city, setCity] = useState('');
  const [notifyByEmail, setNotifyByEmail] = useState(true);
  const [notifyByDia, setNotifyByDia] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const interests = HUB_INTEREST_OPTIONS[hub];
  const formats = HUB_FORMAT_OPTIONS[hub];

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    if (!notifyByEmail && !notifyByDia) {
      toast.error('Please select at least one notification method');
      return;
    }

    setIsSubmitting(true);

    const result = await subscribeToHubNotifications({
      hub,
      email,
      userId: user?.id,
      preferences: {
        interests: selectedInterests,
        format,
        city: city || undefined,
        notify_by_email: notifyByEmail,
        notify_by_dia: notifyByDia
      }
    });

    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
      toast.success(`You'll be notified when ${getHubName(hub)} launches!`);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
      }, 2000);
    } else {
      toast.error(result.error || 'Failed to subscribe');
    }
  };

  const getHubName = (h: HubType): string => {
    const names: Record<HubType, string> = {
      convene: 'Events',
      collaborate: 'Spaces',
      contribute: 'Marketplace',
      convey: 'Stories'
    };
    return names[h];
  };

  const getDefaultTitle = (): string => {
    const titles: Record<HubType, string> = {
      convene: 'Get Notified When Events Launch',
      collaborate: 'Get Notified When Spaces Open',
      contribute: 'Get Notified When Marketplace Opens',
      convey: 'Get Notified When Publishing Opens'
    };
    return titles[hub];
  };

  const getDefaultDescription = (): string => {
    const descriptions: Record<HubType, string> = {
      convene: "Be the first to know when DNA events go live. We'll notify you about opportunities that match your interests.",
      collaborate: "Be the first to know when collaborative spaces open. We'll match you with projects aligned with your skills.",
      contribute: "Be the first to know when the DNA marketplace launches. We'll connect you with opportunities that fit your profile.",
      convey: "Be the first to know when DNA opens for community stories. Share your voice with the diaspora."
    };
    return descriptions[hub];
  };

  if (isSuccess) {
    return (
      <ResponsiveModal open={isOpen} onOpenChange={onClose} className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-dna-emerald mb-4" />
            <h3 className="text-xl font-semibold mb-2">You're on the List!</h3>
            <p className="text-muted-foreground">
              We'll let you know as soon as {getHubName(hub)} launches.
            </p>
          </div>
        </ResponsiveModal>
    );
  }

  return (
    <ResponsiveModal open={isOpen} onOpenChange={onClose} className="sm:max-w-md">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-dna-emerald" />
            {title || getDefaultTitle()}
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            {description || getDefaultDescription()}
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!!user?.email}
            />
          </div>

          {/* Interests */}
          <div className="space-y-2">
            <Label>What interests you? (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    selectedInterests.includes(interest)
                      ? 'bg-dna-emerald text-white border-dna-emerald'
                      : 'border-border hover:border-dna-emerald/50'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Format Preference */}
          <div className="space-y-2">
            <Label htmlFor="format">Preferred Format (optional)</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Select preference" />
              </SelectTrigger>
              <SelectContent>
                {formats.map((f) => (
                  <SelectItem key={f} value={f.toLowerCase()}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City (for Convene) */}
          {hub === 'convene' && (
            <div className="space-y-2">
              <Label htmlFor="city">City/Region (optional)</Label>
              <Input
                id="city"
                type="text"
                placeholder="e.g., London, Lagos, Atlanta"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                We'll notify you about events in your area
              </p>
            </div>
          )}

          {/* Notification Preferences */}
          <div className="space-y-3 pt-4 border-t border-neutral-100">
            <p className="text-sm font-medium text-neutral-700">How should we notify you?</p>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyByEmail}
                onChange={(e) => setNotifyByEmail(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-dna-emerald focus:ring-dna-emerald"
              />
              <span className="text-sm text-neutral-600">Email notifications</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyByDia}
                onChange={(e) => setNotifyByDia(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-dna-emerald focus:ring-dna-emerald"
              />
              <span className="text-sm text-neutral-600">In-app notifications from DIA</span>
            </label>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-dna-emerald hover:bg-dna-emerald/90"
            disabled={isSubmitting || (!notifyByEmail && !notifyByDia)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Subscribing...
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 mr-2" />
                Notify Me
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </form>
      </ResponsiveModal>
  );
}

export default NotifyMeModal;
