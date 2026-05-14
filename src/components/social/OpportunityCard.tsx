
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, Calendar, Building } from 'lucide-react';

interface OpportunityData {
  id: string;
  title: string;
  role_type: string | null;
  organization: string | null;
  location: string | null;
  deadline: string | null;
  description: string | null;
  tags: string[] | null;
  created_at: string;
}

interface OpportunityCardProps {
  opportunity: OpportunityData;
  showInFeed?: boolean;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, showInFeed = false }) => {
  return (
    <Card className={`${showInFeed ? 'border-l-4 border-l-dna-gold' : ''} hover:shadow-md transition-shadow`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="w-5 h-5 text-dna-gold" />
          <span className="font-semibold text-dna-gold">Opportunity</span>
        </div>
        <h3 className="text-lg font-semibold text-neutral-900">{opportunity.title}</h3>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 text-sm text-neutral-600">
          {opportunity.role_type && (
            <Badge variant="outline" className="border-dna-gold text-dna-gold">
              {opportunity.role_type}
            </Badge>
          )}
          
          {opportunity.organization && (
            <div className="flex items-center gap-1">
              <Building className="w-4 h-4" />
              <span>{opportunity.organization}</span>
            </div>
          )}
          
          {opportunity.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{opportunity.location}</span>
            </div>
          )}
        </div>
        
        {opportunity.description && (
          <p className="text-neutral-700 text-sm leading-relaxed">{opportunity.description}</p>
        )}
        
        {opportunity.deadline && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <Calendar className="w-4 h-4" />
            <span>Deadline: {new Date(opportunity.deadline).toLocaleDateString()}</span>
          </div>
        )}
        
        {opportunity.tags && opportunity.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {opportunity.tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-dna-gold/10 text-dna-gold hover:bg-dna-gold hover:text-white text-xs"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OpportunityCard;
