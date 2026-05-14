
import React from 'react';
import { Users, Globe, Lightbulb } from 'lucide-react';

const NotificationBenefits: React.FC = () => {
  return (
    <div className="bg-dna-sage/10 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-dna-forest mb-4">What to Expect When You Join</h3>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 text-dna-emerald mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-dna-forest">Early Access</h4>
            <p className="text-sm text-neutral-600">Be among the first to access our platform when we launch and connect with diaspora professionals worldwide.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Globe className="h-5 w-5 text-dna-emerald mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-dna-forest">Development Updates</h4>
            <p className="text-sm text-neutral-600">Regular updates on our platform development progress and upcoming features.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-dna-emerald mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-dna-forest">Exclusive Opportunities</h4>
            <p className="text-sm text-neutral-600">Access to exclusive events, collaboration opportunities, and networking sessions.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationBenefits;
