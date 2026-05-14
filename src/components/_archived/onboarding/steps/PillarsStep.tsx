import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, HandHeart, Lightbulb } from 'lucide-react';

interface PillarsStepProps {
  data: any;
  updateData: (data: any) => void;
}

const PILLARS = [
  {
    id: 'connect',
    title: 'Connect',
    icon: Users,
    description: 'Build meaningful relationships across the African diaspora. Network with professionals, mentors, and collaborators who share your vision.',
    color: 'dna-emerald'
  },
  {
    id: 'collaborate',
    title: 'Collaborate',
    icon: HandHeart,
    description: 'Join forces on projects, ventures, and initiatives that drive impact. Work together to solve challenges and create opportunities.',
    color: 'dna-copper'
  },
  {
    id: 'contribute',
    title: 'Contribute',
    icon: Lightbulb,
    description: 'Share your expertise, resources, and knowledge to uplift the community. Make your mark on Africa\'s development story.',
    color: 'dna-gold'
  }
];

const PillarsStep: React.FC<PillarsStepProps> = ({ data, updateData }) => {
  const selectedPillars = data.selected_pillars || [];

  const togglePillar = (pillarId: string) => {
    const currentPillars = [...selectedPillars];
    const index = currentPillars.indexOf(pillarId);
    
    if (index > -1) {
      currentPillars.splice(index, 1);
    } else {
      currentPillars.push(pillarId);
    }
    
    updateData({ selected_pillars: currentPillars });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-dna-forest mb-2">
          The DNA Framework
        </h2>
        <p className="text-neutral-600">
          Select the pillars that resonate with your journey. You can choose multiple areas of focus.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        {PILLARS.map((pillar) => {
          const IconComponent = pillar.icon;
          const isSelected = selectedPillars.includes(pillar.id);
          
          return (
            <Card 
              key={pillar.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected 
                  ? `ring-2 ring-${pillar.color} bg-${pillar.color}/5` 
                  : 'hover:bg-neutral-50'
              }`}
              onClick={() => togglePillar(pillar.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-full bg-${pillar.color}/10`}>
                    <IconComponent className={`w-6 h-6 text-${pillar.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-dna-forest">
                        {pillar.title}
                      </h3>
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={isSelected ? `bg-${pillar.color} hover:bg-${pillar.color}/90` : ''}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </Button>
                    </div>
                    <p className="text-neutral-600 mt-2">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedPillars.length > 0 && (
        <div className="text-center text-sm text-neutral-600">
          Selected: {selectedPillars.length} pillar{selectedPillars.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default PillarsStep;