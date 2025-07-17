import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { Button } from "@/components/ui/button"
import { MessageSquare, Home, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { ChildMessagesDisplay } from '@/components/messages/ChildMessagesDisplay'

const LoadingFallback = () => (
  <div className="p-8 text-center">
    <div className="animate-pulse">טוען הודעות...</div>
  </div>
)

async function MessagesContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">יש להתחבר למערכת</p>
        <Link href="/login">
          <Button className="mt-4">התחברות</Button>
        </Link>
      </div>
    )
  }

  // Fetch user profile to get display name
  let displayName = "אורח"
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()
  
  if (profile && profile.display_name) {
    displayName = profile.display_name
  } else if (user.user_metadata?.display_name) {
    displayName = user.user_metadata.display_name
  } else if (user.email) {
    displayName = user.email.split('@')[0]
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-pink-600" />
            <h1 className="text-2xl font-bold text-gray-800">כל ההודעות שלי</h1>
          </div>
          <Link href="/home">
            <Button variant="outline" size="sm" className="gap-2">
              <Home className="w-4 h-4" />
              בית
            </Button>
          </Link>
        </div>
        <p className="text-gray-600 mt-2">
          כאן תוכלי לראות את כל ההודעות שנשלחו אליך מההורים
        </p>
      </div>

      {/* Messages Display */}
      <div className="mb-6">
        <ChildMessagesDisplay 
          userId={user.id} 
          userName={displayName}
          maxMessages={20}
          autoRefresh={true}
          autoRefreshInterval={30000}
          showRefreshButton={true}
        />
      </div>

      {/* Back to Home */}
      <div className="mt-8 text-center">
        <Link href="/home">
          <Button variant="outline" className="gap-2">
            <ArrowRight className="w-4 h-4" />
            חזרה לדף הבית
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100">
      <Suspense fallback={<LoadingFallback />}>
        <MessagesContent />
      </Suspense>
    </main>
  )
}