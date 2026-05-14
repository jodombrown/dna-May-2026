
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * User profile data from the profiles table
 */
export interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  company: string | null;
  profession: string | null;
  industry: string | null;
  created_at: string;
  updated_at?: string;
  // Optional fields that may be present
  current_country?: string | null;
  current_city?: string | null;
  country_of_origin?: string | null;
  diaspora_origin?: string | null;
  diaspora_status?: string | null;
  verification_status?: string | null;
  current_role?: string | null;
  professional_title?: string | null;
  professional_role?: string | null;
  professional_sectors?: string[] | null;
  skills?: string[] | null;
  years_experience?: number | null;
  interests?: string[] | null;
  my_dna_statement?: string | null;
  focus_areas?: string[] | null;
  regional_expertise?: string[] | null;
  industries?: string[] | null;
  engagement_intentions?: string[] | null;
  onboarding_completed_at?: string | null;
  connections_count?: number | null;
  connection_count?: number | null;
  profile_views_count?: number | null;
}

/**
 * Error type for auth operations - matches Supabase AuthError structure
 */
export interface AuthOperationError {
  message: string;
  name?: string;
  status?: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: UserProfile | null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | AuthOperationError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | AuthOperationError | null; data?: { user: User | null } }>;
  signOut: () => Promise<void>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        return;
      }

      if (!data) {
        // Profile should have been created by trigger — brief retry delay
        await new Promise(resolve => setTimeout(resolve, 150));

        // Try one more time
        const { data: retryData, error: retryError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (retryError) {
          return;
        }

        if (retryData) {
          setProfile(retryData);
          return;
        }

        // If still no profile, the trigger failed
        return;
      }

      setProfile(data);
    } catch {
      // Silently ignore profile fetch errors
    }
  };

  // Public method to refresh profile
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Removed dev bypass; relying solely on Supabase auth

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
      if (session?.user) {
          // Fetch profile immediately - the retry inside fetchProfile handles race conditions
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        // Only set loading to false after initial session check is complete
        if (isInitialized) {
          setLoading(false);
        }
      }
    );

    // Get initial session with error handling
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setIsInitialized(true);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
        
        setIsInitialized(true);
        setLoading(false);
      } catch {
        setIsInitialized(true);
        setLoading(false);
      }
    };

    getInitialSession();

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/dna/feed`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          }
        }
      });
      
      if (error) {
        // Provide more specific error messages
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          return { error: { ...error, message: 'This email is already registered. Please sign in instead.' } };
        }
        const lowerMsg = error.message.toLowerCase();
        // Map only explicit minimum-length messages to our 8-character requirement
        if (
          lowerMsg.includes('should be at least') ||
          lowerMsg.includes('at least 6 characters') ||
          lowerMsg.includes('at least 8 characters')
        ) {
          return { error: { ...error, message: 'Password must be at least 8 characters long.' } };
        }
        // For other password-related errors (strength, leaks, etc.), surface Supabase's message directly
        if (lowerMsg.includes('password')) {
          return { error };
        }
        if (error.message.includes('Invalid email') || error.message.includes('invalid email')) {
          return { error: { ...error, message: 'Please enter a valid email address.' } };
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
          return { error: { ...error, message: 'Connection error. Please check your internet connection and try again.' } };
        }
        // Return the original error message if no specific match
        return { error };
      }
      
      return { error };
    } catch {
      return { 
        error: { 
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
          name: 'NetworkError'
        } 
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Provide more specific error messages
        if (error.message.includes('Invalid login credentials')) {
          return { error: { ...error, message: 'Invalid email or password. Please try again.' } };
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: { ...error, message: 'Please check your email and confirm your account before signing in.' } };
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
          return { error: { ...error, message: 'Connection error. Please check your internet connection and try again.' } };
        }
      }
      
      return { error, data: { user: data?.user ?? null } };
    } catch {
      return { 
        error: { 
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
          name: 'NetworkError'
        } 
      };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password: password
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    profile,
    signUp,
    signIn,
    signOut,
    updatePassword,
    refreshProfile,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
