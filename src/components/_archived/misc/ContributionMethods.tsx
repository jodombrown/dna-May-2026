
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { HandHeart, Users, Target } from 'lucide-react';

const ContributionMethods: React.FC = () => {
  return (
    <Card className="bg-gradient-to-r from-dna-copper/10 to-dna-emerald/10 mb-8">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Your Pathway to Impact Awaits</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-dna-emerald rounded-xl mx-auto mb-4 flex items-center justify-center">
              <HandHeart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h4 className="font-semibold mb-2 text-sm sm:text-base">Multiple Contribution Types</h4>
            <p className="text-xs sm:text-sm text-neutral-600">Financial, expertise, time, networks, advocacy, in-kind support, or feedback</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-dna-copper rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h4 className="font-semibold mb-2 text-sm sm:text-base">Community-Driven Projects</h4>
            <p className="text-xs sm:text-sm text-neutral-600">Join validated initiatives led by diaspora members and local partners</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-dna-forest rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h4 className="font-semibold mb-2 text-sm sm:text-base">Measurable Impact</h4>
            <p className="text-xs sm:text-sm text-neutral-600">Track your contributions and see real-time progress on project outcomes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContributionMethods;
