import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { NotificationPreferencesPanel } from '@/components/notifications';

/**
 * Notification settings route.
 *
 * N4: surfaces the notification_preferences spine — enable push per device and
 * tune push per Five-C category, persisted to notification_preferences and read
 * by the DB push router. Email delivery is visibly deferred (Tier 2).
 */
export default function NotificationSettings() {
  return (
    <SettingsLayout
      title="Notification Settings"
      description="Manage how and when you receive notifications"
    >
      <NotificationPreferencesPanel />
    </SettingsLayout>
  );
}
