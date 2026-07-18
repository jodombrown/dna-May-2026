/**
 * DNA | Profile & Identity Hub — Onboarding Flow Types
 *
 * Seven-step onboarding flow that progressively builds the user's profile
 * while introducing them to DNA's Five C's and DIA intelligence.
 *
 * Steps: Welcome → Identity → Heritage → Skills → Discovery → Connections → Tour
 */

// ============================================================
// ONBOARDING STATE
// ============================================================

export interface OnboardingState {
  userId: string;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  skippedSteps: OnboardingStep[];
  startedAt: Date;
  completedAt: Date | null;
}

export enum OnboardingStep {
  WELCOME = 'welcome',
  IDENTITY = 'identity',
  HERITAGE = 'heritage',
  SKILLS = 'skills',
  DISCOVERY = 'discovery',
  CONNECTIONS = 'connections',
  TOUR = 'tour',
  COMPLETE = 'complete',
}

// ============================================================
// ONBOARDING STEP CONFIG
// ============================================================

export interface OnboardingStepConfig {
  step: OnboardingStep;
  title: string;
  subtitle: string;
  isRequired: boolean;
  estimatedSeconds: number;
  fields?: string[];
}

export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    step: OnboardingStep.WELCOME,
    title: 'Welcome to DNA',
    subtitle: 'The mobilization infrastructure for the Global African Diaspora\'s return',
    isRequired: true,
    estimatedSeconds: 30,
  },
  {
    step: OnboardingStep.IDENTITY,
    title: 'Who are you?',
    subtitle: 'Your name and first impression matter',
    isRequired: true,
    estimatedSeconds: 60,
    fields: ['firstName', 'lastName', 'avatar', 'headline'],
  },
  {
    step: OnboardingStep.HERITAGE,
    title: 'Your diaspora story',
    subtitle: 'Where are you connected to Africa?',
    isRequired: false,
    estimatedSeconds: 45,
    fields: ['heritageCountries', 'currentCountry', 'languages', 'diasporaGeneration'],
  },
  {
    step: OnboardingStep.SKILLS,
    title: 'What do you bring?',
    subtitle: 'Your skills help DIA connect you with the right people',
    isRequired: false,
    estimatedSeconds: 45,
    fields: ['skills', 'interests', 'industry'],
  },
  {
    step: OnboardingStep.DISCOVERY,
    title: 'Explore the diaspora',
    subtitle: 'Follow topics and regions that matter to you',
    isRequired: false,
    estimatedSeconds: 30,
    fields: ['followedTopics', 'followedRegions'],
  },
  {
    step: OnboardingStep.CONNECTIONS,
    title: 'People you should know',
    subtitle: 'DIA found some connections to get you started',
    isRequired: false,
    estimatedSeconds: 30,
  },
  {
    step: OnboardingStep.TOUR,
    title: "The Five C's",
    subtitle: 'A quick tour of what DNA can do',
    isRequired: false,
    estimatedSeconds: 60,
  },
];

// ============================================================
// HEADLINE WIZARD
// ============================================================

export interface HeadlineWizardConfig {
  pattern: string;
  examples: string[];
  components: HeadlineComponent[];
}

export interface HeadlineComponent {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
}

export const HEADLINE_WIZARD: HeadlineWizardConfig = {
  pattern: '[Role/Title] | [Focus/Industry] | [Location ↔ Heritage Connection]',
  examples: [
    'Supply Chain Innovation | Lagos ↔ Atlanta',
    'FinTech Founder | Building for the diaspora from London',
    'Creative Director | Connecting African art to global markets',
    'Student | Exploring my Ghanaian heritage from Toronto',
  ],
  components: [
    {
      id: 'role',
      label: 'Role or Title',
      placeholder: 'e.g., Software Engineer, FinTech Founder, Student',
      required: true,
    },
    {
      id: 'focus',
      label: 'Focus or Industry',
      placeholder: 'e.g., Building for the diaspora, Supply Chain Innovation',
      required: false,
    },
    {
      id: 'connection',
      label: 'Location ↔ Heritage',
      placeholder: 'e.g., Lagos ↔ Atlanta, from London',
      required: false,
    },
  ],
};

// ============================================================
// FIVE C's TOUR CONTENT
// ============================================================

export interface FiveCTourCard {
  cModule: string;
  title: string;
  tagline: string;
  description: string;
  icon: string;
  color: string;
  exampleAction: string;
}

export const FIVE_C_TOUR_CARDS: FiveCTourCard[] = [
  {
    cModule: 'connect',
    title: 'Connect',
    tagline: 'Build your global network',
    description: 'Find and connect with diaspora members across the globe. DIA helps match you with people who share your interests, heritage, and goals.',
    icon: 'users',
    color: '#4A8D77',
    exampleAction: 'Send your first connection request',
  },
  {
    cModule: 'convene',
    title: 'Convene',
    tagline: 'Gather with purpose',
    description: 'Host and attend events, virtual or in-person, that bring the diaspora together. From networking mixers to cultural celebrations.',
    icon: 'calendar',
    color: '#C4942A',
    exampleAction: 'Browse upcoming diaspora events',
  },
  {
    cModule: 'collaborate',
    title: 'Collaborate',
    tagline: 'Work on what matters',
    description: 'Create or join Spaces, project rooms where diaspora members collaborate on shared goals with real-time tools.',
    icon: 'layout',
    color: '#2D5A3D',
    exampleAction: 'Explore collaboration Spaces',
  },
  {
    cModule: 'contribute',
    title: 'Contribute',
    tagline: 'Share value, find value',
    description: 'Post what you can offer and what you need. Skills, mentorship, resources, opportunities. The diaspora economy starts here.',
    icon: 'hand-helping',
    color: '#B87333',
    exampleAction: 'Post your first offer or need',
  },
  {
    cModule: 'convey',
    title: 'Convey',
    tagline: 'Tell your story',
    description: 'Publish stories, insights, and perspectives that shape the diaspora narrative. Your voice reaches a global audience.',
    icon: 'pen-tool',
    color: '#2A7A8C',
    exampleAction: 'Write your first post',
  },
];
