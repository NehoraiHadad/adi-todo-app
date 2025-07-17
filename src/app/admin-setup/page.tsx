import AdminSetupSimple from '@/components/auth/AdminSetupSimple'
import { getServiceSupabase } from '@/utils/supabase/service-client'
import { redirect } from 'next/navigation'

// Force dynamic rendering to avoid pre-rendering issues
export const dynamic = 'force-dynamic'

export default async function AdminSetupPage() {
  // Check if admin users already exist
  try {
    const serviceSupabase = getServiceSupabase()
    
    const { data: adminUsers, error } = await serviceSupabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)

    // If admin users exist, redirect to login
    if (!error && adminUsers && adminUsers.length > 0) {
      redirect('/login')
    }
  } catch (error) {
    console.error('Error checking admin users:', error)
    // On error, redirect to login (safer default)
    redirect('/login')
  }

  return <AdminSetupSimple />
}