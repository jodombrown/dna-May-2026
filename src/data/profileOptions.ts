/**
 * Profile Options Constants for DNA Platform
 * Centralized options for all profile-related selectors
 */

// =============================================================================
// SECTORS & INDUSTRIES
// =============================================================================

export const SECTOR_OPTIONS = [
  'Agtech',
  'Climate',
  'Education',
  'Energy',
  'Fintech',
  'Healthcare',
  'Infrastructure',
  'Manufacturing',
  'Media & Entertainment',
  'Mining',
  'Real Estate',
  'Retail',
  'Tech/Software',
  'Tourism',
  'Transportation',
] as const;

export type Sector = typeof SECTOR_OPTIONS[number];

// =============================================================================
// INTENTIONS (What brings you to DNA?)
// =============================================================================

export const INTENTION_OPTIONS = [
  { value: 'invest', label: 'Invest' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'build', label: 'Build/Start Business' },
  { value: 'learn', label: 'Learn' },
  { value: 'connect', label: 'Connect with Community' },
  { value: 'give_back', label: 'Give Back' },
] as const;

export const INTENTION_VALUES = INTENTION_OPTIONS.map(o => o.value);
export type IntentionValue = typeof INTENTION_OPTIONS[number]['value'];

// =============================================================================
// CONNECTION TO AFRICA (Inclusive Member Types)
// =============================================================================

export const CONNECTION_TYPE_OPTIONS = [
  { value: '1st_gen_diaspora', label: '1st Generation Diaspora', description: 'Born in Africa, living abroad' },
  { value: '2nd_gen_diaspora', label: '2nd Generation Diaspora', description: 'Born abroad, African parent(s)' },
  { value: '3rd_gen_diaspora', label: '3rd+ Generation Diaspora', description: 'Multi-generational diaspora' },
  { value: 'continental_african', label: 'Continental African', description: 'Living in Africa' },
  { value: 'returnee', label: 'Returnee', description: 'Returned to live in Africa' },
  { value: 'ally', label: 'Ally / Friend of Africa', description: 'Supporting African development' },
  { value: 'mixed_heritage', label: 'Mixed Heritage', description: 'Partial African ancestry' },
] as const;

export const CONNECTION_TYPE_VALUES = CONNECTION_TYPE_OPTIONS.map(o => o.value);
export type ConnectionTypeValue = typeof CONNECTION_TYPE_OPTIONS[number]['value'];

// Legacy alias for backward compatibility
export const DIASPORA_STATUS_OPTIONS = CONNECTION_TYPE_OPTIONS;
export const DIASPORA_STATUS_VALUES = CONNECTION_TYPE_VALUES;
export type DiasporaStatusValue = ConnectionTypeValue;

// =============================================================================
// ENGAGEMENT INTENTIONS (For Connect/Collaborate pillars)
// =============================================================================

export const ENGAGEMENT_INTENTION_OPTIONS = [
  { value: 'advising', label: 'Advising/Consulting' },
  { value: 'being_mentored', label: 'Being Mentored' },
  { value: 'collaborating', label: 'Collaborating on Projects' },
  { value: 'fundraising', label: 'Fundraising' },
  { value: 'hiring', label: 'Hiring' },
  { value: 'investing', label: 'Investing' },
  { value: 'job_seeking', label: 'Seeking Opportunities' },
  { value: 'learning', label: 'Learning & Development' },
  { value: 'mentoring', label: 'Mentoring Others' },
  { value: 'networking', label: 'Networking' },
  { value: 'speaking', label: 'Speaking at Events' },
  { value: 'volunteering', label: 'Volunteering' },
] as const;

export const ENGAGEMENT_INTENTION_VALUES = ENGAGEMENT_INTENTION_OPTIONS.map(o => o.value);
export type EngagementIntentionValue = typeof ENGAGEMENT_INTENTION_OPTIONS[number]['value'];

// =============================================================================
// AVAILABLE FOR (What are you open to?)
// =============================================================================

