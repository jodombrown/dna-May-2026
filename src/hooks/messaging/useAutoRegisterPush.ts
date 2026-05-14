/**
 * useAutoRegisterPush
 *
 * If the browser already has Notification permission granted, silently
 * (re)register the service worker + push subscription on app boot so the
 * user's session can receive push without re-prompting. No-op otherwise.
 */
import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const VAPID_PUBLIC_KEY =
  'BNPuO_ci8_-gGo8JjgqBguQBdktTqBL5AN3RbGtz-lwMs7PXeHcZiFGjsgJkdDsHEC1m79Q4D2C_nBZ2bTN38OA';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function useAutoRegisterPush(): void {
  const { user } = useAuth();
  const ranForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    if (ranForRef.current === user.id) return;
    ranForRef.current = user.id;

    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    if (!supported) return;
    if (Notification.permission !== 'granted') return;

    (async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw-push.js', {
          scope: '/',
        });
        await navigator.serviceWorker.ready;

        const pm = (registration as unknown as {
          pushManager: PushManager;
        }).pushManager;
        let subscription = await pm.getSubscription();
        if (!subscription) {
          subscription = await pm.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
              .buffer as ArrayBuffer,
          });
        }

        await supabase.functions.invoke('send-push-notification', {
          body: {
            action: 'register',
            user_id: user.id,
            endpoint: subscription.endpoint,
            subscription_data: subscription.toJSON(),
          },
        });
      } catch (err) {
        logger.debug('useAutoRegisterPush', 'silent failure', err);
      }
    })();
  }, [user?.id]);
}
