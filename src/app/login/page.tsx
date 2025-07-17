import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import MultiRoleLogin from '@/components/auth/MultiRoleLogin'

export default async function LoginPage() {
  const supabase = await createClient()
  
  // Check if user is already logged in
  const { data, error } = await supabase.auth.getUser()
  
  // If logged in, redirect to dashboard
  if (data.user && !error) {
    redirect('/')
  }
  
  return <MultiRoleLogin />
} 