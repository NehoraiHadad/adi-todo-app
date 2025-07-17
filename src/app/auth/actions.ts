'use server'

import { createActionClient } from '@/utils/supabase/actions'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'אימייל וסיסמה נדרשים' }
  }

  const supabase = await createActionClient()

  // Direct sign in with email
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'אימייל או סיסמה שגויים' }
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