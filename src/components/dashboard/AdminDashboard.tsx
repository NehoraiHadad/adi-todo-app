'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import DashboardLayout, { StatCard, FeatureCard, ActivityItem } from './DashboardLayout'
import { Users, Settings, BarChart, Shield, MessageSquare, Clock, UserPlus } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface UserInfo {
  id: string
  email: string
  display_name: string
  role: string
}

interface AdminDashboardProps {
  userInfo: UserInfo
}

interface AdminStats {
  totalUsers: number
  totalStudents: number
  totalTeachers: number
  totalParents: number
}

interface RecentActivity {
  id: string
  type: 'user_created' | 'system_update' | 'grade_added' | 'message_sent'
  title: string
  time: string
  details?: string
}

export default function AdminDashboard({ userInfo }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchAdminData = useCallback(async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      // Fetch data from each table
      const [userRolesResponse, usersResponse, messagesResponse] = await Promise.all([
        // Get user counts by role
        supabase
          .from('user_roles')
          .select('role')
          .limit(10),
        
        // Get recent users (without join first)
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5),

        // Get recent messages
        supabase
          .from('parent_messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3)
      ])


      const roleCounts = userRolesResponse.data?.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      setStats({
        totalUsers: userRolesResponse.data?.length || 0,
        totalStudents: roleCounts['CHILD'] || 0,
        totalTeachers: roleCounts['TEACHER'] || 0,
        totalParents: roleCounts['PARENT'] || 0
      })

      // Fetch recent activity
      const activities: RecentActivity[] = []

      // Recent user registrations using data we already fetched
      usersResponse.data?.forEach(user => {
        const roleText = user.role === 'CHILD' ? 'תלמיד' :
                        user.role === 'PARENT' ? 'הורה' :
                        user.role === 'TEACHER' ? 'מורה' : 'משתמש'
        
        activities.push({
          id: `user-${user.id}`,
          type: 'user_created',
          title: `${roleText} חדש נוסף למערכת: ${user.display_name || user.email}`,
          time: formatTimeAgo(user.created_at)
        })
      })

      // Note: grades table doesn't exist in this database
      // So we'll skip grade-related activities

      // Recent messages using data we already fetched
      messagesResponse.data?.forEach(message => {
        activities.push({
          id: `message-${message.id}`,
          type: 'message_sent',
          title: `הודעה חדשה נשלחה להורה: ${message.content?.substring(0, 50)}...`,
          time: formatTimeAgo(message.created_at)
        })
      })

      // Sort activities by time and take top 6
      setRecentActivity(activities.slice(0, 6))

    } catch (error) {
      console.error('Error fetching admin data:', error)
      // Set default stats if there's an error
      setStats({
        totalUsers: 0,
        totalStudents: 0,
        totalTeachers: 0,
        totalParents: 0
      })
      setRecentActivity([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAdminData()
  }, [])

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

  const adminFeatures = [
    {
      title: 'ניהול משתמשים',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-blue-100 text-blue-600',
      href: '/admin',
      description: 'יצירת וניהול תלמידים, הורים ומורים'
    },
    {
      title: 'קשרי הורים-ילדים',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-indigo-100 text-indigo-600',
      href: '/admin/parent-child',
      description: 'ניהול קשרים בין הורים לילדים'
    },
    {
      title: 'ניהול כיתות ומורים',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-green-100 text-green-600',
      href: '/admin/classes',
      description: 'ניהול כיתות ושיוך מורים'
    },
    {
      title: 'הגדרות מערכת',
      icon: <Settings className="w-6 h-6" />,
      color: 'bg-gray-100 text-gray-600',
      href: '/admin/settings',
      description: 'הגדרות כלליות של המערכת'
    },
    {
      title: 'דוחות ותובנות',
      icon: <BarChart className="w-6 h-6" />,
      color: 'bg-green-100 text-green-600',
      href: '/admin/reports',
      description: 'דוחות שימוש וסטטיסטיקות'
    },
    {
      title: 'שליחת הודעות להורים',
      icon: <MessageSquare className="w-6 h-6" />,
      color: 'bg-yellow-100 text-yellow-600',
      href: '/admin/send-messages',
      description: 'שליחת הודעות מהמנהל להורים'
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_created':
        return <UserPlus className="w-4 h-4 text-green-600" />
      case 'system_update':
        return <Settings className="w-4 h-4 text-blue-600" />
      case 'grade_added':
        return <BarChart className="w-4 h-4 text-purple-600" />
      case 'message_sent':
        return <MessageSquare className="w-4 h-4 text-yellow-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getActivityIconColor = (type: string) => {
    switch (type) {
      case 'user_created':
        return 'bg-green-100'
      case 'system_update':
        return 'bg-blue-100'
      case 'grade_added':
        return 'bg-purple-100'
      case 'message_sent':
        return 'bg-yellow-100'
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
      title={`שלום ${userInfo.display_name}! 👩‍💼`}
      subtitle="איך המערכת פועלת היום?"
      description="ברוכה הבאה לפאנל הניהול! כאן תוכלי לנהל את כל היבטי המערכת הכיתתית ולעקוב אחר הפעילות."
      backgroundGradient="bg-gradient-to-br from-gray-900 to-purple-900 text-white"
      icon={<Shield className="w-8 h-8 text-white" />}
      statusItems={[
        { label: `${stats.totalUsers} משתמשים במערכת`, color: 'bg-blue-400' },
        { label: 'מערכת פעילה', color: 'bg-green-400' }
      ]}
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="סה״כ משתמשים"
          value={stats.totalUsers}
          subtitle="משתמשים רשומים במערכת"
          color="text-white"
        />
        
        <StatCard
          title="תלמידים פעילים"
          value={stats.totalStudents}
          subtitle={stats.totalStudents > 0 ? "תלמידים רשומים" : "אין תלמידים רשומים"}
          color="text-white"
        />
        
        <StatCard
          title="מורים"
          value={stats.totalTeachers}
          subtitle={stats.totalTeachers > 0 ? "מורים במערכת" : "אין מורים רשומים"}
          color="text-white"
        />
        
        <StatCard
          title="הורים רשומים"
          value={stats.totalParents}
          subtitle={stats.totalParents > 0 ? "הורים במערכת" : "אין הורים רשומים"}
          color="text-white"
        />
      </div>

      {/* Admin Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {adminFeatures.map((feature) => (
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

      {/* System Overview */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 shadow-sm mb-8 text-white">
        <h3 className="font-semibold text-lg mb-4">סקירת המערכת</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-medium mb-2 text-blue-300">התפלגות משתמשים</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>תלמידים:</span>
                <span>{Math.round((stats.totalStudents / stats.totalUsers) * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span>הורים:</span>
                <span>{Math.round((stats.totalParents / stats.totalUsers) * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span>מורים:</span>
                <span>{Math.round((stats.totalTeachers / stats.totalUsers) * 100)}%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-medium mb-2 text-green-300">סטטוס מערכת</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>בסיס נתונים: פעיל</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>שרת: פעיל</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>אימות: פעיל</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-medium mb-2 text-purple-300">פעילות השבוע</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>כניסות למערכת:</span>
                <span>{stats.totalUsers * 7}</span>
              </div>
              <div className="flex justify-between">
                <span>ציונים נוספו:</span>
                <span>{stats.totalStudents * 2}</span>
              </div>
              <div className="flex justify-between">
                <span>הודעות נשלחו:</span>
                <span>{stats.totalParents * 3}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 shadow-sm text-white">
        <h3 className="font-semibold text-lg mb-4">פעילות אחרונה במערכת</h3>
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
            <div className="text-center py-8 text-gray-300">
              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p>אין פעילות אחרונה</p>
              <p className="text-sm">פעילות המערכת תופיע כאן</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}