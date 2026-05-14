
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Briefcase, MessageSquare, UserPlus, Star } from 'lucide-react';
import { Professional } from '@/hooks/useSearch';

interface ProfessionalsResultsProps {
  professionals: Professional[];
  onConnect: (userId: string) => void;
  onMessage: (userId: string, userName: string) => void;
}

const ProfessionalsResults: React.FC<ProfessionalsResultsProps> = ({
  professionals,
  onConnect,
  onMessage
}) => {
  if (professionals.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-neutral-900">Professionals</h3>
      {professionals.map((professional) => (
        <Card key={professional.id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={professional.avatar_url} alt={professional.full_name} />
                <AvatarFallback>
                  {(professional.full_name || 'DN').split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900 truncate">
                      {professional.full_name}
                    </h3>
                    
                    {professional.profession && (
                      <div className="flex items-center text-neutral-600 mt-1">
                        <Briefcase className="w-4 h-4 mr-1" />
                        <span className="text-sm">
                          {professional.profession}
                          {professional.company && ` at ${professional.company}`}
                        </span>
                      </div>
                    )}
                    
                    {professional.location && (
                      <div className="flex items-center text-neutral-500 mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">{professional.location}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMessage(professional.id, professional.full_name)}
                      className="flex items-center gap-1"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Message
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onConnect(professional.id)}
                      className="bg-dna-emerald hover:bg-dna-forest text-white flex items-center gap-1"
                    >
                      <UserPlus className="w-4 h-4" />
                      Connect
                    </Button>
                  </div>
                </div>
                
                {professional.bio && (
                  <p className="text-neutral-600 text-sm mt-2 line-clamp-2">
                    {professional.bio}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {professional.is_mentor && (
                    <Badge variant="secondary" className="bg-dna-emerald/10 text-dna-emerald">
                      <Star className="w-3 h-3 mr-1" />
                      Mentor
                    </Badge>
                  )}
                  {professional.is_investor && (
                    <Badge variant="secondary" className="bg-dna-copper/10 text-dna-copper">
                      Investor
                    </Badge>
                  )}
                  {professional.looking_for_opportunities && (
                    <Badge variant="secondary" className="bg-dna-gold/10 text-dna-gold">
                      Open to Opportunities
                    </Badge>
                  )}
                </div>
                
                {professional.skills && professional.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {professional.skills.slice(0, 4).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {professional.skills.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{professional.skills.length - 4} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProfessionalsResults;
