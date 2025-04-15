'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any | null, data: any | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<Session | null>;
};

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
  const [loading, setLoading] = useState(true);
  const [supabaseClient] = useState(() => createClient());
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle sign in - this now uses a server action
  const signIn = async (email: string, password: string) => {
    try {
      // Call the server action for sign in
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const result = await response.json();
      
      if (!response.ok) return { error: result.error };
      
      // Refresh the session after successful server-side login
      await refreshSession();
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Handle sign up - this now uses a server action
  const signUp = async (email: string, password: string, username: string) => {
    try {
      // Call the server action for sign up
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username }),
      });
      
      const result = await response.json();
      
      if (!response.ok) return { error: result.error, data: null };
      
      // Refresh the session after successful server-side login
      await refreshSession();
      
      return { error: null, data: result.data };
    } catch (error) {
      return { error, data: null };
    }
  };

  // Handle sign out
  const signOut = async () => {
    try {
      console.log('Signing out...');
      
      // Call the server endpoint for sign out
      const response = await fetch('/auth/signout', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server signout error:', errorData);
        throw new Error('Failed to sign out');
      }
      
      // Clear local state immediately
      setUser(null);
      setSession(null);
      
      // Force redirect to login page
      console.log('Redirecting to login page...');
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, try to redirect anyway
      window.location.href = '/login';
    }
  };

  // Refresh session
  const refreshSession = async () => {
    const { data } = await supabaseClient.auth.getSession();
    setSession(data.session);
    setUser(data.session?.user ?? null);
    return data.session;
  };

  // Check for session changes on path/search param changes
  // This helps refresh the UI when authentication state changes
  useEffect(() => {
    refreshSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  useEffect(() => {
    // Initial session check
    const initializeAuth = async () => {
      setLoading(true);
      
      try {
        const { data } = await supabaseClient.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
      
      // Set up auth state change listener
      const { data: authListener } = supabaseClient.auth.onAuthStateChange(
        async (event, newSession) => {
          console.log('Auth state changed:', event);
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          // For sign_in events, make sure we reflect the change immediately
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await refreshSession();
          }
          
          // For sign_out events, clear the user state immediately
          if (event === 'SIGNED_OUT') {
            setUser(null);
            setSession(null);
          }
        }
      );
      
      return authListener.subscription.unsubscribe;
    };
    
    const unsubscribe = initializeAuth();
    
    return () => {
      // Cleanup auth listener on unmount
      unsubscribe.then(fn => fn());
    };
  }, [supabaseClient]);

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 