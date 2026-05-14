/**
 * GroupInfoDrawer - View/edit group info, manage members, mute, leave/transfer.
 *
 * vaul Drawer on mobile, Sheet on desktop.
 * - All members: mute/unmute, leave (with transfer if owner)
 * - Owner/admin: add members, remove members
 * - Owner: transfer ownership
 * - Blocked users (either direction): cannot be added or removed; clear errors shown.
 * Realtime: subscribes to conversation_participants for this conversation.
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  BellOff,
  Check,
  Crown,
  Loader2,
  LogOut,
  Search,
  Shield,
  ShieldOff,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMobile } from '@/hooks/useMobile';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import { groupMessageService } from '@/services/groupMessageService';
import { connectionService } from '@/services/connectionService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { GroupConversation, ConversationParticipant } from '@/types/groupMessaging';
import type { ConnectionProfile } from '@/types/connections';

interface GroupInfoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  conversation?: GroupConversation;
  participants: ConversationParticipant[];
}

type View = 'main' | 'add-members' | 'transfer';

const ADD_PAGE_SIZE = 15;

export function GroupInfoDrawer({
  open,
  onOpenChange,
  conversationId,
  conversation,
  participants,
}: GroupInfoDrawerProps) {
  const { user } = useAuth();
  const { isMobile } = useMobile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [view, setView] = useState<View>('main');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [muteBusy, setMuteBusy] = useState(false);
  const [leaveBusy, setLeaveBusy] = useState(false);

  useEffect(() => {
    if (!open) setView('main');
  }, [open]);

  const { data: myMembership } = useQuery({
    queryKey: ['group-membership', conversationId, user?.id],
    queryFn: () => groupMessageService.getMyMembership(conversationId),
    enabled: open && !!user?.id,
  });

  const { data: roleMap } = useQuery({
    queryKey: ['group-participant-roles', conversationId],
    queryFn: () => groupMessageService.getParticipantRoles(conversationId),
    enabled: open,
  });

  // Blocked users (either direction) - participants/connections we can't act on.
  const { data: blockedUsers } = useQuery({
    queryKey: ['blocked-users', user?.id],
    queryFn: () => connectionService.getBlockedUsers(),
    enabled: open && !!user?.id,
    staleTime: 60_000,
  });

  const blockedIds = useMemo(
    () => new Set((blockedUsers || []).map((b) => b.blocked_user_id)),
    [blockedUsers],
  );

  const myRole = myMembership?.role ?? 'member';
  const isMuted = !!myMembership?.is_muted;
  const isOwner = myRole === 'owner';
  const canManage = isOwner || myRole === 'admin';

  // Realtime: refresh roles/membership when participants change
  useEffect(() => {
    if (!open) return;
    const channel = supabase
      .channel(`group-info:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['group-membership', conversationId] });
          queryClient.invalidateQueries({ queryKey: ['group-participant-roles', conversationId] });
          queryClient.invalidateQueries({ queryKey: ['group-participants', conversationId] });
          queryClient.invalidateQueries({ queryKey: ['group-conversations'] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, conversationId, queryClient]);

  const handleToggleMute = async (next: boolean) => {
    if (muteBusy) return;
    setMuteBusy(true);
    try {
      await groupMessageService.setMute(conversationId, next);
      queryClient.invalidateQueries({ queryKey: ['group-membership', conversationId] });
      toast.success(next ? 'Group muted' : 'Group unmuted');
    } catch {
      toast.error('Failed to update notifications');
    } finally {
      setMuteBusy(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (blockedIds.has(userId)) {
      toast.error('You can\'t remove a blocked member. Unblock them first.');
      setRemovingUserId(null);
      return;
    }
    try {
      const member = participants.find((p) => p.user_id === userId);
      await groupMessageService.removeParticipant(conversationId, userId);
      await groupMessageService.sendSystemMessage(
        conversationId,
        `${member?.full_name || 'A member'} was removed from the group`,
      );
      toast.success('Member removed');
      setRemovingUserId(null);
      queryClient.invalidateQueries({ queryKey: ['group-participants', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['group-participant-roles', conversationId] });
    } catch (err) {
      const msg =
        err instanceof Error && err.message ? err.message : 'Failed to remove member';
      toast.error(msg);
    }
  };

  const handleSetRole = async (userId: string, nextRole: 'admin' | 'member') => {
    if (blockedIds.has(userId)) {
      toast.error("You can't change a blocked member's role. Unblock them first.");
      return;
    }
    try {
      const member = participants.find((p) => p.user_id === userId);
      await groupMessageService.setParticipantRole(conversationId, userId, nextRole);
      await groupMessageService.sendSystemMessage(
        conversationId,
        nextRole === 'admin'
          ? `${member?.full_name || 'A member'} is now an admin`
          : `${member?.full_name || 'A member'} is no longer an admin`,
      );
      toast.success(nextRole === 'admin' ? 'Promoted to admin' : 'Demoted to member');
      queryClient.invalidateQueries({ queryKey: ['group-participant-roles', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['group-membership', conversationId] });
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : 'Failed to change role';
      toast.error(msg);
    }
  };

  const handleLeave = async () => {
    if (!user || leaveBusy) return;
    setLeaveBusy(true);
    try {
      await groupMessageService.leaveGroup(conversationId);
      await groupMessageService.sendSystemMessage(
        conversationId,
        `${user.user_metadata?.full_name || 'Someone'} left the group`,
      );
      toast.success('You left the group');
      onOpenChange(false);
      navigate('/dna/messages');
    } catch (err) {
      const msg =
        err instanceof Error && err.message ? err.message : 'Failed to leave group';
      toast.error(msg);
    } finally {
      setLeaveBusy(false);
      setShowLeaveConfirm(false);
    }
  };

  const handleTransferOwnership = async (newOwnerId: string, alsoLeave: boolean) => {
    if (blockedIds.has(newOwnerId)) {
      toast.error('You can\'t transfer ownership to a blocked member.');
      return;
    }
    try {
      await groupMessageService.transferOwnership(conversationId, newOwnerId);
      const newOwner = participants.find((p) => p.user_id === newOwnerId);
      await groupMessageService.sendSystemMessage(
        conversationId,
        `${newOwner?.full_name || 'A member'} is now the group owner`,
      );
      toast.success('Ownership transferred');
      queryClient.invalidateQueries({ queryKey: ['group-membership', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['group-participant-roles', conversationId] });
      if (alsoLeave) {
        await handleLeave();
      } else {
        setView('main');
      }
    } catch (err) {
      const msg =
        err instanceof Error && err.message ? err.message : 'Failed to transfer ownership';
      toast.error(msg);
    }
  };

  const ownerId = useMemo(() => {
    if (!roleMap) return conversation?.created_by || null;
    for (const [uid, role] of roleMap.entries()) {
      if (role === 'owner') return uid;
    }
    return conversation?.created_by || null;
  }, [roleMap, conversation?.created_by]);

  const renderMain = () => (
    <div className="flex flex-col h-full" data-testid="group-info-main">
      <div className="flex flex-col items-center py-6 px-4">
        <Avatar className="h-16 w-16 mb-3">
          <AvatarImage src={conversation?.avatar_url || ''} />
          <AvatarFallback className="bg-primary/10 text-primary">
            <Users className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>
        <h3 className="text-lg font-semibold">{conversation?.title || 'Group Chat'}</h3>
        {conversation?.description && (
          <p className="text-sm text-muted-foreground mt-1 text-center">
            {conversation.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {participants.length} members
        </p>
      </div>

      <Separator />

      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <BellOff className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Mute notifications</p>
            <p className="text-xs text-muted-foreground">
              Stop push and badge alerts for this group
            </p>
          </div>
        </div>
        <Switch
          checked={isMuted}
          disabled={muteBusy}
          onCheckedChange={handleToggleMute}
          aria-label="Mute group notifications"
        />
      </div>

      <Separator />

      <div className="flex items-center justify-between px-4 py-3">
        <h4 className="text-sm font-medium">Members</h4>
        {canManage && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => setView('add-members')}
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            Add
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="px-4 space-y-1 pb-4">
          {participants.map((p) => {
            const role = roleMap?.get(p.user_id) || (p.user_id === ownerId ? 'owner' : 'member');
            const isMe = p.user_id === user?.id;
            const isBlocked = blockedIds.has(p.user_id);
            return (
              <div
                key={p.user_id}
                className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/50"
                data-testid={`member-row-${p.user_id}`}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={p.avatar_url || ''} />
                  <AvatarFallback className="text-xs">
                    {(p.full_name || '?').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {p.full_name}
                    {isMe && <span className="text-muted-foreground"> (you)</span>}
                  </p>
                  {p.username && (
                    <p className="text-xs text-muted-foreground truncate">@{p.username}</p>
                  )}
                </div>
                {isBlocked && (
                  <Badge variant="destructive" className="text-[10px] gap-1">
                    <ShieldOff className="h-3 w-3" />
                    Blocked
                  </Badge>
                )}
                {role === 'owner' && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Crown className="h-3 w-3" />
                    Owner
                  </Badge>
                )}
                {role === 'admin' && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Shield className="h-3 w-3" />
                    Admin
                  </Badge>
                )}
                {canManage && !isMe && role !== 'owner' && (
                  <div className="flex items-center gap-0.5">
                    {role === 'member' ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={isBlocked}
                        onClick={() => handleSetRole(p.user_id, 'admin')}
                        aria-label="Promote to admin"
                        title="Promote to admin"
                      >
                        <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    ) : isOwner ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleSetRole(p.user_id, 'member')}
                        aria-label="Demote admin to member"
                        title="Demote to member"
                      >
                        <ShieldOff className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={isBlocked}
                      onClick={() => {
                        if (isBlocked) {
                          toast.error('Unblock this user before removing them.');
                          return;
                        }
                        setRemovingUserId(p.user_id);
                      }}
                      aria-label={isBlocked ? 'Blocked - cannot remove' : 'Remove member'}
                    >
                      <UserMinus className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <Separator />

      {isOwner && participants.length > 1 && (
        <div className="px-4 pt-3">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setView('transfer')}
          >
            <Crown className="h-4 w-4 mr-2 text-muted-foreground" />
            Transfer ownership
          </Button>
        </div>
      )}

      <div className="p-4">
        <Button
          variant="ghost"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => {
            if (isOwner && participants.length > 1) {
              setView('transfer');
              toast.message('Transfer ownership before leaving');
            } else {
              setShowLeaveConfirm(true);
            }
          }}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Leave Group
        </Button>
      </div>
    </div>
  );

  const content =
    view === 'add-members' ? (
      <AddMembersView
        conversationId={conversationId}
        existingUserIds={new Set(participants.map((p) => p.user_id))}
        blockedIds={blockedIds}
        onBack={() => setView('main')}
        onAdded={() => {
          queryClient.invalidateQueries({ queryKey: ['group-participants', conversationId] });
          queryClient.invalidateQueries({ queryKey: ['group-participant-roles', conversationId] });
          setView('main');
        }}
      />
    ) : view === 'transfer' ? (
      <TransferOwnershipView
        participants={participants}
        currentUserId={user?.id || ''}
        blockedIds={blockedIds}
        onBack={() => setView('main')}
        onTransfer={handleTransferOwnership}
      />
    ) : (
      renderMain()
    );

  const dialogs = (
    <>
      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this group?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer receive messages from this group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={leaveBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeave}
              disabled={leaveBusy}
              className="bg-destructive text-destructive-foreground"
            >
              {leaveBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Leave'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!removingUserId}
        onOpenChange={(o) => !o && setRemovingUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              This person will be removed from the group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removingUserId && handleRemoveMember(removingUserId)}
              className="bg-destructive text-destructive-foreground"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Group Info</DrawerTitle>
          </DrawerHeader>
          {content}
          {dialogs}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[380px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Group Info</SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0 overflow-hidden">{content}</div>
        {dialogs}
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// Add Members sub-view
// ============================================================
type AddStatus = 'pending' | 'success' | 'failed';
interface AddProgressEntry {
  status: AddStatus;
  reason?: string;
}

function AddMembersView({
  conversationId,
  existingUserIds,
  blockedIds,
  onBack,
  onAdded,
}: {
  conversationId: string;
  existingUserIds: Set<string>;
  blockedIds: Set<string>;
  onBack: () => void;
  onAdded: () => void;
}) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(ADD_PAGE_SIZE);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<Map<string, AddProgressEntry>>(new Map());
  const [done, setDone] = useState(false);

  // Reset pagination when search changes
  useEffect(() => {
    setVisibleCount(ADD_PAGE_SIZE);
  }, [debouncedSearch]);

  const { data: connections, isLoading } = useQuery({
    queryKey: ['connections-for-group-add', debouncedSearch],
    queryFn: () => connectionService.getConnections(debouncedSearch || undefined),
    staleTime: 30_000,
  });

  const available = useMemo(() => {
    return (connections || []).filter(
      (c: ConnectionProfile) => !existingUserIds.has(c.id),
    );
  }, [connections, existingUserIds]);

  const visible = useMemo(() => available.slice(0, visibleCount), [available, visibleCount]);
  const hasMore = available.length > visible.length;

  const toggle = useCallback(
    (id: string, isBlocked: boolean) => {
      if (isBlocked) {
        toast.error('You can\'t add a blocked user. Unblock them first.');
        return;
      }
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [],
  );

  const runAdd = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setSubmitting(true);
    setDone(false);
    setProgress(new Map(ids.map((id) => [id, { status: 'pending' as AddStatus }])));

    let success = 0;
    let failed = 0;
    for (const id of ids) {
      // Re-check blocked at submit time (defense in depth)
      if (blockedIds.has(id)) {
        setProgress((prev) => {
          const next = new Map(prev);
          next.set(id, { status: 'failed', reason: 'Blocked user' });
          return next;
        });
        failed += 1;
        continue;
      }
      try {
        await groupMessageService.addParticipant(conversationId, id);
        const profile = (connections || []).find((c) => c.id === id);
        await groupMessageService.sendSystemMessage(
          conversationId,
          `${user?.user_metadata?.full_name || 'Someone'} added ${profile?.full_name || 'a member'} to the group`,
        );
        setProgress((prev) => {
          const next = new Map(prev);
          next.set(id, { status: 'success' });
          return next;
        });
        success += 1;
      } catch (err) {
        const reason =
          err instanceof Error && err.message ? err.message : 'Failed to add';
        setProgress((prev) => {
          const next = new Map(prev);
          next.set(id, { status: 'failed', reason });
          return next;
        });
        failed += 1;
      }
    }

    setSubmitting(false);
    setDone(true);
    if (success > 0) toast.success(`Added ${success} member${success !== 1 ? 's' : ''}`);
    if (failed > 0) toast.error(`${failed} could not be added`);
  };

  const handleFinish = () => {
    setProgress(new Map());
    setSelected(new Set());
    setDone(false);
    onAdded();
  };

  const showProgress = submitting || done;

  return (
    <div className="flex flex-col h-full" data-testid="add-members-view">
      <div className="flex items-center gap-2 px-2 py-2 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Back"
          className="h-8 w-8"
          disabled={submitting}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-semibold">Add members</h3>
      </div>

      {showProgress ? (
        <ProgressList
          ids={Array.from(progress.keys())}
          progress={progress}
          connections={connections || []}
          done={done}
          onDone={handleFinish}
        />
      ) : (
        <>
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search connections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                aria-label="Search connections"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="px-3 pb-3 space-y-1">
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : visible.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">
                  {debouncedSearch
                    ? 'No matching connections'
                    : 'All your connections are already in this group'}
                </p>
              ) : (
                <>
                  {visible.map((c) => {
                    const isSel = selected.has(c.id);
                    const isBlocked = blockedIds.has(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggle(c.id, isBlocked)}
                        disabled={isBlocked}
                        className={`flex items-center gap-3 w-full p-2 rounded-md text-left ${
                          isBlocked
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-muted/50'
                        }`}
                        data-testid={`add-row-${c.id}`}
                      >
                        <Checkbox
                          checked={isSel}
                          disabled={isBlocked}
                          className="pointer-events-none"
                        />
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={c.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {(c.full_name || '?').charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{c.full_name}</p>
                          {c.headline && (
                            <p className="text-xs text-muted-foreground truncate">
                              {c.headline}
                            </p>
                          )}
                        </div>
                        {isBlocked ? (
                          <Badge variant="destructive" className="text-[10px] gap-1">
                            <ShieldOff className="h-3 w-3" />
                            Blocked
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            member
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                  {hasMore && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => setVisibleCount((c) => c + ADD_PAGE_SIZE)}
                    >
                      Load more ({available.length - visible.length})
                    </Button>
                  )}
                </>
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-3 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {selected.size} selected
            </span>
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={selected.size === 0}
              data-testid="add-members-submit"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add to group
            </Button>
          </div>
        </>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Add {selected.size} member{selected.size !== 1 ? 's' : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They will be able to read past messages and join the conversation immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                void runAdd();
              }}
            >
              Add
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProgressList({
  ids,
  progress,
  connections,
  done,
  onDone,
}: {
  ids: string[];
  progress: Map<string, AddProgressEntry>;
  connections: ConnectionProfile[];
  done: boolean;
  onDone: () => void;
}) {
  const successCount = Array.from(progress.values()).filter((p) => p.status === 'success').length;
  const failedCount = Array.from(progress.values()).filter((p) => p.status === 'failed').length;

  return (
    <>
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-3 pb-3 pt-3 space-y-1" data-testid="add-progress-list">
          {ids.map((id) => {
            const entry = progress.get(id);
            const profile = connections.find((c) => c.id === id);
            return (
              <div
                key={id}
                className="flex items-center gap-3 p-2 rounded-md"
                data-testid={`progress-row-${id}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {(profile?.full_name || '?').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {profile?.full_name || 'Member'}
                  </p>
                  {entry?.status === 'failed' && entry.reason && (
                    <p className="text-xs text-destructive truncate">{entry.reason}</p>
                  )}
                </div>
                {entry?.status === 'pending' && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {entry?.status === 'success' && (
                  <Check className="h-4 w-4 text-[hsl(var(--module-collaborate))]" />
                )}
                {entry?.status === 'failed' && (
                  <X className="h-4 w-4 text-destructive" />
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="border-t p-3 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground" data-testid="add-progress-summary">
          {done
            ? `${successCount} added, ${failedCount} failed`
            : `Adding... ${successCount + failedCount}/${ids.length}`}
        </span>
        <Button onClick={onDone} disabled={!done} data-testid="add-progress-done">
          Done
        </Button>
      </div>
    </>
  );
}

// ============================================================
// Transfer Ownership sub-view
// ============================================================
function TransferOwnershipView({
  participants,
  currentUserId,
  blockedIds,
  onBack,
  onTransfer,
}: {
  participants: ConversationParticipant[];
  currentUserId: string;
  blockedIds: Set<string>;
  onBack: () => void;
  onTransfer: (newOwnerId: string, alsoLeave: boolean) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | 'transfer' | 'transfer-leave'>(null);
  const [busy, setBusy] = useState(false);

  const eligible = participants.filter((p) => p.user_id !== currentUserId);

  const handleConfirm = async () => {
    if (!selectedId || !confirm) return;
    setBusy(true);
    try {
      await onTransfer(selectedId, confirm === 'transfer-leave');
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-2 py-2 border-b">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back" className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-semibold">Transfer ownership</h3>
      </div>

      <div className="px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Choose a new owner. They will gain full control of the group. You will become a regular
          member unless you also leave.
        </p>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="px-3 pb-3 space-y-1">
          {eligible.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">
              No other members to transfer to. Add a member first.
            </p>
          ) : (
            eligible.map((p) => {
              const isSel = selectedId === p.user_id;
              const isBlocked = blockedIds.has(p.user_id);
              return (
                <button
                  key={p.user_id}
                  onClick={() => {
                    if (isBlocked) {
                      toast.error('You can\'t transfer ownership to a blocked member.');
                      return;
                    }
                    setSelectedId(p.user_id);
                  }}
                  disabled={isBlocked}
                  className={`flex items-center gap-3 w-full p-2 rounded-md text-left transition-colors ${
                    isBlocked
                      ? 'opacity-50 cursor-not-allowed'
                      : isSel
                      ? 'bg-primary/10'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={p.avatar_url || ''} />
                    <AvatarFallback className="text-xs">
                      {(p.full_name || '?').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.full_name}</p>
                    {p.username && (
                      <p className="text-xs text-muted-foreground truncate">@{p.username}</p>
                    )}
                  </div>
                  {isBlocked && (
                    <Badge variant="destructive" className="text-[10px] gap-1">
                      <ShieldOff className="h-3 w-3" />
                      Blocked
                    </Badge>
                  )}
                  {isSel && !isBlocked && <Crown className="h-4 w-4 text-primary" />}
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-3 flex flex-col gap-2">
        <Button
          variant="secondary"
          disabled={!selectedId}
          onClick={() => setConfirm('transfer')}
        >
          <Crown className="h-4 w-4 mr-2" />
          Make new owner
        </Button>
        <Button
          variant="ghost"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          disabled={!selectedId}
          onClick={() => setConfirm('transfer-leave')}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Transfer and leave
        </Button>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && !busy && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === 'transfer-leave' ? 'Transfer and leave?' : 'Transfer ownership?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === 'transfer-leave'
                ? 'You will no longer be the owner and will leave the group. This cannot be undone.'
                : 'You will become a regular member. The new owner can manage the group from this point.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={busy}
              className={confirm === 'transfer-leave' ? 'bg-destructive text-destructive-foreground' : ''}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
