/**
 * DNA Admin — Sponsorship Management
 * CRUD for sponsors and their placements with logo upload, live preview, and status workflow.
 */

import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sponsorshipService, Sponsor, SponsorPlacement, SponsorWithPlacements } from '@/services/sponsorshipService';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Eye, MousePointer, ExternalLink, Upload, Award, Image as ImageIcon, ShieldAlert, ScrollText } from 'lucide-react';
import { slugify } from '@/utils/slugify';

/** Server-verified audit log write. Fails closed if not an admin. */
async function logSponsorLogoAction(
  action: 'upload' | 'update' | 'delete',
  payload: { storage_path?: string | null; logo_url?: string | null; sponsor_id?: string | null; metadata?: Record<string, unknown> } = {},
): Promise<void> {
  const { error } = await (supabase as any).rpc('log_sponsor_logo_action', {
    _action: action,
    _storage_path: payload.storage_path ?? null,
    _logo_url: payload.logo_url ?? null,
    _sponsor_id: payload.sponsor_id ?? null,
    _metadata: payload.metadata ?? {},
  });
  if (error) {
    // Non-fatal for the caller UI: surface via console so ops can detect log gaps.
    // The RPC itself will have already prevented non-admins from mutating anything upstream.
    // eslint-disable-next-line no-console
    console.error('[sponsor-logo-audit] log failed', error);
  }
}

const TIERS = ['gold', 'silver', 'bronze', 'community'] as const;

const PLACEMENT_ZONES = [
  { value: 'feed_sidebar', label: 'Feed Sidebar', description: 'Left column of the main feed' },
  { value: 'event_page', label: 'Event Page', description: 'Sidebar on event detail pages' },
  { value: 'convene_hub', label: 'Convene Hub', description: 'Events hub sidebar' },
  { value: 'connect_hub', label: 'Connect Hub', description: 'Connect hub sidebar' },
  { value: 'collaborate_hub', label: 'Collaborate Hub', description: 'Collaborate hub sidebar' },
  { value: 'contribute_hub', label: 'Contribute Hub', description: 'Contribute hub sidebar' },
  { value: 'convey_hub', label: 'Convey Hub', description: 'Convey hub sidebar' },
  { value: 'email_footer', label: 'Email Footer', description: 'Footer of notification emails' },
] as const;

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'bg-muted text-muted-foreground' },
  { value: 'active', label: 'Active', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'paused', label: 'Paused', color: 'bg-amber-100 text-amber-800' },
] as const;

const tierColors: Record<string, string> = {
  gold: 'bg-amber-100 text-amber-800',
  silver: 'bg-neutral-100 text-neutral-700',
  bronze: 'bg-orange-100 text-orange-800',
  community: 'bg-emerald-100 text-emerald-800',
};

