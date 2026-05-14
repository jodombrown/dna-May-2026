/**
 * DNA | NotificationPreferencesPanel
 *
 * Settings panel for managing notification preferences.
 * Covers:
 * - Global enable/disable
 * - Quiet hours configuration
 * - Per-category channel preferences
 * - Push notification toggle
 * - Email digest settings
 * - DIA insight frequency
 */

import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MateMasie } from '@/components/icons/adinkra';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useNotificationPreferences } from '@/hooks/useNotificationSystem';
import { Bell, BellOff, Moon, Mail, Smartphone, Users, Calendar, Briefcase, Target, BookOpen, Shield, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationCategory, NotificationChannel } from '@/types/notificationSystem';

const CATEGORY_CONFIG: {
  key: NotificationCategory;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    key: NotificationCategory.SOCIAL,
    label: 'Social',
    description: 'Likes, comments, connections, reshares',
    icon: <Users className="h-4 w-4" />,
    color: '#4A8D77',
  },
  {
    key: NotificationCategory.EVENT,
    label: 'Events',
    description: 'Invitations, reminders, RSVPs',
    icon: <Calendar className="h-4 w-4" />,
    color: '#C4942A',
  },
  {
    key: NotificationCategory.COLLABORATION,
    label: 'Collaboration',
    description: 'Tasks, Spaces, milestones',
    icon: <Briefcase className="h-4 w-4" />,
    color: '#2D5A3D',
  },
  {
    key: NotificationCategory.MARKETPLACE,
    label: 'Marketplace',
    description: 'Opportunities, matches, deadlines',
    icon: <Target className="h-4 w-4" />,
    color: '#B87333',
  },
  {
    key: NotificationCategory.CONTENT,
    label: 'Content',
    description: 'Stories, followers, engagement',
    icon: <BookOpen className="h-4 w-4" />,
    color: '#2A7A8C',
  },
  {
    key: NotificationCategory.INTELLIGENCE,
    label: 'DIA Insights',
    description: 'Nudges, digests, recommendations',
    icon: <MateMasie className="h-4 w-4" />,
    color: '#C4942A',
  },
  {
    key: NotificationCategory.SYSTEM,
    label: 'System',
    description: 'Security, payments, platform updates',
    icon: <Shield className="h-4 w-4" />,
    color: '#CC3333',
  },
  {
    key: NotificationCategory.MESSAGING,
    label: 'Messages',
    description: 'Direct and group messages',
    icon: <MessageSquare className="h-4 w-4" />,
    color: '#4A8D77',
  },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function NotificationPreferencesPanel() {
  const { preferences, isLoading, updatePreferences } = useNotificationPreferences();

  if (isLoading || !preferences) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading notification preferences...
      </div>
    );
  }

  const toggleGlobal = () => {
    updatePreferences({ globalEnabled: !preferences.globalEnabled });
  };

  const toggleQuietHours = () => {
    updatePreferences({ quietHoursEnabled: !preferences.quietHoursEnabled });
  };

  const togglePush = () => {
    updatePreferences({ pushEnabled: !preferences.pushEnabled });
  };

  const toggleEmail = () => {
    updatePreferences({ emailEnabled: !preferences.emailEnabled });
  };

  const toggleEmailDigest = () => {
    updatePreferences({ emailDigestEnabled: !preferences.emailDigestEnabled });
  };

  const toggleCategoryChannel = (
    category: NotificationCategory,
    channel: NotificationChannel,
    enabled: boolean
  ) => {
    const current = preferences.categoryPreferences[category];
    if (!current) return;

    const channels = enabled
      ? [...current.channels, channel]
      : current.channels.filter(c => c !== channel);

    updatePreferences({
      categoryPreferences: {
        ...preferences.categoryPreferences,
        [category]: { ...current, channels },
      },
    });
  };

  const toggleCategoryEnabled = (category: NotificationCategory) => {
    const current = preferences.categoryPreferences[category];
    if (!current) return;

    updatePreferences({
      categoryPreferences: {
        ...preferences.categoryPreferences,
        [category]: { ...current, enabled: !current.enabled },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Global toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {preferences.globalEnabled ? (
            <Bell className="h-5 w-5 text-primary" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <Label className="text-sm font-medium">Notifications</Label>
            <p className="text-xs text-muted-foreground">
              {preferences.globalEnabled ? 'Notifications are enabled' : 'All notifications are paused'}
            </p>
          </div>
        </div>
        <Switch checked={preferences.globalEnabled} onCheckedChange={toggleGlobal} />
      </div>

      <Separator />

      {/* Quiet hours */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Moon className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label className="text-sm font-medium">Quiet Hours</Label>
              <p className="text-xs text-muted-foreground">
                Suppress non-critical notifications during sleep
              </p>
            </div>
          </div>
          <Switch checked={preferences.quietHoursEnabled} onCheckedChange={toggleQuietHours} />
        </div>

        {preferences.quietHoursEnabled && (
          <div className="flex items-center gap-3 ml-8">
            <Select
              value={String(preferences.quietHoursStart)}
              onValueChange={(v) => updatePreferences({ quietHoursStart: parseInt(v) })}
            >
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">to</span>
            <Select
              value={String(preferences.quietHoursEnd)}
              onValueChange={(v) => updatePreferences({ quietHoursEnd: parseInt(v) })}
            >
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Separator />

      {/* Channel toggles */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Delivery Channels</h4>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm">Push notifications</Label>
          </div>
          <Switch checked={preferences.pushEnabled} onCheckedChange={togglePush} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm">Email notifications</Label>
          </div>
          <Switch checked={preferences.emailEnabled} onCheckedChange={toggleEmail} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm">Weekly email digest</Label>
          </div>
          <Switch checked={preferences.emailDigestEnabled} onCheckedChange={toggleEmailDigest} />
        </div>

        {preferences.emailDigestEnabled && (
          <div className="flex items-center gap-3 ml-7">
            <Select
              value={String(preferences.emailDigestDay)}
              onValueChange={(v) => updatePreferences({ emailDigestDay: parseInt(v) })}
            >
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day, i) => (
                  <SelectItem key={i} value={String(i)}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">at</span>
            <Select
              value={String(preferences.emailDigestHour)}
              onValueChange={(v) => updatePreferences({ emailDigestHour: parseInt(v) })}
            >
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[7, 8, 9, 10, 11, 12].map(h => (
                  <SelectItem key={h} value={String(h)}>
                    {h} AM
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Separator />

      {/* DIA insight frequency */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">DIA Intelligence</h4>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MateMasie className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm">Insight frequency</Label>
          </div>
          <Select
            value={preferences.diaInsightFrequency}
            onValueChange={(v) => updatePreferences({
              diaInsightFrequency: v as 'frequent' | 'normal' | 'minimal' | 'off',
            })}
          >
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="frequent">Frequent</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
              <SelectItem value="off">Off</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Per-category preferences */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Category Preferences</h4>

        {CATEGORY_CONFIG.map((cat) => {
          const pref = preferences.categoryPreferences[cat.key];
          if (!pref) return null;

          const hasInApp = pref.channels.includes('in_app' as NotificationChannel);
          const hasPush = pref.channels.includes('push' as NotificationChannel);
          const hasBadge = pref.channels.includes('badge' as NotificationChannel);

          return (
            <div key={cat.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded flex items-center justify-center text-white"
                    style={{ backgroundColor: cat.color }}
                  >
                    {cat.icon}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{cat.label}</Label>
                    <p className="text-xs text-muted-foreground">{cat.description}</p>
                  </div>
                </div>
                <Switch
                  checked={pref.enabled}
                  onCheckedChange={() => toggleCategoryEnabled(cat.key)}
                />
              </div>

              {pref.enabled && (
                <div className="flex items-center gap-4 ml-8 text-xs text-muted-foreground">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={hasInApp}
                      onChange={(e) => toggleCategoryChannel(cat.key, 'in_app' as NotificationChannel, e.target.checked)}
                      className="h-3 w-3 rounded border-border"
                    />
                    In-app
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={hasPush}
                      onChange={(e) => toggleCategoryChannel(cat.key, 'push' as NotificationChannel, e.target.checked)}
                      className="h-3 w-3 rounded border-border"
                    />
                    Push
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={hasBadge}
                      onChange={(e) => toggleCategoryChannel(cat.key, 'badge' as NotificationChannel, e.target.checked)}
                      className="h-3 w-3 rounded border-border"
                    />
                    Badge
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
