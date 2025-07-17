import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for browser use
 * Supports both new (publishable) and legacy (anon) API keys during migration period
 */
export const createClient = () => {
  // Support both new publishable key and legacy anon key during migration
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!anonKey) {
    throw new Error(
      'Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey
  )
} 