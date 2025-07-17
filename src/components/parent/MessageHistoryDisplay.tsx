'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, MessageSquare, CheckCircle2, AlertCircle, MessageCircle, Clock } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export interface MessageHistory {
  id: string
  message_id: string
  child_id: string
  child_name: string
  content: string
  sent_at: string
  delivery_status: 'sent' | 'delivered' | 'read' | 'failed'
  read_at?: string
  priority: string
  category: string
}

interface MessageHistoryDisplayProps {
  userId: string
  isVisible: boolean
  onRefresh?: () => void
}

export default function MessageHistoryDisplay({ userId, isVisible, onRefresh: _onRefresh }: MessageHistoryDisplayProps) {
  const [messageHistory, setMessageHistory] = useState<MessageHistory[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const supabase = createClient()

  const fetchMessageHistory = useCallback(async () => {
    if (!isVisible) return
    
    try {
      setIsLoadingHistory(true)
      
      // השתמש במשתמש הנוכחי במקום ב-userId שמועבר
      const { data: currentUser } = await supabase.auth.getUser()
      const actualUserId = currentUser.user?.id
      
      if (!actualUserId) {
        console.error('No authenticated user found')
        return
      }
      
      const { data, error } = await supabase
        .from('child_messages')
        .select(`
          id,
          user_id,
          sender_id,
          sender_name,
          content,
          is_read,
          created_at,
          read_at,
          priority,
          category,
          profiles:user_id(display_name)
        `)
        .eq('sender_id', actualUserId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching message history:', error)
        throw error
      }

      const historyData: MessageHistory[] = (data || []).map((item: unknown) => {
        const typedItem = item as {
          id: string;
          user_id: string;
          profiles?: { display_name: string }[] | { display_name: string };
          content: string;
          created_at: string;
          is_read: boolean;
          priority?: string;
          category?: string;
          read_at?: string;
        };
        return {
        id: typedItem.id,
        message_id: typedItem.id,
        child_id: typedItem.user_id,
        child_name: Array.isArray(typedItem.profiles) 
          ? typedItem.profiles[0]?.display_name || 'לא ידוע'
          : typedItem.profiles?.display_name || 'לא ידוע',
        content: typedItem.content || '',
        sent_at: typedItem.created_at,
        delivery_status: typedItem.is_read ? 'read' : 'sent',
        read_at: typedItem.read_at,
        priority: typedItem.priority || 'normal',
        category: typedItem.category || 'general'
      };
      });

      setMessageHistory(historyData)
    } catch (error) {
      console.error('Error fetching message history:', error)
      setMessageHistory([])
    } finally {
      setIsLoadingHistory(false)
    }
  }, [isVisible, supabase])

  useEffect(() => {
    if (isVisible) {
      fetchMessageHistory()
    }
  }, [isVisible, userId, fetchMessageHistory])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'normal': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read': return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'delivered': return <MessageCircle className="w-4 h-4 text-blue-600" />
      case 'sent': return <Clock className="w-4 h-4 text-gray-600" />
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  if (!isVisible) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5" />
            היסטוריית הודעות
          </div>
          <div className="text-sm text-gray-500">
            {messageHistory.length} הודעות
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="mr-2">טוען היסטוריה...</span>
          </div>
        ) : messageHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>אין הודעות בהיסטוריה</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {messageHistory.length}
                </div>
                <div className="text-xs text-gray-500">סך הכל</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {messageHistory.filter(m => m.delivery_status === 'read').length}
                </div>
                <div className="text-xs text-gray-500">נקראו</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {messageHistory.filter(m => m.delivery_status === 'sent').length}
                </div>
                <div className="text-xs text-gray-500">לא נקראו</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {messageHistory.filter(m => m.priority === 'urgent' || m.priority === 'high').length}
                </div>
                <div className="text-xs text-gray-500">חשובות</div>
              </div>
            </div>
          
            <div className="space-y-3">
              {messageHistory.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.child_name}</span>
                      <Badge className={getPriorityColor(item.priority)}>
                        {item.priority === 'urgent' ? 'דחוף' : 
                         item.priority === 'high' ? 'גבוה' :
                         item.priority === 'normal' ? 'רגיל' : 'נמוך'}
                      </Badge>
                      <Badge variant="outline">
                        {item.category === 'homework' ? 'שיעורי בית' :
                         item.category === 'behavior' ? 'התנהגות' :
                         item.category === 'event' ? 'אירוע' :
                         item.category === 'reminder' ? 'תזכורת' : 'כללי'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.delivery_status)}
                      <span className="text-sm text-gray-500">
                        {item.delivery_status === 'read' ? 'נקרא' :
                         item.delivery_status === 'delivered' ? 'נמסר' :
                         item.delivery_status === 'sent' ? 'נשלח' : 'נכשל'}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-2">{item.content}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      נשלח: {new Date(item.sent_at).toLocaleDateString('he-IL', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {item.read_at && (
                      <span>
                        נקרא: {new Date(item.read_at).toLocaleDateString('he-IL', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}