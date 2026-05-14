
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';

interface ProfessionalInfoSectionProps {
  formData: any;
  skillsOffered: string[];
  skillsNeeded: string[];
  availableFor: string[];
  onInputChange: (field: string, value: string | number) => void;
  onSkillsOfferedChange: (skills: string[]) => void;
  onSkillsNeededChange: (skills: string[]) => void;
  onAvailableForChange: (services: string[]) => void;
}

const AVAILABLE_FOR_OPTIONS = [
  'Mentorship', 'Funding', 'Advising', 'Speaking', 'Consulting', 
  'Board Positions', 'Partnerships', 'Networking', 'Other'
];

const ProfessionalInfoSection: React.FC<ProfessionalInfoSectionProps> = ({
  formData,
  skillsOffered,
  skillsNeeded,
  availableFor,
  onInputChange,
  onSkillsOfferedChange,
  onSkillsNeededChange,
  onAvailableForChange
}) => {
  const [newSkillOffered, setNewSkillOffered] = React.useState('');
  const [newSkillNeeded, setNewSkillNeeded] = React.useState('');

  const addSkillOffered = () => {
    if (newSkillOffered.trim() && !skillsOffered.includes(newSkillOffered.trim())) {
      onSkillsOfferedChange([...skillsOffered, newSkillOffered.trim()]);
      setNewSkillOffered('');
    }
  };

  const removeSkillOffered = (skill: string) => {
    onSkillsOfferedChange(skillsOffered.filter(s => s !== skill));
  };

  const addSkillNeeded = () => {
    if (newSkillNeeded.trim() && !skillsNeeded.includes(newSkillNeeded.trim())) {
      onSkillsNeededChange([...skillsNeeded, newSkillNeeded.trim()]);
      setNewSkillNeeded('');
    }
  };

  const removeSkillNeeded = (skill: string) => {
    onSkillsNeededChange(skillsNeeded.filter(s => s !== skill));
  };

  const toggleAvailableFor = (service: string) => {
    if (availableFor.includes(service)) {
      onAvailableForChange(availableFor.filter(s => s !== service));
    } else {
      onAvailableForChange([...availableFor, service]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-dna-forest">Professional Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="professional_role" className="text-sm font-medium text-neutral-700">
              Current Role/Title
            </Label>
            <Input
              id="professional_role"
              type="text"
              placeholder="e.g., Senior Software Engineer"
              value={formData.professional_role}
              onChange={(e) => onInputChange('professional_role', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="organization" className="text-sm font-medium text-neutral-700">
              Organization/Company
            </Label>
            <Input
              id="organization"
              type="text"
              placeholder="e.g., Google, Self-employed"
              value={formData.organization}
              onChange={(e) => onInputChange('organization', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="industry" className="text-sm font-medium text-neutral-700">
              Industry
            </Label>
            <Input
              id="industry"
              type="text"
              placeholder="e.g., Technology, Healthcare, Finance"
              value={formData.industry}
              onChange={(e) => onInputChange('industry', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="years_experience" className="text-sm font-medium text-neutral-700">
              Years of Experience
            </Label>
            <Input
              id="years_experience"
              type="number"
              placeholder="e.g., 5"
              value={formData.years_experience}
              onChange={(e) => onInputChange('years_experience', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="education" className="text-sm font-medium text-neutral-700">
            Education
          </Label>
          <Textarea
            id="education"
            placeholder="List your degrees, certifications, and educational background..."
            value={formData.education}
            onChange={(e) => onInputChange('education', e.target.value)}
            className="mt-1 min-h-[100px]"
          />
        </div>

        <div>
          <Label htmlFor="certifications" className="text-sm font-medium text-neutral-700">
            Certifications & Credentials
          </Label>
          <Textarea
            id="certifications"
            placeholder="List your professional certifications, licenses, and credentials..."
            value={formData.certifications}
            onChange={(e) => onInputChange('certifications', e.target.value)}
            className="mt-1 min-h-[80px]"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-neutral-700 mb-3 block">
            Skills I Can Offer
          </Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {skillsOffered.map((skill) => (
              <Badge key={skill} variant="outline" className="text-dna-emerald border-dna-emerald">
                {skill}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-auto p-0 text-dna-emerald hover:text-red-500"
                  onClick={() => removeSkillOffered(skill)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Project Management"
              value={newSkillOffered}
              onChange={(e) => setNewSkillOffered(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillOffered())}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addSkillOffered}
              className="border-dna-emerald text-dna-emerald hover:bg-dna-emerald hover:text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-neutral-700 mb-3 block">
            Skills I'm Looking For
          </Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {skillsNeeded.map((skill) => (
              <Badge key={skill} variant="outline" className="text-dna-gold border-dna-gold">
                {skill}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-auto p-0 text-dna-gold hover:text-red-500"
                  onClick={() => removeSkillNeeded(skill)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Digital Marketing"
              value={newSkillNeeded}
              onChange={(e) => setNewSkillNeeded(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillNeeded())}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addSkillNeeded}
              className="border-dna-gold text-dna-gold hover:bg-dna-gold hover:text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-neutral-700 mb-3 block">
            What I'm Available For
          </Label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_FOR_OPTIONS.map((service) => (
              <Badge
                key={service}
                variant={availableFor.includes(service) ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  availableFor.includes(service)
                    ? 'bg-dna-copper text-white'
                    : 'hover:bg-dna-copper/10 hover:text-dna-copper'
                }`}
                onClick={() => toggleAvailableFor(service)}
              >
                {service}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Select what you're available to help with
          </p>
        </div>

        <div>
          <Label htmlFor="achievements" className="text-sm font-medium text-neutral-700">
            Key Achievements
          </Label>
          <Textarea
            id="achievements"
            placeholder="Share your proudest professional and personal achievements..."
            value={formData.achievements}
            onChange={(e) => onInputChange('achievements', e.target.value)}
            className="mt-1 min-h-[100px]"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfessionalInfoSection;
