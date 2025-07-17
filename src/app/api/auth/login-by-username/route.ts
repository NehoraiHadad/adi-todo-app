import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Create a direct Supabase client instead of using createRouteHandlerClient
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  
  // Create direct client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });
  
  try {
    const { username, password } = await request.json();
    
    console.log(`Login attempt for username: ${username} with password length: ${password.length}`);
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    // For simplicity, try direct login first using the email format we use for signup
    // This avoids dependency on the user_emails view which might not be set up correctly
    const generateValidEmail = (username: string): string => {
      // First create a base64 encoding of the original username to preserve uniqueness
      // This ensures even Hebrew or non-Latin usernames get a unique identifier
      const uniqueId = Buffer.from(encodeURIComponent(username.trim())).toString('base64')
        .replace(/[+/=]/g, '').substring(0, 10);
      
      // Clean the username to ensure it works as an email (fallback for display)
      const sanitizedUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
      
      // Ensure minimum length for the display part
      const displayPart = sanitizedUsername.length < 3 
        ? sanitizedUsername + '123' 
        : sanitizedUsername;
      
      // Combine both parts to ensure uniqueness while maintaining readability
      return `${displayPart}-${uniqueId}@gmail.com`;
    };
    
    const email = generateValidEmail(username);
    
    console.log(`Trying direct login with generated email: ${email}`);
    
    // Try login with the generated email
    const { data: directLoginData, error: directLoginError } = await supabase.auth.signInWithPassword({
      email: email,
      password
    });
    
    if (!directLoginError && directLoginData?.user) {
      console.log('Direct login successful');
      
      // Set the auth cookie
      const authCookie = directLoginData.session?.access_token;
      if (authCookie) {
        const cookieStore = await cookies();
        cookieStore.set({
          name: 'sb-access-token',
          value: authCookie,
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 1 week
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production'
        });
      }
      
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      console.log('Direct login failed, trying profile lookup', directLoginError);
    }
    
    // If direct login failed, try looking up the user in profiles by username first, then display_name
    let profileData = null;
    let profileError = null;

    // First try by username
    console.log('Searching for user by username:', username);
    const { data: usernameData, error: usernameError } = await supabase
      .from('profiles')
      .select('id, email, username, display_name')
      .eq('username', username)
      .single();

    console.log('Username search result:', { data: usernameData, error: usernameError });

    if (!usernameError && usernameData) {
      profileData = usernameData;
    } else {
      // If username lookup failed, try by display_name
      console.log('Username not found, trying display_name:', username);
      const { data: displayData, error: displayError } = await supabase
        .from('profiles')
        .select('id, email, username, display_name')
        .eq('display_name', username)
        .single();
      
      console.log('Display name search result:', { data: displayData, error: displayError });
      
      profileData = displayData;
      profileError = displayError;
    }
      
    if (profileError || !profileData) {
      console.log('Profile lookup failed:', profileError);
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }
    
    console.log(`Found profile with ID: ${profileData.id}`);
    
    // If we found the email directly in the profile, use it
    if (profileData.email) {
      console.log(`Using email from profile: "${profileData.email}"`);
      console.log(`Profile found:`, profileData);
      console.log(`Attempting login with email: "${profileData.email}" and password length: ${password.length}`);
      
      // Sign in with the email from profile
      const { data, error } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password
      });
      
      if (error) {
        console.log('Login with profile email failed:', error);
        return NextResponse.json(
          { error: 'שם המשתמש או הסיסמה שגויים' },
          { status: 401 }
        );
      }
      
      // Set the auth cookie
      const authCookie = data.session?.access_token;
      if (authCookie) {
        const cookieStore = await cookies();
        cookieStore.set({
          name: 'sb-access-token',
          value: authCookie,
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 1 week
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production'
        });
      }
      
      return NextResponse.json({ success: true }, { status: 200 });
    }
    
    // Fallback: Try to get the user's email from the user_emails view
    try {
      const { data: userData, error: userError } = await supabase
        .from('user_emails')
        .select('email')
        .eq('id', profileData.id)
        .single();
        
      if (userError || !userData) {
        console.log('Email lookup failed:', userError);
        throw new Error('Could not find email for user');
      }
      
      console.log(`Found email from view: ${userData.email}`);
      
      // Now sign in with the email
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password
      });
      
      if (error) {
        console.log('Login with retrieved email failed:', error);
        return NextResponse.json(
          { error: 'שם המשתמש או הסיסמה שגויים' },
          { status: 401 }
        );
      }
      
      // Set the auth cookie
      const authCookie = data.session?.access_token;
      if (authCookie) {
        const cookieStore = await cookies();
        cookieStore.set({
          name: 'sb-access-token',
          value: authCookie,
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 1 week
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production'
        });
      }
      
      return NextResponse.json({ success: true }, { status: 200 });
    } catch (err) {
      console.log('Error in email lookup flow:', err);
      
      // If we can't find the email, try one more time with direct login using the ID as a key
      try {
        const userId = profileData.id;
        // Generate a deterministic email from the user ID
        const fallbackEmail = `user-${userId.slice(0, 8)}@gmail.com`;
        
        console.log(`Trying fallback email: ${fallbackEmail}`);
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: fallbackEmail,
          password
        });
        
        if (error) {
          console.log('Fallback login failed:', error);
          return NextResponse.json(
            { error: 'שם המשתמש או הסיסמה שגויים' },
            { status: 401 }
          );
        }
        
        // Set the auth cookie
        const authCookie = data.session?.access_token;
        if (authCookie) {
          const cookieStore = await cookies();
          cookieStore.set({
            name: 'sb-access-token',
            value: authCookie,
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
          });
        }
        
        return NextResponse.json({ success: true }, { status: 200 });
      } catch (fallbackErr) {
        console.log('Fallback login error:', fallbackErr);
        return NextResponse.json(
          { error: 'שם המשתמש או הסיסמה שגויים' },
          { status: 401 }
        );
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Server error during login' },
      { status: 500 }
    );
  }
} 