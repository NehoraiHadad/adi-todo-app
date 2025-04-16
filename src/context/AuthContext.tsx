'use client';

import React, { createContext, useCallback, useContext, useEffect, useState, Suspense } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { usePathname, useSearchParams } from 'next/navigation';

// This defines what our auth system can do
type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ 
    error: Error | null, 
    data: { user?: User | null } | null 
  }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<Session | null>;
};

// Create a special box to store our login information
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// This is a helper that lets other parts of the app use our login system
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Component that uses search params (needs Suspense)
const AuthProviderWithSearchParams = ({ 
  children, 
  onPathChange
}: { 
  children: React.ReactNode,
  onPathChange: (pathname: string, searchParams: URLSearchParams) => void
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    if (pathname && searchParams) {
      onPathChange(pathname, searchParams);
    }
  }, [pathname, searchParams, onPathChange]);
  
  return <>{children}</>;
};

// This is the main login system that keeps track of who is logged in
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseClient] = useState(() => createClient());

  // Get the latest login information
  const refreshSession = useCallback(async () => {
    const { data } = await supabaseClient.auth.getSession();
    setSession(data.session);
    setUser(data.session?.user ?? null);
    return data.session;
  }, [supabaseClient]);

  // Callback for when path or search params change
  const handlePathChange = useCallback((_pathname: string, _searchParams: URLSearchParams) => {
    refreshSession();
  }, [refreshSession]);

  // This helps a user log in to their account
  const signIn = async (email: string, password: string) => {
    try {
      // Ask the server to check if the password is correct
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const result = await response.json();
      
      if (!response.ok) return { error: new Error(result.error) };
      
      // Get the latest login information
      await refreshSession();
      
      return { error: null };
    } catch (error) {
      console.error('אירעה שגיאה לא צפויה', error)
      return { error: error instanceof Error ? error : new Error('Login failed') };
    }
  };

  // This helps a new user create an account
  const signUp = async (email: string, password: string, username: string) => {
    try {
      // Ask the server to create a new account
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username }),
      });
      
      const result = await response.json();
      
      if (!response.ok) return { error: new Error(result.error), data: null };
      
      // Get the latest login information
      await refreshSession();
      
      return { error: null, data: result.data };
    } catch (error) {
      return { 
        error: error instanceof Error ? error : new Error('Sign up failed'), 
        data: null 
      };
    }
  };

  // This helps a user log out of their account
  const signOut = async () => {
    try {
      // Ask the server to log the user out
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to sign out');
      }
      
      // Clear who is logged in
      setUser(null);
      setSession(null);
      
      // Go back to the login page
      window.location.href = '/login';
    } catch (_error) {
      console.error('אירעה שגיאה לא צפויה', _error)
      // Even if there's a problem, try to go to the login page anyway
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    // Check if the user is logged in when the app starts
    const initializeAuth = async () => {
      setLoading(true);
      
      try {
        const { data } = await supabaseClient.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (_error) {
        // If there's a problem, no one is logged in
        console.error('אירעה שגיאה לא צפויה', _error)
      } finally {
        setLoading(false);
      }
      
      // Listen for when login status changes
      const { data: authListener } = supabaseClient.auth.onAuthStateChange(
        async (event, newSession) => {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          // Update information when a user logs in
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await refreshSession();
          }
          
          // Clear information when a user logs out
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
      // Clean up when the app closes
      unsubscribe.then(fn => fn());
    };
  }, [supabaseClient, refreshSession]);

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      <Suspense fallback={null}>
        <AuthProviderWithSearchParams onPathChange={handlePathChange}>
          {children}
        </AuthProviderWithSearchParams>
      </Suspense>
    </AuthContext.Provider>
  );
}; 