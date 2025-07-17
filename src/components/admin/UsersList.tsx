'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Users, Edit2, Key, Trash2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface User {
  id: string
  email: string
  display_name: string
  username?: string
  role?: string
  user_role: string
  class_id?: string
  created_at: string
}

interface Class {
  id: string
  name: string
  grade: string
}

interface UsersListProps {
  users: User[]
  showUsers: boolean
  onToggleView: () => void
  onEditUser: (user: User) => void
  onResetPassword: (userId: string, displayName: string) => void
  onDeleteUser: (userId: string, displayName: string) => void
}

export default function UsersList({
  users,
  showUsers,
  onToggleView,
  onEditUser,
  onResetPassword,
  onDeleteUser
}: UsersListProps) {
  const [classes, setClasses] = useState<Class[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('id, name, grade')
          .eq('is_active', true)
          .order('name')
        
        if (error) throw error
        setClasses(data || [])
      } catch (error) {
        console.error('Error fetching classes:', error)
      }
    }
    
    fetchClasses()
  }, [supabase])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'child': return 'bg-green-100 text-green-800'
      case 'parent': return 'bg-orange-100 text-orange-800'
      case 'teacher': return 'bg-purple-100 text-purple-800'
      case 'admin': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'child': return 'תלמיד'
      case 'parent': return 'הורה'
      case 'teacher': return 'מורה'
      case 'admin': return 'מנהל'
      default: return role
    }
  }

  const getClassName = (classId: string) => {
    const classData = classes.find(c => c.id === classId)
    return classData ? `${classData.name} (רמה ${classData.grade})` : 'ללא כיתה'
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          רשימת משתמשים
        </h2>
        <Button
          onClick={onToggleView}
          variant="outline"
          className="flex items-center gap-2"
        >
          {showUsers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showUsers ? 'הסתר' : 'הצג'}
        </Button>
      </div>

      {showUsers && (
        <div className="space-y-3">
          {users.length === 0 ? (
            <p className="text-gray-500 text-center py-8">אין משתמשים במערכת</p>
          ) : (
            users.map((user) => (
              <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{user.display_name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(user.user_role)}`}>
                        {getRoleText(user.user_role)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{user.email}</p>
                    {user.username && (
                      <p className="text-sm text-gray-500">שם משתמש: {user.username}</p>
                    )}
                    {user.class_id && (user.user_role === 'child' || user.user_role === 'teacher') && (
                      <p className="text-sm text-blue-600">כיתה: {getClassName(user.class_id)}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => onEditUser(user)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Edit2 className="w-4 h-4" />
                      עריכה
                    </Button>
                    <Button
                      onClick={() => onResetPassword(user.id, user.display_name)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Key className="w-4 h-4" />
                      איפוס סיסמה
                    </Button>
                    <Button
                      onClick={() => onDeleteUser(user.id, user.display_name)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      מחיקה
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  )
}