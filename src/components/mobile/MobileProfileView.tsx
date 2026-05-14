import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Edit3,
  Settings,
  Share2,
  ExternalLink,
  LogOut
} from 'lucide-react';

const MobileProfileView = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Profile Header */}
      <div className="bg-white p-6 border-b">
        <div className="flex items-center space-x-4 mb-4">
          <Avatar className="w-20 h-20">
            <AvatarFallback className="bg-dna-emerald text-white text-2xl">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-dna-forest">
              {profile?.full_name || user?.email?.split('@')[0] || 'User'}
            </h1>
            <p className="text-neutral-600">
              {profile?.profession || profile?.headline || 'DNA Member'}
            </p>
            <div className="flex items-center mt-1 text-neutral-500">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-sm">
                {profile?.location || 'Location not set'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            className="flex-1 bg-dna-copper hover:bg-dna-gold text-white"
            onClick={() => navigate('/dna/profile/edit')}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-dna-forest">128</p>
              <p className="text-xs text-neutral-600">Connections</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-dna-forest">45</p>
              <p className="text-xs text-neutral-600">Followers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-dna-forest">12</p>
              <p className="text-xs text-neutral-600">Projects</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* About Section */}
      <Card className="mx-4 mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-dna-forest">About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-700 text-sm leading-relaxed">
            {profile?.bio || 'Full profile editing coming soon...'}
          </p>
        </CardContent>
      </Card>

      {/* Experience Section */}
      <Card className="mx-4 mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-dna-forest flex items-center">
            <Briefcase className="w-5 h-5 mr-2" />
            Experience
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-dna-mint rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-dna-forest" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-dna-forest">
                  {profile?.profession || profile?.headline || 'Professional Title'}
                </p>
                <p className="text-sm text-neutral-600">Current Position</p>
                <p className="text-xs text-neutral-500">2020 - Present</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Section */}
      <Card className="mx-4 mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-dna-forest">Skills & Expertise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {profile?.skills && Array.isArray(profile.skills) && profile.skills.length > 0 ? (
              profile.skills.map((skill: string, index: number) => (
                <Badge key={index} variant="secondary" className="bg-dna-mint/20 text-dna-forest">
                  {skill}
                </Badge>
              ))
            ) : (
              <>
                <Badge variant="secondary" className="bg-dna-mint/20 text-dna-forest">
                  Entrepreneurship
                </Badge>
                <Badge variant="secondary" className="bg-dna-mint/20 text-dna-forest">
                  Innovation
                </Badge>
                <Badge variant="secondary" className="bg-dna-mint/20 text-dna-forest">
                  Leadership
                </Badge>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Education Section */}
      <Card className="mx-4 mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-dna-forest flex items-center">
            <GraduationCap className="w-5 h-5 mr-2" />
            Education
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-dna-copper/20 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-dna-copper" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-dna-forest">University Degree</p>
              <p className="text-sm text-neutral-600">Institution Name</p>
              <p className="text-xs text-neutral-500">Graduation Year</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="mx-4 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-dna-forest">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <Settings className="w-4 h-4 mr-3" />
            Account Settings
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <ExternalLink className="w-4 h-4 mr-3" />
            Public Profile
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileProfileView;