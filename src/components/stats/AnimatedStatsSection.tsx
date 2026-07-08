import React, { useState } from 'react';
import { Info, ExternalLink } from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { useStatCitations, type StatCitation, FALLBACK_STAT_CITATIONS } from '@/hooks/useStatCitations';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from '@/components/ui/responsive-modal';

// Card background rotation — keeps the palette varied even if admins add
// or remove citations later. Applied by index, not by key.
const CARD_GRADIENTS = [
  'bg-gradient-to-br from-dna-emerald/80 to-dna-forest/80',
  'bg-gradient-to-br from-dna-copper/80 to-dna-gold/80',
  'bg-gradient-to-br from-dna-mint/80 to-dna-emerald/80',
];

// Parse "200M+" / "43%" / "100B+" into a number and suffix so the counter
// can animate the numeric part while the suffix stays static.
function splitDisplayValue(raw: string): { value: number; suffix: string } {
  const match = raw.match(/^(-?\d+(?:\.\d+)?)(.*)$/);
  if (!match) return { value: 0, suffix: raw };
  const value = parseFloat(match[1]);
  const suffix = match[2] ?? '';
  return { value: Number.isFinite(value) ? value : 0, suffix };
}

interface AnimatedStatProps {
  citation: StatCitation;
  bgGradient: string;
  onOpenDetails: (c: StatCitation) => void;
}

const AnimatedStat: React.FC<AnimatedStatProps> = ({ citation, bgGradient, onOpenDetails }) => {
  const { value, suffix } = splitDisplayValue(citation.display_value);
  const { count, countRef } = useAnimatedCounter({ end: value, duration: 2500 });

  const yearLabel = citation.year ? `${citation.source_name}, ${citation.year}` : citation.source_name;
  const hasDetail = Boolean(citation.methodology || citation.definition);

  return (
    <div className={`${bgGradient} rounded-xl p-6 text-center shadow-lg min-h-[140px] flex flex-col`}>
      <div
        ref={countRef}
        className="text-4xl font-bold text-white mb-2 tabular-nums min-w-[120px] inline-block h-[44px]"
      >
        {count}
        {suffix}
      </div>
      <div className="text-lg font-medium text-white/90 mb-1 h-[28px]">{citation.label}</div>
      <div className="text-sm text-white/80 min-h-[40px]">{citation.description}</div>

      <div className="mt-3 pt-2 border-t border-white/20 flex items-center justify-center gap-2 flex-wrap">
        {citation.source_url ? (
          <a
            href={citation.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/70 hover:text-white underline underline-offset-2 transition-colors inline-flex items-center gap-1"
          >
            Source: {yearLabel}
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        ) : (
          <span className="text-xs text-white/70">Source: {yearLabel}</span>
        )}

        {hasDetail && (
          <button
            type="button"
            onClick={() => onOpenDetails(citation)}
            className="text-xs text-white/70 hover:text-white inline-flex items-center gap-1 underline underline-offset-2 min-h-[24px] px-1"
            aria-label={`Show source details for ${citation.label}`}
          >
            <Info className="h-3 w-3" aria-hidden />
            details
          </button>
        )}
      </div>
    </div>
  );
};

const AnimatedStatsSection: React.FC = () => {
  const { data } = useStatCitations();
  const citations = data && data.length > 0 ? data : FALLBACK_STAT_CITATIONS;

  const [activeCitation, setActiveCitation] = useState<StatCitation | null>(null);
  const isOpen = activeCitation !== null;

  return (
    <section className="relative bg-gradient-to-br from-dna-forest via-dna-emerald to-dna-copper rounded-xl overflow-hidden mb-16">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 px-8 py-16 text-center text-white">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-serif mb-12 leading-tight">
          The African Diaspora: A $100 B+ Engine for Change
        </h2>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {citations.map((c, i) => (
            <AnimatedStat
              key={c.id}
              citation={c}
              bgGradient={CARD_GRADIENTS[i % CARD_GRADIENTS.length]}
              onOpenDetails={setActiveCitation}
            />
          ))}
        </div>
      </div>

      <ResponsiveModal open={isOpen} onOpenChange={(o) => !o && setActiveCitation(null)}>
        {activeCitation && (
          <>
            <ResponsiveModalHeader>
              <ResponsiveModalTitle className="font-serif text-2xl">
                {activeCitation.display_value} · {activeCitation.label}
              </ResponsiveModalTitle>
              <ResponsiveModalDescription>
                {activeCitation.description}
              </ResponsiveModalDescription>
            </ResponsiveModalHeader>

            <div className="px-6 pb-6 space-y-5 text-sm text-foreground">
              {activeCitation.definition && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Definition
                  </p>
                  <p className="leading-relaxed">{activeCitation.definition}</p>
                </div>
              )}

              {activeCitation.methodology && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Methodology
                  </p>
                  <p className="leading-relaxed">{activeCitation.methodology}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Source
                </p>
                {activeCitation.source_url ? (
                  <a
                    href={activeCitation.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-dna-emerald hover:underline break-all"
                  >
                    {activeCitation.source_name}
                    {activeCitation.year ? `, ${activeCitation.year}` : ''}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                ) : (
                  <p>
                    {activeCitation.source_name}
                    {activeCitation.year ? `, ${activeCitation.year}` : ''}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </ResponsiveModal>
    </section>
  );
};

export default AnimatedStatsSection;