export const AVAILABLE_FOR_OPTIONS = [
  { value: 'advising', label: 'Advisory Roles' },
  { value: 'board_positions', label: 'Board Positions' },
  { value: 'collaborations', label: 'Collaborations' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'hiring', label: 'Hiring' },
  { value: 'investing', label: 'Investing' },
  { value: 'job_seeking', label: 'Job Seeking' },
  { value: 'mentorship', label: 'Mentorship' },
  { value: 'partnerships', label: 'Business Partnerships' },
  { value: 'seeking_investment', label: 'Seeking Investment' },
  { value: 'speaking', label: 'Speaking Engagements' },
  { value: 'volunteering', label: 'Volunteering' },
] as const;

export const AVAILABLE_FOR_VALUES = AVAILABLE_FOR_OPTIONS.map(o => o.value);
export type AvailableForValue = typeof AVAILABLE_FOR_OPTIONS[number]['value'];

// =============================================================================
// MENTORSHIP AREAS
// =============================================================================

export const MENTORSHIP_AREA_OPTIONS = [
  'Building Networks',
  'Business Strategy',
  'Career Development',
  'Entrepreneurship',
  'Financial Planning',
  'Fundraising & Investment',
  'Industry Expertise',
  'Leadership & Management',
  'Marketing & Growth',
  'Navigating Corporate Culture',
  'Personal Branding',
  'Product Development',
  'Technical Skills',
  'Work-Life Balance',
] as const;

export type MentorshipArea = typeof MENTORSHIP_AREA_OPTIONS[number];

// =============================================================================
// PROFESSIONAL SKILLS (Common skills for discovery)
// =============================================================================

export const COMMON_SKILLS = [
  'Business Development',
  'Community Building',
  'Data Science',
  'Finance & Accounting',
  'Fundraising',
  'Human Resources',
  'Legal',
  'Machine Learning',
  'Marketing',
  'Operations',
  'Policy & Government Relations',
  'Product Management',
  'Project Management',
  'Public Speaking',
  'Research',
  'Sales',
  'Software Engineering',
  'Strategy & Consulting',
  'UX/UI Design',
  'Writing & Content',
] as const;

export type CommonSkill = typeof COMMON_SKILLS[number];

// =============================================================================
// INTERESTS (Common interests for discovery)
// =============================================================================

export const COMMON_INTERESTS = [
  'African Tech Ecosystem',
  'Agritech',
  'Climate & Environment',
  'Creative Industries',
  'Cultural Preservation',
  'Diaspora Engagement',
  'EdTech',
  'Fintech & Digital Finance',
  'Healthcare Innovation',
  'Impact Investing',
  'Infrastructure Development',
  'Policy & Governance',
  'Sustainable Development',
  'Women in Business',
  'Youth Empowerment',
] as const;

export type CommonInterest = typeof COMMON_INTERESTS[number];

// =============================================================================
// DIASPORA NETWORKS
// =============================================================================

export const DIASPORA_NETWORK_OPTIONS = [
  'Academic/Research Networks',
  'Alumni Networks',
  'Cultural Organizations',
  'Entrepreneurship Hubs',
  'Faith-Based Communities',
  'Investment Networks',
  'Professional Associations',
  'Tech Community',
  'Women\'s Networks',
  'Youth Networks',
] as const;

export type DiasporaNetwork = typeof DIASPORA_NETWORK_OPTIONS[number];

// =============================================================================
// AFRICAN LANGUAGES (For "My Connection to Africa" section)
// =============================================================================

