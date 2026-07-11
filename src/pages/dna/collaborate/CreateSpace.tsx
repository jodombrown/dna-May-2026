import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SpacesShell } from '@/components/collaborate/SpacesShell';
import { createSpace, type SpaceType } from '@/services/spacesService';
import type { SpaceVisibility } from '@/types/collaborate';

const SPACE_TYPES: { value: string; label: string }[] = [
  { value: 'project', label: 'Project' },
  { value: 'working_group', label: 'Working group' },
  { value: 'initiative', label: 'Initiative' },
  { value: 'program', label: 'Program' },
];

const VISIBILITIES: { value: SpaceVisibility; label: string; hint: string }[] = [
  { value: 'community', label: 'Community', hint: 'Members of the community can find and request to join.' },
  { value: 'public', label: 'Public', hint: 'Anyone can find this space and join instantly.' },
  { value: 'private', label: 'Private', hint: 'Invite-only. Hidden from everyone but members.' },
];

export default function CreateSpace() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [spaceType, setSpaceType] = useState('');
  const [visibility, setVisibility] = useState<SpaceVisibility>('community');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim().length > 0 && spaceType.length > 0 && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to create a space.');
      return;
    }
    if (!name.trim() || !spaceType) return;

    setSubmitting(true);
    try {
      // One code path for Space creation, shared with the Universal Composer
      // (spacesService). The INSERT trigger seats the creator as lead.
      const created = await createSpace({
        name: name.trim(),
        createdBy: user.id,
        spaceType: spaceType as SpaceType,
        visibility,
        tagline: tagline.trim() || null,
        description: description.trim() || null,
      });

      toast.success('Space created.');
      navigate(`/dna/collaborate/spaces/${created.slug}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create the space.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SpacesShell maxWidthClassName="max-w-2xl">
      <Link
        to="/dna/collaborate/spaces"
        className="mb-4 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
        Back to Spaces
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-foreground">Create a Space</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Spaces are where people gather to build something together. Give yours a name and a
        purpose to get started.
      </p>

      <Card className="mt-6 p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="space-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="space-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lagos Climate Fund"
              maxLength={120}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="space-tagline">Tagline</Label>
            <Input
              id="space-tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="One line on what this space is about"
              maxLength={160}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="space-type">
              Type <span className="text-destructive">*</span>
            </Label>
            <Select value={spaceType} onValueChange={setSpaceType}>
              <SelectTrigger id="space-type">
                <SelectValue placeholder="Choose a type" />
              </SelectTrigger>
              <SelectContent>
                {SPACE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="space-visibility">Visibility</Label>
            <Select
              value={visibility}
              onValueChange={(v) => setVisibility(v as SpaceVisibility)}
            >
              <SelectTrigger id="space-visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITIES.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {VISIBILITIES.find((v) => v.value === visibility)?.hint}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="space-description">Description</Label>
            <Textarea
              id="space-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you building, and who's it for?"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" asChild>
              <Link to="/dna/collaborate/spaces">Cancel</Link>
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {submitting ? 'Creating…' : 'Create Space'}
            </Button>
          </div>
        </form>
      </Card>
    </SpacesShell>
  );
}
