import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: { path: string; maxAge: number; domain?: string; secure: boolean }) {
          try {
            cookieStore.set({ name, value, ...options })
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_error) {
            // Unable to set cookie in server component or during static rendering
            // This is expected and can be ignored
          }
        },
        remove(name: string, options: { path: string; domain?: string }) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 })
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_error) {
            // Unable to delete cookie in server component or during static rendering
            // This is expected and can be ignored
          }
        },
      },
    }
  )
} 