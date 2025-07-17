'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Copy, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

import UserStatsCards from './UserStatsCards'
import UsersList from './UsersList'
import EditUserModal from './EditUserModal'
import { useAdminPanel } from './hooks/useAdminPanel'
import { usePasswordManager } from './hooks/usePasswordManager'

export default function AdminPanel() {
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    display_name: '',
    role: 'child',
    parent_email: ''
  })
  const [copiedPassword, setCopiedPassword] = useState(false)

  const {
    users,
    stats,
    isLoading,
    message,
    showUsers,
    generatedPassword,
    editingUser,
    fetchUsers,
    setShowUsers,
    setGeneratedPassword,
    setEditingUser,
    handleCreateUser,
    handleEditUser,
    handleDeleteUser
  } = useAdminPanel()

  const {
    passwordConfirmDialog,
    handlePasswordConfirmation,
    handleResetPassword
  } = usePasswordManager(users, fetchUsers, setGeneratedPassword)

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleCreateUser(newUser)
    setNewUser({
      email: '',
      username: '',
      display_name: '',
      role: 'child',
      parent_email: ''
    })
  }


  const copyPasswordToClipboard = async (password: string) => {
    try {
      await navigator.clipboard.writeText(password)
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
    } catch (error) {
      console.error('Failed to copy password:', error)
    }
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">פאנל ניהול</h1>
        </div>
        
        <div className="grid gap-8">
          {/* Create User Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">יצירת משתמש חדש</h2>
            
            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
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
                  <Label htmlFor="username">שם משתמש</Label>
                  <Input
                    id="username"
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="display_name">שם תצוגה</Label>
                  <Input
                    id="display_name"
                    type="text"
                    value={newUser.display_name}
                    onChange={(e) => setNewUser({...newUser, display_name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="role">תפקיד</Label>
                  <select
                    id="role"
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="child">תלמיד</option>
                    <option value="parent">הורה</option>
                    <option value="teacher">מורה</option>
                  </select>
                </div>
                
                {newUser.role === 'child' && (
                  <div className="md:col-span-2">
                    <Label htmlFor="parent_email">אימייל הורה (אופציונלי)</Label>
                    <Input
                      id="parent_email"
                      type="email"
                      value={newUser.parent_email}
                      onChange={(e) => setNewUser({...newUser, parent_email: e.target.value})}
                      placeholder="לחיבור אוטומטי להורה קיים"
                    />
                  </div>
                )}
              </div>
              
              {message && (
                <div className={`p-3 rounded-md ${
                  message.includes('שגיאה') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {message}
                </div>
              )}
              
              {generatedPassword && (
                <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-green-800 text-lg flex items-center gap-2">
                      ✅ סיסמה נוצרה בהצלחה
                    </h4>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setGeneratedPassword(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-lg border-2 border-dashed border-green-300">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="font-mono text-xl text-center p-2 bg-gray-50 rounded border">
                            {generatedPassword.password}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyPasswordToClipboard(generatedPassword.password)}
                          className="flex items-center gap-1 whitespace-nowrap"
                        >
                          {copiedPassword ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          {copiedPassword ? 'הועתק!' : 'העתק'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'יוצר...' : 'צור משתמש'}
              </Button>
            </form>
          </Card>

          {/* Statistics */}
          <UserStatsCards stats={stats} />

          {/* User Management */}
          <UsersList
            users={users}
            showUsers={showUsers}
            onToggleView={() => setShowUsers(!showUsers)}
            onEditUser={setEditingUser}
            onResetPassword={handleResetPassword}
            onDeleteUser={handleDeleteUser}
          />
        </div>
        
        {/* Edit User Modal */}
        {editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSave={handleEditUser}
            isLoading={isLoading}
          />
        )}
        

        {/* Password Confirmation Dialog */}
        <Dialog open={passwordConfirmDialog.isOpen} onOpenChange={() => handlePasswordConfirmation(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-right">🔐 אישור איפוס סיסמה</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-2">
                  האם אתה בטוח שברצונך לאפס את הסיסמה עבור:
                </p>
                <p className="font-semibold text-lg">{passwordConfirmDialog.userName}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-sm text-gray-600 mb-2 text-right">הסיסמה החדשה תהיה:</p>
                <div className="flex items-center gap-2 bg-white p-3 rounded border">
                  <span className="font-mono text-lg flex-1 text-right">{passwordConfirmDialog.password}</span>
                </div>
              </div>
            </div>
            
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => handlePasswordConfirmation(false)}
              >
                ביטול
              </Button>
              <Button 
                onClick={() => handlePasswordConfirmation(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                אישור איפוס
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}