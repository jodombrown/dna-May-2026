import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  Sankofa,
  Nkonsonkonson,
  FuntunfunefuDenkyemfunefu,
  Adinkrahene,
  Mpatapo,
} from '@/components/icons/adinkra';

export type PillarKey = 'connect' | 'convene' | 'collaborate' | 'contribute' | 'convey';

type PillarContent = {
  title: string;
  tagline: string;
  Icon: React.ComponentType<{ className?: string }>;
  accentBg: string;
  overview: string;
  capabilities: string[];
  audience: string;
  circulation: string;
  roadmap: string[];
};

const PILLAR_CONTENT: Record<PillarKey, PillarContent> = {
  connect: {
    title: 'Connect',
    tagline: 'Build relationships that move Africa forward.',
    Icon: Sankofa,
    accentBg: 'bg-gradient-to-br from-dna-forest to-dna-emerald',
    overview:
      'Connect is the professional networking layer of DNA. It is built to LinkedIn-class standards but designed specifically for the 200M+ Global African Diaspora, continental Africans, and allies who share a commitment to Africa\'s transformation. Every connection is verified, intentional, and purpose-driven.',
    capabilities: [
      'Discover diaspora professionals filtered by industry, heritage, city, and shared goals',
      'Send and receive context-rich connection requests with shared factors visible up front',
      'Form groups and persistent introductions through built-in messaging',
      'Surface mentors, co-founders, investors, and collaborators through DIA-powered matching',
      'See mutual connections, shared spaces, and event overlap on every profile',
    ],
    audience:
      'Diaspora professionals seeking meaningful ties to the continent, continental Africans seeking diaspora collaborators, and allies who want to contribute without overstepping.',
    circulation:
      'Connections seed Convene (shared events), Collaborate (co-founders and teammates), Contribute (warm intros for offers and needs), and Convey (an audience that actually listens).',
    roadmap: [
      'Verification tiers and trust signals',
      'Heritage-aware introduction workflows',
      'DIA connection nudges based on shared trajectories',
    ],
  },
  convene: {
    title: 'Convene',
    tagline: 'Gather the diaspora, online and on the ground.',
    Icon: Nkonsonkonson,
    accentBg: 'bg-gradient-to-br from-dna-emerald to-dna-copper',
    overview:
      'Convene is DNA\'s event platform. It matches Luma and Eventbrite for hosting, ticketing, and check-in, but it is purpose-built for diaspora gatherings - cultural moments, professional summits, investor briefings, and local meetups across every time zone the diaspora lives in.',
    capabilities: [
      'Host free or paid events, online, in-person, or hybrid',
      'Sell tickets with built-in Stripe checkout and on-site check-in',
      'Run featured calendars by city, sector, and community',
      'Send organizer announcements, reminders, and post-event follow ups',
      'Track attendance, engagement, and DIA-predicted turnout in real time',
    ],
    audience:
      'Organizers hosting diaspora-focused gatherings and members searching for the right room to walk into next, in their city or across the world.',
    circulation:
      'Events deepen Connect (you meet who you saw), feed Collaborate (projects form in the hallway), and surface in Convey (recaps, photos, and stories that travel).',
    roadmap: [
      'Sponsorship placements per event',
      'Smart calendars by region and theme',
      'DIA attendance prediction and optimal scheduling',
    ],
  },
  collaborate: {
    title: 'Collaborate',
    tagline: 'Turn ideas into funded, accountable ventures.',
    Icon: FuntunfunefuDenkyemfunefu,
    accentBg: 'bg-gradient-to-br from-dna-copper to-dna-gold',
    overview:
      'Collaborate is the project management layer where diaspora ideas become real work. Think Asana fused with accountability architecture: structured spaces, defined roles, milestone-based progress, and transparent contribution tracking so equity, recognition, and revenue share are never ambiguous.',
    capabilities: [
      'Create spaces for ventures, initiatives, and working groups',
      'Run task boards, dependencies, and milestones with built-in commenting',
      'Invite members by role with clear permissions and contribution credit',
      'Pool resources - capital, expertise, time - against shared objectives',
      'Get DIA health checks that flag stalls before projects die quietly',
    ],
    audience:
      'Founders, project leads, and contributors who would rather ship something together than network indefinitely.',
    circulation:
      'Spaces draw teammates from Connect, run logistics through Convene, post needs into Contribute, and broadcast wins through Convey.',
    roadmap: [
      'Contribution-weighted equity ledgers',
      'Cross-space resource sharing',
      'DIA stall detection and intervention prompts',
    ],
  },
  contribute: {
    title: 'Contribute',
    tagline: 'Multi-dimensional giving, not just dollars.',
    Icon: Adinkrahene,
    accentBg: 'bg-gradient-to-br from-dna-gold to-dna-ochre',
    overview:
      'Contribute is the diaspora marketplace, but the unit of exchange is wider than money. Members post needs and offers across capital, time, network introductions, knowledge, and physical resources, and the platform coordinates the match end to end.',
    capabilities: [
      'Post needs or offers across capital, time, network, knowledge, or assets',
      'Get matched to opportunities by sector, geography, and stated capacity',
      'Track fulfillment from offer through delivery with status updates',
      'Build a validated contribution footprint that travels across the platform',
      'See impact metrics for every contribution you make or receive',
    ],
    audience:
      'Anyone with something to give, anyone with something they need, and the organizations coordinating the flow between them.',
    circulation:
      'Contribute is fed by Connect (warm sources), Convene (event-driven asks), and Collaborate (project needs), and its outcomes become stories in Convey.',
    roadmap: [
      'Verified impact reporting per contribution',
      'Recurring contribution commitments',
      'DIA opportunity matching across all five resource types',
    ],
  },
  convey: {
    title: 'Convey',
    tagline: 'Publish the story of the diaspora, in your voice.',
    Icon: Mpatapo,
    accentBg: 'bg-gradient-to-br from-dna-ochre to-dna-forest',
    overview:
      'Convey is the publishing and storytelling layer - Medium and Substack quality, native to DNA. Members share stories, essays, photo journals, audio notes, and updates that reach a built-in audience of people who care about Africa and the diaspora.',
    capabilities: [
      'Publish long-form stories, posts, photo essays, and audio updates',
      'Build an audience through the Pulse, Curated, My Circle, and Saved tabs',
      'Engage through DNA-native reactions: asante, inspired, lets build, powerful, insightful',
      'Track reach, resonance, and amplification with built-in analytics',
      'Get DIA suggestions on what to write next and which stories to amplify',
    ],
    audience:
      'Writers, founders, organizers, and members whose lived experience is the most under-published archive on the internet.',
    circulation:
      'Stories surface new Connect candidates, drive Convene attendance, recruit Collaborate teammates, and turn Contribute outcomes into proof.',
    roadmap: [
      'Promoted and sponsored amplification slots',
      'Newsletter-style subscriptions per author',
      'DIA-assisted drafting that honors the writer\'s voice',
    ],
  },
};

