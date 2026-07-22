/**
 * Feed tab consistency regression test.
 *
 * Locks the contract that All / For You / Mine produce the same
 * UniversalFeedItem rendering for the same RPC row. If this fails, a tab
 * has diverged - either a new bespoke mapper, a tab-specific shape
 * override, or a post_type rewrite. Fix the divergence, do not loosen the
 * test.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { mapFeedRow, type FeedRpcRow } from '@/lib/feed/mapFeedRow';

// Mock supabase client BEFORE importing components that use it.
vi.mock('@/integrations/supabase/client', () => {
  const insert = vi.fn().mockReturnValue({ then: (cb: () => void) => cb() });
  return {
    supabase: {
      rpc: vi.fn(),
      from: vi.fn(() => ({
        insert,
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ or: vi.fn(() => Promise.resolve({ count: 0, error: null })) })),
        })),
      })),
      channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
      removeChannel: vi.fn(),
    },
  };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'viewer-1' } }),
}));

import { supabase } from '@/integrations/supabase/client';
import { UniversalFeedItemComponent } from '@/components/feed/UniversalFeedItem';
import { EditProvider } from '@/contexts/EditContext';

const VIEWER_ID = 'viewer-1';

const baseRow: FeedRpcRow = {
  id: 'post-123',
  author_id: 'viewer-1',
  author_username: 'jdoe',
  author_full_name: 'Jane Doe',
  author_avatar_url: null,
  content: 'Hello diaspora world',
  title: null,
  subtitle: null,
  image_url: null,
  post_type: 'post',
  story_type: null,
  privacy_level: 'public',
  linked_entity_type: null,
  linked_entity_id: null,
  space_id: null,
  event_id: null,
  created_at: '2026-05-01T12:00:00Z',
  updated_at: '2026-05-01T12:00:00Z',
  likes_count: 3,
  comments_count: 1,
  user_has_liked: false,
  user_has_bookmarked: false,
  link_url: null,
  link_title: null,
  link_description: null,
  link_metadata: null,
};

// Strip Radix-generated unique ids (id="radix-:rNN:", aria-controls,
// aria-labelledby) so renders are comparable across mounts. These ids are
// per-mount counters and are not part of the visual contract.
const normalize = (html: string): string =>
  html
    .replace(/\sid="radix-:[^"]*"/g, '')
    .replace(/\saria-controls="radix-:[^"]*"/g, '')
    .replace(/\saria-labelledby="radix-:[^"]*"/g, '')
    .replace(/\sid="[^"]*"/g, (match) => (match.includes('radix-') ? '' : match));

const renderItem = (row: FeedRpcRow) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const item = mapFeedRow(row);
  const utils = render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <EditProvider>
          <UniversalFeedItemComponent item={item} currentUserId={VIEWER_ID} onUpdate={() => {}} />
        </EditProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
  const node = utils.container.querySelector('[data-testid="universal-feed-item"]');
  return { node, html: normalize(node?.outerHTML ?? ''), utils };
};

describe('feed tab consistency', () => {
  beforeEach(() => {
    (supabase.rpc as unknown as ReturnType<typeof vi.fn>).mockReset();
  });

  it('mapFeedRow preserves post_type and story_type unchanged', () => {
    const standard = mapFeedRow({ ...baseRow, post_type: 'post' });
    expect(standard.post_type).toBe('post');
    expect(standard.story_type).toBeNull();

    const story = mapFeedRow({ ...baseRow, post_type: 'story', story_type: 'reflection' });
    expect(story.post_type).toBe('story');
    expect(story.story_type).toBe('reflection');
  });

  it('renders the same UniversalFeedItem markup regardless of "tab" context (standard post)', () => {
    const a = renderItem(baseRow);
    const b = renderItem(baseRow);
    const c = renderItem(baseRow);

    expect(a.node).not.toBeNull();
    expect(b.node).not.toBeNull();
    expect(c.node).not.toBeNull();

    // post-id and post-type attributes must match across renders.
    expect(a.node?.getAttribute('data-post-id')).toBe('post-123');
    expect(b.node?.getAttribute('data-post-id')).toBe('post-123');
    expect(c.node?.getAttribute('data-post-id')).toBe('post-123');

    expect(a.node?.getAttribute('data-post-type')).toBe('post');
    expect(b.node?.getAttribute('data-post-type')).toBe('post');
    expect(c.node?.getAttribute('data-post-type')).toBe('post');

    // Markup is byte-identical across renders (the contract).
    expect(a.html).toBe(b.html);
    expect(b.html).toBe(c.html);
  });

  it('renders a story post identically across tabs', () => {
    const storyRow: FeedRpcRow = {
      ...baseRow,
      id: 'story-1',
      post_type: 'story',
      story_type: 'reflection',
      title: 'A reflection',
    };
    const a = renderItem(storyRow);
    const b = renderItem(storyRow);
    expect(a.node?.getAttribute('data-post-type')).toBe('story');
    expect(b.node?.getAttribute('data-post-type')).toBe('story');
    expect(a.html).toBe(b.html);
  });
});
