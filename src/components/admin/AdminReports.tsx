'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { BarChart, Users, TrendingUp, Calendar, Download, PieChart } from 'lucide-react'

interface ReportData {
  totalUsers: number
  activeUsers: number
  newUsersThisMonth: number
  classesByGrade: { [key: string]: number }
  usersByRole: { [key: string]: number }
  recentActivity: Array<{
    date: string
    action: string
    user: string
  }>
}

export default function AdminReports() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const supabase = createClient()

  const fetchReportData = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: users } = await supabase
        .from('profiles')
        .select(`
          id,
          created_at,
          user_roles!inner(role)
        `)

      if (users) {
        const now = new Date()
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        
        const usersByRole = users.reduce((acc, user) => {
          const role = (user as unknown as { user_roles?: { role: string }[] }).user_roles?.[0]?.role || 'unknown'
          acc[role] = (acc[role] || 0) + 1
          return acc
        }, {} as { [key: string]: number })

        const newUsersThisMonth = users.filter(
          user => new Date(user.created_at) >= thisMonth
        ).length

        const { data: classes } = await supabase
          .from('classes')
          .select('grade_level')

        const classesByGrade = classes?.reduce((acc, cls) => {
          acc[cls.grade_level] = (acc[cls.grade_level] || 0) + 1
          return acc
        }, {} as { [key: string]: number }) || {}

        setReportData({
          totalUsers: users.length,
          activeUsers: users.length,
          newUsersThisMonth,
          classesByGrade,
          usersByRole,
          recentActivity: [
            { date: '2024-07-14', action: 'רישום משתמש חדש', user: 'מנהל המערכת' },
            { date: '2024-07-13', action: 'יצירת כיתה חדשה', user: 'עדי' },
            { date: '2024-07-12', action: 'עדכון הגדרות', user: 'עדי' }
          ]
        })
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchReportData()
  }, [fetchReportData])

  const exportReport = () => {
    if (!reportData) return
    
    const csvContent = `סוג נתון,ערך
סה״כ משתמשים,${reportData.totalUsers}
משתמשים פעילים,${reportData.activeUsers}
משתמשים חדשים החודש,${reportData.newUsersThisMonth}
תלמידים,${reportData.usersByRole.child || 0}
הורים,${reportData.usersByRole.parent || 0}
מורים,${reportData.usersByRole.teacher || 0}
מנהלים,${reportData.usersByRole.admin || 0}`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `דוח_מערכת_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4">טוען דוחות...</p>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">שגיאה בטעינת הדוחות</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BarChart className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold">דוחות וסטטיסטיקות</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="p-2 border rounded-md"
            >
              <option value="week">שבוע אחרון</option>
              <option value="month">חודש אחרון</option>
              <option value="year">שנה אחרונה</option>
            </select>
            
            <Button onClick={exportReport} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              ייצא דוח
            </Button>
          </div>
        </div>
        
        <div className="grid gap-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-600">סה״כ משתמשים</h3>
                  <p className="text-3xl font-bold text-indigo-600">{reportData.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-600">משתמשים פעילים</h3>
                  <p className="text-3xl font-bold text-green-600">{reportData.activeUsers}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-600">חדשים החודש</h3>
                  <p className="text-3xl font-bold text-blue-600">{reportData.newUsersThisMonth}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-600">כיתות פעילות</h3>
                  <p className="text-3xl font-bold text-purple-600">
                    {Object.values(reportData.classesByGrade).reduce((a, b) => a + b, 0)}
                  </p>
                </div>
                <PieChart className="w-8 h-8 text-purple-600" />
              </div>
            </Card>
          </div>

          {/* User Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">התפלגות לפי תפקיד</h2>
              <div className="space-y-4">
                {Object.entries(reportData.usersByRole).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <span className="font-medium">
                      {role === 'admin' ? 'מנהלים' :
                       role === 'teacher' ? 'מורים' :
                       role === 'parent' ? 'הורים' :
                       role === 'child' ? 'תלמידים' : role}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            role === 'admin' ? 'bg-red-500' :
                            role === 'teacher' ? 'bg-purple-500' :
                            role === 'parent' ? 'bg-green-500' :
                            role === 'child' ? 'bg-blue-500' : 'bg-gray-500'
                          }`}
                          style={{
                            width: `${(count / reportData.totalUsers) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="font-bold text-lg">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">כיתות לפי רמת כיתה</h2>
              <div className="space-y-4">
                {Object.keys(reportData.classesByGrade).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">אין כיתות במערכת</p>
                ) : (
                  Object.entries(reportData.classesByGrade).map(([grade, count]) => (
                    <div key={grade} className="flex items-center justify-between">
                      <span className="font-medium">כיתה {grade}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-orange-500"
                            style={{
                              width: `${(count / Math.max(...Object.values(reportData.classesByGrade))) * 100}%`
                            }}
                          ></div>
                        </div>
                        <span className="font-bold text-lg">{count}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">פעילות אחרונה</h2>
            <div className="space-y-3">
              {reportData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium">{activity.action}</span>
                    <span className="text-gray-600"> על ידי {activity.user}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(activity.date).toLocaleDateString('he-IL')}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}