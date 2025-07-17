'use client';

import React, { createContext, useCallback, useContext, useEffect, useState, Suspense } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { usePathname, useSearchParams } from 'next/navigation';
import { UserRole, Profile, UserWithRelationships, Class } from '@/types';
import { getChildrenForParent, getParentsForChild, getClassesForTeacher } from '@/utils/supabase/relationships';

/**
 * Authentication context type definition
 * Provides authentication state and methods for the entire application
 */
type AuthContextType = {
  /** Current authenticated user from Supabase Auth */
  user: User | null;
  /** Current session object */
  session: Session | null;
  /** User profile with extended information */
  profile: Profile | null;
  /** User role in the system */
  userRole: UserRole | null;
  /** User with relationship data (children/parents/classes) */
  userWithRelationships: UserWithRelationships | null;
  /** Loading state indicator */
  loading: boolean;
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  /** Sign up new user with email and password */
  signUp: (email: string, password: string) => Promise<{ 
    error: Error | null, 
    data: { user?: User | null } | null 
  }>;
  /** Sign out current user */
  signOut: () => Promise<void>;
  /** Refresh current session */
  refreshSession: () => Promise<Session | null>;
  /** Refresh user profile and relationships */
  refreshProfile: () => Promise<void>;
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

/**
 * Main authentication provider component
 * Manages authentication state and provides context to child components
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userWithRelationships, setUserWithRelationships] = useState<UserWithRelationships | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseClient] = useState(() => createClient());

  /**
   * Fetches user relationships based on their role
   * @param userId - The user ID
   * @param role - The user's role
   * @param profile - The user's profile data
   */
  const fetchUserRelationships = useCallback(async (userId: string, role: UserRole, profile: Profile) => {
    try {
      const baseUser = {
        id: userId,
        full_name: profile.display_name,
        email: profile.email || '',
        role: role,
        assigned_editor: false
      };

      let relationshipData: UserWithRelationships = baseUser;

      switch (role) {
        case UserRole.PARENT:
          const children = await getChildrenForParent(userId);
          relationshipData = { ...baseUser, children: children || [] };
          break;

        case UserRole.CHILD:
          const parents = await getParentsForChild(userId);
          relationshipData = { ...baseUser, parents: parents || [] };
          break;

        case UserRole.TEACHER:
          const classes = await getClassesForTeacher(userId);
          relationshipData = { ...baseUser, classes: (classes as unknown as Class[]) || [] };
          break;

        case UserRole.ADMIN:
          // Admins don't need relationship data
          break;
      }

      setUserWithRelationships(relationshipData);
    } catch (error) {
      console.error('Error fetching user relationships:', error);
    }
  }, []);

  /**
   * Fetches user profile and role from database
   * @param userId - The user ID to fetch profile for
   */
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      // Get user profile
      const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      // Get user role
      const { data: roleData, error: roleError } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleError) {
        console.error('Error fetching role:', roleError);
        return;
      }

      setProfile(profileData);
      setUserRole(roleData.role as UserRole);

      // Fetch relationships based on role
      await fetchUserRelationships(userId, roleData.role as UserRole, profileData);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  }, [supabaseClient, fetchUserRelationships]);

  /**
   * Refreshes user profile and relationship data
   */
  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  };

  /**
   * Refreshes the current session and user data
   * @returns Promise resolving to the session object
   */
  const refreshSession = useCallback(async () => {
    try {
      const { data } = await supabaseClient.auth.getSession();
      setSession(data.session);
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      
      // If user exists, fetch their profile and relationships
      if (sessionUser?.id) {
        await fetchUserProfile(sessionUser.id);
      } else {
        // Clear user data if no session
        setProfile(null);
        setUserRole(null);
        setUserWithRelationships(null);
      }
      
      return data.session;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return null;
    }
  }, [supabaseClient, fetchUserProfile]);

  // Callback for when path or search params change
  const handlePathChange = useCallback((_pathname: string, _searchParams: URLSearchParams) => {
    // Only refresh session if we don't have a session or user
    if (!session || !user) {
      refreshSession();
    }
  }, [refreshSession, session, user]);

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
  const signUp = async (email: string, password: string) => {
    try {
      // Ask the server to create a new account
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
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

  /**
   * Signs out the current user and clears all session data
   */
  const signOut = async () => {
    try {
      // Ask the server to log the user out
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to sign out');
      }
      
      // Clear all user data
      setUser(null);
      setSession(null);
      setProfile(null);
      setUserRole(null);
      setUserWithRelationships(null);
      
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
          
          // Clear all information when a user logs out
          if (event === 'SIGNED_OUT') {
            setUser(null);
            setSession(null);
            setProfile(null);
            setUserRole(null);
            setUserWithRelationships(null);
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
    profile,
    userRole,
    userWithRelationships,
    loading,
    signIn,
    signUp,
    signOut,
    refreshSession,
    refreshProfile,
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