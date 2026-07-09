import { useState } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateGroupInput, GroupPrivacy, GroupJoinPolicy } from '@/types/groups';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CreateGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onSuccess?: (slug: string) => void;
}

export function CreateGroupDialog({
  isOpen,
  onClose,
  currentUserId,
  onSuccess,
}: CreateGroupDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<CreateGroupInput>({
    name: '',
    slug: '',
    description: '',
    privacy: 'public',
    join_policy: 'open',
    category: '',
    location: '',
    tags: [],
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a group name',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.slug.trim()) {
      toast({
        title: 'Invalid name',
        description: 'Group name must contain at least one letter or number',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if slug already exists
      const { data: existing } = await supabase
        .from('groups')
        .select('id')
        .eq('slug', formData.slug)
        .single();

      if (existing) {
        toast({
          title: 'Name taken',
          description: 'A group with this name already exists',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      const { data, error } = await supabase
        .from('groups')
        .insert({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          privacy: formData.privacy,
          join_policy: formData.join_policy,
          category: formData.category || null,
          location: formData.location || null,
          tags: formData.tags.length > 0 ? formData.tags : null,
          created_by: currentUserId,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Group created!',
        description: 'Your community is now live',
      });

      onSuccess?.(data.slug);
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        slug: '',
        description: '',
        privacy: 'public',
        join_policy: 'open',
        category: '',
        location: '',
        tags: [],
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create group',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveModal open={isOpen} onOpenChange={onClose} className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>Create a Group</ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Build a community around shared interests, location, or identity
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Nigerian Tech Founders"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              maxLength={100}
            />
            {formData.slug && (
              <p className="text-xs text-muted-foreground">
                URL: /groups/{formData.slug}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What is this group about?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="privacy">Privacy</Label>
              <Select
                value={formData.privacy}
                onValueChange={(value) => setFormData({ ...formData, privacy: value as GroupPrivacy })}
              >
                <SelectTrigger id="privacy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div>
                      <p className="font-medium">Public</p>
                      <p className="text-xs text-muted-foreground">Anyone can find and view</p>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div>
                      <p className="font-medium">Private</p>
                      <p className="text-xs text-muted-foreground">Only members can view</p>
                    </div>
                  </SelectItem>
                  <SelectItem value="secret">
                    <div>
                      <p className="font-medium">Secret</p>
                      <p className="text-xs text-muted-foreground">Hidden from search</p>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="join-policy">Join Policy</Label>
              <Select
                value={formData.join_policy}
                onValueChange={(value) => setFormData({ ...formData, join_policy: value as GroupJoinPolicy })}
              >
                <SelectTrigger id="join-policy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">
                    <div>
                      <p className="font-medium">Open</p>
                      <p className="text-xs text-muted-foreground">Anyone can join</p>
                    </div>
                  </SelectItem>
                  <SelectItem value="approval_required">
                    <div>
                      <p className="font-medium">Approval</p>
                      <p className="text-xs text-muted-foreground">Admin approval needed</p>
                    </div>
                  </SelectItem>
                  <SelectItem value="invite_only">
                    <div>
                      <p className="font-medium">Invite Only</p>
                      <p className="text-xs text-muted-foreground">Members must invite</p>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category (Optional)</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="culture">Culture & Arts</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="health">Health & Wellness</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="regional">Regional</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              placeholder="e.g., Lagos, Nigeria"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
        </div>

        <ResponsiveModalFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[hsl(151,75%,50%)] hover:bg-[hsl(151,75%,40%)] text-white"
          >
            {isSubmitting ? 'Creating...' : 'Create Group'}
          </Button>
        </ResponsiveModalFooter>
      </ResponsiveModal>
  );
}