export const AFRICAN_LANGUAGES = [
  // Widely spoken
  'Swahili', 'Arabic', 'Hausa', 'Yoruba', 'Igbo', 'Amharic', 'Oromo', 'Zulu',
  'Shona', 'Xhosa', 'Afrikaans', 'Sotho', 'Tswana', 'Lingala', 'Wolof',
  'Fulani', 'Akan', 'Twi', 'Tigrinya', 'Somali', 'Kinyarwanda', 'Kirundi',
  'Luganda', 'Chichewa', 'Ndebele', 'Kikuyu', 'Luo', 'Malagasy', 'Berber',
  'Tamazight', 'Fon', 'Ewe', 'Bambara', 'Mandinka', 'Serer', 'Tiv', 'Edo',
  'Efik', 'Ibibio', 'Kanuri', 'Nupe', 'Tumbuka', 'Bemba', 'Nyanja', 'Lozi',
  'Tsonga', 'Venda', 'Swazi', 'Setswana', 'Sesotho', 'Sepedi', 'isiZulu',
  'isiXhosa', 'isiNdebele', 'Siswati', 'Tshivenda', 'Xitsonga', 'Krio',
  'Pidgin English', 'Gikuyu', 'Dholuo', 'Kalenjin', 'Luhya', 'Meru', 'Maasai',
] as const;

export type AfricanLanguage = typeof AFRICAN_LANGUAGES[number];

// Helper function to check if a language is African
export const isAfricanLanguage = (language: string): boolean => {
  const normalizedLang = language.toLowerCase().trim();
  return AFRICAN_LANGUAGES.some(
    africanLang => africanLang.toLowerCase() === normalizedLang
  );
};

// =============================================================================
// ETHNIC/TRIBAL HERITAGE
// =============================================================================

export const ETHNIC_HERITAGE_OPTIONS = [
  // West Africa
  'Yoruba', 'Igbo', 'Hausa', 'Fulani', 'Akan', 'Ashanti', 'Ewe', 'Fon', 'Wolof',
  'Mandinka', 'Serer', 'Bambara', 'Soninke', 'Mossi', 'Tuareg', 'Kanuri', 'Krio',
  // East Africa
  'Amhara', 'Oromo', 'Tigray', 'Somali', 'Kikuyu', 'Luo', 'Maasai', 'Kalenjin',
  'Luhya', 'Kamba', 'Baganda', 'Tutsi', 'Hutu', 'Swahili',
  // Southern Africa
  'Zulu', 'Xhosa', 'Sotho', 'Tswana', 'Ndebele', 'Shona', 'Venda', 'Tsonga',
  'Swazi', 'Pedi', 'Herero', 'Himba', 'San', 'Khoikhoi',
  // North Africa
  'Berber', 'Amazigh', 'Tuareg', 'Nubian', 'Coptic', 'Arab',
  // Central Africa
  'Kongo', 'Luba', 'Mongo', 'Fang', 'Beti', 'Bamileke', 'Pygmy',
  // Other
  'Mixed Heritage', 'Unknown/Researching',
] as const;

export type EthnicHeritage = typeof ETHNIC_HERITAGE_OPTIONS[number];

// =============================================================================
// RETURN INTENTIONS
// =============================================================================

export const RETURN_INTENTIONS_OPTIONS = [
  { value: 'planning_return', label: 'Planning to Return', description: 'Actively planning to relocate to Africa' },
  { value: 'exploring', label: 'Exploring Options', description: 'Considering it, researching possibilities' },
  { value: 'regular_visits', label: 'Regular Visits', description: 'Prefer to visit regularly but live abroad' },
  { value: 'no_plans', label: 'No Current Plans', description: 'Content living abroad for now' },
  { value: 'already_returned', label: 'Already Returned', description: 'Have relocated back to Africa' },
  { value: 'never_left', label: 'Never Left', description: 'Continental African, never left' },
] as const;

export const RETURN_INTENTIONS_VALUES = RETURN_INTENTIONS_OPTIONS.map(o => o.value);
export type ReturnIntentionsValue = typeof RETURN_INTENTIONS_OPTIONS[number]['value'];

// =============================================================================
// AFRICAN CAUSES
// =============================================================================

