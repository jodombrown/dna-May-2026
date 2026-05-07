-- ============================================
-- DNA ALPHA SEED DATA (Comprehensive)
-- Run in Supabase SQL Editor
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. Create 18 auth users via Supabase Dashboard > Authentication > Users > Add User
--    Emails: alpha1@dna-test.com through alpha18@dna-test.com
--    Password: AlphaTest2026!
-- 2. Copy the generated UUIDs into the variables below
-- 3. Run this script in the SQL Editor
--
-- This script is idempotent — it checks for existing seed data first.

-- ============================================
-- GUARD: Prevent double-seeding
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM profiles WHERE full_name = 'Amara Diallo') THEN
    RAISE EXCEPTION 'Seed data already exists. Delete existing seed data first.';
  END IF;
END $$;

-- ============================================
-- REPLACE THESE WITH ACTUAL AUTH USER UUIDs
-- ============================================
-- After creating users in Supabase Auth, paste their IDs here:
-- Then find-and-replace in this file.

-- USER_01 = (paste UUID for alpha1@dna-test.com)
-- USER_02 = (paste UUID for alpha2@dna-test.com)
-- ... through USER_18

-- ============================================
-- PROFILES (18 users) — UPDATE existing auth-created rows
-- ============================================

-- PROFILE 1: Amara Diallo — Senegalese-American, Fintech, NYC
UPDATE profiles SET
  full_name = 'Amara Diallo',
  headline = 'Fintech Founder | Building bridges between Wall Street and Dakar',
  bio = 'Born in Dakar, raised in Brooklyn. Building payment infrastructure that connects diaspora remittances to investment opportunities across West Africa.',
  location = 'New York, NY',
  current_country_name = 'United States',
  country_of_origin = 'Senegal',
  skills = ARRAY['Fintech', 'Investment Banking', 'Blockchain', 'Product Strategy', 'Fundraising'],
  interests = ARRAY['Financial Inclusion', 'West Africa', 'Venture Capital', 'Diaspora Investing'],
  industry = 'Finance & Technology',
  profile_completion_score = 95
WHERE email = 'alpha1@dna-test.com';

-- PROFILE 2: Nneka Okafor — Nigerian-British, HealthTech, London
UPDATE profiles SET
  full_name = 'Nneka Okafor',
  headline = 'HealthTech PM @ NHS Digital | Healthcare access in Africa',
  bio = 'Product manager building digital health solutions. Grew up in Lagos, studied at Imperial College. Focused on telemedicine models that can scale across Sub-Saharan Africa.',
  location = 'London, UK',
  current_country_name = 'United Kingdom',
  country_of_origin = 'Nigeria',
  skills = ARRAY['Product Management', 'Healthcare', 'Telemedicine', 'User Research', 'Agile'],
  interests = ARRAY['HealthTech', 'Nigeria', 'Digital Health', 'Maternal Health'],
  industry = 'Healthcare & Technology',
  profile_completion_score = 90
WHERE email = 'alpha2@dna-test.com';

-- PROFILE 3: Kwame Asante — Ghanaian, AgTech, Accra
UPDATE profiles SET
  full_name = 'Kwame Asante',
  headline = 'AgTech Entrepreneur | Feeding Africa through technology',
  bio = 'Third-generation farmer turned tech entrepreneur. Building precision agriculture tools for smallholder farmers in Ghana and Cote d''Ivoire.',
  location = 'Accra, Ghana',
  current_country_name = 'Ghana',
  country_of_origin = 'Ghana',
  skills = ARRAY['Agriculture', 'IoT', 'Machine Learning', 'Supply Chain', 'Rural Development'],
  interests = ARRAY['AgTech', 'Food Security', 'Climate Adaptation', 'West Africa'],
  industry = 'Agriculture & Technology',
  profile_completion_score = 85
WHERE email = 'alpha3@dna-test.com';

-- PROFILE 4: Fatou Sow — Senegalese-French, Education, Paris
UPDATE profiles SET
  full_name = 'Fatou Sow',
  headline = 'EdTech Director | Reimagining African education',
  bio = 'Leading education initiatives between France and Francophone Africa. Expertise in curriculum design, digital literacy, and teacher training.',
  location = 'Paris, France',
  current_country_name = 'France',
  country_of_origin = 'Senegal',
  skills = ARRAY['Education', 'Curriculum Design', 'EdTech', 'Program Management'],
  interests = ARRAY['Education', 'Francophone Africa', 'Digital Literacy', 'Youth Development'],
  industry = 'Education',
  profile_completion_score = 88
WHERE email = 'alpha4@dna-test.com';

-- PROFILE 5: Tendai Moyo — Zimbabwean-South African, Creative Arts, Johannesburg
UPDATE profiles SET
  full_name = 'Tendai Moyo',
  headline = 'Creative Director | Afrofuturist storytelling meets brand strategy',
  bio = 'Award-winning creative director at the intersection of African art and global brand identity. Co-founder of Joburg Creative Collective.',
  location = 'Johannesburg, South Africa',
  current_country_name = 'South Africa',
  country_of_origin = 'Zimbabwe',
  skills = ARRAY['Brand Strategy', 'Creative Direction', 'Visual Design', 'Storytelling'],
  interests = ARRAY['Afrofuturism', 'Creative Economy', 'Southern Africa', 'Design Thinking'],
  industry = 'Creative Arts & Media',
  profile_completion_score = 92
