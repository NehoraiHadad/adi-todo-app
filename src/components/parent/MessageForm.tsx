'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export interface Child {
  id: string
  display_name: string
  email: string
  grade?: string
  class_id?: string
}

interface MessageFormProps {
  children: Child[]
  userId: string
  parentName: string
  onMessageSent: () => void
}

export default function MessageForm({ children, userId: _userId, parentName, onMessageSent }: MessageFormProps) {
  const [selectedChild, setSelectedChild] = useState<string>('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal')
  const [category, setCategory] = useState<'general' | 'homework' | 'behavior' | 'event' | 'reminder'>('general')
  const [isSending, setIsSending] = useState(false)
  
  const supabase = createClient()

  const sendMessage = async () => {
    if (!selectedChild || !message.trim()) {
      alert('יש לבחור ילד ולכתוב הודעה')
      return
    }

    try {
      setIsSending(true)
      
      // השתמש במשתמש הנוכחי
      const { data: currentUser } = await supabase.auth.getUser()
      const actualUserId = currentUser.user?.id
      
      if (!actualUserId) {
        alert('שגיאה: משתמש לא מחובר')
        return
      }
      
      const { data: messageData, error: messageError } = await supabase
        .from('child_messages')
        .insert([{
          user_id: selectedChild,
          sender_id: actualUserId,
          sender_name: parentName || 'הורה',
          content: message.trim(),
          priority,
          category
        }])
        .select()
        .single()

      if (messageError) throw messageError

      const { error: historyError } = await supabase
        .from('parent_message_history')
        .insert([{
          parent_id: actualUserId,
          child_id: selectedChild,
          message_id: messageData.id,
          delivery_status: 'sent'
        }])

      if (historyError) {
        console.error('Error adding to history:', historyError)
      }

      setMessage('')
      setSelectedChild('')
      setPriority('normal')
      setCategory('general')
      
      onMessageSent()
      
      alert('ההודעה נשלחה בהצלחה!')
    } catch (error: unknown) {
      console.error('Error sending message:', error)
      alert('שגיאה בשליחת ההודעה')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          הודעה חדשה
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">בחר ילד</label>
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">-- בחר ילד לשליחת הודעה --</option>
            {children.map(child => (
              <option key={child.id} value={child.id}>
                {child.display_name} {child.grade ? `(כיתה ${child.grade})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">חשיבות</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high' | 'urgent')}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="low">נמוכה</option>
              <option value="normal">רגילה</option>
              <option value="high">גבוהה</option>
              <option value="urgent">דחופה</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">קטגוריה</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as 'general' | 'homework' | 'behavior' | 'event' | 'reminder')}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="general">כללי</option>
              <option value="homework">שיעורי בית</option>
              <option value="behavior">התנהגות</option>
              <option value="event">אירוע</option>
              <option value="reminder">תזכורת</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">תוכן ההודעה</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="כתוב את ההודעה שלך כאן..."
            rows={5}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            maxLength={500}
          />
          <div className="text-xs text-gray-500 mt-1">
            {message.length}/500 תווים
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="outline">
              ביטול
            </Button>
          </Link>
          
          <Button 
            onClick={sendMessage}
            disabled={isSending || !selectedChild || !message.trim()}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSending ? 'שולח...' : 'שלח הודעה'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}