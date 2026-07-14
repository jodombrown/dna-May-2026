import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

interface EntityLiveData {
  title: string;
  slug?: string;
  deleted?: boolean;
  startDate?: string;
  location?: string;
  eventType?: string;
  attendeeCount?: number;
  category?: string;
  memberCount?: number;
  opportunityType?: string;
  authorName?: string;
  likeCount?: number;
}

async function fetchEventData(entityId: string): Promise<EntityLiveData> {
  const { data, error } = await db
    .from('events')
    .select('id, title, slug, start_time, date_confirmed, location_name, event_type, is_cancelled')
    .eq('id', entityId)
    .maybeSingle();

  if (error || !data) {
    return { title: 'Unknown Event', deleted: true };
  }

  const { count } = await db
    .from('event_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', entityId);

  return {
    title: data.title,
    slug: data.slug,
    deleted: data.is_cancelled || false,
    startDate: data.date_confirmed === false ? null : data.start_time,
    location: data.location_name,
    eventType: data.event_type,
    attendeeCount: count ?? 0,
  };
}

async function fetchSpaceData(entityId: string): Promise<EntityLiveData> {
  const { data, error } = await db
    .from('spaces')
    .select('id, name, slug, space_type, status')
    .eq('id', entityId)
    .maybeSingle();

  if (error || !data) {
    return { title: 'Unknown Space', deleted: true };
  }

  const { count } = await db
    .from('space_members')
    .select('*', { count: 'exact', head: true })
    .eq('space_id', entityId);

  return {
    title: data.name,
    slug: data.slug,
    deleted: data.status === 'archived',
    category: data.space_type,
    memberCount: count ?? 0,
  };
}

async function fetchOpportunityData(entityId: string): Promise<EntityLiveData> {
  const { data, error } = await db
    .from('opportunities')
    .select('id, title, type, status')
    .eq('id', entityId)
    .maybeSingle();

  if (error || !data) {
    return { title: 'Unknown Opportunity', deleted: true };
  }

  return {
    title: data.title,
    deleted: data.status === 'closed',
    opportunityType: data.type,
  };
}

async function fetchPostData(entityId: string): Promise<EntityLiveData> {
  const { data, error } = await db
    .from('posts')
    .select('id, content, author_id, profiles:author_id(full_name)')
    .eq('id', entityId)
    .maybeSingle();

  if (error || !data) {
    return { title: 'Unknown Post', deleted: true };
  }

  const { count } = await db
    .from('post_reactions')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', entityId);

  const profile = data.profiles as { full_name: string } | null;

  return {
    title: data.content?.slice(0, 60) || 'Post',
    authorName: profile?.full_name,
    likeCount: count ?? 0,
  };
}

async function fetchStoryData(entityId: string): Promise<EntityLiveData> {
  // Stories are stored in the posts table with post_type = 'story'
  const { data, error } = await db
    .from('posts')
    .select('id, content, title, author_id, profiles:author_id(full_name)')
    .eq('id', entityId)
    .maybeSingle();

  if (error || !data) {
    return { title: 'Unknown Story', deleted: true };
  }

  const profile = data.profiles as { full_name: string } | null;

  return {
    title: data.title || (data.content?.slice(0, 60) || 'Story'),
    authorName: profile?.full_name,
  };
}

export function useEntityReferenceData(
  entityType: string,
  entityId: string
) {
  return useQuery<EntityLiveData>({
    queryKey: ['entity-reference', entityType, entityId],
    queryFn: async () => {
      switch (entityType) {
        case 'event':
          return fetchEventData(entityId);
        case 'space':
          return fetchSpaceData(entityId);
        case 'opportunity':
          return fetchOpportunityData(entityId);
        case 'post':
          return fetchPostData(entityId);
        case 'story':
          return fetchStoryData(entityId);
        default:
          return { title: 'Unknown', deleted: true };
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(entityType && entityId),
  });
}
