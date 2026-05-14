import React from 'react';
import { useTheme } from 'next-themes';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, Users, LayoutGrid, Handshake, Megaphone, Heart, MessageSquare, Share2, Bookmark, Check, X } from 'lucide-react';
import dnaLogo from '@/assets/dna-logo.webp';
import { MateMasie } from '@/components/icons/adinkra';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-4">
    <h2 className="font-heritage text-xl font-semibold text-foreground border-b border-border pb-2">{title}</h2>
    {children}
  </section>
);

const ColorSwatch = ({ name, className }: { name: string; className: string }) => (
  <div className="flex flex-col items-center gap-1">
    <div className={`w-12 h-12 rounded-dna-md border border-border ${className}`} />
    <span className="text-[11px] font-ui text-muted-foreground text-center">{name}</span>
  </div>
);

const MODULE_COLORS = [
  { name: 'Connect', bg: 'bg-dna-connect', light: 'bg-dna-connect-light' },
  { name: 'Convene', bg: 'bg-dna-convene', light: 'bg-dna-convene-light' },
  { name: 'Collaborate', bg: 'bg-dna-collaborate', light: 'bg-dna-collaborate-light' },
  { name: 'Contribute', bg: 'bg-dna-contribute', light: 'bg-dna-contribute-light' },
  { name: 'Convey', bg: 'bg-dna-convey', light: 'bg-dna-convey-light' },
];

