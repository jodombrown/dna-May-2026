import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import CountryCombobox from '@/components/ui/CountryCombobox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/errorLogger';

export function CompleteFieldsModal({ missing, onClose }: { missing: string[]; onClose: () => void; }) {
  const { toast } = useToast();
  const [headline, setHeadline] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [countryName, setCountryName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [interestsText, setInterestsText] = useState('');
  const [organization, setOrganization] = useState('');
  const [saving, setSaving] = useState(false);

  const needs = useMemo(() => new Set(missing || []), [missing]);

  const onSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('Not authenticated');

      const updates: Record<string, any> = {};
      if (needs.has('headline')) updates.headline = headline || null;
      if (needs.has('current_city')) updates.current_city = currentCity || null;
      if (needs.has('current_country_code')) {
        updates.current_country_code = countryCode || null;
        updates.current_country_name = countryName || null;
        updates.current_country = countryName || null;
      }
      if (needs.has('avatar_url')) updates.avatar_url = avatarUrl || null;
      if (needs.has('website_url')) updates.website_url = websiteUrl || null;
      if (needs.has('skills')) updates.skills = skillsText ? skillsText.split(',').map(s => s.trim()).filter(Boolean) : [];
      if (needs.has('interests')) updates.interests = interestsText ? interestsText.split(',').map(s => s.trim()).filter(Boolean) : [];
      if (needs.has('organization')) updates.organization = organization || null;

      if (Object.keys(updates).length === 0) {
        onClose();
        return;
      }

      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (error) throw error;

      toast({ title: 'Profile updated', description: 'You can continue your action now.' });
      onClose();
    } catch (e: unknown) {
      toast({ title: 'Update failed', description: getErrorMessage(e) || 'Please try again', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 w-full max-w-lg space-y-5">
        <h3 className="text-lg font-semibold">Complete a few details to continue</h3>
        <div className="space-y-4">
          {needs.has('headline') && (
            <div>
              <Label htmlFor="headline">Professional Headline</Label>
              <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="What do you do?" />
            </div>
          )}
          {needs.has('current_city') && (
            <div>
              <Label htmlFor="current_city">Current City</Label>
              <Input id="current_city" value={currentCity} onChange={(e) => setCurrentCity(e.target.value)} placeholder="City" />
            </div>
          )}
          {needs.has('current_country_code') && (
            <div>
              <Label>Current Country</Label>
              <CountryCombobox
                value={countryCode}
                onChange={(code, name) => { setCountryCode(code); setCountryName(name); }}
                placeholder="Select your current country"
              />
            </div>
          )}
          {needs.has('avatar_url') && (
            <div>
              <Label htmlFor="avatar_url">Profile Photo URL</Label>
              <Input id="avatar_url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
            </div>
          )}
          {needs.has('website_url') && (
            <div>
              <Label htmlFor="website_url">Website</Label>
              <Input id="website_url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://your-site.com" />
            </div>
          )}
          {needs.has('skills') && (
            <div>
              <Label htmlFor="skills">Key Skills (comma-separated)</Label>
              <Input id="skills" value={skillsText} onChange={(e) => setSkillsText(e.target.value)} placeholder="e.g. Product, Fundraising, Policy" />
            </div>
          )}
          {needs.has('interests') && (
            <div>
              <Label htmlFor="interests">Interests (comma-separated)</Label>
              <Input id="interests" value={interestsText} onChange={(e) => setInterestsText(e.target.value)} placeholder="e.g. Climate, Fintech, Education" />
            </div>
          )}
          {needs.has('organization') && (
            <div>
              <Label htmlFor="organization">Organization</Label>
              <Input id="organization" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Your company or org" />
            </div>
          )}
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save & Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
