
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Plus, Users, Calendar, ExternalLink } from 'lucide-react';
import { Sankofa } from '@/components/icons/adinkra';

interface ProjectItem {
  id: string;
  title: string;
  description?: string;
  impact_area?: string;
  created_at: string;
}

interface InitiativeItem {
  id: string;
  title: string;
  description?: string;
  impact_area?: string;
  created_at: string;
}

interface ProfileData {
  innovation_pathways?: string | null;
  past_contributions?: string | null;
}

interface ProjectsSectionProps {
  profile: ProfileData;
  projects?: ProjectItem[];
  initiatives?: InitiativeItem[];
  isOwnProfile: boolean;
  onEdit?: () => void;
  onAddProject?: () => void;
}

const LinkedInProjectsSection: React.FC<ProjectsSectionProps> = ({ 
  profile,
  projects = [],
  initiatives = [],
  isOwnProfile, 
  onEdit,
  onAddProject
}) => {
  const hasContent = projects.length > 0 || 
    initiatives.length > 0 || 
    profile.innovation_pathways || 
    profile.past_contributions;

  if (!hasContent) {
    return isOwnProfile ? (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold text-dna-forest">Projects & Initiatives</CardTitle>
          <Button variant="ghost" size="sm" onClick={onAddProject}>
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-500 text-center py-8">
            Showcase your projects and initiatives that make an impact
          </p>
        </CardContent>
      </Card>
    ) : null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold text-dna-forest">Projects & Initiatives</CardTitle>
        {isOwnProfile && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onAddProject}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Projects */}
        {projects.length > 0 && (
          <div>
            <h4 className="font-semibold text-neutral-900 mb-4">Active Projects</h4>
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex gap-3 flex-1">
                      <div className="w-10 h-10 bg-dna-emerald/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Sankofa className="w-5 h-5 text-dna-emerald" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-lg text-neutral-900">{project.title}</h5>
                        {project.description && (
                          <p className="text-neutral-700 mt-1">{project.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-neutral-600">
                          {project.impact_area && (
                            <Badge variant="outline" className="text-dna-crimson border-dna-crimson">
                              {project.impact_area}
                            </Badge>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(project.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>Collaborative Project</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Initiatives */}
        {initiatives.length > 0 && (
          <div>
            <h4 className="font-semibold text-neutral-900 mb-4">Initiatives</h4>
            <div className="space-y-4">
              {initiatives.map((initiative) => (
                <div key={initiative.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-dna-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Sankofa className="w-5 h-5 text-dna-gold" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-lg text-neutral-900">{initiative.title}</h5>
                      {initiative.description && (
                        <p className="text-neutral-700 mt-1">{initiative.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-neutral-600">
                        {initiative.impact_area && (
                          <Badge variant="outline" className="text-dna-crimson border-dna-crimson">
                            {initiative.impact_area}
                          </Badge>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(initiative.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Innovation Pathways */}
        {profile.innovation_pathways && (
          <div>
            <h4 className="font-semibold text-neutral-900 mb-3">Innovation Pathways</h4>
            <div className="bg-dna-mint/5 rounded-lg p-4 border-l-4 border-dna-mint">
              <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                {profile.innovation_pathways}
              </p>
            </div>
          </div>
        )}

        {/* Past Contributions */}
        {profile.past_contributions && (
          <div>
            <h4 className="font-semibold text-neutral-900 mb-3">Past Contributions</h4>
            <div className="bg-dna-copper/5 rounded-lg p-4 border-l-4 border-dna-copper">
              <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                {profile.past_contributions}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LinkedInProjectsSection;
