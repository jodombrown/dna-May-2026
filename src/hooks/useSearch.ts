import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Professional {
  id: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  profession?: string;
  company?: string;
  is_mentor: boolean;
  is_investor: boolean;
  looking_for_opportunities: boolean;
  created_at: string;
  updated_at: string;
  skills?: string[];
  /** Primary origin country, ISO code, sourced from member_heritage (BD038). */
  primary_origin_country?: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  member_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: string;
  date_time: string;
  location: string;
  is_virtual: boolean;
  attendee_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  banner_url?: string;
  creator_profile?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

// Demo data for professionals (8 professionals)
const demoProfessionals: Professional[] = [
  {
    id: '1',
    full_name: 'Dr. Amara Okafor',
    profession: 'FinTech CEO',
    company: 'AfriPay Solutions',
    location: 'London, UK',
    country_of_origin: 'Nigeria',
    bio: 'Leading fintech innovation across Africa and Europe with over 10 years of experience.',
    skills: ['Financial Technology', 'Digital Payments', 'Blockchain', 'Leadership'],
    avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b829?w=400',
    is_mentor: true,
    is_investor: true,
    looking_for_opportunities: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    full_name: 'Prof. Kwame Asante',
    profession: 'AgriTech Researcher',
    company: 'Ghana Institute of Technology',
    location: 'Toronto, Canada',
    country_of_origin: 'Ghana',
    bio: 'Pioneering sustainable agriculture solutions for smallholder farmers across Africa.',
    skills: ['Agricultural Technology', 'Climate Science', 'Sustainable Farming', 'Research'],
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    is_mentor: true,
    is_investor: false,
    looking_for_opportunities: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    full_name: 'Sarah Mwangi',
    profession: 'Healthcare Innovation Director',
    company: 'MedTech Africa',
    location: 'Berlin, Germany',
    country_of_origin: 'Kenya',
    bio: 'Transforming healthcare delivery through digital innovation and telemedicine solutions.',
    skills: ['Healthcare Technology', 'Digital Health', 'Product Management', 'Strategy'],
    avatar_url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400',
    is_mentor: true,
    is_investor: false,
    looking_for_opportunities: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    full_name: 'Ibrahim Diallo',
    profession: 'Renewable Energy Engineer',
    company: 'SolarTech Solutions',
    location: 'Paris, France',
    country_of_origin: 'Senegal',
    bio: 'Developing solar energy infrastructure to power African communities sustainably.',
    skills: ['Solar Energy', 'Engineering', 'Project Management', 'Sustainability'],
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    is_mentor: false,
    is_investor: true,
    looking_for_opportunities: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    full_name: 'Fatima Al-Rashid',
    profession: 'EdTech Entrepreneur',
    company: 'LearnAfrica',
    location: 'Dubai, UAE',
    country_of_origin: 'Morocco',
    bio: 'Building educational technology platforms to improve access to quality education.',
    skills: ['Education Technology', 'Entrepreneurship', 'Mobile Development', 'UI/UX'],
    avatar_url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400',
    is_mentor: true,
    is_investor: true,
    looking_for_opportunities: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '6',
    full_name: 'Dr. Chinedu Okonkwo',
    profession: 'AI Research Scientist',
    company: 'Google DeepMind',
    location: 'San Francisco, USA',
    country_of_origin: 'Nigeria',
    bio: 'Advancing artificial intelligence research with applications for African development.',
    skills: ['Artificial Intelligence', 'Machine Learning', 'Data Science', 'Research'],
    avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
    is_mentor: true,
    is_investor: false,
    looking_for_opportunities: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '7',
    full_name: 'Aisha Kone',
    profession: 'Impact Investment Manager',
    company: 'Africa Growth Fund',
    location: 'Amsterdam, Netherlands',
    country_of_origin: 'Mali',
    bio: 'Directing capital towards sustainable development projects across West Africa.',
    skills: ['Impact Investing', 'Finance', 'Venture Capital', 'ESG'],
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
    is_mentor: false,
    is_investor: true,
    looking_for_opportunities: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '8',
    full_name: 'Kofi Mensah',
    profession: 'Creative Director',
    company: 'Afrocentric Media',
    location: 'New York, USA',
    country_of_origin: 'Ghana',
    bio: 'Creating compelling visual narratives that celebrate African culture and diaspora stories.',
    skills: ['Creative Direction', 'Branding', 'Film Production', 'Digital Media'],
    avatar_url: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400',
    is_mentor: true,
    is_investor: false,
    looking_for_opportunities: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// Demo data for communities (9 communities - removed Climate Solutions Network)
const demoCommunities: Community[] = [
  {
    id: '1',
    name: 'African Tech Leaders',
    description: 'A community for African technology leaders and innovators sharing insights and opportunities.',
    category: 'Technology',
    member_count: 1250,
    is_featured: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Diaspora Entrepreneurs',
    description: 'Connecting African entrepreneurs in the diaspora to share resources and support.',
    category: 'Business',
    member_count: 890,
    is_featured: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Women in African Tech',
    description: 'Empowering African women in technology through mentorship and networking.',
    category: 'Technology',
    member_count: 650,
    is_featured: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: 'African Healthcare Innovation',
    description: 'Advancing healthcare solutions and medical innovation across Africa.',
    category: 'Healthcare',
    member_count: 420,
    is_featured: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    name: 'Sustainable Energy Africa',
    description: 'Promoting renewable energy and sustainable development across African communities.',
    category: 'Energy',
    member_count: 380,
    is_featured: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '6',
    name: 'African Creative Industries',
    description: 'Supporting artists, designers, and creative professionals in the diaspora.',
    category: 'Creative',
    member_count: 720,
    is_featured: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '7',
    name: 'Financial Inclusion Africa',
    description: 'Driving financial technology and inclusion initiatives across African markets.',
    category: 'Finance',
    member_count: 540,
    is_featured: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '8',
    name: 'African Agriculture Tech',
    description: 'Modernizing agriculture through technology and sustainable farming practices.',
    category: 'Agriculture',
    member_count: 310,
    is_featured: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '9',
    name: 'African Youth Development',
    description: 'Mentoring and supporting the next generation of African leaders.',
    category: 'Education',
    member_count: 950,
    is_featured: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// Demo data for events (10 events created by the 8 professionals)
const demoEvents: Event[] = [
  {
    id: '1',
    title: 'African Tech Summit 2025',
    description: 'Experience three days of inspiring keynotes, interactive workshops, and unparalleled networking opportunities that bring together the brightest minds in African technology innovation.',
    type: 'Conference',
    date_time: '2025-07-15T09:00:00Z',
    location: 'London, UK',
    is_virtual: false,
    attendee_count: 500,
    is_featured: true,
    banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=200&fit=crop',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    creator_profile: {
      id: '1',
      full_name: 'Dr. Amara Okafor',
      avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b829?w=80'
    }
  },
  {
    id: '2',
    title: 'Diaspora Investment Webinar',
    description: 'Discover high-impact investment opportunities across African markets while connecting with fellow diaspora investors and successful entrepreneurs.',
    type: 'Webinar',
    date_time: '2025-08-20T18:00:00Z',
    location: 'Virtual Event',
    is_virtual: true,
    attendee_count: 250,
    is_featured: true,
    banner_url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=500&h=200&fit=crop',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    creator_profile: {
      id: '2',
      full_name: 'Prof. Kwame Asante',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80'
    }
  },
  {
    id: '3',
    title: 'Women in Tech Leadership Workshop',
    description: 'Empower your leadership journey through intensive workshops focused on executive presence and strategic thinking.',
    type: 'Workshop',
    date_time: '2025-09-25T14:00:00Z',
    location: 'Toronto, Canada',
    is_virtual: false,
    attendee_count: 80,
    is_featured: false,
    banner_url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500&h=200&fit=crop',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    creator_profile: {
      id: '3',
      full_name: 'Sarah Mwangi',
      avatar_url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=80'
    }
  },
  {
    id: '4',
    title: 'Sustainable Energy Solutions Meetup',
    description: 'Dive deep into renewable energy projects and climate adaptation strategies creating economic opportunities.',
    type: 'Meetup',
    date_time: '2025-10-05T19:00:00Z',
    location: 'Berlin, Germany',
    is_virtual: false,
    attendee_count: 45,
    is_featured: false,
    banner_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&h=200&fit=crop',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    creator_profile: {
      id: '4',
      full_name: 'Ibrahim Diallo',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80'
    }
  },
  {
    id: '5',
    title: 'HealthTech Innovation Forum',
    description: 'Explore cutting-edge digital health solutions and medical device innovations revolutionizing healthcare delivery.',
    type: 'Forum',
    date_time: '2025-11-10T10:00:00Z',
    location: 'Virtual Event',
    is_virtual: true,
    attendee_count: 180,
    is_featured: true,
    banner_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=500&h=200&fit=crop',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    creator_profile: {
      id: '5',
      full_name: 'Fatima Al-Rashid',
      avatar_url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80'
    }
  },
  {
    id: '6',
    title: 'African Entrepreneurship Bootcamp',
    description: 'Intensive training for African entrepreneurs looking to scale their businesses globally with expert guidance.',
    type: 'Bootcamp',
    date_time: '2025-12-15T09:00:00Z',
    location: 'Paris, France',
    is_virtual: false,
    attendee_count: 30,
    is_featured: false,
    banner_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=200&fit=crop',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    creator_profile: {
      id: '6',
      full_name: 'Dr. Chinedu Okonkwo',
      avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80'
    }
  },
  {
    id: '7',
    title: 'Financial Inclusion Summit 2025',
    description: 'Explore groundbreaking fintech solutions and digital payment systems driving financial inclusion across African markets.',
    type: 'Summit',
    date_time: '2025-08-22T11:00:00Z',
    location: 'Dubai, UAE',
    is_virtual: false,
    attendee_count: 300,
    is_featured: true,
    banner_url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=500&h=200&fit=crop',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    creator_profile: {
      id: '7',
      full_name: 'Aisha Kone',
      avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80'
    }
  },
  {
    id: '8',
    title: 'AgriTech Innovation Workshop',
    description: 'Discover precision agriculture technologies and supply chain innovations transforming food systems.',
    type: 'Workshop',
    date_time: '2025-09-30T15:00:00Z',
    location: 'Virtual Event',
    is_virtual: true,
    attendee_count: 120,
    is_featured: false,
    banner_url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&h=200&fit=crop',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    creator_profile: {
      id: '8',
      full_name: 'Kofi Mensah',
      avatar_url: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=80'
    }
  },
  {
    id: '9',
    title: 'Creative Industries Networking Night',
    description: 'Celebrate the vibrant creativity of the African diaspora through networking with artists, designers, and cultural entrepreneurs.',
    type: 'Networking',
    date_time: '2025-10-28T18:30:00Z',
    location: 'New York, USA',
    is_virtual: false,
    attendee_count: 75,
    is_featured: false,
    banner_url: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?w=500&h=200&fit=crop',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    creator_profile: {
      id: '1',
      full_name: 'Dr. Amara Okafor',
      avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b829?w=80'
    }
  },
  {
    id: '10',
    title: 'Youth Leadership Development Conference 2025',
    description: 'Develop essential leadership skills through interactive workshops and learn from accomplished African leaders.',
    type: 'Conference',
    date_time: '2025-11-05T09:00:00Z',
    location: 'Amsterdam, Netherlands',
    is_virtual: false,
    attendee_count: 200,
    is_featured: true,
    banner_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500&h=200&fit=crop',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    creator_profile: {
      id: '2',
      full_name: 'Prof. Kwame Asante',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80'
    }
  }
];

