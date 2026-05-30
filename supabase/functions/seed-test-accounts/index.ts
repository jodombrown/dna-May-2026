import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestProfile {
  email: string;
  full_name: string;
  bio: string;
  location: string;
  country_of_origin: string;
  current_role: string;
  industry: string;
  skills: string[];
  interests: string[];
  years_experience: number;
  intro_text: string;
  selected_pillars: string[];
}

const testProfiles: TestProfile[] = [
  {
    email: 'amara.tech@example.com',
    full_name: 'Amara Okonkwo',
    bio: 'Fintech entrepreneur building payment solutions for African diaspora communities. Passionate about financial inclusion and cross-border innovation.',
    location: 'London, UK',
    country_of_origin: 'Nigeria',
    current_role: 'CEO & Co-founder',
    industry: 'Financial Technology',
    skills: ['Fintech', 'Product Strategy', 'Fundraising', 'Team Leadership', 'Cross-border Payments'],
    interests: ['African Innovation', 'Financial Inclusion', 'Mentorship', 'Tech Policy'],
    years_experience: 8,
    intro_text: 'Building the future of African financial services from London. Always excited to connect with fellow entrepreneurs working on impact-driven solutions.',
    selected_pillars: ['collaborate', 'contribute']
  },
  {
    email: 'kwame.researcher@example.com',
    full_name: 'Dr. Kwame Asante',
    bio: 'Research scientist specializing in renewable energy solutions for African markets. Published researcher with 15+ papers on sustainable technology.',
    location: 'Toronto, Canada',
    country_of_origin: 'Ghana',
    current_role: 'Senior Research Scientist',
    industry: 'Clean Energy',
    skills: ['Research & Development', 'Solar Technology', 'Grant Writing', 'Data Analysis', 'Public Speaking'],
    interests: ['Climate Change', 'Sustainable Development', 'Education', 'Policy Advocacy'],
    years_experience: 12,
    intro_text: 'Dedicated to developing clean energy solutions that can transform African communities. Looking to collaborate on research and implementation projects.',
    selected_pillars: ['contribute', 'connect']
  },
  {
    email: 'fatima.artist@example.com',
    full_name: 'Fatima Diallo',
    bio: 'Creative director and cultural entrepreneur promoting African arts globally. Founder of several art galleries and cultural exchange programs.',
    location: 'Paris, France',
    country_of_origin: 'Senegal',
    current_role: 'Creative Director',
    industry: 'Arts & Culture',
    skills: ['Creative Direction', 'Curation', 'Cultural Programming', 'Community Building', 'Digital Marketing'],
    interests: ['African Art', 'Cultural Preservation', 'Youth Mentorship', 'Creative Economy'],
    years_experience: 10,
    intro_text: 'Bridging African creativity with global audiences. Passionate about empowering the next generation of African artists and creatives.',
    selected_pillars: ['connect', 'contribute']
  },
  {
    email: 'david.health@example.com',
    full_name: 'David Mwangi',
    bio: 'Healthcare innovation consultant working on digital health solutions for African healthcare systems. Former WHO program manager.',
    location: 'Berlin, Germany',
    country_of_origin: 'Kenya',
    current_role: 'Healthcare Innovation Consultant',
    industry: 'Healthcare Technology',
    skills: ['Digital Health', 'Program Management', 'Policy Development', 'Stakeholder Engagement', 'Healthcare Systems'],
    interests: ['Global Health', 'Healthcare Access', 'Digital Innovation', 'Policy Reform'],
    years_experience: 15,
    intro_text: 'Working to revolutionize healthcare delivery across Africa through innovative digital solutions and policy reform.',
    selected_pillars: ['contribute', 'collaborate']
  },
  {
    email: 'zara.student@example.com',
    full_name: 'Zara Temba',
    bio: 'PhD candidate in Environmental Engineering at MIT. Researching water purification technologies for rural African communities.',
    location: 'Boston, USA',
    country_of_origin: 'South Africa',
    current_role: 'PhD Candidate',
    industry: 'Environmental Engineering',
    skills: ['Environmental Engineering', 'Research', 'Water Treatment', 'Lab Management', 'Technical Writing'],
    interests: ['Water Security', 'Rural Development', 'Environmental Justice', 'STEM Education'],
    years_experience: 3,
    intro_text: 'Passionate about solving water access challenges in rural Africa. Always eager to learn from experienced professionals and find research collaborations.',
    selected_pillars: ['connect', 'contribute']
  },
  {
    email: 'ibrahim.investor@example.com',
    full_name: 'Ibrahim Hassan',
    bio: 'Impact investor focused on African startups. Managing partner at a $50M fund supporting early-stage African tech companies.',
    location: 'Dubai, UAE',
    country_of_origin: 'Somalia',
    current_role: 'Managing Partner',
    industry: 'Venture Capital',
    skills: ['Investment Analysis', 'Due Diligence', 'Portfolio Management', 'Startup Mentoring', 'Market Research'],
    interests: ['African Startups', 'Impact Investing', 'Entrepreneurship', 'Economic Development'],
    years_experience: 18,
    intro_text: 'Committed to funding the next generation of African entrepreneurs. Always looking for innovative startups solving real African problems.',
    selected_pillars: ['collaborate', 'contribute']
  },
  {
    email: 'marie.agriculture@example.com',
    full_name: 'Marie Ndongo',
    bio: 'Agricultural technology specialist developing drone and IoT solutions for African farmers. Former agricultural extension officer.',
    location: 'Lyon, France',
    country_of_origin: 'Cameroon',
    current_role: 'AgTech Product Manager',
    industry: 'Agricultural Technology',
    skills: ['Agricultural Technology', 'IoT Systems', 'Drone Technology', 'Product Management', 'Farmer Training'],
    interests: ['Sustainable Agriculture', 'Food Security', 'Rural Innovation', 'Farmer Education'],
    years_experience: 9,
    intro_text: 'Leveraging technology to help African farmers increase productivity and sustainability. Interested in partnerships and knowledge exchange.',
    selected_pillars: ['contribute', 'collaborate']
  },
  {
    email: 'john.policy@example.com',
    full_name: 'John Banda',
    bio: 'Policy researcher and advocate specializing in African trade and economic development. Senior fellow at multiple think tanks.',
    location: 'Washington DC, USA',
    country_of_origin: 'Zambia',
    current_role: 'Senior Policy Fellow',
    industry: 'Policy & Advocacy',
    skills: ['Policy Research', 'Economic Analysis', 'Advocacy', 'Report Writing', 'Stakeholder Engagement'],
    interests: ['Trade Policy', 'Economic Development', 'Governance', 'Regional Integration'],
    years_experience: 14,
    intro_text: 'Advocating for policies that promote African economic growth and integration. Always interested in evidence-based policy discussions.',
    selected_pillars: ['contribute', 'connect']
  },
  {
    email: 'aisha.education@example.com',
    full_name: 'Aisha Mohamed',
    bio: 'EdTech entrepreneur developing digital learning platforms for African students. Former educator with passion for accessible education.',
    location: 'Stockholm, Sweden',
    country_of_origin: 'Sudan',
    current_role: 'EdTech Founder',
    industry: 'Education Technology',
    skills: ['Educational Technology', 'Curriculum Development', 'Software Development', 'Teacher Training', 'Learning Analytics'],
    interests: ['Educational Access', 'Digital Learning', 'Teacher Empowerment', 'Youth Development'],
    years_experience: 7,
    intro_text: 'Building technology to democratize quality education across Africa. Looking for partners, mentors, and funding opportunities.',
    selected_pillars: ['collaborate', 'contribute']
  },
  {
    email: 'patricia.media@example.com',
    full_name: 'Patricia Olumide',
    bio: 'Digital media strategist and content creator focusing on African stories and narratives. Building platforms for African content creators.',
    location: 'Amsterdam, Netherlands',
    country_of_origin: 'Nigeria',
    current_role: 'Media Strategist & Content Creator',
    industry: 'Digital Media',
    skills: ['Content Strategy', 'Digital Marketing', 'Video Production', 'Social Media', 'Brand Development'],
    interests: ['African Storytelling', 'Media Representation', 'Content Creation', 'Digital Platforms'],
    years_experience: 6,
    intro_text: 'Amplifying African voices and stories through digital media. Passionate about authentic representation and creator empowerment.',
    selected_pillars: ['connect', 'contribute']
  }
];

