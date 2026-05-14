
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DollarSign, Users, Clock, Target } from 'lucide-react';

interface ContributionPathway {
  id: number;
  title: string;
  description: string;
  type: string;
  targetAmount: number;
  currentAmount: number;
  contributors: number;
  timeLeft: string;
  impactMetric: string;
  category: string;
  urgency: string;
}

interface ContributionPathwayCardProps {
  pathway: ContributionPathway;
  onContribute: () => void;
  onLearnMore: (pathway: ContributionPathway) => void;
}

const ContributionPathwayCard: React.FC<ContributionPathwayCardProps> = ({
  pathway,
  onContribute,
  onLearnMore
}) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base sm:text-lg mb-2">{pathway.title}</CardTitle>
            <p className="text-sm sm:text-base text-neutral-600">{pathway.description}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Badge 
              className={`${
                pathway.urgency === 'High' ? 'bg-red-100 text-red-800' :
                pathway.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              } text-xs`}
            >
              {pathway.urgency} Priority
            </Badge>
            <Badge variant="outline" className="text-xs">{pathway.type}</Badge>
          </div>
        </div>
        <Badge className="w-fit bg-dna-emerald/20 text-dna-emerald text-xs">
          {pathway.category}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-neutral-400" />
            <span className="text-sm">
              ${pathway.currentAmount.toLocaleString()} / ${pathway.targetAmount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-neutral-400" />
            <span className="text-sm">{pathway.contributors} contributors</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span className="text-sm">{pathway.timeLeft} remaining</span>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Funding Progress</span>
            <span className="font-medium">
              {Math.round((pathway.currentAmount / pathway.targetAmount) * 100)}%
            </span>
          </div>
          <Progress 
            value={(pathway.currentAmount / pathway.targetAmount) * 100} 
            className="h-2"
          />
        </div>
        
        <div className="bg-dna-emerald/10 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-dna-emerald" />
            <span className="text-sm font-medium text-dna-emerald">
              Projected Impact: {pathway.impactMetric}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button 
            onClick={onContribute}
            className="flex-1 bg-dna-emerald hover:bg-dna-forest text-white"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Contribute Now
          </Button>
          <Button 
            onClick={() => onLearnMore(pathway)}
            variant="outline"
          >
            Learn More
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContributionPathwayCard;
