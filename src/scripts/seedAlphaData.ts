/**
 * Alpha Test Seed Data Script
 *
 * Generates realistic seed data for alpha testing.
 * Run via Supabase edge function or directly against the database.
 *
 * Populates: profiles, events, spaces, opportunities, posts, stories, connections
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// ─── Configuration ──────────────────────────────────────────────────────────

interface AlphaSeedConfig {
  testUsers: number;
  connectionDensity: number;
  upcomingEvents: number;
  pastEvents: number;
  activeSpaces: number;
  stalledSpaces: number;
  openOpportunities: number;
  posts: number;
  stories: number;
  conversations: number;
}

const DEFAULT_CONFIG: AlphaSeedConfig = {
  testUsers: 18,
  connectionDensity: 6,
  upcomingEvents: 6,
  pastEvents: 3,
  activeSpaces: 4,
  stalledSpaces: 2,
  openOpportunities: 10,
  posts: 25,
  stories: 6,
  conversations: 8,
};

// ─── Seed User Profiles ─────────────────────────────────────────────────────

interface SeedProfile {
  full_name: string;
  first_name: string;
  last_name: string;
  username: string;
  headline: string;
  bio: string;
  location: string;
  current_country: string;
  current_city: string;
  primary_origin_country: string;
  profession: string;
  industry: string;
  skills: string[];
  interests: string[];
  professional_sectors: string[];
}

const SEED_PROFILES: SeedProfile[] = [
  {
    full_name: 'Amara Okafor',
    first_name: 'Amara',
    last_name: 'Okafor',
    username: 'amara_okafor',
    headline: 'Fintech Founder | Building pan-African payment rails',
    bio: 'Serial entrepreneur focused on financial inclusion across the diaspora. Previously at Stripe, now building the future of cross-border payments for Africa.',
    location: 'San Francisco, USA',
    current_country: 'United States',
    current_city: 'San Francisco',
    primary_origin_country: 'NGA',
    profession: 'CEO & Founder',
    industry: 'Fintech',
    skills: ['product strategy', 'fundraising', 'payments', 'leadership'],
    interests: ['financial inclusion', 'pan-African trade', 'startup ecosystems'],
    professional_sectors: ['Technology', 'Finance'],
  },
  {
    full_name: 'Kwame Mensah',
    first_name: 'Kwame',
    last_name: 'Mensah',
    username: 'kwame_mensah',
    headline: 'Full-Stack Developer | Open Source Advocate',
    bio: 'Building tools that connect African developers worldwide. Core contributor to several open-source projects. Passionate about tech education.',
    location: 'London, UK',
    current_country: 'United Kingdom',
    current_city: 'London',
    primary_origin_country: 'GHA',
    profession: 'Senior Software Engineer',
    industry: 'Technology',
    skills: ['react', 'typescript', 'node.js', 'python', 'system design'],
    interests: ['open source', 'tech education', 'developer communities'],
    professional_sectors: ['Technology'],
  },
  {
    full_name: 'Fatou Diallo',
    first_name: 'Fatou',
    last_name: 'Diallo',
    username: 'fatou_diallo',
    headline: 'Agricultural Innovation | Sustainable Farming Tech',
    bio: 'Agronomist turned tech entrepreneur. Using IoT and data science to modernize smallholder farming across West Africa.',
    location: 'Paris, France',
    current_country: 'France',
    current_city: 'Paris',
    primary_origin_country: 'SEN',
    profession: 'AgriTech Founder',
    industry: 'Agriculture',
    skills: ['agronomy', 'data science', 'iot', 'business development'],
    interests: ['sustainable agriculture', 'food security', 'climate resilience'],
    professional_sectors: ['Agriculture', 'Technology'],
  },
  {
    full_name: 'Chidi Eze',
    first_name: 'Chidi',
    last_name: 'Eze',
    username: 'chidi_eze',
    headline: 'Investment Analyst | Africa-Focused VC',
    bio: 'Evaluating and backing the next generation of African founders. Focused on Series A-B investments in health, fintech, and logistics.',
    location: 'Lagos, Nigeria',
    current_country: 'Nigeria',
    current_city: 'Lagos',
    primary_origin_country: 'NGA',
    profession: 'Investment Analyst',
    industry: 'Venture Capital',
    skills: ['financial modeling', 'due diligence', 'portfolio management', 'deal sourcing'],
    interests: ['African startups', 'impact investing', 'diaspora capital flows'],
    professional_sectors: ['Finance', 'Technology'],
  },
  {
    full_name: 'Nalini Mwangi',
    first_name: 'Nalini',
    last_name: 'Mwangi',
    username: 'nalini_mwangi',
    headline: 'UX Designer | Human-Centered Design for Africa',
    bio: 'Designing products that work for African contexts — low bandwidth, multilingual, mobile-first. Currently design lead at a health tech startup.',
    location: 'Nairobi, Kenya',
    current_country: 'Kenya',
    current_city: 'Nairobi',
    primary_origin_country: 'KEN',
    profession: 'Lead UX Designer',
    industry: 'Design',
    skills: ['ux research', 'figma', 'design systems', 'accessibility'],
    interests: ['inclusive design', 'health tech', 'African UX patterns'],
    professional_sectors: ['Technology', 'Healthcare'],
  },
  {
    full_name: 'Yannick Baptiste',
    first_name: 'Yannick',
    last_name: 'Baptiste',
    username: 'yannick_baptiste',
    headline: 'Policy Researcher | Diaspora Affairs & Trade',
    bio: 'Researching diaspora engagement policies and their impact on continental development. Advisor to multiple government diaspora offices.',
    location: 'Port-au-Prince, Haiti',
    current_country: 'Haiti',
    current_city: 'Port-au-Prince',
    primary_origin_country: 'HTI',
    profession: 'Policy Researcher',
    industry: 'Public Policy',
    skills: ['policy analysis', 'research', 'stakeholder engagement', 'writing'],
    interests: ['diaspora policy', 'trade agreements', 'Pan-African cooperation'],
    professional_sectors: ['Government', 'Research'],
  },
  {
    full_name: 'Zuri Ndlovu',
    first_name: 'Zuri',
    last_name: 'Ndlovu',
    username: 'zuri_ndlovu',
    headline: 'Creative Director | Afrofuturism & Brand Design',
    bio: 'Blending African heritage with futuristic design. Working with global brands to tell authentic African stories through visual art and branding.',
    location: 'Johannesburg, South Africa',
    current_country: 'South Africa',
    current_city: 'Johannesburg',
    primary_origin_country: 'ZAF',
    profession: 'Creative Director',
    industry: 'Arts & Design',
    skills: ['brand strategy', 'visual design', 'art direction', 'storytelling'],
    interests: ['afrofuturism', 'cultural branding', 'African art'],
    professional_sectors: ['Arts', 'Marketing'],
  },
  {
    full_name: 'Emeka Adeyemi',
    first_name: 'Emeka',
    last_name: 'Adeyemi',
    username: 'emeka_adeyemi',
    headline: 'Health Tech Entrepreneur | Digital Health for Africa',
    bio: 'Building telemedicine infrastructure connecting diaspora medical professionals with underserved communities across the continent.',
    location: 'Houston, USA',
    current_country: 'United States',
    current_city: 'Houston',
    primary_origin_country: 'NGA',
    profession: 'CEO & Co-Founder',
    industry: 'Healthcare',
    skills: ['healthtech', 'telemedicine', 'fundraising', 'operations'],
    interests: ['digital health', 'medical diaspora', 'rural healthcare access'],
    professional_sectors: ['Healthcare', 'Technology'],
  },
  {
    full_name: 'Aya Toure',
    first_name: 'Aya',
    last_name: 'Toure',
    username: 'aya_toure',
    headline: 'Education Innovator | EdTech for African Languages',
    bio: 'Building AI-powered learning tools in African languages. Focused on making quality education accessible to every child on the continent.',
    location: 'Abidjan, Ivory Coast',
    current_country: 'Ivory Coast',
    current_city: 'Abidjan',
    primary_origin_country: 'MLI',
    profession: 'EdTech Founder',
    industry: 'Education',
    skills: ['curriculum design', 'ai/ml', 'product management', 'linguistics'],
    interests: ['african languages', 'education equity', 'ai in education'],
    professional_sectors: ['Education', 'Technology'],
  },
  {
    full_name: 'Olumide Bankole',
    first_name: 'Olumide',
    last_name: 'Bankole',
    username: 'olumide_bankole',
    headline: 'Legal Counsel | Cross-Border Business Law',
    bio: 'Specializing in helping diaspora entrepreneurs navigate legal frameworks for doing business in Africa. Expert in AfCFTA implications.',
    location: 'Toronto, Canada',
    current_country: 'Canada',
    current_city: 'Toronto',
    primary_origin_country: 'NGA',
    profession: 'Corporate Attorney',
    industry: 'Legal',
    skills: ['corporate law', 'cross-border transactions', 'compliance', 'AfCFTA'],
    interests: ['trade law', 'diaspora business', 'regulatory frameworks'],
    professional_sectors: ['Legal', 'Finance'],
  },
  {
    full_name: 'Aisha Mohammed',
    first_name: 'Aisha',
    last_name: 'Mohammed',
    username: 'aisha_mohammed',
    headline: 'Marketing Strategist | African Consumer Markets',
    bio: 'Helping global brands understand and authentically engage with African and diaspora consumer markets. 10+ years in brand strategy.',
    location: 'Dubai, UAE',
    current_country: 'United Arab Emirates',
    current_city: 'Dubai',
    primary_origin_country: 'ETH',
    profession: 'Marketing Director',
    industry: 'Marketing',
    skills: ['brand strategy', 'market research', 'digital marketing', 'consumer insights'],
    interests: ['african consumer markets', 'brand authenticity', 'diaspora marketing'],
    professional_sectors: ['Marketing', 'Consumer Goods'],
  },
  {
    full_name: 'Kofi Asante',
    first_name: 'Kofi',
    last_name: 'Asante',
    username: 'kofi_asante',
    headline: 'Operations Lead | Supply Chain & Logistics',
    bio: 'Optimizing supply chains connecting African producers to global markets. Background in logistics, warehousing, and last-mile delivery.',
    location: 'Accra, Ghana',
    current_country: 'Ghana',
    current_city: 'Accra',
    primary_origin_country: 'GHA',
    profession: 'Head of Operations',
    industry: 'Logistics',
    skills: ['supply chain', 'logistics', 'warehouse management', 'process optimization'],
    interests: ['african trade', 'last-mile delivery', 'cross-border logistics'],
    professional_sectors: ['Logistics', 'Commerce'],
  },
  {
    full_name: 'Mariama Camara',
    first_name: 'Mariama',
    last_name: 'Camara',
    username: 'mariama_camara',
    headline: 'Social Impact | Community Development & Grants',
    bio: 'Connecting diaspora philanthropists with impactful community projects across Africa. Managed $5M+ in grant disbursements.',
    location: 'Brussels, Belgium',
    current_country: 'Belgium',
    current_city: 'Brussels',
    primary_origin_country: 'GIN',
    profession: 'Grants Manager',
    industry: 'Non-Profit',
    skills: ['grant writing', 'project management', 'impact assessment', 'fundraising'],
    interests: ['community development', 'diaspora philanthropy', 'social impact'],
    professional_sectors: ['Non-Profit', 'Development'],
  },
  {
    full_name: 'Tendai Moyo',
    first_name: 'Tendai',
    last_name: 'Moyo',
    username: 'tendai_moyo',
    headline: 'Data Scientist | AI Ethics & African Data',
    bio: 'Researching ethical AI frameworks for African contexts. Building datasets that represent African diversity and reduce bias.',
    location: 'Cape Town, South Africa',
    current_country: 'South Africa',
    current_city: 'Cape Town',
    primary_origin_country: 'ZWE',
    profession: 'Senior Data Scientist',
    industry: 'Technology',
    skills: ['machine learning', 'python', 'data ethics', 'research methodology'],
    interests: ['ai ethics', 'african datasets', 'responsible tech'],
    professional_sectors: ['Technology', 'Research'],
  },
  {
    full_name: 'Isabelle Dossou',
    first_name: 'Isabelle',
    last_name: 'Dossou',
    username: 'isabelle_dossou',
    headline: 'Music Producer | Afrobeats x Global Sound',
    bio: 'Grammy-nominated producer bridging Afrobeats, jazz, and electronic music. Passionate about amplifying African musical talent worldwide.',
    location: 'Atlanta, USA',
    current_country: 'United States',
    current_city: 'Atlanta',
    primary_origin_country: 'BEN',
    profession: 'Music Producer',
    industry: 'Entertainment',
    skills: ['music production', 'sound engineering', 'artist management', 'event curation'],
    interests: ['afrobeats', 'african music industry', 'creative arts'],
    professional_sectors: ['Entertainment', 'Arts'],
  },
  {
    full_name: 'Samuel Osei',
    first_name: 'Samuel',
    last_name: 'Osei',
    username: 'samuel_osei',
    headline: 'Mobile Developer | React Native & Flutter',
    bio: 'Building mobile-first experiences for African markets. Contributor to open-source mobile frameworks. Mentor to 50+ junior developers.',
    location: 'Berlin, Germany',
    current_country: 'Germany',
    current_city: 'Berlin',
    primary_origin_country: 'GHA',
    profession: 'Mobile Developer',
    industry: 'Technology',
    skills: ['react native', 'flutter', 'mobile architecture', 'mentoring'],
    interests: ['mobile-first design', 'developer mentoring', 'african tech talent'],
    professional_sectors: ['Technology'],
  },
  {
    full_name: 'Ngozi Uchenna',
    first_name: 'Ngozi',
    last_name: 'Uchenna',
    username: 'ngozi_uchenna',
    headline: 'Climate Tech | Renewable Energy for Africa',
    bio: 'Working on solar and mini-grid solutions for off-grid African communities. Engineering background with MBA from INSEAD.',
    location: 'Kigali, Rwanda',
    current_country: 'Rwanda',
    current_city: 'Kigali',
    primary_origin_country: 'NGA',
    profession: 'Clean Energy Director',
    industry: 'Energy',
    skills: ['renewable energy', 'project finance', 'electrical engineering', 'business strategy'],
    interests: ['clean energy', 'climate adaptation', 'off-grid solutions'],
    professional_sectors: ['Energy', 'Environment'],
  },
  {
    full_name: 'Jean-Pierre Nkurunziza',
    first_name: 'Jean-Pierre',
    last_name: 'Nkurunziza',
    username: 'jp_nkurunziza',
    headline: 'Real Estate Developer | Diaspora Housing Projects',
    bio: 'Developing affordable housing for diaspora returnees and local communities. Bridging the gap between diaspora investment and continental real estate.',
    location: 'Sao Paulo, Brazil',
    current_country: 'Brazil',
    current_city: 'Sao Paulo',
    primary_origin_country: 'BDI',
    profession: 'Real Estate Developer',
    industry: 'Real Estate',
    skills: ['real estate development', 'urban planning', 'investment structuring', 'project management'],
    interests: ['affordable housing', 'diaspora investment', 'urban development'],
    professional_sectors: ['Real Estate', 'Finance'],
  },
];

// ─── Seed Events ────────────────────────────────────────────────────────────

interface SeedEvent {
  title: string;
  description: string;
  format: 'virtual' | 'in_person' | 'hybrid';
  location: string;
  daysFromNow: number;
  pillar: string;
}

const SEED_EVENTS: SeedEvent[] = [
  {
    title: 'Pan-African Tech Summit 2026',
    description: 'A virtual gathering of tech leaders, founders, and developers from across the African diaspora. Three days of workshops, panels, and networking focused on building the next generation of African tech companies.',
    format: 'virtual',
    location: 'Online',
    daysFromNow: 30,
    pillar: 'convene',
  },
  {
    title: 'Diaspora Investor Networking Mixer',
    description: 'An exclusive in-person networking event for diaspora investors and African founders seeking Series A-B funding. Curated deal flow and one-on-one matching sessions.',
    format: 'in_person',
    location: 'Lagos, Nigeria',
    daysFromNow: 14,
    pillar: 'contribute',
  },
  {
    title: 'Afrobeats x Entrepreneurship',
    description: 'Where music meets business. A hybrid event exploring the intersection of African creative industries and entrepreneurship. Live performances, fireside chats, and startup showcases.',
    format: 'hybrid',
    location: 'London, UK',
    daysFromNow: 7,
    pillar: 'convey',
  },
  {
    title: 'Community Storytelling Night',
    description: 'An intimate virtual evening of storytelling from diaspora members sharing their journeys — the challenges, triumphs, and lessons of building bridges between continents.',
    format: 'virtual',
    location: 'Online',
    daysFromNow: 3,
    pillar: 'convey',
  },
  {
    title: 'Year-End Diaspora Gathering',
    description: 'Our annual celebration of diaspora achievements. A look back at the year, recognition of community contributors, and planning for what comes next.',
    format: 'virtual',
    location: 'Online',
    daysFromNow: -5,
    pillar: 'convene',
  },
  {
    title: 'African Women in Tech Leadership',
    description: 'A focused session for women leaders in tech across the diaspora. Mentorship pairing, leadership workshops, and honest conversations about navigating the industry.',
    format: 'virtual',
    location: 'Online',
    daysFromNow: 21,
    pillar: 'connect',
  },
  {
    title: 'Nairobi Design Week After-Party',
    description: 'Join diaspora creatives and designers for an after-party celebrating African design excellence. Networking, portfolio showcases, and collaborative project brainstorming.',
    format: 'in_person',
    location: 'Nairobi, Kenya',
    daysFromNow: 10,
    pillar: 'collaborate',
  },
  {
    title: 'Diaspora AgriTech Forum',
    description: 'Connecting diaspora agricultural innovators with continental farmers and investors. Focus on sustainable farming technology, supply chain optimization, and food security.',
    format: 'hybrid',
    location: 'Accra, Ghana',
    daysFromNow: 25,
    pillar: 'contribute',
  },
  {
    title: 'Heritage Preservation Film Screening',
    description: 'A past event showcasing documentaries about African cultural heritage preservation. Featuring discussions with filmmakers and historians from the diaspora.',
    format: 'virtual',
    location: 'Online',
    daysFromNow: -12,
    pillar: 'convey',
  },
];

// ─── Seed Spaces ────────────────────────────────────────────────────────────

interface SeedSpace {
  name: string;
  description: string;
  status: 'active' | 'stalled' | 'new';
  memberCount: number;
  taskCompletionPercent: number;
  daysSinceActivity: number;
}

const SEED_SPACES: SeedSpace[] = [
  {
    name: 'AfroTech Accelerator',
    description: 'A collaborative space for diaspora tech founders going through the accelerator program. Shared resources, peer mentorship, and milestone tracking.',
    status: 'active',
    memberCount: 6,
    taskCompletionPercent: 75,
    daysSinceActivity: 0,
  },
  {
    name: 'Diaspora Investment Fund',
    description: 'Coordinating the launch of a diaspora-led investment fund. Due diligence, legal structuring, and investor relations.',
    status: 'active',
    memberCount: 4,
    taskCompletionPercent: 40,
    daysSinceActivity: 1,
  },
  {
    name: 'Lagos-London Bridge',
    description: 'Building connections between Lagos and London tech ecosystems. Event coordination, talent exchange, and joint venture opportunities.',
    status: 'stalled',
    memberCount: 3,
    taskCompletionPercent: 15,
    daysSinceActivity: 10,
  },
  {
    name: 'Heritage Preservation Project',
    description: 'Documenting and preserving African cultural heritage through digital archives, oral histories, and community engagement.',
    status: 'new',
    memberCount: 2,
    taskCompletionPercent: 0,
    daysSinceActivity: 2,
  },
  {
    name: 'Pan-African Climate Alliance',
    description: 'Coordinating diaspora climate action initiatives. Research collaboration, policy advocacy, and community education on climate resilience.',
    status: 'stalled',
    memberCount: 5,
    taskCompletionPercent: 20,
    daysSinceActivity: 14,
  },
  {
    name: 'African Language AI Research',
    description: 'Collaborative research on NLP and AI tools for African languages. Dataset building, model training, and benchmarking.',
    status: 'active',
    memberCount: 7,
    taskCompletionPercent: 55,
    daysSinceActivity: 0,
  },
];

// ─── Seed Opportunities ─────────────────────────────────────────────────────

interface SeedOpportunity {
  title: string;
  description: string;
  type: 'need' | 'offer';
  category: string;
  skills: string[];
}

const SEED_OPPORTUNITIES: SeedOpportunity[] = [
  {
    title: 'Looking for a mobile developer with React Native experience',
    description: 'Our health tech startup needs a senior React Native developer to build our patient-facing mobile app. Remote-friendly, equity available.',
    type: 'need',
    category: 'talent',
    skills: ['react native', 'typescript', 'mobile development'],
  },
  {
    title: 'I can mentor early-stage founders in fintech',
    description: 'Available for 2-3 mentees. I have 8 years of experience in fintech, including time at Stripe and building my own payments company. Happy to help with product, fundraising, and go-to-market.',
    type: 'offer',
    category: 'mentorship',
    skills: ['fintech', 'fundraising', 'product strategy'],
  },
  {
    title: 'Seeking funding for African agriculture startup',
    description: 'Pre-seed stage AgriTech startup looking for $500K to scale our IoT-based farming solution across West Africa. 1,000+ farmers already onboarded.',
    type: 'need',
    category: 'funding',
    skills: ['agriculture', 'iot', 'impact investing'],
  },
  {
    title: 'Available for pro-bono legal consultation for diaspora orgs',
    description: 'Corporate attorney offering free legal consultations to diaspora-led non-profits and social enterprises. Specializing in cross-border compliance and entity structuring.',
    type: 'offer',
    category: 'services',
    skills: ['corporate law', 'compliance', 'non-profit law'],
  },
  {
    title: 'Need UX researcher for African consumer study',
    description: 'Looking for a UX researcher to conduct user research across 5 African markets. Understanding of local context essential. 3-month engagement.',
    type: 'need',
    category: 'talent',
    skills: ['ux research', 'user interviews', 'market research'],
  },
  {
    title: 'Offering design services for African startups',
    description: 'Creative director with 12+ years of experience. Offering discounted brand identity packages for African and diaspora startups. Portfolio available on request.',
    type: 'offer',
    category: 'services',
    skills: ['brand design', 'visual identity', 'design strategy'],
  },
  {
    title: 'Looking for a technical co-founder for EdTech venture',
    description: 'Former teacher building an AI-powered learning platform for African languages. Need a technical co-founder with ML/NLP experience. Equal equity split.',
    type: 'need',
    category: 'talent',
    skills: ['machine learning', 'nlp', 'python', 'startup'],
  },
  {
    title: 'Grant writing support available',
    description: 'Experienced grant writer with 90%+ success rate. Can help diaspora organizations write compelling proposals for international development funding.',
    type: 'offer',
    category: 'services',
    skills: ['grant writing', 'proposal development', 'fundraising'],
  },
  {
    title: 'Need marketing lead for pan-African product launch',
    description: 'Launching a consumer product across 3 African markets simultaneously. Need an experienced marketing lead who understands multi-market campaigns.',
    type: 'need',
    category: 'talent',
    skills: ['marketing strategy', 'product launch', 'african markets'],
  },
  {
    title: 'Offering data science workshops for African tech communities',
    description: 'Running free data science bootcamps for African developer communities. Looking for host organizations and co-facilitators across the continent.',
    type: 'offer',
    category: 'education',
    skills: ['data science', 'teaching', 'community building'],
  },
];

// ─── Seed Posts ──────────────────────────────────────────────────────────────

const SEED_POST_CONTENTS: string[] = [
  'Just wrapped up an incredible meeting with investors from the African diaspora in NYC. The appetite for investing back home has never been stronger. The key question: how do we create structures that make it easy for everyday diaspora members to invest, not just the ultra-wealthy?',
  'Launched our new feature today that lets farmers in rural Ghana check crop prices in real-time via SMS. No smartphone needed. Technology should meet people where they are.',
  'Hot take: The African tech ecosystem doesn\'t need more "Uber for X" startups. It needs infrastructure builders — the ones solving water, energy, logistics, and payments at scale.',
  'Attended the Nairobi Design Week and was blown away by the talent. African designers are not just keeping up with global trends — they\'re setting them. The Afrofuturist aesthetic is going mainstream.',
  'Reminder: If you\'re in the diaspora and have skills in law, accounting, or consulting, there are organizations on the continent that desperately need your expertise. Even a few hours a month can make a massive difference.',
  'Our team just hit a milestone: 10,000 students across 12 African countries learning math and science in their local languages through our app. Education shouldn\'t require you to first learn a colonial language.',
  'The AfCFTA is a game-changer, but only if the diaspora gets involved. We have the networks, the capital, and the market knowledge to make intra-African trade a reality. Who\'s building in this space?',
  'Spent the weekend mentoring young developers in Accra. The talent is absolutely there — what\'s missing is access to opportunities, not ability. Let\'s fix the access problem.',
  'Our research shows that diaspora remittances to Africa exceeded $100B last year, but less than 5% goes into productive investment. We need better channels for investment, not just consumption.',
  'Hiring! Looking for a community manager who understands the diaspora experience. Must be bilingual (French/English preferred). Remote-friendly. DM me if interested.',
  'Just published our report on AI readiness across African nations. Key finding: the biggest gap isn\'t technology — it\'s data. We need African-generated datasets to build AI that serves African needs.',
  'The power of diaspora networks: A connection I made on this platform led to a partnership that\'s now employing 50 people in Lagos. Never underestimate the ripple effect of a single introduction.',
  'Working on a documentary about African heritage preservation in the Caribbean. If you have stories about maintaining cultural traditions across generations, I\'d love to hear from you.',
  'Pro tip for diaspora entrepreneurs: Don\'t try to replicate Silicon Valley in Africa. Understand local context, build for local needs, and use global expertise as a complement, not a blueprint.',
  'Excited to announce our climate resilience initiative. Connecting diaspora climate scientists with communities in the Sahel region. Real solutions need real local knowledge combined with global expertise.',
  'The conversation about "giving back" to Africa needs to evolve. It\'s not charity — it\'s investment. The continent is the world\'s biggest growth opportunity, and the diaspora is uniquely positioned to lead.',
  'Just completed our first cohort of the diaspora founders accelerator. 12 startups, 8 countries, $2M in combined funding raised. This is what happens when you bet on your people.',
  'Building in public: Our payment solution processed its first cross-border transaction today. Lagos to London in under 30 seconds, at 1/10th the cost of traditional wire transfers.',
  'Shoutout to everyone who volunteered at the diaspora skills workshop in Johannesburg this weekend. 200+ attendees, 30+ mentors. Community in action.',
  'Question for the network: What\'s the single biggest barrier you face when trying to do business or invest in Africa from the diaspora? Drop your thoughts below.',
  'Our space just completed its first milestone: a comprehensive directory of diaspora-led organizations across 25 countries. Next step: turning this into a searchable platform.',
  'The future of African healthcare is telemedicine. With diaspora doctors and continental infrastructure, we can provide specialist care to communities that have never had access. This is what we\'re building.',
  'Attended a policy roundtable on diaspora engagement in Brussels. Key takeaway: governments are finally recognizing the diaspora as a development partner, not just a remittance source.',
  'Celebrating 5 years of our scholarship fund for African students. 150 students funded, 95% graduation rate, 80% working in Africa or serving African communities. Impact is generational.',
  'If you\'re a creative in the diaspora, your perspective is your superpower. You see both worlds. You translate between cultures. You bridge gaps that others don\'t even see. Own that.',
];

// ─── Seed Stories ───────────────────────────────────────────────────────────

const SEED_STORY_CONTENTS: string[] = [
  'From Lagos to Silicon Valley: How I built a fintech company that serves both worlds. This is the story of leaving a comfortable banking job in Nigeria, taking a leap of faith, and spending five years building payment rails that connect Africa to the global economy.',
  'The Day I Returned Home: After 15 years in the diaspora, I moved back to Accra. Here\'s what I found — a city transformed, a tech scene buzzing, and a generation that doesn\'t want to leave. My journey of rediscovery.',
  'Building While Black and African: Navigating the startup world as a diaspora founder. The double bind of being "too African" for Western investors and "too Western" for African markets. How I found my way.',
  'My Grandmother\'s Recipe Book: How a collection of handwritten recipes from a village in Senegal became a food-tech startup connecting African culinary traditions with the global market.',
  'The Bridge Builders: Stories from five diaspora members who are quietly building the infrastructure that connects Africa to the world — in logistics, payments, education, health, and culture.',
  'What the Diaspora Gets Wrong About Africa: An honest reflection on coming home with assumptions and leaving with humility. The continent doesn\'t need saving — it needs partnership.',
];

// ─── Seed Data Runner ───────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID();
}

function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function seedAlphaData(config: AlphaSeedConfig = DEFAULT_CONFIG): Promise<{
  success: boolean;
  profileIds: string[];
  eventIds: string[];
  spaceIds: string[];
  opportunityIds: string[];
  postIds: string[];
  storyIds: string[];
}> {
  const result = {
    success: false,
    profileIds: [] as string[],
    eventIds: [] as string[],
    spaceIds: [] as string[],
    opportunityIds: [] as string[],
    postIds: [] as string[],
    storyIds: [] as string[],
  };

  try {
    logger.info('SeedAlpha', 'Starting alpha seed data generation', config);

    // 1. Seed Profiles
    const profilesToInsert = SEED_PROFILES.slice(0, config.testUsers).map((p) => ({
      id: generateId(),
      full_name: p.full_name,
      first_name: p.first_name,
      last_name: p.last_name,
      username: p.username,
      headline: p.headline,
      bio: p.bio,
      location: p.location,
      current_country: p.current_country,
      current_city: p.current_city,
      primary_origin_country: p.primary_origin_country,
      profession: p.profession,
      industry: p.industry,
      skills: p.skills,
      interests: p.interests,
      professional_sectors: p.professional_sectors,
    }));

    const { data: insertedProfiles, error: profileError } = await supabase
      .from('profiles')
      .upsert(profilesToInsert, { onConflict: 'username' })
      .select('id');

    if (profileError) {
      logger.error('SeedAlpha', 'Failed to seed profiles', profileError);
      return result;
    }

    result.profileIds = (insertedProfiles ?? []).map((p) => p.id);
    logger.info('SeedAlpha', `Seeded ${result.profileIds.length} profiles`);

    // 2. Seed Connections
    if (result.profileIds.length > 1) {
      const connections: Array<{ user_id: string; connected_user_id: string; status: string }> = [];
      const shuffledIds = shuffleArray(result.profileIds);

      for (let i = 0; i < shuffledIds.length; i++) {
        const connectCount = Math.min(
          config.connectionDensity,
          shuffledIds.length - 1
        );
        for (let j = 1; j <= connectCount; j++) {
          const targetIdx = (i + j) % shuffledIds.length;
          const pair = [shuffledIds[i], shuffledIds[targetIdx]].sort();
          const exists = connections.some(
            (c) => c.user_id === pair[0] && c.connected_user_id === pair[1]
          );
          if (!exists) {
            connections.push({
              user_id: pair[0],
              connected_user_id: pair[1],
              status: 'accepted',
            });
          }
        }
      }

      const db = supabase as any;
      const mappedConnections = connections.slice(0, 60).map((c) => ({
        requester_id: c.user_id,
        recipient_id: c.connected_user_id,
        status: c.status,
      }));
      const { error: connError } = await db
        .from('connections')
        .upsert(mappedConnections);

      if (connError) {
        logger.warn('SeedAlpha', 'Failed to seed connections', connError);
      } else {
        logger.info('SeedAlpha', `Seeded ${Math.min(connections.length, 60)} connections`);
      }
    }

    // 3. Seed Events
    const eventsToInsert = SEED_EVENTS.slice(0, config.upcomingEvents + config.pastEvents).map((e) => ({
      id: generateId(),
      title: e.title,
      description: e.description,
      event_type: e.format as 'conference' | 'meetup' | 'workshop' | 'webinar' | 'social' | 'networking' | 'other',
      format: e.format === 'virtual' ? 'virtual' : e.format === 'in_person' ? 'in_person' : 'hybrid',
      location_name: e.location,
      start_time: daysFromNow(e.daysFromNow),
      end_time: daysFromNow(e.daysFromNow + 1),
      organizer_id: randomElement(result.profileIds),
      status: e.daysFromNow < 0 ? 'completed' : 'published',
    }));

    const { data: insertedEvents, error: eventError } = await (supabase as any)
      .from('events')
      .upsert(eventsToInsert)
      .select('id');

    if (eventError) {
      logger.warn('SeedAlpha', 'Failed to seed events', eventError);
    } else {
      result.eventIds = (insertedEvents ?? []).map((e) => e.id);
      logger.info('SeedAlpha', `Seeded ${result.eventIds.length} events`);
    }

    // 4. Seed Spaces
    const spacesToInsert = SEED_SPACES.slice(0, config.activeSpaces + config.stalledSpaces).map((s) => ({
      id: generateId(),
      title: s.name,
      description: s.description,
      created_by: randomElement(result.profileIds),
      status: s.status === 'stalled' ? 'active' : s.status,
      updated_at: daysFromNow(-s.daysSinceActivity),
    }));

    const { data: insertedSpaces, error: spaceError } = await (supabase as any)
      .from('collaboration_spaces')
      .upsert(spacesToInsert)
      .select('id');

    if (spaceError) {
      logger.warn('SeedAlpha', 'Failed to seed spaces', spaceError);
    } else {
      result.spaceIds = (insertedSpaces ?? []).map((s) => s.id);
      logger.info('SeedAlpha', `Seeded ${result.spaceIds.length} spaces`);
    }

    // 5. Seed Opportunities
    const opportunitiesToInsert = SEED_OPPORTUNITIES.slice(0, config.openOpportunities).map((o) => ({
      id: generateId(),
      title: o.title,
      description: o.description,
      type: o.type,
      tags: o.skills ?? [],
      created_by: randomElement(result.profileIds),
      status: 'active',
    }));

    const { data: insertedOpps, error: oppError } = await (supabase as any)
      .from('opportunities')
      .upsert(opportunitiesToInsert)
      .select('id');

    if (oppError) {
      logger.warn('SeedAlpha', 'Failed to seed opportunities', oppError);
    } else {
      result.opportunityIds = (insertedOpps ?? []).map((o) => o.id);
      logger.info('SeedAlpha', `Seeded ${result.opportunityIds.length} opportunities`);
    }

    // 6. Seed Posts
    const postsToInsert = SEED_POST_CONTENTS.slice(0, config.posts).map((content) => ({
      id: generateId(),
      content,
      author_id: randomElement(result.profileIds),
      post_type: 'post',
      privacy_level: 'public',
    }));

    const { data: insertedPosts, error: postError } = await (supabase as any)
      .from('posts')
      .upsert(postsToInsert)
      .select('id');

    if (postError) {
      logger.warn('SeedAlpha', 'Failed to seed posts', postError);
    } else {
      result.postIds = (insertedPosts ?? []).map((p) => p.id);
      logger.info('SeedAlpha', `Seeded ${result.postIds.length} posts`);
    }

    // 7. Seed Stories
    const storiesToInsert = SEED_STORY_CONTENTS.slice(0, config.stories).map((content) => ({
      id: generateId(),
      content,
      author_id: randomElement(result.profileIds),
      post_type: 'story',
      privacy_level: 'public',
    }));

    const { data: insertedStories, error: storyError } = await (supabase as any)
      .from('posts')
      .upsert(storiesToInsert)
      .select('id');

    if (storyError) {
      logger.warn('SeedAlpha', 'Failed to seed stories', storyError);
    } else {
      result.storyIds = (insertedStories ?? []).map((s) => s.id);
      logger.info('SeedAlpha', `Seeded ${result.storyIds.length} stories`);
    }

    result.success = true;
    logger.info('SeedAlpha', 'Alpha seed data generation complete', {
      profiles: result.profileIds.length,
      events: result.eventIds.length,
      spaces: result.spaceIds.length,
      opportunities: result.opportunityIds.length,
      posts: result.postIds.length,
      stories: result.storyIds.length,
    });
  } catch (err) {
    logger.error('SeedAlpha', 'Unexpected error during seeding', err);
  }

  return result;
}

export { DEFAULT_CONFIG as ALPHA_SEED_CONFIG, SEED_PROFILES, SEED_EVENTS, SEED_SPACES, SEED_OPPORTUNITIES };
