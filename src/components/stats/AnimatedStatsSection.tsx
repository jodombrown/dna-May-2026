
import React from 'react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

const AnimatedStat = ({ value, suffix, label, description, bgGradient, source, sourceUrl }: {
  value: number;
  suffix: string;
  label: string;
  description: string;
  bgGradient: string;
  source?: string;
  sourceUrl?: string;
}) => {
  const { count, countRef } = useAnimatedCounter({ end: value, duration: 2500 });

  return (
    <div className={`${bgGradient} rounded-xl p-6 text-center shadow-lg min-h-[140px]`}>
      <div ref={countRef} className="text-4xl font-bold text-white mb-2 tabular-nums min-w-[120px] inline-block h-[44px]">
        {count}{suffix}
      </div>
      <div className="text-lg font-medium text-white/90 mb-1 h-[28px]">{label}</div>
      <div className="text-sm text-white/80 min-h-[40px]">{description}</div>
      {source && (
        <div className="mt-3 pt-2 border-t border-white/20">
          {sourceUrl ? (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-white/60 hover:text-white/90 underline underline-offset-2 transition-colors">
              Source: {source}
            </a>
          ) : (
            <span className="text-xs text-white/60">Source: {source}</span>
          )}
        </div>
      )}
    </div>
  );
};

const AnimatedStatsSection = () => {
  return (
    <section className="relative bg-gradient-to-br from-dna-forest via-dna-emerald to-dna-copper rounded-xl overflow-hidden mb-16">
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative z-10 px-8 py-16 text-center text-white">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-serif mb-12 leading-tight">
          The African Diaspora: A $100 B+ Engine for Change
        </h2>
        
        {/* Three Statistics Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <AnimatedStat
            value={200}
            suffix="M+"
            label="People of African Descent"
            description="Living outside Africa, projected to comprise 25% of global population"
            bgGradient="bg-gradient-to-br from-dna-emerald/80 to-dna-forest/80"
            source="African Union, 2024"
            sourceUrl="https://au.int/en/diaspora"
          />
          
          <AnimatedStat
            value={100}
            suffix="B+"
            label="Annual Remittances (2024)"
            description="Fueling economic growth across African nations"
            bgGradient="bg-gradient-to-br from-dna-copper/80 to-dna-gold/80"
            source="World Bank / KNOMAD, 2024"
            sourceUrl="https://www.knomad.org/publication/migration-and-development-brief-41"
          />
          
          <AnimatedStat
            value={43}
            suffix="%"
            label="Highly Educated"
            description="Hold bachelor's degree or higher, 2x the U.S. national average"
            bgGradient="bg-gradient-to-br from-dna-mint/80 to-dna-emerald/80"
            source="Pew Research Center, 2022"
            sourceUrl="https://www.pewresearch.org/global/fact-sheet/sub-saharan-african-immigrants-in-the-u-s/"
          />
        </div>
      </div>
    </section>
  );
};

export default AnimatedStatsSection;
