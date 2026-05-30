/**
 * DNA Platform - Test Profile Data
 *
 * 5 fully seeded test profiles representing African Diaspora members and allies.
 * Each profile includes 100% of supported profile components.
 *
 * NON-PRODUCTION: All profiles marked with is_seeded = true and is_test_account = true
 */

import { TEST_PROFILE_IDS } from '../constants';

// Sample avatar URLs (using placeholder images)
const AVATARS = {
  AMARA: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop',
  KWAME: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
  FATIMA: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=400&h=400&fit=crop',
  DAVID: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
  ZARA: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
};

// Sample banner URLs
const BANNERS = {
  FINTECH: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&h=400&fit=crop',
  ENERGY: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&h=400&fit=crop',
  CULTURE: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&h=400&fit=crop',
  HEALTH: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=400&fit=crop',
  EDUCATION: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=400&fit=crop',
};

export interface TestProfile {
  id: string;
  username: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  display_name: string;
  headline: string;
  professional_role: string;
  company: string;
  bio: string;
  intro_text: string;
  avatar_url: string;
  banner_url: string;
  location: string;
  current_city: string;
  current_country: string;
  country_of_origin: string;
  diaspora_status: string;
  diaspora_networks: string[];
  ethnic_heritage: string[];
  african_causes: string[];
  engagement_intentions: string[];
  return_intentions: string;
  africa_visit_frequency: string;
  profession: string;
  industry: string;
  years_experience: number;
  skills: string[];
  interests: string[];
  impact_areas: string[];
  focus_areas: string[];
  regional_expertise: string[];
  mentorship_areas: string[];
  available_for: string[];
  professional_sectors: string[];
  industries: string[];
  languages: string[];
  website_url: string;
  linkedin_url: string;
  twitter_url: string;
  instagram_url: string;
  github_url: string | null;
  intro_video_url: string | null;
  user_type: string;
  selected_pillars: string[];
  verification_status: string;
  is_public: boolean;
  is_seeded: boolean;
  is_test_account: boolean;
  auto_connect_enabled: boolean;
  onboarding_completed: boolean;
  profile_completeness_score: number;
  agrees_to_values: boolean;
}

