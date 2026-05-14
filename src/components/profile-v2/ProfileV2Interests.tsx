import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Plus, X, Loader2, Check } from 'lucide-react';
import { ProfileV2Tags, ProfileV2Visibility } from '@/types/profileV2';
import { Input } from '@/components/ui/input';
import { Sankofa } from '@/components/icons/adinkra';

interface ProfileV2InterestsProps {
  tags: ProfileV2Tags;
  visibility: ProfileV2Visibility;
  isOwner: boolean;
  onUpdate?: (interests: string[]) => Promise<void>;
}

const ProfileV2Interests: React.FC<ProfileV2InterestsProps> = ({
  tags,
  visibility,
  isOwner,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [interestsList, setInterestsList] = useState<string[]>(tags.interests || []);
  const [newInterest, setNewInterest] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Hide if visibility is set to hidden and viewer is not owner
  if (visibility.interests === 'hidden' && !isOwner) {
    return null;
  }

  const allInterests = [
    ...(tags.interests || []),
    ...(tags.focus_areas || []),
    ...(tags.industries || []),
    ...(tags.regional_expertise || []),
  ];
  const hasInterests = allInterests.length > 0;

  // Hide empty section for public viewers
  if (!hasInterests && !isOwner) {
    return null;
  }

  const handleAddInterest = () => {
    const trimmed = newInterest.trim();
    if (trimmed && !interestsList.includes(trimmed)) {
      setInterestsList([...interestsList, trimmed]);
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setInterestsList(interestsList.filter(i => i !== interest));
  };

  const handleSave = async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate(interestsList);
      setIsEditing(false);
    } catch (error) {
      // Failed to update interests
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setInterestsList(tags.interests || []);
    setNewInterest('');
    setIsEditing(false);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <Sankofa className="w-5 h-5 text-primary" />
          Interests & Focus Areas
        </CardTitle>
        {isOwner && !isEditing && onUpdate && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 w-8 p-0">
            <Edit className="w-4 h-4" />
            <span className="sr-only">Edit interests</span>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInterest();
                  }
                }}
                placeholder="Add an interest or focus area..."
                className="flex-1 text-sm"
              />
              <Button size="sm" onClick={handleAddInterest} disabled={!newInterest.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {interestsList.map((interest, idx) => (
                <Badge key={idx} variant="secondary" className="gap-1 pr-1">
                  {interest}
                  <button
                    onClick={() => handleRemoveInterest(interest)}
                    className="ml-1 p-0.5 rounded-full hover:bg-destructive/20 hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {interestsList.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No interests added yet</p>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-1" />
                )}
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {hasInterests ? (
              allInterests.map((interest, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs sm:text-sm">
                  {interest}
                </Badge>
              ))
            ) : (
              isOwner && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full text-left p-4 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 transition-colors"
                >
                  <p className="text-muted-foreground italic text-sm">
                    🎯 Add interests to connect with like-minded community members.
                  </p>
                </button>
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileV2Interests;
