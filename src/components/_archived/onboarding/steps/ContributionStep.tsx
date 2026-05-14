import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface ContributionStepProps {
  data: any;
  updateData: (data: any) => void;
}

const ContributionStep: React.FC<ContributionStepProps> = ({ data, updateData }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-dna-forest mb-2">Community Agreement</h3>
        <p className="text-neutral-600">Welcome to the DNA community</p>
      </div>

      {/* Community Values */}
      <div className="bg-dna-mint/20 p-6 rounded-lg">
        <h4 className="font-semibold text-dna-forest mb-4">DNA Community Values</h4>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-dna-emerald rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <strong>Diaspora-led innovation:</strong> We believe in the power of the African diaspora to drive meaningful change through innovation, entrepreneurship, and strategic collaboration.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-dna-emerald rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <strong>Shared prosperity:</strong> We are committed to creating opportunities that benefit both diaspora communities and the African continent through mutual support and economic empowerment.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-dna-emerald rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <strong>Radical collaboration:</strong> We foster inclusive, cross-border partnerships that transcend traditional boundaries to achieve extraordinary collective impact.
            </div>
          </div>
        </div>
      </div>

      {/* Agreement Checkbox */}
      <div className="flex items-start gap-3 p-4 border rounded-lg">
        <Checkbox
          checked={data.agrees_to_values || false}
          onCheckedChange={(checked) => updateData({ agrees_to_values: checked })}
          className="mt-1"
        />
        <div className="text-sm">
          <p className="font-medium text-dna-forest mb-1">
            I agree to the DNA terms, values, and privacy policy *
          </p>
          <p className="text-neutral-600">
            By checking this box, I commit to upholding the DNA community values and agree to the 
            <span className="text-dna-emerald hover:underline mx-1 cursor-pointer">Terms of Service</span>
            and
            <span className="text-dna-emerald hover:underline mx-1 cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>

      {data.agrees_to_values && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <p className="text-green-800 font-medium">🎉 Welcome to the DNA Community!</p>
          <p className="text-green-700 text-sm mt-1">
            You're about to join thousands of diaspora professionals working together to drive African innovation and prosperity.
          </p>
        </div>
      )}
    </div>
  );
};

export default ContributionStep;