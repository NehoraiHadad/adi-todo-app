'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Users, ArrowRight, History } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import MessageForm, { Child } from './MessageForm'
import MessageHistoryDisplay from './MessageHistoryDisplay'

interface ParentMessageSenderProps {
  userId: string
}

export default function ParentMessageSender({ userId }: ParentMessageSenderProps) {
  const [children, setChildren] = useState<Child[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [parentName, setParentName] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Get parent info
      const { data: parentProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .single()
      
      if (parentProfile) {
        setParentName(parentProfile.display_name)
      }

      // Get children for this parent using API
      try {
        const response = await fetch('/api/parent/children')
        const result = await response.json()
        
        console.log('ParentMessageSender - API response:', result)
        
        if (result.success) {
          const childrenData = result.data || []
          setChildren(childrenData)
        } else {
          console.error('ParentMessageSender - API error:', result.error)
          setChildren([])
        }
      } catch (error) {
        console.error('ParentMessageSender - fetch error:', error)
        setChildren([])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleMessageSent = () => {
    if (showHistory) {
      // הודעה להיסטוריה שהיא צריכה להתעדכן
      setShowHistory(false)
      setTimeout(() => setShowHistory(true), 100)
    }
  }



  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4">טוען...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">שליחת הודעה לילד</h1>
            <p className="text-gray-600">שלח הודעה אישית לאחד הילדים שלך</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2"
        >
          <History className="w-4 h-4" />
          {showHistory ? 'הסתר היסטוריה' : 'הצג היסטוריה'}
        </Button>
      </div>

      {/* Check if has children */}
      {children.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent>
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">אין ילדים רשומים</h3>
            <p className="text-gray-400 mb-4">
              עדיין לא שוייכו אליך ילדים במערכת. צור קשר עם המנהל לשיוך ילדים.
            </p>
            <Link href="/dashboard">
              <Button variant="outline">
                <ArrowRight className="w-4 h-4 mr-2" />
                חזרה לדשבורד
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <MessageForm 
          // eslint-disable-next-line react/no-children-prop
          children={children}
          userId={userId} 
          parentName={parentName} 
          onMessageSent={handleMessageSent} 
        />
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-800 mb-2">💡 טיפים לשליחת הודעות:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• כתוב הודעות חיוביות ומעודדות</li>
            <li>• הזכר למשימות חשובות או אירועים</li>
            <li>• הביע אהבה ותמיכה</li>
            <li>• ההודעה תופיע בדף הבית של הילד</li>
            <li>• תוכל לראות מתי הילד קרא את ההודעה</li>
          </ul>
        </CardContent>
      </Card>

      <MessageHistoryDisplay 
        userId={userId} 
        isVisible={showHistory} 
      />
    </div>
  )
}