WHERE email = 'alpha5@dna-test.com';

-- PROFILE 6: Abdi Hassan — Somali-Canadian, Logistics, Toronto
UPDATE profiles SET
  full_name = 'Abdi Hassan',
  headline = 'Logistics & Trade | East African supply chains to North America',
  bio = 'Supply chain specialist building trade corridors between East Africa and Canada.',
  location = 'Toronto, Canada',
  current_country_name = 'Canada',
  country_of_origin = 'Somalia',
  skills = ARRAY['Logistics', 'International Trade', 'Supply Chain', 'Import/Export'],
  interests = ARRAY['Trade', 'East Africa', 'Diaspora Business', 'Cross-border Commerce'],
  industry = 'Trade & Logistics',
  profile_completion_score = 78
WHERE email = 'alpha6@dna-test.com';

-- PROFILE 7: Zara Ibrahim — Ethiopian-American, Policy, Washington DC
UPDATE profiles SET
  full_name = 'Zara Ibrahim',
  headline = 'Policy Advisor | African development meets Capitol Hill',
  bio = 'Policy advisor focused on US-Africa trade relations and diaspora engagement policy. Former USAID. Georgetown MPP.',
  location = 'Washington, DC',
  current_country_name = 'United States',
  country_of_origin = 'Ethiopia',
  skills = ARRAY['Policy Analysis', 'Government Relations', 'International Development', 'Trade Policy'],
  interests = ARRAY['US-Africa Policy', 'AGOA', 'Digital Economy', 'Horn of Africa'],
  industry = 'Policy & Government',
  profile_completion_score = 82
WHERE email = 'alpha7@dna-test.com';

-- PROFILE 8: Kofi Mensah — Ghanaian-American, Real Estate, Atlanta
UPDATE profiles SET
  full_name = 'Kofi Mensah',
  headline = 'Real Estate Developer | Diaspora investment vehicles for African property',
  bio = 'Developing fractional ownership platforms for diaspora real estate investment in Ghana and Kenya. Morehouse alum.',
  location = 'Atlanta, GA',
  current_country_name = 'United States',
  country_of_origin = 'Ghana',
  skills = ARRAY['Real Estate', 'Investment', 'Property Development', 'Community Building'],
  interests = ARRAY['Real Estate', 'Diaspora Investing', 'Ghana', 'Kenya'],
  industry = 'Real Estate & Investment',
  profile_completion_score = 75
WHERE email = 'alpha8@dna-test.com';

-- PROFILE 9: Aisha Kamara — Sierra Leonean-British, Legal, London
UPDATE profiles SET
  full_name = 'Aisha Kamara',
  headline = 'Corporate Lawyer | Pro-bono legal support for African startups',
  bio = 'Senior associate at Clifford Chance. Pro-bono legal clinic for African founders navigating UK/EU incorporation.',
  location = 'London, UK',
  current_country_name = 'United Kingdom',
  country_of_origin = 'Sierra Leone',
  skills = ARRAY['Corporate Law', 'IP Law', 'Cross-border Contracts', 'Startup Legal'],
  interests = ARRAY['Legal Tech', 'Startup Ecosystem', 'Sierra Leone', 'Pro Bono'],
  industry = 'Legal',
  profile_completion_score = 80
WHERE email = 'alpha9@dna-test.com';

-- PROFILE 10: Jean-Pierre Nkurunziza — Burundian-Belgian, Data Science, Brussels
UPDATE profiles SET
  full_name = 'Jean-Pierre Nkurunziza',
  headline = 'Data Scientist | AI for African development metrics',
  bio = 'Building ML models to track development outcomes across East Africa. PhD from KU Leuven.',
  location = 'Brussels, Belgium',
  current_country_name = 'Belgium',
  country_of_origin = 'Burundi',
  skills = ARRAY['Data Science', 'Machine Learning', 'Python', 'Statistics'],
  interests = ARRAY['AI for Africa', 'Data Sovereignty', 'East Africa', 'Research'],
  industry = 'Technology & Research',
  profile_completion_score = 70
WHERE email = 'alpha10@dna-test.com';

-- PROFILE 11: Chiamaka Eze — Nigerian-American, Marketing, Houston
UPDATE profiles SET
  full_name = 'Chiamaka Eze',
  headline = 'Growth Marketer | Scaling African brands to global audiences',
  bio = 'Growth marketing lead for 3 African consumer brands entering the US market.',
  location = 'Houston, TX',
  current_country_name = 'United States',
  country_of_origin = 'Nigeria',
  skills = ARRAY['Digital Marketing', 'Growth Strategy', 'Brand Positioning', 'Social Media'],
  interests = ARRAY['African Brands', 'Consumer Products', 'Influencer Marketing'],
  industry = 'Marketing & Branding',
  profile_completion_score = 85
WHERE email = 'alpha11@dna-test.com';

-- PROFILE 12: Mamadou Bah — Guinean, Mobile Dev, Conakry
UPDATE profiles SET
  full_name = 'Mamadou Bah',
  headline = 'Mobile Developer | Building apps for Africa, from Africa',
  bio = 'Lead mobile developer. Specializing in offline-first mobile apps for low-connectivity environments.',
  location = 'Conakry, Guinea',
  current_country_name = 'Guinea',
  country_of_origin = 'Guinea',
  skills = ARRAY['React Native', 'Flutter', 'Mobile Development', 'TypeScript'],
  interests = ARRAY['Mobile Tech', 'Francophone Africa', 'Developer Community'],
  industry = 'Technology',
  profile_completion_score = 72
