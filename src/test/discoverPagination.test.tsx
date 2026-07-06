/**
 * Discover pagination regression test.
 *
 * Guards against:
 *  1. Load More re-appending members that are already displayed (dedupe by id)
 *  2. Load More failing to advance p_offset (stale-closure bug)
 *  3. Missing "You're all caught up" end state when the RPC returns nothing new
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const rpcMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
    from: () => ({
      select: () => ({
        neq: () => ({
          eq: () => ({
            order: () => ({
              range: async () => ({ data: null, error: { message: 'fallback-disabled' } }),
            }),
          }),
        }),
      }),
    }),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'viewer-1' } }),
}));

vi.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({ trackEvent: vi.fn() }),
}));

vi.mock('@/hooks/useMobile', () => ({
  useMobile: () => ({ isMobile: false }),
}));

vi.mock('@/components/connect/MemberCard', () => ({
  MemberCard: ({ member }: { member: { id: string; full_name: string } }) => (
    <div data-testid={`member-${member.id}`}>{member.full_name}</div>
  ),
}));

vi.mock('@/components/connect/MemberCardSkeleton', () => ({
  MemberCardSkeletonGrid: () => <div data-testid="skeleton-grid" />,
}));

vi.mock('@/components/connect/DiscoverSearchHeader', () => ({
  DiscoverSearchHeader: () => null,
}));
vi.mock('@/components/connect/DiscoverFilterPills', () => ({
  DiscoverFilterPills: () => null,
}));
vi.mock('@/components/connect/DiscoverFilterSheet', () => ({
  DiscoverFilterSheet: () => null,
}));
vi.mock('@/components/profile/ProfileCompletionNudge', () => ({
  ProfileCompletionNudge: () => null,
}));

// Framer motion: strip animations to keep the test deterministic.
vi.mock('framer-motion', () => {
  const passthrough = (tag: string) =>
    React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>((props, ref) =>
      React.createElement(tag, { ...props, ref }),
    );
  const cache: Record<string, ReturnType<typeof passthrough>> = {};
  return {
    motion: new Proxy(
      {},
      {
        get: (_t, key: string) => {
          if (!cache[key]) cache[key] = passthrough(key);
          return cache[key];
        },
      },
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

import Discover from '@/pages/dna/connect/Discover';

function makePage(prefix: string, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`,
    full_name: `${prefix} member ${i}`,
    match_score: 0,
  }));
}

function renderDiscover() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/dna/connect/discover']}>
        <Routes>
          <Route path="/dna/connect/discover" element={<Discover />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Discover pagination', () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it('increments RPC offset on Load More and dedupes overlapping ids', async () => {
    const pageA = makePage('a', 20);
    const overlapping = [...pageA.slice(18), ...makePage('b', 18)]; // 20 rows, 2 overlap

    rpcMock
      .mockResolvedValueOnce({ data: pageA, error: null }) // offset 0
      .mockResolvedValueOnce({ data: overlapping, error: null }) // offset 20
      .mockResolvedValueOnce({ data: [], error: null }); // offset 40 -> caught up

    renderDiscover();

    // Initial page renders 20 unique cards
    await waitFor(() => {
      expect(screen.getByTestId('member-a-0')).toBeInTheDocument();
      expect(screen.getByTestId('member-a-19')).toBeInTheDocument();
    });
    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock.mock.calls[0][1].p_offset).toBe(0);

    // Load More -> offset 20
    fireEvent.click(screen.getByTestId('discover-load-more'));
    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledTimes(2);
    });
    expect(rpcMock.mock.calls[1][1].p_offset).toBe(20);

    // The 2 overlapping ids must NOT appear twice in the DOM.
    await waitFor(() => {
      expect(screen.getAllByTestId('member-a-18')).toHaveLength(1);
      expect(screen.getAllByTestId('member-a-19')).toHaveLength(1);
      expect(screen.getByTestId('member-b-17')).toBeInTheDocument();
    });

    // Load More -> offset 40, returns empty -> caught up
    fireEvent.click(screen.getByTestId('discover-load-more'));
    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledTimes(3);
    });
    expect(rpcMock.mock.calls[2][1].p_offset).toBe(40);

    await waitFor(() => {
      expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
    });
    expect(screen.queryByTestId('discover-load-more')).not.toBeInTheDocument();
  });

  it('shows retry UI when Load More fetch fails', async () => {
    const pageA = makePage('a', 20);
    rpcMock
      .mockResolvedValueOnce({ data: pageA, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'boom' } });

    renderDiscover();
    await waitFor(() => expect(screen.getByTestId('member-a-0')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('discover-load-more'));

    await waitFor(() => {
      expect(screen.getByTestId('discover-load-more-error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    // Existing members are preserved on failure.
    expect(screen.getByTestId('member-a-0')).toBeInTheDocument();
  });
});
