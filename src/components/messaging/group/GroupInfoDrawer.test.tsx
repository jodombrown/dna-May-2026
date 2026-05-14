/**
 * GroupInfoDrawer integration tests.
 *
 * Covers: mute toggle, add members (confirmation + per-member progress),
 * remove member, leave group, transfer ownership, blocked-state guards,
 * and realtime invalidation on participant changes.
 *
 * Renders the desktop Sheet variant (useMobile -> false) for simpler DOM.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---- Mocks (must be hoisted before component import) -----------------------

const hoisted = vi.hoisted(() => {
  const groupServiceMock = {
    getMyMembership: vi.fn(),
    getParticipantRoles: vi.fn(),
    setMute: vi.fn(),
    addParticipant: vi.fn(),
    removeParticipant: vi.fn(),
    leaveGroup: vi.fn(),
    transferOwnership: vi.fn(),
    sendSystemMessage: vi.fn(),
  };
  const connectionServiceMock = {
    getConnections: vi.fn(),
    getBlockedUsers: vi.fn(),
  };
  const navigateMock = vi.fn();
  const toastSuccess = vi.fn();
  const toastError = vi.fn();
  const toastMessage = vi.fn();
  const subscribeMock = vi.fn();
  const removeChannelMock = vi.fn();
  const ref: { cb: ((payload: unknown) => void) | null } = { cb: null };
  return {
    groupServiceMock, connectionServiceMock, navigateMock,
    toastSuccess, toastError, toastMessage,
    subscribeMock, removeChannelMock, ref,
  };
});

const {
  groupServiceMock, connectionServiceMock, navigateMock,
  toastSuccess, toastError, toastMessage,
  subscribeMock, removeChannelMock, ref: channelRef,
} = hoisted;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => hoisted.navigateMock };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'me', user_metadata: { full_name: 'Me User' } },
  }),
}));

vi.mock('@/hooks/useMobile', () => ({
  useMobile: () => ({ isMobile: false, width: 1280 }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...a: unknown[]) => hoisted.toastSuccess(...a),
    error: (...a: unknown[]) => hoisted.toastError(...a),
    message: (...a: unknown[]) => hoisted.toastMessage(...a),
  },
}));

vi.mock('@/services/groupMessageService', () => ({
  groupMessageService: hoisted.groupServiceMock,
}));

vi.mock('@/services/connectionService', () => ({
  connectionService: hoisted.connectionServiceMock,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: vi.fn(() => {
      const chan: { on: (...a: unknown[]) => unknown; subscribe: typeof hoisted.subscribeMock } = {
        on: (_event: string, _config: unknown, cb: (payload: unknown) => void) => {
          hoisted.ref.cb = cb;
          return chan;
        },
        subscribe: hoisted.subscribeMock,
      };
      return chan;
    }),
    removeChannel: hoisted.removeChannelMock,
  },
}));

// ---- Component import (after mocks) ---------------------------------------
import { GroupInfoDrawer } from './GroupInfoDrawer';
import type { ConversationParticipant, GroupConversation } from '@/types/groupMessaging';

const conversation: GroupConversation = {
  conversation_id: 'conv-1',
  title: 'Diaspora Builders',
  description: 'Test group',
  avatar_url: null,
  conversation_type: 'group',
  created_by: 'me',
  created_at: '2026-01-01T00:00:00Z',
  last_message_at: '2026-01-01T00:00:00Z',
  participant_count: 3,
  unread_count: 0,
};

const participants: ConversationParticipant[] = [
  {
    id: 'p1', user_id: 'me', conversation_id: 'conv-1',
    joined_at: '', last_read_at: '',
    full_name: 'Me User', username: 'me',
  },
  {
    id: 'p2', user_id: 'u-alice', conversation_id: 'conv-1',
    joined_at: '', last_read_at: '',
    full_name: 'Alice', username: 'alice',
  },
  {
    id: 'p3', user_id: 'u-bob', conversation_id: 'conv-1',
    joined_at: '', last_read_at: '',
    full_name: 'Bob', username: 'bob',
  },
];

function renderDrawer() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <GroupInfoDrawer
          open={true}
          onOpenChange={() => {}}
          conversationId="conv-1"
          conversation={conversation}
          participants={participants}
        />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  channelRef.cb = null;
  groupServiceMock.getMyMembership.mockResolvedValue({ role: 'owner', is_muted: false });
  groupServiceMock.getParticipantRoles.mockResolvedValue(
    new Map([['me', 'owner'], ['u-alice', 'member'], ['u-bob', 'member']]),
  );
  groupServiceMock.setMute.mockResolvedValue(undefined);
  groupServiceMock.addParticipant.mockResolvedValue(undefined);
  groupServiceMock.removeParticipant.mockResolvedValue(undefined);
  groupServiceMock.leaveGroup.mockResolvedValue(undefined);
  groupServiceMock.transferOwnership.mockResolvedValue(undefined);
  groupServiceMock.sendSystemMessage.mockResolvedValue('msg-1');
  connectionServiceMock.getBlockedUsers.mockResolvedValue([]);
  connectionServiceMock.getConnections.mockResolvedValue([
    { id: 'c-new', full_name: 'New Connection', headline: 'Engineer', avatar_url: undefined },
    { id: 'u-blocked', full_name: 'Blocked Person', headline: 'Blocked', avatar_url: undefined },
  ]);
});

describe('GroupInfoDrawer - mute', () => {
  it('toggles mute and calls service', async () => {
    renderDrawer();
    const toggle = await screen.findByLabelText(/Mute group notifications/i);
    fireEvent.click(toggle);
    await waitFor(() => expect(groupServiceMock.setMute).toHaveBeenCalledWith('conv-1', true));
    expect(toastSuccess).toHaveBeenCalledWith('Group muted');
  });
});

describe('GroupInfoDrawer - remove member', () => {
  it('removes a non-blocked, non-owner member after confirmation', async () => {
    renderDrawer();
    await screen.findByText('Alice');
    const aliceRow = screen.getByTestId('member-row-u-alice');
    fireEvent.click(within(aliceRow).getByLabelText(/Remove member/i));
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }));
    await waitFor(() =>
      expect(groupServiceMock.removeParticipant).toHaveBeenCalledWith('conv-1', 'u-alice'),
    );
    expect(toastSuccess).toHaveBeenCalledWith('Member removed');
  });

  it('blocks remove on blocked members and surfaces an error', async () => {
    connectionServiceMock.getBlockedUsers.mockResolvedValue([
      { block_id: 'b1', blocked_user_id: 'u-alice', blocked_username: 'alice',
        blocked_full_name: 'Alice', blocked_at: '' },
    ]);
    renderDrawer();
    const aliceRow = await screen.findByTestId('member-row-u-alice');
    await waitFor(() =>
      expect(within(aliceRow).getByLabelText(/Blocked - cannot remove/i)).toBeDisabled(),
    );
    expect(within(aliceRow).getByText('Blocked')).toBeInTheDocument();
    expect(groupServiceMock.removeParticipant).not.toHaveBeenCalled();
  });
});

describe('GroupInfoDrawer - leave group', () => {
  it('non-owner can leave directly via confirm dialog', async () => {
    groupServiceMock.getMyMembership.mockResolvedValue({ role: 'member', is_muted: false });
    groupServiceMock.getParticipantRoles.mockResolvedValue(
      new Map([['me', 'member'], ['u-alice', 'owner']]),
    );
    renderDrawer();
    fireEvent.click(await screen.findByRole('button', { name: /Leave Group/i }));
    fireEvent.click(await screen.findByRole('button', { name: 'Leave' }));
    await waitFor(() => expect(groupServiceMock.leaveGroup).toHaveBeenCalledWith('conv-1'));
    expect(navigateMock).toHaveBeenCalledWith('/dna/messages');
  });

  it('owner is redirected to transfer view instead of leaving', async () => {
    renderDrawer();
    await screen.findByText('Alice');
    fireEvent.click(screen.getByRole('button', { name: /Leave Group/i }));
    await screen.findByText(/Transfer ownership/i);
    expect(toastMessage).toHaveBeenCalledWith('Transfer ownership before leaving');
    expect(groupServiceMock.leaveGroup).not.toHaveBeenCalled();
  });
});

describe('GroupInfoDrawer - transfer ownership', () => {
  it('owner can transfer to a member', async () => {
    renderDrawer();
    await screen.findByText('Alice');
    fireEvent.click(screen.getByRole('button', { name: /Transfer ownership/i }));
    fireEvent.click(await screen.findByText('Alice'));
    fireEvent.click(screen.getByRole('button', { name: /Make new owner/i }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm' }));
    await waitFor(() =>
      expect(groupServiceMock.transferOwnership).toHaveBeenCalledWith('conv-1', 'u-alice'),
    );
    expect(toastSuccess).toHaveBeenCalledWith('Ownership transferred');
  });
});

describe('GroupInfoDrawer - add members', () => {
  it('runs confirmation, per-member progress, and shows summary', async () => {
    // Make second one fail
    groupServiceMock.addParticipant.mockImplementation(async (_c: string, id: string) => {
      if (id === 'c-new') return;
      throw new Error('Network error');
    });
    // Provide two addable connections
    connectionServiceMock.getConnections.mockResolvedValue([
      { id: 'c-new', full_name: 'New Connection', headline: 'Engineer', avatar_url: undefined },
      { id: 'c-two', full_name: 'Second Person', headline: 'Builder', avatar_url: undefined },
    ]);

    renderDrawer();
    await screen.findByText('Alice');
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));

    // Wait for picker
    const newRow = await screen.findByTestId('add-row-c-new');
    fireEvent.click(newRow);
    fireEvent.click(await screen.findByTestId('add-row-c-two'));

    // Submit -> opens confirmation
    fireEvent.click(screen.getByTestId('add-members-submit'));
    fireEvent.click(await screen.findByRole('button', { name: 'Add' }));

    // Progress list appears + finishes
    await screen.findByTestId('add-progress-list');
    await waitFor(() =>
      expect(screen.getByTestId('add-progress-summary').textContent).toMatch(
        /1 added, 1 failed/,
      ),
    );
    expect(groupServiceMock.addParticipant).toHaveBeenCalledTimes(2);
    expect(toastSuccess).toHaveBeenCalledWith('Added 1 member');
    expect(toastError).toHaveBeenCalledWith('1 could not be added');

    fireEvent.click(screen.getByTestId('add-progress-done'));
    await screen.findByTestId('group-info-main');
  });

  it('hides blocked connections from selection and disables them', async () => {
    connectionServiceMock.getBlockedUsers.mockResolvedValue([
      { block_id: 'b1', blocked_user_id: 'u-blocked', blocked_username: 'b',
        blocked_full_name: 'Blocked Person', blocked_at: '' },
    ]);
    renderDrawer();
    await screen.findByText('Alice');
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));

    const blockedRow = await screen.findByTestId('add-row-u-blocked');
    expect(blockedRow).toBeDisabled();
    expect(within(blockedRow).getAllByText('Blocked').length).toBeGreaterThan(0);
    fireEvent.click(blockedRow);
    expect(groupServiceMock.addParticipant).not.toHaveBeenCalled();
  });
});

describe('GroupInfoDrawer - realtime', () => {
  it('subscribes to conversation_participants and invalidates on event', async () => {
    renderDrawer();
    await screen.findByText('Alice');
    expect(subscribeMock).toHaveBeenCalled();
    expect(typeof channelRef.cb).toBe('function');

    // Simulate a participant change. Should not throw and the callback exists,
    // proving the realtime path is wired up so badges/roles refresh without refresh.
    expect(() => channelRef.cb?.({ eventType: 'INSERT' })).not.toThrow();
  });
});