export const testProfiles: TestProfile[] = [
  // ============================================================
  // PROFILE 1: AMARA OKONKWO - Fintech Entrepreneur (Nigeria)
  // ============================================================
  {
    id: TEST_PROFILE_IDS.AMARA_FINTECH,
    username: 'amara_okonkwo',
    email: 'amara.test@dna-platform.test',
    full_name: 'Amara Okonkwo',
    first_name: 'Amara',
    last_name: 'Okonkwo',
    display_name: 'Amara Okonkwo',
    headline: 'Building Financial Inclusion for African Communities | Fintech Founder | Impact Investor',
    professional_role: 'CEO & Co-founder',
    company: 'AfriPay Technologies',
    bio: `Passionate fintech entrepreneur with 10+ years of experience building payment solutions that bridge the financial gap between the African diaspora and their home communities.

After witnessing my grandmother struggle to receive remittances in rural Nigeria, I founded AfriPay to create seamless, affordable cross-border payment solutions. Today, we serve over 500,000 users across 15 African countries.

I believe financial inclusion is the foundation for sustainable development in Africa. Through AfriPay, we've reduced remittance fees by 70% and enabled micro-investments that are transforming communities.

When I'm not building products, I mentor young African entrepreneurs and invest in early-stage startups focused on financial services and agricultural technology.`,
    intro_text: 'Building the future of African financial services from London. Always excited to connect with fellow entrepreneurs working on impact-driven solutions for our communities.',
    avatar_url: AVATARS.AMARA,
    banner_url: BANNERS.FINTECH,
    location: 'London, United Kingdom',
    current_city: 'London',
    current_country: 'United Kingdom',
    country_of_origin: 'Nigeria',
    diaspora_status: 'First-Gen',
    diaspora_networks: ['Nigeria', 'West Africa', 'UK African Diaspora'],
    ethnic_heritage: ['Igbo', 'Nigerian'],
    african_causes: ['Financial Inclusion', 'Youth Entrepreneurship', 'Digital Infrastructure'],
    engagement_intentions: ['Mentorship', 'Investment', 'Partnerships'],
    return_intentions: 'Planning to relocate back within 5 years',
    africa_visit_frequency: '4-6 times per year',
    profession: 'Entrepreneur',
    industry: 'Financial Technology',
    years_experience: 10,
    skills: ['Fintech', 'Product Strategy', 'Fundraising', 'Team Leadership', 'Cross-border Payments', 'Mobile Money', 'Financial Modeling', 'Regulatory Compliance'],
    interests: ['African Innovation', 'Financial Inclusion', 'Mentorship', 'Tech Policy', 'Angel Investing', 'Women in Tech'],
    impact_areas: ['Financial Inclusion', 'Economic Empowerment', 'Technology Access'],
    focus_areas: ['Mobile Payments', 'Remittances', 'Micro-investments'],
    regional_expertise: ['West Africa', 'East Africa', 'United Kingdom'],
    mentorship_areas: ['Startup Fundraising', 'Product Development', 'Fintech Regulations'],
    available_for: ['Mentoring', 'Speaking', 'Advisory', 'Investing'],
    professional_sectors: ['Fintech', 'Financial Services', 'Technology'],
    industries: ['Financial Technology', 'Banking', 'Payments'],
    languages: ['English', 'Igbo', 'Yoruba', 'French'],
    website_url: 'https://afripay-tech.example.com',
    linkedin_url: 'https://linkedin.com/in/amaraokonkwo-test',
    twitter_url: 'https://twitter.com/amara_fintech_test',
    instagram_url: 'https://instagram.com/amara_okonkwo_test',
    github_url: null,
    intro_video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    user_type: 'founder',
    selected_pillars: ['collaborate', 'contribute'],
    verification_status: 'soft_verified',
    is_public: true,
    is_seeded: true,
    is_test_account: true,
    auto_connect_enabled: true,
    onboarding_completed: true,
    profile_completeness_score: 100,
    agrees_to_values: true,
  },

  // ============================================================
  // PROFILE 2: DR. KWAME ASANTE - Clean Energy Researcher (Ghana)
  // ============================================================
  {
    id: TEST_PROFILE_IDS.KWAME_ENERGY,
    username: 'dr_kwame_asante',
    email: 'kwame.test@dna-platform.test',
    full_name: 'Dr. Kwame Asante',
    first_name: 'Kwame',
    last_name: 'Asante',
    display_name: 'Dr. Kwame Asante',
    headline: 'Renewable Energy Researcher | Solar Technology Expert | Sustainable Development Advocate',
    professional_role: 'Senior Research Scientist',
    company: 'University of Toronto Energy Institute',
    bio: `Award-winning research scientist specializing in renewable energy solutions tailored for African markets. With 15+ years of experience and 25 published papers, my work focuses on developing affordable solar technology for rural electrification.

Born in Kumasi, Ghana, I've witnessed firsthand how lack of electricity limits opportunities. This drives my research on low-cost solar solutions that can power schools, health clinics, and small businesses across Africa.

My recent breakthrough in solar panel efficiency has reduced costs by 40% while improving durability for tropical climates. Currently leading a $5M research project funded by the Gates Foundation to deploy this technology across Ghana and Kenya.

I'm passionate about training the next generation of African scientists and regularly host research interns from universities across the continent.`,
    intro_text: 'Dedicated to developing clean energy solutions that can transform African communities. Looking to collaborate on research and implementation projects.',
    avatar_url: AVATARS.KWAME,
    banner_url: BANNERS.ENERGY,
    location: 'Toronto, Canada',
    current_city: 'Toronto',
    current_country: 'Canada',
    country_of_origin: 'Ghana',
    diaspora_status: 'First-Gen',
    diaspora_networks: ['Ghana', 'West Africa', 'Canadian African Diaspora'],
    ethnic_heritage: ['Akan', 'Ghanaian'],
    african_causes: ['Climate Change', 'Rural Electrification', 'STEM Education'],
    engagement_intentions: ['Research Collaboration', 'Technology Transfer', 'Mentorship'],
    return_intentions: 'Planning split time between Canada and Ghana',
    africa_visit_frequency: '3-4 times per year',
    profession: 'Research Scientist',
    industry: 'Clean Energy',
    years_experience: 15,
    skills: ['Solar Technology', 'Research & Development', 'Grant Writing', 'Data Analysis', 'Project Management', 'Technical Writing', 'Lab Management', 'Policy Analysis'],
    interests: ['Climate Change', 'Sustainable Development', 'Education', 'Policy Advocacy', 'Youth Mentorship', 'Technology Transfer'],
    impact_areas: ['Climate Action', 'Energy Access', 'Education'],
    focus_areas: ['Solar Energy', 'Rural Electrification', 'Sustainable Technology'],
    regional_expertise: ['Ghana', 'Kenya', 'West Africa', 'East Africa'],
    mentorship_areas: ['Research Methodology', 'Grant Writing', 'Academic Publishing'],
    available_for: ['Research Collaboration', 'Speaking', 'Consulting', 'Mentoring'],
    professional_sectors: ['Clean Energy', 'Academia', 'Research'],
    industries: ['Renewable Energy', 'Higher Education', 'Climate Tech'],
    languages: ['English', 'Twi', 'French'],
    website_url: 'https://kwameasante-research.example.com',
    linkedin_url: 'https://linkedin.com/in/drkwameasante-test',
    twitter_url: 'https://twitter.com/kwame_energy_test',
    instagram_url: 'https://instagram.com/dr_kwame_test',
    github_url: 'https://github.com/kwame-energy-test',
    intro_video_url: null,
    user_type: 'professional',
    selected_pillars: ['contribute', 'connect'],
    verification_status: 'fully_verified',
    is_public: true,
    is_seeded: true,
    is_test_account: true,
    auto_connect_enabled: true,
    onboarding_completed: true,
    profile_completeness_score: 100,
    agrees_to_values: true,
  },

  // ============================================================
  // PROFILE 3: FATIMA DIALLO - Cultural Entrepreneur (Senegal)
  // ============================================================
  {
    id: TEST_PROFILE_IDS.FATIMA_CULTURE,
    username: 'fatima_diallo',
    email: 'fatima.test@dna-platform.test',
    full_name: 'Fatima Diallo',
    first_name: 'Fatima',
    last_name: 'Diallo',
    display_name: 'Fatima Diallo',
    headline: 'Creative Director | African Art Curator | Cultural Entrepreneur | Building Bridges Through Art',
    professional_role: 'Creative Director & Founder',
    company: 'Afrique Moderne Gallery',
    bio: `Creative director and cultural entrepreneur on a mission to bring African contemporary art to global audiences. Founder of Afrique Moderne, a gallery network with locations in Paris, Dakar, and soon, New York.

Born in Saint-Louis, Senegal, I grew up surrounded by the vibrant artistic traditions of West Africa. After studying art history at the Sorbonne, I realized that African artists were severely underrepresented in the global art market.

Over the past 12 years, I've curated 50+ exhibitions featuring emerging and established African artists, generating over 10M in sales and helping launch the careers of 100+ artists from across the continent.

My newest initiative, the African Creators Fund, provides grants and mentorship to young African artists and artisans, helping them build sustainable creative businesses.`,
    intro_text: 'Bridging African creativity with global audiences. Passionate about empowering the next generation of African artists and creatives.',
    avatar_url: AVATARS.FATIMA,
    banner_url: BANNERS.CULTURE,
    location: 'Paris, France',
    current_city: 'Paris',
    current_country: 'France',
    country_of_origin: 'Senegal',
    diaspora_status: 'First-Gen',
    diaspora_networks: ['Senegal', 'West Africa', 'French African Diaspora'],
    ethnic_heritage: ['Wolof', 'Senegalese'],
    african_causes: ['Cultural Preservation', 'Youth Empowerment', 'Creative Economy'],
    engagement_intentions: ['Artist Partnerships', 'Cultural Exchange', 'Investment'],
    return_intentions: 'Maintaining dual presence',
    africa_visit_frequency: '6+ times per year',
    profession: 'Cultural Entrepreneur',
    industry: 'Arts & Culture',
    years_experience: 12,
    skills: ['Creative Direction', 'Art Curation', 'Cultural Programming', 'Community Building', 'Event Production', 'Brand Development', 'Fundraising', 'Artist Management'],
    interests: ['African Art', 'Cultural Preservation', 'Youth Mentorship', 'Creative Economy', 'Fashion', 'Design'],
    impact_areas: ['Cultural Preservation', 'Economic Empowerment', 'Youth Development'],
    focus_areas: ['Contemporary Art', 'Cultural Exchange', 'Artist Development'],
    regional_expertise: ['Senegal', 'West Africa', 'France', 'North America'],
    mentorship_areas: ['Art Business', 'Gallery Management', 'Cultural Entrepreneurship'],
    available_for: ['Collaboration', 'Speaking', 'Exhibitions', 'Cultural Consulting'],
    professional_sectors: ['Arts & Culture', 'Creative Industries', 'Non-profit'],
    industries: ['Fine Art', 'Galleries', 'Cultural Organizations'],
    languages: ['French', 'Wolof', 'English', 'Arabic'],
    website_url: 'https://afriquemoderne.example.com',
    linkedin_url: 'https://linkedin.com/in/fatimadiallo-test',
    twitter_url: 'https://twitter.com/fatima_culture_test',
    instagram_url: 'https://instagram.com/fatima_diallo_art_test',
    github_url: null,
    intro_video_url: 'https://vimeo.com/test-video-fatima',
    user_type: 'founder',
    selected_pillars: ['connect', 'contribute'],
    verification_status: 'soft_verified',
    is_public: true,
    is_seeded: true,
    is_test_account: true,
    auto_connect_enabled: true,
    onboarding_completed: true,
    profile_completeness_score: 100,
    agrees_to_values: true,
  },

  // ============================================================
  // PROFILE 4: DAVID MWANGI - Healthcare Innovator (Kenya)
  // ============================================================
  {
    id: TEST_PROFILE_IDS.DAVID_HEALTH,
    username: 'david_mwangi',
    email: 'david.test@dna-platform.test',
    full_name: 'David Mwangi',
    first_name: 'David',
    last_name: 'Mwangi',
    display_name: 'David Mwangi',
    headline: 'Healthcare Innovation Consultant | Digital Health Pioneer | Former WHO Program Manager',
    professional_role: 'Healthcare Innovation Consultant',
    company: 'HealthBridge Africa Consulting',
    bio: `Healthcare innovation consultant with 18 years of experience transforming healthcare delivery systems across Africa. Former WHO program manager who led the implementation of digital health initiatives reaching 20 million people.

Growing up in Nairobi, I saw how healthcare access could mean the difference between life and death. This drove me to pursue medicine and public health, eventually leading to roles at WHO and various ministries of health across East Africa.

In 2020, I founded HealthBridge Africa to help governments and organizations implement sustainable digital health solutions. Our telemedicine platform now serves 500+ rural health facilities in Kenya, Uganda, and Tanzania.

I'm particularly passionate about maternal and child health, having designed programs that reduced maternal mortality by 30% in pilot regions.`,
    intro_text: 'Working to revolutionize healthcare delivery across Africa through innovative digital solutions and policy reform. Let\'s connect and collaborate!',
    avatar_url: AVATARS.DAVID,
    banner_url: BANNERS.HEALTH,
    location: 'Berlin, Germany',
    current_city: 'Berlin',
    current_country: 'Germany',
    country_of_origin: 'Kenya',
    diaspora_status: 'First-Gen',
    diaspora_networks: ['Kenya', 'East Africa', 'German African Diaspora'],
    ethnic_heritage: ['Kikuyu', 'Kenyan'],
    african_causes: ['Healthcare Access', 'Maternal Health', 'Digital Infrastructure'],
    engagement_intentions: ['Consulting', 'Partnerships', 'Knowledge Sharing'],
    return_intentions: 'Regular engagement, potential relocation in 5+ years',
    africa_visit_frequency: '5-7 times per year',
    profession: 'Healthcare Consultant',
    industry: 'Healthcare Technology',
    years_experience: 18,
    skills: ['Digital Health', 'Program Management', 'Policy Development', 'Stakeholder Engagement', 'Healthcare Systems', 'Telemedicine', 'Data Analytics', 'Grant Management'],
    interests: ['Global Health', 'Healthcare Access', 'Digital Innovation', 'Policy Reform', 'Maternal Health', 'Health Equity'],
    impact_areas: ['Healthcare Access', 'Maternal Health', 'Digital Health'],
    focus_areas: ['Telemedicine', 'Health Policy', 'mHealth Solutions'],
    regional_expertise: ['Kenya', 'East Africa', 'Sub-Saharan Africa', 'Germany'],
    mentorship_areas: ['Healthcare Management', 'WHO Career Paths', 'Health Tech Startups'],
    available_for: ['Consulting', 'Advisory', 'Speaking', 'Partnerships'],
    professional_sectors: ['Healthcare', 'Technology', 'International Development'],
    industries: ['Healthcare Technology', 'Public Health', 'Consulting'],
    languages: ['English', 'Swahili', 'German', 'French'],
    website_url: 'https://healthbridge-africa.example.com',
    linkedin_url: 'https://linkedin.com/in/davidmwangi-test',
    twitter_url: 'https://twitter.com/david_health_test',
    instagram_url: 'https://instagram.com/david_mwangi_test',
    github_url: null,
    intro_video_url: null,
    user_type: 'professional',
    selected_pillars: ['contribute', 'collaborate'],
    verification_status: 'fully_verified',
    is_public: true,
    is_seeded: true,
    is_test_account: true,
    auto_connect_enabled: true,
    onboarding_completed: true,
    profile_completeness_score: 100,
    agrees_to_values: true,
  },

  // ============================================================
  // PROFILE 5: ZARA TEMBA - EdTech Innovator (South Africa)
  // ============================================================
  {
    id: TEST_PROFILE_IDS.ZARA_EDUCATION,
    username: 'zara_temba',
    email: 'zara.test@dna-platform.test',
    full_name: 'Zara Temba',
    first_name: 'Zara',
    last_name: 'Temba',
    display_name: 'Zara Temba',
    headline: 'EdTech Founder | MIT PhD Candidate | Democratizing Education Across Africa',
    professional_role: 'Founder & PhD Candidate',
    company: 'LearnAfrica Platform / MIT',
    bio: `EdTech entrepreneur and MIT PhD candidate building the future of education for African youth. Founder of LearnAfrica, a mobile-first learning platform that has reached 2 million students across 10 African countries.

Born in Soweto, South Africa, I was one of the lucky ones who had access to quality education. But I saw too many of my peers fall behind due to lack of resources. This inequality drives everything I do.

At MIT, I'm researching adaptive learning algorithms that can personalize education for students with varying backgrounds and resources. My goal is to create technology that makes quality education accessible to every child in Africa, regardless of their circumstances.

LearnAfrica has partnered with 500+ schools and provides free content in 12 African languages. We've also trained 5,000+ teachers in digital pedagogy.`,
    intro_text: 'Passionate about solving education access challenges across Africa. Always eager to learn from experienced professionals and find research collaborations.',
    avatar_url: AVATARS.ZARA,
    banner_url: BANNERS.EDUCATION,
    location: 'Boston, USA',
    current_city: 'Boston',
    current_country: 'United States',
    country_of_origin: 'South Africa',
    diaspora_status: 'First-Gen',
    diaspora_networks: ['South Africa', 'Southern Africa', 'US African Diaspora'],
    ethnic_heritage: ['Zulu', 'South African'],
    african_causes: ['Education Access', 'Digital Literacy', 'Youth Empowerment'],
    engagement_intentions: ['Research Collaboration', 'Partnerships', 'Fundraising'],
    return_intentions: 'Definite return after PhD completion',
    africa_visit_frequency: '2-3 times per year',
    profession: 'Entrepreneur & Researcher',
    industry: 'Education Technology',
    years_experience: 5,
    skills: ['EdTech', 'Machine Learning', 'Mobile Development', 'User Experience Design', 'Research', 'Product Management', 'Curriculum Development', 'Data Science'],
    interests: ['Educational Access', 'Digital Learning', 'Teacher Empowerment', 'Youth Development', 'AI in Education', 'Social Entrepreneurship'],
    impact_areas: ['Education', 'Digital Literacy', 'Youth Development'],
    focus_areas: ['Adaptive Learning', 'Mobile Education', 'Teacher Training'],
    regional_expertise: ['South Africa', 'Southern Africa', 'Pan-African'],
    mentorship_areas: ['EdTech Startups', 'PhD Applications', 'Social Entrepreneurship'],
    available_for: ['Collaboration', 'Research Partnerships', 'Speaking', 'Mentoring'],
    professional_sectors: ['Education', 'Technology', 'Social Enterprise'],
    industries: ['Education Technology', 'Higher Education', 'Software'],
    languages: ['English', 'Zulu', 'Xhosa', 'Afrikaans'],
    website_url: 'https://learnafrica.example.com',
    linkedin_url: 'https://linkedin.com/in/zaratemba-test',
    twitter_url: 'https://twitter.com/zara_edtech_test',
    instagram_url: 'https://instagram.com/zara_temba_test',
    github_url: 'https://github.com/zara-edtech-test',
    intro_video_url: 'https://www.youtube.com/watch?v=test-zara-intro',
    user_type: 'founder',
    selected_pillars: ['connect', 'contribute'],
    verification_status: 'soft_verified',
    is_public: true,
    is_seeded: true,
    is_test_account: true,
    auto_connect_enabled: true,
    onboarding_completed: true,
    profile_completeness_score: 100,
    agrees_to_values: true,
  },
];

export default testProfiles;
