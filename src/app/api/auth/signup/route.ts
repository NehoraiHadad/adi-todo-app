import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, role } = await request.json() // Added role
    
    if (!email || !password || !username || !role) { // Added role validation
      return NextResponse.json(
        { error: 'Email, password, username, and role are required' }, // Updated error message
        { status: 400 }
      )
    }
    
    // Optional: Validate if the role is one of the expected UserRole enum values
    // This might require importing UserRole and checking against Object.values(UserRole)
    // For now, we assume the client sends a valid role string.

    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: username,
        },
      },
    })
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    if (data.user) {
      // 1. Create profile
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: username, // Using username from request as per existing logic
            email: data.user.email, // Using email from auth user
            // role: role // If we decide to also store role in profiles table
          });

        if (profileError) {
          // Log and potentially alert, but don't necessarily block if user_roles succeeds
          console.error('Failed to create profile:', profileError.message);
          // Depending on policy, might want to return error here
        }
      } catch (profileCatchError: any) {
        console.error('Exception during profile creation:', profileCatchError.message);
      }

      // 2. Insert into user_roles table
      try {
        const { error: roleError } = await supabase
          .from('user_roles') // Assuming table name is 'user_roles'
          .insert({
            user_id: data.user.id,
            role: role, // The role received from the signup form
          });

        if (roleError) {
          console.error('Failed to insert user role:', roleError.message);
          // This is a more critical error.
          // Consider if the user signup should be "rolled back" or flagged.
          // For now, just log and return an error to the client.
          // NOTE: Supabase auth.signUp has already created the user.
          // Deleting the auth user here if role insertion fails adds complexity.
          return NextResponse.json(
            { error: 'User signed up but failed to assign role. Please contact support.' },
            { status: 500 } 
          );
        }
      } catch (roleCatchError: any) {
        console.error('Exception during user_roles insertion:', roleCatchError.message);
        return NextResponse.json(
            { error: 'User signed up but encountered an exception assigning role. Please contact support.' },
            { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { data }, // Contains user session information
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error during sign up:', error.message);
    return NextResponse.json(
      { error: 'An unexpected error occurred during signup.' },
      { status: 500 }
    )
  }
}