/**
 * DNA | NotificationPreferencesPanel
 *
 * N4: the client half of the notification_preferences spine. Members open this
 * to enable push on a device and tune push per Five-C category. Everything here
 * reads/writes notification_preferences via notificationSystemService — the same
 * row the DB router (notif_should_push) reads to decide whether to push.
 *
 * Taxonomy is the Five C's + system, matching the DB category_preferences keys.
 * In-app is always on (it's the notification row itself). Email renders but is
 * visibly deferred — the router does not dispatch email at v0.0 (Tier 2).
 */

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Smartphone, Bell, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { notificationSystemService } from '@/services/notificationSystemService';
import {
  NotificationCategory,
  NotificationChannel,
  type NotificationPreferences,
  type CategoryPreference,
} from '@/types/notificationSystem';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORY_META: { key: NotificationCategory; label: string; description: string }[] = [
  { key: NotificationCategory.CONNECT, label: 'Connect', description: 'Connection requests, mentions, and reactions on your posts' },
  { key: NotificationCategory.CONVENE, label: 'Convene', description: 'Event invitations, RSVPs, and reminders' },
  { key: NotificationCategory.COLLABORATE, label: 'Collaborate', description: 'Space invites, task assignments, and milestones' },
  { key: NotificationCategory.CONTRIBUTE, label: 'Contribute', description: 'Opportunity matches and expressed interest' },
  { key: NotificationCategory.CONVEY, label: 'Convey', description: 'Story engagement and new followers' },
  { key: NotificationCategory.SYSTEM, label: 'System', description: 'Security alerts, payments, and platform updates' },
];

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'Europe/London', label: 'London (UK)' },
  { value: 'Europe/Paris', label: 'Paris (France)' },
  { value: 'Africa/Lagos', label: 'Lagos (Nigeria)' },
  { value: 'Africa/Nairobi', label: 'Nairobi (Kenya)' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (South Africa)' },
  { value: 'Africa/Accra', label: 'Accra (Ghana)' },
  { value: 'Africa/Cairo', label: 'Cairo (Egypt)' },
  { value: 'Asia/Dubai', label: 'Dubai (UAE)' },
];

const HOURS = Array.from({ length: 24 }, (_, h) => h);

function formatHour(h: number): string {
  const period = h < 12 ? 'AM' : 'PM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:00 ${period}`;
}

function categoryHasPush(pref: CategoryPreference | undefined): boolean {
  return !!pref?.channels?.includes(NotificationChannel.PUSH);
}

