'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import DashboardLayout, { StatCard, FeatureCard, ActivityItem } from './DashboardLayout'
import { Users, Trophy, Calendar, MessageSquare, Clock, User } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface UserInfo {
  id: string
  email: string
  display_name: string
  role: string
}

interface ParentDashboardProps {
  userInfo: UserInfo
}

interface Child {
  id: string
  display_name: string
  class_name?: string
  grade?: string
}

interface ParentStats {
  totalChildren: number
  weeklyAttendance: number
  averageGrades: number
  newMessages: number
}

interface RecentActivity {
  id: string
  type: 'grade' | 'attendance' | 'message' | 'task'
  title: string
  time: string
  childName?: string
}

export default function ParentDashboard({ userInfo }: ParentDashboardProps) {
  const [children, setChildren] = useState<Child[]>([])
  const [stats, setStats] = useState<ParentStats>({
    totalChildren: 0,
    weeklyAttendance: 0,
    averageGrades: 0,
    newMessages: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchParentData = useCallback(async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      
      // Get children for this parent using API
      let childrenData: Child[] = []
      try {
        const response = await fetch('/api/parent/children')
        const result = await response.json()
        
        if (result.success) {
          childrenData = result.data || []
          setChildren(childrenData)
        } else {
          console.error('Error fetching children:', result.error)
          setChildren([])
        }
      } catch (error) {
        console.error('Error fetching children:', error)
        setChildren([])
      }

      if (!childrenData || childrenData.length === 0) {
        setStats({
          totalChildren: 0,
          weeklyAttendance: 0,
          averageGrades: 0,
          newMessages: 0
        })
        setIsLoading(false)
        return
      }

      // const childIds = childrenData.map(child => child.id)

      // Note: Attendance and grades systems not implemented yet
      const weeklyAttendance = 0
      const averageGrades = 0

      // Get new messages for parent - using parent_messages table
      const { data: messagesData } = await supabase
        .from('parent_messages')
        .select('*')
        .eq('parent_id', userInfo.id)
        .eq('is_read', false)

      setStats({
        totalChildren: childrenData.length,
        weeklyAttendance,
        averageGrades,
        newMessages: messagesData?.length || 0
      })

      // Fetch recent activity - only from parent_messages for now
      const activities: RecentActivity[] = []

      // Recent parent messages
      const { data: recentMessages } = await supabase
        .from('parent_messages')
        .select('*')
        .eq('user_id', userInfo.id)
        .order('created_at', { ascending: false })
        .limit(4)

      recentMessages?.forEach(message => {
        activities.push({
          id: `message-${message.id}`,
          type: 'message',
          title: `הודעה מ${message.sender_name || 'המורה'}: ${message.content.substring(0, 50)}...`,
          time: formatTimeAgo(message.created_at)
        })
      })

      setRecentActivity(activities)

    } catch (error) {
      console.error('Error fetching parent data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userInfo.id])

  useEffect(() => {
    fetchParentData()
  }, [fetchParentData])

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 60) {
      return `לפני ${diffInMinutes} דקות`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `לפני ${hours} שעות`
    } else {
      const days = Math.floor(diffInMinutes / 1440)
      return `לפני ${days} ימים`
    }
  }

  const parentFeatures = [
    {
      title: 'המשימות של הילדים',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-blue-100 text-blue-600',
      href: '/tasks',
      description: 'מעקב אחר משימות הילדים'
    },
    {
      title: 'שליחת הודעה לילד',
      icon: <MessageSquare className="w-6 h-6" />,
      color: 'bg-green-100 text-green-600',
      href: '/parent/send-message',
      description: 'שלח הודעה אישית לילד שלך'
    },
    {
      title: 'הודעות מהמורים',
      icon: <MessageSquare className="w-6 h-6" />,
      color: 'bg-indigo-100 text-indigo-600',
      href: '/parent/messages',
      description: 'הודעות מהמורים והמנהל'
    },
    {
      title: 'מערכת השעות',
      icon: <Clock className="w-6 h-6" />,
      color: 'bg-purple-100 text-purple-600',
      href: '/schedule',
      description: 'צפייה במערכת השעות הכיתתית'
    },
    {
      title: 'הפרופיל שלי',
      icon: <User className="w-6 h-6" />,
      color: 'bg-gray-100 text-gray-600',
      href: '/profile',
      description: 'עדכון פרטים אישיים'
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'grade':
        return <Trophy className="w-4 h-4 text-green-600" />
      case 'attendance':
        return <Calendar className="w-4 h-4 text-purple-600" />
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-600" />
      case 'task':
        return <Clock className="w-4 h-4 text-orange-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getActivityIconColor = (type: string) => {
    switch (type) {
      case 'grade':
        return 'bg-green-100'
      case 'attendance':
        return 'bg-purple-100'
      case 'message':
        return 'bg-blue-100'
      case 'task':
        return 'bg-orange-100'
      default:
        return 'bg-gray-100'
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
    <DashboardLayout
      userInfo={userInfo}
      title={`שלום ${userInfo.display_name}! 👨‍👩‍👧‍👦`}
      subtitle="איך הילדים שלך מסתדרים היום?"
      description="ברוכים הבאים לאזור ההורים! כאן תוכלו לעקוב אחר הילדים שלכם, לצפות בציונים ולתקשר עם המורים."
      backgroundGradient="bg-gradient-to-br from-green-50 to-blue-50"
      icon={<Users className="w-8 h-8 text-white" />}
      statusItems={[
        { label: `${stats.totalChildren} ילדים במעקב`, color: 'bg-blue-400' },
        { label: stats.newMessages > 0 ? `${stats.newMessages} הודעות חדשות` : 'אין הודעות חדשות', color: 'bg-purple-400' }
      ]}
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="ילדים רשומים"
          value={stats.totalChildren}
          subtitle={stats.totalChildren > 1 ? "ילדים פעילים" : stats.totalChildren === 1 ? "ילד פעיל" : "אין ילדים רשומים"}
          color="text-blue-500"
        />
        
        <StatCard
          title="מעקב ילדים"
          value={stats.totalChildren > 0 ? "פעיל" : "לא מוגדר"}
          subtitle={stats.totalChildren > 0 ? "מערכת המעקב פועלת" : "אין ילדים רשומים"}
          color="text-green-500"
        />
        
        <StatCard
          title="תקשורת"
          value={stats.newMessages > 0 ? `${stats.newMessages} חדשות` : "עדכני"}
          subtitle={stats.newMessages > 0 ? "הודעות חדשות מהמורים" : "קראת את כל ההודעות"}
          color="text-yellow-500"
        />
        
        <StatCard
          title="מערכת השעות"
          value="זמינה"
          subtitle="ניתן לצפות במערכת השעות"
          color="text-purple-500"
        />
      </div>

      {/* Parent Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {parentFeatures.map((feature) => (
          <Link key={feature.href} href={feature.href}>
            <FeatureCard
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              color={feature.color}
              href={feature.href}
            />
          </Link>
        ))}
      </div>

      {/* Children Overview */}
      {children.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm mb-8">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">סקירת הילדים</h3>
          <div className="space-y-4">
            {children.map((child) => (
              <div key={child.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">{child.display_name}</h4>
                  <span className="text-sm text-green-600">
                    {child.class_name && child.grade ? `כיתה ${child.grade} - ${child.class_name}` : 'כיתה לא נקבעה'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">משימות פעילות</p>
                    <p className="font-medium text-blue-600">ניתן לצפות בדף המשימות</p>
                  </div>
                  <div>
                    <p className="text-gray-500">מערכת שעות</p>
                    <p className="font-medium text-purple-600">זמינה לצפייה</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm">
        <h3 className="font-semibold text-lg mb-4 text-gray-800">פעילות אחרונה</h3>
        <div className="space-y-3">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <ActivityItem
                key={activity.id}
                icon={getActivityIcon(activity.type)}
                title={activity.title}
                time={activity.time}
                iconColor={getActivityIconColor(activity.type)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>אין פעילות אחרונה</p>
              <p className="text-sm">
                {children.length === 0 
                  ? "לא נמצאו ילדים רשומים במערכת" 
                  : "פעילות הילדים תופיע כאן"}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}