import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { NotificationPreferencesPanel } from '@/components/notifications';

/**
 * Notification settings route.
 *
 * N4: surfaces the dia_preferences spine — enable push per device and tune push
 * per Five-C category, alongside quiet hours and (deferred) email. Persisted to
 * dia_preferences and read by the DB push router. Email delivery is deferred (Tier 2).
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