WHERE email = 'alpha12@dna-test.com';

-- PROFILE 13: Priya Naidoo — South African-Indian, Social Enterprise, Durban
UPDATE profiles SET
  full_name = 'Priya Naidoo',
  headline = 'Social Entrepreneur | Youth employability through digital skills',
  bio = 'Founder of a nonprofit training 5,000+ young South Africans in digital skills annually.',
  location = 'Durban, South Africa',
  current_country_name = 'South Africa',
  country_of_origin = 'South Africa',
  skills = ARRAY['Social Enterprise', 'Youth Development', 'Digital Skills Training', 'Partnerships'],
  interests = ARRAY['Youth Employment', 'Digital Skills', 'Southern Africa', 'Social Impact'],
  industry = 'Social Enterprise',
  profile_completion_score = 88
WHERE email = 'alpha13@dna-test.com';

-- PROFILE 14: Omar Diop — Senegalese, Music/Culture, Dakar
UPDATE profiles SET
  full_name = 'Omar Diop',
  headline = 'Music Producer & Cultural Curator',
  bio = 'Grammy-nominated music producer. Curating cultural exchange programs between Dakar, Lagos, and Atlanta.',
  location = 'Dakar, Senegal',
  current_country_name = 'Senegal',
  country_of_origin = 'Senegal',
  skills = ARRAY['Music Production', 'Cultural Curation', 'Event Management', 'IP Management'],
  interests = ARRAY['Afrobeats', 'Cultural Exchange', 'Music Industry', 'Creative Economy'],
  industry = 'Arts & Culture',
  profile_completion_score = 68
WHERE email = 'alpha14@dna-test.com';

-- PROFILE 15: Grace Wanjiku — Kenyan-American, Climate, San Francisco
UPDATE profiles SET
  full_name = 'Grace Wanjiku',
  headline = 'Climate Tech | Carbon markets meet African reforestation',
  bio = 'Building carbon credit platforms that fund community-owned reforestation in East Africa. Stanford MBA.',
  location = 'San Francisco, CA',
  current_country_name = 'United States',
  country_of_origin = 'Kenya',
  skills = ARRAY['Climate Tech', 'Carbon Markets', 'Sustainability', 'Fundraising'],
  interests = ARRAY['Climate Change', 'Reforestation', 'East Africa', 'Impact Investing'],
  industry = 'Climate & Environment',
  profile_completion_score = 90
WHERE email = 'alpha15@dna-test.com';

-- PROFILE 16: David Osei — Ghanaian, Student (low completion for DIA nudge testing)
UPDATE profiles SET
  full_name = 'David Osei',
  headline = 'CS Student | University of Ghana',
  bio = 'Final year CS student exploring opportunities in the diaspora tech ecosystem.',
  location = 'Legon, Ghana',
  current_country_name = 'Ghana',
  country_of_origin = 'Ghana',
  skills = ARRAY['Python', 'JavaScript'],
  interests = ARRAY['Tech', 'Startups'],
  industry = 'Technology',
  profile_completion_score = 45
WHERE email = 'alpha16@dna-test.com';

-- PROFILE 17: Mariama Toure — Malian-French, Newcomer (minimal profile)
UPDATE profiles SET
  full_name = 'Mariama Toure',
  headline = '',
  bio = '',
  location = 'Lyon, France',
  current_country_name = 'France',
  country_of_origin = 'Mali',
  skills = ARRAY[]::text[],
  interests = ARRAY['Francophone Africa'],
  industry = '',
  profile_completion_score = 20
WHERE email = 'alpha17@dna-test.com';

-- PROFILE 18: James Achebe — Nigerian-American, Community Organizer
UPDATE profiles SET
  full_name = 'James Achebe',
  headline = 'Community Organizer | South Side Chicago',
  bio = 'Second-generation Nigerian-American. Active in community development.',
  location = 'Chicago, IL',
  current_country_name = 'United States',
  country_of_origin = 'Nigeria',
  skills = ARRAY['Community Organizing', 'Event Planning'],
  interests = ARRAY['Community Development', 'Diaspora Culture'],
  industry = 'Community Development',
  profile_completion_score = 55
WHERE email = 'alpha18@dna-test.com';

-- ============================================
-- CONNECTIONS (network clusters)
-- ============================================
-- Fintech cluster, Tech cluster, Creative cluster, Regional clusters

INSERT INTO connections (requester_id, recipient_id, status, created_at)
SELECT p1.id, p2.id, 'accepted', NOW() - INTERVAL '14 days'
FROM profiles p1, profiles p2
WHERE p1.email = 'alpha1@dna-test.com' AND p2.email = 'alpha8@dna-test.com'
ON CONFLICT DO NOTHING;

INSERT INTO connections (requester_id, recipient_id, status, created_at)
SELECT p1.id, p2.id, 'accepted', NOW() - INTERVAL '10 days'
FROM profiles p1, profiles p2
WHERE p1.email = 'alpha1@dna-test.com' AND p2.email = 'alpha7@dna-test.com'
ON CONFLICT DO NOTHING;

INSERT INTO connections (requester_id, recipient_id, status, created_at)
SELECT p1.id, p2.id, 'accepted', NOW() - INTERVAL '12 days'
FROM profiles p1, profiles p2
WHERE p1.email = 'alpha1@dna-test.com' AND p2.email = 'alpha15@dna-test.com'
ON CONFLICT DO NOTHING;

