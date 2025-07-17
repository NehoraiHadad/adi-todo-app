import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Send, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

interface ParentMessage {
  id: string
  sender_name: string
  content: string
  is_read: boolean
  created_at: string
}

const LoadingFallback = () => (
  <div className="p-8 text-center">
    <div className="animate-pulse">טוען הודעות...</div>
  </div>
)

async function ParentMessagesContent() {
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

  // Fetch parent messages for the current user
  const { data: messages, error } = await supabase
    .from('parent_messages')
    .select('*')
    .eq('parent_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching parent messages:', error)
    return (
      <div className="text-center p-8">
        <p className="text-red-500">שגיאה בטעינת ההודעות</p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const unreadCount = messages?.filter(msg => !msg.is_read).length || 0

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">הודעות מההורים</h1>
          </div>
          {unreadCount > 0 && (
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              {unreadCount} הודעות חדשות
            </div>
          )}
        </div>
        <p className="text-gray-600 mt-2">
          כאן תוכלי לראות את כל ההודעות שנשלחו אליך מהמורים והמנהל
        </p>
      </div>

      {/* Messages List */}
      {!messages || messages.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent>
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">אין הודעות</h3>
            <p className="text-gray-400">
              כשמורים או המנהל ישלחו לך הודעות, הן יופיעו כאן
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((message: ParentMessage) => (
            <Card key={message.id} className={`transition-all duration-200 hover:shadow-md ${
              !message.is_read ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg text-gray-800">
                      {message.sender_name}
                    </CardTitle>
                    {!message.is_read ? (
                      <div className="flex items-center gap-1 text-blue-600">
                        <Eye className="w-4 h-4" />
                        <span className="text-xs font-medium">חדש</span>
                      </div>
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(message.created_at)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
                {!message.is_read && (
                  <div className="mt-4 pt-4 border-t border-blue-100">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      סמן כנקרא
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Back to Dashboard */}
      <div className="mt-8 text-center">
        <Link href="/dashboard">
          <Button variant="outline" className="gap-2">
            <Send className="w-4 h-4" />
            חזרה לדשבורד
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default function ParentMessagesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Suspense fallback={<LoadingFallback />}>
        <ParentMessagesContent />
      </Suspense>
    </main>
  )
}