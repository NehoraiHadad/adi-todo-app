import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Create a direct Supabase client instead of using createRouteHandlerClient
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  
  // Create direct client with admin rights for internal operations
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });
  
  // Get the session token from cookie
  const cookieStore = cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  
  if (!accessToken) {
    return NextResponse.json(
      { error: 'User is not authenticated' },
      { status: 401 }
    );
  }
  
  // Set the auth header
  supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: '',
  });

  try {
    // Get session to verify user is authenticated
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();

    if (sessionError || !user) {
      return NextResponse.json(
        { error: 'User is not authenticated' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const user_metadata = user.user_metadata;

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        { message: 'Profile already exists', profile: existingProfile },
        { status: 200 }
      );
    }

    // Get display name from user metadata
    const displayName = user_metadata?.display_name || 'User';
    
    // Create new profile for user
    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          display_name: displayName,
          email_notifications: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: newProfile }, { status: 201 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  // Create a direct Supabase client instead of using createRouteHandlerClient
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  
  // Create direct client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });
  
  // Get the session token from cookie
  const cookieStore = cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  
  if (!accessToken) {
    return NextResponse.json(
      { error: 'User is not authenticated' },
      { status: 401 }
    );
  }
  
  // Set the auth header
  supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: '',
  });

  try {
    // Get session to verify user is authenticated
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();

    if (sessionError || !user) {
      return NextResponse.json(
        { error: 'User is not authenticated' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Get user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 