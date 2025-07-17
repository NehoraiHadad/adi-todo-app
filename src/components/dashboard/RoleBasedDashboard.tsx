'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import AdminDashboard from './AdminDashboard'
import ParentDashboard from './ParentDashboard'
import TeacherDashboard from './TeacherDashboard'

interface UserInfo {
  id: string
  email: string
  display_name: string
  role: string
}

export default function RoleBasedDashboard() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          window.location.href = '/login'
          return
        }

        // Get user profile directly
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          // If no profile found, redirect to login
          window.location.href = '/login'
          return
        }

        // Get user role
        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single()

        if (roleError) {
          console.error('Error fetching user role:', roleError)
          // If no role found, redirect to login
          window.location.href = '/login'
          return
        }

        if (profile && userRole) {
          setUserInfo({
            id: user.id,
            email: profile.email || user.email || '',
            display_name: profile.display_name || 'משתמש',
            role: userRole.role
          })
        }
      } catch (error) {
        console.error('Error fetching user info:', error)
        // On any error, redirect to login
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserInfo()
  }, [])

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

  if (!userInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">שגיאה בטעינת הנתונים</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            נסה שוב
          </button>
        </div>
      </div>
    )
  }

  // Show different dashboards based on role
  if (userInfo.role === 'ADMIN' || userInfo.role === 'admin') {
    return <AdminDashboard userInfo={userInfo} />
  } else if (userInfo.role === 'CHILD' || userInfo.role === 'child') {
    // Redirect to the new home page for children
    window.location.href = '/home'
    return null
  } else if (userInfo.role === 'PARENT' || userInfo.role === 'parent') {
    return <ParentDashboard userInfo={userInfo} />
  } else if (userInfo.role === 'TEACHER' || userInfo.role === 'teacher') {
    return <TeacherDashboard userInfo={userInfo} />
  } else {
    return (
      <div className="text-center p-8">
        <p>סוג משתמש לא מזוהה: {userInfo.role}</p>
        <p className="text-sm text-gray-500 mt-2">
          אנא פנה למנהל המערכת לקביעת תפקיד מתאים.
        </p>
      </div>
    )
  }
}