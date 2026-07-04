/**
 * WitnessList — presentational radio list of candidate witnesses.
 * Shared by the witness-selection step and the pending re-pick surface.
 */

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { ResolvedMember } from '@/services/affirmationsService';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

interface WitnessListProps {
  candidates: ResolvedMember[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  ariaLabel: string;
  unnamedLabel: string;
}

const WitnessList: React.FC<WitnessListProps> = ({
  candidates,
  selectedId,
  onSelect,
  ariaLabel,
  unnamedLabel,
}) => (
  <div role="radiogroup" aria-label={ariaLabel} className="space-y-3">
    {candidates.map((m) => {
      const selected = selectedId === m.id;
      const name = m.name ?? unnamedLabel;
      return (
        <button
          key={m.id}
          type="button"
          role="radio"
          aria-checked={selected}
          onClick={() => onSelect(m.id)}
          className={`w-full flex items-center gap-3 text-left p-4 border-2 rounded-lg transition-all min-h-[44px] ${
            selected ? 'border-dna-copper bg-dna-copper/5' : 'border-border hover:border-dna-copper/50'
          }`}
        >
          <Avatar className="h-10 w-10 shrink-0">
            {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt={name} />}
            <AvatarFallback>{initials(name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-dna-forest truncate">{name}</p>
            {m.username && <p className="text-xs text-muted-foreground truncate">@{m.username}</p>}
          </div>
          <span
            className={`shrink-0 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
              selected ? 'border-dna-copper' : 'border-border'
            }`}
          >
            {selected && <span className="h-2 w-2 rounded-full bg-dna-copper" />}
          </span>
        </button>
      );
    })}
  </div>
);

export default WitnessList;
