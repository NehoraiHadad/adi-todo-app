'use client'

import { useEffect } from 'react'
import UserStatsCards from './UserStatsCards'
import UsersList from './UsersList'
import PasswordConfirmationDialog from './PasswordConfirmationDialog'
import EditUserModal from './EditUserModal'
import { useAdminPanel } from './hooks/useAdminPanel'
import { usePasswordManager } from './hooks/usePasswordManager'
import CreateUserForm from './CreateUserForm'


export default function AdminPanel() {
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
    copiedPassword,
    handlePasswordConfirmation,
    copyPasswordToClipboard,
    handleResetPassword
  } = usePasswordManager(users, fetchUsers, setGeneratedPassword)

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">פאנל ניהול</h1>
          <p className="text-gray-600">ניהול משתמשים ומערכת</p>
        </div>

        <div className="space-y-6">
          <UserStatsCards stats={stats} />

          <CreateUserForm
            onCreateUser={handleCreateUser}
            isLoading={isLoading}
            message={message}
            generatedPassword={generatedPassword}
            onClosePassword={() => setGeneratedPassword(null)}
            copiedPassword={copiedPassword}
            onCopyPassword={copyPasswordToClipboard}
          />

          <UsersList
            users={users}
            showUsers={showUsers}
            onToggleView={() => setShowUsers(!showUsers)}
            onEditUser={setEditingUser}
            onResetPassword={handleResetPassword}
            onDeleteUser={handleDeleteUser}
          />
        </div>

        <PasswordConfirmationDialog
          isOpen={passwordConfirmDialog.isOpen}
          userName={passwordConfirmDialog.userName}
          password={passwordConfirmDialog.password}
          copiedPassword={copiedPassword}
          onCopyPassword={copyPasswordToClipboard}
          onConfirm={handlePasswordConfirmation}
        />

        {editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSave={handleEditUser}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  )
}