import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with the database
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Types for our database tables
export type Profile = {
  id: string;
  display_name: string | null;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
};

export type Podcast = {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
};

export type Episode = {
  id: string;
  podcast_id: string | null;
  title: string;
  description: string | null;
  audio_url: string;
  language: string;
  duration: number | null;
  published_at: string;
  created_at: string;
  status: string;
  cover_image: string | null;
};

export type Subscription = {
  id: string;
  user_id: string | null;
  podcast_id: string | null;
  created_at: string;
};

export type UserRole = {
  id: string;
  user_id: string | null;
  role: 'admin' | 'user';
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'created_at' | 'updated_at'>>;
      };
      podcasts: {
        Row: Podcast;
        Insert: Omit<Podcast, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Podcast, 'created_at' | 'updated_at'>>;
      };
      episodes: {
        Row: Episode;
        Insert: Omit<Episode, 'created_at'>;
        Update: Partial<Omit<Episode, 'created_at'>>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, 'created_at'>;
        Update: Partial<Omit<Subscription, 'created_at'>>;
      };
      user_roles: {
        Row: UserRole;
        Insert: Omit<UserRole, 'created_at'>;
        Update: Partial<Omit<UserRole, 'created_at'>>;
      };
    };
  };
}; 