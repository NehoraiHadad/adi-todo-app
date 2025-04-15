import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function updateSession(request: NextRequest) {
  // Create a response object that we can modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: { path: string; maxAge: number; domain?: string; secure: boolean }) {
          // This is important as it tells the browser to update the cookies
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: { path: string; domain?: string }) {
          // This is important as it tells the browser to remove the cookies
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          })
        },
      },
    }
  )

  // This will refresh the session if needed and set new cookies
  // Use getUser instead of getSession for more reliable session validation
  const { data: { user }, error } = await supabase.auth.getUser()
  
  // If we detect we're coming from an auth-related action (login, signup, etc.)
  // make sure we get the latest session state
  const isAuthRelated = request.nextUrl.searchParams.has('auth');
  if (isAuthRelated) {
    // Force a session refresh
    await supabase.auth.refreshSession();
    
    // Clean up URL by removing the auth param
    const cleanUrl = new URL(request.nextUrl.pathname, request.url);
    response = NextResponse.redirect(cleanUrl);
  }

  return response
} 