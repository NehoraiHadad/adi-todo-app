'use server'

import { createActionClient } from '@/utils/supabase/actions'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username || !password) {
    return { error: 'שם משתמש וסיסמה נדרשים' }
  }

  const supabase = await createActionClient()

  // Generate a valid email using the improved method with Base64 encoding
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

  // Try sign in with the generated email
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // If direct login fails, try to find the user's email from profiles
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('username', username)
        .single()
        
      if (profileError || !profileData?.email) {
        return { error: 'שם משתמש או סיסמה שגויים' }
      }
      
      // Try login with the stored email
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password
      })
      
      if (loginError) {
        return { error: 'שם משתמש או סיסמה שגויים' }
      }
    } catch (err) {
      console.error('Error during fallback authentication:', err);
      return { error: 'שם משתמש או סיסמה שגויים' }
    }
  }

  // Force a revalidation of the entire layout to update auth state everywhere
  revalidatePath('/', 'layout')
  
  // Redirect to home page with a cache-busting query parameter
  redirect(`/?auth=${new Date().getTime()}`)
}

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  if (!email || !password) {
    return { error: 'אימייל וסיסמה נדרשים' }
  }

  const supabase = await createActionClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Revalidate the layout to update auth state
  revalidatePath('/', 'layout')
  
  return { 
    success: true, 
    message: 'בדוק את האימייל שלך לקבלת קישור האישור' 
  }
}

export async function signOut() {
  const supabase = await createActionClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    return { error: error.message }
  }

  // Clear cookies - use proper async handling for cookies in Next.js 15
  const cookieStore = await cookies()
  const cookieNames = ['sb-access-token', 'sb-refresh-token']
  
  for (const name of cookieNames) {
    cookieStore.set({
      name,
      value: '',
      path: '/',
      maxAge: 0
    })
  }
  
  // Revalidate the layout to update auth state
  revalidatePath('/', 'layout')
  
  // Redirect to login page
  redirect('/login')
} 