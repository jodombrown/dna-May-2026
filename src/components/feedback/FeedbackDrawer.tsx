import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
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
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, LogIn, Loader2, ChevronRight, HelpCircle, MessageSquareHeart, Bug, Lightbulb, MessageCircle } from 'lucide-react';
import { FeedbackMessageList, FeedbackComposer } from '@/components/feedback';
import { FeedbackThreadView } from './FeedbackThreadView';
import { useFeedbackMessages } from '@/hooks/useFeedbackMessages';
import { useFeedbackMembership } from '@/hooks/useFeedbackMembership';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { FeedbackHubTour } from '@/components/tours';
import { cn } from '@/lib/utils';
import type { FeedbackFilter, FeedbackMessageWithSender } from '@/types/feedback';

interface FeedbackDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackDrawer({ isOpen, onClose }: FeedbackDrawerProps) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [filter, setFilter] = useState<FeedbackFilter>('all');
  const [replyTo, setReplyTo] = useState<{
    id: string;
    username: string;
    preview: string;
  } | null>(null);
  const [selectedThread, setSelectedThread] = useState<FeedbackMessageWithSender | null>(null);
  const [showOptOutConfirm, setShowOptOutConfirm] = useState(false);
  const [showHelpTour, setShowHelpTour] = useState(false);

  const {
    channel,
    isLoading: isMembershipLoading,
    isAdmin,
    isOptedIn,
    isOptedOut,
    optOut,
    optIn,
    isOptingOut,
    isOptingIn,
    updateLastRead,
  } = useFeedbackMembership();

  const isMembershipReady = !isMembershipLoading && isOptedIn;

  const {
    messages,
    isLoading: isMessagesLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useFeedbackMessages(channel?.id || null, filter, isMembershipReady);

  useEffect(() => {
    if (isOpen && channel?.id) {
      updateLastRead();
    }
  }, [isOpen, channel?.id]);

  const handleReply = useCallback((messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message) {
      if (message.reply_count > 0) {
        setSelectedThread(message);
      } else {
        setReplyTo({
          id: message.id,
          username: message.sender?.username || 'anonymous',
          preview: message.content || '',
        });
      }
    }
  }, [messages]);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  const handleOptOutClick = () => {
    setShowOptOutConfirm(true);
  };

  const handleConfirmOptOut = () => {
    optOut();
    setShowOptOutConfirm(false);
    onClose();
    toast({
      title: "You've opted out of the Feedback Hub",
      description: "To opt back in, tap the feedback button again and select 'Opt Back In'.",
      duration: 6000,
    });
  };

  const QUICK_ACTIONS = [
    { icon: Bug, label: 'Bug', color: 'text-red-500' },
    { icon: Lightbulb, label: 'Idea', color: 'text-amber-500' },
    { icon: MessageCircle, label: 'Feedback', color: 'text-primary' },
  ];

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col overflow-visible border-l border-border/50" hideCloseButton>
          {/* Left-edge chevron close tab */}
          <button
            onClick={onClose}
            className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 z-[60] flex items-center justify-center w-6 h-16 md:w-8 md:h-20 bg-card border border-r-0 border-border hover:bg-muted rounded-l-lg shadow-md transition-all duration-200"
            aria-label="Close Feedback Hub"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-foreground" />
          </button>

          {/* Branded Header */}
          <div className="relative px-4 py-3 border-b bg-gradient-to-r from-primary/5 via-transparent to-primary/10 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <MessageSquareHeart className="h-[18px] w-[18px] text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-foreground leading-tight tracking-tight">Feedback Hub</h2>
                  <p className="text-xs text-muted-foreground">Help shape DNA</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHelpTour(true)}
                className="h-8 w-8 shrink-0"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Auth Loading State */}
          {authLoading ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !user ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-xs">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
                  <LogIn className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Sign in to share feedback</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Join the DNA community to share your thoughts and shape the platform.
                </p>
                <Button onClick={() => { onClose(); navigate('/auth'); }} className="w-full">
                  Sign In
                </Button>
              </div>
            </div>
          ) : isOptedOut ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-xs">
                <div className="text-4xl mb-4">👋</div>
                <h3 className="text-lg font-semibold mb-2">You've opted out</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  You're not receiving feedback hub updates. Opt back in to participate.
                </p>
                <Button onClick={() => optIn()} disabled={isOptingIn} className="w-full">
                  {isOptingIn && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Opt Back In
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Compact Filter Bar */}
              <div className="px-3 py-2 border-b shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <Tabs value={filter} onValueChange={(v) => setFilter(v as FeedbackFilter)}>
                    <TabsList className="h-8 bg-muted/50">
                      <TabsTrigger value="all" className="text-xs h-7 px-2.5">All</TabsTrigger>
                      <TabsTrigger value="my_feedback" className="text-xs h-7 px-2.5">Mine</TabsTrigger>
                      <TabsTrigger value="pinned" className="text-xs h-7 px-2.5">📌</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleOptOutClick}
                    disabled={isOptingOut}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    title="Opt out of feedback"
                  >
                    {isOptingOut ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <LogOut className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Message List */}
              <FeedbackMessageList
                messages={messages}
                channelId={channel?.id || ''}
                isLoading={isMessagesLoading}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage ?? false}
                onLoadMore={() => fetchNextPage()}
                onReply={handleReply}
                isAdmin={isAdmin}
              />

              {/* Composer */}
              {channel && isMembershipReady && (
                <FeedbackComposer
                  channelId={channel.id}
                  replyTo={replyTo}
                  onCancelReply={handleCancelReply}
                />
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Thread View Dialog */}
      {selectedThread && channel && (
        <FeedbackThreadView
          parentMessage={selectedThread}
          channelId={channel.id}
          isOpen={!!selectedThread}
          onClose={() => setSelectedThread(null)}
          isAdmin={isAdmin}
        />
      )}

      {/* Opt Out Confirmation */}
      <AlertDialog open={showOptOutConfirm} onOpenChange={setShowOptOutConfirm}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Opt out of Feedback Hub?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to opt out? You will no longer see the feedback button or receive updates.</p>
              <p className="font-medium text-foreground">
                To opt back in later, tap the feedback button and select "Opt Back In".
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, stay in</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmOptOut}>
              Yes, opt me out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Help Tour */}
      <FeedbackHubTour
        open={showHelpTour}
        onClose={() => setShowHelpTour(false)}
      />
    </>
  );
}
