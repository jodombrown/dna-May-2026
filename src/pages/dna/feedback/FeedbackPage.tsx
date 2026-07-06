import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mpatapo } from '@/components/icons/adinkra';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ArrowLeft, BarChart2, LogOut, LogIn, Loader2, HelpCircle, Bug, Lightbulb, MessageCircle, Heart } from 'lucide-react';
import { FeedbackMessageList, FeedbackComposer, FeedbackAnalytics } from '@/components/feedback';
import { FeedbackHubTour } from '@/components/tours';
import { useFeedbackMessages } from '@/hooks/useFeedbackMessages';
import { useFeedbackMembership } from '@/hooks/useFeedbackMembership';
import { useAuth } from '@/contexts/AuthContext';
import type { FeedbackFilter, UserTag } from '@/types/feedback';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { DnaMobileHubShell } from '@/components/mobile/DnaMobileHubShell';

export default function FeedbackPage() {
  const navigate = useNavigate();
  const { user, loading: isAuthLoading } = useAuth();
  const composerRef = useRef<HTMLFormElement>(null);
  const [filter, setFilter] = useState<FeedbackFilter>('all');
  const [selectedTag, setSelectedTag] = useState<UserTag | null>(null);
  const [replyTo, setReplyTo] = useState<{
    id: string;
    username: string;
    preview: string;
  } | null>(null);
  const [showHelpTour, setShowHelpTour] = useState(false);

  const {
    channel,
    membership,
    isLoading: isMembershipLoading,
    isOptedIn,
    isOptedOut,
    isAdmin,
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
    if (channel?.id) {
      updateLastRead();
    }
  }, [channel?.id]);

  const handleReply = useCallback(async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message) {
      setReplyTo({
        id: message.id,
        username: message.sender?.username || 'anonymous',
        preview: message.content || '',
      });
    }
  }, [messages]);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  const handleHeroCardClick = useCallback((tag: UserTag | null) => {
    setSelectedTag(tag);
    setTimeout(() => {
      composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

  // Loading state
  if (isAuthLoading || isMembershipLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not logged in state
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-md w-full rounded-lg border border-border bg-card p-8 text-center shadow-lg"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">
            Join the DNA community to share your thoughts, report bugs, and suggest features.
          </p>
          <Button onClick={() => navigate('/auth')} size="lg" className="w-full">
            Sign In
          </Button>
        </motion.div>
      </div>
    );
  }

  // Opted out state
  if (isOptedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-md w-full rounded-lg border border-border bg-card p-8 text-center shadow-lg"
        >
          <div className="text-4xl mb-4">👋</div>
          <h2 className="text-xl font-semibold mb-2">You've opted out</h2>
          <p className="text-muted-foreground mb-6">
            You're not receiving feedback hub updates. Opt back in to participate.
          </p>
          <Button onClick={() => optIn()} disabled={isOptingIn} size="lg" className="w-full">
            {isOptingIn && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Opt Back In
          </Button>
        </motion.div>
      </div>
    );
  }

  const HERO_CARDS = [
    {
      icon: Bug,
      title: 'Report Bugs',
      description: 'Found something broken? Let us know.',
      tag: 'bug' as UserTag,
      gradient: 'from-red-500/10 to-red-500/5',
      iconBg: 'bg-red-500/15',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    {
      icon: Lightbulb,
      title: 'Suggest Features',
      description: "Have an idea? We're all ears.",
      tag: 'suggestion' as UserTag,
      gradient: 'from-amber-500/10 to-amber-500/5',
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      icon: Heart,
      title: 'Share Praise',
      description: "Tell us what's working well.",
      tag: 'praise' as UserTag,
      gradient: 'from-copper-500/10 to-copper-500/5',
      iconBg: 'bg-copper-500/15',
      iconColor: 'text-copper-600 dark:text-copper-400',
    },
    {
      icon: MessageCircle,
      title: 'General Feedback',
      description: "Open conversation about DNA.",
      tag: null,
      gradient: 'from-primary/10 to-primary/5',
      iconBg: 'bg-primary/15',
      iconColor: 'text-primary',
    },
  ];

  return (
    <DnaMobileHubShell bubble={{ kind: 'static', placeholder: 'Alpha Feedback' }}>
    <div className="flex flex-col bg-background min-h-screen">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-primary/10">
        {/* Subtle pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23B87333' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 px-4 md:px-6 py-4 md:py-6 max-w-5xl mx-auto">
          {/* Nav row */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHelpTour(true)}
                className="gap-1.5 h-8"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Help</span>
              </Button>
              {isAdmin && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 h-8">
                      <BarChart2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Analytics</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Feedback Analytics</SheetTitle>
                    </SheetHeader>
                    <FeedbackAnalytics className="mt-6" />
                  </SheetContent>
                </Sheet>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => optOut()}
                disabled={isOptingOut}
                title="Opt out"
                className="h-8 w-8"
              >
                {isOptingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Hero content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-center mb-5 md:mb-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 mb-3">
              <Mpatapo className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Alpha Feedback</span>
            </div>
            <h1 className="text-h1 font-serif text-foreground mb-2">
              Help Shape DNA's Future
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto">
              Your voice matters. Report bugs, suggest features, and share what excites you.
            </p>
          </motion.div>

          {/* Action cards - horizontal scroll on mobile, grid on desktop */}
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 md:grid md:grid-cols-4 md:overflow-visible md:pb-0 snap-x snap-mandatory">
            {HERO_CARDS.map((card, i) => (
              <motion.button
                key={card.title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                onClick={() => handleHeroCardClick(card.tag)}
                className={cn(
                  'flex-shrink-0 w-[140px] md:w-auto snap-start',
                  'rounded-xl border border-border/50 p-3 md:p-4 text-left',
                  'bg-gradient-to-br backdrop-blur-sm',
                  'hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
                  'transition-all duration-200 group',
                  card.gradient
                )}
              >
                <div className={cn('inline-flex p-2 rounded-xl mb-2 group-hover:scale-110 transition-transform', card.iconBg)}>
                  <card.icon className={cn('h-4 w-4 md:h-5 md:w-5', card.iconColor)} />
                </div>
                <h3 className="font-semibold text-xs md:text-sm text-foreground mb-0.5">{card.title}</h3>
                <p className="text-[11px] md:text-xs text-muted-foreground leading-tight hidden md:block">{card.description}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b px-4 md:px-6 py-2 max-w-5xl mx-auto w-full shrink-0">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FeedbackFilter)}>
          <TabsList className="h-9 bg-muted/50">
            <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
            <TabsTrigger value="my_feedback" className="text-xs px-3">Mine</TabsTrigger>
            <TabsTrigger value="pinned" className="text-xs px-3">📌 Pinned</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Message List */}
      <div className="flex-1 min-h-0 max-w-5xl mx-auto w-full">
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
      </div>

      {/* Composer */}
      <div className="max-w-5xl mx-auto w-full">
        {channel && isMembershipReady && (
          <FeedbackComposer
            channelId={channel.id}
            replyTo={replyTo}
            onCancelReply={handleCancelReply}
            initialTag={selectedTag}
            composerRef={composerRef}
          />
        )}
      </div>

      {/* Help Tour */}
      <FeedbackHubTour
        open={showHelpTour}
        onClose={() => setShowHelpTour(false)}
      />
    </div>
  );
}
