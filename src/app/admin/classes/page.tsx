import { Suspense } from 'react'
import ClassManager from '@/components/admin/ClassManager'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

const LoadingFallback = () => (
  <div className="p-8 text-center">
    <div className="animate-pulse">טוען...</div>
  </div>
)

async function AdminClassesContent() {
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

  return (
    <div className="container mx-auto px-4 py-6">
      <ClassManager />
    </div>
  )
}

export default function AdminClassesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <Suspense fallback={<LoadingFallback />}>
        <AdminClassesContent />
      </Suspense>
    </main>
  )
}