import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AvatarUpload from './AvatarUpload';

interface GoalsBioStepProps {
  data: any;
  updateData: (data: any) => void;
}

const GoalsBioStep: React.FC<GoalsBioStepProps> = ({ data, updateData }) => {

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-dna-forest mb-2">Connect Your Identity</h3>
        <p className="text-neutral-600">Link your professional presence and upload your photo</p>
      </div>

      {/* LinkedIn URL */}
      <div className="space-y-2">
        <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
        <Input
          id="linkedin_url"
          type="url"
          value={data.linkedin_url || ''}
          onChange={(e) => updateData({ linkedin_url: e.target.value })}
          placeholder="https://linkedin.com/in/yourprofile"
          className="w-full"
        />
      </div>

      {/* Twitter URL */}
      <div className="space-y-2">
        <Label htmlFor="twitter_url">Twitter Profile</Label>
        <Input
          id="twitter_url"
          type="url"
          value={data.twitter_url || ''}
          onChange={(e) => updateData({ twitter_url: e.target.value })}
          placeholder="https://twitter.com/yourusername"
          className="w-full"
        />
      </div>

      {/* Website URL */}
      <div className="space-y-2">
        <Label htmlFor="website_url">Personal Website</Label>
        <Input
          id="website_url"
          type="url"
          value={data.website_url || ''}
          onChange={(e) => updateData({ website_url: e.target.value })}
          placeholder="https://yourwebsite.com"
          className="w-full"
        />
      </div>

      {/* Profile Image */}
      <AvatarUpload 
        currentAvatarUrl={data.avatar_url}
        onAvatarChange={(url) => updateData({ avatar_url: url })}
      />
    </div>
  );
};

export default GoalsBioStep;