import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle, Globe, Info } from 'lucide-react';
import SearchableCountrySelect from '@/components/ui/SearchableCountrySelect';

interface DiasporaOriginStepProps {
  data: {
    country_of_origin: string;
    diaspora_status?: string;
  };
  onUpdate: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

const PREFER_NOT = 'Prefer not to say';

const DiasporaOriginStep: React.FC<DiasporaOriginStepProps> = ({ data, onUpdate, errors = {} }) => {
  const isPreferNot = data.country_of_origin === PREFER_NOT;

  return (
    <div className="space-y-6 max-w-2xl mx-auto px-4">
      <div className="text-center space-y-2 pt-6">
        <h2 className="text-xl sm:text-2xl font-bold text-dna-forest">Your Heritage</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Where are you from? This helps DNA understand the body's reach.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="flex items-start gap-3 p-3 bg-dna-mint/10 rounded-lg border border-dna-mint/20">
            <Info className="h-5 w-5 text-dna-emerald flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              DNA welcomes diaspora members, continental Africans, and allies. Your heritage helps us reflect the breadth of the body.
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country_of_origin" className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-dna-copper" />
              Country of Heritage *
            </Label>
            {isPreferNot ? (
              <div className="flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 min-h-[44px]">
                <span className="text-sm">{PREFER_NOT}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdate('country_of_origin', '')}
                >
                  Change
                </Button>
              </div>
            ) : (
              <SearchableCountrySelect
                value={data.country_of_origin}
                onChange={(_code, name) => onUpdate('country_of_origin', name)}
              />
            )}
            <p className="text-xs text-muted-foreground">
              This is where you trace your roots to - separate from where you live now (which we'll ask about in a later step).
            </p>
            {!isPreferNot && (
              <button
                type="button"
                onClick={() => onUpdate('country_of_origin', PREFER_NOT)}
                className="text-xs text-dna-copper hover:underline mt-1"
              >
                I'd prefer not to say
              </button>
            )}
            {errors.country_of_origin && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.country_of_origin}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiasporaOriginStep;
