'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Send, Users, Mail } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface Parent {
  id: string
  display_name: string
  email: string
}

interface AdminParentMessageSenderProps {
  adminId: string
  adminName: string
}

export default function AdminParentMessageSender({ adminId, adminName }: AdminParentMessageSenderProps) {
  const [parents, setParents] = useState<Parent[]>([])
  const [selectedParents, setSelectedParents] = useState<string[]>([])
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  const supabase = createClient()

  const fetchParents = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const { data: parentsData, error } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .eq('role', 'parent')
        .order('display_name')

      if (error) throw error
      
      setParents(parentsData || [])
    } catch (error) {
      console.error('Error fetching parents:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchParents()
  }, [fetchParents])

  const toggleParentSelection = (parentId: string) => {
    setSelectedParents(prev => 
      prev.includes(parentId) 
        ? prev.filter(id => id !== parentId)
        : [...prev, parentId]
    )
  }

  const selectAllParents = () => {
    setSelectedParents(parents.map(p => p.id))
  }

  const clearSelection = () => {
    setSelectedParents([])
  }

  const sendMessages = async () => {
    if (selectedParents.length === 0 || !message.trim()) {
      alert('יש לבחור לפחות הורה אחד ולכתוב הודעה')
      return
    }

    try {
      setIsSending(true)
      
      // Create message for each selected parent
      const messagesToInsert = selectedParents.map(parentId => ({
        parent_id: parentId,
        sender_id: adminId,
        sender_name: adminName,
        subject: subject.trim() || 'הודעה מהמנהל',
        content: message.trim()
      }))

      const { error } = await supabase
        .from('parent_messages')
        .insert(messagesToInsert)

      if (error) throw error

      // Reset form
      setSubject('')
      setMessage('')
      setSelectedParents([])
      alert(`ההודעה נשלחה בהצלחה ל-${selectedParents.length} הורים!`)
    } catch (error: unknown) {
      console.error('Error sending messages:', error)
      alert('שגיאה בשליחת ההודעה')
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse">טוען נתונים...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Mail className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">שליחת הודעה להורים</h2>
          <p className="text-gray-600">שלח הודעות מהמנהל להורים במערכת</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parents Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                בחירת הורים ({selectedParents.length}/{parents.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllParents}>
                  בחר הכל
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  נקה בחירה
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            {parents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>אין הורים רשומים במערכת</p>
              </div>
            ) : (
              <div className="space-y-2">
                {parents.map((parent) => (
                  <div
                    key={parent.id}
                    onClick={() => toggleParentSelection(parent.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedParents.includes(parent.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{parent.display_name}</div>
                        <div className="text-sm text-gray-500">{parent.email}</div>
                      </div>
                      {selectedParents.includes(parent.id) && (
                        <Badge className="bg-blue-500">נבחר</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              תוכן ההודעה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Subject */}
            <div>
              <label className="block text-sm font-medium mb-2">נושא ההודעה</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="נושא ההודעה (אופציונלי)"
                maxLength={100}
              />
              <div className="text-xs text-gray-500 mt-1">
                {subject.length}/100 תווים
              </div>
            </div>

            {/* Message Content */}
            <div>
              <label className="block text-sm font-medium mb-2">תוכן ההודעה</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="כתוב את ההודעה שלך כאן..."
                rows={8}
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 mt-1">
                {message.length}/1000 תווים
              </div>
            </div>

            {/* Send Button */}
            <Button 
              onClick={sendMessages}
              disabled={isSending || selectedParents.length === 0 || !message.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSending ? 'שולח...' : `שלח הודעה ל-${selectedParents.length} הורים`}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-yellow-800 mb-2">💡 הנחיות לשליחת הודעות:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• כתוב הודעות ברורות ומקצועיות</li>
            <li>• הוסף נושא מתאים לזיהוי מהיר</li>
            <li>• ודא שהמידע מדויק ועדכני</li>
            <li>• ההודעות יופיעו בעמוד ההודעות של ההורים</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}