export const useSearch = () => {
  const { toast } = useToast();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchAll = async (query: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate search functionality by filtering demo data
      const filteredProfessionals = demoProfessionals.filter(p => 
        p.full_name.toLowerCase().includes(query.toLowerCase()) ||
        p.profession?.toLowerCase().includes(query.toLowerCase()) ||
        p.company?.toLowerCase().includes(query.toLowerCase()) ||
        p.bio?.toLowerCase().includes(query.toLowerCase())
      );
      
      const filteredCommunities = demoCommunities.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
      );
      
      const filteredEvents = demoEvents.filter(e =>
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        e.description.toLowerCase().includes(query.toLowerCase()) ||
        e.type.toLowerCase().includes(query.toLowerCase())
      );
      
      setProfessionals(filteredProfessionals);
      setCommunities(filteredCommunities);
      setEvents(filteredEvents);
      
      if (query) {
        toast({
          title: "Search Results",
          description: `Found ${filteredProfessionals.length} professionals, ${filteredCommunities.length} communities, and ${filteredEvents.length} events`,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  const searchProfessionals = async (query: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const filtered = demoProfessionals.filter(p => 
        p.full_name.toLowerCase().includes(query.toLowerCase()) ||
        p.profession?.toLowerCase().includes(query.toLowerCase()) ||
        p.company?.toLowerCase().includes(query.toLowerCase())
      );
      setProfessionals(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search professionals');
    } finally {
      setLoading(false);
    }
  };

  const searchCommunities = async (query: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const filtered = demoCommunities.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase())
      );
      setCommunities(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search communities');
    } finally {
      setLoading(false);
    }
  };

  const searchEvents = async (query: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const filtered = demoEvents.filter(e =>
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        e.description.toLowerCase().includes(query.toLowerCase())
      );
      setEvents(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search events');
    } finally {
      setLoading(false);
    }
  };

  const getAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load all demo data
      setProfessionals(demoProfessionals);
      setCommunities(demoCommunities);
      setEvents(demoEvents);
      setProjects([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  return {
    professionals,
    communities,
    events,
    projects,
    loading,
    error,
    searchAll,
    searchProfessionals,
    searchCommunities,
    searchEvents,
    getAllData
  };
};
