import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function ProtectedRoute({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Always use getUser() for security validation in server components
  const { data, error } = await supabase.auth.getUser()
  
  if (error || !data.user) {
    redirect('/login')
  }
  
  return <>{children}</>
} 