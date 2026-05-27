import React from 'react';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

export type DnaIdentityRole = 'returnee' | 'anchor' | 'ally' | 'exploring';

interface RoleOption {
  value: DnaIdentityRole;
  heading: string;
  body: string;
  buttonLabel: string;
}

const ROLES: RoleOption[] = [
  {
    value: 'returnee',
    heading: 'Returnee',
    body: "You're of the African Diaspora, and you're choosing return — however that looks for you. Visits, investments, networks, relocation, advocacy, building. Many paths. One direction.",
    buttonLabel: 'I am a Returnee',
  },
  {
    value: 'anchor',
    heading: 'Anchor',
    body: "You're on the continent, building from where you stand. The Diaspora is returning to the work — and you're the partner they build with.",
    buttonLabel: 'I am an Anchor',
  },
  {
    value: 'ally',
    heading: 'Ally',
    body: "You're not of the Diaspora, and you're choosing to contribute. Capital, expertise, networks, time, advocacy — what you bring strengthens The Return. You walk alongside. You support and partner. You don't represent.",
    buttonLabel: 'I am an Ally',
  },
  {
    value: 'exploring',
    heading: 'Still exploring',
    body: "You're here, and you're not ready to name where you fit yet. That's how it should be at the start. Stay as long as you need. Choose when you're ready.",
    buttonLabel: "I'm still exploring",
  },
];

interface RoleDeclarationStepProps {
  value: DnaIdentityRole | '';
  onChange: (value: DnaIdentityRole) => void;
  error?: string;
}

const RoleDeclarationStep: React.FC<RoleDeclarationStepProps> = ({ value, onChange, error }) => {
  return (
    <div className="space-y-6 max-w-2xl mx-auto px-4">
      <div className="text-center space-y-2 pt-6">
        <h2 className="text-xl sm:text-2xl font-bold text-dna-forest">
          Who are you in The Return?
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Choose the role that fits where you are right now. You can change it later.
        </p>
      </div>

      <div role="radiogroup" aria-label="Select your role" className="grid grid-cols-1 gap-3">
        {ROLES.map((role) => {
          const selected = value === role.value;
          return (
            <button
              key={role.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(role.value)}
              className={`text-left p-4 sm:p-5 border-2 rounded-lg transition-all min-h-[44px] ${
                selected
                  ? 'border-dna-copper bg-dna-copper/5'
                  : 'border-border hover:border-dna-copper/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="font-semibold text-base text-dna-forest">{role.heading}</span>
                <span
                  className={`shrink-0 mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    selected ? 'border-dna-copper' : 'border-border'
                  }`}
                >
                  {selected && <span className="h-2 w-2 rounded-full bg-dna-copper" />}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{role.body}</p>
              <span
                className={`inline-block text-xs font-medium ${
                  selected ? 'text-dna-copper' : 'text-muted-foreground'
                }`}
              >
                {role.buttonLabel}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}

      <p className="text-xs text-center text-muted-foreground">
        You can change this anytime. Your role can evolve as your path does.
      </p>
    </div>
  );
};

export default RoleDeclarationStep;
