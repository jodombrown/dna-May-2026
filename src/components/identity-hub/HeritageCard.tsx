/**
 * Heritage Card — Displays a user's diaspora heritage on their profile.
 *
 * Shows heritage countries with flags, languages with proficiency,
 * diaspora generation badge, and regional connections.
 * Styled with copper accent border and warm background per PRD Section 6.1.
 */

import React from 'react';
import { Globe, Languages, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type {
  DiasporaHeritage,
  HeritageCountry,
  HeritageLanguage,
  DiasporaGeneration,
  AfricanRegion,
} from '@/types/profileIdentityHub';
import {
  DIASPORA_GENERATION_LABELS,
  AFRICAN_REGION_LABELS,
  PROFILE_LAYOUT,
} from '@/types/profileIdentityHub';

interface HeritageCardProps {
  heritage: DiasporaHeritage;
  isCompact?: boolean;
}

const RELATIONSHIP_LABELS: Record<HeritageCountry['relationship'], string> = {
  born: 'Born',
  ancestry: 'Ancestry',
  lived: 'Lived',
  connected: 'Connected',
};

const PROFICIENCY_LABELS: Record<HeritageLanguage['proficiency'], string> = {
  native: 'Native',
  fluent: 'Fluent',
  conversational: 'Conversational',
  learning: 'Learning',
};

export const HeritageCard: React.FC<HeritageCardProps> = ({ heritage, isCompact = false }) => {
  const { heritageCard } = PROFILE_LAYOUT;

  if (!heritage.heritageCountries?.length && !heritage.languages?.length && !heritage.diasporaGeneration) {
    return null;
  }

  const generationShort = heritage.diasporaGeneration
    ? DIASPORA_GENERATION_LABELS[heritage.diasporaGeneration]?.split(' - ')[0]?.trim()
    : null;

  return (
    <div
      className="rounded-lg p-4"
      style={{
        backgroundColor: heritageCard.backgroundColor,
        borderLeft: heritageCard.borderLeft,
      }}
    >
      {/* Generation badge */}
      {heritage.diasporaGeneration && (
        <div className="mb-3">
          <span
            className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full"
            style={{
              backgroundColor: heritageCard.generationBadge.backgroundColor,
              color: heritageCard.generationBadge.textColor,
              fontSize: heritageCard.generationBadge.fontSize,
              borderRadius: heritageCard.generationBadge.borderRadius,
            }}
          >
            {generationShort}
          </span>
        </div>
      )}

      {/* Heritage countries */}
      {heritage.heritageCountries?.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 mb-2">
            <Globe className="w-4 h-4" />
            <span>Heritage</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {heritage.heritageCountries.map((country) => (
              <div
                key={country.countryCode}
                className="flex items-center gap-1.5 text-sm"
              >
                <span className="text-base" role="img" aria-label={country.countryName}>
                  {getFlagEmoji(country.countryCode)}
                </span>
                <span className="font-medium">{country.countryName}</span>
                {!isCompact && (
                  <span className="text-xs text-neutral-500">
                    ({RELATIONSHIP_LABELS[country.relationship]})
                  </span>
                )}
                {country.isPrimary && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                    Primary
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current country */}
      {heritage.currentCountry && !isCompact && (
        <div className="mb-3 flex items-center gap-1.5 text-sm text-neutral-600">
          <MapPin className="w-3.5 h-3.5" />
          <span>Currently in {heritage.currentCountry}</span>
        </div>
      )}

      {/* Languages */}
      {heritage.languages?.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 mb-2">
            <Languages className="w-4 h-4" />
            <span>Languages</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {heritage.languages.map((lang) => (
              <Badge
                key={lang.language}
                variant={lang.isHeritage ? 'default' : 'secondary'}
                className="text-xs"
              >
                {lang.language}
                {!isCompact && (
                  <span className="ml-1 opacity-75">
                    · {PROFICIENCY_LABELS[lang.proficiency]}
                  </span>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Regional connections */}
      {heritage.regionalConnections?.length > 0 && !isCompact && (
        <div>
          <div className="text-sm font-medium text-neutral-700 mb-2">
            Regional Connections
          </div>
          <div className="flex flex-wrap gap-2">
            {heritage.regionalConnections.map((rc) => (
              <div
                key={rc.region}
                className="flex items-center gap-1 text-xs text-neutral-600 bg-white/60 rounded-full px-2.5 py-1"
              >
                <span className="font-medium">{AFRICAN_REGION_LABELS[rc.region]}</span>
                <span className="text-neutral-400">·</span>
                <span>{rc.connectionCount} connections</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ml-1 ${
                    rc.strength === 'strong'
                      ? 'bg-emerald-500'
                      : rc.strength === 'moderate'
                        ? 'bg-amber-500'
                        : 'bg-neutral-400'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cultural interests */}
      {heritage.culturalInterests?.length > 0 && !isCompact && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-1.5">
            {heritage.culturalInterests.map((interest) => (
              <Badge key={interest} variant="outline" className="text-xs bg-white/50">
                {interest}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Convert ISO 3166-1 alpha-2 country code to flag emoji.
 * Each letter is offset to its regional indicator symbol.
 */
function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 0x1f1e6 + char.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

export default HeritageCard;
