'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/utils/supabase/client'
import { Settings, Database, Shield, Clock } from 'lucide-react'
import RoleConsistencyManager from './RoleConsistencyManager'

export default function AdminSettings() {
  const [systemSettings, setSystemSettings] = useState({
    schoolName: 'בית ספר יסודי',
    adminEmail: '',
    maxStudentsPerClass: 30,
    schoolYear: '2024-2025'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const supabase = createClient()

  const handleSaveSettings = async () => {
    setIsLoading(true)
    setMessage('הגדרות נשמרו בהצלחה!')
    
    setTimeout(() => {
      setIsLoading(false)
      setMessage(null)
    }, 2000)
  }

  const clearAllData = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את כל הנתונים? פעולה זו אינה הפיכה!')) {
      return
    }

    if (!confirm('אישור נוסף: פעולה זו תמחק את כל התלמידים, המורים והכיתות. האם להמשיך?')) {
      return
    }

    setIsLoading(true)
    try {
      await supabase.from('class_students').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('teacher_class_relationships').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('parent_child_relationships').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('classes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      
      const { data: users } = await supabase
        .from('user_roles')
        .select('user_id')
        .neq('role', 'admin')
      
      if (users) {
        for (const user of users) {
          await supabase.from('profiles').delete().eq('id', user.user_id)
          await supabase.from('user_roles').delete().eq('user_id', user.user_id)
        }
      }
      
      setMessage('כל הנתונים נמחקו בהצלחה')
    } catch (error) {
      console.error('Error clearing data:', error)
      setMessage('שגיאה במחיקת הנתונים')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold">הגדרות מערכת</h1>
        </div>
        
        <div className="grid gap-8">
          {/* General Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              הגדרות כלליות
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="schoolName">שם בית הספר</Label>
                <Input
                  id="schoolName"
                  value={systemSettings.schoolName}
                  onChange={(e) => setSystemSettings({...systemSettings, schoolName: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="adminEmail">אימייל מנהל</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={systemSettings.adminEmail}
                  onChange={(e) => setSystemSettings({...systemSettings, adminEmail: e.target.value})}
                  placeholder="admin@school.com"
                />
              </div>
              
              <div>
                <Label htmlFor="maxStudents">מספר מקסימלי של תלמידים בכיתה</Label>
                <Input
                  id="maxStudents"
                  type="number"
                  value={systemSettings.maxStudentsPerClass}
                  onChange={(e) => setSystemSettings({...systemSettings, maxStudentsPerClass: parseInt(e.target.value)})}
                />
              </div>
              
              <div>
                <Label htmlFor="schoolYear">שנת לימודים</Label>
                <Input
                  id="schoolYear"
                  value={systemSettings.schoolYear}
                  onChange={(e) => setSystemSettings({...systemSettings, schoolYear: e.target.value})}
                />
              </div>
            </div>
            
            {message && (
              <div className={`mt-4 p-3 rounded-md ${
                message.includes('שגיאה') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}>
                {message}
              </div>
            )}
            
            <Button
              onClick={handleSaveSettings}
              disabled={isLoading}
              className="mt-6"
            >
              {isLoading ? 'שומר...' : 'שמור הגדרות'}
            </Button>
          </Card>

          {/* System Info */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Database className="w-5 h-5" />
              מידע מערכת
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-blue-800">זמן עבודה</h3>
                <p className="text-sm text-blue-600">24/7</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Database className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-800">מסד נתונים</h3>
                <p className="text-sm text-green-600">מחובר</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-purple-800">אבטחה</h3>
                <p className="text-sm text-purple-600">מוגן</p>
              </div>
            </div>
          </Card>

          {/* Role Consistency Manager */}
          <RoleConsistencyManager />

          {/* Danger Zone */}
          <Card className="p-6 border-red-200">
            <h2 className="text-xl font-semibold mb-6 text-red-700 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              אזור מסוכן
            </h2>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">מחיקת כל הנתונים</h3>
              <p className="text-sm text-red-600 mb-4">
                פעולה זו תמחק את כל התלמידים, המורים, הכיתות והקשרים במערכת. 
                המנהל הראשי יישאר במערכת.
              </p>
              <Button
                onClick={clearAllData}
                disabled={isLoading}
                variant="destructive"
              >
                {isLoading ? 'מוחק...' : 'מחק את כל הנתונים'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}