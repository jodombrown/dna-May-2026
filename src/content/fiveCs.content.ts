/**
 * Five C's discovery content — single source of truth for both the card row
 * on public profiles and the right-sheet detail views. Copy mirrors the
 * approved Screenshot 4-8 explainers (Connect / Convene / Collaborate /
 * Contribute / Convey).
 */

export type FiveCId = 'connect' | 'convene' | 'collaborate' | 'contribute' | 'convey';

export type FiveCAdinkraKey =
  | 'sankofa'
  | 'nkonsonkonson'
  | 'funtunfunefu'
  | 'adinkrahene'
  | 'mpatapo';

export interface FiveCEntry {
  id: FiveCId;
  name: string;
  cardTagline: string; // short line used on the card row (screenshot 3)
  sheetTagline: string; // longer line used at the top of the sheet
  adinkra: FiveCAdinkraKey;
  /** hsl(var(--dna-*)) token used for the icon tile and sheet header wash. */
  colorToken: string;
  overview: string;
  whatYouCanDo: string[];
  whoItIsFor: string;
  howItConnects: string;
  whatIsComing: string[];
}

export const FIVE_CS: FiveCEntry[] = [
  {
    id: 'connect',
    name: 'Connect',
    cardTagline: 'Forge powerful bonds across the global African diaspora.',
    sheetTagline: 'Build relationships that move Africa forward.',
    adinkra: 'sankofa',
    colorToken: 'hsl(var(--dna-emerald))',
    overview:
      'Connect is the professional networking layer of DNA. It is built to LinkedIn-class standards but designed specifically for the 200M+ Global African Diaspora, continental Africans, and allies who share a commitment to Africa\'s transformation. Every connection is verified, intentional, and purpose-driven.',
    whatYouCanDo: [
      'Discover diaspora professionals filtered by industry, heritage, city, and shared goals',
      'Send and receive context-rich connection requests with shared factors visible up front',
      'Form groups and persistent introductions through built-in messaging',
      'Surface mentors, co-founders, investors, and collaborators through DIA-powered matching',
      'See mutual connections, shared spaces, and event overlap on every profile',
    ],
    whoItIsFor:
      'Diaspora professionals seeking meaningful ties to the continent, continental Africans seeking diaspora collaborators, and allies who want to contribute without overstepping.',
    howItConnects:
      'Connections seed Convene (shared events), Collaborate (co-founders and teammates), Contribute (warm intros for offers and needs), and Convey (an audience that actually listens).',
    whatIsComing: [
      'Verification tiers and trust signals',
      'Heritage-aware introduction workflows',
      'DIA connection nudges based on shared trajectories',
    ],
  },
  {
    id: 'convene',
    name: 'Convene',
    cardTagline: 'Gather for meaningful events and cultural celebrations.',
    sheetTagline: 'Gather the diaspora, online and on the ground.',
    adinkra: 'nkonsonkonson',
    colorToken: 'hsl(var(--dna-copper))',
    overview:
      'Convene is DNA\'s event operating system. It matches Luma and Eventbrite for hosting, ticketing, and check-in, but it is purpose-built for diaspora gatherings - cultural moments, professional summits, investor briefings, and local meetups across every time zone the diaspora lives in.',
    whatYouCanDo: [
      'Host free or paid events, online, in-person, or hybrid',
      'Sell tickets with built-in Stripe checkout and on-site check-in',
      'Run featured calendars by city, sector, and community',
      'Send organizer announcements, reminders, and post-event follow ups',
      'Track attendance, engagement, and DIA-predicted turnout in real time',
    ],
    whoItIsFor:
      'Organizers hosting diaspora-focused gatherings and members searching for the right room to walk into next, in their city or across the world.',
    howItConnects:
      'Events deepen Connect (you meet who you saw), feed Collaborate (projects form in the hallway), and surface in Convey (recaps, photos, and stories that travel).',
    whatIsComing: [
      'Sponsorship placements per event',
      'Smart calendars by region and theme',
      'DIA attendance prediction and optimal scheduling',
    ],
  },
  {
    id: 'collaborate',
    name: 'Collaborate',
    cardTagline: 'Transform shared vision into action through partnerships.',
    sheetTagline: 'Turn ideas into funded, accountable ventures.',
    adinkra: 'funtunfunefu',
    colorToken: 'hsl(var(--dna-gold))',
    overview:
      'Collaborate is the project management layer where diaspora ideas become real work. Think Asana fused with accountability architecture: structured spaces, defined roles, milestone-based progress, and transparent contribution tracking so equity, recognition, and revenue share are never ambiguous.',
    whatYouCanDo: [
      'Create spaces for ventures, initiatives, and working groups',
      'Run task boards, dependencies, and milestones with built-in commenting',
      'Invite members by role with clear permissions and contribution credit',
      'Pool resources - capital, expertise, time - against shared objectives',
      'Get DIA health checks that flag stalls before projects die quietly',
    ],
    whoItIsFor:
      'Founders, project leads, and contributors who would rather ship something together than network indefinitely.',
    howItConnects:
      'Spaces draw teammates from Connect, run logistics through Convene, post needs into Contribute, and broadcast wins through Convey.',
    whatIsComing: [
      'Contribution-weighted equity ledgers',
      'Cross-space resource sharing',
      'DIA stall detection and intervention prompts',
    ],
  },
  {
    id: 'contribute',
    name: 'Contribute',
    cardTagline: "Step into your role in Africa's future with tangible impact.",
    sheetTagline: 'Multi-dimensional giving, not just dollars.',
    adinkra: 'adinkrahene',
    colorToken: 'hsl(var(--dna-copper))',
    overview:
      'Contribute is the diaspora marketplace, but the unit of exchange is wider than money. Members post needs and offers across capital, time, network introductions, knowledge, and physical resources, and the platform coordinates the match end to end.',
    whatYouCanDo: [
      'Post needs or offers across capital, time, network, knowledge, or assets',
      'Get matched to opportunities by sector, geography, and stated capacity',
      'Track fulfillment from offer through delivery with status updates',
      'Build a validated contribution footprint that travels across the platform',
      'See impact metrics for every contribution you make or receive',
    ],
    whoItIsFor:
      'Anyone with something to give, anyone with something they need, and the organizations coordinating the flow between them.',
    howItConnects:
      'Contribute is fed by Connect (warm sources), Convene (event-driven asks), and Collaborate (project needs), and its outcomes become stories in Convey.',
    whatIsComing: [
      'Verified impact reporting per contribution',
      'Recurring contribution commitments',
      'DIA opportunity matching across all five resource types',
    ],
  },
  {
    id: 'convey',
    name: 'Convey',
    cardTagline: 'Share stories and amplify diaspora voices across platforms.',
    sheetTagline: 'Publish the story of the diaspora, in your voice.',
    adinkra: 'mpatapo',
    colorToken: 'hsl(var(--dna-gold))',
    overview:
      'Convey is the publishing and storytelling layer - Medium and Substack quality, native to DNA. Members share stories, essays, photo journals, audio notes, and updates that reach a built-in audience of people who care about Africa and the diaspora.',
    whatYouCanDo: [
      'Publish long-form stories, posts, photo essays, and audio updates',
      'Build an audience through the Pulse, Curated, My Circle, and Saved tabs',
      'Engage through DNA-native reactions: asante, inspired, lets build, powerful, insightful',
      'Track reach, resonance, and amplification with built-in analytics',
      'Get DIA suggestions on what to write next and which stories to amplify',
    ],
    whoItIsFor:
      'Writers, founders, organizers, and members whose lived experience is the most under-published archive on the internet.',
    howItConnects:
      'Stories surface new Connect candidates, drive Convene attendance, recruit Collaborate teammates, and turn Contribute outcomes into proof.',
    whatIsComing: [
      'Promoted and sponsored amplification slots',
      'Newsletter-style subscriptions per author',
      'DIA-assisted drafting that honors the writer\'s voice',
    ],
  },
];
