import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { Loader2, Layout, Eye, RotateCcw, Compass } from 'lucide-react';
import { getErrorMessage } from '@/lib/errorLogger';
import { useFirstRunTour } from '@/hooks/useFirstRunTour';


interface DisplayPreferences {
  display_density: 'comfortable' | 'compact';
  show_connect_module: boolean;
  show_convene_module: boolean;
  show_collaborate_module: boolean;
  show_contribute_module: boolean;
  show_convey_module: boolean;
}

const DEFAULT_PREFERENCES: DisplayPreferences = {
  display_density: 'comfortable',
  show_connect_module: true,
  show_convene_module: true,
  show_collaborate_module: true,
  show_contribute_module: true,
  show_convey_module: true,
};

export default function PreferencesSettings() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tour = useFirstRunTour();


  const [preferences, setPreferences] = useState<DisplayPreferences>(DEFAULT_PREFERENCES);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile && (profile as any).display_preferences) {
      const stored = (profile as any).display_preferences as any;
      setPreferences({
        display_density: stored.display_density || 'comfortable',
        show_connect_module: stored.show_connect_module ?? true,
        show_convene_module: stored.show_convene_module ?? true,
        show_collaborate_module: stored.show_collaborate_module ?? true,
        show_contribute_module: stored.show_contribute_module ?? true,
        show_convey_module: stored.show_convey_module ?? true,
      });
    }
  }, [profile]);

  const savePreferences = async (newPrefs: DisplayPreferences) => {
    setSaving(true);
    setPreferences(newPrefs);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_preferences: newPrefs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast({ title: 'Preferences saved' });
    } catch (error: unknown) {
      toast({
        title: 'Error saving preferences',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = (field: keyof DisplayPreferences, value: any) => {
    const newPrefs = { ...preferences, [field]: value };
    savePreferences(newPrefs);
  };

  const handleReset = () => {
    savePreferences(DEFAULT_PREFERENCES);
  };

  if (isLoading) {
    return (
      <SettingsLayout title="Preferences" description="Customize your DNA experience">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout
      title="Preferences"
      description="Customize your DNA experience"
    >
      <div className="space-y-6">
        {/* Display Density */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              Display Density
            </CardTitle>
            <CardDescription>
              Choose how much content to show on screen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={preferences.display_density}
              onValueChange={(value: 'comfortable' | 'compact') => handleUpdate('display_density', value)}
            >
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comfortable">
                  <div>
                    <div className="font-medium">Comfortable</div>
                    <div className="text-xs text-muted-foreground">More spacing, easier to read</div>
                  </div>
                </SelectItem>
                <SelectItem value="compact">
                  <div>
                    <div className="font-medium">Compact</div>
                    <div className="text-xs text-muted-foreground">Less spacing, more content</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Module Visibility */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Module Visibility
            </CardTitle>
            <CardDescription>
              Choose which pillars of DNA to show in your navigation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show_connect" className="text-base font-medium">
                  Connect
                </Label>
                <p className="text-sm text-muted-foreground">
                  Discover and network with diaspora members
                </p>
              </div>
              <Switch
                id="show_connect"
                checked={preferences.show_connect_module}
                onCheckedChange={(checked) => handleUpdate('show_connect_module', checked)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show_convene" className="text-base font-medium">
                  Convene
                </Label>
                <p className="text-sm text-muted-foreground">
                  Events, meetups, and community gatherings
                </p>
              </div>
              <Switch
                id="show_convene"
                checked={preferences.show_convene_module}
                onCheckedChange={(checked) => handleUpdate('show_convene_module', checked)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show_collaborate" className="text-base font-medium">
                  Collaborate
                </Label>
                <p className="text-sm text-muted-foreground">
                  Project spaces and teamwork
                </p>
              </div>
              <Switch
                id="show_collaborate"
                checked={preferences.show_collaborate_module}
                onCheckedChange={(checked) => handleUpdate('show_collaborate_module', checked)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show_contribute" className="text-base font-medium">
                  Contribute
                </Label>
                <p className="text-sm text-muted-foreground">
                  Opportunities to give back
                </p>
              </div>
              <Switch
                id="show_contribute"
                checked={preferences.show_contribute_module}
                onCheckedChange={(checked) => handleUpdate('show_contribute_module', checked)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show_convey" className="text-base font-medium">
                  Convey
                </Label>
                <p className="text-sm text-muted-foreground">
                  Stories and content from the community
                </p>
              </div>
              <Switch
                id="show_convey"
                checked={preferences.show_convey_module}
                onCheckedChange={(checked) => handleUpdate('show_convey_module', checked)}
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>

        {/* First-run tour */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Compass className="h-5 w-5" />
              First-run tour
            </CardTitle>
            <CardDescription>
              Restart the guided "first five moves" walkthrough. Steps you've
              already completed on your profile will remain checked.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              disabled={tour.resetPending}
              onClick={() => {
                tour.resetTour();
                toast({
                  title: 'Tour restarted',
                  description: 'Head to your feed to see the first-run tour again.',
                });
              }}
            >
              {tour.resetPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Restart tour
            </Button>
          </CardContent>
        </Card>

        {/* Reset */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Reset to Defaults
            </CardTitle>
            <CardDescription>
              Restore all preferences to their default values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reset All Preferences
            </Button>
          </CardContent>
        </Card>

      </div>
    </SettingsLayout>
  );
}
