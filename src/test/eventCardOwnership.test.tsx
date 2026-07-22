/**
 * EventCard ownership + RSVP regression test.
 *
 * Locks the two behaviors the founder hit on his own hosted event:
 *
 * 1. The host NEVER sees an RSVP button — they get Manage. Ownership resolves
 *    from the post envelope author OR the events row organizer, so a
 *    system-authored envelope can't hand the host a dead button.
 * 2. A non-host's RSVP button is ALIVE even when the feed passes no onRsvp
 *    handler — the card RSVPs on its own (useEventRsvpFromFeed).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { UniversalFeedItem } from '@/types/feed';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnValue({ then: (cb: () => void) => cb() }),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ or: vi.fn(() => Promise.resolve({ count: 0, error: null })) })),
      })),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'viewer-1' } }),
}));

vi.mock('@/hooks/useEventDetailsForFeed', () => ({
  useEventDetailsForFeed: vi.fn(),
}));
vi.mock('@/hooks/useMutualAttendees', () => ({
  useMutualAttendees: () => ({ data: [] }),
}));
vi.mock('@/hooks/usePostLikes', () => ({
  usePostLikes: () => ({ likeCount: 0, userHasLiked: false, toggleLike: vi.fn() }),
}));
vi.mock('@/hooks/usePostBookmarks', () => ({
  usePostBookmarks: () => ({ userHasBookmarked: false, toggleBookmark: vi.fn() }),
}));

const toggleRsvp = vi.fn();
vi.mock('@/hooks/useEventRsvpFromFeed', () => ({
  useEventRsvpFromFeed: () => ({ isAttending: false, toggleRsvp, isPending: false }),
}));

import { useEventDetailsForFeed } from '@/hooks/useEventDetailsForFeed';
import { EventCard } from '@/components/feed/cards/EventCard';
import { EditProvider } from '@/contexts/EditContext';

const VIEWER_ID = 'viewer-1';

const details = (organizerId: string) => ({
  data: {
    id: 'event-1',
    title: 'Founders Meetup',
    organizer_id: organizerId,
    slug: 'founders-meetup',
    attendee_count: 4,
    start_time: '2027-03-15T18:00:00Z',
    event_type: 'in_person',
    location_city: 'Lagos',
    location_country: 'Nigeria',
  },
  isLoading: false,
});

const item = (authorId: string): UniversalFeedItem =>
  ({
    post_id: 'post-1',
    author_id: authorId,
    author_username: 'host',
    author_display_name: 'The Host',
    author_avatar_url: null,
    content: 'Created an event: Founders Meetup',
    post_type: 'event',
    event_id: 'event-1',
    created_at: '2027-03-01T12:00:00Z',
  }) as unknown as UniversalFeedItem;

const renderCard = (feedItem: UniversalFeedItem) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <EditProvider>
          <EventCard item={feedItem} currentUserId={VIEWER_ID} onUpdate={() => {}} />
        </EditProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('EventCard ownership', () => {
  it('host (envelope author) sees Manage, never RSVP', () => {
    vi.mocked(useEventDetailsForFeed).mockReturnValue(details(VIEWER_ID) as never);
    const { queryByText } = renderCard(item(VIEWER_ID));
    expect(queryByText('Manage')).toBeTruthy();
    expect(queryByText('RSVP')).toBeNull();
  });

  it('host via events.organizer_id sees Manage even when the envelope author differs', () => {
    vi.mocked(useEventDetailsForFeed).mockReturnValue(details(VIEWER_ID) as never);
    const { queryByText } = renderCard(item('someone-else'));
    expect(queryByText('Manage')).toBeTruthy();
    expect(queryByText('RSVP')).toBeNull();
  });

  it('non-host gets a LIVE RSVP button with no onRsvp prop wired', () => {
    vi.mocked(useEventDetailsForFeed).mockReturnValue(details('someone-else') as never);
    const { getByText, queryByText } = renderCard(item('someone-else'));
    expect(queryByText('Manage')).toBeNull();

    const rsvp = getByText('RSVP').closest('button')!;
    expect(rsvp.disabled).toBe(false);
    fireEvent.click(rsvp);
    expect(toggleRsvp).toHaveBeenCalledTimes(1);
  });
});