INSERT INTO connections (requester_id, recipient_id, status, created_at)
SELECT p1.id, p2.id, 'accepted', NOW() - INTERVAL '8 days'
FROM profiles p1, profiles p2
WHERE p1.email = 'alpha1@dna-test.com' AND p2.email = 'alpha3@dna-test.com'
ON CONFLICT DO NOTHING;

INSERT INTO connections (requester_id, recipient_id, status, created_at)
SELECT p1.id, p2.id, 'accepted', NOW() - INTERVAL '9 days'
FROM profiles p1, profiles p2
WHERE p1.email = 'alpha1@dna-test.com' AND p2.email = 'alpha11@dna-test.com'
ON CONFLICT DO NOTHING;

INSERT INTO connections (requester_id, recipient_id, status, created_at)
SELECT p1.id, p2.id, 'accepted', NOW() - INTERVAL '7 days'
FROM profiles p1, profiles p2
WHERE p1.email = 'alpha2@dna-test.com' AND p2.email = 'alpha9@dna-test.com'
ON CONFLICT DO NOTHING;

INSERT INTO connections (requester_id, recipient_id, status, created_at)
SELECT p1.id, p2.id, 'accepted', NOW() - INTERVAL '11 days'
FROM profiles p1, profiles p2
WHERE p1.email = 'alpha2@dna-test.com' AND p2.email = 'alpha10@dna-test.com'
ON CONFLICT DO NOTHING;

INSERT INTO connections (requester_id, recipient_id, status, created_at)
SELECT p1.id, p2.id, 'accepted', NOW() - INTERVAL '6 days'
FROM profiles p1, profiles p2
WHERE p1.email = 'alpha12@dna-test.com' AND p2.email = 'alpha16@dna-test.com'
ON CONFLICT DO NOTHING;

INSERT INTO connections (requester_id, recipient_id, status, created_at)
SELECT p1.id, p2.id, 'accepted', NOW() - INTERVAL '5 days'
FROM profiles p1, profiles p2
WHERE p1.email = 'alpha12@dna-test.com' AND p2.email = 'alpha10@dna-test.com'
ON CONFLICT DO NOTHING;

INSERT INTO connections (requester_id, recipient_id, status, created_at)
SELECT p1.id, p2.id, 'accepted', NOW() - INTERVAL '13 days'
FROM profiles p1, profiles p2
WHERE p1.email = 'alpha5@dna-test.com' AND p2.email = 'alpha14@dna-test.com'
ON CONFLICT DO NOTHING;

INSERT INTO connections (requester_id, recipient_id, status, created_at)
SELECT p1.id, p2.id, 'accepted', NOW() - INTERVAL '4 days'
FROM profiles p1, profiles p2
WHERE p1.email = 'alpha5@dna-test.com' AND p2.email = 'alpha11@dna-test.com'
ON CONFLICT DO NOTHING;

INSERT INTO connections (requester_id, recipient_id, status, created_at)
SELECT p1.id, p2.id, 'accepted', NOW() - INTERVAL '10 days'
FROM profiles p1, profiles p2
WHERE p1.email = 'alpha4@dna-test.com' AND p2.email = 'alpha14@dna-test.com'
ON CONFLICT DO NOTHING;

INSERT INTO connections (requester_id, recipient_id, status, created_at)
SELECT p1.id, p2.id, 'accepted', NOW() - INTERVAL '8 days'
FROM profiles p1, profiles p2
WHERE p1.email = 'alpha4@dna-test.com' AND p2.email = 'alpha12@dna-test.com'
ON CONFLICT DO NOTHING;

INSERT INTO connections (requester_id, recipient_id, status, created_at)
SELECT p1.id, p2.id, 'accepted', NOW() - INTERVAL '3 days'
FROM profiles p1, profiles p2
WHERE p1.email = 'alpha8@dna-test.com' AND p2.email = 'alpha18@dna-test.com'
ON CONFLICT DO NOTHING;

INSERT INTO connections (requester_id, recipient_id, status, created_at)
SELECT p1.id, p2.id, 'accepted', NOW() - INTERVAL '6 days'
FROM profiles p1, profiles p2
WHERE p1.email = 'alpha15@dna-test.com' AND p2.email = 'alpha7@dna-test.com'
ON CONFLICT DO NOTHING;

INSERT INTO connections (requester_id, recipient_id, status, created_at)
SELECT p1.id, p2.id, 'accepted', NOW() - INTERVAL '2 days'
FROM profiles p1, profiles p2
WHERE p1.email = 'alpha13@dna-test.com' AND p2.email = 'alpha2@dna-test.com'
ON CONFLICT DO NOTHING;

INSERT INTO connections (requester_id, recipient_id, status, created_at)
SELECT p1.id, p2.id, 'accepted', NOW() - INTERVAL '9 days'
FROM profiles p1, profiles p2
WHERE p1.email = 'alpha6@dna-test.com' AND p2.email = 'alpha9@dna-test.com'
ON CONFLICT DO NOTHING;

-- ============================================
-- EVENTS (7 events: 5 upcoming, 2 past)
-- Aligns with the post-composer events schema
-- (organizer_id, start_time, end_time, format, location_name,
--  is_public, is_cancelled). The legacy `status` column does not
-- exist on this table — `is_cancelled = false` is the canonical
-- "live" signal.
-- ============================================

