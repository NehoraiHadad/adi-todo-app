import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { UserRole } from '@/types'

/**
 * Next.js middleware for authentication and route protection
 * Handles role-based access control and redirects
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Create a Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value: '', ...options, maxAge: 0 })
        },
      },
    }
  )

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/admin-setup']
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname)

  // Protected routes that require authentication
  const protectedRoutes = ['/admin', '/profile', '/settings', '/tasks', '/schedule']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Home page is special - it redirects based on auth status
  const isHomePage = request.nextUrl.pathname === '/'

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Handle public routes
  if (isPublicRoute) {
    return response
  }

  // Handle protected routes
  if (isProtectedRoute) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Additional check for admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (!userRole || userRole.role !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    // Role-based route protection
    const pathname = request.nextUrl.pathname;
    
    // Get user role for additional validations
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const role = userRole?.role as UserRole || UserRole.CHILD;

    // Teacher-specific routes
    if (pathname.startsWith('/teacher') && role !== UserRole.TEACHER && role !== UserRole.ADMIN) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Parent-specific routes
    if (pathname.startsWith('/parent') && role !== UserRole.PARENT && role !== UserRole.ADMIN) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return response
  }

  // Handle home page
  if (isHomePage) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // For authenticated users, verify they have a valid profile and role
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()
      
      // If no profile or role, redirect to login
      if (!profile || !userRole) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    } catch (error) {
      console.error('Error verifying user data:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    return response
  }

  // For all other routes, continue normally
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}