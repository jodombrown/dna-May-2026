/**
 * DNA | NotificationPreferencesPanel
 *
 * v0.0: Notification preferences are not yet persistable. The backing
 * notification_preferences table is not provisioned — the real persistence
 * model is owned by BD059/D064. Rather than present editable controls that
 * persist nothing, this panel renders a deferred-state notice.
 *
 * The notification bell + center continue to work on
 * DEFAULT_NOTIFICATION_PREFERENCES via notificationSystemService.getPreferences().
 */

import { BellOff } from 'lucide-react';

export function NotificationPreferencesPanel() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <BellOff className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium">Notification preferences are coming soon</h3>
        <p className="max-w-sm text-xs text-muted-foreground">
          You&rsquo;ll be able to customize how and when DNA notifies you here. For now,
          notifications use sensible defaults across your Five C&rsquo;s.
        </p>
      </div>
    </div>
  );
}
