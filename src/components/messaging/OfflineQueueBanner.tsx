import { useEffect, useState } from 'react';
import { CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { offlineQueueService } from '@/services/offlineQueueService';
import type { OfflineQueueState } from '@/types/messagingPRD';

/**
 * OfflineQueueBanner - thin status strip surfaced above the inbox/thread when
 * the device is offline or has queued/failed messages waiting to flush.
 */
export function OfflineQueueBanner() {
  const [state, setState] = useState<OfflineQueueState>(() => offlineQueueService.getState());

  useEffect(() => {
    offlineQueueService.setStateChangeCallback(setState);
    const onStatus = () => setState(offlineQueueService.getState());
    window.addEventListener('online', onStatus);
    window.addEventListener('offline', onStatus);
    return () => {
      window.removeEventListener('online', onStatus);
      window.removeEventListener('offline', onStatus);
    };
  }, []);

  const pending = state.items.filter((i) => i.status === 'queued' || i.status === 'retrying').length;
  const failed = state.items.filter((i) => i.status === 'failed').length;

  if (state.isOnline && pending === 0 && failed === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-between gap-3 px-4 py-2 text-meta border-b bg-muted/60"
    >
      <div className="flex items-center gap-2 min-w-0">
        {!state.isOnline ? (
          <>
            <CloudOff className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              You are offline. Messages will send automatically when you reconnect.
            </span>
          </>
        ) : failed > 0 ? (
          <>
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-destructive" />
            <span className="truncate">
              {failed} message{failed === 1 ? '' : 's'} failed to send.
            </span>
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 flex-shrink-0 animate-spin" />
            <span className="truncate">
              Sending {pending} queued message{pending === 1 ? '' : 's'}…
            </span>
          </>
        )}
      </div>
      {failed > 0 && state.isOnline && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7"
          onClick={() => offlineQueueService.retryFailed()}
        >
          Retry
        </Button>
      )}
    </div>
  );
}
