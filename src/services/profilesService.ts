import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type Profile = Tables<'profiles'>;

// Public profile type returned by RPC functions
interface PublicProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  is_public?: boolean;
}

export const profilesService = {
  // Get all public profiles with optional filtering
  // Only returns non-sensitive fields (no email, phone, private contact info)
  async getPublicProfiles(filters?: {
    location?: string;
    skills?: string[];
    profession?: string;
    limit?: number;
  }) {
    const { data, error } = await supabase
      .rpc('rpc_public_profiles', {
        p_location: filters?.location ?? null,
        p_profession: filters?.profession ?? null,
        p_skills: filters?.skills ?? null,
        p_limit: filters?.limit ?? null,
      });

    if (error) throw error;
    return data;
  },

  // Get profile by ID - respects privacy settings
  // Only returns non-sensitive fields for public viewing
  async getProfileById(id: string) {
    const { data, error } = await supabase
      .rpc('rpc_public_profile_by_id', { p_id: id })
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get profile by username using secure function
  async getProfileByUsername(username: string): Promise<PublicProfile | null> {
    const { data: profiles, error } = await supabase
      .rpc('get_public_profiles', { p_limit: 50 });

    if (error) throw error;

    const typedProfiles = (profiles as unknown as PublicProfile[]) || [];
    const profile = typedProfiles.find((p) => p.username === username);
    return profile || null;
  },

  // Update user's own profile
  async updateProfile(id: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) {
      throw new Error('No profile updated. Please check your permissions and try again.');
    }
    return data;
  },

  // Get own full profile with all fields (including private ones)
  // Uses SECURITY DEFINER RPC because sensitive columns (email/phone/whatsapp_number)
  // are revoked from direct authenticated SELECT on profiles.
  async getOwnProfile(_userId: string) {
    const { data, error } = await (supabase.rpc as any)('get_own_profile').single();
    if (error) throw error;
    return data;
  },

  // Get current user's full profile with realtime updates
  async getCurrentUserProfile(_userId: string) {
    const { data, error } = await (supabase.rpc as any)('get_own_profile').maybeSingle();
    if (error) throw error;
    return data;
  },

  // Get projects and initiatives for a user
  async getUserProjectsAndInitiatives(userId: string) {
    const [projectsResult, initiativesResult] = await Promise.all([
      supabase
        .from('projects')
        .select('*')
        .eq('creator_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
      supabase
        .from('initiatives')
        .select('*')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })
    ]);

    return {
      projects: projectsResult.data || [],
      initiatives: initiativesResult.data || [],
    };
  }
};