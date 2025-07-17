'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface Class {
  id: string
  name: string
  grade: string
  is_active: boolean
}

interface User {
  id: string
  email: string
  display_name: string
  username?: string
  user_role: string
  created_at: string
  class_id?: string
}

interface EditUserModalProps {
  user: User
  onClose: () => void
  onSave: (data: EditUserData) => void
  isLoading: boolean
}

interface EditUserData {
  user_id: string
  email: string
  display_name: string
  username: string
  role: string
  class_id?: string
}

export default function EditUserModal({ user, onClose, onSave, isLoading }: EditUserModalProps) {
  const [editData, setEditData] = useState<EditUserData>({
    user_id: user.id,
    email: user.email,
    display_name: user.display_name,
    username: user.username || '',
    role: user.user_role,
    class_id: user.class_id || ''
  })
  const [classes, setClasses] = useState<Class[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('id, name, grade, is_active')
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(editData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">עריכת משתמש</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-email">אימייל</Label>
            <Input
              id="edit-email"
              type="email"
              value={editData.email}
              onChange={(e) => setEditData({...editData, email: e.target.value})}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="edit-display-name">שם תצוגה</Label>
            <Input
              id="edit-display-name"
              type="text"
              value={editData.display_name}
              onChange={(e) => setEditData({...editData, display_name: e.target.value})}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="edit-username">שם משתמש</Label>
            <Input
              id="edit-username"
              type="text"
              value={editData.username}
              onChange={(e) => setEditData({...editData, username: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="edit-role">תפקיד</Label>
            <select
              id="edit-role"
              value={editData.role}
              onChange={(e) => setEditData({...editData, role: e.target.value})}
              className="w-full p-2 border rounded-md"
              required
              disabled={user.user_role === 'admin'}
            >
              <option value="child">תלמיד</option>
              <option value="parent">הורה</option>
              <option value="teacher">מורה</option>
              {user.user_role === 'admin' && <option value="admin">מנהל</option>}
            </select>
            {user.user_role === 'admin' && (
              <p className="text-sm text-gray-500 mt-1">לא ניתן לשנות תפקיד מנהל</p>
            )}
          </div>
          
          {(editData.role === 'child' || editData.role === 'teacher') && (
            <div>
              <Label htmlFor="edit-class-id">כיתה</Label>
              <select
                id="edit-class-id"
                value={editData.class_id}
                onChange={(e) => setEditData({...editData, class_id: e.target.value})}
                className="w-full p-2 border rounded-md"
              >
                <option value="">-- בחר כיתה --</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} (רמה {cls.grade})
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'שומר...' : 'שמור'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export type { User, EditUserData }