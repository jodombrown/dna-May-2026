/**
 * DNA | Introduction Modal
 *
 * Bumble-card-inspired warm introduction workflow.
 * DNA logo, profile photos with animated connection arrow,
 * editable message (500 chars, auto-stretch), branded colors.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Check, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  sendGroupIntroduction,
  generateIntroMessage,
} from '@/services/introductionService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import dnaLogo from '@/assets/dna-logo.png';
import africaIcon from '@/assets/africa-icon.png';
import { IntroductionToneSelector } from './IntroductionToneSelector';
import { IntroductionInsightChips } from './IntroductionInsightChips';

// --- Kente pattern as inline SVG data URI ---
const KENTE_PATTERN = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23C4942A' stroke-width='1'%3E%3Cpath d='M0 20h40M20 0v40M0 0h40v40H0z'/%3E%3Crect x='5' y='5' width='10' height='10' fill='%23C4942A' fill-opacity='0.3'/%3E%3Crect x='25' y='25' width='10' height='10' fill='%23C4942A' fill-opacity='0.3'/%3E%3C/g%3E%3C/svg%3E")`;

interface ProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  username: string | null;
  country_of_origin: string | null;
}

interface IntroductionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personAId: string;
  personBId: string;
  introducerId: string;
  context?: Record<string, unknown>;
}

type ModalState = 'compose' | 'sending' | 'success';

const MAX_CHARS = 500;

export function IntroductionModal({
  open,
  onOpenChange,
  personAId,
  personBId,
  introducerId,
  context,
}: IntroductionModalProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profileA, setProfileA] = useState<ProfileData | null>(null);
  const [profileB, setProfileB] = useState<ProfileData | null>(null);
  const [message, setMessage] = useState('');
  const [modalState, setModalState] = useState<ModalState>('compose');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [activeTone, setActiveTone] = useState<string | null>(null);

  // Fetch profiles
  useEffect(() => {
    if (!open) return;

    const fetchProfiles = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, headline, username, country_of_origin')
        .in('id', [personAId, personBId]);

      if (data) {
        setProfileA(data.find(p => p.id === personAId) || null);
        setProfileB(data.find(p => p.id === personBId) || null);
      }
    };

    fetchProfiles();
  }, [open, personAId, personBId]);

  // Generate default message when profiles load
  useEffect(() => {
    if (profileA && profileB && !message) {
      const generated = generateIntroMessage(
        profileA.full_name || 'there',
        profileB.full_name || 'there',
        profileA.headline || undefined,
        profileB.headline || undefined
      );
      setMessage(generated.slice(0, MAX_CHARS));
    }
  }, [profileA, profileB, message]);

  const handleOpenChange = useCallback(
    (val: boolean) => {
    if (!val) {
      setTimeout(() => {
        setModalState('compose');
        setMessage('');
        setConversationId(null);
        setActiveTone(null);
      }, 300);
      }
      onOpenChange(val);
    },
    [onOpenChange]
  );

  const handleSend = async () => {
    if (!message.trim() || message.length > MAX_CHARS) return;
    setModalState('sending');

    const result = await sendGroupIntroduction({
      introducerId,
      personAId,
      personBId,
      message: message.trim(),
      introType: 'group',
      context,
    });

    if (result.success) {
      setConversationId(result.conversationId || null);
      setModalState('success');

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#4A8D77', '#C4942A', '#2A7A8C'],
      });
    } else {
      setModalState('compose');
      toast({
        title: 'Introduction failed',
        description: result.error || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const initials = (name: string | null) =>
    name
      ? name
          .split(' ')
          .map(n => n[0])
          .join('')
          .slice(0, 2)
      : '?';

  const goToProfile = (username: string | null) => {
    if (username) {
      handleOpenChange(false);
      navigate(`/dna/${username}`);
    }
  };

  const isOverLimit = message.length > MAX_CHARS;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px] gap-0 !p-0 overflow-hidden rounded-lg !border-0 shadow-2xl bg-transparent">
        {/* Full-flush Kente pattern background */}
        <div
          className="relative"
          style={{
            backgroundImage: KENTE_PATTERN,
            backgroundColor: 'hsl(var(--background))',
          }}
        >
          {/* Soft overlay so content is readable */}
          <div className="absolute inset-0 bg-background/[0.92] pointer-events-none" />

          <div className="relative z-10">
            {/* Top section: DNA Logo */}
            <div className="flex flex-col items-center pt-8 pb-3">
              <img
                src={dnaLogo}
                alt="DNA"
                className="h-[88px] w-auto mb-4"
              />
            </div>

            {modalState === 'success' ? (
              /* Success State */
              <div className="flex flex-col items-center px-8 pb-8 text-center">
                <h2 className="text-2xl font-bold text-foreground mb-1 font-display">
                  Introduction Sent!
                </h2>
                <p className="text-sm text-muted-foreground mb-8">
                  {profileA?.full_name} and {profileB?.full_name} are now connected in a group thread.
                </p>

                {/* Overlapping avatars in success */}
                <div className="flex items-center justify-center mb-8">
                  <Avatar className="w-18 h-18 border-[3px] border-background shadow-lg z-10">
                    <AvatarImage src={profileA?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                      {initials(profileA?.full_name ?? null)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="w-12 h-12 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center -mx-3 z-20 shadow-md">
                    <Check className="w-6 h-6 text-primary" />
                  </div>
                  <Avatar className="w-18 h-18 border-[3px] border-background shadow-lg z-10">
                    <AvatarImage src={profileB?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                      {initials(profileB?.full_name ?? null)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex gap-3 w-full">
                  {conversationId && (
                    <Button
                      className="flex-1 h-12 rounded-xl text-base font-semibold"
                      onClick={() => {
                        handleOpenChange(false);
                        navigate(`/dna/messages?conversation=${conversationId}`);
                      }}
                    >
                      View Conversation
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl text-base font-semibold"
                    onClick={() => handleOpenChange(false)}
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              /* Compose State */
              <div className="px-8 pb-8">
                {/* Headline */}
                <h2 className="text-center text-2xl font-bold text-foreground mb-6 font-display">
                  Make an Introduction
                </h2>

                {/* Profile photos with animated connection arrow */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-0 mb-6">
                  {/* Person A */}
                  <div className="flex flex-col items-center text-center px-1">
                    <button
                      type="button"
                      onClick={() => goToProfile(profileA?.username ?? null)}
                      className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full transition-transform hover:scale-105"
                      aria-label={`View ${profileA?.full_name || 'user'}'s profile`}
                    >
                      <Avatar className="w-[88px] h-[88px] border-[3px] border-background shadow-lg">
                        <AvatarImage src={profileA?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                          {initials(profileA?.full_name ?? null)}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                    <p className="text-sm font-semibold text-foreground leading-tight mt-3">
                      {profileA?.full_name || 'Loading...'}
                    </p>
                    {profileA?.headline && (
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 max-w-[140px]">
                        {profileA.headline}
                      </p>
                    )}
                    {profileA?.country_of_origin && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-0.5 mt-1">
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        <span>{profileA.country_of_origin}</span>
                      </p>
                    )}
                  </div>

                  {/* Animated connection arrow through Africa icon */}
                  <div className="flex items-center justify-center pt-6 px-1">
                    <ConnectionArrow africaIcon={africaIcon} />
                  </div>

                  {/* Person B */}
                  <div className="flex flex-col items-center text-center px-1">
                    <button
                      type="button"
                      onClick={() => goToProfile(profileB?.username ?? null)}
                      className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full transition-transform hover:scale-105"
                      aria-label={`View ${profileB?.full_name || 'user'}'s profile`}
                    >
                      <Avatar className="w-[88px] h-[88px] border-[3px] border-background shadow-lg">
                        <AvatarImage src={profileB?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                          {initials(profileB?.full_name ?? null)}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                    <p className="text-sm font-semibold text-foreground leading-tight mt-3">
                      {profileB?.full_name || 'Loading...'}
                    </p>
                    {profileB?.headline && (
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 max-w-[140px]">
                        {profileB.headline}
                      </p>
                    )}
                    {profileB?.country_of_origin && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-0.5 mt-1">
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        <span>{profileB.country_of_origin}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Context reasons */}
                {context && Object.keys(context).length > 0 && (
                  <ContextBlock context={context} />
                )}

                {/* Tone Selector */}
                <IntroductionToneSelector
                  personAName={profileA?.full_name || 'there'}
                  personBName={profileB?.full_name || 'there'}
                  personAHeadline={profileA?.headline || undefined}
                  personBHeadline={profileB?.headline || undefined}
                  activeTone={activeTone}
                  onSelectTone={(toneId, msg) => {
                    setActiveTone(toneId);
                    setMessage(msg.slice(0, MAX_CHARS));
                  }}
                />

                {/* DIA Insight Chips */}
                <IntroductionInsightChips
                  personAId={personAId}
                  personBId={personBId}
                  personAName={profileA?.full_name || 'there'}
                  personBName={profileB?.full_name || 'there'}
                  onInsertSentence={(sentence) => {
                    setMessage(prev => {
                      const newMsg = prev ? `${prev} ${sentence}` : sentence;
                      return newMsg.slice(0, MAX_CHARS);
                    });
                  }}
                />

                {/* Message composer */}
                <div className="mb-5">
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5 text-center">
                    Your introduction message
                  </label>
                  <textarea
                    value={message}
                    onChange={e => {
                      setMessage(e.target.value);
                    }}
                    className={cn(
                      'w-full min-h-[90px] rounded-xl border-[1.5px] bg-background px-4 py-3 text-sm',
                      'placeholder:text-muted-foreground/50',
                      'focus:outline-none focus:border-primary focus:shadow-sm',
                      'transition-[border-color,box-shadow] duration-150',
                      'resize-y',
                      isOverLimit
                        ? 'border-destructive'
                        : 'border-border'
                    )}
                    placeholder="Write a warm introduction..."
                    style={{ fieldSizing: 'content' } as React.CSSProperties}
                  />
                  <p className={cn(
                    'text-[11px] text-right mt-1',
                    isOverLimit ? 'text-destructive font-semibold' : 'text-muted-foreground'
                  )}>
                    {message.length}/{MAX_CHARS}
                  </p>
                </div>

                {/* Send button */}
                <Button
                  className="w-full h-12 rounded-xl text-base font-semibold"
                  disabled={!message.trim() || isOverLimit || modalState === 'sending'}
                  onClick={handleSend}
                >
                  {modalState === 'sending' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Introduction'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Animated Connection Arrow ──────────────────────── */

function ConnectionArrow({ africaIcon }: { africaIcon: string }) {
  return (
    <div className="flex items-center gap-0">
      {/* Left arrow line with traveling dot */}
      <div className="relative w-6 h-[2px] bg-primary/20 overflow-hidden">
        <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary animate-arrow-travel-right" />
      </div>

      {/* Africa icon center */}
      <div className="w-12 h-12 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center shadow-md animate-pulse">
        <img
          src={africaIcon}
          alt="Africa"
          className="w-7 h-7 object-contain"
        />
      </div>

      {/* Right arrow line with traveling dot */}
      <div className="relative w-6 h-[2px] bg-primary/20 overflow-hidden">
        <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary animate-arrow-travel-right" />
      </div>
    </div>
  );
}

/* ── Context Block ──────────────────────────────────── */

function ContextBlock({ context }: { context: Record<string, unknown> }) {
  const reasons = Object.entries(context)
    .filter(([, v]) => v)
    .map(([k, v]) => {
      if (k === 'sharedSkills' && Array.isArray(v))
        return `Shared skills: ${(v as string[]).join(', ')}`;
      if (k === 'sharedSectors' && Array.isArray(v))
        return `Same sectors: ${(v as string[]).join(', ')}`;
      return null;
    })
    .filter(Boolean);

  if (reasons.length === 0) return null;

  return (
    <div className="rounded-xl bg-muted/40 px-3 py-2.5 mb-4 border border-border/30">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        Why connect them?
      </p>
      {reasons.map((reason, i) => (
        <p key={i} className="text-xs text-foreground">
          {reason}
        </p>
      ))}
    </div>
  );
}

export default IntroductionModal;