export const AFRICAN_CAUSES_OPTIONS = [
  { value: 'education', label: 'Education & Literacy' },
  { value: 'healthcare', label: 'Healthcare & Public Health' },
  { value: 'tech_ecosystem', label: 'Tech Ecosystem & Innovation' },
  { value: 'climate', label: 'Climate & Environment' },
  { value: 'youth_empowerment', label: 'Youth Empowerment' },
  { value: 'womens_rights', label: "Women's Rights & Gender Equality" },
  { value: 'economic_development', label: 'Economic Development' },
  { value: 'agriculture', label: 'Agriculture & Food Security' },
  { value: 'infrastructure', label: 'Infrastructure & Housing' },
  { value: 'governance', label: 'Governance & Democracy' },
  { value: 'arts_culture', label: 'Arts, Culture & Heritage' },
  { value: 'diaspora_engagement', label: 'Diaspora Engagement' },
  { value: 'entrepreneurship', label: 'Entrepreneurship & SMEs' },
  { value: 'financial_inclusion', label: 'Financial Inclusion' },
] as const;

export const AFRICAN_CAUSES_VALUES = AFRICAN_CAUSES_OPTIONS.map(o => o.value);
export type AfricanCausesValue = typeof AFRICAN_CAUSES_OPTIONS[number]['value'];

// =============================================================================
// AFRICA VISIT FREQUENCY
// =============================================================================

export const VISIT_FREQUENCY_OPTIONS = [
  { value: 'live_there', label: 'I Live in Africa', description: 'Currently residing in Africa' },
  { value: 'multiple_yearly', label: 'Multiple Times a Year', description: 'Frequent traveler' },
  { value: 'yearly', label: 'About Once a Year', description: 'Annual visits' },
  { value: 'every_few_years', label: 'Every Few Years', description: 'Occasional visits' },
  { value: 'rarely', label: 'Rarely', description: 'Infrequent visits' },
  { value: 'never_visited', label: 'Not Yet', description: "Haven't visited yet but want to" },
  { value: 'planning_first', label: 'Planning First Trip', description: 'First visit coming up' },
] as const;

export const VISIT_FREQUENCY_VALUES = VISIT_FREQUENCY_OPTIONS.map(o => o.value);
export type VisitFrequencyValue = typeof VISIT_FREQUENCY_OPTIONS[number]['value'];

// Which visit-frequency options make sense for each return-plan choice.
// Keeps the "How often do you visit Africa?" list short and relevant.
export const VISIT_FREQUENCY_BY_RETURN_INTENTION: Record<string, VisitFrequencyValue[]> = {
  planning_return:  ['multiple_yearly', 'yearly', 'every_few_years', 'planning_first'],
  exploring:        ['multiple_yearly', 'yearly', 'every_few_years', 'rarely', 'never_visited', 'planning_first'],
  regular_visits:   ['multiple_yearly', 'yearly', 'every_few_years'],
  no_plans:         ['yearly', 'every_few_years', 'rarely', 'never_visited', 'planning_first'],
  already_returned: ['live_there'],
  never_left:       ['live_there'],
};

export function getVisitFrequencyOptionsFor(returnIntention: string) {
  const allowed = VISIT_FREQUENCY_BY_RETURN_INTENTION[returnIntention];
  if (!allowed || allowed.length === 0) return VISIT_FREQUENCY_OPTIONS;
  return VISIT_FREQUENCY_OPTIONS.filter(o => allowed.includes(o.value));
}

// =============================================================================
// USER TYPES
// =============================================================================

export const USER_TYPE_OPTIONS = [
  { value: 'individual', label: 'Individual' },
  { value: 'founder', label: 'Founder/Entrepreneur' },
  { value: 'investor', label: 'Investor' },
  { value: 'professional', label: 'Professional' },
  { value: 'student', label: 'Student' },
  { value: 'organizer', label: 'Community Organizer' },
  { value: 'creative', label: 'Creative/Artist' },
  { value: 'other', label: 'Other' },
] as const;

export const USER_TYPE_VALUES = USER_TYPE_OPTIONS.map(o => o.value);
export type UserTypeValue = typeof USER_TYPE_OPTIONS[number]['value'];
