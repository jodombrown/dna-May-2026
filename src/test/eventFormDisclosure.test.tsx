/**
 * EventForm disclosure architecture.
 *
 * Locks the unified-form contract:
 * 1. level="compact" shows THE INVITATION only — no Door, no Programme —
 *    with a "More options" control that expands IN PLACE (no navigation).
 * 2. Expanding reveals THE DOOR written as consequences ("Anyone can join" /
 *    "You approve each person"), not raw booleans.
 * 3. Fields that don't apply are ABSENT, not disabled: format='virtual'
 *    removes the whole location block; 'in_person' removes the meeting link.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'organizer-1' } } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 't' } } }),
    },
    functions: { invoke: vi.fn() },
    from: vi.fn(),
  },
}));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'organizer-1' } }),
}));
vi.mock('@/hooks/useIsAdmin', () => ({
  useIsAdmin: () => ({ isAdmin: false, loading: false }),
}));
vi.mock('@/lib/uploadMedia', () => ({ uploadMedia: vi.fn() }));

import { EventForm } from '@/components/events/EventForm';

const renderForm = (props: Partial<React.ComponentProps<typeof EventForm>> = {}) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <EventForm level="compact" mode="create" {...props} />
    </QueryClientProvider>
  );
};

describe('EventForm level="compact" — the invitation only', () => {
  it('shows invitation fields and hides the Door and Programme', () => {
    renderForm();
    // Invitation
    expect(screen.getByText('Event name')).toBeTruthy();
    expect(screen.getByText('What to expect')).toBeTruthy();
    expect(screen.getByText('When')).toBeTruthy();
    expect(screen.getByText('Tags')).toBeTruthy();
    // The Door / Programme are absent until expanded
    expect(screen.queryByText('Anyone can join')).toBeNull();
    expect(screen.queryByText('Subtitle')).toBeNull();
    expect(screen.queryByText('Speakers')).toBeNull();
    // No timezone input anywhere — it is derived, never typed
    expect(screen.queryByText(/^Timezone$/i)).toBeNull();
    // The one submit: posting from the composer means publishing
    expect(screen.getByRole('button', { name: 'Publish event' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /draft/i })).toBeNull();
  });

  it('"More options" expands IN PLACE to the full level with consequence wording', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: /More options/ }));
    // THE DOOR — consequences, not booleans
    expect(screen.getByText('Anyone can join')).toBeTruthy();
    expect(screen.getByText('You approve each person')).toBeTruthy();
    expect(screen.getByText('Anyone on the web can see this')).toBeTruthy();
    expect(screen.getByText('Only signed-in Members')).toBeTruthy();
    expect(screen.getByText('Only people you invite')).toBeTruthy();
    // THE PROGRAMME
    expect(screen.getByText('Subtitle')).toBeTruthy();
    expect(screen.getByText('Speakers')).toBeTruthy();
    expect(screen.getByText('Agenda')).toBeTruthy();
    // Full level exposes the draft path — work before the body watches
    expect(screen.getByRole('button', { name: 'Save as draft' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeTruthy();
    // Admin-only flagship control absent for non-admins
    expect(screen.queryByText(/flagship/i)).toBeNull();
  });
});

describe('fields that do not apply are absent, not disabled', () => {
  it('in_person: location present, meeting link absent', () => {
    renderForm({ initialValues: { format: 'in_person' } });
    expect(screen.getByText('Where')).toBeTruthy();
    expect(screen.queryByText('Meeting link')).toBeNull();
  });

  it('virtual: the whole location block is gone, meeting link present', () => {
    renderForm({ initialValues: { format: 'virtual' } });
    expect(screen.queryByText('Where')).toBeNull();
    expect(screen.getByText('Meeting link')).toBeTruthy();
  });

  it('hybrid: both', () => {
    renderForm({ initialValues: { format: 'hybrid' } });
    expect(screen.getByText('Where')).toBeTruthy();
    expect(screen.getByText('Meeting link')).toBeTruthy();
  });
});
