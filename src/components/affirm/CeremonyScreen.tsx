/**
 * CeremonyScreen — step b of the Affirmation flow.
 *
 * Full-screen, minimal chrome: the role's declaration (internal voice), an
 * optional personal statement, then the commit action that advances to
 * witness selection. All chrome copy from affirmation-chrome.content.
 */

import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { affirmationChromeContent as C } from '@/content/affirmation-chrome.content';
import type { AffirmRole } from '@/content/affirmation-ceremony.content';
import DeclarationBody from './DeclarationBody';

export const STATEMENT_MAX = 1000;

interface CeremonyScreenProps {
  role: AffirmRole;
  statement: string;
  onStatementChange: (value: string) => void;
  onCommit: () => void;
}

const CeremonyScreen: React.FC<CeremonyScreenProps> = ({
  role,
  statement,
  onStatementChange,
  onCommit,
}) => {
  const remaining = STATEMENT_MAX - statement.length;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-10">
        <header className="space-y-2 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-dna-copper">
            {C.ceremony.eyebrow}
          </p>
          <p className="text-sm text-muted-foreground">{C.ceremony.intro}</p>
        </header>

        <DeclarationBody role={role} />

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="affirm-statement" className="text-sm font-medium text-dna-forest">
              {C.ceremony.statementLabel}
            </Label>
            <span className="text-xs text-muted-foreground">{C.ceremony.statementOptional}</span>
          </div>
          <Textarea
            id="affirm-statement"
            value={statement}
            onChange={(e) => onStatementChange(e.target.value.slice(0, STATEMENT_MAX))}
            maxLength={STATEMENT_MAX}
            rows={4}
            placeholder={C.ceremony.statementPlaceholder}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {remaining} {C.ceremony.charCounterSuffix}
          </p>
        </div>

        <Button
          onClick={onCommit}
          size="lg"
          className="w-full bg-dna-copper hover:bg-dna-copper-dark text-white"
        >
          {C.ceremony.commitCta}
        </Button>
      </div>
    </div>
  );
};

export default CeremonyScreen;