export function NotificationPreferencesPanel() {
  const { user } = useAuth();
  const push = usePushNotifications();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setIsLoading(true);
    notificationSystemService
      .getPreferences(user.id)
      .then((p) => {
        if (active) setPrefs(p);
      })
      .catch(() => {
        if (active) toast.error('Could not load notification preferences');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  // Optimistic write: apply locally, persist the delta, revert on failure. The
  // DB row is the source of truth, so a failed save reloads from the server.
  const persist = useCallback(
    async (patch: Partial<NotificationPreferences>) => {
      if (!user || !prefs) return;
      const previous = prefs;
      setPrefs({ ...prefs, ...patch });
      try {
        await notificationSystemService.updatePreferences(user.id, patch);
      } catch {
        setPrefs(previous);
        toast.error('Could not save that change');
      }
    },
    [user, prefs],
  );

  const toggleCategoryPush = useCallback(
    (category: NotificationCategory, enablePush: boolean) => {
      if (!prefs) return;
      const current = prefs.categoryPreferences[category];
      const channels = new Set<NotificationChannel>(current?.channels ?? [NotificationChannel.IN_APP]);
      channels.add(NotificationChannel.IN_APP); // in-app is always on — it's the row
      if (enablePush) channels.add(NotificationChannel.PUSH);
      else channels.delete(NotificationChannel.PUSH);

      const nextCategory: CategoryPreference = {
        enabled: current?.enabled ?? true,
        channels: Array.from(channels),
        batchingEnabled: current?.batchingEnabled ?? true,
      };
      persist({
        categoryPreferences: {
          ...prefs.categoryPreferences,
          [category]: nextCategory,
        },
      });
    },
    [prefs, persist],
  );

  if (!user) {
    return (
      <p className="text-sm text-muted-foreground">
        Sign in to manage your notification preferences.
      </p>
    );
  }

  if (isLoading || !prefs) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pushMasterOff = !prefs.globalEnabled || !prefs.pushEnabled;

  return (
    <div className="space-y-6">
      {/* Enable push on this device */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Push on this device
          </CardTitle>
          <CardDescription>
            Push has to be enabled on each device separately. Enable it here to receive
            alerts even when DNA isn&rsquo;t open.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!push.isSupported ? (
            <p className="text-sm text-muted-foreground">
              This browser doesn&rsquo;t support push notifications.
            </p>
          ) : push.isSubscribed ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Bell className="h-4 w-4" />
                This device is subscribed
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={push.isLoading}
                onClick={() => push.unsubscribe()}
              >
                {push.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Turn off on this device
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button disabled={push.isLoading} onClick={() => push.subscribe()}>
                {push.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Enable push on this device
              </Button>
              {push.permission === 'denied' && (
                <p className="text-xs text-muted-foreground">
                  Notifications are blocked in your browser settings. Allow them for DNA to
                  enable push here.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Master switches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Delivery channels
          </CardTitle>
          <CardDescription>Master switches for how DNA reaches you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="global_enabled" className="text-base font-medium">
                All notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Turn every notification on or off. In-app notifications always appear in your
                notification center.
              </p>
            </div>
            <Switch
              id="global_enabled"
              checked={prefs.globalEnabled}
              onCheckedChange={(checked) => persist({ globalEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="push_enabled" className="text-base font-medium">
                Push notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                The master switch for push across your subscribed devices.
              </p>
            </div>
            <Switch
              id="push_enabled"
              checked={prefs.pushEnabled}
              disabled={!prefs.globalEnabled}
              onCheckedChange={(checked) => persist({ pushEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="email_enabled" className="text-base font-medium text-muted-foreground">
                Email notifications
              </Label>
              <p className="text-sm text-muted-foreground">Email delivery is coming soon.</p>
            </div>
            <Switch id="email_enabled" checked={false} disabled />
          </div>
        </CardContent>
      </Card>

      {/* Per-category matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications by category</CardTitle>
          <CardDescription>
            Choose which of your Five C&rsquo;s send push. In-app is always on so nothing is
            missed in your notification center.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {CATEGORY_META.map(({ key, label, description }) => {
            const pref = prefs.categoryPreferences[key];
            return (
              <div
                key={key}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="sm:max-w-md">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch checked disabled aria-label={`${label} in-app`} />
                    In-app
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch
                      checked={categoryHasPush(pref)}
                      disabled={pushMasterOff}
                      aria-label={`${label} push`}
                      onCheckedChange={(checked) => toggleCategoryPush(key, checked)}
                    />
                    Push
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch checked={false} disabled aria-label={`${label} email`} />
                    Email
                  </label>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Email delivery is coming soon — email toggles are shown but not yet active.
      </p>

      {/* Quiet hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Quiet hours
          </CardTitle>
          <CardDescription>
            Pause non-urgent push during these hours, in your timezone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="quiet_hours_enabled" className="text-base font-medium">
              Enable quiet hours
            </Label>
            <Switch
              id="quiet_hours_enabled"
              checked={prefs.quietHoursEnabled}
              onCheckedChange={(checked) => persist({ quietHoursEnabled: checked })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="quiet_start">Start</Label>
              <Select
                value={String(prefs.quietHoursStart)}
                onValueChange={(v) => persist({ quietHoursStart: Number(v) })}
                disabled={!prefs.quietHoursEnabled}
              >
                <SelectTrigger id="quiet_start">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {formatHour(h)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="quiet_end">End</Label>
              <Select
                value={String(prefs.quietHoursEnd)}
                onValueChange={(v) => persist({ quietHoursEnd: Number(v) })}
                disabled={!prefs.quietHoursEnabled}
              >
                <SelectTrigger id="quiet_end">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {formatHour(h)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={prefs.timezone} onValueChange={(v) => persist({ timezone: v })}>
              <SelectTrigger id="timezone" className="sm:w-80">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
