import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ParentMessageSender from '@/components/parent/ParentMessageSender'

const LoadingFallback = () => (
  <div className="p-8 text-center">
    <div className="animate-pulse">טוען...</div>
  </div>
)

async function ParentSendMessageContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Check if user is parent
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!userRole || userRole.role !== 'parent') {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <ParentMessageSender userId={user.id} />
    </div>
  )
}

export default function ParentSendMessagePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Suspense fallback={<LoadingFallback />}>
        <ParentSendMessageContent />
      </Suspense>
    </main>
  )
}