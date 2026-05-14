import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, Users, DollarSign, GraduationCap, Heart, ArrowRight } from 'lucide-react';
import { getErrorMessage } from '@/lib/errorLogger';
import { MateMasie } from '@/components/icons/adinkra';

const ROLES = [
  { id: 'professional', label: 'Professional', icon: Briefcase, description: 'Working in a career or field' },
  { id: 'founder', label: 'Founder', icon: MateMasie, description: 'Building a startup or business' },
  { id: 'community_organizer', label: 'Community Organizer', icon: Users, description: 'Leading groups or initiatives' },
  { id: 'investor', label: 'Investor', icon: DollarSign, description: 'Funding projects and ventures' },
  { id: 'student', label: 'Student', icon: GraduationCap, description: 'Learning and growing' },
  { id: 'funder', label: 'Funder/Donor', icon: Heart, description: 'Supporting causes and people' },
];

const INTENTS = [
  { id: 'find_people', label: 'Find people', modules: ['suggested_people', 'recommended_spaces'] },
  { id: 'discover_events', label: 'Discover events', modules: ['upcoming_events'] },
  { id: 'join_spaces', label: 'Join spaces/projects', modules: ['recommended_spaces', 'open_needs'] },
  { id: 'offer_help', label: 'Offer help or resources', modules: ['open_needs'] },
  { id: 'share_stories', label: 'Share stories/updates', modules: ['recent_stories'] },
];

// Role-based module ordering
const ROLE_MODULE_ORDER: Record<string, string[]> = {
  founder: ['recommended_spaces', 'suggested_people', 'upcoming_events', 'open_needs', 'recent_stories', 'resume_section'],
  investor: ['open_needs', 'recommended_spaces', 'suggested_people', 'upcoming_events', 'recent_stories', 'resume_section'],
  community_organizer: ['upcoming_events', 'recommended_spaces', 'suggested_people', 'open_needs', 'recent_stories', 'resume_section'],
  student: ['upcoming_events', 'suggested_people', 'recommended_spaces', 'open_needs', 'recent_stories', 'resume_section'],
  funder: ['open_needs', 'recommended_spaces', 'upcoming_events', 'suggested_people', 'recent_stories', 'resume_section'],
  professional: ['suggested_people', 'upcoming_events', 'recommended_spaces', 'open_needs', 'recent_stories', 'resume_section'],
};

export function WelcomeWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedIntents, setSelectedIntents] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleIntentToggle = (intentId: string) => {
    setSelectedIntents(prev =>
      prev.includes(intentId)
        ? prev.filter(id => id !== intentId)
        : [...prev, intentId]
    );
  };

  const handleComplete = async () => {
    if (!user || !selectedRole) return;

    setIsSubmitting(true);

    try {
      // Update profile with role and intents
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          user_role: selectedRole,
          intents: selectedIntents,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Calculate visible modules based on intents
      const intentModules = selectedIntents.flatMap(
        intentId => INTENTS.find(i => i.id === intentId)?.modules || []
      );
      const uniqueModules = Array.from(new Set([...intentModules, 'resume_section']));

      // Get module order based on role
      const roleOrder = ROLE_MODULE_ORDER[selectedRole] || ROLE_MODULE_ORDER.professional;
      
      // Sort modules by role preference, keeping only visible ones
      const visibleModules = roleOrder.filter(module => uniqueModules.includes(module));

      // Create dashboard preferences
      const { error: prefsError } = await supabase
        .from('user_dashboard_preferences')
        .upsert({
          user_id: user.id,
          visible_modules: visibleModules,
          collapsed_modules: [],
          density: 'standard',
        });

      if (prefsError) throw prefsError;

      toast({
        title: 'Welcome to DNA!',
        description: 'Your dashboard has been personalized.',
      });

      navigate('/dna/feed');
    } catch (error: unknown) {
      toast({
        title: 'Setup failed',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <MateMasie className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl">Welcome to DNA</CardTitle>
          <CardDescription>
            Let's personalize your experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">What best describes you?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ROLES.map(role => {
                    const Icon = role.icon;
                    const isSelected = selectedRole === role.id;
                    return (
                      <Card
                        key={role.id}
                        className={`cursor-pointer transition-all hover:border-primary ${
                          isSelected ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setSelectedRole(role.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Icon className={`h-6 w-6 mt-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                            <div className="flex-1">
                              <h4 className="font-semibold">{role.label}</h4>
                              <p className="text-sm text-muted-foreground">{role.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!selectedRole}
                  size="lg"
                >
                  Next: Choose Your Interests
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">What are you here to do?</h3>
                <p className="text-sm text-muted-foreground mb-6">Select all that apply</p>
                <div className="space-y-3">
                  {INTENTS.map(intent => (
                    <label
                      key={intent.id}
                      className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedIntents.includes(intent.id)}
                        onCheckedChange={() => handleIntentToggle(intent.id)}
                      />
                      <span className="flex-1 font-medium">{intent.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {intent.modules.length} modules
                      </Badge>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  size="lg"
                >
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={selectedIntents.length === 0 || isSubmitting}
                  size="lg"
                >
                  {isSubmitting ? 'Setting up...' : 'Complete Setup'}
                  <MateMasie className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
