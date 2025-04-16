import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const { id, display_name, email_notifications } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .single();
    
    // If profile exists, return success
    if (existingProfile) {
      return NextResponse.json(
        { message: 'Profile already exists' },
        { status: 200 }
      );
    }
    
    // Create the profile using the server-side client
    const { error: insertError } = await supabase
      .from('profiles')
      .insert([
        {
          id,
          display_name: display_name || null,
          email_notifications: email_notifications || false,
        },
      ]);
    
    if (insertError) {
      console.error('Error creating profile:', insertError);
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Profile created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in create-profile API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 