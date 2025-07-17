import { Suspense } from 'react'
import AdminParentMessageSender from '@/components/admin/ParentMessageSender'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

const LoadingFallback = () => (
  <div className="p-8 text-center">
    <div className="animate-pulse">טוען...</div>
  </div>
)

async function AdminSendMessagesContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!userRole || userRole.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get admin profile
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="container mx-auto px-4 py-6">
      <AdminParentMessageSender 
        adminId={user.id} 
        adminName={adminProfile?.display_name || 'מנהל המערכת'} 
      />
    </div>
  )
}

export default function AdminSendMessagesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Suspense fallback={<LoadingFallback />}>
        <AdminSendMessagesContent />
      </Suspense>
    </main>
  )
}