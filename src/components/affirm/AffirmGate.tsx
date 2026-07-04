/**
 * AffirmGate — step a of the Affirmation flow. Shown when the user's role is
 * 'exploring' or unset. A short explainer, then the existing role declaration
 * step. 'exploring' cannot affirm (DB CHECK), so continuing requires an
 * affirming role; the write mirrors onboarding (role + role_declared_at).
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import RoleDeclarationStep, {
  type DnaIdentityRole,
} from '@/components/onboarding/RoleDeclarationStep';
import { useDeclareRole } from '@/hooks/useAffirmation';
import { affirmationChromeContent as C } from '@/content/affirmation-chrome.content';
import type { AffirmRole } from '@/content/affirmation-ceremony.content';

const isAffirmable = (r: DnaIdentityRole | ''): r is AffirmRole =>
  r === 'returnee' || r === 'anchor' || r === 'ally';

interface AffirmGateProps {
  currentRole: DnaIdentityRole | null;
  /** True when role_declared_at is not yet set, so we stamp it on save. */
  needsDeclaredAt: boolean;
  onDeclared: () => void;
}

const AffirmGate: React.FC<AffirmGateProps> = ({ currentRole, needsDeclaredAt, onDeclared }) => {
  const { toast } = useToast();
  const declareRole = useDeclareRole();
  const [selected, setSelected] = useState<DnaIdentityRole | ''>(
    currentRole && currentRole !== 'exploring' ? currentRole : '',
  );

  const handleContinue = async () => {
    if (!isAffirmable(selected)) return;
    try {
      await declareRole.mutateAsync({ role: selected, setDeclaredAt: needsDeclaredAt });
      onDeclared();
    } catch {
      toast({ title: C.gate.saveError, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-dna-forest">{C.gate.title}</h1>
          <p className="text-sm text-muted-foreground">{C.gate.body}</p>
        </header>

        <RoleDeclarationStep value={selected} onChange={setSelected} />

        {selected === 'exploring' && (
          <p className="text-sm text-center text-muted-foreground">{C.gate.exploringNote}</p>
        )}

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!isAffirmable(selected) || declareRole.isPending}
            className="bg-dna-copper hover:bg-dna-copper-dark text-white"
          >
            {declareRole.isPending ? C.gate.savingCta : C.gate.continueCta}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AffirmGate;
