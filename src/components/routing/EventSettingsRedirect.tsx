/**
 * EventSettingsRedirect — the management console's Settings tab folded into
 * the unified event form. Old /manage/settings links land on the edit page.
 */

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AfricaSpinner from '@/components/ui/AfricaSpinner';

export default function EventSettingsRedirect() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (eventId) {
      navigate(`/dna/convene/events/${eventId}/edit`, { replace: true });
    } else {
      navigate('/dna/convene/events', { replace: true });
    }
  }, [eventId, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <AfricaSpinner size="md" showText text="Redirecting..." />
    </div>
  );
}
