import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Users } from 'lucide-react';

const ProfileCard = () => {
  const { profile } = useAuth();

  return (
    <Card className="bg-white border border-neutral-200">
      <div className="relative">
        {/* Cover Image */}
        <div className="h-16 bg-gradient-to-r from-dna-forest to-dna-emerald rounded-t-lg"></div>
        
        {/* Profile Avatar */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
          <Avatar className="w-16 h-16 border-4 border-white">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-dna-mint text-dna-forest text-lg font-semibold">
              {profile?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <CardContent className="pt-10 pb-4 text-center">
        <h3 className="font-semibold text-neutral-900 mb-1">
          {profile?.full_name || 'DNA Member'}
        </h3>
        <p className="text-sm text-neutral-600 mb-3">
          {profile?.profession || profile?.headline || 'Professional'}
        </p>
        
        <div className="border-t border-neutral-200 pt-3 mt-3">
          <div className="flex items-center justify-between text-xs text-neutral-600">
            <div className="flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              <span>Profile views</span>
            </div>
            <span className="font-medium text-dna-forest">12</span>
          </div>
          
          <div className="flex items-center justify-between text-xs text-neutral-600 mt-2">
            <div className="flex items-center">
              <Users className="w-3 h-3 mr-1" />
              <span>Connections</span>
            </div>
            <span className="font-medium text-dna-forest">{profile?.connection_count || 0}</span>
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-3 mt-3">
          <p className="text-xs text-neutral-600 mb-2">Strengthen your profile with an AI writing assistant</p>
          <Button variant="outline" size="sm" className="text-xs">
            Try Premium for free
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;