const samplePosts = [
  {
    content: "Just closed our Series A! 🎉 Excited to scale our fintech solution across West Africa. Looking for strategic partners and advisors who understand the African market.",
    pillar: "contribute",
    author_email: "amara.tech@example.com"
  },
  {
    content: "Published new research on solar energy efficiency in rural Ghana. Happy to share findings with anyone working on similar projects. Collaboration is key! 🌞",
    pillar: "contribute", 
    author_email: "kwame.researcher@example.com"
  },
  {
    content: "Organizing an African art exhibition in Paris next month. Looking for emerging artists to feature. Please share or tag someone who might be interested! 🎨",
    pillar: "connect",
    author_email: "fatima.artist@example.com"
  },
  {
    content: "The future of healthcare in Africa is digital. Working with governments to implement telemedicine programs. Anyone else in this space? Let's connect! 💊",
    pillar: "collaborate",
    author_email: "david.health@example.com"
  },
  {
    content: "My water purification research could benefit 2M+ people in rural areas. Seeking mentorship from experienced engineers and potential funding sources. 💧",
    pillar: "connect",
    author_email: "zara.student@example.com"
  }
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseServiceRole) {
      throw new Error('Service role key not configured');
    }

    const supabase = createClient(
      'https://ybhssuehmfnxrzneobok.supabase.co',
      supabaseServiceRole
    );

    // Require authenticated admin caller
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401,
      });
    }
    const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401,
      });
    }
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: userRes.user.id,
      _role: 'admin',
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403,
      });
    }

    console.log('Starting test account seeding...');

    // Create profiles
    const createdProfiles = [];
    for (const profile of testProfiles) {
      const profileData = {
        email: profile.email,
        full_name: profile.full_name,
        bio: profile.bio,
        location: profile.location,
        country_of_origin: profile.country_of_origin,
        current_role: profile.current_role,
        industry: profile.industry,
        skills: profile.skills,
        interests: profile.interests,
        years_experience: profile.years_experience,
        intro_text: profile.intro_text,
        selected_pillars: profile.selected_pillars,
        is_seeded: true,
        is_public: true,
        profile_completeness_score: 85
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error(`Error creating profile for ${profile.email}:`, error);
        continue;
      }

      createdProfiles.push(data);
      console.log(`Created profile for ${profile.full_name}`);
    }

    // Create sample posts
    let postsCreated = 0;
    for (const post of samplePosts) {
      const author = createdProfiles.find(p => p.email === post.author_email);
      if (!author) continue;

      const { error } = await supabase
        .from('posts')
        .insert({
          content: post.content,
          pillar: post.pillar,
          author_id: author.id,
          visibility: 'public',
          is_seeded: true
        });

      if (!error) {
        postsCreated++;
        console.log(`Created post by ${author.full_name}`);
      }
    }

    // Create some sample events
    const sampleEvents = [
      {
        title: "African Tech Innovators Meetup",
        description: "Monthly networking event for African tech professionals in London",
        date_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: "London, UK",
        is_virtual: false,
        created_by: createdProfiles[0]?.id
      },
      {
        title: "Renewable Energy Research Symposium", 
        description: "Presenting latest research on sustainable energy solutions for Africa",
        date_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        location: "Virtual",
        is_virtual: true,
        created_by: createdProfiles[1]?.id
      }
    ];

    let eventsCreated = 0;
    for (const event of sampleEvents) {
      if (!event.created_by) continue;
      
      const { error } = await supabase
        .from('events')
        .insert({
          ...event,
          is_seeded: true
        });

      if (!error) {
        eventsCreated++;
        console.log(`Created event: ${event.title}`);
      }
    }

    // Create some connections between users
    let connectionsCreated = 0;
    for (let i = 0; i < Math.min(5, createdProfiles.length - 1); i++) {
      const sender = createdProfiles[i];
      const receiver = createdProfiles[i + 1];
      
      if (!sender || !receiver) continue;

      const { error } = await supabase
        .from('contact_requests')
        .insert({
          sender_id: sender.id,
          receiver_id: receiver.id,
          purpose: 'collaboration',
          message: 'Looking forward to connecting and exploring collaboration opportunities!',
          status: 'accepted',
          is_seeded: true
        });

      if (!error) {
        connectionsCreated++;
        console.log(`Created connection between ${sender.full_name} and ${receiver.full_name}`);
      }
    }

    const summary = {
      profiles_created: createdProfiles.length,
      posts_created: postsCreated,
      events_created: eventsCreated,
      connections_created: connectionsCreated,
      success: true
    };

    console.log('Seeding completed:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Seeding error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});