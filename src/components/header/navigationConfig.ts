export type PublicNavItem = {
  name: string;
  path: string;
  featured?: boolean;
  badge?: string;
};

export const publicNavItems: PublicNavItem[] = [
  { name: 'ROADMAP', path: '/roadmap', featured: true, badge: 'New' },
  { name: 'Connect', path: '/connect' },
  { name: 'Convene', path: '/convene' },
  { name: 'Collaborate', path: '/collaborate' },
  { name: 'Contribute', path: '/contribute' },
  { name: 'Convey', path: '/convey' },
];

export const aboutUsDropdown = [
  { name: 'About Us', path: '/about' },
  { name: 'Fact Sheet', path: '/fact-sheet' },
  { name: 'Contact', path: '/contact' },
];

// Main navigation for authenticated users - Pillar-based structure (5 C's)
export const mainNavItems = [
  { name: 'Home', path: '/dna/feed', icon: 'Home' },
  { name: 'Discover', path: '/dna/connect/discover', icon: 'Search' },
  { name: 'Connect', path: '/dna/connect/network', icon: 'Users2' },
  { name: 'Convene', path: '/dna/convene/events', icon: 'Calendar' },
  { name: 'Messages', path: '/dna/connect/messages', icon: 'MessageCircle' },
  { name: 'Contribute', path: '/dna/contribute', icon: 'Briefcase' },
];

// Pillar-based navigation structure
export const pillarNavigation = {
  discover: {
    label: 'Discover',
    icon: 'Compass',
    items: [
      { name: 'Members', path: '/dna/connect/discover' },
      { name: 'Feed', path: '/dna/feed' },
    ],
  },
  connect: {
    label: 'Connect',
    icon: 'Users',
    items: [
      { name: 'Network', path: '/dna/connect/network' },
      { name: 'Feed', path: '/dna/feed' },
      { name: 'Messages', path: '/dna/messages' },
    ],
  },
  convene: {
    label: 'Convene',
    icon: 'Calendar',
    items: [
      { name: 'Events', path: '/dna/convene/events' },
    ],
  },
  contribute: {
    label: 'Contribute',
    icon: 'Heart',
    items: [
      { name: 'Marketplace', path: '/dna/contribute' },
    ],
  },
  convey: {
    label: 'Convey',
    icon: 'BookOpen',
    items: [
      { name: 'Stories', path: '/dna/convey' },
    ],
  },
};

export const phases = [
  { name: 'Market Research', path: '/phase-1/market-research' },
  { name: 'Prototyping', path: '/phase-2/prototyping' },
  { name: 'Customer Discovery', path: '/phase-3/customer-discovery' },
  { name: 'MVP Build', path: '/phase-4/mvp' },
  { name: 'Beta Validation', path: '/phase-5/beta-validation' },
  { name: 'Go-to-Market', path: '/phase-6/go-to-market' },
] as const;

// Example pages for landing page showcase
export const examplePages = [
  { name: 'Connect', path: '/connect' },
  { name: 'Collaborate', path: '/collaborate' },
  { name: 'Contribute', path: '/contribute' },
];
