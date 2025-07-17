'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { UserRole } from '@/types'

/**
 * Role selector component for user authentication
 * Allows users to choose between child, parent, and teacher roles
 */
interface RoleSelectorProps {
  /** Callback function called when a role is selected */
  onRoleSelect: (role: UserRole) => void
}

export default function RoleSelector({ onRoleSelect }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  /**
   * Available user roles with their display information
   */
  const roles = [
    {
      id: UserRole.CHILD,
      title: 'תלמיד',
      icon: '🎒',
      description: 'אני תלמיד/ה בכיתה',
      color: 'bg-blue-100 hover:bg-blue-200 border-blue-300'
    },
    {
      id: UserRole.PARENT,
      title: 'הורה',
      icon: '👨‍👩‍👧‍👦',
      description: 'אני הורה של תלמיד/ה',
      color: 'bg-green-100 hover:bg-green-200 border-green-300'
    },
    {
      id: UserRole.TEACHER,
      title: 'מורה',
      icon: '👨‍🏫',
      description: 'אני מורה בבית הספר',
      color: 'bg-purple-100 hover:bg-purple-200 border-purple-300'
    },
    {
      id: UserRole.ADMIN,
      title: 'מנהל מערכת',
      icon: '👑',
      description: 'אני מנהל המערכת',
      color: 'bg-red-100 hover:bg-red-200 border-red-300'
    }
  ]

  /**
   * Handles role selection and notifies parent component
   * @param role - The selected user role
   */
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    onRoleSelect(role)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-center mb-6">בחרו את סוג המשתמש שלכם</h2>
      <div className="grid gap-4">
        {roles.map((role) => (
          <Card
            key={role.id}
            className={`p-6 cursor-pointer transition-all ${role.color} border-2 ${
              selectedRole === role.id ? 'ring-2 ring-offset-2' : ''
            }`}
            onClick={() => handleRoleSelect(role.id)}
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">{role.icon}</span>
              <div className="flex-1 text-right">
                <h3 className="font-semibold text-lg">{role.title}</h3>
                <p className="text-sm text-gray-600">{role.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}