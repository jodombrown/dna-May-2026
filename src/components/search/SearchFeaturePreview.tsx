
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Users, Briefcase, MapPin } from 'lucide-react';

const SearchFeaturePreview: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="bg-dna-emerald/10 p-4 rounded-lg">
        <h3 className="font-semibold text-dna-forest mb-2 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Smart Professional Matching
        </h3>
        <p className="text-sm text-neutral-600 mb-3">
          Our AI-powered search will find professionals based on:
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Industry Expertise</Badge>
          <Badge variant="outline">Cultural Background</Badge>
          <Badge variant="outline">Geographic Location</Badge>
          <Badge variant="outline">Career Level</Badge>
        </div>
      </div>

      <div className="bg-dna-copper/10 p-4 rounded-lg">
        <h3 className="font-semibold text-dna-forest mb-2 flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          Advanced Filters
        </h3>
        <p className="text-sm text-neutral-600 mb-3">
          Filter by specific criteria including:
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Skills & Expertise</Badge>
          <Badge variant="outline">Company Size</Badge>
          <Badge variant="outline">Investment Interests</Badge>
          <Badge variant="outline">Mentorship Availability</Badge>
        </div>
      </div>

      <div className="bg-dna-gold/10 p-4 rounded-lg">
        <h3 className="font-semibold text-dna-forest mb-2 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Global Diaspora Network
        </h3>
        <p className="text-sm text-neutral-600 mb-3">
          Connect across continents with professionals in:
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">North America</Badge>
          <Badge variant="outline">Europe</Badge>
          <Badge variant="outline">Africa</Badge>
          <Badge variant="outline">Asia-Pacific</Badge>
        </div>
      </div>
    </div>
  );
};

export default SearchFeaturePreview;
