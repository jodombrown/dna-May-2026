import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface IntentStepProps {
  data: any;
  updateData: (data: any) => void;
}

const GIVE_OPTIONS = [
  { id: 'mentorship', label: 'Mentorship', description: 'Guide and advise others' },
  { id: 'capital', label: 'Capital', description: 'Invest in promising ventures' },
  { id: 'network', label: 'Network', description: 'Make strategic introductions' },
  { id: 'skills', label: 'Skills', description: 'Share professional expertise' },
  { id: 'advocacy', label: 'Advocacy', description: 'Champion important causes' }
];

const RECEIVE_OPTIONS = [
  { id: 'collaborators', label: 'Collaborators', description: 'Find project partners' },
  { id: 'learning', label: 'Learning', description: 'Gain new knowledge and skills' },
  { id: 'funding', label: 'Funding', description: 'Access investment opportunities' },
  { id: 'tools', label: 'Tools', description: 'Access resources and platforms' },
  { id: 'visibility', label: 'Visibility', description: 'Expand reach and recognition' }
];

const IntentStep: React.FC<IntentStepProps> = ({ data, updateData }) => {
  const whatToGive = data.what_to_give || [];
  const whatToReceive = data.what_to_receive || [];

  const toggleGiveOption = (optionId: string) => {
    const current = [...whatToGive];
    const index = current.indexOf(optionId);
    
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(optionId);
    }
    
    updateData({ what_to_give: current });
  };

  const toggleReceiveOption = (optionId: string) => {
    const current = [...whatToReceive];
    const index = current.indexOf(optionId);
    
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(optionId);
    }
    
    updateData({ what_to_receive: current });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-dna-forest mb-2">
          Your Impact Intent
        </h2>
        <p className="text-neutral-600">
          Help us understand how you want to contribute and what you're looking for in the community.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* What to Give */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-dna-forest flex items-center space-x-2">
              <span className="w-2 h-2 bg-dna-emerald rounded-full"></span>
              <span>What I Want to Give</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {GIVE_OPTIONS.map((option) => {
              const isSelected = whatToGive.includes(option.id);
              
              return (
                <div
                  key={option.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-dna-emerald bg-dna-emerald/5' 
                      : 'border-neutral-200 hover:border-dna-emerald/50'
                  }`}
                  onClick={() => toggleGiveOption(option.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-dna-forest">{option.label}</h4>
                      <p className="text-sm text-neutral-600">{option.description}</p>
                    </div>
                    {isSelected && (
                      <Badge variant="secondary" className="bg-dna-emerald text-white">
                        Selected
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* What to Receive */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-dna-forest flex items-center space-x-2">
              <span className="w-2 h-2 bg-dna-copper rounded-full"></span>
              <span>What I Want to Receive</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {RECEIVE_OPTIONS.map((option) => {
              const isSelected = whatToReceive.includes(option.id);
              
              return (
                <div
                  key={option.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-dna-copper bg-dna-copper/5' 
                      : 'border-neutral-200 hover:border-dna-copper/50'
                  }`}
                  onClick={() => toggleReceiveOption(option.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-dna-forest">{option.label}</h4>
                      <p className="text-sm text-neutral-600">{option.description}</p>
                    </div>
                    {isSelected && (
                      <Badge variant="secondary" className="bg-dna-copper text-white">
                        Selected
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-neutral-600">
        Selected to give: {whatToGive.length} • Selected to receive: {whatToReceive.length}
      </div>
    </div>
  );
};

export default IntentStep;