INSERT INTO events (title, description, start_time, end_time, location_name, event_type, format, organizer_id, is_public, is_cancelled)
SELECT
  'Pan-African Tech Summit 2026',
  'The premier gathering for African and diaspora tech professionals. Keynotes, panels, and networking covering fintech, healthtech, agtech, and AI.',
  NOW() + INTERVAL '30 days',
  NOW() + INTERVAL '30 days' + INTERVAL '8 hours',
  'Virtual (Zoom)',
  'conference',
  'virtual',
  p.id,
  true,
  false
FROM profiles p WHERE p.email = 'alpha1@dna-test.com';

INSERT INTO events (title, description, start_time, end_time, location_name, event_type, format, organizer_id, is_public, is_cancelled)
SELECT
  'Diaspora Investor Networking Mixer — Lagos',
  'An intimate evening connecting diaspora investors with Nigerian founders. Pitch presentations and one-on-one meetings.',
  NOW() + INTERVAL '14 days',
  NOW() + INTERVAL '14 days' + INTERVAL '4 hours',
  'Landmark Centre, Victoria Island, Lagos',
  'networking',
  'in_person',
  p.id,
  true,
  false
FROM profiles p WHERE p.email = 'alpha8@dna-test.com';

INSERT INTO events (title, description, start_time, end_time, location_name, event_type, format, organizer_id, meeting_url, is_public, is_cancelled)
SELECT
  'Afrobeats x Entrepreneurship: Where Culture Meets Business',
  'A unique hybrid event exploring the business of African music and culture. Panel discussions on IP ownership and licensing.',
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '7 days' + INTERVAL '5 hours',
  'Shoreditch Studios, London / Virtual',
  'meetup',
  'hybrid',
  p.id,
  'https://meet.example.com/afrobeats-x-entrepreneurship',
  true,
  false
FROM profiles p WHERE p.email = 'alpha14@dna-test.com';

INSERT INTO events (title, description, start_time, end_time, location_name, event_type, format, organizer_id, meeting_url, is_public, is_cancelled)
SELECT
  'DNA Community Storytelling Night',
  'Share your diaspora story. An evening of personal narratives, cultural connections, and community building.',
  NOW() + INTERVAL '3 days',
  NOW() + INTERVAL '3 days' + INTERVAL '2 hours',
  'Virtual (DNA Platform)',
  'social',
  'virtual',
  p.id,
  'https://meet.example.com/dna-storytelling-night',
  true,
  false
FROM profiles p WHERE p.email = 'alpha5@dna-test.com';

INSERT INTO events (title, description, start_time, end_time, location_name, event_type, format, organizer_id, meeting_url, is_public, is_cancelled)
SELECT
  'Climate Finance for African Reforestation: A Workshop',
  'Hands-on workshop on carbon credit methodology and community ownership models for climate-positive projects.',
  NOW() + INTERVAL '21 days',
  NOW() + INTERVAL '21 days' + INTERVAL '3 hours',
  'Virtual (Zoom)',
  'workshop',
  'virtual',
  p.id,
  'https://meet.example.com/climate-finance-workshop',
  true,
  false
FROM profiles p WHERE p.email = 'alpha15@dna-test.com';

-- Past events
INSERT INTO events (title, description, start_time, end_time, location_name, event_type, format, organizer_id, meeting_url, is_public, is_cancelled)
SELECT
  'DNA Year-End Diaspora Gathering 2025',
  'A celebration of what the diaspora community built this year. Reflections, awards, and plans for 2026.',
  NOW() - INTERVAL '5 days' - INTERVAL '3 hours',
  NOW() - INTERVAL '5 days',
  'Virtual (DNA Platform)',
  'social',
  'virtual',
  p.id,
  'https://meet.example.com/dna-year-end-2025',
  true,
  false
FROM profiles p WHERE p.email = 'alpha1@dna-test.com';

INSERT INTO events (title, description, start_time, end_time, location_name, event_type, format, organizer_id, is_public, is_cancelled)
SELECT
  'Build for Africa Hackathon — Lagos Edition',
  '48-hour hackathon building solutions for African markets. Teams of 3-5, mentored by diaspora tech leaders.',
  NOW() - INTERVAL '14 days',
  NOW() - INTERVAL '12 days',
  'CcHUB, Yaba, Lagos',
  'workshop',
  'in_person',
  p.id,
  true,
  false
FROM profiles p WHERE p.email = 'alpha3@dna-test.com';

-- ============================================
-- SPACES (5 spaces: 4 active, 1 stalled)
-- The legacy `collaboration_spaces` table was dropped in
-- 20260429100000_collaborate_rebuild_r1b1_cleanup_remediation.sql.
-- Seed against the canonical `spaces` table with the locked-spec
-- column set (name, slug, space_type, status, visibility,
-- created_by). After-INSERT trigger trg_space_create_channel
-- materialises the general channel automatically.
-- ============================================

INSERT INTO spaces (name, slug, description, space_type, status, visibility, created_by)
SELECT 'AfroTech Accelerator Cohort 3',
  'afrotech-accelerator-cohort-3',
  'Collaborative space for the 3rd cohort of the AfroTech Accelerator. Shared resources, milestone tracking.',
  'program', 'active', 'community',
  p.id
FROM profiles p WHERE p.email = 'alpha1@dna-test.com';

