
import React from 'react';
import { Info } from 'lucide-react';

const PrototypeNotice: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-dna-emerald/10 to-dna-copper/10 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-dna-emerald mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-neutral-900 mb-1">Platform Preview - Prototype Stage</h3>
            <p className="text-sm text-neutral-700">
              Welcome to a preview of our Connect experience! What you see below represents our vision for how diaspora professionals will discover and network with each other once the DNA platform is fully built. This prototype demonstrates the seamless connection capabilities we're developing to unite the African diaspora globally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrototypeNotice;
