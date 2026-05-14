/**
 * Heritage Onboarding Step — "Your diaspora story"
 *
 * Onboarding step for collecting heritage information:
 * - Heritage countries with searchable selector grouped by African region
 * - Current country
 * - Languages with proficiency level
 * - Diaspora generation selector
 *
 * Per PRD Section 7.1: Heritage step is skippable but highly encouraged.
 * DIA auto-detects heritage region from country selection.
 */

import React, { useState, useMemo } from 'react';
import { Globe, Plus, X, Languages, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
} from '@/types/profileIdentityHub';

interface HeritageOnboardingStepProps {
  heritage: DiasporaHeritage;
  onUpdate: (heritage: DiasporaHeritage) => void;
}

// African countries grouped by region
const AFRICAN_COUNTRIES: { code: string; name: string; region: AfricanRegion }[] = [
  // West Africa
  { code: 'NG', name: 'Nigeria', region: 'west_africa' },
  { code: 'GH', name: 'Ghana', region: 'west_africa' },
  { code: 'SN', name: 'Senegal', region: 'west_africa' },
  { code: 'CI', name: "Côte d'Ivoire", region: 'west_africa' },
  { code: 'ML', name: 'Mali', region: 'west_africa' },
  { code: 'BF', name: 'Burkina Faso', region: 'west_africa' },
  { code: 'NE', name: 'Niger', region: 'west_africa' },
  { code: 'GN', name: 'Guinea', region: 'west_africa' },
  { code: 'BJ', name: 'Benin', region: 'west_africa' },
  { code: 'TG', name: 'Togo', region: 'west_africa' },
  { code: 'SL', name: 'Sierra Leone', region: 'west_africa' },
  { code: 'LR', name: 'Liberia', region: 'west_africa' },
  { code: 'MR', name: 'Mauritania', region: 'west_africa' },
  { code: 'GM', name: 'Gambia', region: 'west_africa' },
  { code: 'GW', name: 'Guinea-Bissau', region: 'west_africa' },
  { code: 'CV', name: 'Cape Verde', region: 'west_africa' },
  // East Africa
  { code: 'ET', name: 'Ethiopia', region: 'east_africa' },
  { code: 'KE', name: 'Kenya', region: 'east_africa' },
  { code: 'TZ', name: 'Tanzania', region: 'east_africa' },
  { code: 'UG', name: 'Uganda', region: 'east_africa' },
  { code: 'RW', name: 'Rwanda', region: 'east_africa' },
  { code: 'BI', name: 'Burundi', region: 'east_africa' },
  { code: 'SO', name: 'Somalia', region: 'east_africa' },
  { code: 'ER', name: 'Eritrea', region: 'east_africa' },
  { code: 'DJ', name: 'Djibouti', region: 'east_africa' },
  { code: 'SS', name: 'South Sudan', region: 'east_africa' },
  { code: 'MG', name: 'Madagascar', region: 'east_africa' },
  { code: 'MU', name: 'Mauritius', region: 'east_africa' },
  { code: 'SC', name: 'Seychelles', region: 'east_africa' },
  { code: 'KM', name: 'Comoros', region: 'east_africa' },
  // Southern Africa
  { code: 'ZA', name: 'South Africa', region: 'southern_africa' },
  { code: 'MZ', name: 'Mozambique', region: 'southern_africa' },
  { code: 'ZW', name: 'Zimbabwe', region: 'southern_africa' },
  { code: 'ZM', name: 'Zambia', region: 'southern_africa' },
  { code: 'MW', name: 'Malawi', region: 'southern_africa' },
  { code: 'NA', name: 'Namibia', region: 'southern_africa' },
  { code: 'BW', name: 'Botswana', region: 'southern_africa' },
  { code: 'LS', name: 'Lesotho', region: 'southern_africa' },
  { code: 'SZ', name: 'Eswatini', region: 'southern_africa' },
  { code: 'AO', name: 'Angola', region: 'southern_africa' },
  // North Africa
  { code: 'EG', name: 'Egypt', region: 'north_africa' },
  { code: 'MA', name: 'Morocco', region: 'north_africa' },
  { code: 'DZ', name: 'Algeria', region: 'north_africa' },
  { code: 'TN', name: 'Tunisia', region: 'north_africa' },
  { code: 'LY', name: 'Libya', region: 'north_africa' },
  { code: 'SD', name: 'Sudan', region: 'north_africa' },
  // Central Africa
  { code: 'CD', name: 'DR Congo', region: 'central_africa' },
  { code: 'CM', name: 'Cameroon', region: 'central_africa' },
  { code: 'CG', name: 'Republic of Congo', region: 'central_africa' },
  { code: 'GA', name: 'Gabon', region: 'central_africa' },
  { code: 'GQ', name: 'Equatorial Guinea', region: 'central_africa' },
  { code: 'CF', name: 'Central African Republic', region: 'central_africa' },
  { code: 'TD', name: 'Chad', region: 'central_africa' },
  { code: 'ST', name: 'São Tomé and Príncipe', region: 'central_africa' },
];

