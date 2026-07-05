import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// --- Mocks ------------------------------------------------------------------

const trackEventMock = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/hooks/messaging/useDiaMessagingPrefs', () => ({
  useDiaMessagingPrefs: () => ({ prefs: { summariesEnabled: true } }),
}));

vi.mock('@/hooks/messaging/useInboxBrief', () => ({
  useInboxBrief: () => ({
    isLoading: false,
    isError: false,
    data: {
      totalUnread: 3,
      unreadThreadCount: 2,
      headline: 'You have unread messages',
      narrative: 'Two threads need attention',
      highlights: [],
    },
  }),
}));

vi.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({ trackEvent: trackEventMock }),
}));

// Stand-in for InboxDigestSheet so the test focuses on wiring, not the sheet.
vi.mock('./InboxDigestSheet', () => ({
  InboxDigestSheet: ({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
  }) => (
    <div data-testid="inbox-digest-sheet" data-open={open ? 'true' : 'false'}>
      <button type="button" onClick={() => onOpenChange(false)}>
        close-sheet
      </button>
    </div>
  ),
}));

import { MorningBriefBanner } from './MorningBriefBanner';

const renderBanner = (initialEntry = '/dna/feed') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <MorningBriefBanner />
    </MemoryRouter>,
  );

beforeEach(() => {
  trackEventMock.mockReset();
  localStorage.clear();
});

// --- Tests ------------------------------------------------------------------

describe('MorningBriefBanner', () => {
  it('opens the InboxDigestSheet when the banner is tapped and does not unmount it in the same render', () => {
    renderBanner();

    const sheet = screen.getByTestId('inbox-digest-sheet');
    expect(sheet).toBeInTheDocument();
    expect(sheet.getAttribute('data-open')).toBe('false');

    const banner = screen.getByTestId('morning-brief-banner');
    expect(banner).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('morning-brief-open'));

    // Sheet must be open AND still mounted.
    const sheetAfter = screen.getByTestId('inbox-digest-sheet');
    expect(sheetAfter).toBeInTheDocument();
    expect(sheetAfter.getAttribute('data-open')).toBe('true');
  });

  it('fires morning_brief_banner_tap and inbox_digest_opened analytics on tap', () => {
    renderBanner();
    fireEvent.click(screen.getByTestId('morning-brief-open'));

    const names = trackEventMock.mock.calls.map((c) => c[0]);
    expect(names).toContain('morning_brief_banner_tap');
    expect(names).toContain('inbox_digest_opened');
  });

  it('keeps the sheet mounted after it closes (banner dismisses only on close)', () => {
    renderBanner();
    fireEvent.click(screen.getByTestId('morning-brief-open'));

    // Close the sheet via its onOpenChange(false) path.
    fireEvent.click(screen.getByText('close-sheet'));

    // Sheet still mounted, just closed. Banner becomes dismissed.
    const sheet = screen.getByTestId('inbox-digest-sheet');
    expect(sheet).toBeInTheDocument();
    expect(sheet.getAttribute('data-open')).toBe('false');
    expect(screen.queryByTestId('morning-brief-banner')).not.toBeInTheDocument();

    const names = trackEventMock.mock.calls.map((c) => c[0]);
    expect(names).toContain('inbox_digest_closed');
  });

  it('deep link ?digest=open auto-opens the sheet on mount', () => {
    renderBanner('/dna/feed?digest=open');

    const sheet = screen.getByTestId('inbox-digest-sheet');
    expect(sheet.getAttribute('data-open')).toBe('true');

    const names = trackEventMock.mock.calls.map((c) => c[0]);
    expect(names).toContain('morning_brief_deep_link_open');
  });

  it('dismiss button hides the banner and does not open the sheet', () => {
    renderBanner();
    fireEvent.click(screen.getByLabelText('Dismiss morning brief'));

    expect(screen.queryByTestId('morning-brief-banner')).not.toBeInTheDocument();
    expect(screen.getByTestId('inbox-digest-sheet').getAttribute('data-open')).toBe('false');
    const names = trackEventMock.mock.calls.map((c) => c[0]);
    expect(names).toContain('morning_brief_banner_dismiss');
  });
});
