import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AdminReports from '@/components/admin/AdminReports'

export default async function AdminReportsPage() {
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
  
  return <AdminReports />
}