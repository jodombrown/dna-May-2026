/**
 * PendingScreen — state 2 of the Affirmation flow (also what /dna/affirm shows
 * when a pending row exists). Shows the named witness, and lets the declarer
 * edit their statement and re-pick their witness (UPDATE on own row). No
 * self-attest affordance anywhere.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  useResolvedMember,
  useEligibleWitnesses,
  useUpdateAffirmation,
} from '@/hooks/useAffirmation';
import type { Affirmation } from '@/services/affirmationsService';
import { affirmationChromeContent as C } from '@/content/affirmation-chrome.content';
import type { AffirmRole } from '@/content/affirmation-ceremony.content';
import DeclarationBody from './DeclarationBody';
import WitnessList from './WitnessList';
import { STATEMENT_MAX } from './CeremonyScreen';

const initials = (name: string) =>
  name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');

type EditMode = 'none' | 'statement' | 'witness';

interface PendingScreenProps {
  affirmation: Affirmation;
}

const PendingScreen: React.FC<PendingScreenProps> = ({ affirmation }) => {
  const { toast } = useToast();
  const role = affirmation.role_at_affirm as AffirmRole;
  const { data: witness } = useResolvedMember(affirmation.witness_id);
  const update = useUpdateAffirmation();

  const [mode, setMode] = useState<EditMode>('none');
  const [draftStatement, setDraftStatement] = useState(affirmation.statement ?? '');
  const [draftWitnessId, setDraftWitnessId] = useState<string | null>(affirmation.witness_id);

  const { data: candidates, isLoading: witnessesLoading } = useEligibleWitnesses(
    role,
    mode === 'witness',
  );

  const witnessName = witness?.name ?? C.pending.unnamedWitness;

  const resetDrafts = () => {
    setDraftStatement(affirmation.statement ?? '');
    setDraftWitnessId(affirmation.witness_id);
    setMode('none');
  };

  const saveStatement = async () => {
    try {
      await update.mutateAsync({
        id: affirmation.id,
        updates: { statement: draftStatement.trim() ? draftStatement.trim() : null },
      });
      toast({ title: C.pending.savedToast });
      setMode('none');
    } catch {
      toast({ title: C.pending.saveError, variant: 'destructive' });
    }
  };

  const saveWitness = async () => {
    if (!draftWitnessId) return;
    try {
      await update.mutateAsync({
        id: affirmation.id,
        updates: { witnessId: draftWitnessId },
      });
      toast({ title: C.pending.savedToast });
      setMode('none');
    } catch {
      toast({ title: C.pending.saveError, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-8">
        <header className="space-y-2 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-dna-copper">
            {C.pending.eyebrow}
          </p>
          <h1 className="text-2xl font-bold text-dna-forest">{C.pending.title}</h1>
          <p className="text-sm text-muted-foreground">{C.pending.statusNote}</p>
        </header>

        <DeclarationBody role={role} />

        {/* Statement */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-dna-forest">{C.affirmed.statementLabel}</h2>
            {mode === 'none' && (
              <Button variant="ghost" size="sm" onClick={() => setMode('statement')}>
                {C.pending.editStatementCta}
              </Button>
            )}
          </div>

          {mode === 'statement' ? (
            <div className="space-y-2">
              <Textarea
                value={draftStatement}
                onChange={(e) => setDraftStatement(e.target.value.slice(0, STATEMENT_MAX))}
                maxLength={STATEMENT_MAX}
                rows={4}
                placeholder={C.ceremony.statementPlaceholder}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {STATEMENT_MAX - draftStatement.length} {C.ceremony.charCounterSuffix}
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={resetDrafts} disabled={update.isPending}>
                  {C.pending.cancelCta}
                </Button>
                <Button
                  size="sm"
                  className="bg-dna-copper hover:bg-dna-copper-dark text-white"
                  onClick={saveStatement}
                  disabled={update.isPending}
                >
                  {update.isPending ? C.pending.savingCta : C.pending.saveCta}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {affirmation.statement?.trim() || C.affirmed.noStatement}
            </p>
          )}
        </section>

        {/* Witness */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-dna-forest">{C.pending.witnessLabel}</h2>
            {mode === 'none' && (
              <Button variant="ghost" size="sm" onClick={() => setMode('witness')}>
                {C.pending.changeWitnessCta}
              </Button>
            )}
          </div>

          {mode === 'witness' ? (
            <div className="space-y-3">
              {witnessesLoading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-dna-copper" />
                </div>
              ) : (candidates ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">{C.witness.emptyBody}</p>
              ) : (
                <WitnessList
                  candidates={candidates ?? []}
                  selectedId={draftWitnessId}
                  onSelect={setDraftWitnessId}
                  ariaLabel={C.witness.selectAria}
                  unnamedLabel={C.witness.unnamedMember}
                />
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={resetDrafts} disabled={update.isPending}>
                  {C.pending.cancelCta}
                </Button>
                <Button
                  size="sm"
                  className="bg-dna-copper hover:bg-dna-copper-dark text-white"
                  onClick={saveWitness}
                  disabled={
                    update.isPending ||
                    !draftWitnessId ||
                    draftWitnessId === affirmation.witness_id
                  }
                >
                  {update.isPending ? C.pending.savingCta : C.pending.saveCta}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Avatar className="h-10 w-10 shrink-0">
                {witness?.avatarUrl && <AvatarImage src={witness.avatarUrl} alt={witnessName} />}
                <AvatarFallback>{initials(witnessName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium text-dna-forest truncate">{witnessName}</p>
                {witness?.username && (
                  <p className="text-xs text-muted-foreground truncate">@{witness.username}</p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PendingScreen;
