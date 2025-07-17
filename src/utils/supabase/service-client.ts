import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client with service role key for admin operations
 * This client bypasses Row Level Security (RLS) policies
 * 
 * ⚠️ SECURITY WARNING: Only use this client in server-side code
 * Never expose the service key to the client/browser
 */

let serviceSupabase: ReturnType<typeof createClient> | null = null;

/**
 * Get a service-level Supabase client that bypasses RLS
 * This should only be used for admin operations on the server side
 * 
 * @returns Supabase client with service role permissions
 */
export function getServiceSupabase() {
  // Ensure we're running on the server
  if (typeof window !== 'undefined') {
    throw new Error('Service Supabase client cannot be used in the browser');
  }

  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Support both old and new service keys for migration period
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and (SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY)'
    );
  }

  // Create singleton instance
  if (!serviceSupabase) {
    serviceSupabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return serviceSupabase;
}

/**
 * Create a one-time service client instance
 * Use this when you need a fresh instance
 */
export function createServiceClient() {
  // Ensure we're running on the server
  if (typeof window !== 'undefined') {
    throw new Error('Service Supabase client cannot be used in the browser');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Support both old and new service keys for migration period
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and (SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY)'
    );
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}