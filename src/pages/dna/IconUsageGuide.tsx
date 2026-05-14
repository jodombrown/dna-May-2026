import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Newspaper,
  Compass,
  UserPlus,
  Users,
  PenSquare,
  Bookmark,
  Network,
  MessageCircle,
  Bell,
  Settings,
  User,
  Home,
  Grid3X3,
  ExternalLink,
} from 'lucide-react';
import {
  Sankofa,
  Nkonsonkonson,
  FuntunfunefuDenkyemfunefu,
  Adinkrahene,
  Mpatapo,
  MateMasie,
} from '@/components/icons/adinkra';

/**
 * In-app summary of the platform's icon reservations.
 * Source of truth: docs/ICON_USAGE_GUIDE.md.
 * Enforced by: scripts/check-icon-duplicates.ts.
 */

interface IconRow {
  Icon: React.ElementType;
  name: string;
  reserved: string;
}

const ADINKRA_ROWS: IconRow[] = [
  { Icon: Sankofa, name: 'Sankofa', reserved: 'CONNECT module' },
  { Icon: Nkonsonkonson, name: 'Nkonsonkonson', reserved: 'CONVENE module' },
  { Icon: FuntunfunefuDenkyemfunefu, name: 'Funtunfunefu Denkyemfunefu', reserved: 'COLLABORATE module' },
  { Icon: Adinkrahene, name: 'Adinkrahene', reserved: 'CONTRIBUTE module' },
  { Icon: Mpatapo, name: 'Mpatapo (Mate Masie artwork)', reserved: 'CONVEY module' },
  { Icon: MateMasie, name: 'Mate Masie', reserved: 'DIA (Diaspora Intelligence Agent)' },
];

const FEED_ROWS: IconRow[] = [
  { Icon: Newspaper, name: 'Newspaper', reserved: 'Feed - All Posts tab' },
  { Icon: Compass, name: 'Compass', reserved: 'Feed - For You tab' },
  { Icon: UserPlus, name: 'UserPlus', reserved: 'Feed - My Network tab' },
  { Icon: PenSquare, name: 'PenSquare', reserved: 'Feed - Mine tab' },
  { Icon: Bookmark, name: 'Bookmark', reserved: 'Feed - Saved tab' },
];

const CONNECT_ROWS: IconRow[] = [
  { Icon: Users, name: 'Users', reserved: 'Connect - Members directory' },
  { Icon: Network, name: 'Network', reserved: 'Connect - Network graph' },
  { Icon: MessageCircle, name: 'MessageCircle', reserved: 'Connect - Messages tab' },
];

const CHROME_ROWS: IconRow[] = [
  { Icon: Home, name: 'Home', reserved: 'Pulse Dock - Feed home' },
  { Icon: Grid3X3, name: 'Grid3X3', reserved: 'Pulse Dock - More' },
  { Icon: Bell, name: 'Bell', reserved: 'Notifications' },
  { Icon: Settings, name: 'Settings', reserved: 'Settings entry' },
  { Icon: User, name: 'User', reserved: 'Profile entry' },
];

function IconTable({ rows }: { rows: IconRow[] }) {
  return (
    <div className="divide-y divide-border">
      {rows.map(({ Icon, name, reserved }) => (
        <div key={name} className="flex items-center gap-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted shrink-0">
            <Icon className="h-5 w-5 text-foreground" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{name}</p>
            <p className="text-xs text-muted-foreground">{reserved}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card className="p-4 md:p-6">
      <div className="mb-3">
        <h2 className="font-serif text-xl">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {children}
    </Card>
  );
}

export default function IconUsageGuide() {
  return (
    <>
      <Helmet>
        <title>Icon Usage Guide - DNA</title>
        <meta name="description" content="Reference of icons reserved for each DNA module and navigation surface." />
      </Helmet>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2">
          <Badge variant="secondary" className="rounded-md">Design system</Badge>
          <h1 className="font-serif text-3xl">Icon Usage Guide</h1>
          <p className="text-sm text-muted-foreground">
            Each navigation surface on DNA must use a unique icon per item.
            This page summarises the icons reserved for our modules and core
            navigation. The full specification, including the rationale and
            the allowed pool for new tabs, lives in
            {' '}
            <a
              href="https://github.com/diasporanetwork/dna/blob/main/docs/ICON_USAGE_GUIDE.md"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 inline-flex items-center gap-1"
            >
              docs/ICON_USAGE_GUIDE.md
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
            . A CI check (<code>npm run lint:icons</code>) blocks merges when
            duplicates appear inside any registered nav surface.
          </p>
        </header>

        <Section
          title="Adinkra (module identity)"
          subtitle="Reserved for the Five C's modules and DIA. Never used as decoration in feed or chrome."
        >
          <IconTable rows={ADINKRA_ROWS} />
        </Section>

        <Section
          title="Feed tabs"
          subtitle="Each feed tab has a single dedicated lucide icon, mirrored in its empty state."
        >
          <IconTable rows={FEED_ROWS} />
        </Section>

        <Section
          title="Connect tabs"
          subtitle="The Connect mobile header tab bar."
        >
          <IconTable rows={CONNECT_ROWS} />
        </Section>

        <Section
          title="Chrome and utilities"
          subtitle="Reserved across the dock, header utility row, and profile shortcuts."
        >
          <IconTable rows={CHROME_ROWS} />
        </Section>

        <Card className="p-4 md:p-6 bg-muted/30">
          <h2 className="font-serif text-lg mb-2">Out of scope (intentional repetition)</h2>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Inline meta icons inside cards (location pin, date, attendee count)</li>
            <li>Action button icons (message, bookmark, share)</li>
            <li>Decorative section accents</li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Repeating these icons is deliberate, because consistent meaning
            across cards helps users scan. Uniqueness only matters where the
            user makes a navigation decision.
          </p>
        </Card>

        <p className="text-xs text-muted-foreground">
          To register a new navigation surface, edit
          {' '}<code>scripts/check-icon-duplicates.ts</code>{' '} and update both this
          page and the markdown guide. Adding the icon to the lint registry is
          required for the GitHub Actions check to cover it.
        </p>

        <div>
          <Link to="/dna/feed" className="text-sm underline underline-offset-2">
            Back to Feed
          </Link>
        </div>
      </main>
    </>
  );
}
