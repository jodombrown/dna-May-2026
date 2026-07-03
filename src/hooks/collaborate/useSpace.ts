import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isUUID } from '@/utils/slugify';

export interface SpaceRecord {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  status: string;
  visibility: string;
  space_type: string;
  created_by: string;
}

/**
 * Resolve a space from a route param that may be either a slug or a UUID
 * (many legacy call sites pass a space id). When the param is a UUID and the
 * space has a slug, the URL is rewritten to the canonical slug form via
 * `canonicalPath` (defaults to the space detail route).
 */
export function useSpace(
  param: string,
  canonicalPath: (slug: string) => string = (slug) => `/dna/collaborate/spaces/${slug}`,
) {
  const navigate = useNavigate();
  const paramIsUUID = isUUID(param);

  const query = useQuery({
    queryKey: ['space', param],
    queryFn: async (): Promise<SpaceRecord | null> => {
      const column = paramIsUUID ? 'id' : 'slug';
      const { data, error } = await supabase
        .from('spaces')
        .select('id, slug, name, tagline, description, status, visibility, space_type, created_by')
        .eq(column, param)
        .maybeSingle();
      if (error) throw error;
      return data as SpaceRecord | null;
    },
    enabled: param.length > 0,
  });

  const space = query.data ?? null;

  useEffect(() => {
    if (space && paramIsUUID && space.slug) {
      navigate(canonicalPath(space.slug), { replace: true });
    }
    // canonicalPath is expected to be stable per call site; re-running on
    // navigate/space changes is sufficient.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [space, paramIsUUID, navigate]);

  return { space, isLoading: query.isLoading, isError: query.isError };
}
