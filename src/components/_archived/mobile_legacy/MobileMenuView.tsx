import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDashboard } from '@/contexts/DashboardContext';
import { 
  Info, 
  Users, 
  Handshake, 
  Heart,
  Mail,
  Settings,
  Search,
  ChevronRight,
  ExternalLink,
  MessageSquareHeart
} from 'lucide-react';
import { publicNavItems } from '@/components/header/navigationConfig';

const MobileMenuView = () => {
  const navigate = useNavigate();
  const { setActiveView } = useDashboard();

  const marketingPages = [
    { name: 'About Us', path: '/about', icon: Info, description: 'Learn about DNA\'s mission' },
    { name: 'Connect', path: '/connect', icon: Users, description: 'Network with African Diaspora' },
    { name: 'Collaborate', path: '/collaborate', icon: Handshake, description: 'Partner on projects' },
    { name: 'Contribute', path: '/contribute', icon: Heart, description: 'Support Africa\'s development' },
    { name: 'Contact', path: '/contact', icon: Mail, description: 'Get in touch with us' },
  ];

  const appFeatures = [
    { name: 'Search', view: 'search', icon: Search, description: 'Find people and content' },
    { name: 'Feedback', path: '/dna/feedback', icon: MessageSquareHeart, description: 'Share your thoughts with us' },
    { name: 'Settings', view: 'settings', icon: Settings, description: 'Manage your preferences' },
  ];

  const handleMarketingPageClick = (path: string) => {
    navigate(path);
  };

  const handleAppFeatureClick = (view: string) => {
    setActiveView(view as any);
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Header */}
      <div className="bg-white p-6 border-b">
        <h1 className="text-2xl font-bold text-dna-forest">Menu</h1>
        <p className="text-neutral-600 mt-1">Navigate DNA Platform</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Marketing Pages */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-dna-forest flex items-center">
              <ExternalLink className="w-5 h-5 mr-2" />
              Explore DNA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {marketingPages.map((page) => (
              <div 
                key={page.path}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 active:bg-neutral-100 cursor-pointer"
                onClick={() => handleMarketingPageClick(page.path)}
              >
                <div className="flex items-center">
                  <page.icon className="w-5 h-5 mr-3 text-dna-copper" />
                  <div>
                    <p className="font-medium text-dna-forest">{page.name}</p>
                    <p className="text-sm text-neutral-600">{page.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* App Features */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-dna-forest flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              App Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {appFeatures.map((feature) => (
              <div 
                key={feature.view || feature.path}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 active:bg-neutral-100 cursor-pointer"
                onClick={() => feature.path ? navigate(feature.path) : handleAppFeatureClick(feature.view!)}
              >
                <div className="flex items-center">
                  <feature.icon className="w-5 h-5 mr-3 text-dna-emerald" />
                  <div>
                    <p className="font-medium text-dna-forest">{feature.name}</p>
                    <p className="text-sm text-neutral-600">{feature.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-dna-forest">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setActiveView('dashboard')}
              className="w-full bg-dna-copper hover:bg-dna-gold text-white mb-3"
            >
              Back to Feed
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileMenuView;