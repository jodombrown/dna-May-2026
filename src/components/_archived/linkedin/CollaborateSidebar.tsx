import React from 'react';
import { Lightbulb, Code, Users, Clock, Star, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

export const CollaborateSidebar = () => {
  const activeProjects = [
    { 
      name: "AgriTech Platform", 
      role: "Frontend Developer", 
      progress: 75, 
      deadline: "2 weeks",
      team: ["AM", "KD", "ZM"],
      priority: "High"
    },
    { 
      name: "FinTech API", 
      role: "Product Manager", 
      progress: 45, 
      deadline: "1 month",
      team: ["JO", "BT"],
      priority: "Medium"
    }
  ];

  const skillsInDemand = [
    { skill: "React Native", projects: 12, urgency: "High" },
    { skill: "Blockchain", projects: 8, urgency: "Medium" },
    { skill: "AI/ML", projects: 15, urgency: "High" },
    { skill: "Product Design", projects: 6, urgency: "Medium" }
  ];

  const collaborationOpportunities = [
    { 
      title: "Mobile Banking Solution", 
      type: "Product", 
      skills: ["React Native", "Fintech"],
      members: 4,
      funding: "$50k",
      deadline: "Q2 2024"
    },
    { 
      title: "Education Platform", 
      type: "Social Impact", 
      skills: ["Next.js", "EdTech"],
      members: 6,
      funding: "Bootstrapped",
      deadline: "Q3 2024"
    }
  ];

  return (
    <div className="space-y-4">
      {/* Active Projects */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-dna-emerald" />
            Active Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeProjects.map((project, index) => (
              <div key={index} className="p-3 bg-dna-emerald/5 rounded-lg border border-dna-emerald/20">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{project.name}</p>
                    <p className="text-xs text-neutral-600">{project.role}</p>
                  </div>
                  <Badge 
                    variant={project.priority === 'High' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {project.priority}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-neutral-600">Progress</span>
                    <span className="text-xs font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1">
                    {project.team.map((member, idx) => (
                      <Avatar key={idx} className="w-6 h-6">
                        <AvatarFallback className="text-xs bg-dna-mint text-dna-forest">
                          {member}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <Clock className="w-3 h-3" />
                    {project.deadline}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skills in Demand */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Code className="w-4 h-4" />
            Skills in Demand
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {skillsInDemand.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-neutral-50 rounded">
                <div>
                  <p className="text-sm font-medium">{item.skill}</p>
                  <p className="text-xs text-neutral-500">{item.projects} projects</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={item.urgency === 'High' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {item.urgency}
                  </Badge>
                  <Star className="w-4 h-4 text-yellow-500" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* New Collaboration Opportunities */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">New Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {collaborationOpportunities.map((opp, index) => (
              <div key={index} className="p-3 border border-dna-emerald/20 rounded-lg hover:bg-dna-emerald/5 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{opp.title}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {opp.type}
                    </Badge>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-400" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {opp.skills.map((skill, skillIndex) => (
                      <Badge key={skillIndex} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-neutral-600">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {opp.members} members
                    </span>
                    <span>{opp.funding}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-neutral-500">Due: {opp.deadline}</span>
                    <Button size="sm" variant="outline" className="text-xs h-6">
                      Join
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};