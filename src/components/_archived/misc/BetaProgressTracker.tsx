import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Target, Trophy, Users, MessageSquare } from 'lucide-react';
import { useBetaStatus } from '@/hooks/useBetaStatus';

const BetaProgressTracker: React.FC = () => {
  const { betaProfile, checkBetaExpiration } = useBetaStatus();
  
  if (!betaProfile?.is_beta_tester) return null;

  const expiration = checkBetaExpiration();
  const featuresCompleted = betaProfile.beta_features_tested?.length || 0;
  const feedbackGiven = betaProfile.beta_feedback_count || 0;
  
  // Define key features to test (you can expand this list)
  const keyFeatures = [
    'Profile Setup',
    'Community Join',
    'Messaging',
    'Event Participation',
    'Project Creation',
    'Connection Requests',
    'Content Posting',
    'Feedback System'
  ];
  
  const completionPercentage = Math.round((featuresCompleted / keyFeatures.length) * 100);

  const getStatusColor = () => {
    if (expiration?.isExpired) return 'bg-red-500';
    if (expiration && expiration.daysRemaining <= 2) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (expiration?.isExpired) return 'Beta Expired';
    if (expiration && expiration.daysRemaining <= 2) return 'Expiring Soon';
    return 'Active Beta Tester';
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-copper-50 border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Trophy className="w-5 h-5" />
            Beta Testing Progress
          </CardTitle>
          <Badge className={`${getStatusColor()} text-white`}>
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Remaining */}
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
          <Clock className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <p className="font-medium text-neutral-900">
              {expiration?.isExpired 
                ? 'Beta period has ended' 
                : `${expiration?.daysRemaining || 0} days remaining`
              }
            </p>
            <p className="text-sm text-neutral-600">
              Beta Phase: {betaProfile.beta_phase || 'Discovery'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700">Testing Progress</span>
            <span className="text-sm text-neutral-600">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 bg-white rounded border">
            <Target className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-sm font-medium">{featuresCompleted}</p>
              <p className="text-xs text-neutral-600">Features Tested</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white rounded border">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium">{feedbackGiven}</p>
              <p className="text-xs text-neutral-600">Feedback Given</p>
            </div>
          </div>
        </div>

        {/* Features to Test */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-neutral-700">Key Features to Test</h4>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {keyFeatures.map((feature) => (
              <div 
                key={feature}
                className={`flex items-center gap-1 p-1 rounded ${
                  betaProfile.beta_features_tested?.includes(feature)
                    ? 'text-green-700 bg-green-100'
                    : 'text-neutral-600 bg-neutral-100'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${
                  betaProfile.beta_features_tested?.includes(feature)
                    ? 'bg-green-500'
                    : 'bg-neutral-300'
                }`} />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        {!expiration?.isExpired && (
          <div className="text-center pt-2">
            <p className="text-xs text-neutral-600 mb-2">
              Help us build the future of African diaspora networking!
            </p>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => window.location.href = '/'}
            >
              Continue Testing
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BetaProgressTracker;