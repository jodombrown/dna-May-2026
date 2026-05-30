/**
 * DNA | Introduction Insight Chips
 *
 * DIA-powered commonality chips showing shared skills, sectors,
 * events, and heritage between two people.
 * Clicking a chip auto-inserts a relevant sentence into the message.
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Sankofa } from '@/components/icons/adinkra';

interface Insight {
  id: string;
  label: string;
  sentence: string;
}

interface IntroductionInsightChipsProps {
  personAId: string;
  personBId: string;
  personAName: string;
  personBName: string;
  onInsertSentence: (sentence: string) => void;
}

/**
 * Fetches commonalities between two profiles and renders as clickable chips.
 */
export function IntroductionInsightChips({
  personAId,
  personBId,
  personAName,
  personBName,
  onInsertSentence,
}: IntroductionInsightChipsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchCommonalities() {
      try {
        // Fetch both profiles with skills, interests, heritage
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, skills, interests, primary_origin_country, ethnic_heritage')
          .in('id', [personAId, personBId]);

        if (cancelled || !profiles || profiles.length < 2) {
          setLoading(false);
          return;
        }

        const pA = profiles.find(p => p.id === personAId);
        const pB = profiles.find(p => p.id === personBId);
        if (!pA || !pB) { setLoading(false); return; }

        const results: Insight[] = [];

        // Shared skills
        const skillsA = (pA.skills as string[] | null) || [];
        const skillsB = (pB.skills as string[] | null) || [];
        const sharedSkills = skillsA.filter(s => skillsB.includes(s));
        if (sharedSkills.length > 0) {
          const top = sharedSkills.slice(0, 2).join(' & ');
          results.push({
            id: 'skills',
            label: `Shared: ${top}`,
            sentence: `You both have expertise in ${top} — I thought you'd have great things to discuss!`,
          });
        }

        // Shared interests
        const intA = (pA.interests as string[] | null) || [];
        const intB = (pB.interests as string[] | null) || [];
        const sharedInterests = intA.filter(s => intB.includes(s));
        if (sharedInterests.length > 0) {
          const top = sharedInterests.slice(0, 2).join(' & ');
          results.push({
            id: 'sectors',
            label: `Both in ${top}`,
            sentence: `You're both passionate about ${top} — I knew you had to connect!`,
          });
        }

        // Shared heritage
        const heritageA = (pA.ethnic_heritage as string[] | null) || [];
        const heritageB = (pB.ethnic_heritage as string[] | null) || [];
        const sharedHeritage = heritageA.filter(h => heritageB.includes(h));
        if (sharedHeritage.length > 0) {
          results.push({
            id: 'heritage',
            label: `Same roots: ${sharedHeritage[0]}`,
            sentence: `You both share roots in ${sharedHeritage[0]} — what a great foundation for connection!`,
          });
        }

        // Same country of origin
        if (pA.primary_origin_country && pA.primary_origin_country === pB.primary_origin_country) {
          results.push({
            id: 'country',
            label: `Both from ${pA.primary_origin_country}`,
            sentence: `You're both from ${pA.primary_origin_country} — I thought you should know each other!`,
          });
        }

        if (!cancelled) setInsights(results);
      } catch {
        // Non-critical — insights are a bonus
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCommonalities();
    return () => { cancelled = true; };
  }, [personAId, personBId, personAName, personBName]);

  if (loading || insights.length === 0) return null;

  return (
    <div className="mb-3">
      <div className="flex items-center gap-1 mb-1.5 justify-center">
        <Sankofa className="w-3 h-3 text-[hsl(var(--dna-gold))]" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Why connect them
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {insights.map(insight => (
          <button
            key={insight.id}
            type="button"
            onClick={() => onInsertSentence(insight.sentence)}
            className={cn(
              'px-2.5 py-1 rounded-full text-[10px] font-medium',
              'bg-[hsl(var(--dna-gold))]/10 text-[hsl(var(--dna-gold))] border border-[hsl(var(--dna-gold))]/20',
              'hover:bg-[hsl(var(--dna-gold))]/20 transition-colors duration-150',
              'cursor-pointer'
            )}
          >
            {insight.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default IntroductionInsightChips;
