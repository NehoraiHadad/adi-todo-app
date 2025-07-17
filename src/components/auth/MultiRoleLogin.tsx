'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import RoleSelector from './RoleSelector'
import { UserRole } from '@/types'
import ChildLoginForm from './ChildLoginForm'
import AdultLoginForm from './AdultLoginForm'
import { ChevronRight } from 'lucide-react'

export default function MultiRoleLogin() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [hasAdminUsers, setHasAdminUsers] = useState<boolean>(true) // Default to true to hide link until checked

  const handleBack = () => {
    setSelectedRole(null)
  }

  // Check if there are admin users in the system
  useEffect(() => {
    const checkAdminUsers = async () => {
      try {
        // Use a simple API call to check if admin users exist
        const response = await fetch('/api/admin/check-setup', {
          method: 'GET',
          cache: 'no-store'
        })
        
        if (response.ok) {
          const data = await response.json()
          setHasAdminUsers(data.hasAdminUsers)
        }
      } catch (error) {
        console.error('Error checking admin users:', error)
        // On error, assume admin users exist (safer default)
        setHasAdminUsers(true)
      }
    }

    checkAdminUsers()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-purple-200 rounded-full opacity-20 animate-pulse delay-700"></div>
        <div className="absolute top-1/2 right-10 w-16 h-16 bg-pink-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
      </div>
      
      <Card className="w-full max-w-md p-8 backdrop-blur-sm bg-white/80 shadow-2xl border-0">
        {!selectedRole ? (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎓</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">ברוכים הבאים!</h1>
              <p className="text-gray-600">למערכת הניהול הכיתתית החכמה</p>
              <p className="text-sm text-gray-500 mt-1">בחרו את סוג המשתמש שלכם</p>
            </div>
            <RoleSelector onRoleSelect={setSelectedRole} />
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mb-4 -ml-2 text-gray-600 hover:text-gray-800"
            >
              <ChevronRight className="w-4 h-4 ml-1" />
              חזרה
            </Button>
            
            {selectedRole === UserRole.CHILD ? (
              <ChildLoginForm />
            ) : (
              <AdultLoginForm role={selectedRole} />
            )}
            
            {!hasAdminUsers && (
              <div className="mt-6 text-center">
                <div className="border-t pt-4">
                  <a 
                    href="/admin-setup" 
                    className="text-xs text-gray-500 hover:text-purple-600 transition-colors flex items-center justify-center gap-1"
                  >
                    <span>🔑</span>
                    הגדרה ראשונית למנהל מערכת
                  </a>
                  <p className="text-xs text-gray-400 mt-1">
                    זמין רק אם אין מנהל במערכת
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
      
      {/* Footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-xs text-gray-500">
        <p>מערכת ניהול כיתתית חכמה | פותח על ידי עדי 💜</p>
        <p className="mt-1">גרסה 1.0 | 2024 ©</p>
      </div>
    </div>
  )
}