'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import DashboardLayout, { StatCard, FeatureCard, ActivityItem } from './DashboardLayout'
import { BookOpen, FileText, Trophy, Calendar, Bell, User, Clock } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface UserInfo {
  id: string
  email: string
  display_name: string
  role: string
}

interface ChildDashboardProps {
  userInfo: UserInfo
}

interface StudentStats {
  todayLessons: number
  openTasks: number
  latestGrade: number | null
  newMessages: number
}

interface RecentActivity {
  id: string
  type: 'lesson' | 'grade' | 'message' | 'task'
  title: string
  time: string
  details?: string
}

export default function ChildDashboard({ userInfo }: ChildDashboardProps) {
  const [stats, setStats] = useState<StudentStats>({
    todayLessons: 0,
    openTasks: 0,
    latestGrade: null,
    newMessages: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchStudentData = useCallback(async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      // Use Promise.all for parallel queries to improve performance
      const [scheduleResponse, tasksResponse] = await Promise.all([
        // Get today's lessons from schedule (get all user's schedule since it's weekly)
        supabase
          .from('schedules')
          .select('*')
          .eq('user_id', userInfo.id)
          .limit(20), // Limit to improve performance
        
        // Get open tasks for this student
        supabase
          .from('tasks')
          .select('*')
          .eq('student_id', userInfo.id)
          .eq('status', 'pending')
          .limit(10),

        // Note: Grades and general messages not implemented yet
        Promise.resolve({ data: [], error: null }),
        Promise.resolve({ data: [], error: null })
      ])

      // Calculate today's lessons from weekly schedule
      const todayDayOfWeek = new Date().getDay() // 0=Sunday, 1=Monday, etc.
      const todayLessons = scheduleResponse.data?.filter(lesson => 
        lesson.day_of_week === todayDayOfWeek && lesson.subject
      ) || []

      // Update stats using the responses from Promise.all
      setStats({
        todayLessons: todayLessons.length,
        openTasks: tasksResponse.data?.length || 0,
        latestGrade: null, // Grades not implemented yet
        newMessages: 0 // General messages not implemented yet
      })

      // Fetch recent activity
      const activities: RecentActivity[] = []

      // Add recent tasks using data we already fetched
      tasksResponse.data?.slice(0, 4).forEach(task => {
        activities.push({
          id: `task-${task.id}`,
          type: 'task',
          title: `משימה: ${task.title}`,
          time: formatTimeAgo(task.created_at)
        })
      })

      setRecentActivity(activities)

    } catch (error) {
      console.error('Error fetching student data:', error)
      // Set default stats if there's an error
      setStats({
        todayLessons: 0,
        openTasks: 0,
        latestGrade: null,
        newMessages: 0
      })
      setRecentActivity([])
    } finally {
      setIsLoading(false)
    }
  }, [userInfo.id])

  useEffect(() => {
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn('Dashboard loading timeout, setting default state')
        setStats({
          todayLessons: 0,
          openTasks: 0,
          latestGrade: null,
          newMessages: 0
        })
        setRecentActivity([])
        setIsLoading(false)
      }
    }, 10000) // 10 second timeout

    fetchStudentData()

    return () => clearTimeout(timeoutId)
  }, [fetchStudentData, isLoading])

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

  const studentFeatures = [
    {
      title: 'המשימות שלי',
      icon: <FileText className="w-6 h-6" />,
      color: 'bg-green-100 text-green-600',
      href: '/tasks',
      description: 'משימות בית וניהול עבודות'
    },
    {
      title: 'מערכת השעות',
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-purple-100 text-purple-600',
      href: '/schedule',
      description: 'מערכת השעות השבועית'
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
      case 'lesson':
        return <Clock className="w-4 h-4 text-blue-600" />
      case 'grade':
        return <Trophy className="w-4 h-4 text-green-600" />
      case 'message':
        return <Bell className="w-4 h-4 text-purple-600" />
      case 'task':
        return <FileText className="w-4 h-4 text-orange-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getActivityIconColor = (type: string) => {
    switch (type) {
      case 'lesson':
        return 'bg-blue-100'
      case 'grade':
        return 'bg-green-100'
      case 'message':
        return 'bg-purple-100'
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">טוען...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout
      userInfo={userInfo}
      title={`שלום ${userInfo.display_name}! 👋`}
      subtitle="איך אתה מרגיש היום?"
      description="ברוך הבא לשטח הלמידה שלך! כאן תוכל לצפות בשיעורים, לבצע משימות ולעקוב אחר הציונים שלך."
      backgroundGradient="bg-gradient-to-br from-blue-50 to-purple-50"
      icon={<BookOpen className="w-8 h-8 text-white" />}
      statusItems={[
        { label: `${stats.openTasks} משימות ממתינות`, color: 'bg-blue-400' },
        { label: stats.todayLessons > 0 ? 'שיעורים היום' : 'אין שיעורים היום', color: 'bg-purple-400' }
      ]}
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="שיעורים היום"
          value={stats.todayLessons}
          subtitle={stats.todayLessons > 0 ? "שיעורים מתוכננים" : "אין שיעורים"}
          color="text-blue-500"
        />
        
        <StatCard
          title="משימות פתוחות"
          value={stats.openTasks}
          subtitle={stats.openTasks > 0 ? "לביצוע" : "כל המשימות הושלמו"}
          color="text-green-500"
        />
        
        <StatCard
          title="מערכת השעות"
          value={stats.todayLessons > 0 ? `${stats.todayLessons} שיעורים` : 'אין שיעורים'}
          subtitle={stats.todayLessons > 0 ? "שיעורים היום" : "יום פנוי"}
          color="text-yellow-500"
        />
        
        <StatCard
          title="לוח השבוע"
          value="פעיל"
          subtitle="מערכת השעות זמינה"
          color="text-purple-500"
        />
      </div>

      {/* Student Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {studentFeatures.map((feature) => (
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
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>אין פעילות אחרונה</p>
              <p className="text-sm">התחל לעבוד והפעילות שלך תופיע כאן</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}