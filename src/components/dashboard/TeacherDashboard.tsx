'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import DashboardLayout, { StatCard, FeatureCard, ActivityItem } from './DashboardLayout'
import { Users, Calendar, BookOpen, MessageSquare, Settings, Trophy, Clock } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface UserInfo {
  id: string
  email: string
  display_name: string
  role: string
}

interface TeacherDashboardProps {
  userInfo: UserInfo
}

interface TeacherClass {
  id: string
  name: string
  grade: string
  student_count?: number
}

interface TeacherStats {
  totalClasses: number
  totalStudents: number
  weeklyLessons: number
  newMessages: number
}

interface RecentActivity {
  id: string
  type: 'grade' | 'attendance' | 'message' | 'lesson'
  title: string
  time: string
  studentName?: string
}

export default function TeacherDashboard({ userInfo }: TeacherDashboardProps) {
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [stats, setStats] = useState<TeacherStats>({
    totalClasses: 0,
    totalStudents: 0,
    weeklyLessons: 0,
    newMessages: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchTeacherData = useCallback(async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      // Note: Teacher-class relationships not fully implemented yet
      const classesData: TeacherClass[] = []
      setClasses(classesData)

      // For now, teachers can access the schedule system and see tasks
      // Get weekly lessons count from schedule (if teacher has access)
      const { data: weeklyLessons } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', userInfo.id)

      // Get new messages for teacher (using parent_messages for now)
      const { data: newMessages } = await supabase
        .from('parent_messages')
        .select('*')
        .eq('user_id', userInfo.id)
        .eq('is_read', false)

      setStats({
        totalClasses: 0, // No classes system yet
        totalStudents: 0, // No students system yet
        weeklyLessons: weeklyLessons?.length || 0,
        newMessages: newMessages?.length || 0
      })

      // For now, just show a message that teacher features are coming soon
      const activities: RecentActivity[] = [
        {
          id: 'coming-soon-1',
          type: 'message',
          title: 'תכונות המורים בפיתוח - בקרוב יהיו זמינות',
          time: 'עדכון מערכת'
        }
      ]

      setRecentActivity(activities)

    } catch (error) {
      console.error('Error fetching teacher data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userInfo.id])

  useEffect(() => {
    fetchTeacherData()
  }, [fetchTeacherData])

  // const formatTimeAgo = (dateString: string): string => {
  //   const date = new Date(dateString)
  //   const now = new Date()
  //   const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  //   if (diffInMinutes < 60) {
  //     return `לפני ${diffInMinutes} דקות`
  //   } else if (diffInMinutes < 1440) {
  //     const hours = Math.floor(diffInMinutes / 60)
  //     return `לפני ${hours} שעות`
  //   } else {
  //     const days = Math.floor(diffInMinutes / 1440)
  //     return `לפני ${days} ימים`
  //   }
  // }

  const teacherFeatures = [
    {
      title: 'מערכת שעות',
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-green-100 text-green-600',
      href: '/schedule',
      description: 'צפייה ועריכת מערכת השעות'
    },
    {
      title: 'משימות התלמידים',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'bg-blue-100 text-blue-600',
      href: '/tasks',
      description: 'צפייה במשימות של התלמידים'
    },
    {
      title: 'הפרופיל שלי',
      icon: <Settings className="w-6 h-6" />,
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
      case 'lesson':
        return <BookOpen className="w-4 h-4 text-orange-600" />
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
      case 'lesson':
        return 'bg-orange-100'
      default:
        return 'bg-gray-100'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4">טוען...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout
      userInfo={userInfo}
      title={`שלום ${userInfo.display_name}! 👩‍🏫`}
      subtitle="איך השיעורים שלך היום?"
      description="ברוכה הבאה לאזור המורים! כאן תוכלי לנהל את הכיתות, לעקוב אחר התלמידים ולתקשר עם ההורים."
      backgroundGradient="bg-gradient-to-br from-purple-50 to-pink-50"
      icon={<Users className="w-8 h-8 text-white" />}
      statusItems={[
        { label: `${stats.totalClasses} כיתות`, color: 'bg-blue-400' },
        { label: stats.newMessages > 0 ? `${stats.newMessages} הודעות חדשות` : 'אין הודעות חדשות', color: 'bg-purple-400' }
      ]}
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="מערכת שעות"
          value={stats.weeklyLessons > 0 ? `${stats.weeklyLessons} שיעורים` : "ריק"}
          subtitle={stats.weeklyLessons > 0 ? "שיעורים במערכת" : "אין שיעורים רשומים"}
          color="text-blue-500"
        />
        
        <StatCard
          title="גישה למשימות"
          value="זמינה"
          subtitle="ניתן לצפות במשימות התלמידים"
          color="text-green-500"
        />
        
        <StatCard
          title="תכונות עתידיות"
          value="בפיתוח"
          subtitle="ניהול כיתות וציונים - בקרוב"
          color="text-purple-500"
        />
        
        <StatCard
          title="הודעות"
          value={stats.newMessages}
          subtitle={stats.newMessages > 0 ? "הודעות שלא נקראו" : "אין הודעות חדשות"}
          color="text-yellow-500"
        />
      </div>

      {/* Teacher Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {teacherFeatures.map((feature) => (
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

      {/* Status Message */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm mb-8">
        <h3 className="font-semibold text-lg mb-4 text-gray-800">מצב הפיתוח</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-800">
            <h4 className="font-medium mb-2">🚧 תכונות המורים בפיתוח</h4>
            <p className="text-sm">
              כרגע זמינות רק התכונות הבסיסיות. בקרוב יתווספו:
            </p>
            <ul className="text-sm mt-2 list-disc list-inside space-y-1">
              <li>ניהול כיתות ותלמידים</li>
              <li>מערכת ציונים ונוכחות</li>
              <li>הודעות להורים</li>
              <li>דוחות התקדמות</li>
            </ul>
          </div>
        </div>
      </div>

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
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>אין פעילות אחרונה</p>
              <p className="text-sm">
                {classes.length === 0 
                  ? "לא נמצאו כיתות רשומות במערכת" 
                  : "פעילות ההוראה תופיע כאן"}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}