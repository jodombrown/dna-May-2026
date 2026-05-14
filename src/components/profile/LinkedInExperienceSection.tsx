
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Calendar,
  Building,
  Plus
} from 'lucide-react';

interface ExperienceSectionProps {
  profile: any;
  isOwnProfile: boolean;
  onEdit?: () => void;
}

const LinkedInExperienceSection: React.FC<ExperienceSectionProps> = ({ 
  profile, 
  isOwnProfile, 
  onEdit 
}) => {
  const hasExperience = profile.professional_role || 
    profile.organization || 
    profile.years_experience || 
    profile.education || 
    profile.certifications ||
    profile.achievements;

  if (!hasExperience) {
    return isOwnProfile ? (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold text-dna-forest">Experience</CardTitle>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Plus className="w-4 h-4 mr-2" />
            Add Experience
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-500 text-center py-8">
            Add your professional experience to showcase your career journey
          </p>
        </CardContent>
      </Card>
    ) : null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold text-dna-forest">Experience</CardTitle>
        {isOwnProfile && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Role */}
        {(profile.professional_role || profile.organization) && (
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-dna-copper/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-6 h-6 text-dna-copper" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-neutral-900">
                {profile.professional_role || 'Current Position'}
              </h3>
              {profile.organization && (
                <p className="text-dna-copper font-medium">{profile.organization}</p>
              )}
              {profile.years_experience && (
                <div className="flex items-center gap-1 text-neutral-600 mt-1">
                  <Calendar className="w-4 h-4" />
                  <span>{profile.years_experience} years experience</span>
                </div>
              )}
              {profile.industry && (
                <div className="flex items-center gap-1 text-neutral-600 mt-1">
                  <Building className="w-4 h-4" />
                  <span>{profile.industry}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Education */}
        {profile.education && (
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-dna-emerald/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-dna-emerald" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-neutral-900">Education</h3>
              <p className="text-neutral-700 whitespace-pre-line leading-relaxed">
                {profile.education}
              </p>
            </div>
          </div>
        )}

        {/* Certifications */}
        {profile.certifications && (
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-dna-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-dna-gold" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-neutral-900">Certifications</h3>
              <p className="text-neutral-700 whitespace-pre-line leading-relaxed">
                {profile.certifications}
              </p>
            </div>
          </div>
        )}

        {/* Key Achievements */}
        {profile.achievements && (
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-dna-crimson/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-dna-crimson" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-neutral-900">Key Achievements</h3>
              <p className="text-neutral-700 whitespace-pre-line leading-relaxed">
                {profile.achievements}
              </p>
            </div>
          </div>
        )}

        {/* Skills from profile */}
        {profile.skills && profile.skills.length > 0 && (
          <div>
            <h4 className="font-semibold text-neutral-900 mb-3">Skills & Expertise</h4>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill: string, index: number) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-dna-forest border-dna-forest"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LinkedInExperienceSection;
