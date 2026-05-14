/**
 * DNA | Introduction Message Card
 *
 * Rich branded card rendered inside message threads when
 * the conversation origin_type === 'introduction'.
 * Reuses the Kente pattern aesthetic from IntroductionModal.
 */

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { User, MessageCircle } from 'lucide-react';
import dnaLogo from '@/assets/dna-logo.png';
import africaIcon from '@/assets/africa-icon.png';
import { MateMasie } from '@/components/icons/adinkra';

const KENTE_PATTERN = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23C4942A' stroke-width='1'%3E%3Cpath d='M0 20h40M20 0v40M0 0h40v40H0z'/%3E%3Crect x='5' y='5' width='10' height='10' fill='%23C4942A' fill-opacity='0.3'/%3E%3Crect x='25' y='25' width='10' height='10' fill='%23C4942A' fill-opacity='0.3'/%3E%3C/g%3E%3C/svg%3E")`;

interface IntroductionParticipant {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
  headline: string | null;
}

interface IntroductionMessageCardProps {
  /** The introducer's profile */
  introducer: IntroductionParticipant;
  /** Person A being introduced */
  personA: IntroductionParticipant;
  /** Person B being introduced */
  personB: IntroductionParticipant;
  /** The introduction message */
  message: string;
  /** Callback to focus the reply input */
  onSayHello?: () => void;
  /** The current viewing user's ID — used to determine which profile is "the other person" */
  currentUserId?: string;
}

export function IntroductionMessageCard({
  introducer,
  personA,
  personB,
  message,
  onSayHello,
  currentUserId,
}: IntroductionMessageCardProps) {
  const navigate = useNavigate();

  const initials = (name: string | null) =>
    name
      ? name
          .split(' ')
          .map(n => n[0])
          .join('')
          .slice(0, 2)
      : '?';

  // Determine "the other person" to view — if current user is person A, show B and vice versa
  const otherPerson =
    currentUserId === personA.id ? personB : personA;

  const goToProfile = (username: string | null) => {
    if (username) navigate(`/dna/${username}`);
  };

  return (
    <div className="w-full max-w-sm mx-auto my-2">
      <div
        className="rounded-lg overflow-hidden shadow-lg border border-border/30"
        style={{
          backgroundImage: KENTE_PATTERN,
          backgroundColor: 'hsl(var(--background))',
        }}
      >
        {/* Overlay */}
        <div className="relative">
          <div
            className="absolute inset-0 bg-background/[0.90] pointer-events-none"
            style={{ borderRadius: 'inherit' }}
          />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex flex-col items-center pt-5 pb-2">
              <img src={dnaLogo} alt="DNA" className="h-10 w-auto mb-2" />
              <div className="flex items-center gap-1.5">
                <MateMasie className="w-3.5 h-3.5 text-[hsl(var(--dna-gold))]" />
                <span className="text-sm font-bold text-foreground font-display">
                  You've been introduced!
                </span>
                <MateMasie className="w-3.5 h-3.5 text-[hsl(var(--dna-gold))]" />
              </div>
            </div>

            {/* Profile photos with connection arrow */}
            <div className="flex items-center justify-center gap-0 py-3 px-4">
              {/* Person A */}
              <button
                type="button"
                onClick={() => goToProfile(personA.username)}
                className="focus:outline-none rounded-full transition-transform hover:scale-105"
                aria-label={`View ${personA.full_name}'s profile`}
              >
                <Avatar className="w-14 h-14 border-2 border-background shadow-md">
                  <AvatarImage src={personA.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {initials(personA.full_name)}
                  </AvatarFallback>
                </Avatar>
              </button>

              {/* Animated connection line */}
              <div className="flex items-center gap-0 mx-1">
                <div className="relative w-4 h-[2px] bg-primary/20 overflow-hidden">
                  <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary animate-arrow-travel-right" />
                </div>
                <div className="w-8 h-8 rounded-full bg-background border border-primary/20 flex items-center justify-center shadow-sm">
                  <img src={africaIcon} alt="" className="w-5 h-5 object-contain" />
                </div>
                <div className="relative w-4 h-[2px] bg-primary/20 overflow-hidden">
                  <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary animate-arrow-travel-right" />
                </div>
              </div>

              {/* Person B */}
              <button
                type="button"
                onClick={() => goToProfile(personB.username)}
                className="focus:outline-none rounded-full transition-transform hover:scale-105"
                aria-label={`View ${personB.full_name}'s profile`}
              >
                <Avatar className="w-14 h-14 border-2 border-background shadow-md">
                  <AvatarImage src={personB.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {initials(personB.full_name)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>

            {/* Names */}
            <div className="flex justify-center gap-6 text-center px-4">
              <p className="text-xs font-semibold text-foreground max-w-[100px] truncate">
                {personA.full_name}
              </p>
              <p className="text-xs font-semibold text-foreground max-w-[100px] truncate">
                {personB.full_name}
              </p>
            </div>

            {/* Introduced by */}
            <div className="flex items-center justify-center gap-1.5 mt-2 px-4">
              <Avatar className="w-4 h-4">
                <AvatarImage src={introducer.avatar_url || undefined} />
                <AvatarFallback className="bg-muted text-[7px]">
                  {initials(introducer.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-muted-foreground">
                Introduced by{' '}
                <button
                  type="button"
                  onClick={() => goToProfile(introducer.username)}
                  className="font-medium text-foreground hover:underline"
                >
                  {introducer.full_name}
                </button>
              </span>
            </div>

            {/* Message */}
            <div className="px-5 py-3">
              <p className="text-[13px] text-foreground/90 leading-snug whitespace-pre-wrap text-center italic">
                "{message}"
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex gap-2 px-5 pb-5">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs rounded-lg gap-1"
                onClick={() => goToProfile(otherPerson.username)}
              >
                <User className="w-3 h-3" />
                View Profile
              </Button>
              {onSayHello && (
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs rounded-lg gap-1"
                  onClick={onSayHello}
                >
                  <MessageCircle className="w-3 h-3" />
                  Say Hello
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IntroductionMessageCard;