INSERT INTO spaces (name, slug, description, space_type, status, visibility, created_by)
SELECT 'Diaspora Investment Fund — Due Diligence',
  'diaspora-investment-fund-due-diligence',
  'Research and due diligence workspace for evaluating investment opportunities in African markets.',
  'working_group', 'active', 'private',
  p.id
FROM profiles p WHERE p.email = 'alpha8@dna-test.com';

-- STALLED SPACE (updated_at 10+ days ago for DIA stall detection)
INSERT INTO spaces (name, slug, description, space_type, status, visibility, created_by, updated_at)
SELECT 'Lagos-London Trade Bridge',
  'lagos-london-trade-bridge',
  'Exploring trade corridor opportunities between Lagos and London. Logistics, regulatory frameworks.',
  'initiative', 'active', 'community',
  p.id, NOW() - INTERVAL '15 days'
FROM profiles p WHERE p.email = 'alpha6@dna-test.com';

INSERT INTO spaces (name, slug, description, space_type, status, visibility, created_by)
SELECT 'Heritage Preservation Digital Archive',
  'heritage-preservation-digital-archive',
  'Building a digital archive of African cultural heritage artifacts, stories, and oral histories.',
  'project', 'active', 'public',
  p.id
FROM profiles p WHERE p.email = 'alpha5@dna-test.com';

INSERT INTO spaces (name, slug, description, space_type, status, visibility, created_by)
SELECT 'African Women in STEM Network',
  'african-women-in-stem-network',
  'Support network for African and diaspora women in STEM. Mentorship, job sharing, and advocacy.',
  'working_group', 'active', 'community',
  p.id
FROM profiles p WHERE p.email = 'alpha2@dna-test.com';

-- ============================================
-- OPPORTUNITIES (10 entries)
-- Aligned with the post-composer opportunities schema:
-- direction (need|offer), category, compensation_type,
-- location_relevance, audience, status='active', tags.
-- The legacy `type / visibility / location` columns were removed
-- when the table was rebuilt in 20260212100000_post_composer_tables.sql.
-- ============================================

INSERT INTO opportunities (title, description, direction, category, compensation_type, location_relevance, specific_country, tags, audience, status, created_by)
SELECT 'React Native Developer for Mobile App',
  'Looking for an experienced React Native developer to build our mobile app MVP. 3-month contract, remote.',
  'need', 'technical', 'paid', 'remote', NULL,
  ARRAY['React Native', 'Mobile', 'MVP'],
  'public', 'active',
  p.id
FROM profiles p WHERE p.email = 'alpha3@dna-test.com';

INSERT INTO opportunities (title, description, direction, category, compensation_type, location_relevance, specific_region, tags, audience, status, created_by)
SELECT 'Fintech Regulatory Advisor',
  'Need legal/regulatory guidance for launching a payment product in 3 West African markets.',
  'need', 'business', 'paid', 'regional', 'West Africa',
  ARRAY['Fintech', 'Regulatory', 'West Africa'],
  'public', 'active',
  p.id
FROM profiles p WHERE p.email = 'alpha1@dna-test.com';

INSERT INTO opportunities (title, description, direction, category, compensation_type, location_relevance, specific_country, tags, audience, status, created_by)
SELECT 'Pro Bono Legal Consultation',
  'Offering free legal consultation for African startups incorporating in the UK or EU.',
  'offer', 'business', 'pro_bono', 'country', 'UK',
  ARRAY['Legal', 'Pro Bono', 'UK', 'EU'],
  'public', 'active',
  p.id
FROM profiles p WHERE p.email = 'alpha9@dna-test.com';

INSERT INTO opportunities (title, description, direction, category, compensation_type, location_relevance, tags, audience, status, created_by)
SELECT 'Mentorship for Early-Stage Founders',
  'Available to mentor 3 early-stage founders in fintech or real estate. Monthly calls and pitch deck review.',
  'offer', 'business', 'pro_bono', 'remote',
  ARRAY['Mentorship', 'Fintech', 'Real Estate'],
  'public', 'active',
  p.id
FROM profiles p WHERE p.email = 'alpha8@dna-test.com';

INSERT INTO opportunities (title, description, direction, category, compensation_type, location_relevance, tags, audience, status, created_by)
SELECT 'Grant Writer for Climate Project',
  'Seeking an experienced grant writer for climate finance funding applications.',
  'need', 'creative', 'paid', 'remote',
  ARRAY['Grant Writing', 'Climate', 'Carbon Credits'],
  'public', 'active',
  p.id
FROM profiles p WHERE p.email = 'alpha15@dna-test.com';

INSERT INTO opportunities (title, description, direction, category, compensation_type, location_relevance, specific_region, tags, audience, status, created_by)
SELECT 'UX Designer for Health App',
  'Looking for a UX designer familiar with low-literacy user interfaces for telemedicine in rural East Africa.',
  'need', 'creative', 'paid', 'regional', 'East Africa',
  ARRAY['UX Design', 'Healthcare', 'Telemedicine'],
  'public', 'active',
  p.id
FROM profiles p WHERE p.email = 'alpha2@dna-test.com';

INSERT INTO opportunities (title, description, direction, category, compensation_type, location_relevance, tags, audience, status, created_by)
SELECT 'Music Licensing Expertise',
  'Offering guidance on music licensing, IP protection, and royalty structures for African artists.',
  'offer', 'creative', 'pro_bono', 'remote',
  ARRAY['Music', 'IP', 'Licensing'],
  'public', 'active',
  p.id
