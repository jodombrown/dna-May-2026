import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PersonalizedStepProps {
  data: any;
  updateData: (data: any) => void;
}

const MENTORSHIP_OPTIONS = ['Career guidance', 'Technical skills', 'Leadership development', 'Industry insights', 'Entrepreneurship'];
const IMPACT_GOALS = ['Economic development', 'Education access', 'Healthcare improvement', 'Technology advancement', 'Policy change'];
const VENTURE_STAGES = ['Ideation', 'MVP/Prototype', 'Early stage', 'Growth stage', 'Scale/Expansion'];
const FUNDRAISING_STATUS = ['Not seeking funding', 'Pre-seed', 'Seed round', 'Series A', 'Series B+'];
const COLLABORATION_NEEDS = ['Co-founder', 'Technical team', 'Business development', 'Marketing', 'Operations'];
const SUPPORT_AREAS = ['Pro bono services', 'Volunteer work', 'Financial support', 'Resource sharing', 'Skill development'];
const ADVOCACY_INTERESTS = ['Policy advocacy', 'Community organizing', 'Awareness campaigns', 'Educational outreach', 'Cultural preservation'];

const PersonalizedStep: React.FC<PersonalizedStepProps> = ({ data, updateData }) => {
  const userType = data.user_type;

  const toggleArrayItem = (field: string, item: string) => {
    const current = data[field] || [];
    const index = current.indexOf(item);
    
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(item);
    }
    
    updateData({ [field]: [...current] });
  };

  const handleInputChange = (field: string, value: string) => {
    updateData({ [field]: value });
  };

  if (userType === 'diaspora_professional') {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-dna-forest mb-2">
            Professional Journey
          </h2>
          <p className="text-neutral-600">
            Tell us about your expertise and how you'd like to make an impact.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mentorship Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {MENTORSHIP_OPTIONS.map((option) => {
                const isSelected = (data.mentorship_interest || []).includes(option);
                return (
                  <Button
                    key={option}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayItem('mentorship_interest', option)}
                    className={isSelected ? 'bg-dna-emerald hover:bg-dna-emerald/90' : ''}
                  >
                    {option}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Impact Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {IMPACT_GOALS.map((goal) => {
                const isSelected = (data.impact_goals || []).includes(goal);
                return (
                  <Button
                    key={goal}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayItem('impact_goals', goal)}
                    className={isSelected ? 'bg-dna-copper hover:bg-dna-copper/90' : ''}
                  >
                    {goal}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userType === 'founder') {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-dna-forest mb-2">
            Venture Details
          </h2>
          <p className="text-neutral-600">
            Share information about your venture and collaboration needs.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="venture_name">Venture/Project Name</Label>
                <Input
                  id="venture_name"
                  value={data.venture_name || ''}
                  onChange={(e) => handleInputChange('venture_name', e.target.value)}
                  placeholder="Enter your venture name"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Venture Stage</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {VENTURE_STAGES.map((stage) => {
                    const isSelected = data.venture_stage === stage;
                    return (
                      <Button
                        key={stage}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleInputChange('venture_stage', stage)}
                        className={isSelected ? 'bg-dna-emerald hover:bg-dna-emerald/90' : ''}
                      >
                        {stage}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Fundraising Status</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {FUNDRAISING_STATUS.map((status) => {
                    const isSelected = data.fundraising_status === status;
                    return (
                      <Button
                        key={status}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleInputChange('fundraising_status', status)}
                        className={isSelected ? 'bg-dna-copper hover:bg-dna-copper/90' : ''}
                      >
                        {status}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Collaboration Needs</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {COLLABORATION_NEEDS.map((need) => {
                    const isSelected = (data.collaboration_needs || []).includes(need);
                    return (
                      <Button
                        key={need}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleArrayItem('collaboration_needs', need)}
                        className={isSelected ? 'bg-dna-gold hover:bg-dna-gold/90' : ''}
                      >
                        {need}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userType === 'ally') {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-dna-forest mb-2">
            How You Want to Support
          </h2>
          <p className="text-neutral-600">
            Tell us about the ways you'd like to contribute to the community.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Support Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {SUPPORT_AREAS.map((area) => {
                const isSelected = (data.support_areas || []).includes(area);
                return (
                  <Button
                    key={area}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayItem('support_areas', area)}
                    className={isSelected ? 'bg-dna-emerald hover:bg-dna-emerald/90' : ''}
                  >
                    {area}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Advocacy Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {ADVOCACY_INTERESTS.map((interest) => {
                const isSelected = (data.advocacy_interests || []).includes(interest);
                return (
                  <Button
                    key={interest}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayItem('advocacy_interests', interest)}
                    className={isSelected ? 'bg-dna-copper hover:bg-dna-copper/90' : ''}
                  >
                    {interest}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-neutral-600">Please select a user type to continue.</p>
    </div>
  );
};

export default PersonalizedStep;