const COMMON_LANGUAGES = [
  'English', 'French', 'Arabic', 'Swahili', 'Hausa', 'Yoruba', 'Igbo',
  'Amharic', 'Zulu', 'Shona', 'Portuguese', 'Wolof', 'Twi', 'Lingala',
  'Somali', 'Afrikaans', 'Pidgin', 'Kinyarwanda', 'Tigrinya', 'Oromo',
  'Bambara', 'Fulfulde', 'Spanish', 'Creole',
];

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 0x1f1e6 + char.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

export const HeritageOnboardingStep: React.FC<HeritageOnboardingStepProps> = ({
  heritage,
  onUpdate,
}) => {
  const [countrySearch, setCountrySearch] = useState('');
  const [languageSearch, setLanguageSearch] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  // Group countries by region and filter by search
  const filteredCountries = useMemo(() => {
    const query = countrySearch.toLowerCase();
    const filtered = query
      ? AFRICAN_COUNTRIES.filter((c) =>
          c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query)
        )
      : AFRICAN_COUNTRIES;

    const grouped: Record<AfricanRegion, typeof filtered> = {
      west_africa: [],
      east_africa: [],
      southern_africa: [],
      north_africa: [],
      central_africa: [],
    };
    filtered.forEach((c) => grouped[c.region].push(c));
    return grouped;
  }, [countrySearch]);

  const filteredLanguages = useMemo(() => {
    const query = languageSearch.toLowerCase();
    const selected = new Set(heritage.languages?.map((l) => l.language) ?? []);
    return (query
      ? COMMON_LANGUAGES.filter((l) => l.toLowerCase().includes(query))
      : COMMON_LANGUAGES
    ).filter((l) => !selected.has(l));
  }, [languageSearch, heritage.languages]);

  const addHeritageCountry = (country: typeof AFRICAN_COUNTRIES[0], relationship: HeritageCountry['relationship']) => {
    const existing = heritage.heritageCountries || [];
    if (existing.find((c) => c.countryCode === country.code)) return;
    if (existing.length >= 5) return;

    const newCountry: HeritageCountry = {
      countryCode: country.code,
      countryName: country.name,
      relationship,
      region: country.region,
      isPrimary: existing.length === 0,
    };

    onUpdate({
      ...heritage,
      heritageCountries: [...existing, newCountry],
    });
    setCountrySearch('');
    setShowCountryPicker(false);
  };

  const removeHeritageCountry = (code: string) => {
    const updated = (heritage.heritageCountries || []).filter((c) => c.countryCode !== code);
    if (updated.length > 0 && !updated.some((c) => c.isPrimary)) {
      updated[0].isPrimary = true;
    }
    onUpdate({ ...heritage, heritageCountries: updated });
  };

  const addLanguage = (language: string, proficiency: HeritageLanguage['proficiency'] = 'conversational') => {
    const existing = heritage.languages || [];
    if (existing.find((l) => l.language === language)) return;

    const newLang: HeritageLanguage = {
      language,
      proficiency,
      isHeritage: true,
    };
    onUpdate({ ...heritage, languages: [...existing, newLang] });
    setLanguageSearch('');
    setShowLanguagePicker(false);
  };

  const removeLanguage = (language: string) => {
    onUpdate({
      ...heritage,
      languages: (heritage.languages || []).filter((l) => l.language !== language),
    });
  };

  const updateLanguageProficiency = (language: string, proficiency: HeritageLanguage['proficiency']) => {
    onUpdate({
      ...heritage,
      languages: (heritage.languages || []).map((l) =>
        l.language === language ? { ...l, proficiency } : l
      ),
    });
  };

  return (
    <div className="space-y-6">
      {/* Heritage Countries */}
      <div>
        <label className="text-sm font-medium text-neutral-700 mb-2 flex items-center gap-1.5">
          <Globe className="w-4 h-4" />
          Heritage Countries
          <span className="text-xs text-neutral-400 font-normal">(up to 5)</span>
        </label>

        {/* Selected countries */}
        {heritage.heritageCountries && heritage.heritageCountries.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {heritage.heritageCountries.map((country) => (
              <Badge
                key={country.countryCode}
                variant="secondary"
                className="flex items-center gap-1.5 py-1 px-2"
              >
                <span>{getFlagEmoji(country.countryCode)}</span>
                <span className="text-xs">{country.countryName}</span>
                <span className="text-[10px] text-neutral-400">({country.relationship})</span>
                {country.isPrimary && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
                <button
                  className="ml-0.5 hover:text-red-500 transition-colors"
                  onClick={() => removeHeritageCountry(country.countryCode)}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Country search */}
        {(!heritage.heritageCountries || heritage.heritageCountries.length < 5) && (
          <div className="relative">
            <Input
              placeholder="Search African countries..."
              value={countrySearch}
              onChange={(e) => {
                setCountrySearch(e.target.value);
                setShowCountryPicker(true);
              }}
              onFocus={() => setShowCountryPicker(true)}
              className="text-sm"
            />

            {/* Dropdown */}
            {showCountryPicker && (
              <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border max-h-64 overflow-y-auto">
                {Object.entries(filteredCountries).map(([region, countries]) => {
                  if (countries.length === 0) return null;
                  return (
                    <div key={region}>
                      <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium px-3 py-1.5 bg-neutral-50 sticky top-0">
                        {AFRICAN_REGION_LABELS[region as AfricanRegion]}
                      </p>
                      {countries.map((country) => {
                        const alreadySelected = heritage.heritageCountries?.some(
                          (c) => c.countryCode === country.code
                        );
                        return (
                          <div key={country.code} className="relative group">
                            <button
                              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                                alreadySelected
                                  ? 'opacity-40 cursor-not-allowed'
                                  : 'hover:bg-emerald-50 cursor-pointer'
                              }`}
                              disabled={alreadySelected}
                              onClick={() => addHeritageCountry(country, 'ancestry')}
                            >
                              <span>{getFlagEmoji(country.code)}</span>
                              <span>{country.name}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                <button
                  className="w-full text-xs text-neutral-400 py-2 hover:bg-neutral-50"
                  onClick={() => setShowCountryPicker(false)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Diaspora Generation */}
      <div>
        <label className="text-sm font-medium text-neutral-700 mb-2 block">
          Diaspora Generation
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(DIASPORA_GENERATION_LABELS) as [DiasporaGeneration, string][]).map(
            ([gen, label]) => {
              const [shortLabel, description] = label.split('—').map((s) => s.trim());
              const isSelected = heritage.diasporaGeneration === gen;
              return (
                <button
                  key={gen}
                  className={`text-left p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-neutral-100 hover:border-neutral-200 bg-white'
                  }`}
                  onClick={() =>
                    onUpdate({
                      ...heritage,
                      diasporaGeneration: isSelected ? null : gen,
                    })
                  }
                >
                  <p className={`text-xs font-medium ${isSelected ? 'text-emerald-800' : 'text-neutral-700'}`}>
                    {shortLabel}
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">{description}</p>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Languages */}
      <div>
        <label className="text-sm font-medium text-neutral-700 mb-2 flex items-center gap-1.5">
          <Languages className="w-4 h-4" />
          Languages
        </label>

        {/* Selected languages */}
        {heritage.languages && heritage.languages.length > 0 && (
          <div className="space-y-2 mb-2">
            {heritage.languages.map((lang) => (
              <div
                key={lang.language}
                className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg"
              >
                <span className="text-sm font-medium flex-1">{lang.language}</span>
                <select
                  className="text-xs bg-white border rounded px-2 py-1"
                  value={lang.proficiency}
                  onChange={(e) =>
                    updateLanguageProficiency(
                      lang.language,
                      e.target.value as HeritageLanguage['proficiency']
                    )
                  }
                >
                  <option value="native">Native</option>
                  <option value="fluent">Fluent</option>
                  <option value="conversational">Conversational</option>
                  <option value="learning">Learning</option>
                </select>
                <button
                  className="text-neutral-400 hover:text-red-500 transition-colors"
                  onClick={() => removeLanguage(lang.language)}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Language search */}
        <div className="relative">
          <Input
            placeholder="Search languages..."
            value={languageSearch}
            onChange={(e) => {
              setLanguageSearch(e.target.value);
              setShowLanguagePicker(true);
            }}
            onFocus={() => setShowLanguagePicker(true)}
            className="text-sm"
          />

          {showLanguagePicker && filteredLanguages.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border max-h-48 overflow-y-auto">
              {filteredLanguages.map((lang) => (
                <button
                  key={lang}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 transition-colors"
                  onClick={() => addLanguage(lang)}
                >
                  {lang}
                </button>
              ))}
              <button
                className="w-full text-xs text-neutral-400 py-2 hover:bg-neutral-50"
                onClick={() => setShowLanguagePicker(false)}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeritageOnboardingStep;
