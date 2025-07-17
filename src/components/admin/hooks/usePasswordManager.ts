import { useState } from 'react'

interface User {
  id: string
  email: string
  display_name: string
  username?: string
  role?: string
  user_role: string
  created_at: string
}

interface PasswordConfirmDialog {
  isOpen: boolean
  userName: string
  password: string
  resolve: ((confirmed: boolean) => void) | null
}

export function usePasswordManager(
  users: User[],
  fetchUsers: () => void,
  setGeneratedPassword: (password: {password: string, type: string} | null) => void
) {
  const [passwordConfirmDialog, setPasswordConfirmDialog] = useState<PasswordConfirmDialog>({
    isOpen: false,
    userName: '',
    password: '',
    resolve: null
  })
  const [copiedPassword, setCopiedPassword] = useState(false)

  const showPasswordConfirmation = (userName: string, password: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setPasswordConfirmDialog({
        isOpen: true,
        userName,
        password,
        resolve
      })
    })
  }

  const handlePasswordConfirmation = (confirmed: boolean) => {
    if (passwordConfirmDialog.resolve) {
      passwordConfirmDialog.resolve(confirmed)
    }
    setPasswordConfirmDialog({
      isOpen: false,
      userName: '',
      password: '',
      resolve: null
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

  const handleResetPassword = async (userId: string, displayName: string) => {
    const userToReset = users.find(u => u.id === userId)
    if (!userToReset) return

    let newPassword: string
    
    if (userToReset.user_role === 'child') {
      newPassword = `${userToReset.username || 'user'}123`
    } else {
      newPassword = 'Password123!'
    }

    const confirmed = await showPasswordConfirmation(displayName, newPassword)
    if (!confirmed) return

    try {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          new_password: newPassword
        })
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedPassword({
          password: newPassword,
          type: userToReset.user_role === 'child' ? 'child_friendly' : 'secure'
        })
      }
    } catch (error) {
      console.error('Error resetting password:', error)
    }
  }

  return {
    passwordConfirmDialog,
    copiedPassword,
    showPasswordConfirmation,
    handlePasswordConfirmation,
    copyPasswordToClipboard,
    handleResetPassword
  }
}