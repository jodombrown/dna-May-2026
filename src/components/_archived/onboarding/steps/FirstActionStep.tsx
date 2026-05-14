import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Users, Calendar, Briefcase } from 'lucide-react';
import { MateMasie } from '@/components/icons/adinkra';

interface FirstActionStepProps {
  data: any;
  updateData: (data: any) => void;
}

const getRecommendedAction = (userData: any) => {
  const userType = userData.user_type;
  const selectedPillars = userData.selected_pillars || [];
  const selections = userData.onboarding_selections || [];

  // Determine primary action based on user type and selections
  if (userType === 'founder' && selectedPillars.includes('collaborate')) {
    return {
      type: 'collaboration',
      title: 'Start Your First Collaboration',
      description: 'Connect with potential co-founders and partners in your space',
      icon: Users,
      action: 'Find Collaborators',
      route: '/app/network'
    };
  }

  if (userType === 'diaspora_professional' && selectedPillars.includes('connect')) {
    return {
      type: 'mentorship',
      title: 'Begin Your Mentorship Journey', 
      description: 'Share your expertise or find guidance from experienced professionals',
      icon: Users,
      action: 'Explore Mentorship',
      route: '/app/mentorship'
    };
  }

  if (selections.length > 0) {
    return {
      type: 'explore',
      title: 'Explore Your Interests',
      description: 'Check out the communities and opportunities you selected',
      icon: MateMasie,
      action: 'View My Selections',
      route: '/app/dashboard'
    };
  }

  // Default action
  return {
    type: 'community',
    title: 'Join Your First Community',
    description: 'Connect with like-minded people in the DNA network',
    icon: Users,
    action: 'Browse Communities',
    route: '/app/communities'
  };
};

const getSecondaryActions = (userData: any) => {
  const actions = [];
  
  actions.push({
    title: 'Discover Events',
    description: 'Find upcoming events and networking opportunities',
    icon: Calendar,
    action: 'View Events',
    route: '/app/events'
  });

  actions.push({
    title: 'Explore Projects',
    description: 'Find collaborative projects making impact across Africa',
    icon: Briefcase,
    action: 'Browse Projects',
    route: '/app/projects'
  });

  return actions;
};

const FirstActionStep: React.FC<FirstActionStepProps> = ({ data, updateData }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const recommendedAction = getRecommendedAction(data);
  const secondaryActions = getSecondaryActions(data);

  const handlePrimaryAction = async () => {
    try {
      setIsLoading(true);

      // Track first action
      const { error } = await supabase
        .from('profiles')
        .update({
          first_action_completed: true,
          first_action_type: recommendedAction.type,
          onboarding_recommendations_viewed: true
        })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      toast({
        title: "Welcome to DNA!",
        description: "Your journey in the African diaspora network begins now.",
      });

      // Navigate to the recommended action
      navigate(recommendedAction.route);

    } catch (error) {
      toast({
        title: "Welcome to DNA!",
        description: "Let's explore your personalized experience.",
      });
      navigate(recommendedAction.route);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecondaryAction = (action: any) => {
    navigate(action.route);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-dna-emerald to-dna-copper rounded-full flex items-center justify-center mx-auto mb-4">
          <MateMasie className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-dna-forest mb-2">
          Welcome to DNA!
        </h2>
        <p className="text-neutral-600">
          You're all set up. Here's what we recommend you do first based on your profile.
        </p>
      </div>

      {/* Primary Recommended Action */}
      <Card className="border-2 border-dna-emerald/20 bg-gradient-to-br from-dna-emerald/5 to-dna-copper/5">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-4 rounded-full bg-dna-emerald/10">
              <recommendedAction.icon className="w-8 h-8 text-dna-emerald" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-dna-forest mb-1">
                {recommendedAction.title}
              </h3>
              <p className="text-neutral-600 mb-4">
                {recommendedAction.description}
              </p>
              <Button 
                onClick={handlePrimaryAction}
                disabled={isLoading}
                className="bg-dna-emerald hover:bg-dna-emerald/90 text-white"
                size="lg"
              >
                {recommendedAction.action}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Actions */}
      <div className="space-y-3">
        <h4 className="text-lg font-medium text-dna-forest text-center">
          Or explore these options
        </h4>
        <div className="grid gap-3">
          {secondaryActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Card 
                key={index}
                className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-dna-copper/30"
                onClick={() => handleSecondaryAction(action)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-dna-copper/10">
                      <IconComponent className="w-5 h-5 text-dna-copper" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-dna-forest">{action.title}</h4>
                      <p className="text-sm text-neutral-600">{action.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Skip Option */}
      <div className="text-center pt-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/app')}
          className="text-neutral-500 hover:text-dna-forest"
        >
          Skip for now - take me to my dashboard
        </Button>
      </div>
    </div>
  );
};

export default FirstActionStep;