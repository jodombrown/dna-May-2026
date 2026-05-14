import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Target, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { calculateProfileCompletionPts } from '@/lib/profileCompletion';
import { Sankofa } from '@/components/icons/adinkra';

// Field priority ranking by impact
const FIELD_PRIORITY: Record<string, number> = {
  'intentions': 1,
  'africa_focus_areas': 2,
  'skills': 3,
  'diaspora_status': 4,
  'bio': 5,
  'headline': 6,
  'profession': 7,
  'avatar_url': 8,
  'company': 9,
  'linkedin_url': 10,
};

interface MissingField {
  key: string;
  label: string;
  impact: 'high' | 'medium' | 'low';
  icon: any;
  estimatedTime: number; // in minutes
  unlocks: string;
}

export const ProfileCompletionWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ['profile-completion', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  if (!profile) return null;

  const completion = calculateProfileCompletionPts(profile);

  // Don't show widget if 100% complete
  if (completion >= 100) return null;

  // Determine missing fields with strategic prioritization
  const missingFields: MissingField[] = [];

  // HIGH IMPACT FIELDS
  if (!profile.intentions || profile.intentions.length === 0) {
    missingFields.push({
      key: 'intentions',
      label: 'Add intentions to unlock personalized events',
      impact: 'high',
      icon: Target,
      estimatedTime: 1,
      unlocks: 'Event & connection matching'
    });
  }

  if (!profile.africa_focus_areas || (profile.africa_focus_areas as any[]).length === 0) {
    missingFields.push({
      key: 'africa_focus_areas',
      label: 'Specify Africa focus to see relevant connections',
      impact: 'high',
      icon: Globe,
      estimatedTime: 2,
      unlocks: 'Smart recommendations'
    });
  }

  if (!profile.skills || profile.skills.length < 3) {
    missingFields.push({
      key: 'skills',
      label: 'Add 3+ skills to join project opportunities',
      impact: 'high',
      icon: Sankofa,
      estimatedTime: 2,
      unlocks: 'Project collaboration'
    });
  }

  if (!profile.diaspora_status) {
    missingFields.push({
      key: 'diaspora_status',
      label: 'Share your diaspora status to find your community',
      impact: 'high',
      icon: Sankofa,
      estimatedTime: 1,
      unlocks: 'Community matching'
    });
  }

  // MEDIUM IMPACT FIELDS
  if (!profile.bio || profile.bio.length < 50) {
    missingFields.push({
      key: 'bio',
      label: 'Complete your bio to help others understand your story',
      impact: 'medium',
      icon: AlertCircle,
      estimatedTime: 3,
      unlocks: 'Profile visibility'
    });
  }

  if (!profile.headline) {
    missingFields.push({
      key: 'headline',
      label: 'Add headline to stand out in search',
      impact: 'medium',
      icon: AlertCircle,
      estimatedTime: 1,
      unlocks: 'Search ranking'
    });
  }

  if (!profile.profession || !profile.company) {
    missingFields.push({
      key: 'profession',
      label: 'Share professional context',
      impact: 'medium',
      icon: AlertCircle,
      estimatedTime: 1,
      unlocks: 'Professional credibility'
    });
  }

  // LOWER IMPACT FIELDS
  if (!profile.avatar_url) {
    missingFields.push({
      key: 'avatar_url',
      label: 'Upload profile photo',
      impact: 'low',
      icon: AlertCircle,
      estimatedTime: 2,
      unlocks: 'Visual identity'
    });
  }

  // Sort by priority
  const prioritizedFields = missingFields.sort((a, b) => 
    (FIELD_PRIORITY[a.key] || 999) - (FIELD_PRIORITY[b.key] || 999)
  );

  // Show top 3 most impactful
  const topMissing = prioritizedFields.slice(0, 3);
  const quickWins = topMissing.filter(f => f.estimatedTime <= 2);

  // Calculate time to next milestone
  const nextMilestone = completion < 40 ? 40 : completion < 60 ? 60 : completion < 80 ? 80 : 100;
  const pointsToMilestone = nextMilestone - completion;
  const estimatedMinutes = Math.ceil(pointsToMilestone / 10); // Rough estimate

  // Milestone benefits (no blocking, just incentives!)
  const milestones = [
    { threshold: 40, label: '✅ Unlock better match recommendations', achieved: completion >= 40 },
    { threshold: 60, label: '🚀 Boost your connection visibility', achieved: completion >= 60 },
    { threshold: 80, label: '🔍 Become highly searchable by investors', achieved: completion >= 80 },
    { threshold: 100, label: '⭐ Join the Founders Circle elite', achieved: completion >= 100 },
  ];

  const isUnlocked = true; // Always unlocked - zero blocking!

  return (
    <Card className="border-l-4 border-l-dna-copper">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sankofa className="h-5 w-5 text-dna-copper" />
          Enhance Your Profile
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Stand out and unlock premium features as you complete your profile
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{completion}%</span>
          </div>
          <Progress value={completion} className="h-2" />
          <p className="text-xs text-muted-foreground">
            ~{estimatedMinutes} min to reach {nextMilestone}%
          </p>
        </div>

        {/* Encouragement Status - NO BLOCKING! */}
        <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-dna-mint/10 text-dna-forest border border-dna-mint">
          <CheckCircle className="h-4 w-4" />
          <span className="font-medium">
            {completion >= 80 ? '⭐ Amazing profile!' : completion >= 60 ? '🚀 Great progress!' : '💪 You can connect with anyone!'}
          </span>
        </div>

        {/* Quick Wins Section */}
        {quickWins.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sankofa className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-semibold">Quick Wins</p>
              <Badge variant="secondary" className="text-xs">
                &lt;2 min each
              </Badge>
            </div>
            <ul className="text-sm space-y-2">
              {quickWins.map((field) => {
                const Icon = field.icon;
                return (
                  <li key={field.key} className="flex items-start gap-2 p-2 rounded-md hover:bg-accent/50">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${
                      field.impact === 'high' ? 'text-dna-copper' : 'text-muted-foreground'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{field.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Unlocks: {field.unlocks}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* High Priority Missing Fields */}
        {topMissing.filter(f => !quickWins.includes(f)).length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              High Impact Items:
            </p>
            <ul className="text-sm space-y-2">
              {topMissing.filter(f => !quickWins.includes(f)).map((field) => {
                const Icon = field.icon;
                return (
                  <li key={field.key} className="flex items-start gap-2">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${
                      field.impact === 'high' ? 'text-dna-copper' : 'text-muted-foreground'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{field.label}</p>
                      <p className="text-xs text-muted-foreground">
                        ~{field.estimatedTime} min • Unlocks: {field.unlocks}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Milestone Progress */}
        <div className="space-y-2 pt-2 border-t">
          <p className="text-xs font-semibold text-muted-foreground">What You'll Unlock:</p>
          <div className="space-y-1">
            {milestones.map((milestone) => (
              <div 
                key={milestone.threshold}
                className={`text-xs flex items-center gap-2 ${
                  milestone.achieved ? 'text-dna-forest font-medium' : 'text-muted-foreground'
                }`}
              >
                {milestone.achieved ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <div className="h-3 w-3 rounded-full border border-muted-foreground" />
                )}
                <span>{milestone.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Encouragement Message */}
        {completion >= 75 && completion < 100 && (
          <div className="text-center p-3 bg-dna-copper/10 rounded-lg">
            <p className="text-sm font-semibold text-dna-copper">
              🎉 You're almost there! Just {100 - completion}% to go!
            </p>
          </div>
        )}

        {/* CTA Button */}
        <Button 
          onClick={() => navigate('/dna/profile/edit')}
          className="w-full"
          variant="default"
        >
          <Sankofa className="h-4 w-4 mr-2" />
          Complete Profile →
        </Button>
      </CardContent>
    </Card>
  );
};