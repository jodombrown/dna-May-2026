// Supabase client configuration
// Uses centralized config for environment variables
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { config } from '@/lib/config';

const SUPABASE_URL = config.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = config.SUPABASE_ANON_KEY;

type DnaRealtimeChannelSnapshot = {
  topic: string;
  state: string;
};

declare global {
  interface Window {
    __dnaRealtime?: {
      count: () => number;
      list: () => DnaRealtimeChannelSnapshot[];
      print: () => DnaRealtimeChannelSnapshot[];
    };
  }
}

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

if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.__dnaRealtime = {
    count: () => supabase.getChannels().length,
    list: () => supabase.getChannels().map((channel) => ({
      topic: channel.topic,
      state: String(channel.state),
    })),
    print: () => {
      const channels = window.__dnaRealtime?.list() ?? [];
      console.table(channels);
      return channels;
    },
  };
}