'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'

interface CreateAdminModalProps {
  onClose: () => void
  onCreateAdmin: (data: AdminCreationData) => void
  isLoading: boolean
}

interface AdminCreationData {
  email: string
  display_name: string
  username: string
  admin_password: string
}

export default function CreateAdminModal({ onClose, onCreateAdmin, isLoading }: CreateAdminModalProps) {
  const [adminCreationData, setAdminCreationData] = useState<AdminCreationData>({
    email: '',
    display_name: '',
    username: '',
    admin_password: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateAdmin(adminCreationData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-red-600">🔐 יצירת מנהל מערכת</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-red-800 text-sm">
            ⚠️ פעולה זו יוצרת מנהל מערכת עם הרשאות מלאות. נדרשת אישור סיסמת המנהל הנוכחי.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="admin-email">אימייל מנהל חדש</Label>
            <Input
              id="admin-email"
              type="email"
              value={adminCreationData.email}
              onChange={(e) => setAdminCreationData({...adminCreationData, email: e.target.value})}
              required
              placeholder="admin@example.com"
            />
          </div>
          
          <div>
            <Label htmlFor="admin-display-name">שם תצוגה</Label>
            <Input
              id="admin-display-name"
              type="text"
              value={adminCreationData.display_name}
              onChange={(e) => setAdminCreationData({...adminCreationData, display_name: e.target.value})}
              required
              placeholder="שם המנהל החדש"
            />
          </div>
          
          <div>
            <Label htmlFor="admin-username">שם משתמש</Label>
            <Input
              id="admin-username"
              type="text"
              value={adminCreationData.username}
              onChange={(e) => setAdminCreationData({...adminCreationData, username: e.target.value})}
              required
              placeholder="admin_username"
            />
          </div>
          
          <div>
            <Label htmlFor="admin-confirm-password">הזן את הסיסמה שלך לאישור</Label>
            <Input
              id="admin-confirm-password"
              type="password"
              value={adminCreationData.admin_password}
              onChange={(e) => setAdminCreationData({...adminCreationData, admin_password: e.target.value})}
              required
              placeholder="הסיסמה שלך כמנהל נוכחי"
            />
            <p className="text-sm text-gray-500 mt-1">
              נדרש לאישור זהות לפני יצירת מנהל חדש
            </p>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="bg-red-600 hover:bg-red-700">
              {isLoading ? 'יוצר מנהל...' : 'צור מנהל מערכת'}
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

export type { AdminCreationData }