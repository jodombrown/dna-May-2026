// Supabase client configuration
// Uses centralized config for environment variables
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { config } from '@/lib/config';

const SUPABASE_URL = config.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = config.SUPABASE_ANON_KEY;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'dna-auth-token',
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'dna-platform@1.0.0',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});