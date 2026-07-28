
import { supabase } from '@/integrations/supabase/client';
import { Community } from '@/types/search';

type QueryResult<T> = { data: T | null; error: Error | null };
interface QueryBuilder<T> extends PromiseLike<QueryResult<T[]>> {
  select(columns: string): QueryBuilder<T>;
  or(filter: string): QueryBuilder<T>;
  eq(column: string, value: unknown): QueryBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T>;
}

interface UntypedSupabase {
  from<T>(table: string): QueryBuilder<T>;
}

type CommunityRow = Community;

const untypedSupabase = supabase as unknown as UntypedSupabase;

export const searchCommunities = async (searchTerm: string = '', category?: string): Promise<Community[]> => {
  let query = untypedSupabase.from<CommunityRow>('communities').select('*');
  
  if (searchTerm) {
    query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
  }
  
  if (category) {
    query = query.eq('category', category);
  }
  
  const { data, error } = await query.order('member_count', { ascending: false });
  
  if (error) throw error;
  return data || [];
};
