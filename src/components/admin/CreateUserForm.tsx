'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { UserPlus } from 'lucide-react'
import GeneratedPasswordDisplay from './GeneratedPasswordDisplay'
import { createClient } from '@/utils/supabase/client'

interface Class {
  id: string
  name: string
  grade: string
  is_active: boolean
}

interface CreateUserFormProps {
  onCreateUser: (userData: {
    email: string;
    display_name: string;
    username: string;
    role: string;
    parent_email: string;
    class_id?: string;
  }) => void
  isLoading: boolean
  message: string | null
  generatedPassword: {password: string, type: string} | null
  onClosePassword: () => void
  copiedPassword: boolean
  onCopyPassword: (password: string) => void
}

export default function CreateUserForm({
  onCreateUser,
  isLoading,
  message,
  generatedPassword,
  onClosePassword,
  copiedPassword,
  onCopyPassword
}: CreateUserFormProps) {
  const [newUser, setNewUser] = useState({
    email: '',
    display_name: '',
    username: '',
    role: 'child',
    parent_email: '',
    class_id: ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onCreateUser(newUser)
    
    // Reset form on success
    setNewUser({
      email: '',
      display_name: '',
      username: '',
      role: 'child',
      parent_email: '',
      class_id: ''
    })
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <UserPlus className="w-5 h-5" />
        יצירת משתמש חדש
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="display_name">שם מלא</Label>
            <Input
              id="display_name"
              value={newUser.display_name}
              onChange={(e) => setNewUser({...newUser, display_name: e.target.value})}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="username">שם משתמש</Label>
            <Input
              id="username"
              value={newUser.username}
              onChange={(e) => setNewUser({...newUser, username: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="role">תפקיד</Label>
            <select
              id="role"
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              className="w-full p-2 border rounded-md"
            >
              <option value="child">תלמיד</option>
              <option value="parent">הורה</option>
              <option value="teacher">מורה</option>
              <option value="admin">מנהל</option>
            </select>
          </div>
          
          {newUser.role === 'child' && (
            <div className="md:col-span-2">
              <Label htmlFor="parent_email">אימייל הורה</Label>
              <Input
                id="parent_email"
                type="email"
                value={newUser.parent_email}
                onChange={(e) => setNewUser({...newUser, parent_email: e.target.value})}
                placeholder="אופציונלי"
              />
            </div>
          )}
          
          {(newUser.role === 'child' || newUser.role === 'teacher') && (
            <div>
              <Label htmlFor="class_id">כיתה</Label>
              <select
                id="class_id"
                value={newUser.class_id}
                onChange={(e) => setNewUser({...newUser, class_id: e.target.value})}
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
        </div>

        {message && (
          <div className={`p-3 rounded-md ${
            message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {generatedPassword && (
          <GeneratedPasswordDisplay
            password={generatedPassword.password}
            type={generatedPassword.type}
            copiedPassword={copiedPassword}
            onCopyPassword={onCopyPassword}
            onClose={onClosePassword}
          />
        )}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'יוצר...' : 'צור משתמש'}
        </Button>
      </form>
    </Card>
  )
}