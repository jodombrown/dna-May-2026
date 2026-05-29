import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import CountryCombobox from '@/components/ui/CountryCombobox';
import { AlertCircle, Heart } from 'lucide-react';

interface DiasporaImpactStepProps {
  data: {
    country_of_origin: string;
  };
  onUpdate: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

const DiasporaImpactStep: React.FC<DiasporaImpactStepProps> = ({ data, onUpdate, errors = {} }) => {
  return (
    <div className="space-y-6 max-w-2xl mx-auto px-4">
      <div className="text-center space-y-2 pt-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart className="h-6 w-6 text-dna-copper fill-dna-copper/20" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-dna-forest">Your African Connection</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          This is the heart of DNA - connecting you to your African roots and the global diaspora.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Country of Origin */}
          <div className="space-y-2">
            <Label htmlFor="country_of_origin" className="text-base">Country of Origin *</Label>
            <CountryCombobox
              value={data.country_of_origin}
              onChange={(code, _name) => onUpdate('country_of_origin', code)}
              africanOnly={true}
              placeholder="Select your country of origin"
              error={!!errors.country_of_origin}
            />
            <p className="text-xs text-muted-foreground">
              The African country you identify with or have roots in. This helps us connect you with others from your diaspora community.
            </p>
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

export default DiasporaImpactStep;