interface PillarInfoSheetProps {
  pillar: PillarKey;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PillarInfoSheet: React.FC<PillarInfoSheetProps> = ({ pillar, open, onOpenChange }) => {
  const content = PILLAR_CONTENT[pillar];
  const { Icon } = content;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
        <div className={`${content.accentBg} px-6 py-8 text-white`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
              <Icon className="w-7 h-7 text-white" />
            </div>
            <SheetTitle className="text-3xl font-serif text-white">{content.title}</SheetTitle>
          </div>
          <SheetDescription className="text-base text-white/90 font-medium">
            {content.tagline}
          </SheetDescription>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <Section heading="Overview">
            <p className="text-neutral-700 leading-relaxed">{content.overview}</p>
          </Section>

          <Section heading="What you can do">
            <ul className="space-y-2">
              {content.capabilities.map((item) => (
                <li key={item} className="flex gap-3 text-neutral-700">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-dna-emerald flex-shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section heading="Who it is for">
            <p className="text-neutral-700 leading-relaxed">{content.audience}</p>
          </Section>

          <Section heading="How it connects to the other C's">
            <p className="text-neutral-700 leading-relaxed">{content.circulation}</p>
          </Section>

          <Section heading="What is coming">
            <ul className="space-y-2">
              {content.roadmap.map((item) => (
                <li key={item} className="flex gap-3 text-neutral-700">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-dna-copper flex-shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const Section: React.FC<{ heading: string; children: React.ReactNode }> = ({ heading, children }) => (
  <div>
    <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
      {heading}
    </h3>
    {children}
  </div>
);

export default PillarInfoSheet;
