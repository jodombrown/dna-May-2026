/**
 * AffirmedRecord — state 4 of the Affirmation flow. The completed, immutable
 * Affirmation record shown at /dna/affirm once the user is Affirmed. Read-only.
 */

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useResolvedMember } from '@/hooks/useAffirmation';
import type { Affirmation } from '@/services/affirmationsService';
import { affirmationChromeContent as C } from '@/content/affirmation-chrome.content';
import type { AffirmRole } from '@/content/affirmation-ceremony.content';
import DeclarationBody from './DeclarationBody';

const initials = (name: string) =>
  name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');

const formatDate = (iso: string | null): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

interface AffirmedRecordProps {
  affirmation: Affirmation;
}

const AffirmedRecord: React.FC<AffirmedRecordProps> = ({ affirmation }) => {
  const role = affirmation.role_at_affirm as AffirmRole;
  const { data: witness } = useResolvedMember(affirmation.witness_id);
  const witnessName = witness?.name ?? C.affirmed.unnamedWitness;
  const affirmedOn = formatDate(affirmation.affirmed_at);
  const attestedOn = formatDate(affirmation.attested_at);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-8">
        <header className="space-y-2 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-dna-copper">
            {C.affirmed.eyebrow}
          </p>
          <h1 className="text-2xl font-bold text-dna-forest">{C.affirmed.title}</h1>
        </header>

        <DeclarationBody role={role} />

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-dna-forest">{C.affirmed.statementLabel}</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {affirmation.statement?.trim() || C.affirmed.noStatement}
          </p>
        </section>

        <section className="space-y-3 rounded-lg border border-border bg-dna-sand-light/40 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              {witness?.avatarUrl && <AvatarImage src={witness.avatarUrl} alt={witnessName} />}
              <AvatarFallback>{initials(witnessName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{C.affirmed.witnessLabel}</p>
              <p className="font-medium text-dna-forest truncate">{witnessName}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
            {affirmedOn && (
              <p className="text-muted-foreground">
                {C.affirmed.affirmedOnLabel}: <span className="text-dna-forest">{affirmedOn}</span>
              </p>
            )}
            {attestedOn && (
              <p className="text-muted-foreground">
                {C.affirmed.attestedOnLabel}: <span className="text-dna-forest">{attestedOn}</span>
              </p>
            )}
          </div>
        </section>

        <p className="text-xs text-center text-muted-foreground">{C.affirmed.immutableNote}</p>
      </div>
    </div>
  );
};

export default AffirmedRecord;