export default function SponsorshipManagement() {
  const queryClient = useQueryClient();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [showSponsorDialog, setShowSponsorDialog] = useState(false);
  const [showPlacementDialog, setShowPlacementDialog] = useState(false);
  const [selectedSponsorId, setSelectedSponsorId] = useState<string | null>(null);

  const { data: sponsors = [], isLoading } = useQuery({
    queryKey: ['admin-sponsors'],
    queryFn: sponsorshipService.getAllSponsors,
    enabled: isAdmin,
  });

  const toggleSponsorActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      sponsorshipService.updateSponsor(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sponsors'] });
      toast.success('Sponsor updated');
    },
  });

  const deleteSponsor = useMutation({
    mutationFn: async (sponsor: Sponsor) => {
      await sponsorshipService.deleteSponsor(sponsor.id);
      await logSponsorLogoAction('delete', {
        sponsor_id: sponsor.id,
        logo_url: sponsor.logo_url,
        metadata: { reason: 'sponsor_deleted', sponsor_name: sponsor.name },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sponsors'] });
      toast.success('Sponsor deleted');
    },
  });


  const deletePlacement = useMutation({
    mutationFn: sponsorshipService.deletePlacement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sponsors'] });
      toast.success('Placement deleted');
    },
  });

  const updatePlacementStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      sponsorshipService.updatePlacement(id, { status } as Partial<SponsorPlacement>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sponsors'] });
      toast.success('Placement status updated');
    },
  });

  if (adminLoading) {
    return <div className="text-center py-12 text-muted-foreground">Verifying access...</div>;
  }

  if (!isAdmin) {
    return (
      <Card className="p-12 text-center space-y-2">
        <ShieldAlert className="h-8 w-8 mx-auto text-destructive" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-foreground">Admins only</h2>
        <p className="text-sm text-muted-foreground">
          Sponsor logo uploads, edits, and deletions are restricted to platform admins.
        </p>
      </Card>
    );
  }

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading sponsors...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sponsorship Portal</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage sponsors, upload logos, preview cards, and control placements</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/sponsorships/logo-audit">
              <ScrollText className="h-4 w-4 mr-2" aria-hidden="true" />
              Logo audit log
            </Link>
          </Button>
        <Dialog open={showSponsorDialog} onOpenChange={setShowSponsorDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingSponsor(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Sponsor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingSponsor ? 'Edit Sponsor' : 'Add Sponsor'}</DialogTitle>
            </DialogHeader>
            <SponsorForm
              sponsor={editingSponsor}
              onSave={() => {
                setShowSponsorDialog(false);
                queryClient.invalidateQueries({ queryKey: ['admin-sponsors'] });
              }}
            />
          </DialogContent>
        </Dialog>
        </div>
      </div>


      {sponsors.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          No sponsors yet. Add your first sponsor to get started.
        </Card>
      ) : (
        <div className="space-y-4">
          {sponsors.map((sponsor) => (
            <Card key={sponsor.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {sponsor.logo_url ? (
                    <img src={sponsor.logo_url} alt={`${sponsor.name} logo`} className="w-10 h-10 rounded-lg object-contain bg-white border border-border/50 p-0.5" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">{sponsor.name}</h3>
                      <Badge className={tierColors[sponsor.tier] || ''}>{sponsor.tier}</Badge>
                      {!sponsor.is_active && <Badge variant="outline" className="text-destructive border-destructive/30">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{sponsor.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={sponsor.is_active}
                    onCheckedChange={(checked) => toggleSponsorActive.mutate({ id: sponsor.id, is_active: checked })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingSponsor(sponsor);
                      setShowSponsorDialog(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Delete this sponsor and all its placements?')) {
                        deleteSponsor.mutate(sponsor);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {/* Placements */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Placements</span>
                  <Dialog open={showPlacementDialog && selectedSponsorId === sponsor.id} onOpenChange={(open) => {
                    setShowPlacementDialog(open);
                    if (open) setSelectedSponsorId(sponsor.id);
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-3 w-3 mr-1" />
                        Add Placement
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add Placement for {sponsor.name}</DialogTitle>
                      </DialogHeader>
                      <PlacementForm
                        sponsorId={sponsor.id}
                        sponsor={sponsor}
                        onSave={() => {
                          setShowPlacementDialog(false);
                          queryClient.invalidateQueries({ queryKey: ['admin-sponsors'] });
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>

                {(sponsor.sponsor_placements || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No placements configured</p>
                ) : (
                  <div className="divide-y divide-border rounded-lg border">
                    {(sponsor.sponsor_placements || []).map((pl: SponsorPlacement) => {
                      const statusInfo = STATUS_OPTIONS.find(s => s.value === (pl as any).status) || STATUS_OPTIONS[0];
                      return (
                        <div key={pl.id} className="flex items-center justify-between px-3 py-2 text-sm">
                          <div className="flex items-center gap-3 min-w-0">
                            <Badge variant="outline" className="text-xs shrink-0">
                              {PLACEMENT_ZONES.find(z => z.value === pl.placement)?.label || pl.placement}
                            </Badge>
                            <Badge className={`text-[10px] ${statusInfo.color}`}>{statusInfo.label}</Badge>
                            <span className="truncate text-muted-foreground">{pl.headline || '—'}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground" title="Impressions">
                              <Eye className="h-3 w-3" />{pl.impression_count}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground" title="Clicks">
                              <MousePointer className="h-3 w-3" />{pl.click_count}
                            </span>
                            <Select
                              value={(pl as any).status || 'draft'}
                              onValueChange={(v) => updatePlacementStatus.mutate({ id: pl.id, status: v })}
                            >
                              <SelectTrigger className="h-7 w-24 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map(s => (
                                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                              if (confirm('Delete this placement?')) deletePlacement.mutate(pl.id);
                            }}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Logo Upload Helper ────────────────────────────────────────────────────────

async function uploadSponsorLogo(file: File): Promise<string> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) ? ext : 'png';
  const filePath = `logos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

  const { error } = await supabase.storage.from('sponsor-logos').upload(filePath, file, {
    cacheControl: '31536000',
    upsert: true,
    contentType: file.type || undefined,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('sponsor-logos').getPublicUrl(filePath);
  return data.publicUrl;
}

// ─── Live Card Preview ─────────────────────────────────────────────────────────

function SponsorCardPreview({ name, logoUrl, description, tier, headline, ctaLabel }: {
  name: string;
  logoUrl: string;
  description: string;
  tier: string;
  headline?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="w-full max-w-[280px]">
      <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">Live Preview</p>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#C4942A] to-[#D4A84B]" />
        <div className="p-3.5">
          <div className="flex items-start justify-between mb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="w-9 h-9 rounded-lg object-contain bg-white border border-border/50 p-0.5 shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate leading-tight">
                  {name || 'Sponsor Name'}
                </p>
                {tier === 'gold' && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Award className="h-3 w-3 text-[#C4942A]" />
                    <span className="text-[10px] font-medium text-[#C4942A]">Gold Partner</span>
                  </div>
                )}
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground/60 shrink-0 mt-0.5">Sponsored</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            {headline || description || 'Sponsor description will appear here...'}
          </p>
          <div className="w-full flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-lg bg-[#C4942A]/10 text-[#C4942A]">
            {ctaLabel || 'Learn More'}
            <ExternalLink className="h-3 w-3" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sponsor Form ──────────────────────────────────────────────────────────────

function SponsorForm({ sponsor, onSave }: { sponsor: Sponsor | null; onSave: () => void }) {
  const [form, setForm] = useState({
    name: sponsor?.name || '',
    slug: sponsor?.slug || '',
    logo_url: sponsor?.logo_url || '',
    description: sponsor?.description || '',
    website_url: sponsor?.website_url || '',
    tier: sponsor?.tier || 'community',
    contact_name: sponsor?.contact_name || '',
    contact_email: sponsor?.contact_email || '',
  });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleNameChange = (name: string) => {
    setForm(prev => ({
      ...prev,
      name,
      slug: prev.slug === slugify(prev.name) || !prev.slug ? slugify(name) : prev.slug,
    }));
  };

  const handleLogoUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be under 5MB');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadSponsorLogo(file);
      setForm(prev => ({ ...prev, logo_url: url }));
      toast.success('Logo uploaded');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: () =>
      sponsor
        ? sponsorshipService.updateSponsor(sponsor.id, form)
        : sponsorshipService.createSponsor(form),
    onSuccess: () => {
      toast.success(sponsor ? 'Sponsor updated' : 'Sponsor created');
      onSave();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  return (
    <div className="flex gap-6">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-3 flex-1 min-w-0">
        <div>
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => handleNameChange(e.target.value)} required />
        </div>
        <div>
          <Label>Slug</Label>
          <Input value={form.slug} onChange={(e) => update('slug', e.target.value)} required placeholder="auto-generated" />
        </div>

        {/* Logo Upload */}
        <div>
          <Label>Logo</Label>
          <div className="flex items-center gap-3 mt-1">
            {form.logo_url ? (
              <img src={form.logo_url} alt="Logo preview" className="w-12 h-12 rounded-lg object-contain bg-white border border-border/50 p-0.5" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-dashed border-border">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 space-y-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-3 w-3 mr-1" />
                {uploading ? 'Uploading...' : 'Upload Logo'}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                }}
              />
              <p className="text-[10px] text-muted-foreground">or paste URL below</p>
            </div>
          </div>
          <Input
            value={form.logo_url}
            onChange={(e) => update('logo_url', e.target.value)}
            placeholder="https://... (or upload above)"
            className="mt-1.5"
          />
        </div>

        <div><Label>Description</Label><Input value={form.description} onChange={(e) => update('description', e.target.value)} /></div>
        <div><Label>Website</Label><Input value={form.website_url} onChange={(e) => update('website_url', e.target.value)} /></div>
        <div>
          <Label>Tier</Label>
          <Select value={form.tier} onValueChange={(v) => update('tier', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIERS.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label>Contact Name</Label><Input value={form.contact_name} onChange={(e) => update('contact_name', e.target.value)} /></div>
        <div><Label>Contact Email</Label><Input value={form.contact_email} onChange={(e) => update('contact_email', e.target.value)} /></div>
        <Button type="submit" className="w-full" disabled={mutation.isPending || uploading}>
          {mutation.isPending ? 'Saving...' : sponsor ? 'Update Sponsor' : 'Create Sponsor'}
        </Button>
      </form>

      {/* Live Preview */}
      <div className="hidden md:block pt-6">
        <SponsorCardPreview
          name={form.name}
          logoUrl={form.logo_url}
          description={form.description}
          tier={form.tier}
        />
      </div>
    </div>
  );
}

// ─── Placement Form ────────────────────────────────────────────────────────────

function PlacementForm({ sponsorId, sponsor, onSave }: { sponsorId: string; sponsor: Sponsor; onSave: () => void }) {
  const [form, setForm] = useState({
    placement: 'feed_sidebar',
    headline: '',
    cta_label: 'Learn More',
    cta_url: '',
    priority: 10,
    status: 'draft',
    starts_at: '',
    ends_at: '',
  });

  const mutation = useMutation({
    mutationFn: () =>
      sponsorshipService.createPlacement({
        ...form,
        sponsor_id: sponsorId,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      } as Partial<SponsorPlacement>),
    onSuccess: () => {
      toast.success('Placement created');
      onSave();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const update = (key: string, value: string | number) => setForm((p) => ({ ...p, [key]: value }));

  return (
    <div className="flex gap-6">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-3 flex-1 min-w-0">
        {/* Visual Placement Picker */}
        <div>
          <Label>Placement Zone</Label>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            {PLACEMENT_ZONES.map((zone) => (
              <button
                key={zone.value}
                type="button"
                onClick={() => update('placement', zone.value)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  form.placement === zone.value
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border hover:border-primary/40 hover:bg-muted/50'
                }`}
              >
                <p className="text-xs font-medium text-foreground">{zone.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{zone.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div><Label>Headline</Label><Input value={form.headline} onChange={(e) => update('headline', e.target.value)} placeholder="Optional override for description" /></div>
        <div><Label>CTA Label</Label><Input value={form.cta_label} onChange={(e) => update('cta_label', e.target.value)} /></div>
        <div><Label>CTA URL</Label><Input value={form.cta_url} onChange={(e) => update('cta_url', e.target.value)} placeholder="https://..." /></div>
        <div><Label>Priority (lower = higher)</Label><Input type="number" value={form.priority} onChange={(e) => update('priority', parseInt(e.target.value) || 10)} /></div>

        {/* Status selector */}
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => update('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground mt-1">
            {form.status === 'draft' && 'Draft placements are not visible to users. Publish when ready.'}
            {form.status === 'active' && 'Active placements are visible on the live site immediately.'}
            {form.status === 'paused' && 'Paused placements are temporarily hidden from the site.'}
          </p>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Starts</Label>
            <Input type="datetime-local" value={form.starts_at} onChange={(e) => update('starts_at', e.target.value)} />
          </div>
          <div>
            <Label>Ends</Label>
            <Input type="datetime-local" value={form.ends_at} onChange={(e) => update('ends_at', e.target.value)} />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating...' : form.status === 'active' ? 'Create & Publish' : 'Save as Draft'}
        </Button>
      </form>

      {/* Live Preview */}
      <div className="hidden md:block pt-6">
        <SponsorCardPreview
          name={sponsor.name}
          logoUrl={sponsor.logo_url || ''}
          description={sponsor.description || ''}
          tier={sponsor.tier}
          headline={form.headline}
          ctaLabel={form.cta_label}
        />
      </div>
    </div>
  );
}