FROM profiles p WHERE p.email = 'alpha14@dna-test.com';

INSERT INTO opportunities (title, description, direction, category, compensation_type, location_relevance, tags, audience, status, created_by)
SELECT 'Data Analysis for Development Metrics',
  'Can help with statistical analysis and ML modeling for development-focused projects. Pro bono.',
  'offer', 'technical', 'pro_bono', 'remote',
  ARRAY['Data Science', 'ML', 'Development'],
  'public', 'active',
  p.id
FROM profiles p WHERE p.email = 'alpha10@dna-test.com';

INSERT INTO opportunities (title, description, direction, category, compensation_type, location_relevance, specific_country, tags, audience, status, created_by)
SELECT 'Seed Funding for AgTech Startup',
  'Raising a $500K seed round for our precision agriculture platform. Looking for diaspora investors.',
  'need', 'business', 'equity', 'country', 'Ghana',
  ARRAY['AgTech', 'Seed Funding', 'Agriculture'],
  'public', 'active',
  p.id
FROM profiles p WHERE p.email = 'alpha3@dna-test.com';

INSERT INTO opportunities (title, description, direction, category, compensation_type, location_relevance, specific_country, tags, audience, status, created_by)
SELECT 'Marketing Strategy for African Brand Launch',
  'Need a growth marketer to help launch our African skincare brand in the US market.',
  'need', 'creative', 'paid', 'country', 'United States',
  ARRAY['Marketing', 'Skincare', 'Brand Launch'],
  'public', 'active',
  p.id
FROM profiles p WHERE p.email = 'alpha11@dna-test.com';

-- ============================================
-- POSTS (15 posts)
-- Uses correct columns: author_id, post_type
-- ============================================

INSERT INTO posts (content, author_id, post_type, created_at)
SELECT 'Just returned from the Build for Africa Hackathon in Lagos. The energy was incredible. Africa''s tech talent is present reality, not future potential. #BuildForAfrica',
  p.id, 'post', NOW() - INTERVAL '11 days'
FROM profiles p WHERE p.email = 'alpha3@dna-test.com';

INSERT INTO posts (content, author_id, post_type, created_at)
SELECT 'Excited to announce our carbon credit platform just closed its $2M seed round! Thank you to every diaspora investor who believed.',
  p.id, 'post', NOW() - INTERVAL '8 days'
FROM profiles p WHERE p.email = 'alpha15@dna-test.com';

INSERT INTO posts (content, author_id, post_type, created_at)
SELECT 'Hot take: The diaspora''s biggest untapped asset isn''t money — it''s knowledge networks. Connections between a dev in Lagos, a policy advisor in DC, and an investor in London create more value than any remittance.',
  p.id, 'post', NOW() - INTERVAL '6 days'
FROM profiles p WHERE p.email = 'alpha1@dna-test.com';

INSERT INTO posts (content, author_id, post_type, created_at)
SELECT 'We just trained our 5,000th young person in digital skills this year. Each one is a node in Africa''s digital economy. Not charity, investment in human infrastructure.',
  p.id, 'post', NOW() - INTERVAL '5 days'
FROM profiles p WHERE p.email = 'alpha13@dna-test.com';

INSERT INTO posts (content, author_id, post_type, created_at)
SELECT 'Question for the community: What would a truly African-owned intellectual property framework look like? Not a copy of Western IP law, but something from our communal traditions?',
  p.id, 'post', NOW() - INTERVAL '4 days'
FROM profiles p WHERE p.email = 'alpha14@dna-test.com';

INSERT INTO posts (content, author_id, post_type, created_at)
SELECT 'Three things I learned about telemedicine in rural Nigeria: 1) Trust is earned through community health workers. 2) Offline-first is everything. 3) Voice > text.',
  p.id, 'post', NOW() - INTERVAL '3 days'
FROM profiles p WHERE p.email = 'alpha2@dna-test.com';

INSERT INTO posts (content, author_id, post_type, created_at)
SELECT 'Looking for collaborators on a project mapping African cultural heritage artifacts in European museums. We have the tech, we need the network.',
  p.id, 'post', NOW() - INTERVAL '3 days'
FROM profiles p WHERE p.email = 'alpha5@dna-test.com';

INSERT INTO posts (content, author_id, post_type, created_at)
SELECT 'Reminder: The deadline for AGOA renewal consultations is next month. If you have opinions about US-Africa trade policy, now is the time. DM me for the template.',
  p.id, 'post', NOW() - INTERVAL '2 days'
FROM profiles p WHERE p.email = 'alpha7@dna-test.com';

INSERT INTO posts (content, author_id, post_type, created_at)
SELECT 'Shipped a new feature this week: our farming app now works with 2G connections. Building for constraints that Silicon Valley doesn''t think about.',
  p.id, 'post', NOW() - INTERVAL '2 days'
FROM profiles p WHERE p.email = 'alpha12@dna-test.com';

INSERT INTO posts (content, author_id, post_type, created_at)
SELECT 'The real estate opportunity in Africa is generational. Urbanization + young population + rising middle class = decades of demand. Working on better diaspora investment vehicles.',
  p.id, 'post', NOW() - INTERVAL '1 day'
FROM profiles p WHERE p.email = 'alpha8@dna-test.com';

INSERT INTO posts (content, author_id, post_type, created_at)
SELECT 'Just launched our legal clinic for African founders. Free incorporation advice for UK/EU markets. Let''s remove barriers to going global.',
  p.id, 'post', NOW() - INTERVAL '1 day'
