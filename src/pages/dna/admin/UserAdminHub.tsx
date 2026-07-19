import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Handshake, Heart, BookOpen, BarChart3, Users, Settings, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MateMasie } from '@/components/icons/adinkra';

/**
 * UserAdminHub - Personal management hub for all Five C's activities
 * 
 * This is the user-facing admin panel where users manage:
 * - Their events (Convene)
 * - Their spaces/projects (Collaborate)  
 * - Their contributions (Contribute)
 * - Their stories/content (Convey)
 * - Analytics across all pillars
 */

interface AdminSection {
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  pillar?: string;
  color: string;
  items?: { label: string; path: string }[];
}

const UserAdminHub: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const adminSections: AdminSection[] = [
    {
      title: 'My Events',
      description: 'Manage events you\'re hosting or organizing',
      icon: Calendar,
      path: '/dna/convene/my-events',
      pillar: 'convene',
      color: 'text-blue-600 bg-blue-100',
      items: [
        { label: 'My Events', path: '/dna/convene/my-events' },
        { label: 'Event Analytics', path: '/dna/convene/analytics' },
        { label: 'Host an Event', path: '/dna/convene/events/new' },
      ]
    },
    {
      title: 'My Spaces',
      description: 'Manage collaboration spaces and projects',
      icon: Handshake,
      path: '/dna/collaborate/my-spaces',
      pillar: 'collaborate',
      color: 'text-copper-600 bg-copper-100',
      items: [
        { label: 'My Spaces', path: '/dna/collaborate/my-spaces' },
        { label: 'Create Space', path: '/dna/collaborate/spaces/new' },
      ]
    },
    {
      title: 'My Contributions',
      description: 'Track your giving and impact',
      icon: Heart,
      path: '/dna/contribute/my',
      pillar: 'contribute',
      color: 'text-rose-600 bg-rose-100',
      items: [
        { label: 'My Contributions', path: '/dna/contribute/my' },
      ]
    },
    {
      title: 'My Stories',
      description: 'Manage your published content',
      icon: BookOpen,
      path: '/dna/convey',
      pillar: 'convey',
      color: 'text-amber-600 bg-amber-100',
      items: [
        { label: 'My Stories', path: '/dna/convey/my-stories' },
        { label: 'Create Story', path: '/dna/convey/new' },
      ]
    },
    {
      title: 'Analytics',
      description: 'View your engagement and growth metrics',
      icon: BarChart3,
      path: '/dna/analytics',
      color: 'text-emerald-600 bg-emerald-100',
    },
    {
      title: 'My Network',
      description: 'Manage your connections',
      icon: Users,
      path: '/dna/connect',
      pillar: 'connect',
      color: 'text-cyan-600 bg-cyan-100',
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background px-4 py-6 md:py-8">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-h1 font-serif">Admin</h1>
              <p className="text-muted-foreground text-sm">Manage your DNA activities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 py-6 space-y-4">
        {/* Quick Stats could go here */}
        
        {/* Admin Sections */}
        <div className="grid gap-4 md:grid-cols-2">
          {adminSections.map((section) => (
            <Card 
              key={section.title}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(section.path)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={cn("p-2 rounded-lg", section.color)}>
                    <section.icon className="w-5 h-5" />
                  </div>
                  {section.pillar && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {section.pillar}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg mt-3">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              {section.items && section.items.length > 0 && (
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <Button
                        key={item.path}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(item.path);
                        }}
                      >
                        {item.label}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Settings Link */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/dna/settings')}
        >
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Account Settings</p>
                <p className="text-sm text-muted-foreground">Privacy, notifications, preferences</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserAdminHub;