export default function DesignSystem() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-dna-1">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-heritage text-2xl font-bold text-foreground">DNA Design System</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-ui">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-12">

        {/* ── BRAND & LOGO ── */}
        <Section title="Brand & Logo">
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Primary Logo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-dna-lg p-8 flex flex-col items-center gap-4">
                  <img src={dnaLogo} alt="DNA Logo on light" className="h-12 w-auto" />
                  <span className="text-xs text-muted-foreground font-ui">On light background</span>
                </div>
                <div className="bg-[hsl(30,10%,12%)] rounded-dna-lg p-8 flex flex-col items-center gap-4">
                  <img src={dnaLogo} alt="DNA Logo on dark" className="h-12 w-auto brightness-110" />
                  <span className="text-xs text-[hsl(30,10%,60%)] font-ui">On dark background</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Clear Space & Minimum Size</h3>
              <div className="bg-card border border-border rounded-dna-lg p-6">
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="relative border-2 border-dashed border-dna-emerald/30 p-6 rounded-dna-md">
                    <img src={dnaLogo} alt="DNA Logo with clear space" className="h-8 w-auto" />
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-ui text-dna-emerald whitespace-nowrap">Clear space = logo height ÷ 2</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <img src={dnaLogo} alt="Minimum logo size" className="h-6 w-auto" />
                      <span className="text-xs text-muted-foreground font-ui">Minimum: 24px height (digital)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <img src={dnaLogo} alt="Preferred logo size" className="h-8 w-auto" />
                      <span className="text-xs text-muted-foreground font-ui">Preferred: 32px height (header)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Usage Guidelines</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { do: true, text: 'Use the logo on clean, uncluttered backgrounds' },
                  { do: true, text: 'Maintain the original aspect ratio at all sizes' },
                  { do: true, text: 'Use approved brand colors for monochrome variants' },
                  { do: true, text: 'Pair logo with "Diaspora Network of Africa" when space allows' },
                  { do: false, text: 'Stretch, skew, or rotate the logo' },
                  { do: false, text: 'Place on busy patterns or photos without overlay' },
                  { do: false, text: 'Change the logo colors outside brand palette' },
                  { do: false, text: 'Add effects like drop shadows, glows, or outlines' },
                ].map((rule, i) => (
                  <div key={i} className={`flex items-start gap-2 p-3 rounded-dna-md border ${rule.do ? 'border-dna-success/30 bg-dna-emerald-subtle/50' : 'border-destructive/30 bg-dna-error-light/50'}`}>
                    {rule.do ? <Check className="w-4 h-4 text-dna-success mt-0.5 shrink-0" /> : <X className="w-4 h-4 text-destructive mt-0.5 shrink-0" />}
                    <span className="text-sm font-ui text-foreground">{rule.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── BRAND VOICE & IDENTITY ── */}
        <Section title="Brand Voice & Identity">
          <div className="space-y-6">
            <Card className="p-6 shadow-dna-1 space-y-4">
              <div>
                <span className="text-[11px] font-ui text-muted-foreground uppercase tracking-widest">Platform Name</span>
                <p className="font-heritage text-2xl font-bold text-foreground">DNA - Diaspora Network of Africa</p>
              </div>
              <div>
                <span className="text-[11px] font-ui text-muted-foreground uppercase tracking-widest">Tagline</span>
                <p className="font-heritage text-lg font-semibold text-primary italic">The Operating System for the Global African Diaspora</p>
              </div>
              <div>
                <span className="text-[11px] font-ui text-muted-foreground uppercase tracking-widest">Mission</span>
                <p className="text-[15px] font-ui text-foreground leading-relaxed">
                  Transform scattered diaspora potential into coordinated collective power through community-owned infrastructure, connecting 200M+ members worldwide with the African continent.
                </p>
              </div>
            </Card>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Brand Voice</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { trait: 'Warm', desc: 'Welcoming, community-first tone. Never cold or corporate.' },
                  { trait: 'Rooted', desc: 'Culturally authentic. Heritage is foundation, not decoration.' },
                  { trait: 'Empowering', desc: 'Action-oriented, enabling collective progress.' },
                  { trait: 'Modern', desc: 'Forward-looking, tech-savvy, Pan-African futurism.' },
                ].map(v => (
                  <Card key={v.trait} className="p-4 shadow-dna-1">
                    <h4 className="font-heritage text-lg font-semibold text-primary mb-2">{v.trait}</h4>
                    <p className="text-sm text-muted-foreground font-ui">{v.desc}</p>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Tone Guidelines</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { do: true, text: '"Welcome home" - language of belonging and return' },
                  { do: true, text: '"Build together" - collective action over individual achievement' },
                  { do: true, text: '"Your roots, your future" - heritage connected to forward motion' },
                  { do: false, text: '"Help Africa" - patronizing savior language' },
                  { do: false, text: '"Exotic" or "tribal" - reductive colonial framing' },
                  { do: false, text: 'Generic corporate jargon - "synergize," "leverage," etc.' },
                ].map((rule, i) => (
                  <div key={i} className={`flex items-start gap-2 p-3 rounded-dna-md border ${rule.do ? 'border-dna-success/30 bg-dna-emerald-subtle/50' : 'border-destructive/30 bg-dna-error-light/50'}`}>
                    {rule.do ? <Check className="w-4 h-4 text-dna-success mt-0.5 shrink-0" /> : <X className="w-4 h-4 text-destructive mt-0.5 shrink-0" />}
                    <span className="text-sm font-ui text-foreground">{rule.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <Card className="p-6 shadow-dna-1 border-l-[3px] border-l-dna-contribute bg-dna-cream/50">
              <p className="font-heritage text-lg font-semibold text-foreground italic mb-2">
                "Cultural authenticity is not decoration. It is foundation."
              </p>
              <p className="text-sm text-muted-foreground font-ui">
                Every design decision asks: "Does this honor the diaspora experience?" African heritage patterns, colors, and interaction metaphors are the framework, not a skin applied over Western conventions.
              </p>
            </Card>
          </div>
        </Section>

        {/* ── COLORS ── */}
        <Section title="1. Color Tokens">
          <div className="space-y-6">
            {/* Foundations */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Foundations</h3>
              <div className="flex flex-wrap gap-3">
                <ColorSwatch name="Background" className="bg-background" />
                <ColorSwatch name="Card" className="bg-card" />
                <ColorSwatch name="Primary" className="bg-primary" />
                <ColorSwatch name="Secondary" className="bg-secondary" />
                <ColorSwatch name="Muted" className="bg-muted" />
                <ColorSwatch name="Accent" className="bg-accent" />
                <ColorSwatch name="Destructive" className="bg-destructive" />
                <ColorSwatch name="Border" className="bg-border" />
              </div>
            </div>

            {/* Five C's */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Five C's Module Colors</h3>
              <div className="flex flex-wrap gap-4">
                {MODULE_COLORS.map(m => (
                  <div key={m.name} className="flex flex-col items-center gap-1">
                    <div className="flex gap-1">
                      <div className={`w-10 h-10 rounded-dna-sm ${m.bg}`} />
                      <div className={`w-10 h-10 rounded-dna-sm ${m.light}`} />
                    </div>
                    <span className="text-[11px] font-ui text-muted-foreground">{m.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* DNA Brand */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Brand & Semantic</h3>
              <div className="flex flex-wrap gap-3">
                <ColorSwatch name="Emerald" className="bg-dna-emerald" />
                <ColorSwatch name="Emerald Light" className="bg-dna-emerald-light" />
                <ColorSwatch name="Emerald Subtle" className="bg-dna-emerald-subtle" />
                <ColorSwatch name="DIA Gold" className="bg-dna-dia" />
                <ColorSwatch name="Cream" className="bg-dna-cream" />
                <ColorSwatch name="Sand" className="bg-dna-sand" />
                <ColorSwatch name="Stone" className="bg-dna-stone" />
                <ColorSwatch name="Success" className="bg-dna-success" />
                <ColorSwatch name="Warning" className="bg-dna-warning" />
                <ColorSwatch name="Error" className="bg-dna-error" />
                <ColorSwatch name="Info" className="bg-dna-info" />
              </div>
            </div>
          </div>
        </Section>

        {/* ── TYPOGRAPHY ── */}
        <Section title="2. Typography">
          <div className="space-y-4 bg-card p-6 rounded-dna-lg border border-border">
            <div>
              <span className="text-[11px] font-ui text-muted-foreground uppercase tracking-wider">Display — Lora 32/40px</span>
              <p className="font-heritage text-[32px] md:text-[40px] font-bold leading-tight tracking-tight text-foreground">
                The Diaspora Awakens
              </p>
            </div>
            <div>
              <span className="text-[11px] font-ui text-muted-foreground uppercase tracking-wider">H1 — Lora 24/28px</span>
              <h1 className="font-heritage text-2xl md:text-[28px] font-bold leading-snug text-foreground">
                Connect with your roots
              </h1>
            </div>
            <div>
              <span className="text-[11px] font-ui text-muted-foreground uppercase tracking-wider">H2 — Lora 20/22px</span>
              <h2 className="font-heritage text-xl md:text-[22px] font-semibold leading-snug text-foreground">
                Upcoming diaspora events
              </h2>
            </div>
            <div>
              <span className="text-[11px] font-ui text-muted-foreground uppercase tracking-wider">H3 — Inter 17/18px</span>
              <h3 className="font-ui text-[17px] md:text-lg font-semibold text-foreground">
                Lagos Tech Connect Meetup
              </h3>
            </div>
            <div>
              <span className="text-[11px] font-ui text-muted-foreground uppercase tracking-wider">Body Large — Inter 16/17px</span>
              <p className="font-ui text-base md:text-[17px] leading-relaxed text-foreground">
                DNA is the operating system for mobilizing the Global African Diaspora toward Africa's economic transformation.
              </p>
            </div>
            <div>
              <span className="text-[11px] font-ui text-muted-foreground uppercase tracking-wider">Body — Inter 15px</span>
              <p className="font-ui text-[15px] leading-normal text-foreground">
                Join 200M+ diaspora members worldwide in building collective power.
              </p>
            </div>
            <div>
              <span className="text-[11px] font-ui text-muted-foreground uppercase tracking-wider">Body Small — Inter 13/14px</span>
              <p className="font-ui text-[13px] md:text-sm text-muted-foreground">
                Posted 2 hours ago · 12 comments · 5 reshares
              </p>
            </div>
            <div>
              <span className="text-[11px] font-ui text-muted-foreground uppercase tracking-wider">Caption — Inter 12px</span>
              <p className="font-ui text-xs text-muted-foreground">Last active 3 min ago</p>
            </div>
            <div>
              <span className="text-[11px] font-ui text-muted-foreground uppercase tracking-wider">Overline — Inter 11px uppercase</span>
              <p className="font-ui text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Coming Soon</p>
            </div>
          </div>
        </Section>

        {/* ── ELEVATION ── */}
        <Section title="3. Elevation & Shadows">
          <div className="flex flex-wrap gap-4">
            {[
              { label: 'Level 0 (Flat)', shadow: '' },
              { label: 'Level 1 (Card)', shadow: 'shadow-dna-1' },
              { label: 'Level 2 (Hover)', shadow: 'shadow-dna-2' },
              { label: 'Level 3 (Modal)', shadow: 'shadow-dna-3' },
              { label: 'Level 4 (Toast)', shadow: 'shadow-dna-4' },
              { label: 'Focus Ring', shadow: 'shadow-dna-focus' },
              { label: 'DIA Glow', shadow: 'shadow-dna-glow' },
            ].map(s => (
              <div key={s.label} className={`w-28 h-20 bg-card rounded-dna-lg border border-border flex items-center justify-center ${s.shadow}`}>
                <span className="text-[11px] font-ui text-muted-foreground text-center px-2">{s.label}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── BUTTONS ── */}
        <Section title="4. Buttons">
          <div className="space-y-4 bg-card p-6 rounded-dna-lg border border-border">
            <div className="flex flex-wrap gap-3 items-center">
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="default">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Danger</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Button disabled>Disabled</Button>
              <Button variant="module" style={{ '--module-color': 'hsl(var(--module-convene))' } as React.CSSProperties}>
                <Calendar className="w-4 h-4" /> Module (Convene)
              </Button>
            </div>
          </div>
        </Section>

        {/* ── INPUTS ── */}
        <Section title="5. Inputs">
          <div className="space-y-4 bg-card p-6 rounded-dna-lg border border-border max-w-md">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Standard Input</label>
              <Input placeholder="Enter your name..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Search Input</label>
              <Input placeholder="Search DNA..." className="rounded-full bg-muted border-0 focus:border focus:border-primary focus:bg-card" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Error State</label>
              <Input placeholder="Invalid field" className="border-destructive focus-visible:ring-destructive" />
              <p className="text-xs text-destructive">This field is required</p>
            </div>
          </div>
        </Section>

        {/* ── AVATARS ── */}
        <Section title="6. Avatars">
          <div className="flex flex-wrap items-end gap-4 bg-card p-6 rounded-dna-lg border border-border">
            {[
              { size: 'h-6 w-6', label: 'XS (24)' },
              { size: 'h-8 w-8', label: 'SM (32)' },
              { size: 'h-11 w-11', label: 'MD (44)' },
              { size: 'h-16 w-16', label: 'LG (64)' },
              { size: 'h-24 w-24', label: 'XL (96)' },
            ].map(a => (
              <div key={a.label} className="flex flex-col items-center gap-1">
                <Avatar className={a.size}>
                  <AvatarFallback className="bg-dna-emerald-subtle text-dna-emerald-dark font-semibold text-[40%]">JA</AvatarFallback>
                </Avatar>
                <span className="text-[11px] font-ui text-muted-foreground">{a.label}</span>
              </div>
            ))}

            {/* Avatar group */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex -space-x-2">
                <Avatar className="h-8 w-8 border-2 border-card">
                  <AvatarFallback className="bg-dna-connect text-white text-xs">AB</AvatarFallback>
                </Avatar>
                <Avatar className="h-8 w-8 border-2 border-card">
                  <AvatarFallback className="bg-dna-convene text-white text-xs">CD</AvatarFallback>
                </Avatar>
                <Avatar className="h-8 w-8 border-2 border-card">
                  <AvatarFallback className="bg-dna-stone text-muted-foreground text-xs">+5</AvatarFallback>
                </Avatar>
              </div>
              <span className="text-[11px] font-ui text-muted-foreground">Group</span>
            </div>
          </div>
        </Section>

        {/* ── CARDS ── */}
        <Section title="7. Cards">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Standard card */}
            <Card className="p-4 shadow-dna-1">
              <h3 className="font-ui text-[17px] font-semibold text-foreground mb-2">Standard Card</h3>
              <p className="text-sm text-muted-foreground">Base card with level-1 shadow and dna-lg radius.</p>
            </Card>

            {/* Module-accented card */}
            <Card className="p-4 shadow-dna-1 border-l-[3px] border-l-dna-convene">
              <h3 className="font-ui text-[17px] font-semibold text-foreground mb-2">Accented Card (Convene)</h3>
              <p className="text-sm text-muted-foreground">3px left border in module color for feed cards.</p>
            </Card>

            {/* Unread card */}
            <Card className="p-4 shadow-dna-1 bg-dna-cream">
              <h3 className="font-ui text-[17px] font-semibold text-foreground mb-2">Unread State</h3>
              <p className="text-sm text-muted-foreground">Cream background signals unread content.</p>
            </Card>

            {/* Interactive card */}
            <Card className="p-4 shadow-dna-1 hover:shadow-dna-2 hover:-translate-y-px transition-all duration-150 cursor-pointer">
              <h3 className="font-ui text-[17px] font-semibold text-foreground mb-2">Interactive Card</h3>
              <p className="text-sm text-muted-foreground">Hover: shadow-level2 + translateY(-1px).</p>
            </Card>
          </div>
        </Section>

        {/* ── TAGS & BADGES ── */}
        <Section title="8. Tags & Badges">
          <div className="flex flex-wrap gap-2 bg-card p-6 rounded-dna-lg border border-border">
            <Badge className="bg-dna-connect-light text-dna-connect border-0">Connect</Badge>
            <Badge className="bg-dna-convene-light text-dna-convene border-0">Convene</Badge>
            <Badge className="bg-dna-collaborate-light text-dna-collaborate border-0">Collaborate</Badge>
            <Badge className="bg-dna-contribute-light text-dna-contribute border-0">Contribute</Badge>
            <Badge className="bg-dna-convey-light text-dna-convey border-0">Convey</Badge>
            <Badge className="bg-dna-dia-light text-dna-dia border-0"><MateMasie className="w-3 h-3 mr-1" />DIA</Badge>
            <Badge variant="destructive">Error</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </Section>

        {/* ── FEED CARD EXAMPLE ── */}
        <Section title="9. Feed Card (Composite)">
          <Card className="p-4 shadow-dna-1 border-l-[3px] border-l-dna-connect max-w-xl">
            <div className="flex gap-3">
              <Avatar className="h-11 w-11">
                <AvatarFallback className="bg-dna-emerald-subtle text-dna-emerald-dark font-semibold">AO</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-heritage font-semibold text-foreground">Amara Okafor</span>
                  <span className="text-xs text-muted-foreground">· 2h ago</span>
                </div>
                <p className="text-[15px] text-foreground leading-normal mb-3">
                  Just returned from the AfroTech conference in Accra. The energy around Pan-African collaboration was electric! 🌍✨
                </p>
                {/* Engagement bar */}
                <div className="flex items-center gap-4 text-muted-foreground">
                  <button className="flex items-center gap-1 text-sm hover:text-destructive transition-colors">
                    <Heart className="w-[18px] h-[18px]" /> <span>24</span>
                  </button>
                  <button className="flex items-center gap-1 text-sm hover:text-primary transition-colors">
                    <MessageSquare className="w-[18px] h-[18px]" /> <span>8</span>
                  </button>
                  <button className="flex items-center gap-1 text-sm hover:text-primary transition-colors">
                    <Share2 className="w-[18px] h-[18px]" />
                  </button>
                  <button className="flex items-center gap-1 text-sm hover:text-primary transition-colors ml-auto">
                    <Bookmark className="w-[18px] h-[18px]" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </Section>

        {/* ── FIVE C's ICON MAP ── */}
        <Section title="10. Module Icons">
          <div className="flex flex-wrap gap-6 bg-card p-6 rounded-dna-lg border border-border">
            {[
              { name: 'Connect', Icon: Users, color: 'text-dna-connect' },
              { name: 'Convene', Icon: Calendar, color: 'text-dna-convene' },
              { name: 'Collaborate', Icon: LayoutGrid, color: 'text-dna-collaborate' },
              { name: 'Contribute', Icon: Handshake, color: 'text-dna-contribute' },
              { name: 'Convey', Icon: Megaphone, color: 'text-dna-convey' },
              { name: 'DIA', Icon: MateMasie, color: 'text-dna-dia' },
              { name: 'Notifications', Icon: Bell, color: 'text-foreground' },
            ].map(({ name, Icon, color }) => (
              <div key={name} className="flex flex-col items-center gap-1">
                <Icon className={`w-6 h-6 ${color}`} strokeWidth={1.75} />
                <span className="text-[11px] font-ui text-muted-foreground">{name}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── SPACING REFERENCE ── */}
        <Section title="11. Spacing Scale (4px base)">
          <div className="flex flex-wrap items-end gap-3 bg-card p-6 rounded-dna-lg border border-border">
            {[
              { label: '4px', w: 'w-1 h-4' },
              { label: '8px', w: 'w-2 h-6' },
              { label: '12px', w: 'w-3 h-8' },
              { label: '16px', w: 'w-4 h-10' },
              { label: '24px', w: 'w-6 h-12' },
              { label: '32px', w: 'w-8 h-14' },
              { label: '48px', w: 'w-12 h-16' },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <div className={`${s.w} bg-primary rounded-sm`} />
                <span className="text-[11px] font-ui text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── BORDER RADIUS ── */}
        <Section title="12. Border Radius">
          <div className="flex flex-wrap gap-4 bg-card p-6 rounded-dna-lg border border-border">
            {[
              { label: 'SM (6px)', r: 'rounded-dna-sm' },
              { label: 'MD (10px)', r: 'rounded-dna-md' },
              { label: 'LG (12px)', r: 'rounded-dna-lg' },
              { label: 'XL (16px)', r: 'rounded-dna-xl' },
              { label: 'Full', r: 'rounded-full' },
            ].map(r => (
              <div key={r.label} className="flex flex-col items-center gap-1">
                <div className={`w-14 h-14 bg-primary ${r.r}`} />
                <span className="text-[11px] font-ui text-muted-foreground">{r.label}</span>
              </div>
            ))}
          </div>
        </Section>

      </main>

      <footer className="max-w-5xl mx-auto px-4 py-8 border-t border-border text-center">
        <p className="text-sm text-muted-foreground font-ui">
          DNA Design System v1.0 · Phase 5 Documentation & Polish
        </p>
      </footer>
    </div>
  );
}