FROM profiles p WHERE p.email = 'alpha9@dna-test.com';

INSERT INTO posts (content, author_id, post_type, created_at)
SELECT 'Data sovereignty should be non-negotiable. African nations must own their development data. The alternative is having our economic futures decided by datasets we don''t control.',
  p.id, 'post', NOW() - INTERVAL '12 hours'
FROM profiles p WHERE p.email = 'alpha10@dna-test.com';

INSERT INTO posts (content, author_id, post_type, created_at)
SELECT 'Feeling grateful for this community. Connected with 3 amazing people this week working on problems I care about. The diaspora is stronger connected.',
  p.id, 'post', NOW() - INTERVAL '6 hours'
FROM profiles p WHERE p.email = 'alpha18@dna-test.com';

INSERT INTO posts (content, author_id, post_type, created_at)
SELECT 'The best marketing strategy for African brands entering Western markets? Stop trying to sound Western. Your authenticity is your advantage.',
  p.id, 'post', NOW() - INTERVAL '3 hours'
FROM profiles p WHERE p.email = 'alpha11@dna-test.com';

INSERT INTO posts (content, author_id, post_type, created_at)
SELECT 'PSA: If you''re a CS student in Africa, check out the African Women in STEM space on DNA. Mentorship, job leads, and a supportive community.',
  p.id, 'post', NOW() - INTERVAL '1 hour'
FROM profiles p WHERE p.email = 'alpha16@dna-test.com';

-- ============================================
-- STORIES (5 long-form posts with titles)
-- ============================================

INSERT INTO posts (title, content, author_id, post_type, created_at)
SELECT 'From Dakar to Brooklyn: How My Grandmother''s Business Lessons Built a Fintech Company',
  'My grandmother sold fabric in Sandaga Market. She never used a bank. But she understood cash flow, trust networks, and customer relationships better than any MBA graduate I''ve met on Wall Street. This is the story of how her lessons became the foundation for a fintech company serving the African diaspora.',
  p.id, 'story', NOW() - INTERVAL '7 days'
FROM profiles p WHERE p.email = 'alpha1@dna-test.com';

INSERT INTO posts (title, content, author_id, post_type, created_at)
SELECT 'The Invisible Infrastructure: Why Africa Needs Its Own Tech Stack',
  'When we talk about African tech, we talk about apps and startups and funding rounds. But we rarely talk about the infrastructure beneath it all. This piece explores why building from the ground up matters more than layering on top.',
  p.id, 'story', NOW() - INTERVAL '5 days'
FROM profiles p WHERE p.email = 'alpha12@dna-test.com';

INSERT INTO posts (title, content, author_id, post_type, created_at)
SELECT 'What 5,000 Young South Africans Taught Me About Resilience',
  'Every morning at 6am, before our digital skills class starts, I watch them arrive. From Khayelitsha, from Alexandra, from Diepsloot. An hour on a minibus taxi, sometimes two. They come because they believe in a different future.',
  p.id, 'story', NOW() - INTERVAL '3 days'
FROM profiles p WHERE p.email = 'alpha13@dna-test.com';

INSERT INTO posts (title, content, author_id, post_type, created_at)
SELECT 'Afrofuturism Isn''t Fantasy, It''s a Business Plan',
  'When people hear Afrofuturism, they think of Black Panther. But Afrofuturism, at its core, is about imagining and then building an African future on African terms. Here is how creative directors are making it real.',
  p.id, 'story', NOW() - INTERVAL '2 days'
FROM profiles p WHERE p.email = 'alpha5@dna-test.com';

INSERT INTO posts (title, content, author_id, post_type, created_at)
SELECT 'The Carbon Credit Gold Rush and Why African Communities Must Lead',
  'There is a new scramble for Africa, dressed in green. Carbon credit markets are projected to reach $100 billion by 2030, and Africa holds the largest reforestation potential on Earth. The question is: who benefits?',
  p.id, 'story', NOW() - INTERVAL '1 day'
FROM profiles p WHERE p.email = 'alpha15@dna-test.com';

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Profiles seeded: ' || COUNT(*) FROM profiles WHERE email LIKE 'alpha%@dna-test.com' AND full_name IS NOT NULL AND full_name != '';
SELECT 'Connections seeded: ' || COUNT(*) FROM connections WHERE created_at > NOW() - INTERVAL '30 days';
SELECT 'Events seeded: ' || COUNT(*) FROM events WHERE title LIKE '%Pan-African%' OR title LIKE '%Diaspora%' OR title LIKE '%Afrobeats%' OR title LIKE '%DNA%' OR title LIKE '%Climate%' OR title LIKE '%Hackathon%';
SELECT 'Spaces seeded: ' || COUNT(*) FROM spaces WHERE name IN ('AfroTech Accelerator Cohort 3', 'Diaspora Investment Fund — Due Diligence', 'Lagos-London Trade Bridge', 'Heritage Preservation Digital Archive', 'African Women in STEM Network');
SELECT 'Opportunities seeded: ' || COUNT(*) FROM opportunities WHERE title LIKE '%React Native%' OR title LIKE '%Fintech Regulatory%' OR title LIKE '%Pro Bono%';
SELECT 'Posts seeded: ' || COUNT(*) FROM posts WHERE content LIKE '%Hackathon%' OR content LIKE '%carbon credit%' OR content LIKE '%data sovereignty%';
