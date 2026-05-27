import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import {
  CONTINENTS,
  getCountriesForContinent,
  type ContinentCode,
} from '@/lib/dna-place';

interface PlaceDeclarationStepProps {
  continent: ContinentCode | '';
  country: string; // alpha-3
  onContinentChange: (value: ContinentCode | '') => void;
  onCountryChange: (alpha3: string) => void;
  errors?: { continent?: string; country?: string };
}

const selectClass =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const PlaceDeclarationStep: React.FC<PlaceDeclarationStepProps> = ({
  continent,
  country,
  onContinentChange,
  onCountryChange,
  errors = {},
}) => {
  const countryOptions = useMemo(
    () =>
      [...getCountriesForContinent(continent)].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    [continent]
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto px-4">
      <div className="text-center space-y-2 pt-6">
        <h2 className="text-xl sm:text-2xl font-bold text-dna-forest">
          Tell us where you are.
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Continent first. Country next. This helps DNA connect you to the right people and places.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="continent">Continent *</Label>
          <select
            id="continent"
            value={continent}
            onChange={(e) => {
              const next = e.target.value as ContinentCode | '';
              onContinentChange(next);
              onCountryChange('');
            }}
            className={`${selectClass} ${errors.continent ? 'border-destructive' : ''}`}
          >
            <option value="">Select a continent...</option>
            {CONTINENTS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.continent && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.continent}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <select
            id="country"
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
            disabled={!continent}
            className={`${selectClass} ${errors.country ? 'border-destructive' : ''}`}
          >
            <option value="">
              {continent ? 'Select a country...' : 'Choose a continent first'}
            </option>
            {countryOptions.map((c) => (
              <option key={c.alpha3} value={c.alpha3}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.country && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.country}
            </p>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        DNA spans the world. Returnees on every continent, Anchors across Africa, Allies wherever they choose to contribute. Place is how we find each other and how the network reaches you.
      </p>

      <p className="text-xs text-center text-muted-foreground">
        You can update your place anytime.
      </p>
    </div>
  );
};

export default PlaceDeclarationStep;
