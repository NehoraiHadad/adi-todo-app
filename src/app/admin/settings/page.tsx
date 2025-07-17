import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AdminSettings from '@/components/admin/AdminSettings'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (!user || error) {
    redirect('/login')
  }
  
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  if (!userRole || userRole.role !== 'admin') {
    redirect('/')
  }
  
  return <AdminSettings />
}