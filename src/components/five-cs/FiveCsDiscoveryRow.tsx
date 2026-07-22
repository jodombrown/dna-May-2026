import React from 'react';

import { ChevronDown } from 'lucide-react';
import { Sankofa, Nkonsonkonson, FuntunfunefuDenkyemfunefu, Adinkrahene, Mpatapo } from '@/components/icons/adinkra';
import { FIVE_CS, type FiveCId, type FiveCAdinkraKey } from '@/content/fiveCs.content';

const ICONS: Record<FiveCAdinkraKey, React.FC<{ className?: string }>> = {
  sankofa: Sankofa,
  nkonsonkonson: Nkonsonkonson,
  funtunfunefu: FuntunfunefuDenkyemfunefu,
  adinkrahene: Adinkrahene,
  mpatapo: Mpatapo,
};

interface FiveCsDiscoveryRowProps {
  onOpen: (id: FiveCId) => void;
}

/**
 * Card row rendered at the bottom of every signed-out profile.
 * Each card is a real button; clicking opens the right-sheet detail view.
 */
export const FiveCsDiscoveryRow: React.FC<FiveCsDiscoveryRowProps> = ({ onOpen }) => {
  return (
    <section
      aria-label="Explore the Five C's of DNA"
      className="max-w-6xl mx-auto mb-12"
    >
      <div className="text-center mb-6">
        <h2 className="text-h3 sm:text-h2 font-display text-foreground mb-1">
          {"\n"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {"\n"}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {FIVE_CS.map((c) => {
          const Icon = ICONS[c.adinkra];
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onOpen(c.id)}
              aria-label={`Learn more about ${c.name}`}
              className="group w-full min-h-touch p-4 sm:p-5 flex flex-col items-center text-center gap-2 rounded-xl border border-border bg-card transition-colors hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              data-analytics-event="five_cs_card_open"
              data-analytics-c-id={c.id}
            >
              <div
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-md flex items-center justify-center"
                style={{ backgroundColor: c.colorToken }}
              >
                <Icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div
                className="font-display font-semibold text-base"
                style={{ color: c.colorToken }}
              >
                {c.name}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {c.cardTagline}
              </p>
              <span
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium transition-transform group-hover:translate-y-0.5"
                style={{ color: c.colorToken }}
              >
                Click to Learn More
                <ChevronDown className="w-3.5 h-3.5" />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default FiveCsDiscoveryRow;
