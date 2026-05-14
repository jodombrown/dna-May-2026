/**
 * WelcomeOverlay - Sprint 12B
 *
 * Brief welcome overlay shown after first login. Non-blocking —
 * user can dismiss immediately with "Start Exploring".
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, UserCircle, X } from 'lucide-react';

interface WelcomeOverlayProps {
  firstName: string;
  onDismiss: () => void;
  onCompleteProfile: () => void;
}

export function WelcomeOverlay({ firstName, onDismiss, onCompleteProfile }: WelcomeOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-md relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-neutral-100 transition-colors z-10"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-neutral-400" />
        </button>

        {/* Decorative gradient */}
        <div className="h-2 bg-gradient-to-r from-dna-emerald via-dna-copper to-dna-gold" />

        <CardContent className="p-6 sm:p-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              Welcome to DNA, {firstName}!
            </h2>
            <p className="text-muted-foreground">
              You're now part of the Diaspora Network of Africa.
            </p>

            <div className="text-left space-y-3 py-4">
              <div className="flex items-start gap-3">
                <ArrowRight className="h-5 w-5 text-dna-emerald flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  <strong>Complete your profile</strong> to unlock personalized recommendations
                </p>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRight className="h-5 w-5 text-dna-copper flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  <strong>Explore the Five C's</strong> to discover what DNA offers
                </p>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRight className="h-5 w-5 text-dna-gold flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  <strong>DIA</strong> (your Diaspora Intelligence Agent) will guide you along the way
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={onDismiss}
                className="flex-1 bg-dna-emerald hover:bg-dna-emerald/90 text-white"
              >
                Start Exploring
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={onCompleteProfile}
                className="flex-1"
              >
                <UserCircle className="h-4 w-4 mr-2" />
                Complete Profile First
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
